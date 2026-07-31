import { describe, expect, test } from "bun:test";
import { WorldInfoActivationCache } from "./world-info-activation-cache";

describe("WorldInfoActivationCache", () => {
  test("binds an ordered, de-duplicated capture to the generated message", () => {
    const cache = new WorldInfoActivationCache();
    cache.begin("user", "generation", "chat");

    expect(cache.capture("user", "chat", [
      { id: "first" },
      { id: "second" },
      { id: "first" },
      { id: "" },
    ])).toBe(true);
    expect(cache.complete("user", "generation", "chat", "message")).toBe(true);
    expect(cache.get("user", "chat", "message")).toEqual(["first", "second"]);
  });

  test("falls back when no activation event was observed", () => {
    const cache = new WorldInfoActivationCache();
    cache.begin("user", "generation", "chat");

    expect(cache.complete("user", "generation", "chat", "message")).toBe(false);
    expect(cache.get("user", "chat", "message")).toBeNull();
  });

  test("a newer generation replaces an orphaned pending generation", () => {
    const cache = new WorldInfoActivationCache();
    cache.begin("user", "one", "chat");
    cache.begin("user", "two", "chat");

    expect(cache.capture("user", "chat", [{ id: "lore" }])).toBe(true);
    expect(cache.complete("user", "one", "chat", "message-one")).toBe(false);
    expect(cache.complete("user", "two", "chat", "message-two")).toBe(true);
    expect(cache.get("user", "chat", "message-two")).toEqual(["lore"]);
  });

  test("does not bind stopped, failed, or mismatched generations", () => {
    const cache = new WorldInfoActivationCache();
    cache.begin("user", "stopped", "chat");
    cache.capture("user", "chat", [{ id: "stopped-lore" }]);
    cache.discard("user", "stopped", "chat");
    expect(cache.get("user", "chat", "message")).toBeNull();

    cache.begin("user", "failed", "chat");
    cache.capture("user", "chat", [{ id: "failed-lore" }]);
    expect(cache.complete("other-user", "failed", "chat", "message")).toBe(false);
    expect(cache.complete("user", "failed", "chat", null)).toBe(false);
    expect(cache.get("user", "chat", "message")).toBeNull();
  });

  test("invalidates only the affected user and chat", () => {
    const cache = new WorldInfoActivationCache();
    for (const [userId, generationId, chatId, messageId] of [
      ["user-a", "generation-a", "chat", "message-a"],
      ["user-b", "generation-b", "chat", "message-b"],
      ["user-a", "generation-c", "other-chat", "message-c"],
    ]) {
      cache.begin(userId, generationId, chatId);
      cache.capture(userId, chatId, [{ id: generationId }]);
      cache.complete(userId, generationId, chatId, messageId);
    }

    cache.invalidateChat("user-a", "chat");
    expect(cache.get("user-a", "chat", "message-a")).toBeNull();
    expect(cache.get("user-b", "chat", "message-b")).toEqual(["generation-b"]);
    expect(cache.get("user-a", "other-chat", "message-c")).toEqual(["generation-c"]);
  });

  test("returns a defensive copy of cached entry ids", () => {
    const cache = new WorldInfoActivationCache();
    cache.begin("user", "generation", "chat");
    cache.capture("user", "chat", [{ id: "lore" }]);
    cache.complete("user", "generation", "chat", "message");

    const first = cache.get("user", "chat", "message");
    first?.push("mutated");
    expect(cache.get("user", "chat", "message")).toEqual(["lore"]);
  });
});
