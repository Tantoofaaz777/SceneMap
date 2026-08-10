import { describe, expect, test } from "bun:test";
import { getTopToolbarStatus } from "./top-toolbar-status";

const currentTracker = {
  messageId: "message-2",
  swipeId: 1,
  data: {},
  presetKey: "default",
  schemaHash: "schema",
  schemaMatchesCurrent: true,
};

const currentState = {
  chatId: "chat-1",
  latest: currentTracker,
  messagesBehind: 0,
  activeMessageId: "message-2",
  activeSwipeId: 1,
  generationActive: false,
};

describe("top toolbar status", () => {
  test("is green only for the current message, swipe, and schema", () => {
    expect(getTopToolbarStatus(currentState)).toEqual({
      tone: "success",
      text: "SceneMap is updated",
    });
    expect(getTopToolbarStatus({ ...currentState, activeSwipeId: 0 }).tone).toBe("warning");
    expect(getTopToolbarStatus({
      ...currentState,
      latest: { ...currentTracker, schemaMatchesCurrent: false },
    }).tone).toBe("warning");
  });

  test("reports missing and lagging trackers as warnings", () => {
    expect(getTopToolbarStatus({ ...currentState, latest: null })).toEqual({
      tone: "warning",
      text: "SceneMap has not been generated",
    });
    expect(getTopToolbarStatus({ ...currentState, messagesBehind: 2 })).toEqual({
      tone: "warning",
      text: "SceneMap is 2 messages behind",
    });
  });

  test("uses neutral when unavailable and generating while a request is pending", () => {
    expect(getTopToolbarStatus({ ...currentState, chatId: null, activeMessageId: null })).toEqual({
      tone: "neutral",
      text: "Open a chat with an assistant reply",
    });
    expect(getTopToolbarStatus(currentState, true)).toEqual({
      tone: "generating",
      text: "Mapping this scene",
    });
  });
});
