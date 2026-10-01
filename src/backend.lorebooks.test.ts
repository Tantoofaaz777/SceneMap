import { expect, test } from "bun:test";

test("backend saves per-chat choices and filters full, partial and macro prompts", async () => {
  const backendUrl = new URL("./backend.ts", import.meta.url).href;
  const sharedUrl = new URL("./shared.ts", import.meta.url).href;
  const script = `
    import assert from "node:assert/strict";
    const { cloneDefaultSettings } = await import(${JSON.stringify(sharedUrl)});
    const settings = cloneDefaultSettings();
    settings.schemaPresets.default.value = { type: "object", properties: { location: { type: "string" } }, required: ["location"] };
    settings.schemaPresets.default.systemPrompt = "{{scenemap_context}}";
    settings.schemaPresets.default.userPrompt = "{{scenemap_chat_history}}\\n{{scenemap_response_schema}}\\n{{scenemap_partial_task}}";
    const chats = new Map([
      ["chat-a", { id: "chat-a", character_id: "char", metadata: { chat_world_book_ids: ["chat-book"], other: { keep: true }, scenemap: { schemaPreset: "default" } } }],
      ["chat-b", { id: "chat-b", character_id: "char", metadata: {} }],
    ]);
    let activeChatId = "chat-a";
    const messages = new Map([...chats.keys()].map(id => [id, [{ id: "reply", role: "assistant", content: "Story about dragons", swipe_id: 0, swipes: ["Story about dragons"], metadata: {} }]]));
    const books = ["character-book", "persona-book", "chat-book", "global-book"];
    const entryModels = new Map(books.map((book, i) => ["entry-" + i, { id: "entry-" + i, world_book_id: book, content: "SECRET-" + book, disabled: false }]));
    entryModels.set("disabled-entry", { id: "disabled-entry", world_book_id: "character-book", content: "DISABLED-SECRET", disabled: true });
    entryModels.set("unattached-entry", { id: "unattached-entry", world_book_id: "unattached-book", content: "UNATTACHED-SECRET", disabled: false });
    let activationQueries = 0;
    let entryReads = 0;
    let frontend;
    let partial = false;
    const sent = [];
    const requests = [];
    const handlers = new Map();
    const macros = new Map();
    const warnings = [];
    function emit(name, payload) { for (const handler of handlers.get(name) ?? []) handler(payload, "user"); }
    function lastState() { return sent.findLast(item => item.type === "state").state; }
    globalThis.spindle = {
      on(name, handler) { handlers.set(name, [...(handlers.get(name) ?? []), handler]); },
      onFrontendMessage(handler) { frontend = handler; },
      registerMacro(definition) { macros.set(definition.name, definition.handler); },
      log: { info() {}, warn(message) { warnings.push(message); }, error(message) { warnings.push(message); } },
      toast: { info() {}, success() {}, error() {} },
      userStorage: { async getJson() { return structuredClone(settings); } },
      connections: { async list() { return []; } },
      characters: { async get() { await Bun.sleep(5); return { world_book_ids: ["character-book"], description: "Card", personality: "Kind", scenario: "Town" }; } },
      personas: { async getActive() { return { description: "Persona", attached_world_book_id: "persona-book" }; }, async getDefault() { return null; } },
      chats: {
        async getActive(user) { assert.equal(user, "user"); return structuredClone(chats.get(activeChatId)); },
        async get(id, user) { assert.ok(user === "user" || user === undefined); return structuredClone(chats.get(id)); },
        async update(id, patch, user) { assert.equal(user, "user"); chats.get(id).metadata = structuredClone(patch.metadata); },
      },
      chat: {
        async getMessages(id) { return structuredClone(messages.get(id)); },
        async updateMessage(id, messageId, patch) { assert.equal(messageId, "reply"); messages.get(id)[0].metadata = structuredClone(patch.metadata); },
      },
      world_books: {
        async getGlobal() { return ["global-book", "character-book"]; },
        async get(id) { return books.includes(id) ? { id, name: id } : null; },
        async getActivated() { activationQueries++; return [...entryModels.values()].map(entry => ({ id: entry.id, bookId: entry.world_book_id })); },
        entries: { async get(id) { entryReads++; return structuredClone(entryModels.get(id)); } },
      },
      macros: { async resolve(text) { return { text }; } },
      generate: { async quiet(input) { requests.push(structuredClone(input.messages)); return { content: JSON.stringify(partial ? { updates: { field_1: "Updated" } } : { location: "Mapped" }) }; } },
      sendToFrontend(payload) { sent.push(structuredClone(payload)); },
    };
    await import(${JSON.stringify(backendUrl)});
    await frontend({ type: "get_state" }, "user");
    assert.deepEqual(lastState().selectedLorebookIds, []);
    assert.deepEqual(lastState().lorebookGroups.map(g => [g.source, g.books.map(b => b.id)]), [
      ["character", ["character-book"]], ["persona", ["persona-book"]], ["chat", ["chat-book"]], ["global", ["global-book", "character-book"]],
    ]);
    await frontend({ type: "generate_tracker" }, "user");
    assert.ok(!JSON.stringify(requests.at(-1)).includes("SECRET-"));
    assert.equal(activationQueries, 0);
    assert.equal(entryReads, 0);

    function toggle(bookId, enabled, requestId, chatId = "chat-a") { return frontend({ type: "set_chat_lorebook", chatId, bookId, enabled, requestId }, "user"); }
    // Clicking a checkbox and immediately generating must wait for its save.
    await Promise.all([toggle("character-book", true, "char"), frontend({ type: "generate_tracker" }, "user")]);
    assert.ok(JSON.stringify(requests.at(-1)).includes("SECRET-character-book"));
    assert.ok(!JSON.stringify(requests.at(-1)).includes("SECRET-persona-book"));
    assert.ok(!JSON.stringify(requests.at(-1)).includes("DISABLED-SECRET"));
    await Promise.all([toggle("persona-book", true, "persona"), toggle("chat-book", true, "chat")]);
    assert.deepEqual(chats.get("chat-a").metadata.scenemap.selectedLorebookIds, ["character-book", "persona-book", "chat-book"]);
    assert.equal(chats.get("chat-a").metadata.scenemap.schemaPreset, "default");
    assert.deepEqual(chats.get("chat-a").metadata.other, { keep: true });

    // Save the originally requested chat even after navigating elsewhere.
    const oldChatSave = toggle("global-book", true, "global");
    activeChatId = "chat-b";
    await oldChatSave;
    assert.equal(lastState().chatId, "chat-b");
    assert.deepEqual(lastState().selectedLorebookIds, []);
    assert.deepEqual(chats.get("chat-b").metadata, {});
    activeChatId = "chat-a";
    await frontend({ type: "get_state" }, "user");
    assert.equal(lastState().selectedLorebookIds.length, 4);
    await toggle("unattached-book", true, "invalid");
    assert.ok(sent.some(item => item.type === "error" && item.requestId === "invalid"));
    assert.equal(chats.get("chat-a").metadata.scenemap.selectedLorebookIds.length, 4);

    // An exact main-generation capture must still pass through the selection.
    await toggle("global-book", false, "no-global");
    await toggle("chat-book", false, "no-chat");
    emit("GENERATION_STARTED", { generationId: "generation", chatId: "chat-a" });
    emit("WORLD_INFO_ACTIVATED", { chatId: "chat-a", entries: [{ id: "entry-0" }, { id: "entry-3" }, { id: "disabled-entry" }] });
    emit("GENERATION_ENDED", { generationId: "generation", chatId: "chat-a", messageId: "reply" });
    const beforeCapture = activationQueries;
    await frontend({ type: "generate_tracker" }, "user");
    assert.equal(activationQueries, beforeCapture);
    const capturePrompt = JSON.stringify(requests.at(-1));
    assert.ok(capturePrompt.includes("SECRET-character-book"));
    assert.ok(!capturePrompt.includes("SECRET-global-book"));
    assert.ok(!capturePrompt.includes("SECRET-persona-book"));
    assert.ok(!capturePrompt.includes("DISABLED-SECRET"));

    partial = true;
    await frontend({ type: "regenerate_fields", messageId: "reply", swipeId: 0, paths: [["location"]], feedback: "", requestId: "partial" }, "user");
    assert.equal(requests.length, 4);
    assert.ok(JSON.stringify(requests.at(-1)).includes("SECRET-character-book"));
    assert.ok(!JSON.stringify(requests.at(-1)).includes("SECRET-global-book"));
    assert.equal(messages.get("chat-a")[0].metadata.scenemap.swipes["0"].value.location, "Updated");

    const macro = await macros.get("scenemap_world_info")({ name: "scenemap_world_info", env: { chat: { id: "chat-a" } } });
    assert.ok(macro.includes("SECRET-character-book") && macro.includes("SECRET-persona-book"));
    assert.ok(!macro.includes("SECRET-global-book"));
    // Cached activation cannot inject a book after its character binding is removed.
    globalThis.spindle.characters.get = async () => ({ world_book_ids: [], description: "Card" });
    globalThis.spindle.world_books.getGlobal = async () => ["global-book"];
    partial = false;
    await frontend({ type: "generate_tracker" }, "user");
    assert.ok(!JSON.stringify(requests.at(-1)).includes("SECRET-character-book"));
    assert.deepEqual(warnings, []);
    assert.ok(!sent.some(item => item.type === "error" && item.requestId !== "invalid"));
    console.log("Per-chat lorebook choices filter full, partial, cached and macro context");
  `;
  const child = Bun.spawn([process.execPath, "--eval", script], { stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
  expect(stdout).toContain("Per-chat lorebook choices filter full, partial, cached and macro context");
});
