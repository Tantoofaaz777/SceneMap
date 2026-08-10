import type { SceneMapState } from "./shared";

export type TopToolbarStatusTone = "neutral" | "warning" | "success" | "generating";

export interface TopToolbarStatus {
  tone: TopToolbarStatusTone;
  text: string;
}

type ToolbarState = Pick<
  SceneMapState,
  | "chatId"
  | "latest"
  | "messagesBehind"
  | "activeMessageId"
  | "activeSwipeId"
  | "generationActive"
>;

/**
 * The compact toolbar indicator is stricter than "a tracker exists": it is
 * green only when provenance, message position, and the active swipe all match.
 */
export function getTopToolbarStatus(state: ToolbarState, requestPending = false): TopToolbarStatus {
  if (state.generationActive || requestPending) {
    return { tone: "generating", text: "Mapping this scene" };
  }
  if (!state.chatId || !state.activeMessageId) {
    return { tone: "neutral", text: "Open a chat with an assistant reply" };
  }
  if (!state.latest) {
    return { tone: "warning", text: "SceneMap has not been generated" };
  }
  if (!state.latest.schemaMatchesCurrent) {
    return { tone: "warning", text: "SceneMap uses another or outdated schema" };
  }
  if (state.messagesBehind > 0) {
    return {
      tone: "warning",
      text: `SceneMap is ${state.messagesBehind} message${state.messagesBehind === 1 ? "" : "s"} behind`,
    };
  }
  if (
    state.latest.messageId !== state.activeMessageId
    || state.latest.swipeId !== state.activeSwipeId
  ) {
    return { tone: "warning", text: "SceneMap is out of date for the active swipe" };
  }
  return { tone: "success", text: "SceneMap is updated" };
}
