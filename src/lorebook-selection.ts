export const LOREBOOK_SOURCES = ["character", "persona", "chat", "global"] as const;
export type LorebookSource = typeof LOREBOOK_SOURCES[number];

export type LorebookGroup = {
  source: LorebookSource;
  books: Array<{ id: string; name: string }>;
};

type LorebookChat = {
  character_id?: string | null;
  metadata?: Record<string, unknown>;
};

export type LorebookReaders = {
  getCharacter(id: string): Promise<{
    world_book_ids?: unknown;
    extensions?: Record<string, unknown>;
  } | null>;
  getPersona(): Promise<{ attached_world_book_id?: string | null } | null>;
  getGlobal(): Promise<string[]>;
  getBook(id: string): Promise<{ id: string; name: string } | null>;
};

export function normalizeLorebookIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((id) => typeof id === "string" && id.trim() ? [id.trim()] : []))];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function getSelectedLorebookIds(chat: LorebookChat | null): string[] {
  return normalizeLorebookIds(record(chat?.metadata?.scenemap).selectedLorebookIds);
}

export function toggleLorebookSelection(ids: readonly string[], bookId: string, enabled: boolean): string[] {
  return enabled ? normalizeLorebookIds([...ids, bookId]) : ids.filter((id) => id !== bookId);
}

export function withLorebookSelection(chat: LorebookChat, selectedIds: string[]): Record<string, unknown> {
  return {
    ...chat.metadata,
    scenemap: { ...record(chat.metadata?.scenemap), selectedLorebookIds: normalizeLorebookIds(selectedIds) },
  };
}

/** Match Lumiverse's group card/lorebook scopes, including muted members. */
export function getLorebookCharacterIds(chat: LorebookChat): string[] {
  const primary = normalizeLorebookIds([chat.character_id]);
  const meta = chat.metadata ?? {};
  if (meta.group !== true && meta.group !== 1) return primary;
  const explicitMode = meta.group_lorebook_mode;
  const mode = explicitMode === "all" || explicitMode === "all_unmuted" || explicitMode === "active_character"
    ? explicitMode
    : meta.group_card_mode === "merge" ? "all"
      : meta.group_card_mode === "merge_ignore_muted" ? "all_unmuted" : "active_character";
  if (mode === "active_character") return primary;
  const muted = new Set(mode === "all_unmuted" ? normalizeLorebookIds(meta.muted_character_ids) : []);
  const ids = normalizeLorebookIds(meta.character_ids).filter((id) => !muted.has(id));
  return ids.length ? ids : primary;
}

export async function readAttachedLorebookIds(
  chat: LorebookChat,
  readers: LorebookReaders,
): Promise<Record<LorebookSource, string[]>> {
  const characterBooks: string[] = [];
  for (const id of getLorebookCharacterIds(chat)) {
    const character = await readers.getCharacter(id);
    if (!character) continue;
    // The public DTO exposes this directly; older hosts keep it in extensions.
    const rawIds = character.world_book_ids ?? character.extensions?.world_book_ids;
    characterBooks.push(...normalizeLorebookIds(Array.isArray(rawIds)
      ? rawIds : [character.extensions?.world_book_id]));
  }
  const persona = await readers.getPersona();
  return {
    character: normalizeLorebookIds(characterBooks),
    persona: normalizeLorebookIds([persona?.attached_world_book_id]),
    chat: normalizeLorebookIds(chat.metadata?.chat_world_book_ids),
    global: normalizeLorebookIds(await readers.getGlobal()),
  };
}

export async function readLorebookGroups(chat: LorebookChat, readers: LorebookReaders): Promise<LorebookGroup[]> {
  const sources = await readAttachedLorebookIds(chat, readers);
  const books = new Map<string, { id: string; name: string } | null>();
  const groups: LorebookGroup[] = [];
  for (const source of LOREBOOK_SOURCES) {
    const group: LorebookGroup = { source, books: [] };
    for (const id of sources[source]) {
      if (!books.has(id)) books.set(id, await readers.getBook(id));
      const book = books.get(id);
      if (book) group.books.push({ id: book.id, name: book.name });
    }
    groups.push(group);
  }
  return groups;
}

export function getAllowedLorebookIds(selectedIds: readonly string[], sources: Record<LorebookSource, string[]>): Set<string> {
  const attached = new Set(LOREBOOK_SOURCES.flatMap((source) => sources[source]));
  return new Set(selectedIds.filter((id) => attached.has(id)));
}

/** Pending toggles overlay older host snapshots without crossing chat boundaries. */
export class LorebookSelectionDraft {
  private readonly pending = new Map<string, { chatId: string; bookId: string; enabled: boolean }>();

  begin(requestId: string, chatId: string, bookId: string, enabled: boolean): void {
    this.pending.set(requestId, { chatId, bookId, enabled });
  }

  settle(requestId: string): boolean {
    return this.pending.delete(requestId);
  }

  overlay(chatId: string | null, ids: readonly string[]): string[] {
    let selected = [...ids];
    for (const pending of this.pending.values()) {
      if (pending.chatId === chatId) selected = toggleLorebookSelection(selected, pending.bookId, pending.enabled);
    }
    return selected;
  }

  reset(): void {
    this.pending.clear();
  }
}
