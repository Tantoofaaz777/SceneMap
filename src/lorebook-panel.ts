import { LOREBOOK_SOURCES, type LorebookGroup, type LorebookSource } from "./lorebook-selection";

const titles: Record<LorebookSource, string> = {
  character: "Character", persona: "Persona", chat: "Chat", global: "Global",
};
const icons: Record<LorebookSource, string> = {
  character: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  persona: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M6 16a3 3 0 0 1 6 0m3-6h3m-3 4h3"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
  global: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18m-9-9a16 16 0 0 1 0 18 16 16 0 0 1 0-18Z"/>',
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function countSelectedLorebooks(groups: readonly LorebookGroup[], selectedIds: readonly string[]): number {
  const available = new Set(groups.flatMap((group) => group.books.map((book) => book.id)));
  return new Set(selectedIds.filter((id) => available.has(id))).size;
}

export function renderLorebookPanel(options: {
  chatId: string | null;
  groups: readonly LorebookGroup[];
  selectedIds: readonly string[];
  error: string | null;
  loading: boolean;
}): string {
  const { chatId, groups, selectedIds, error, loading } = options;
  const selected = new Set(selectedIds);
  let content: string;
  if (loading) content = '<p class="scenemap-lorebook-empty" role="status">Loading chat lorebooks...</p>';
  else if (!chatId) content = '<p class="scenemap-lorebook-empty">Open a chat to choose its lorebooks.</p>';
  else if (error) content = `<p class="scenemap-runtime-error" role="alert">${escape(error)}</p>`;
  else content = LOREBOOK_SOURCES.map((source) => {
    const books = groups.find((group) => group.source === source)?.books ?? [];
    const rows = books.map((book) => `
      <label class="scenemap-lorebook-row">
        <input type="checkbox" data-lorebook-id="${escape(book.id)}" ${selected.has(book.id) ? "checked" : ""}>
        <span>${escape(book.name)}</span>
      </label>`).join("");
    return `<fieldset class="scenemap-lorebook-group">
      <legend><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[source]}</svg><span>${titles[source]}:</span><span class="scenemap-lorebook-source-count">${books.length}</span></legend>
      ${rows || '<p class="scenemap-lorebook-empty">No attached lorebooks.</p>'}
    </fieldset>`;
  }).join("");
  return `<section class="scenemap-settings-group scenemap-lorebooks" data-lorebook-panel>
    <div class="scenemap-settings-group-heading"><h3>Lorebooks</h3><span class="scenemap-lorebook-count" data-lorebook-count aria-live="polite">${countSelectedLorebooks(groups, selectedIds)} selected</span></div>
    <p class="scenemap-lorebook-hint">Choose which lorebooks SceneMap can use in this chat. Only their activated entries are included. Saved automatically.</p>
    <div class="scenemap-lorebook-groups">${content}</div>
  </section>`;
}
