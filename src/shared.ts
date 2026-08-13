import { chatHistoryMacro } from "./prompt-templates";

export const EXTENSION_KEY = "SceneMap";
export const SETTINGS_PATH = "settings.json";
export const CHAT_METADATA_KEY = "scenemap";
export const MESSAGE_METADATA_KEY = "scenemap";

export type TrackerFieldDisplay = "text" | "subtle" | "mono" | "chips" | "progress" | "character_cards";

export interface TrackerBoardField {
  path: string;
  label?: string;
  display?: TrackerFieldDisplay;
  center?: boolean;
  fields?: TrackerBoardField[];
}

export interface TrackerBoardSection {
  title: string;
  fields: TrackerBoardField[];
}

export interface TrackerBoardDisplayLayout {
  sections: TrackerBoardSection[];
}

export interface SceneMapPreset {
  name: string;
  value: Record<string, unknown>;
  systemPrompt?: string;
  userPrompt?: string;
  /** Legacy single-prompt field retained only so old settings can be migrated. */
  promptJson?: string;
  displayLayout?: TrackerBoardDisplayLayout;
}

export interface SceneMapSettings {
  version: string;
  formatVersion: string;
  connectionId: string;
  maxResponseTokens: number;
  temperature: number | null;
  topP: number | null;
  autoGenerateAiTrackers: boolean;
  autoGenerateInterval: number;
  showInputBarButton: boolean;
  showTopToolbarButton: boolean;
  trackerPlacement: "dock" | "drawer";
  schemaPreset: string;
  schemaPresets: Record<string, SceneMapPreset>;
  includeLastXMessages: number;
  promptJson: string;
  displayLayout: TrackerBoardDisplayLayout;
}

export interface TrackerEntry {
  messageId: string;
  swipeId: number;
  data: unknown;
  displayData?: unknown;
  presetKey: string | null;
  schemaHash: string | null;
  schemaMatchesCurrent: boolean;
}

export interface SceneMapState {
  settings: SceneMapSettings;
  chatId: string | null;
  effectivePresetKey: string;
  latest: TrackerEntry | null;
  messagesBehind: number;
  autoGenerateMessagesRemaining: number | null;
  activeMessageId: string | null;
  activeSwipeId: number | null;
  generationActive: boolean;
  generatingMessageId: string | null;
  connections: Array<{ id: string; name: string; provider: string; model: string; is_default?: boolean }>;
}

export const DEFAULT_SCHEMA_VALUE: Record<string, unknown> = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SceneTracker",
  description: "Schema for tracking roleplay scene details",
  type: "object",
  properties: {
    time: {
      type: "string",
      description: "Format: HH:MM:SS; MM/DD/YYYY (Day Name)",
    },
    location: {
      type: "string",
      description: "Specific scene location with increasing specificity",
    },
    weather: {
      type: "string",
      description: "Current weather conditions and temperature",
    },
    topics: {
      type: "object",
      properties: {
        primaryTopic: {
          type: "string",
          description: "1-2 word main topic of interaction",
        },
        emotionalTone: {
          type: "string",
          description: "Dominant emotional tone of scene",
        },
        interactionTheme: {
          type: "string",
          description: "Type of character interaction",
        },
      },
      required: ["primaryTopic", "emotionalTone", "interactionTheme"],
    },
    charactersPresent: {
      type: "array",
      items: {
        type: "string",
        description: "Character name",
      },
      description: "List of character names present in scene",
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Character name",
          },
          hair: {
            type: "string",
            description: "Hairstyle and condition",
          },
          makeup: {
            type: "string",
            description: "Makeup description or 'None'",
          },
          outfit: {
            type: "string",
            description: "Complete outfit including underwear",
          },
          stateOfDress: {
            type: "string",
            description: "How put-together/disheveled character appears",
          },
          postureAndInteraction: {
            type: "string",
            description: "Character's physical positioning and interaction",
          },
        },
        required: ["name", "hair", "makeup", "outfit", "stateOfDress", "postureAndInteraction"],
      },
      description: "Array of character objects",
    },
  },
  required: ["time", "location", "weather", "topics", "charactersPresent", "characters"],
};

export const DEFAULT_DISPLAY_LAYOUT: TrackerBoardDisplayLayout = {
  sections: [
    {
      title: "Scene",
      fields: [
        { path: "location", label: "Location", display: "text" },
        { path: "time", label: "Time", display: "subtle" },
        { path: "weather", label: "Weather", display: "text" },
      ],
    },
    {
      title: "Topics",
      fields: [
        { path: "topics.primaryTopic", label: "Primary Topic", display: "text" },
        { path: "topics.emotionalTone", label: "Emotional Tone", display: "subtle" },
        { path: "topics.interactionTheme", label: "Interaction Theme", display: "subtle" },
      ],
    },
    {
      title: "Present",
      fields: [{ path: "charactersPresent", label: "Characters", display: "chips" }],
    },
    {
      title: "Characters",
      fields: [
        {
          path: "characters",
          label: "Characters",
          display: "character_cards",
          fields: [
            { path: "outfit", label: "Outfit", display: "text" },
            { path: "stateOfDress", label: "State Of Dress", display: "subtle" },
            { path: "postureAndInteraction", label: "Posture And Interaction", display: "mono" },
            { path: "hair", label: "Hair", display: "subtle" },
            { path: "makeup", label: "Makeup", display: "subtle" },
          ],
        },
      ],
    },
  ],
};

export const DEFAULT_PROMPT_JSON = `You are a highly specialized AI assistant. Your SOLE purpose is to generate a single, valid JSON object that strictly adheres to the provided JSON schema.

CRITICAL INSTRUCTIONS:
1. You MUST wrap the entire JSON object in a markdown code block (\`\`\`json\\n...\\n\`\`\`).
2. Your response MUST NOT contain explanatory text, comments, or any content outside this single code block.
3. The JSON object inside the code block MUST be valid and conform to the schema.

JSON SCHEMA TO FOLLOW:
\`\`\`json
{{scenemap_response_schema}}
\`\`\`

PREVIOUS TRACKER TO UPDATE:
If this object is not empty, use it as the baseline and update it instead of starting from scratch. Preserve unchanged fields unless recent chat messages clearly changed them.
\`\`\`json
{{scenemap_previous_tracker}}
\`\`\`

{{scenemap_example_section}}`;

export const DEFAULT_SYSTEM_PROMPT = "{{scenemap_context}}";

export const DEFAULT_USER_PROMPT = `{{scenemap_chat_history}}

>>> Instructions <<<
${DEFAULT_PROMPT_JSON}

{{scenemap_partial_task}}`;

export const defaultSettings: SceneMapSettings = {
  version: "1.0.1",
  formatVersion: "F_1.0",
  connectionId: "",
  maxResponseTokens: 16000,
  temperature: null,
  topP: null,
  autoGenerateAiTrackers: false,
  autoGenerateInterval: 1,
  showInputBarButton: true,
  showTopToolbarButton: false,
  trackerPlacement: "dock",
  schemaPreset: "default",
  schemaPresets: {
    default: {
      name: "Default",
      value: DEFAULT_SCHEMA_VALUE,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      userPrompt: DEFAULT_USER_PROMPT,
    },
  },
  includeLastXMessages: 0,
  promptJson: DEFAULT_PROMPT_JSON,
  displayLayout: DEFAULT_DISPLAY_LAYOUT,
};

export function cloneDefaultSettings(): SceneMapSettings {
  return JSON.parse(JSON.stringify(defaultSettings)) as SceneMapSettings;
}

export function mergeSettings(value: Partial<SceneMapSettings> | null | undefined): SceneMapSettings {
  const base = cloneDefaultSettings();
  if (!value || typeof value !== "object") return base;
  const currentValue = { ...value } as Partial<SceneMapSettings> & {
    showMessageButtons?: unknown;
  };
  // This removed setting may still exist in older userStorage files. Do not let
  // object spreading accidentally reintroduce the message-level button.
  delete currentValue.showMessageButtons;
  const mergedPresets = {
    ...base.schemaPresets,
    ...(currentValue.schemaPresets ?? {}),
  };
  const legacyPrompt = typeof currentValue.promptJson === "string"
    ? currentValue.promptJson
    : base.promptJson;
  const legacyHistoryLimit = typeof currentValue.includeLastXMessages === "number" && Number.isFinite(currentValue.includeLastXMessages)
    ? Math.max(0, Math.floor(currentValue.includeLastXMessages))
    : base.includeLastXMessages;
  const schemaPresets = Object.fromEntries(Object.entries(mergedPresets).map(([key, preset]) => {
    const presetLegacyPrompt = typeof preset.promptJson === "string" ? preset.promptJson : legacyPrompt;
    return [key, {
      ...preset,
      systemPrompt: typeof preset.systemPrompt === "string" ? preset.systemPrompt : DEFAULT_SYSTEM_PROMPT,
      userPrompt: typeof preset.userPrompt === "string"
        ? preset.userPrompt
        : migrateLegacyUserPrompt(presetLegacyPrompt, legacyHistoryLimit),
    }];
  }));
  return {
    ...base,
    ...currentValue,
    autoGenerateInterval: typeof currentValue.autoGenerateInterval === "number" && Number.isFinite(currentValue.autoGenerateInterval)
      ? Math.max(1, Math.floor(currentValue.autoGenerateInterval))
      : base.autoGenerateInterval,
    maxResponseTokens: typeof currentValue.maxResponseTokens === "number" && Number.isFinite(currentValue.maxResponseTokens)
      ? Math.max(1, Math.floor(currentValue.maxResponseTokens))
      : base.maxResponseTokens,
    temperature: typeof currentValue.temperature === "number" && Number.isFinite(currentValue.temperature)
      ? resolveSamplingParameter(currentValue.temperature, 0, 2)
      : base.temperature,
    topP: typeof currentValue.topP === "number" && Number.isFinite(currentValue.topP)
      ? resolveSamplingParameter(currentValue.topP, 0, 1)
      : base.topP,
    includeLastXMessages: typeof currentValue.includeLastXMessages === "number" && Number.isFinite(currentValue.includeLastXMessages)
      ? Math.max(0, Math.floor(currentValue.includeLastXMessages))
      : base.includeLastXMessages,
    showTopToolbarButton: typeof currentValue.showTopToolbarButton === "boolean"
      ? currentValue.showTopToolbarButton
      : base.showTopToolbarButton,
    trackerPlacement: currentValue.trackerPlacement === "drawer" ? "drawer" : "dock",
    schemaPresets,
    displayLayout: currentValue.displayLayout?.sections?.length ? currentValue.displayLayout : base.displayLayout,
  };
}

export function mergeAutomaticSettingsPatch(currentValue: SceneMapSettings, value: unknown): SceneMapSettings {
  // Auto-saved controls send narrow patches. Whitelisting their keys prevents a
  // delayed patch from overwriting presets that were explicitly saved meanwhile.
  const current = mergeSettings(currentValue);
  if (!value || typeof value !== "object" || Array.isArray(value)) return current;
  const patch = value as Record<string, unknown>;
  const next = { ...current };
  if (typeof patch.connectionId === "string") next.connectionId = patch.connectionId;
  if (typeof patch.autoGenerateAiTrackers === "boolean") next.autoGenerateAiTrackers = patch.autoGenerateAiTrackers;
  if (typeof patch.autoGenerateInterval === "number" && Number.isFinite(patch.autoGenerateInterval)) {
    next.autoGenerateInterval = Math.max(1, Math.floor(patch.autoGenerateInterval));
  }
  if (typeof patch.maxResponseTokens === "number" && Number.isFinite(patch.maxResponseTokens)) {
    next.maxResponseTokens = Math.max(1, Math.floor(patch.maxResponseTokens));
  }
  if (patch.temperature === null || (typeof patch.temperature === "number" && Number.isFinite(patch.temperature))) {
    next.temperature = patch.temperature === null ? null : resolveSamplingParameter(patch.temperature, 0, 2);
  }
  if (patch.topP === null || (typeof patch.topP === "number" && Number.isFinite(patch.topP))) {
    next.topP = patch.topP === null ? null : resolveSamplingParameter(patch.topP, 0, 1);
  }
  if (typeof patch.includeLastXMessages === "number" && Number.isFinite(patch.includeLastXMessages)) {
    next.includeLastXMessages = Math.max(0, Math.floor(patch.includeLastXMessages));
  }
  if (typeof patch.showInputBarButton === "boolean") next.showInputBarButton = patch.showInputBarButton;
  if (typeof patch.showTopToolbarButton === "boolean") next.showTopToolbarButton = patch.showTopToolbarButton;
  if (patch.trackerPlacement === "dock" || patch.trackerPlacement === "drawer") {
    next.trackerPlacement = patch.trackerPlacement;
  }
  return mergeSettings(next);
}

export function mergePresetSettings(currentValue: SceneMapSettings, incomingValue: SceneMapSettings): SceneMapSettings {
  // The inverse boundary of mergeAutomaticSettingsPatch: an explicit preset save
  // owns only preset data and must preserve newer generation/interface settings.
  const current = mergeSettings(currentValue);
  const incoming = mergeSettings(incomingValue);
  return mergeSettings({
    ...current,
    schemaPreset: incoming.schemaPreset,
    schemaPresets: incoming.schemaPresets,
  });
}

export function getPresetPrompt(settings: SceneMapSettings, presetKey = settings.schemaPreset): string {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return typeof preset?.promptJson === "string" ? preset.promptJson : settings.promptJson;
}

export function getPresetSystemPrompt(settings: SceneMapSettings, presetKey = settings.schemaPreset): string {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return typeof preset?.systemPrompt === "string" ? preset.systemPrompt : DEFAULT_SYSTEM_PROMPT;
}

export function getPresetUserPrompt(settings: SceneMapSettings, presetKey = settings.schemaPreset): string {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  if (typeof preset?.userPrompt === "string") return preset.userPrompt;
  return migrateLegacyUserPrompt(getPresetPrompt(settings, presetKey), settings.includeLastXMessages);
}

export function migrateLegacyUserPrompt(prompt: string, includeLastXMessages: number): string {
  return `${chatHistoryMacro(includeLastXMessages)}\n\n>>> Instructions <<<\n${prompt}\n\n{{scenemap_partial_task}}`;
}

export function getPresetLayout(settings: SceneMapSettings, presetKey = settings.schemaPreset): TrackerBoardDisplayLayout {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return preset?.displayLayout?.sections?.length ? preset.displayLayout : settings.displayLayout;
}

export function resolveSamplingParameter(value: unknown, minimum: number, maximum: number, fallback = 1): number {
  const resolved = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(maximum, Math.max(minimum, resolved));
}

export function jsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => jsonValuesEqual(value, right[index]));
  }
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key)
      && jsonValuesEqual(leftRecord[key], rightRecord[key]));
}

export function schemaFingerprint(schema: Record<string, unknown>): string {
  // This is a stable provenance identifier, not a cryptographic integrity check.
  // Sorting object keys avoids treating formatting/key order as a schema change.
  const text = stableJsonStringify(schema);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJsonStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableJsonStringify(child)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function schemaToExample(schema: any, rootSchema = schema, seenRefs = new Set<string>()): unknown {
  // Build a useful prompt example without attempting to become a second JSON
  // Schema validator. createValidatedSchemaExample verifies the result afterward.
  if (!schema || typeof schema !== "object") return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.const !== undefined) return schema.const;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
  if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/")) {
    if (seenRefs.has(schema.$ref)) return null;
    const resolved = resolveLocalSchemaRef(rootSchema, schema.$ref);
    if (resolved) return schemaToExample(resolved, rootSchema, new Set([...seenRefs, schema.$ref]));
  }
  const alternatives = Array.isArray(schema.oneOf) ? schema.oneOf : Array.isArray(schema.anyOf) ? schema.anyOf : null;
  if (alternatives?.length) return schemaToExample(alternatives[0], rootSchema, seenRefs);
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const parts = schema.allOf.map((part: unknown) => schemaToExample(part, rootSchema, seenRefs));
    if (parts.every((part: unknown) => part && typeof part === "object" && !Array.isArray(part))) {
      return Object.assign({}, ...parts);
    }
    return parts.find((part: unknown) => part !== null) ?? null;
  }

  const declaredType = Array.isArray(schema.type)
    ? schema.type.find((type: unknown) => type !== "null")
    : schema.type;
  const type = declaredType ?? (schema.properties ? "object" : schema.items ? "array" : undefined);
  switch (type) {
    case "object": {
      const obj: Record<string, unknown> = {};
      const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
      for (const [key, child] of Object.entries(properties)) obj[key] = schemaToExample(child, rootSchema, seenRefs);
      return obj;
    }
    case "array": {
      const length = Math.max(0, Number.isInteger(schema.minItems) ? schema.minItems : schema.items ? 1 : 0);
      return Array.from({ length }, () => schema.items ? schemaToExample(schema.items, rootSchema, seenRefs) : null);
    }
    case "string": {
      const formatExamples: Record<string, string> = {
        date: "2026-01-01",
        time: "12:00:00Z",
        "date-time": "2026-01-01T12:00:00Z",
        email: "user@example.com",
        hostname: "example.com",
        ipv4: "192.0.2.1",
        ipv6: "2001:db8::1",
        uri: "https://example.com/",
        uuid: "123e4567-e89b-42d3-a456-426614174000",
      };
      let value = formatExamples[schema.format] ?? (typeof schema.description === "string" ? schema.description : "string");
      const minLength = Number.isInteger(schema.minLength) ? Math.max(0, schema.minLength) : 0;
      if (value.length < minLength) value = value.padEnd(minLength, "x");
      if (Number.isInteger(schema.maxLength)) value = value.slice(0, Math.max(0, schema.maxLength));
      return value;
    }
    case "number":
    case "integer": {
      const integer = type === "integer";
      const step = typeof schema.multipleOf === "number" && schema.multipleOf > 0 ? schema.multipleOf : integer ? 1 : 0.1;
      let value = typeof schema.minimum === "number" ? schema.minimum : 0;
      if (typeof schema.exclusiveMinimum === "number") value = Math.max(value, schema.exclusiveMinimum + step);
      if (schema.exclusiveMinimum === true && typeof schema.minimum === "number") value = schema.minimum + step;
      if (typeof schema.multipleOf === "number" && schema.multipleOf > 0) {
        value = Math.ceil(value / schema.multipleOf) * schema.multipleOf;
      }
      if (integer) value = Math.ceil(value);
      if (typeof schema.maximum === "number") value = Math.min(value, schema.maximum);
      if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) value = schema.exclusiveMaximum - step;
      return value;
    }
    case "boolean":
      return false;
    default:
      return null;
  }
}

function resolveLocalSchemaRef(rootSchema: unknown, ref: string): unknown {
  let current = rootSchema;
  for (const token of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function parseModelJson(content: string): object {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cleaned = (match ? match[1] : content).trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Model response must be a JSON object.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Model response is not valid JSON: ${(error as Error).message}`);
  }
}

export function renderPrompt(template: string, values: Record<string, string>): string {
  // Replace only SceneMap-owned macros. Character/persona/Lumiverse macros must
  // remain intact for the later context-aware macro resolution pass.
  return template.replace(/\{\{\s*(schema|previous_tracker|example_response|example_section)\s*\}\}/g, (_match, key) => values[key] ?? "");
}

export function humanizeTrackerKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function trackerToText(tracker: unknown, layout?: TrackerBoardDisplayLayout): string {
  if (!tracker || typeof tracker !== "object" || Array.isArray(tracker)) return "";
  const record = tracker as Record<string, unknown>;
  const progressPaths = collectProgressPaths(layout);
  // Preserve the readable legacy SceneMap summary when standard fields exist,
  // then append every custom field so personalized schemas never lose data.
  const sceneLines = renderSceneMapSummary(record, progressPaths);
  if (sceneLines.length > 0) {
    const additionalLines = renderAdditionalSceneMapFields(record, progressPaths);
    if (additionalLines.length > 0) sceneLines.push("", ...additionalLines);
    return sceneLines.join("\n");
  }

  // A fully custom schema has no standard summary, so render it generically.
  const lines: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const child = trackerValueToText(key, value, 0, key, progressPaths);
    if (child.length === 0) continue;
    if (lines.length > 0) lines.push("");
    lines.push(...child);
  }
  return lines.join("\n");
}

function renderAdditionalSceneMapFields(tracker: Record<string, unknown>, progressPaths: Set<string>): string[] {
  const standardKeys = new Set(["time", "location", "weather", "topics", "charactersPresent", "characters"]);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(tracker)) {
    if (standardKeys.has(key)) continue;
    appendAdditionalLines(lines, trackerValueToText(key, value, 0, key, progressPaths));
  }

  const topics = tracker.topics && typeof tracker.topics === "object" && !Array.isArray(tracker.topics)
    ? tracker.topics as Record<string, unknown>
    : null;
  if (topics) {
    const standardTopicKeys = new Set(["primaryTopic", "emotionalTone", "interactionTheme"]);
    const extraTopics = Object.fromEntries(
      Object.entries(topics).filter(([key]) => !standardTopicKeys.has(key)),
    );
    appendAdditionalLines(lines, trackerValueToText("topics", extraTopics, 0, "topics", progressPaths));
  } else {
    appendAdditionalLines(lines, trackerValueToText("topics", tracker.topics, 0, "topics", progressPaths));
  }

  if (!Array.isArray(tracker.charactersPresent)) {
    appendAdditionalLines(lines, trackerValueToText("charactersPresent", tracker.charactersPresent, 0, "charactersPresent", progressPaths));
  }

  if (!Array.isArray(tracker.characters)) {
    appendAdditionalLines(lines, trackerValueToText("characters", tracker.characters, 0, "characters", progressPaths));
  } else {
    const unrepresentedCharacters = tracker.characters.filter((character) => {
      if (!character || typeof character !== "object" || Array.isArray(character)) return true;
      return renderCharacterSummary(character as Record<string, unknown>, progressPaths).length === 0;
    });
    appendAdditionalLines(lines, trackerValueToText("characters", unrepresentedCharacters, 0, "characters", progressPaths));
  }

  return lines;
}

function appendAdditionalLines(lines: string[], child: string[]) {
  if (child.length === 0) return;
  if (lines.length > 0) lines.push("");
  lines.push(...child);
}

function renderSceneMapSummary(tracker: Record<string, unknown>, progressPaths: Set<string>): string[] {
  const lines: string[] = [];
  pushPrimitiveLine(lines, "Time", tracker.time, "time", progressPaths);
  pushPrimitiveLine(lines, "Location", tracker.location, "location", progressPaths);
  pushPrimitiveLine(lines, "Weather", tracker.weather, "weather", progressPaths);

  const topics = tracker.topics && typeof tracker.topics === "object" && !Array.isArray(tracker.topics)
    ? tracker.topics as Record<string, unknown>
    : null;
  if (topics) {
    const tone = [
      formatPrimitive(topics.primaryTopic),
      formatPrimitive(topics.emotionalTone),
      formatPrimitive(topics.interactionTheme),
    ].filter(Boolean);
    if (tone.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(`Scene tone: ${tone.join("; ")}.`);
    }
  }

  if (Array.isArray(tracker.charactersPresent) && tracker.charactersPresent.length > 0) {
    const present = tracker.charactersPresent.map(formatPrimitive).filter(Boolean);
    if (present.length > 0) lines.push(`Present: ${present.join(", ")}.`);
  }

  if (Array.isArray(tracker.characters) && tracker.characters.length > 0) {
    for (const character of tracker.characters) {
      if (!character || typeof character !== "object" || Array.isArray(character)) continue;
      const characterLines = renderCharacterSummary(character as Record<string, unknown>, progressPaths);
      if (characterLines.length === 0) continue;
      if (lines.length > 0) lines.push("");
      lines.push(...characterLines);
    }
  }

  return lines;
}

function pushPrimitiveLine(lines: string[], label: string, value: unknown, path: string, progressPaths: Set<string>) {
  const text = formatTrackerTextValue(path, value, progressPaths);
  if (text) lines.push(`${label}: ${text}`);
}

function renderCharacterSummary(character: Record<string, unknown>, progressPaths: Set<string>): string[] {
  const name = formatPrimitive(character.name) || "Character";
  const lines = [`${name}:`];
  for (const [key, value] of Object.entries(character)) {
    if (key === "name") continue;
    const text = formatTrackerTextValue(`characters.${key}`, value, progressPaths);
    if (!text) continue;
    lines.push(`- ${humanizeTrackerKey(key)}: ${text}`);
  }
  return lines.length > 1 ? lines : [];
}

function trackerValueToText(key: string, value: unknown, depth = 0, path = key, progressPaths = new Set<string>()): string[] {
  const indent = "  ".repeat(depth);
  const label = humanizeTrackerKey(key);
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    const lines = [`${indent}${label}:`];
    for (const item of value) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const entries = Object.entries(item as Record<string, unknown>).filter(([, child]) => child !== null && child !== undefined && child !== "");
        if (entries.length === 0) continue;
        const [firstKey, firstValue] = entries[0];
        lines.push(`${indent}- ${humanizeTrackerKey(firstKey)}: ${formatTrackerTextValue(`${path}.${firstKey}`, firstValue, progressPaths)}`);
        for (const [childKey, childValue] of entries.slice(1)) {
          lines.push(...trackerValueToText(childKey, childValue, depth + 1, `${path}.${childKey}`, progressPaths));
        }
      } else {
        lines.push(`${indent}- ${formatPrimitive(item)}`);
      }
    }
    return lines;
  }
  if (typeof value === "object") {
    const lines = [`${indent}${label}:`];
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      lines.push(...trackerValueToText(childKey, childValue, depth, `${path}.${childKey}`, progressPaths));
    }
    return lines.length > 1 ? lines : [];
  }
  return [`${indent}${label}: ${formatTrackerTextValue(path, value, progressPaths)}`];
}

function collectProgressPaths(layout?: TrackerBoardDisplayLayout): Set<string> {
  const paths = new Set<string>();
  for (const section of layout?.sections ?? []) {
    for (const field of section.fields) {
      if (field.display === "progress") paths.add(field.path);
      for (const child of field.fields ?? []) {
        if (child.display === "progress") paths.add(`${field.path}.${child.path}`);
      }
    }
  }
  return paths;
}

function formatTrackerTextValue(path: string, value: unknown, progressPaths: Set<string>): string {
  if (progressPaths.has(path)) return formatProgressText(value) || formatPrimitive(value);
  return formatPrimitive(value);
}

function formatProgressText(value: unknown): string | null {
  let numeric: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) numeric = value;
  if (typeof value === "string") {
    const ratio = value.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (ratio) {
      const current = Number(ratio[1]);
      const max = Number(ratio[2]);
      if (Number.isFinite(current) && Number.isFinite(max) && max > 0) numeric = (current / max) * 100;
    } else {
      const match = value.match(/-?\d+(?:\.\d+)?/);
      if (match) numeric = Number(match[0]);
    }
  }
  if (numeric === null || !Number.isFinite(numeric)) return null;
  const rounded = Math.round(Math.max(0, Math.min(100, numeric)));
  return `${rounded}% of 100%`;
}
