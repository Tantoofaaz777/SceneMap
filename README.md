# SceneMap Lumiverse

SceneMap is a Lumiverse Spindle extension that tracks roleplay scene state as structured JSON.

## Features

- Generate a scene tracker for the latest assistant message.
- Store tracker data per message swipe in message metadata.
- Display the current tracker in a resizable Lumiverse dock panel beside the chat.
- Keep SceneMap settings in a dedicated drawer tab that can reopen the dock panel.
- Edit, delete, and regenerate tracker JSON.
- Configure connection, sampling, context window, and interface options with auto-save from the SceneMap sidebar.
- Save preset schema, prompt, and visual layout together with an explicit preset action.
- Edit each preset's JSON schema and prompt directly in the SceneMap settings sidebar.
- Import and export presets containing schema, prompt, and layout.
- Include character card, active persona, and active world info context during tracker generation.
- Expose the latest tracker as the `{{scenemap}}` macro for prompts.

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
