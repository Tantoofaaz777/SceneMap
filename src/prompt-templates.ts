export type SceneMapPromptMode = "full" | "partial";

export type SceneMapPromptTemplateValues = {
  schema: string;
  responseSchema: string;
  previousTracker: string;
  exampleResponse: string;
  exampleSection: string;
  character: string;
  persona: string;
  scenario: string;
  worldInfo: string;
  context: string;
  mode: SceneMapPromptMode;
  selectedFields: string;
  feedback: string;
  partialTask: string;
  chatHistory: readonly string[];
};

export const SCENEMAP_PROMPT_MACROS = [
  { token: "{{scenemap_context}}", description: "Character, persona, scenario and active World Info, with separators." },
  { token: "{{scenemap_character}}", description: "Character description and personality." },
  { token: "{{scenemap_persona}}", description: "Active persona description." },
  { token: "{{scenemap_scenario}}", description: "Character scenario." },
  { token: "{{scenemap_world_info}}", description: "Active World Book entries." },
  { token: "{{scenemap_chat_history::N}}", description: "Last N messages in chronological order, separated by a blank line. Omit ::N for all." },
  { token: "{{scenemap_schema}}", description: "Configured tracker schema." },
  { token: "{{scenemap_response_schema}}", description: "Schema expected for this operation, including partial regeneration." },
  { token: "{{scenemap_previous_tracker}}", description: "Tracker used as the continuity baseline." },
  { token: "{{scenemap_example_response}}", description: "Automatically generated schema example." },
  { token: "{{scenemap_example_section}}", description: "Complete example section, or empty when no valid example is available." },
  { token: "{{scenemap_mode}}", description: 'Current operation: "full" or "partial".' },
  { token: "{{scenemap_selected_fields}}", description: "Fields selected for partial regeneration, otherwise empty." },
  { token: "{{scenemap_feedback}}", description: "Optional user feedback supplied for partial regeneration, otherwise empty." },
  { token: "{{scenemap_partial_task}}", description: "Partial-regeneration contract, otherwise empty." },
] as const;

export const LEGACY_SCENEMAP_PROMPT_MACROS = [
  { token: "{{schema}}", description: "Legacy alias for {{scenemap_schema}}." },
  { token: "{{previous_tracker}}", description: "Legacy alias for {{scenemap_previous_tracker}}." },
  { token: "{{example_response}}", description: "Legacy alias for {{scenemap_example_response}}." },
  { token: "{{example_section}}", description: "Legacy alias for {{scenemap_example_section}}." },
] as const;

const legacyAliases: Record<string, keyof SceneMapPromptTemplateValues> = {
  schema: "schema",
  previous_tracker: "previousTracker",
  example_response: "exampleResponse",
  example_section: "exampleSection",
};

const valueKeys: Record<string, keyof SceneMapPromptTemplateValues> = {
  scenemap_schema: "schema",
  scenemap_response_schema: "responseSchema",
  scenemap_previous_tracker: "previousTracker",
  scenemap_example_response: "exampleResponse",
  scenemap_example_section: "exampleSection",
  scenemap_character: "character",
  scenemap_persona: "persona",
  scenemap_scenario: "scenario",
  scenemap_world_info: "worldInfo",
  scenemap_context: "context",
  scenemap_mode: "mode",
  scenemap_selected_fields: "selectedFields",
  scenemap_feedback: "feedback",
  scenemap_partial_task: "partialTask",
};

const ownedMacroPattern = /\{\{\s*([a-z_]+)(?:\s*::\s*([^{}]*?))?\s*\}\}/gi;

export function renderSceneMapPromptTemplate(
  template: string,
  values: SceneMapPromptTemplateValues,
): string {
  return template.replace(ownedMacroPattern, (match, rawName: string, rawArgument: string | undefined) => {
    const name = rawName.toLowerCase();
    if (name === "scenemap_chat_history") {
      return formatSceneMapChatHistory(values.chatHistory, parseChatHistoryLimit(rawArgument));
    }
    const key = valueKeys[name] ?? legacyAliases[name];
    if (!key) return match;
    const value = values[key];
    return typeof value === "string" ? value : match;
  });
}

export function parseChatHistoryLimit(argument: string | undefined): number | null {
  if (argument === undefined || argument.trim() === "") return null;
  const trimmed = argument.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("{{scenemap_chat_history::N}} expects a positive whole number.");
  }
  const limit = Number(trimmed);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("{{scenemap_chat_history::N}} expects N to be at least 1.");
  }
  return limit;
}

export function formatSceneMapChatHistory(messages: readonly string[], limit: number | null): string {
  const selected = limit === null ? messages : messages.slice(-limit);
  return selected
    .map((message) => message.replace(/\r\n/g, "\n").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function chatHistoryMacro(limit: number): string {
  return limit > 0 ? `{{scenemap_chat_history::${Math.floor(limit)}}}` : "{{scenemap_chat_history}}";
}
