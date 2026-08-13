# SceneMap Lumiverse

SceneMap is a Lumiverse Spindle extension that tracks roleplay scene state as structured JSON.

## Features

- Generate a scene tracker for the latest assistant message.
- Store tracker data per message swipe in message metadata.
- Display the current tracker in a resizable Lumiverse dock panel beside the chat.
- Keep SceneMap settings in a dedicated drawer tab that can reopen the dock panel.
- Edit, delete, and regenerate tracker JSON.
- Configure connection, sampling, and interface options with auto-save from the SceneMap sidebar.
- Save preset schema, System prompt, User prompt, and visual layout together with an explicit preset action.
- Import and export presets containing schema, split prompts, and layout.
- Include character card, active persona, and active world info context during tracker generation.
- Expose the latest tracker as the `{{scenemap}}` macro for prompts.

## Prompt templates

Every preset has independently editable System and User messages. SceneMap expands its own macros from the exact target-message snapshot, then lets Lumiverse resolve native macros such as `{{char}}` and `{{user}}`.

`{{scenemap_chat_history}}` inserts all chat messages through the generation target as plain chronological text. `{{scenemap_chat_history::N}}` limits it to the last `N` messages. Message contents are separated only by a blank line; no user or assistant labels are added.

The editor lists the remaining context, schema, continuity, example, and partial-regeneration macros alongside their descriptions. Older single-prompt presets are migrated automatically, and version 1 preset exports remain importable.

## Install

Install this repository through Lumiverse's Extensions panel:

```txt
https://github.com/Tantoofaaz777/SceneMap
```

Required permissions:

- `generation`
- `chats`
- `chat_mutation`
- `ui_panels`
- `characters`
- `personas`
- `world_books`

## Development

Build the backend and frontend bundles:

```bash
bun run build
```

Lumiverse loads `dist/backend.js` and `dist/frontend.js` from `spindle.json`.
