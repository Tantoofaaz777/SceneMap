import { describe, expect, test } from "bun:test";
import { decideMessageDeletionRefresh } from "./message-deletion-refresh";

const state = {
  chatId: "chat-1",
  latest: {
    messageId: "tracker-message",
    swipeId: 0,
    data: {},
    presetKey: "default",
    schemaHash: "schema",
    schemaMatchesCurrent: true,
  },
};

describe("message deletion refresh", () => {
  test("uses a derived refresh when another message was deleted", () => {
    expect(decideMessageDeletionRefresh(state, {
      chatId: "chat-1",
      messageId: "another-message",
    })).toEqual({
      kind: "derived",
      chatId: "chat-1",
      deletedMessageId: "another-message",
      trackerMessageId: "tracker-message",
    });
  });

  test("uses a full refresh when the tracker message was deleted", () => {
    expect(decideMessageDeletionRefresh(state, {
      chatId: "chat-1",
      messageId: "tracker-message",
    })).toEqual({ kind: "full" });
  });

  test("falls back safely for incomplete events and ignores other chats", () => {
    expect(decideMessageDeletionRefresh(state, { chatId: "chat-1" })).toEqual({ kind: "full" });
    expect(decideMessageDeletionRefresh(state, {
      chatId: "chat-2",
      messageId: "another-message",
    })).toEqual({ kind: "ignore" });
  });
});
