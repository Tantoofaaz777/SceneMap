import { describe, expect, test } from "bun:test";
import { getCollapsedSwipe, remapCollapsedSwipeMetadata, repairCollapsedSwipeTracker, repairCollapsedSwipeTrackers } from "./swipe-tracker-remap";
import { KeyedAsyncQueue } from "./keyed-async-queue";

const first = { value: { location: "Discarded room" }, updatedAt: "first" };
const retained = {
  value: { location: "Continuing story", characters: ["Alice"] },
  updatedAt: "retained",
  presetKey: "my-preset",
  schemaHash: "my-schema",
};
const metadata = {
  otherExtension: { important: true },
  scenemap: { version: 3, updatedAt: "retained", swipes: { 0: first, 2: retained } },
};

function fixture(raw = false) {
  // This is the exact mutation shape used by SwipeScrubber's keepSwipeInMessage.
  const before = {
    id: "message-1", content: "Chosen swipe", swipe_id: 2,
    swipes: ["Discarded swipe", "Another discarded swipe", "Chosen swipe"],
    swipe_dates: [100, 200, 300], metadata: structuredClone(metadata),
  };
  const after = {
    ...before,
    swipes: [before.swipes[before.swipe_id]],
    swipe_dates: [before.swipe_dates[before.swipe_id]],
    swipe_id: 0,
  };
  const event = {
    chatId: "chat-1", previousSwipeId: before.swipe_id,
    message: raw
      ? { ...after, metadata: undefined, extra: { spindle_metadata: after.metadata } }
      : after,
  };
  const collapse = getCollapsedSwipe(event)!;
  return { after, event, collapse };
}

describe("tracker compatibility with SwipeScrubber", () => {
  test("moves the retained story's tracker to zero, preserving provenance and other extensions", () => {
    const result = remapCollapsedSwipeMetadata(metadata, 2);
    expect(result).toEqual({
      otherExtension: metadata.otherExtension,
      scenemap: { version: 3, updatedAt: "retained", swipes: { 0: retained } },
    });
    expect(metadata.scenemap.swipes[0]).toEqual(first);
    expect(metadata.scenemap.swipes[2]).toEqual(retained);
  });

  test("keeps tracker zero when it was the active swipe and discards alternate trackers", () => {
    expect(remapCollapsedSwipeMetadata(metadata, 0)?.scenemap).toEqual({
      version: 3, updatedAt: "retained", swipes: { 0: first },
    });
  });

  test("never substitutes a discarded swipe's tracker for an untracked survivor", () => {
    expect(remapCollapsedSwipeMetadata(metadata, 1)).toEqual({ otherExtension: metadata.otherExtension });
  });

  test("remaps legacy single-value trackers and preserves their fields", () => {
    const legacy = { value: retained.value, swipeId: 2, updatedAt: "old", presetKey: "old-preset" };
    expect(remapCollapsedSwipeMetadata({ scenemap: legacy }, 2)).toEqual({
      scenemap: { ...legacy, swipeId: 0 },
    });
    expect(remapCollapsedSwipeMetadata({ scenemap: legacy }, 1)).toEqual({});
  });

  test("supports legacy trackers without an explicit swipe index", () => {
    expect(remapCollapsedSwipeMetadata({ scenemap: { value: retained.value } }, 2)).toEqual({
      scenemap: { value: retained.value, swipeId: 0 },
    });
  });

  test("ignores normal multi-swipe changes and malformed events", () => {
    const { event } = fixture();
    for (const invalid of [
      null, {}, { ...event, previousSwipeId: undefined },
      { ...event, previousSwipeId: -1 }, { ...event, previousSwipeId: 0.5 },
      { ...event, message: { ...event.message, swipes: ["one", "two"] } },
      { ...event, message: { ...event.message, swipe_id: 1 } },
      { ...event, message: { ...event.message, swipes: [null] } },
    ]) expect(getCollapsedSwipe(invalid)).toBeNull();
  });

  test("avoids needless reads and writes for already aligned trackers", () => {
    const { event } = fixture();
    expect(getCollapsedSwipe({
      ...event, previousSwipeId: 0,
      message: { ...event.message, metadata: { scenemap: { swipes: { 0: retained } } } },
    })).toBeNull();
    expect(remapCollapsedSwipeMetadata({ scenemap: { swipes: { 0: retained } } }, 0)).toBeNull();
  });

  for (const raw of [false, true]) {
    test(`repairs a scrub through the ${raw ? "raw host event" : "public DTO"} and persists across reload`, async () => {
      const { after, collapse } = fixture(raw);
      const patches: unknown[] = [];
      expect(collapse).not.toBeNull();
      const repaired = await repairCollapsedSwipeTracker(collapse, {
        getMessages: async (chatId) => { expect(chatId).toBe("chat-1"); return [after]; },
        updateMessage: async (chatId, messageId, patch) => {
          expect([chatId, messageId]).toEqual(["chat-1", "message-1"]);
          patches.push(patch);
          after.metadata = patch.metadata as typeof after.metadata;
        },
      });
      expect(repaired).toBe(true);
      expect(patches).toHaveLength(1);
      expect(JSON.parse(JSON.stringify(after.metadata)).scenemap.swipes).toEqual({ 0: retained });
      expect(after.swipes).toEqual(["Chosen swipe"]);
      expect(after.swipe_dates).toEqual([300]);
      expect(after.swipe_id).toBe(0);
    });
  }

  test("merges other extensions' changes from the fresh read", async () => {
    const { after, collapse } = fixture();
    after.metadata.otherExtension = { important: false };
    let patch: unknown;
    await repairCollapsedSwipeTracker(collapse, {
      getMessages: async () => [after],
      updateMessage: async (_chatId, _id, value) => { patch = value; },
    });
    expect(patch).toEqual({ metadata: {
      otherExtension: { important: false },
      scenemap: { version: 3, updatedAt: "retained", swipes: { 0: retained } },
    } });
  });

  test("does not overwrite a tracker generated after the scrub event", async () => {
    const { after, collapse } = fixture();
    after.metadata.scenemap.swipes[0] = { value: { location: "New tracker" }, updatedAt: "new" };
    let writes = 0;
    expect(await repairCollapsedSwipeTracker(collapse, {
      getMessages: async () => [after],
      updateMessage: async () => { writes++; },
    })).toBe(false);
    expect(writes).toBe(0);
  });

  test("ignores deleted messages or changes to the surviving swipe", async () => {
    const { after, collapse } = fixture();
    let writes = 0;
    for (const messages of [
      [], [{ ...after, swipes: ["Changed text"] }],
      [{ ...after, swipe_dates: [999] }],
      [{ ...after, swipes: ["Chosen swipe", "New alternate"] }],
      [{ ...after, metadata: { ...after.metadata, scenemap: undefined } }],
    ]) {
      expect(await repairCollapsedSwipeTracker(collapse, {
        getMessages: async () => messages,
        updateMessage: async () => { writes++; },
      })).toBe(false);
    }
    expect(writes).toBe(0);
  });

  test("duplicate scrub events cannot remap an already repaired tracker twice", async () => {
    const { after, collapse } = fixture();
    const queue = new KeyedAsyncQueue();
    let writes = 0;
    const api = {
      getMessages: async () => [after],
      updateMessage: async (_chatId: string, _id: string, patch: { metadata: Record<string, unknown> }) => {
        writes++;
        after.metadata = patch.metadata as typeof after.metadata;
      },
    };
    expect(await Promise.all([
      queue.enqueue("chat-1:message-1", () => repairCollapsedSwipeTracker(collapse, api)),
      queue.enqueue("chat-1:message-1", () => repairCollapsedSwipeTracker(collapse, api)),
    ])).toEqual([true, false]);
    expect(writes).toBe(1);
    expect(after.metadata.scenemap.swipes as Record<string, unknown>).toEqual({ 0: retained });
  });

  test("bulk scrubs read history once, repair all messages, and ignore repeated events", async () => {
    const fixtures = Array.from({ length: 50 }, (_, index) => {
      const item = fixture();
      item.after.id = item.collapse.messageId = `message-${index}`;
      return item;
    });
    const messages = fixtures.map((item) => item.after);
    let reads = 0;
    let writes = 0;
    const collapses = fixtures.map((item) => item.collapse);
    const result = await repairCollapsedSwipeTrackers([...collapses, ...collapses], {
      getMessages: async () => { reads++; return messages; },
      updateMessage: async () => { writes++; },
    });
    expect(result).toEqual({ repaired: 50, errors: [] });
    expect(reads).toBe(1);
    expect(writes).toBe(50);
    for (const message of messages) {
      expect(message.metadata.scenemap.swipes as Record<string, unknown>).toEqual({ 0: retained });
    }
  });

  test("a failed repair does not prevent preserving other messages in a bulk scrub", async () => {
    const one = fixture();
    const two = fixture();
    two.after.id = two.collapse.messageId = "message-2";
    const failure = new Error("write failed");
    const result = await repairCollapsedSwipeTrackers([one.collapse, two.collapse], {
      getMessages: async () => [one.after, two.after],
      updateMessage: async (_chatId, messageId) => { if (messageId === one.after.id) throw failure; },
    });
    expect(result).toEqual({ repaired: 1, errors: [failure] });
    expect(two.after.metadata.scenemap.swipes as Record<string, unknown>).toEqual({ 0: retained });
  });
});
