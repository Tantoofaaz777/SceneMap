# SceneMap lorebook selection

The Lorebooks section in SceneMap settings lists books attached to the current chat's Character, Persona, Chat, and Global scopes, with an icon and heading for each group.

All lorebooks start unchecked, including in existing chats without a saved selection. Check a book to allow its activated entries into `{{scenemap_world_info}}` and `{{scenemap_context}}` during full and partial tracker generation. Selections save automatically per chat and are restored when returning to it.

This does not change Lumiverse's main chat lorebook settings or force every entry in a selected book to activate. The same book appearing in multiple groups shares one selection. Books no longer attached to the context are excluded from SceneMap's requests.

The list refreshes when the chat, character, persona, global bindings, or lorebook library changes. Group chats follow Lumiverse's group card and lorebook modes, including muted characters.

Validation: `bun test`, `bun run typecheck`, and `bun run build`. The tracked `dist/backend.js` and `dist/frontend.js` bundles contain the feature and are loaded through `spindle.json`.
