import { describe, expect, test } from "bun:test";
import {
  getAllowedLorebookIds,
  getLorebookCharacterIds,
  getSelectedLorebookIds,
  LorebookSelectionDraft,
  readLorebookGroups,
  withLorebookSelection,
  type LorebookReaders,
} from "./lorebook-selection";
import { countSelectedLorebooks, renderLorebookPanel } from "./lorebook-panel";

describe("chat lorebook selection", () => {
  test("existing and malformed chat metadata default to no selected books", () => {
    for (const chat of [null, {}, { metadata: { scenemap: { schemaPreset: "custom" } } }, { metadata: { scenemap: [] } }]) {
      expect(getSelectedLorebookIds(chat)).toEqual([]);
    }
    expect(getSelectedLorebookIds({ metadata: { scenemap: { selectedLorebookIds: [" a ", "a", null, "", 8, "b"] } } }))
      .toEqual(["a", "b"]);
  });

  test("saving a selection preserves preset overrides and unrelated metadata", () => {
    const chat = { metadata: { chat_world_book_ids: ["a"], other: { value: 7 }, scenemap: { schemaPreset: "custom" } } };
    expect(withLorebookSelection(chat, ["a", "a"])).toEqual({
      chat_world_book_ids: ["a"], other: { value: 7 }, scenemap: { schemaPreset: "custom", selectedLorebookIds: ["a"] },
    });
    expect(chat.metadata.scenemap).toEqual({ schemaPreset: "custom" });
  });

  test("only books still attached to the current context are eligible", () => {
    expect([...getAllowedLorebookIds(["chosen", "removed"], { character: ["chosen"], persona: ["other"], chat: [], global: ["chosen"] })])
      .toEqual(["chosen"]);
  });

  test("group discovery follows explicit lorebook mode or inherited card mode", () => {
    const chat = { character_id: "a", metadata: { group: true, character_ids: ["a", "b", "c"], muted_character_ids: ["b"] } };
    expect(getLorebookCharacterIds(chat)).toEqual(["a"]);
    expect(getLorebookCharacterIds({ ...chat, metadata: { ...chat.metadata, group_card_mode: "merge" } })).toEqual(["a", "b", "c"]);
    expect(getLorebookCharacterIds({ ...chat, metadata: { ...chat.metadata, group_card_mode: "merge_ignore_muted" } })).toEqual(["a", "c"]);
    expect(getLorebookCharacterIds({ ...chat, metadata: { ...chat.metadata, group_card_mode: "merge", group_lorebook_mode: "active_character" } })).toEqual(["a"]);
    expect(getLorebookCharacterIds({ ...chat, metadata: { ...chat.metadata, group_lorebook_mode: "all_unmuted" } })).toEqual(["a", "c"]);
  });

  test("discovers every scope, supports legacy character bindings and resolves shared books once", async () => {
    const reads: string[] = [];
    const readers: LorebookReaders = {
      async getCharacter() { return { extensions: { world_book_id: "shared" } }; },
      async getPersona() { return { attached_world_book_id: "persona" }; },
      async getGlobal() { return ["shared", "global", "deleted"]; },
      async getBook(id) { reads.push(id); return id === "deleted" ? null : { id, name: id.toUpperCase() }; },
    };
    const groups = await readLorebookGroups({ character_id: "char", metadata: { chat_world_book_ids: ["chat", "shared", "chat"] } }, readers);
    expect(groups.map((group) => [group.source, group.books.map((book) => book.id)])).toEqual([
      ["character", ["shared"]], ["persona", ["persona"]], ["chat", ["chat", "shared"]], ["global", ["shared", "global"]],
    ]);
    expect(reads).toEqual(["shared", "persona", "chat", "global", "deleted"]);
    expect(countSelectedLorebooks(groups, ["shared", "removed"])).toBe(1);
  });

  test("pending edits survive older acknowledgements and remain isolated per chat", () => {
    const draft = new LorebookSelectionDraft();
    draft.begin("on", "chat-a", "book", true);
    draft.begin("off", "chat-a", "book", false);
    draft.begin("other", "chat-b", "elsewhere", true);
    expect(draft.overlay("chat-a", [])).toEqual([]);
    expect(draft.overlay("chat-b", [])).toEqual(["elsewhere"]);
    draft.settle("on");
    expect(draft.overlay("chat-a", ["book"])).toEqual([]);
    draft.settle("off");
    expect(draft.overlay("chat-a", [])).toEqual([]);
    draft.reset();
    expect(draft.overlay("chat-b", [])).toEqual([]);
  });

  test("book labels and IDs cannot inject markup into the picker", () => {
    const markup = renderLorebookPanel({ chatId: "chat", loading: false, error: null, selectedIds: [], groups: [
      { source: "character", books: [{ id: '" onclick="alert(1)', name: '<img src=x onerror="alert(1)">' }] },
    ] });
    expect(markup).not.toContain("<img");
    expect(markup).toContain("&lt;img");
    expect(markup).toContain('data-lorebook-id="&quot; onclick=&quot;alert(1)"');
    expect(markup).not.toContain(" checked");
    expect(markup).toContain("0 selected");
  });
});
