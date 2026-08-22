import type { SceneMapState } from "./shared";

export type MessageDeletionRefreshDecision =
  | { kind: "ignore" }
  | { kind: "full" }
  | {
      kind: "derived";
      chatId: string;
      deletedMessageId: string;
      trackerMessageId: string;
    };

/**
 * Deleting an unrelated message cannot invalidate the tracker payload itself.
 * It only changes derived state such as the active message and freshness count.
 * Keeping that distinction here prevents a transient full host snapshot from
 * replacing a valid tracker with `null` after an unrelated deletion.
 */
export function decideMessageDeletionRefresh(
  state: Pick<SceneMapState, "chatId" | "latest">,
  payload: unknown,
): MessageDeletionRefreshDecision {
  const event = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : null;
  const eventChatId = typeof event?.chatId === "string" && event.chatId ? event.chatId : null;
  const deletedMessageId = typeof event?.messageId === "string" && event.messageId
    ? event.messageId
    : null;

  if (eventChatId && state.chatId && eventChatId !== state.chatId) return { kind: "ignore" };
  if (!state.chatId || !state.latest || !deletedMessageId) return { kind: "full" };
  if (deletedMessageId === state.latest.messageId) return { kind: "full" };

  return {
    kind: "derived",
    chatId: state.chatId,
    deletedMessageId,
    trackerMessageId: state.latest.messageId,
  };
}
