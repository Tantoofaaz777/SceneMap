import { expect, test } from "bun:test";

test("backend repairs raw Scrub All events, refreshes once, and restores the scenemap macro", async () => {
  // Run the real backend in its own runtime, with only the Spindle host mocked.
  // This covers subscription wiring, event shape, batching, storage and reads.
  const backendUrl = new URL("./backend.ts", import.meta.url).href;
  const script = `
    import assert from "node:assert/strict";
    const handlers = new Map();
    const macros = new Map();
    const errors = [];
    let reads = 0;
    let writes = 0;
    let states = 0;
    let done;
    const stateReady = new Promise(resolve => { done = resolve; });
    const messages = Array.from({ length: 3 }, (_, index) => ({
      id: "message-" + index, role: "assistant", content: "Surviving story " + index,
      swipe_id: 2,
      swipes: ["discarded zero", "discarded one", "Surviving story " + index],
      swipe_dates: [100, 200, 300 + index],
      metadata: {
        otherExtension: { preserved: index },
        scenemap: { version: 3, swipes: {
          0: { value: { location: "Discarded location " + index }, updatedAt: "old" },
          2: { value: { location: "Continuing location " + index }, updatedAt: "chosen", presetKey: "default", schemaHash: "schema" }
        } }
      }
    }));
    function emit(name, payload) {
      for (const handler of handlers.get(name) ?? []) handler(structuredClone(payload), "user-1");
    }
    globalThis.spindle = {
      on(name, handler) { handlers.set(name, [...(handlers.get(name) ?? []), handler]); },
      onFrontendMessage() {},
      registerMacro(definition) { macros.set(definition.name, definition.handler); },
      log: { info() {}, warn(message) { errors.push(message); }, error(message) { errors.push(message); } },
      userStorage: { async getJson(_path, options) { return structuredClone(options.fallback); } },
      chats: { async getActive() { return { id: "chat-1", metadata: {} }; } },
      connections: { async list() { return []; } },
      chat: {
        async getMessages() { reads++; return structuredClone(messages); },
        async updateMessage(chatId, messageId, patch) {
          assert.equal(chatId, "chat-1");
          const message = messages.find(item => item.id === messageId);
          message.metadata = structuredClone(patch.metadata);
          writes++;
          // A metadata-only update must not recursively trigger SWIPE_EDITED.
          emit("MESSAGE_EDITED", { chatId, message });
        }
      },
      sendToFrontend(payload) {
        if (payload.type === "state") { states++; done(payload.state); }
      }
    };
    await import(${JSON.stringify(backendUrl)});
    for (const message of messages) {
      const previousSwipeId = message.swipe_id;
      message.swipes = [message.swipes[previousSwipeId]];
      message.swipe_dates = [message.swipe_dates[previousSwipeId]];
      message.swipe_id = 0;
      const { metadata, ...raw } = message;
      const payload = { chatId: "chat-1", message: { ...raw, extra: { spindle_metadata: metadata } }, previousSwipeId };
      emit("MESSAGE_EDITED", payload);
      emit("SWIPE_EDITED", payload);
      // A repeated scrub before the repair completes sees slot zero, but must
      // not steal the discarded tracker's metadata from that old event.
      emit("SWIPE_EDITED", { ...payload, previousSwipeId: 0 });
    }
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("state refresh missing")), 3000); });
    const state = await Promise.race([stateReady, timeout]).finally(() => clearTimeout(timer));
    assert.equal(writes, 3);
    assert.equal(reads, 2); // one repair batch, one state snapshot
    assert.equal(states, 1);
    assert.equal(state.latest.swipeId, 0);
    assert.equal(state.latest.data.location, "Continuing location 2");
    for (const [index, message] of messages.entries()) {
      assert.deepEqual(Object.keys(message.metadata.scenemap.swipes), ["0"]);
      assert.equal(message.metadata.scenemap.swipes[0].value.location, "Continuing location " + index);
      assert.equal(message.metadata.scenemap.swipes[0].presetKey, "default");
      assert.deepEqual(message.metadata.otherExtension, { preserved: index });
    }
    const macro = await macros.get("scenemap")({ env: { chat: { id: "chat-1" } } });
    assert.ok(macro.includes("Continuing location 2"));
    assert.ok(!macro.includes("Discarded location"));
    assert.deepEqual(errors, []);
    console.log("Scrub All preserved trackers, panel state and scenemap macro");
  `;
  const child = Bun.spawn([process.execPath, "--eval", script], { stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
  expect(stdout).toContain("Scrub All preserved trackers, panel state and scenemap macro");
});
