import { MESSAGE_METADATA_KEY, jsonValuesEqual } from "./shared";

type Metadata = Record<string, unknown>;
type Message = {
  id: string;
  content: string;
  swipe_id?: number;
  swipes?: string[];
  swipe_dates?: number[];
  metadata?: Metadata;
};

export type CollapsedSwipe = {
  chatId: string;
  messageId: string;
  previousSwipeId: number;
  content: string;
  date: number | null;
  trackerStore: Metadata;
};

function record(value: unknown): Metadata | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Metadata : null;
}

/** SWIPE_EDITED may carry either the public DTO or the host's raw message. */
export function getCollapsedSwipe(payload: unknown): CollapsedSwipe | null {
  const event = record(payload);
  const message = record(event?.message);
  const previousSwipeId = event?.previousSwipeId;
  if (
    typeof event?.chatId !== "string" || !event.chatId
    || typeof message?.id !== "string" || !message.id
    || !Number.isSafeInteger(previousSwipeId) || (previousSwipeId as number) < 0
    || message.swipe_id !== 0
    || !Array.isArray(message.swipes) || message.swipes.length !== 1
    || typeof message.swipes[0] !== "string"
  ) return null;

  const metadata = record(message.metadata) ?? record(record(message.extra)?.spindle_metadata);
  const trackerStore = record(metadata?.[MESSAGE_METADATA_KEY]);
  if (!trackerStore) return null;
  // Already aligned messages need neither a history read nor a state refresh.
  if (!remapCollapsedSwipeMetadata(metadata!, previousSwipeId as number)) return null;
  const date = Array.isArray(message.swipe_dates) ? message.swipe_dates[0] : null;
  return {
    chatId: event.chatId,
    messageId: message.id,
    previousSwipeId: previousSwipeId as number,
    content: message.swipes[0],
    date: typeof date === "number" && Number.isFinite(date) ? date : null,
    trackerStore: structuredClone(trackerStore),
  };
}

/** Keep exactly the retained swipe's tracker, moving its slot to zero. */
export function remapCollapsedSwipeMetadata(metadata: Metadata, previousSwipeId: number): Metadata | null {
  if (!Number.isSafeInteger(previousSwipeId) || previousSwipeId < 0) return null;
  const store = record(metadata[MESSAGE_METADATA_KEY]);
  if (!store) return null;
  const next = { ...metadata };
  const swipes = record(store.swipes);
  if (swipes) {
    const retained = record(swipes[String(previousSwipeId)]);
    if (retained && "value" in retained) {
      // Preserve the tracker timestamp, preset and schema provenance verbatim.
      const { value: _value, swipeId: _swipeId, ...rest } = store;
      next[MESSAGE_METADATA_KEY] = { ...rest, swipes: { 0: retained } };
    } else {
      // Slot zero may belong to a discarded alternate. Never display it as the
      // surviving story's tracker when that story had no tracker of its own.
      delete next[MESSAGE_METADATA_KEY];
    }
  } else if ("value" in store) {
    if (typeof store.swipeId !== "number" || store.swipeId === previousSwipeId) {
      next[MESSAGE_METADATA_KEY] = { ...store, swipeId: 0 };
    } else {
      delete next[MESSAGE_METADATA_KEY];
    }
  } else {
    return null;
  }
  return jsonValuesEqual(metadata, next) ? null : next;
}

export type SwipeTrackerRepairApi = {
  getMessages(chatId: string): Promise<Message[]>;
  updateMessage(chatId: string, messageId: string, patch: { metadata: Metadata }): Promise<void>;
};

/** Re-read before writing: unrelated metadata can change while a scrub runs. */
export async function repairCollapsedSwipeTracker(
  collapse: CollapsedSwipe,
  api: SwipeTrackerRepairApi,
): Promise<boolean> {
  const messages = await api.getMessages(collapse.chatId);
  const current = messages.find((message) => message.id === collapse.messageId);
  if (
    !current || current.swipe_id !== 0
    || current.swipes?.length !== 1 || current.swipes[0] !== collapse.content
    || (collapse.date !== null && current.swipe_dates?.[0] !== collapse.date)
    // Do not overwrite a tracker edited, generated, deleted or already remapped
    // after this event. Other extensions' metadata is merged from this read.
    || !jsonValuesEqual(current.metadata?.[MESSAGE_METADATA_KEY], collapse.trackerStore)
  ) return false;
  const metadata = remapCollapsedSwipeMetadata(current.metadata ?? {}, collapse.previousSwipeId);
  if (!metadata) return false;
  await api.updateMessage(collapse.chatId, collapse.messageId, { metadata });
  return true;
}

/** A bulk scrub should read chat history once and produce one state refresh. */
export async function repairCollapsedSwipeTrackers(
  collapses: readonly CollapsedSwipe[],
  api: SwipeTrackerRepairApi,
): Promise<{ repaired: number; errors: unknown[] }> {
  if (collapses.length === 0) return { repaired: 0, errors: [] };
  const chatId = collapses[0].chatId;
  if (collapses.some((collapse) => collapse.chatId !== chatId)) {
    throw new Error("Tracker repairs must belong to the same chat.");
  }
  const messages = await api.getMessages(chatId);
  const batchApi: SwipeTrackerRepairApi = {
    getMessages: async () => messages,
    updateMessage: async (chatId, messageId, patch) => {
      await api.updateMessage(chatId, messageId, patch);
      const message = messages.find((item) => item.id === messageId);
      if (message) message.metadata = patch.metadata;
    },
  };
  let repaired = 0;
  const errors: unknown[] = [];
  for (const collapse of collapses) {
    try {
      if (await repairCollapsedSwipeTracker(collapse, batchApi)) repaired++;
    } catch (error) {
      errors.push(error);
    }
  }
  return { repaired, errors };
}
