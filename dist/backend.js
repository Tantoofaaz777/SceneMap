// @bun
// src/shared.ts
var SETTINGS_PATH = "settings.json";
var CHAT_METADATA_KEY = "scenemap";
var MESSAGE_METADATA_KEY = "scenemap";
var DEFAULT_SCHEMA_VALUE = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SceneTracker",
  description: "Schema for tracking roleplay scene details",
  type: "object",
  properties: {
    time: {
      type: "string",
      description: "Format: HH:MM:SS; MM/DD/YYYY (Day Name)"
    },
    location: {
      type: "string",
      description: "Specific scene location with increasing specificity"
    },
    weather: {
      type: "string",
      description: "Current weather conditions and temperature"
    },
    topics: {
      type: "object",
      properties: {
        primaryTopic: {
          type: "string",
          description: "1-2 word main topic of interaction"
        },
        emotionalTone: {
          type: "string",
          description: "Dominant emotional tone of scene"
        },
        interactionTheme: {
          type: "string",
          description: "Type of character interaction"
        }
      },
      required: ["primaryTopic", "emotionalTone", "interactionTheme"]
    },
    charactersPresent: {
      type: "array",
      items: {
        type: "string",
        description: "Character name"
      },
      description: "List of character names present in scene"
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Character name"
          },
          hair: {
            type: "string",
            description: "Hairstyle and condition"
          },
          makeup: {
            type: "string",
            description: "Makeup description or 'None'"
          },
          outfit: {
            type: "string",
            description: "Complete outfit including underwear"
          },
          stateOfDress: {
            type: "string",
            description: "How put-together/disheveled character appears"
          },
          postureAndInteraction: {
            type: "string",
            description: "Character's physical positioning and interaction"
          }
        },
        required: ["name", "hair", "makeup", "outfit", "stateOfDress", "postureAndInteraction"]
      },
      description: "Array of character objects"
    }
  },
  required: ["time", "location", "weather", "topics", "charactersPresent", "characters"]
};
var DEFAULT_DISPLAY_LAYOUT = {
  sections: [
    {
      title: "Scene",
      fields: [
        { path: "location", label: "Location", display: "text" },
        { path: "time", label: "Time", display: "subtle" },
        { path: "weather", label: "Weather", display: "text" }
      ]
    },
    {
      title: "Topics",
      fields: [
        { path: "topics.primaryTopic", label: "Primary Topic", display: "text" },
        { path: "topics.emotionalTone", label: "Emotional Tone", display: "subtle" },
        { path: "topics.interactionTheme", label: "Interaction Theme", display: "subtle" }
      ]
    },
    {
      title: "Present",
      fields: [{ path: "charactersPresent", label: "Characters", display: "chips" }]
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
            { path: "makeup", label: "Makeup", display: "subtle" }
          ]
        }
      ]
    }
  ]
};
var DEFAULT_PROMPT_JSON = `You are a highly specialized AI assistant. Your SOLE purpose is to generate a single, valid JSON object that strictly adheres to the provided JSON schema.

CRITICAL INSTRUCTIONS:
1. You MUST wrap the entire JSON object in a markdown code block (\`\`\`json\\n...\\n\`\`\`).
2. Your response MUST NOT contain explanatory text, comments, or any content outside this single code block.
3. The JSON object inside the code block MUST be valid and conform to the schema.

JSON SCHEMA TO FOLLOW:
\`\`\`json
{{schema}}
\`\`\`

PREVIOUS TRACKER TO UPDATE:
If this object is not empty, use it as the baseline and update it instead of starting from scratch. Preserve unchanged fields unless recent chat messages clearly changed them.
\`\`\`json
{{previous_tracker}}
\`\`\`

{{example_section}}`;
var defaultSettings = {
  version: "1.0.1",
  formatVersion: "F_1.0",
  connectionId: "",
  maxResponseTokens: 16000,
  temperature: null,
  topP: null,
  autoGenerateAiTrackers: false,
  autoGenerateInterval: 1,
  showInputBarButton: true,
  trackerPlacement: "dock",
  schemaPreset: "default",
  schemaPresets: {
    default: {
      name: "Default",
      value: DEFAULT_SCHEMA_VALUE
    }
  },
  includeLastXMessages: 0,
  promptJson: DEFAULT_PROMPT_JSON,
  displayLayout: DEFAULT_DISPLAY_LAYOUT
};
function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(defaultSettings));
}
function mergeSettings(value) {
  const base = cloneDefaultSettings();
  if (!value || typeof value !== "object")
    return base;
  const currentValue = { ...value };
  delete currentValue.showMessageButtons;
  const schemaPresets = {
    ...base.schemaPresets,
    ...currentValue.schemaPresets ?? {}
  };
  return {
    ...base,
    ...currentValue,
    autoGenerateInterval: typeof currentValue.autoGenerateInterval === "number" && Number.isFinite(currentValue.autoGenerateInterval) ? Math.max(1, Math.floor(currentValue.autoGenerateInterval)) : base.autoGenerateInterval,
    maxResponseTokens: typeof currentValue.maxResponseTokens === "number" && Number.isFinite(currentValue.maxResponseTokens) ? Math.max(1, Math.floor(currentValue.maxResponseTokens)) : base.maxResponseTokens,
    temperature: typeof currentValue.temperature === "number" && Number.isFinite(currentValue.temperature) ? resolveSamplingParameter(currentValue.temperature, 0, 2) : base.temperature,
    topP: typeof currentValue.topP === "number" && Number.isFinite(currentValue.topP) ? resolveSamplingParameter(currentValue.topP, 0, 1) : base.topP,
    includeLastXMessages: typeof currentValue.includeLastXMessages === "number" && Number.isFinite(currentValue.includeLastXMessages) ? Math.max(0, Math.floor(currentValue.includeLastXMessages)) : base.includeLastXMessages,
    trackerPlacement: currentValue.trackerPlacement === "drawer" ? "drawer" : "dock",
    schemaPresets,
    displayLayout: currentValue.displayLayout?.sections?.length ? currentValue.displayLayout : base.displayLayout
  };
}
function mergeAutomaticSettingsPatch(currentValue, value) {
  const current = mergeSettings(currentValue);
  if (!value || typeof value !== "object" || Array.isArray(value))
    return current;
  const patch = value;
  const next = { ...current };
  if (typeof patch.connectionId === "string")
    next.connectionId = patch.connectionId;
  if (typeof patch.autoGenerateAiTrackers === "boolean")
    next.autoGenerateAiTrackers = patch.autoGenerateAiTrackers;
  if (typeof patch.autoGenerateInterval === "number" && Number.isFinite(patch.autoGenerateInterval)) {
    next.autoGenerateInterval = Math.max(1, Math.floor(patch.autoGenerateInterval));
  }
  if (typeof patch.maxResponseTokens === "number" && Number.isFinite(patch.maxResponseTokens)) {
    next.maxResponseTokens = Math.max(1, Math.floor(patch.maxResponseTokens));
  }
  if (patch.temperature === null || typeof patch.temperature === "number" && Number.isFinite(patch.temperature)) {
    next.temperature = patch.temperature === null ? null : resolveSamplingParameter(patch.temperature, 0, 2);
  }
  if (patch.topP === null || typeof patch.topP === "number" && Number.isFinite(patch.topP)) {
    next.topP = patch.topP === null ? null : resolveSamplingParameter(patch.topP, 0, 1);
  }
  if (typeof patch.includeLastXMessages === "number" && Number.isFinite(patch.includeLastXMessages)) {
    next.includeLastXMessages = Math.max(0, Math.floor(patch.includeLastXMessages));
  }
  if (typeof patch.showInputBarButton === "boolean")
    next.showInputBarButton = patch.showInputBarButton;
  if (patch.trackerPlacement === "dock" || patch.trackerPlacement === "drawer") {
    next.trackerPlacement = patch.trackerPlacement;
  }
  return mergeSettings(next);
}
function mergePresetSettings(currentValue, incomingValue) {
  const current = mergeSettings(currentValue);
  const incoming = mergeSettings(incomingValue);
  return mergeSettings({
    ...current,
    schemaPreset: incoming.schemaPreset,
    schemaPresets: incoming.schemaPresets
  });
}
function getPresetPrompt(settings, presetKey = settings.schemaPreset) {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return typeof preset?.promptJson === "string" ? preset.promptJson : settings.promptJson;
}
function getPresetLayout(settings, presetKey = settings.schemaPreset) {
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  return preset?.displayLayout?.sections?.length ? preset.displayLayout : settings.displayLayout;
}
function resolveSamplingParameter(value, minimum, maximum, fallback = 1) {
  const resolved = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(maximum, Math.max(minimum, resolved));
}
function schemaFingerprint(schema) {
  const text = stableJsonStringify(schema);
  let hash = 2166136261;
  for (let index = 0;index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function stableJsonStringify(value) {
  if (Array.isArray(value))
    return `[${value.map(stableJsonStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, child]) => child !== undefined).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableJsonStringify(child)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
function schemaToExample(schema, rootSchema = schema, seenRefs = new Set) {
  if (!schema || typeof schema !== "object")
    return null;
  if (schema.example !== undefined)
    return schema.example;
  if (schema.const !== undefined)
    return schema.const;
  if (schema.default !== undefined)
    return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    return schema.enum[0];
  if (typeof schema.$ref === "string" && schema.$ref.startsWith("#/")) {
    if (seenRefs.has(schema.$ref))
      return null;
    const resolved = resolveLocalSchemaRef(rootSchema, schema.$ref);
    if (resolved)
      return schemaToExample(resolved, rootSchema, new Set([...seenRefs, schema.$ref]));
  }
  const alternatives = Array.isArray(schema.oneOf) ? schema.oneOf : Array.isArray(schema.anyOf) ? schema.anyOf : null;
  if (alternatives?.length)
    return schemaToExample(alternatives[0], rootSchema, seenRefs);
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const parts = schema.allOf.map((part) => schemaToExample(part, rootSchema, seenRefs));
    if (parts.every((part) => part && typeof part === "object" && !Array.isArray(part))) {
      return Object.assign({}, ...parts);
    }
    return parts.find((part) => part !== null) ?? null;
  }
  const declaredType = Array.isArray(schema.type) ? schema.type.find((type2) => type2 !== "null") : schema.type;
  const type = declaredType ?? (schema.properties ? "object" : schema.items ? "array" : undefined);
  switch (type) {
    case "object": {
      const obj = {};
      const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
      for (const [key, child] of Object.entries(properties))
        obj[key] = schemaToExample(child, rootSchema, seenRefs);
      return obj;
    }
    case "array": {
      const length = Math.max(0, Number.isInteger(schema.minItems) ? schema.minItems : schema.items ? 1 : 0);
      return Array.from({ length }, () => schema.items ? schemaToExample(schema.items, rootSchema, seenRefs) : null);
    }
    case "string": {
      const formatExamples = {
        date: "2026-01-01",
        time: "12:00:00Z",
        "date-time": "2026-01-01T12:00:00Z",
        email: "user@example.com",
        hostname: "example.com",
        ipv4: "192.0.2.1",
        ipv6: "2001:db8::1",
        uri: "https://example.com/",
        uuid: "123e4567-e89b-42d3-a456-426614174000"
      };
      let value = formatExamples[schema.format] ?? (typeof schema.description === "string" ? schema.description : "string");
      const minLength = Number.isInteger(schema.minLength) ? Math.max(0, schema.minLength) : 0;
      if (value.length < minLength)
        value = value.padEnd(minLength, "x");
      if (Number.isInteger(schema.maxLength))
        value = value.slice(0, Math.max(0, schema.maxLength));
      return value;
    }
    case "number":
    case "integer": {
      const integer = type === "integer";
      const step = typeof schema.multipleOf === "number" && schema.multipleOf > 0 ? schema.multipleOf : integer ? 1 : 0.1;
      let value = typeof schema.minimum === "number" ? schema.minimum : 0;
      if (typeof schema.exclusiveMinimum === "number")
        value = Math.max(value, schema.exclusiveMinimum + step);
      if (schema.exclusiveMinimum === true && typeof schema.minimum === "number")
        value = schema.minimum + step;
      if (typeof schema.multipleOf === "number" && schema.multipleOf > 0) {
        value = Math.ceil(value / schema.multipleOf) * schema.multipleOf;
      }
      if (integer)
        value = Math.ceil(value);
      if (typeof schema.maximum === "number")
        value = Math.min(value, schema.maximum);
      if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum)
        value = schema.exclusiveMaximum - step;
      return value;
    }
    case "boolean":
      return false;
    default:
      return null;
  }
}
function resolveLocalSchemaRef(rootSchema, ref) {
  let current = rootSchema;
  for (const token of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return null;
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    current = current[key];
  }
  return current;
}
function parseModelJson(content) {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cleaned = (match ? match[1] : content).trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Model response must be a JSON object.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Model response is not valid JSON: ${error.message}`);
  }
}
function renderPrompt(template, values) {
  return template.replace(/\{\{\s*(schema|previous_tracker|example_response|example_section)\s*\}\}/g, (_match, key) => values[key] ?? "");
}
function humanizeTrackerKey(key) {
  return key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim().replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}
function formatPrimitive(value) {
  if (value === null || value === undefined)
    return "";
  if (typeof value === "string")
    return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}
function trackerToText(tracker, layout) {
  if (!tracker || typeof tracker !== "object" || Array.isArray(tracker))
    return "";
  const record = tracker;
  const progressPaths = collectProgressPaths(layout);
  const sceneLines = renderSceneMapSummary(record, progressPaths);
  if (sceneLines.length > 0) {
    const additionalLines = renderAdditionalSceneMapFields(record, progressPaths);
    if (additionalLines.length > 0)
      sceneLines.push("", ...additionalLines);
    return sceneLines.join(`
`);
  }
  const lines = [];
  for (const [key, value] of Object.entries(record)) {
    const child = trackerValueToText(key, value, 0, key, progressPaths);
    if (child.length === 0)
      continue;
    if (lines.length > 0)
      lines.push("");
    lines.push(...child);
  }
  return lines.join(`
`);
}
function renderAdditionalSceneMapFields(tracker, progressPaths) {
  const standardKeys = new Set(["time", "location", "weather", "topics", "charactersPresent", "characters"]);
  const lines = [];
  for (const [key, value] of Object.entries(tracker)) {
    if (standardKeys.has(key))
      continue;
    appendAdditionalLines(lines, trackerValueToText(key, value, 0, key, progressPaths));
  }
  const topics = tracker.topics && typeof tracker.topics === "object" && !Array.isArray(tracker.topics) ? tracker.topics : null;
  if (topics) {
    const standardTopicKeys = new Set(["primaryTopic", "emotionalTone", "interactionTheme"]);
    const extraTopics = Object.fromEntries(Object.entries(topics).filter(([key]) => !standardTopicKeys.has(key)));
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
      if (!character || typeof character !== "object" || Array.isArray(character))
        return true;
      return renderCharacterSummary(character, progressPaths).length === 0;
    });
    appendAdditionalLines(lines, trackerValueToText("characters", unrepresentedCharacters, 0, "characters", progressPaths));
  }
  return lines;
}
function appendAdditionalLines(lines, child) {
  if (child.length === 0)
    return;
  if (lines.length > 0)
    lines.push("");
  lines.push(...child);
}
function renderSceneMapSummary(tracker, progressPaths) {
  const lines = [];
  pushPrimitiveLine(lines, "Time", tracker.time, "time", progressPaths);
  pushPrimitiveLine(lines, "Location", tracker.location, "location", progressPaths);
  pushPrimitiveLine(lines, "Weather", tracker.weather, "weather", progressPaths);
  const topics = tracker.topics && typeof tracker.topics === "object" && !Array.isArray(tracker.topics) ? tracker.topics : null;
  if (topics) {
    const tone = [
      formatPrimitive(topics.primaryTopic),
      formatPrimitive(topics.emotionalTone),
      formatPrimitive(topics.interactionTheme)
    ].filter(Boolean);
    if (tone.length > 0) {
      if (lines.length > 0)
        lines.push("");
      lines.push(`Scene tone: ${tone.join("; ")}.`);
    }
  }
  if (Array.isArray(tracker.charactersPresent) && tracker.charactersPresent.length > 0) {
    const present = tracker.charactersPresent.map(formatPrimitive).filter(Boolean);
    if (present.length > 0)
      lines.push(`Present: ${present.join(", ")}.`);
  }
  if (Array.isArray(tracker.characters) && tracker.characters.length > 0) {
    for (const character of tracker.characters) {
      if (!character || typeof character !== "object" || Array.isArray(character))
        continue;
      const characterLines = renderCharacterSummary(character, progressPaths);
      if (characterLines.length === 0)
        continue;
      if (lines.length > 0)
        lines.push("");
      lines.push(...characterLines);
    }
  }
  return lines;
}
function pushPrimitiveLine(lines, label, value, path, progressPaths) {
  const text = formatTrackerTextValue(path, value, progressPaths);
  if (text)
    lines.push(`${label}: ${text}`);
}
function renderCharacterSummary(character, progressPaths) {
  const name = formatPrimitive(character.name) || "Character";
  const lines = [`${name}:`];
  for (const [key, value] of Object.entries(character)) {
    if (key === "name")
      continue;
    const text = formatTrackerTextValue(`characters.${key}`, value, progressPaths);
    if (!text)
      continue;
    lines.push(`- ${humanizeTrackerKey(key)}: ${text}`);
  }
  return lines.length > 1 ? lines : [];
}
function trackerValueToText(key, value, depth = 0, path = key, progressPaths = new Set) {
  const indent = "  ".repeat(depth);
  const label = humanizeTrackerKey(key);
  if (value === null || value === undefined || value === "")
    return [];
  if (Array.isArray(value)) {
    if (value.length === 0)
      return [];
    const lines = [`${indent}${label}:`];
    for (const item of value) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const entries = Object.entries(item).filter(([, child]) => child !== null && child !== undefined && child !== "");
        if (entries.length === 0)
          continue;
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
    for (const [childKey, childValue] of Object.entries(value)) {
      lines.push(...trackerValueToText(childKey, childValue, depth, `${path}.${childKey}`, progressPaths));
    }
    return lines.length > 1 ? lines : [];
  }
  return [`${indent}${label}: ${formatTrackerTextValue(path, value, progressPaths)}`];
}
function collectProgressPaths(layout) {
  const paths = new Set;
  for (const section of layout?.sections ?? []) {
    for (const field of section.fields) {
      if (field.display === "progress")
        paths.add(field.path);
      for (const child of field.fields ?? []) {
        if (child.display === "progress")
          paths.add(`${field.path}.${child.path}`);
      }
    }
  }
  return paths;
}
function formatTrackerTextValue(path, value, progressPaths) {
  if (progressPaths.has(path))
    return formatProgressText(value) || formatPrimitive(value);
  return formatPrimitive(value);
}
function formatProgressText(value) {
  let numeric = null;
  if (typeof value === "number" && Number.isFinite(value))
    numeric = value;
  if (typeof value === "string") {
    const ratio = value.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
    if (ratio) {
      const current = Number(ratio[1]);
      const max = Number(ratio[2]);
      if (Number.isFinite(current) && Number.isFinite(max) && max > 0)
        numeric = current / max * 100;
    } else {
      const match = value.match(/-?\d+(?:\.\d+)?/);
      if (match)
        numeric = Number(match[0]);
    }
  }
  if (numeric === null || !Number.isFinite(numeric))
    return null;
  const rounded = Math.round(Math.max(0, Math.min(100, numeric)));
  return `${rounded}% of 100%`;
}

// node_modules/@cfworker/json-schema/dist/deep-compare-strict.js
function deepCompareStrict(a, b) {
  const typeofa = typeof a;
  if (typeofa !== typeof b) {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }
    const length = a.length;
    if (length !== b.length) {
      return false;
    }
    for (let i = 0;i < length; i++) {
      if (!deepCompareStrict(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (typeofa === "object") {
    if (!a || !b) {
      return a === b;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    const length = aKeys.length;
    if (length !== bKeys.length) {
      return false;
    }
    for (const k of aKeys) {
      if (!deepCompareStrict(a[k], b[k])) {
        return false;
      }
    }
    return true;
  }
  return a === b;
}

// node_modules/@cfworker/json-schema/dist/pointer.js
function encodePointer(p) {
  return encodeURI(escapePointer(p));
}
function escapePointer(p) {
  return p.replace(/~/g, "~0").replace(/\//g, "~1");
}

// node_modules/@cfworker/json-schema/dist/dereference.js
var schemaArrayKeyword = {
  prefixItems: true,
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};
var schemaMapKeyword = {
  $defs: true,
  definitions: true,
  properties: true,
  patternProperties: true,
  dependentSchemas: true
};
var ignoredKeyword = {
  id: true,
  $id: true,
  $ref: true,
  $schema: true,
  $anchor: true,
  $vocabulary: true,
  $comment: true,
  default: true,
  enum: true,
  const: true,
  required: true,
  type: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};
var initialBaseURI = typeof self !== "undefined" && self.location && self.location.origin !== "null" ? new URL(self.location.origin + self.location.pathname + location.search) : new URL("https://github.com/cfworker");
function dereference(schema, lookup = Object.create(null), baseURI = initialBaseURI, basePointer = "") {
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const id = schema.$id || schema.id;
    if (id) {
      const url = new URL(id, baseURI.href);
      if (url.hash.length > 1) {
        lookup[url.href] = schema;
      } else {
        url.hash = "";
        if (basePointer === "") {
          baseURI = url;
        } else {
          dereference(schema, lookup, baseURI);
        }
      }
    }
  } else if (schema !== true && schema !== false) {
    return lookup;
  }
  const schemaURI = baseURI.href + (basePointer ? "#" + basePointer : "");
  if (lookup[schemaURI] !== undefined) {
    throw new Error(`Duplicate schema URI "${schemaURI}".`);
  }
  lookup[schemaURI] = schema;
  if (schema === true || schema === false) {
    return lookup;
  }
  if (schema.__absolute_uri__ === undefined) {
    Object.defineProperty(schema, "__absolute_uri__", {
      enumerable: false,
      value: schemaURI
    });
  }
  if (schema.$ref && schema.__absolute_ref__ === undefined) {
    const url = new URL(schema.$ref, baseURI.href);
    url.hash = url.hash;
    Object.defineProperty(schema, "__absolute_ref__", {
      enumerable: false,
      value: url.href
    });
  }
  if (schema.$recursiveRef && schema.__absolute_recursive_ref__ === undefined) {
    const url = new URL(schema.$recursiveRef, baseURI.href);
    url.hash = url.hash;
    Object.defineProperty(schema, "__absolute_recursive_ref__", {
      enumerable: false,
      value: url.href
    });
  }
  if (schema.$anchor) {
    const url = new URL("#" + schema.$anchor, baseURI.href);
    lookup[url.href] = schema;
  }
  for (let key in schema) {
    if (ignoredKeyword[key]) {
      continue;
    }
    const keyBase = `${basePointer}/${encodePointer(key)}`;
    const subSchema = schema[key];
    if (Array.isArray(subSchema)) {
      if (schemaArrayKeyword[key]) {
        const length = subSchema.length;
        for (let i = 0;i < length; i++) {
          dereference(subSchema[i], lookup, baseURI, `${keyBase}/${i}`);
        }
      }
    } else if (schemaMapKeyword[key]) {
      for (let subKey in subSchema) {
        dereference(subSchema[subKey], lookup, baseURI, `${keyBase}/${encodePointer(subKey)}`);
      }
    } else {
      dereference(subSchema, lookup, baseURI, keyBase);
    }
  }
  return lookup;
}

// node_modules/@cfworker/json-schema/dist/format.js
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
var URL_ = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
var FASTDATE = /^\d\d\d\d-[0-1]\d-[0-3]\d$/;
var FASTTIME = /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i;
var FASTDATETIME = /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i;
var FASTURIREFERENCE = /^(?:(?:[a-z][a-z0-9+-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i;
var EMAIL = (input) => {
  if (input[0] === '"')
    return false;
  const [name, host, ...rest] = input.split("@");
  if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253)
    return false;
  if (name[0] === "." || name.endsWith(".") || name.includes(".."))
    return false;
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name))
    return false;
  return host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
};
var IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
var IPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
var DURATION = (input) => input.length > 1 && input.length < 80 && (/^P\d+([.,]\d+)?W$/.test(input) || /^P[\dYMDTHS]*(\d[.,]\d+)?[YMDHS]$/.test(input) && /^P([.,\d]+Y)?([.,\d]+M)?([.,\d]+D)?(T([.,\d]+H)?([.,\d]+M)?([.,\d]+S)?)?$/.test(input));
function bind(r) {
  return r.test.bind(r);
}
var fullFormat = {
  date,
  time: time.bind(undefined, false),
  "date-time": date_time,
  duration: DURATION,
  uri,
  "uri-reference": bind(URIREF),
  "uri-template": bind(URITEMPLATE),
  url: bind(URL_),
  email: EMAIL,
  hostname: bind(HOSTNAME),
  ipv4: bind(IPV4),
  ipv6: bind(IPV6),
  regex,
  uuid: bind(UUID),
  "json-pointer": bind(JSON_POINTER),
  "json-pointer-uri-fragment": bind(JSON_POINTER_URI_FRAGMENT),
  "relative-json-pointer": bind(RELATIVE_JSON_POINTER)
};
var fastFormat = {
  ...fullFormat,
  date: bind(FASTDATE),
  time: bind(FASTTIME),
  "date-time": bind(FASTDATETIME),
  "uri-reference": bind(FASTURIREFERENCE)
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function date(str) {
  const matches = str.match(DATE);
  if (!matches)
    return false;
  const year = +matches[1];
  const month = +matches[2];
  const day = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
function time(full, str) {
  const matches = str.match(TIME);
  if (!matches)
    return false;
  const hour = +matches[1];
  const minute = +matches[2];
  const second = +matches[3];
  const timeZone = !!matches[5];
  return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
}
var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  const dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date(dateTime[0]) && time(true, dateTime[1]);
}
var NOT_URI_FRAGMENT = /\/|:/;
var URI_PATTERN = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI_PATTERN.test(str);
}
var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str))
    return false;
  try {
    new RegExp(str, "u");
    return true;
  } catch (e) {
    return false;
  }
}

// node_modules/@cfworker/json-schema/dist/ucs2-length.js
function ucs2length(s) {
  let result = 0;
  let length = s.length;
  let index = 0;
  let charCode;
  while (index < length) {
    result++;
    charCode = s.charCodeAt(index++);
    if (charCode >= 55296 && charCode <= 56319 && index < length) {
      charCode = s.charCodeAt(index);
      if ((charCode & 64512) == 56320) {
        index++;
      }
    }
  }
  return result;
}

// node_modules/@cfworker/json-schema/dist/validate.js
function validate(instance, schema, draft = "2019-09", lookup = dereference(schema), shortCircuit = true, recursiveAnchor = null, instanceLocation = "#", schemaLocation = "#", evaluated = Object.create(null)) {
  if (schema === true) {
    return { valid: true, errors: [] };
  }
  if (schema === false) {
    return {
      valid: false,
      errors: [
        {
          instanceLocation,
          keyword: "false",
          keywordLocation: instanceLocation,
          error: "False boolean schema."
        }
      ]
    };
  }
  const rawInstanceType = typeof instance;
  let instanceType;
  switch (rawInstanceType) {
    case "boolean":
    case "number":
    case "string":
      instanceType = rawInstanceType;
      break;
    case "object":
      if (instance === null) {
        instanceType = "null";
      } else if (Array.isArray(instance)) {
        instanceType = "array";
      } else {
        instanceType = "object";
      }
      break;
    default:
      throw new Error(`Instances of "${rawInstanceType}" type are not supported.`);
  }
  const { $ref, $recursiveRef, $recursiveAnchor, type: $type, const: $const, enum: $enum, required: $required, not: $not, anyOf: $anyOf, allOf: $allOf, oneOf: $oneOf, if: $if, then: $then, else: $else, format: $format, properties: $properties, patternProperties: $patternProperties, additionalProperties: $additionalProperties, unevaluatedProperties: $unevaluatedProperties, minProperties: $minProperties, maxProperties: $maxProperties, propertyNames: $propertyNames, dependentRequired: $dependentRequired, dependentSchemas: $dependentSchemas, dependencies: $dependencies, prefixItems: $prefixItems, items: $items, additionalItems: $additionalItems, unevaluatedItems: $unevaluatedItems, contains: $contains, minContains: $minContains, maxContains: $maxContains, minItems: $minItems, maxItems: $maxItems, uniqueItems: $uniqueItems, minimum: $minimum, maximum: $maximum, exclusiveMinimum: $exclusiveMinimum, exclusiveMaximum: $exclusiveMaximum, multipleOf: $multipleOf, minLength: $minLength, maxLength: $maxLength, pattern: $pattern, __absolute_ref__, __absolute_recursive_ref__ } = schema;
  const errors = [];
  if ($recursiveAnchor === true && recursiveAnchor === null) {
    recursiveAnchor = schema;
  }
  if ($recursiveRef === "#") {
    const refSchema = recursiveAnchor === null ? lookup[__absolute_recursive_ref__] : recursiveAnchor;
    const keywordLocation = `${schemaLocation}/$recursiveRef`;
    const result = validate(instance, recursiveAnchor === null ? schema : recursiveAnchor, draft, lookup, shortCircuit, refSchema, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) {
      errors.push({
        instanceLocation,
        keyword: "$recursiveRef",
        keywordLocation,
        error: "A subschema had errors."
      }, ...result.errors);
    }
  }
  if ($ref !== undefined) {
    const uri2 = __absolute_ref__ || $ref;
    const refSchema = lookup[uri2];
    if (refSchema === undefined) {
      let message = `Unresolved $ref "${$ref}".`;
      if (__absolute_ref__ && __absolute_ref__ !== $ref) {
        message += `  Absolute URI "${__absolute_ref__}".`;
      }
      message += `
Known schemas:
- ${Object.keys(lookup).join(`
- `)}`;
      throw new Error(message);
    }
    const keywordLocation = `${schemaLocation}/$ref`;
    const result = validate(instance, refSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) {
      errors.push({
        instanceLocation,
        keyword: "$ref",
        keywordLocation,
        error: "A subschema had errors."
      }, ...result.errors);
    }
    if (draft === "4" || draft === "7") {
      return { valid: errors.length === 0, errors };
    }
  }
  if (Array.isArray($type)) {
    let length = $type.length;
    let valid = false;
    for (let i = 0;i < length; i++) {
      if (instanceType === $type[i] || $type[i] === "integer" && instanceType === "number" && instance % 1 === 0 && instance === instance) {
        valid = true;
        break;
      }
    }
    if (!valid) {
      errors.push({
        instanceLocation,
        keyword: "type",
        keywordLocation: `${schemaLocation}/type`,
        error: `Instance type "${instanceType}" is invalid. Expected "${$type.join('", "')}".`
      });
    }
  } else if ($type === "integer") {
    if (instanceType !== "number" || instance % 1 || instance !== instance) {
      errors.push({
        instanceLocation,
        keyword: "type",
        keywordLocation: `${schemaLocation}/type`,
        error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
      });
    }
  } else if ($type !== undefined && instanceType !== $type) {
    errors.push({
      instanceLocation,
      keyword: "type",
      keywordLocation: `${schemaLocation}/type`,
      error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
    });
  }
  if ($const !== undefined) {
    if (instanceType === "object" || instanceType === "array") {
      if (!deepCompareStrict(instance, $const)) {
        errors.push({
          instanceLocation,
          keyword: "const",
          keywordLocation: `${schemaLocation}/const`,
          error: `Instance does not match ${JSON.stringify($const)}.`
        });
      }
    } else if (instance !== $const) {
      errors.push({
        instanceLocation,
        keyword: "const",
        keywordLocation: `${schemaLocation}/const`,
        error: `Instance does not match ${JSON.stringify($const)}.`
      });
    }
  }
  if ($enum !== undefined) {
    if (instanceType === "object" || instanceType === "array") {
      if (!$enum.some((value) => deepCompareStrict(instance, value))) {
        errors.push({
          instanceLocation,
          keyword: "enum",
          keywordLocation: `${schemaLocation}/enum`,
          error: `Instance does not match any of ${JSON.stringify($enum)}.`
        });
      }
    } else if (!$enum.some((value) => instance === value)) {
      errors.push({
        instanceLocation,
        keyword: "enum",
        keywordLocation: `${schemaLocation}/enum`,
        error: `Instance does not match any of ${JSON.stringify($enum)}.`
      });
    }
  }
  if ($not !== undefined) {
    const keywordLocation = `${schemaLocation}/not`;
    const result = validate(instance, $not, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation);
    if (result.valid) {
      errors.push({
        instanceLocation,
        keyword: "not",
        keywordLocation,
        error: 'Instance matched "not" schema.'
      });
    }
  }
  let subEvaluateds = [];
  if ($anyOf !== undefined) {
    const keywordLocation = `${schemaLocation}/anyOf`;
    const errorsLength = errors.length;
    let anyValid = false;
    for (let i = 0;i < $anyOf.length; i++) {
      const subSchema = $anyOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      anyValid = anyValid || result.valid;
      if (result.valid) {
        subEvaluateds.push(subEvaluated);
      }
    }
    if (anyValid) {
      errors.length = errorsLength;
    } else {
      errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "anyOf",
        keywordLocation,
        error: "Instance does not match any subschemas."
      });
    }
  }
  if ($allOf !== undefined) {
    const keywordLocation = `${schemaLocation}/allOf`;
    const errorsLength = errors.length;
    let allValid = true;
    for (let i = 0;i < $allOf.length; i++) {
      const subSchema = $allOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      allValid = allValid && result.valid;
      if (result.valid) {
        subEvaluateds.push(subEvaluated);
      }
    }
    if (allValid) {
      errors.length = errorsLength;
    } else {
      errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "allOf",
        keywordLocation,
        error: `Instance does not match every subschema.`
      });
    }
  }
  if ($oneOf !== undefined) {
    const keywordLocation = `${schemaLocation}/oneOf`;
    const errorsLength = errors.length;
    const matches = $oneOf.filter((subSchema, i) => {
      const subEvaluated = Object.create(evaluated);
      const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      if (result.valid) {
        subEvaluateds.push(subEvaluated);
      }
      return result.valid;
    }).length;
    if (matches === 1) {
      errors.length = errorsLength;
    } else {
      errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "oneOf",
        keywordLocation,
        error: `Instance does not match exactly one subschema (${matches} matches).`
      });
    }
  }
  if (instanceType === "object" || instanceType === "array") {
    Object.assign(evaluated, ...subEvaluateds);
  }
  if ($if !== undefined) {
    const keywordLocation = `${schemaLocation}/if`;
    const conditionResult = validate(instance, $if, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated).valid;
    if (conditionResult) {
      if ($then !== undefined) {
        const thenResult = validate(instance, $then, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/then`, evaluated);
        if (!thenResult.valid) {
          errors.push({
            instanceLocation,
            keyword: "if",
            keywordLocation,
            error: `Instance does not match "then" schema.`
          }, ...thenResult.errors);
        }
      }
    } else if ($else !== undefined) {
      const elseResult = validate(instance, $else, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/else`, evaluated);
      if (!elseResult.valid) {
        errors.push({
          instanceLocation,
          keyword: "if",
          keywordLocation,
          error: `Instance does not match "else" schema.`
        }, ...elseResult.errors);
      }
    }
  }
  if (instanceType === "object") {
    if ($required !== undefined) {
      for (const key of $required) {
        if (!(key in instance)) {
          errors.push({
            instanceLocation,
            keyword: "required",
            keywordLocation: `${schemaLocation}/required`,
            error: `Instance does not have required property "${key}".`
          });
        }
      }
    }
    const keys = Object.keys(instance);
    if ($minProperties !== undefined && keys.length < $minProperties) {
      errors.push({
        instanceLocation,
        keyword: "minProperties",
        keywordLocation: `${schemaLocation}/minProperties`,
        error: `Instance does not have at least ${$minProperties} properties.`
      });
    }
    if ($maxProperties !== undefined && keys.length > $maxProperties) {
      errors.push({
        instanceLocation,
        keyword: "maxProperties",
        keywordLocation: `${schemaLocation}/maxProperties`,
        error: `Instance does not have at least ${$maxProperties} properties.`
      });
    }
    if ($propertyNames !== undefined) {
      const keywordLocation = `${schemaLocation}/propertyNames`;
      for (const key in instance) {
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate(key, $propertyNames, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (!result.valid) {
          errors.push({
            instanceLocation,
            keyword: "propertyNames",
            keywordLocation,
            error: `Property name "${key}" does not match schema.`
          }, ...result.errors);
        }
      }
    }
    if ($dependentRequired !== undefined) {
      const keywordLocation = `${schemaLocation}/dependantRequired`;
      for (const key in $dependentRequired) {
        if (key in instance) {
          const required = $dependentRequired[key];
          for (const dependantKey of required) {
            if (!(dependantKey in instance)) {
              errors.push({
                instanceLocation,
                keyword: "dependentRequired",
                keywordLocation,
                error: `Instance has "${key}" but does not have "${dependantKey}".`
              });
            }
          }
        }
      }
    }
    if ($dependentSchemas !== undefined) {
      for (const key in $dependentSchemas) {
        const keywordLocation = `${schemaLocation}/dependentSchemas`;
        if (key in instance) {
          const result = validate(instance, $dependentSchemas[key], draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`, evaluated);
          if (!result.valid) {
            errors.push({
              instanceLocation,
              keyword: "dependentSchemas",
              keywordLocation,
              error: `Instance has "${key}" but does not match dependant schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if ($dependencies !== undefined) {
      const keywordLocation = `${schemaLocation}/dependencies`;
      for (const key in $dependencies) {
        if (key in instance) {
          const propsOrSchema = $dependencies[key];
          if (Array.isArray(propsOrSchema)) {
            for (const dependantKey of propsOrSchema) {
              if (!(dependantKey in instance)) {
                errors.push({
                  instanceLocation,
                  keyword: "dependencies",
                  keywordLocation,
                  error: `Instance has "${key}" but does not have "${dependantKey}".`
                });
              }
            }
          } else {
            const result = validate(instance, propsOrSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`);
            if (!result.valid) {
              errors.push({
                instanceLocation,
                keyword: "dependencies",
                keywordLocation,
                error: `Instance has "${key}" but does not match dependant schema.`
              }, ...result.errors);
            }
          }
        }
      }
    }
    const thisEvaluated = Object.create(null);
    let stop = false;
    if ($properties !== undefined) {
      const keywordLocation = `${schemaLocation}/properties`;
      for (const key in $properties) {
        if (!(key in instance)) {
          continue;
        }
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate(instance[key], $properties[key], draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(key)}`);
        if (result.valid) {
          evaluated[key] = thisEvaluated[key] = true;
        } else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "properties",
            keywordLocation,
            error: `Property "${key}" does not match schema.`
          }, ...result.errors);
          if (stop)
            break;
        }
      }
    }
    if (!stop && $patternProperties !== undefined) {
      const keywordLocation = `${schemaLocation}/patternProperties`;
      for (const pattern in $patternProperties) {
        const regex2 = new RegExp(pattern, "u");
        const subSchema = $patternProperties[pattern];
        for (const key in instance) {
          if (!regex2.test(key)) {
            continue;
          }
          const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
          const result = validate(instance[key], subSchema, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(pattern)}`);
          if (result.valid) {
            evaluated[key] = thisEvaluated[key] = true;
          } else {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "patternProperties",
              keywordLocation,
              error: `Property "${key}" matches pattern "${pattern}" but does not match associated schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if (!stop && $additionalProperties !== undefined) {
      const keywordLocation = `${schemaLocation}/additionalProperties`;
      for (const key in instance) {
        if (thisEvaluated[key]) {
          continue;
        }
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate(instance[key], $additionalProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (result.valid) {
          evaluated[key] = true;
        } else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "additionalProperties",
            keywordLocation,
            error: `Property "${key}" does not match additional properties schema.`
          }, ...result.errors);
        }
      }
    } else if (!stop && $unevaluatedProperties !== undefined) {
      const keywordLocation = `${schemaLocation}/unevaluatedProperties`;
      for (const key in instance) {
        if (!evaluated[key]) {
          const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
          const result = validate(instance[key], $unevaluatedProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
          if (result.valid) {
            evaluated[key] = true;
          } else {
            errors.push({
              instanceLocation,
              keyword: "unevaluatedProperties",
              keywordLocation,
              error: `Property "${key}" does not match unevaluated properties schema.`
            }, ...result.errors);
          }
        }
      }
    }
  } else if (instanceType === "array") {
    if ($maxItems !== undefined && instance.length > $maxItems) {
      errors.push({
        instanceLocation,
        keyword: "maxItems",
        keywordLocation: `${schemaLocation}/maxItems`,
        error: `Array has too many items (${instance.length} > ${$maxItems}).`
      });
    }
    if ($minItems !== undefined && instance.length < $minItems) {
      errors.push({
        instanceLocation,
        keyword: "minItems",
        keywordLocation: `${schemaLocation}/minItems`,
        error: `Array has too few items (${instance.length} < ${$minItems}).`
      });
    }
    const length = instance.length;
    let i = 0;
    let stop = false;
    if ($prefixItems !== undefined) {
      const keywordLocation = `${schemaLocation}/prefixItems`;
      const length2 = Math.min($prefixItems.length, length);
      for (;i < length2; i++) {
        const result = validate(instance[i], $prefixItems[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
        evaluated[i] = true;
        if (!result.valid) {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "prefixItems",
            keywordLocation,
            error: `Items did not match schema.`
          }, ...result.errors);
          if (stop)
            break;
        }
      }
    }
    if ($items !== undefined) {
      const keywordLocation = `${schemaLocation}/items`;
      if (Array.isArray($items)) {
        const length2 = Math.min($items.length, length);
        for (;i < length2; i++) {
          const result = validate(instance[i], $items[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "items",
              keywordLocation,
              error: `Items did not match schema.`
            }, ...result.errors);
            if (stop)
              break;
          }
        }
      } else {
        for (;i < length; i++) {
          const result = validate(instance[i], $items, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "items",
              keywordLocation,
              error: `Items did not match schema.`
            }, ...result.errors);
            if (stop)
              break;
          }
        }
      }
      if (!stop && $additionalItems !== undefined) {
        const keywordLocation2 = `${schemaLocation}/additionalItems`;
        for (;i < length; i++) {
          const result = validate(instance[i], $additionalItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation2);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "additionalItems",
              keywordLocation: keywordLocation2,
              error: `Items did not match additional items schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if ($contains !== undefined) {
      if (length === 0 && $minContains === undefined) {
        errors.push({
          instanceLocation,
          keyword: "contains",
          keywordLocation: `${schemaLocation}/contains`,
          error: `Array is empty. It must contain at least one item matching the schema.`
        });
      } else if ($minContains !== undefined && length < $minContains) {
        errors.push({
          instanceLocation,
          keyword: "minContains",
          keywordLocation: `${schemaLocation}/minContains`,
          error: `Array has less items (${length}) than minContains (${$minContains}).`
        });
      } else {
        const keywordLocation = `${schemaLocation}/contains`;
        const errorsLength = errors.length;
        let contained = 0;
        for (let j = 0;j < length; j++) {
          const result = validate(instance[j], $contains, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${j}`, keywordLocation);
          if (result.valid) {
            evaluated[j] = true;
            contained++;
          } else {
            errors.push(...result.errors);
          }
        }
        if (contained >= ($minContains || 0)) {
          errors.length = errorsLength;
        }
        if ($minContains === undefined && $maxContains === undefined && contained === 0) {
          errors.splice(errorsLength, 0, {
            instanceLocation,
            keyword: "contains",
            keywordLocation,
            error: `Array does not contain item matching schema.`
          });
        } else if ($minContains !== undefined && contained < $minContains) {
          errors.push({
            instanceLocation,
            keyword: "minContains",
            keywordLocation: `${schemaLocation}/minContains`,
            error: `Array must contain at least ${$minContains} items matching schema. Only ${contained} items were found.`
          });
        } else if ($maxContains !== undefined && contained > $maxContains) {
          errors.push({
            instanceLocation,
            keyword: "maxContains",
            keywordLocation: `${schemaLocation}/maxContains`,
            error: `Array may contain at most ${$maxContains} items matching schema. ${contained} items were found.`
          });
        }
      }
    }
    if (!stop && $unevaluatedItems !== undefined) {
      const keywordLocation = `${schemaLocation}/unevaluatedItems`;
      for (i;i < length; i++) {
        if (evaluated[i]) {
          continue;
        }
        const result = validate(instance[i], $unevaluatedItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
        evaluated[i] = true;
        if (!result.valid) {
          errors.push({
            instanceLocation,
            keyword: "unevaluatedItems",
            keywordLocation,
            error: `Items did not match unevaluated items schema.`
          }, ...result.errors);
        }
      }
    }
    if ($uniqueItems) {
      for (let j = 0;j < length; j++) {
        const a = instance[j];
        const ao = typeof a === "object" && a !== null;
        for (let k = 0;k < length; k++) {
          if (j === k) {
            continue;
          }
          const b = instance[k];
          const bo = typeof b === "object" && b !== null;
          if (a === b || ao && bo && deepCompareStrict(a, b)) {
            errors.push({
              instanceLocation,
              keyword: "uniqueItems",
              keywordLocation: `${schemaLocation}/uniqueItems`,
              error: `Duplicate items at indexes ${j} and ${k}.`
            });
            j = Number.MAX_SAFE_INTEGER;
            k = Number.MAX_SAFE_INTEGER;
          }
        }
      }
    }
  } else if (instanceType === "number") {
    if (draft === "4") {
      if ($minimum !== undefined && ($exclusiveMinimum === true && instance <= $minimum || instance < $minimum)) {
        errors.push({
          instanceLocation,
          keyword: "minimum",
          keywordLocation: `${schemaLocation}/minimum`,
          error: `${instance} is less than ${$exclusiveMinimum ? "or equal to " : ""} ${$minimum}.`
        });
      }
      if ($maximum !== undefined && ($exclusiveMaximum === true && instance >= $maximum || instance > $maximum)) {
        errors.push({
          instanceLocation,
          keyword: "maximum",
          keywordLocation: `${schemaLocation}/maximum`,
          error: `${instance} is greater than ${$exclusiveMaximum ? "or equal to " : ""} ${$maximum}.`
        });
      }
    } else {
      if ($minimum !== undefined && instance < $minimum) {
        errors.push({
          instanceLocation,
          keyword: "minimum",
          keywordLocation: `${schemaLocation}/minimum`,
          error: `${instance} is less than ${$minimum}.`
        });
      }
      if ($maximum !== undefined && instance > $maximum) {
        errors.push({
          instanceLocation,
          keyword: "maximum",
          keywordLocation: `${schemaLocation}/maximum`,
          error: `${instance} is greater than ${$maximum}.`
        });
      }
      if ($exclusiveMinimum !== undefined && instance <= $exclusiveMinimum) {
        errors.push({
          instanceLocation,
          keyword: "exclusiveMinimum",
          keywordLocation: `${schemaLocation}/exclusiveMinimum`,
          error: `${instance} is less than ${$exclusiveMinimum}.`
        });
      }
      if ($exclusiveMaximum !== undefined && instance >= $exclusiveMaximum) {
        errors.push({
          instanceLocation,
          keyword: "exclusiveMaximum",
          keywordLocation: `${schemaLocation}/exclusiveMaximum`,
          error: `${instance} is greater than or equal to ${$exclusiveMaximum}.`
        });
      }
    }
    if ($multipleOf !== undefined) {
      const remainder = instance % $multipleOf;
      if (Math.abs(0 - remainder) >= 0.00000011920929 && Math.abs($multipleOf - remainder) >= 0.00000011920929) {
        errors.push({
          instanceLocation,
          keyword: "multipleOf",
          keywordLocation: `${schemaLocation}/multipleOf`,
          error: `${instance} is not a multiple of ${$multipleOf}.`
        });
      }
    }
  } else if (instanceType === "string") {
    const length = $minLength === undefined && $maxLength === undefined ? 0 : ucs2length(instance);
    if ($minLength !== undefined && length < $minLength) {
      errors.push({
        instanceLocation,
        keyword: "minLength",
        keywordLocation: `${schemaLocation}/minLength`,
        error: `String is too short (${length} < ${$minLength}).`
      });
    }
    if ($maxLength !== undefined && length > $maxLength) {
      errors.push({
        instanceLocation,
        keyword: "maxLength",
        keywordLocation: `${schemaLocation}/maxLength`,
        error: `String is too long (${length} > ${$maxLength}).`
      });
    }
    if ($pattern !== undefined && !new RegExp($pattern, "u").test(instance)) {
      errors.push({
        instanceLocation,
        keyword: "pattern",
        keywordLocation: `${schemaLocation}/pattern`,
        error: `String does not match pattern.`
      });
    }
    if ($format !== undefined && fastFormat[$format] && !fastFormat[$format](instance)) {
      errors.push({
        instanceLocation,
        keyword: "format",
        keywordLocation: `${schemaLocation}/format`,
        error: `String does not match format "${$format}".`
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

// node_modules/@cfworker/json-schema/dist/validator.js
class Validator {
  constructor(schema, draft = "2019-09", shortCircuit = true) {
    this.schema = schema;
    this.draft = draft;
    this.shortCircuit = shortCircuit;
    this.lookup = dereference(schema);
  }
  validate(instance) {
    return validate(instance, this.schema, this.draft, this.lookup, this.shortCircuit);
  }
  addSchema(schema, id) {
    if (id) {
      schema = { ...schema, $id: id };
    }
    dereference(schema, this.lookup);
  }
}

// src/schema-validator.ts
var validTypes = new Set(["array", "boolean", "integer", "null", "number", "object", "string"]);
function validateSchemaDefinition(schema) {
  try {
    createValidator(schema).validate({});
  } catch (error) {
    throw new Error(`SceneMap schema is invalid: ${error.message}`);
  }
}
function createValidatedSchemaExample(schema) {
  const example = schemaToExample(schema);
  try {
    return createValidator(schema).validate(example).valid ? example : null;
  } catch {
    return null;
  }
}
function parseAndValidateModelJson(content, schema) {
  const parsed = parseModelJson(content);
  return validateTrackerData(parsed, schema, "Model response");
}
function validateTrackerData(data, schema, source = "Tracker data") {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${source} must be a JSON object.`);
  }
  let result;
  try {
    result = createValidator(schema).validate(data);
  } catch (error) {
    throw new Error(`SceneMap schema is invalid: ${error.message}`);
  }
  if (!result.valid) {
    throw new Error(`${source} does not match the SceneMap schema: ${formatSchemaErrors(result.errors)}`);
  }
  return data;
}
function createValidator(schema) {
  assertSchemaWellFormed(schema);
  return new Validator(schema, detectDraft(schema), false);
}
function detectDraft(schema) {
  const declaration = typeof schema.$schema === "string" ? schema.$schema : "";
  if (/draft-?0?4/i.test(declaration))
    return "4";
  if (/2019-09/i.test(declaration))
    return "2019-09";
  if (/2020-12/i.test(declaration))
    return "2020-12";
  return "7";
}
function assertSchemaWellFormed(schema, path = "#", seen = new WeakSet) {
  if (typeof schema === "boolean")
    return;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error(`${path} must be a schema object or boolean.`);
  }
  if (seen.has(schema))
    return;
  seen.add(schema);
  const record = schema;
  const types = Array.isArray(record.type) ? record.type : record.type === undefined ? [] : [record.type];
  if (types.some((type) => typeof type !== "string" || !validTypes.has(type))) {
    throw new Error(`${path}/type contains an unsupported JSON Schema type.`);
  }
  if (record.required !== undefined && (!Array.isArray(record.required) || record.required.some((key) => typeof key !== "string"))) {
    throw new Error(`${path}/required must be an array of strings.`);
  }
  if (record.enum !== undefined && (!Array.isArray(record.enum) || record.enum.length === 0)) {
    throw new Error(`${path}/enum must be a non-empty array.`);
  }
  if (record.pattern !== undefined) {
    if (typeof record.pattern !== "string")
      throw new Error(`${path}/pattern must be a string.`);
    try {
      new RegExp(record.pattern);
    } catch {
      throw new Error(`${path}/pattern is not a valid regular expression.`);
    }
  }
  for (const keyword of ["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"]) {
    const children = record[keyword];
    if (children === undefined)
      continue;
    if (!children || typeof children !== "object" || Array.isArray(children)) {
      throw new Error(`${path}/${keyword} must be an object.`);
    }
    for (const [key, child] of Object.entries(children)) {
      assertSchemaWellFormed(child, `${path}/${keyword}/${escapeJsonPointerToken(key)}`, seen);
    }
  }
  for (const keyword of ["allOf", "anyOf", "oneOf"]) {
    const children = record[keyword];
    if (children === undefined)
      continue;
    if (!Array.isArray(children) || children.length === 0)
      throw new Error(`${path}/${keyword} must be a non-empty array.`);
    children.forEach((child, index) => assertSchemaWellFormed(child, `${path}/${keyword}/${index}`, seen));
  }
  for (const keyword of ["items", "additionalItems", "contains", "additionalProperties", "propertyNames", "not", "if", "then", "else"]) {
    const child = record[keyword];
    if (child === undefined)
      continue;
    if (keyword === "items" && Array.isArray(child)) {
      child.forEach((item, index) => assertSchemaWellFormed(item, `${path}/items/${index}`, seen));
    } else {
      assertSchemaWellFormed(child, `${path}/${keyword}`, seen);
    }
  }
}
function formatSchemaErrors(errors) {
  const meaningful = errors.filter((error) => !["properties", "items"].includes(error.keyword));
  const selected = (meaningful.length > 0 ? meaningful : errors).slice(0, 6);
  const messages = selected.map((error) => {
    let path = error.instanceLocation === "#" ? "" : error.instanceLocation.replace(/^#/, "");
    let message = error.error;
    if (error.keyword === "required") {
      const match = message.match(/required property "([^"]+)"/i);
      if (match)
        path = `${path}/${escapeJsonPointerToken(match[1])}`;
    }
    if (error.keyword === "type") {
      const match = message.match(/Expected "([^"]+)"/i);
      if (match)
        message = `must be ${match[1]}`;
    }
    if (error.keyword === "format") {
      const match = message.match(/format "([^"]+)"/i);
      if (match)
        message = `must match format "${match[1]}"`;
    }
    return `${path || "/"} ${message}`;
  });
  if (errors.length > selected.length)
    messages.push(`and ${errors.length - selected.length} more`);
  return messages.join("; ");
}
function escapeJsonPointerToken(value) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

// src/generation-registry.ts
class GenerationRegistry {
  items = new Map;
  get(userId) {
    return this.items.get(userId) ?? null;
  }
  getMessageId(userId) {
    return this.get(userId)?.messageId ?? null;
  }
  start(userId, controller) {
    if (this.items.has(userId))
      throw new Error("SceneMap generation is already active for this user.");
    const generation = { messageId: null, userId, controller };
    this.items.set(userId, generation);
    return generation;
  }
  setMessageId(generation, messageId) {
    if (this.items.get(generation.userId) === generation)
      generation.messageId = messageId;
  }
  cancel(generation) {
    if (this.items.get(generation.userId) !== generation)
      return;
    generation.controller.abort();
  }
  finish(generation) {
    if (this.items.get(generation.userId) === generation)
      this.items.delete(generation.userId);
  }
}

// src/tracker-metadata.ts
function mergeTrackerMetadata(metadata, data, swipeId, provenance, now = new Date().toISOString()) {
  const existing = getTrackerStore(metadata);
  const swipes = existing?.swipes && typeof existing.swipes === "object" && !Array.isArray(existing.swipes) ? { ...existing.swipes } : {};
  if (existing && "value" in existing) {
    const legacySwipeId = typeof existing.swipeId === "number" ? existing.swipeId : swipeId;
    swipes[String(legacySwipeId)] ??= {
      value: existing.value,
      updatedAt: typeof existing.updatedAt === "string" ? existing.updatedAt : now
    };
  }
  swipes[String(swipeId)] = {
    value: data,
    updatedAt: now,
    ...provenance ?? {}
  };
  return {
    ...metadata ?? {},
    [MESSAGE_METADATA_KEY]: {
      version: 3,
      swipes,
      updatedAt: now
    }
  };
}
function getTrackerStore(metadata) {
  const data = metadata?.[MESSAGE_METADATA_KEY];
  if (!data || typeof data !== "object" || Array.isArray(data))
    return null;
  return data;
}

// src/keyed-async-queue.ts
class KeyedAsyncQueue {
  tails = new Map;
  enqueue(key, task) {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const result = previous.catch(() => {
      return;
    }).then(task);
    const tail = result.then(() => {
      return;
    }, () => {
      return;
    });
    this.tails.set(key, tail);
    tail.then(() => {
      if (this.tails.get(key) === tail)
        this.tails.delete(key);
    });
    return result;
  }
}

// src/swipe-snapshot.ts
function captureSwipeSnapshot(message, swipeId) {
  let content;
  if (Array.isArray(message.swipes))
    content = message.swipes[swipeId];
  if (content === undefined && (message.swipe_id ?? 0) === swipeId)
    content = message.content;
  if (typeof content !== "string")
    return null;
  const date2 = Array.isArray(message.swipe_dates) && Number.isFinite(message.swipe_dates[swipeId]) ? message.swipe_dates[swipeId] : null;
  return { content, date: date2 };
}
function swipeSnapshotMatches(snapshot, message, swipeId) {
  const current = captureSwipeSnapshot(message, swipeId);
  if (!current || current.content !== snapshot.content)
    return false;
  if (snapshot.date !== null && current.date !== null && current.date !== snapshot.date)
    return false;
  return true;
}

// src/group-character-context.ts
function resolveMessageCharacterId(chat, message) {
  const fallback = cleanId(chat.character_id);
  const metadata = chat.metadata;
  const isGroup = metadata?.group === true || metadata?.group === 1;
  if (!isGroup)
    return fallback;
  const memberIds = Array.isArray(metadata?.character_ids) ? metadata.character_ids.map(cleanId).filter((id) => id !== null) : [];
  const messageCharacterId = cleanId(message?.extra?.character_id);
  if (!messageCharacterId || !memberIds.includes(messageCharacterId))
    return fallback;
  return messageCharacterId;
}
function cleanId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// src/tracker-history.ts
function getPreviousTrackerJson(messages, targetId, current, readTracker) {
  const targetIndex = messages.findIndex((message) => message.id === targetId);
  if (targetIndex === -1)
    return "{}";
  const targetTracker = readTracker(messages[targetIndex]);
  if (targetTracker && trackerComesFromAnotherPreset(targetTracker, current)) {
    return serializeTracker(targetTracker.value);
  }
  for (let i = targetIndex - 1;i >= 0; i -= 1) {
    const tracker = readTracker(messages[i]);
    if (tracker)
      return serializeTracker(tracker.value);
  }
  return "{}";
}
function trackerComesFromAnotherPreset(tracker, current) {
  return tracker.presetKey !== current.presetKey || tracker.schemaHash !== current.schemaHash;
}
function serializeTracker(value) {
  return JSON.stringify(value, null, 2) ?? "{}";
}

// src/abortable.ts
function cancellationError() {
  const error = new Error("SceneMap generation was cancelled.");
  error.name = "AbortError";
  return error;
}
function raceWithAbort(operation, signal) {
  if (signal.aborted)
    return Promise.reject(cancellationError());
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(cancellationError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then((value) => {
      signal.removeEventListener("abort", onAbort);
      resolve(value);
    }, (error) => {
      signal.removeEventListener("abort", onAbort);
      reject(error);
    });
  });
}

// src/backend.ts
var activeGenerations = new GenerationRegistry;
var statePushQueue = new KeyedAsyncQueue;
var settingsSaveQueue = new KeyedAsyncQueue;
var STATE_BUILD_TIMEOUT_MS = 1e4;
var macroLayoutsByChatId = new Map;
var alternateCharacterFields = ["description", "personality", "scenario"];
async function loadSettings(userId) {
  return mergeSettings(await spindle.userStorage.getJson(SETTINGS_PATH, {
    fallback: defaultSettings,
    userId
  }));
}
async function saveSettings(settings, userId) {
  await spindle.userStorage.setJson(SETTINGS_PATH, mergeSettings(settings), { indent: 2, userId });
}
async function saveAutomaticSettingsPatch(value, userId) {
  const current = await loadSettings(userId);
  await saveSettings(mergeAutomaticSettingsPatch(current, value), userId);
}
async function savePresetSettings(settings, userId) {
  for (const preset of Object.values(settings.schemaPresets))
    validateSchemaDefinition(preset.value);
  const current = await loadSettings(userId);
  await saveSettings(mergePresetSettings(current, settings), userId);
}
function getActiveSwipeId(message) {
  return typeof message?.swipe_id === "number" && Number.isFinite(message.swipe_id) ? message.swipe_id : 0;
}
function getActiveGenerationMessageId(userId) {
  return activeGenerations.getMessageId(userId);
}
function throwIfGenerationCancelled(signal) {
  if (!signal.aborted)
    return;
  const error = new Error("SceneMap generation was cancelled.");
  error.name = "AbortError";
  throw error;
}
function withTimeout(operation, timeoutMs, message) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timer)
      clearTimeout(timer);
  });
}
function isGenerationResponse(value) {
  return Boolean(value && typeof value === "object" && typeof value.content === "string");
}
async function generateQuiet(input) {
  const result = await spindle.generate.quiet({ ...input, type: "quiet" });
  if (!isGenerationResponse(result)) {
    throw new Error("Lumiverse returned an invalid response for SceneMap generation.");
  }
  return result;
}
function getTrackerStore2(message) {
  const data = message?.metadata?.[MESSAGE_METADATA_KEY];
  if (!data || typeof data !== "object")
    return null;
  return data;
}
function getTrackerFromStore(store, swipeId) {
  if (!store)
    return null;
  const swipes = store.swipes;
  if (swipes && typeof swipes === "object" && !Array.isArray(swipes)) {
    const item = swipes[String(swipeId)];
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item;
      if (!("value" in record))
        return null;
      return {
        value: record.value,
        presetKey: typeof record.presetKey === "string" ? record.presetKey : null,
        schemaHash: typeof record.schemaHash === "string" ? record.schemaHash : null
      };
    }
  }
  if ("value" in store) {
    const legacySwipeId = store.swipeId;
    if (typeof legacySwipeId !== "number" || legacySwipeId === swipeId) {
      return {
        value: store.value,
        presetKey: typeof store.presetKey === "string" ? store.presetKey : null,
        schemaHash: typeof store.schemaHash === "string" ? store.schemaHash : null
      };
    }
  }
  return null;
}
function getMessageTracker(message) {
  return getTrackerFromStore(getTrackerStore2(message), getActiveSwipeId(message))?.value ?? null;
}
function withoutTrackerMetadata(message) {
  const next = { ...message.metadata ?? {} };
  const existing = getTrackerStore2(message);
  const swipeId = getActiveSwipeId(message);
  const swipes = existing?.swipes && typeof existing.swipes === "object" && !Array.isArray(existing.swipes) ? { ...existing.swipes } : {};
  if (existing && "value" in existing) {
    const legacySwipeId = typeof existing.swipeId === "number" ? existing.swipeId : swipeId;
    swipes[String(legacySwipeId)] ??= {
      value: existing.value,
      updatedAt: typeof existing.updatedAt === "string" ? existing.updatedAt : new Date().toISOString()
    };
  }
  delete swipes[String(swipeId)];
  if (Object.keys(swipes).length === 0) {
    delete next[MESSAGE_METADATA_KEY];
  } else {
    next[MESSAGE_METADATA_KEY] = {
      version: 3,
      swipes,
      updatedAt: new Date().toISOString()
    };
  }
  return next;
}
function getLatestTrackerEntry(messages) {
  for (let i = messages.length - 1;i >= 0; i -= 1) {
    if (messages[i].role !== "assistant")
      continue;
    const stored = getTrackerFromStore(getTrackerStore2(messages[i]), getActiveSwipeId(messages[i]));
    if (stored?.value) {
      return {
        messageId: messages[i].id,
        swipeId: getActiveSwipeId(messages[i]),
        data: stored.value,
        presetKey: stored.presetKey,
        schemaHash: stored.schemaHash,
        schemaMatchesCurrent: false
      };
    }
  }
  return null;
}
function countAssistantMessagesAfter(messages, messageId) {
  const index = messages.findIndex((message) => message.id === messageId);
  if (index === -1)
    return 0;
  return messages.slice(index + 1).filter((message) => message.role === "assistant").length;
}
function countAssistantMessagesBetween(messages, afterMessageId, throughMessageId) {
  const startIndex = afterMessageId ? messages.findIndex((message) => message.id === afterMessageId) + 1 : 0;
  const endIndex = messages.findIndex((message) => message.id === throughMessageId);
  if (endIndex === -1)
    return 0;
  return messages.slice(Math.max(0, startIndex), endIndex + 1).filter((message) => message.role === "assistant").length;
}
function findLatestAssistantMessage(messages) {
  for (let i = messages.length - 1;i >= 0; i -= 1) {
    if (messages[i].role === "assistant")
      return messages[i];
  }
  return null;
}
function getAutoGenerateMessagesRemaining(settings, messages, latest, activeMessage) {
  if (!settings.autoGenerateAiTrackers || !activeMessage || activeMessage.role !== "assistant")
    return null;
  const interval = Math.max(1, Math.floor(settings.autoGenerateInterval || 1));
  const messagesDue = latest ? countAssistantMessagesAfter(messages, latest.messageId) : countAssistantMessagesBetween(messages, null, activeMessage.id);
  return Math.max(0, interval - messagesDue);
}
function trimMessagesForPrompt(messages, targetId, includeLastXMessages) {
  const targetIndex = messages.findIndex((message) => message.id === targetId);
  const end = targetIndex === -1 ? messages.length : targetIndex + 1;
  const start = includeLastXMessages > 0 ? Math.max(0, end - includeLastXMessages) : 0;
  return messages.slice(start, end).map((message) => ({
    role: message.role,
    content: message.content
  }));
}
async function resolvePromptMessages(messages, context) {
  return Promise.all(messages.map(async (message) => ({
    ...message,
    content: await resolveDisplayText(message.content, context)
  })));
}
async function listConnections(userId) {
  try {
    const connections = await spindle.connections.list(userId);
    return connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
      provider: conn.provider,
      model: conn.model,
      is_default: conn.is_default
    }));
  } catch {
    return [];
  }
}
async function getActiveContext(userId) {
  const chat = await spindle.chats.getActive(userId);
  if (!chat)
    return { chat: null, messages: [] };
  const messages = await spindle.chat.getMessages(chat.id);
  return { chat, messages };
}
async function resolveTrackerDisplayData(value, context) {
  if (typeof value === "string")
    return resolveDisplayText(value, context);
  if (Array.isArray(value))
    return Promise.all(value.map((item) => resolveTrackerDisplayData(item, context)));
  if (!value || typeof value !== "object")
    return value;
  const entries = await Promise.all(Object.entries(value).map(async ([key, child]) => [
    key,
    await resolveTrackerDisplayData(child, context)
  ]));
  return Object.fromEntries(entries);
}
async function buildReferencePromptMessages(chat, userId, characterId) {
  const context = {
    chatId: chat.id,
    characterId,
    userId
  };
  const [characterContext, personaReference, activeWorldInfo] = await Promise.all([
    buildCharacterContext(chat, userId, characterId),
    buildPersonaReference(chat, userId, characterId),
    buildActiveWorldInfo(chat.id, userId)
  ]);
  const worldInfoReference = separatedReferenceBlock("World Info", [
    characterContext.scenario,
    ...activeWorldInfo
  ]);
  const sections = [characterContext.reference, personaReference, worldInfoReference].filter(Boolean);
  return Promise.all(sections.map(async (content) => ({
    role: "system",
    content: await resolveDisplayText(content, context)
  })));
}
async function buildCharacterContext(chat, userId, characterId) {
  if (!characterId)
    return { reference: null, scenario: "" };
  try {
    const character = await spindle.characters.get(characterId, userId);
    if (!character)
      return { reference: null, scenario: "" };
    const effectiveCharacter = resolveCharacterAlternateFields(character, chat);
    return {
      reference: separatedReferenceBlock("{{char}}", [
        compactText(effectiveCharacter.description),
        compactText(effectiveCharacter.personality)
      ]),
      scenario: compactText(effectiveCharacter.scenario)
    };
  } catch (error) {
    spindle.log.warn(`SceneMap could not read character card context: ${error.message}`);
    return { reference: null, scenario: "" };
  }
}
async function buildPersonaReference(chat, userId, characterId) {
  try {
    const persona = await spindle.personas.getActive(userId) ?? await spindle.personas.getDefault(userId);
    if (!persona)
      return null;
    const resolvedPersona = await resolvePersonaMacro(chat, userId, persona.description, characterId);
    return separatedReferenceBlock("{{user}}", [
      compactText(resolvedPersona)
    ]);
  } catch (error) {
    spindle.log.warn(`SceneMap could not read persona context: ${error.message}`);
    return null;
  }
}
async function buildActiveWorldInfo(chatId, userId) {
  try {
    const activated = await spindle.world_books.getActivated(chatId, userId);
    if (!activated.length)
      return [];
    const entries = await Promise.all(activated.map(async (entry) => {
      try {
        const fullEntry = await spindle.world_books.entries.get(entry.id, userId);
        return compactText(fullEntry?.content);
      } catch (error) {
        spindle.log.warn(`SceneMap could not read active world info entry ${String(entry.id)}: ${error.message}`);
        return "";
      }
    }));
    return entries.filter(Boolean);
  } catch (error) {
    spindle.log.warn(`SceneMap could not read active world info context: ${error.message}`);
    return [];
  }
}
function resolveCharacterAlternateFields(character, chat) {
  const selections = getCharacterAlternateFieldSelections(character, chat);
  const alternateFields = getRecord(character.extensions?.alternate_fields);
  if (!selections || !alternateFields)
    return character;
  const overrides = {};
  for (const field of alternateCharacterFields) {
    const variantId = compactText(selections[field]);
    if (!variantId)
      continue;
    const variants = alternateFields[field];
    if (!Array.isArray(variants))
      continue;
    const variant = variants.find((item) => {
      const record = getRecord(item);
      return record ? compactText(record.id) === variantId : false;
    });
    const content = compactText(getRecord(variant)?.content);
    if (content)
      overrides[field] = content;
  }
  return Object.keys(overrides).length > 0 ? { ...character, ...overrides } : character;
}
function getCharacterAlternateFieldSelections(character, chat) {
  const metadata = chat.metadata;
  if (!metadata)
    return null;
  if (metadata.group === true) {
    const byCharacter = getRecord(metadata.group_alternate_field_selections);
    const characterId = compactText(character.id);
    const groupSelections = characterId ? getRecord(byCharacter?.[characterId]) : null;
    if (groupSelections)
      return groupSelections;
    if (chat.character_id && characterId && chat.character_id !== characterId)
      return null;
  }
  return getRecord(metadata.alternate_field_selections);
}
function separatedReferenceBlock(label, parts) {
  const body = parts.map(compactText).filter(Boolean).join(`

`);
  return body ? `>>> ${label} <<<
${body}` : null;
}
function wrapInstructions(text) {
  const body = compactText(text);
  return body ? `>>> Instructions <<<
${body}` : "";
}
function getRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
async function resolvePersonaMacro(chat, userId, fallback, characterId) {
  try {
    const result = await spindle.macros.resolve("{{persona}}", {
      chatId: chat.id,
      characterId: characterId || undefined,
      userId,
      commit: false
    });
    const text = compactText(result.text);
    return text && text !== "{{persona}}" ? text : compactText(fallback);
  } catch (error) {
    spindle.log.warn(`SceneMap could not resolve persona add-ons: ${error.message}`);
    return compactText(fallback);
  }
}
function compactText(value) {
  return typeof value === "string" ? value.replace(/\r\n/g, `
`).trim() : "";
}
async function resolveDisplayText(text, context) {
  if (!text.includes("{{"))
    return text;
  try {
    const result = await spindle.macros.resolve(text, {
      chatId: context.chatId,
      characterId: context.characterId || undefined,
      userId: context.userId,
      commit: false
    });
    return result.text;
  } catch (error) {
    spindle.log.warn(`SceneMap macro display resolve failed: ${error.message}`);
    return text;
  }
}
async function buildState(userId) {
  const settings = await loadSettings(userId);
  const { chat, messages } = await getActiveContext(userId);
  const effectivePresetKey = getChatPresetKey(chat, settings);
  const latest = getLatestTrackerEntry(messages);
  const effectivePreset = settings.schemaPresets[effectivePresetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const effectiveSchemaHash = schemaFingerprint(effectivePreset.value);
  if (latest)
    latest.schemaMatchesCurrent = latest.schemaHash === effectiveSchemaHash;
  const activeMessage = findLatestAssistantMessage(messages);
  if (latest && chat) {
    const trackerMessage = messages.find((message) => message.id === latest.messageId);
    latest.displayData = await resolveTrackerDisplayData(latest.data, {
      chatId: chat.id,
      characterId: resolveMessageCharacterId(chat, trackerMessage),
      userId
    });
  }
  const connections = await listConnections(userId);
  const activeGeneration = activeGenerations.get(userId);
  return {
    settings,
    chatId: chat?.id ?? null,
    effectivePresetKey,
    latest,
    messagesBehind: latest ? countAssistantMessagesAfter(messages, latest.messageId) : 0,
    autoGenerateMessagesRemaining: getAutoGenerateMessagesRemaining(settings, messages, latest, activeMessage),
    activeMessageId: activeMessage?.id ?? null,
    activeSwipeId: activeMessage ? getActiveSwipeId(activeMessage) : null,
    generationActive: activeGeneration !== null,
    generatingMessageId: activeGeneration?.messageId ?? null,
    connections
  };
}
function pushState(userId, response = {}) {
  return statePushQueue.enqueue(userId, async () => {
    const state = await withTimeout(buildState(userId), STATE_BUILD_TIMEOUT_MS, "SceneMap timed out while refreshing its state.");
    if (state.chatId) {
      const preset = state.settings.schemaPresets[state.effectivePresetKey] ?? state.settings.schemaPresets[state.settings.schemaPreset] ?? state.settings.schemaPresets.default;
      macroLayoutsByChatId.set(state.chatId, {
        layout: getPresetLayout(state.settings, state.effectivePresetKey),
        schemaHash: schemaFingerprint(preset.value)
      });
    }
    spindle.sendToFrontend({ type: "state", state, ...response }, userId);
  });
}
function pushStateInBackground(userId) {
  pushState(userId).catch((error) => {
    spindle.log.warn(`SceneMap state refresh failed: ${error.message}`);
  });
}
function sendGenerationStatus(userId, cancelling = false) {
  const generation = activeGenerations.get(userId);
  spindle.sendToFrontend({
    type: "generation_status",
    active: generation !== null,
    messageId: generation?.messageId ?? null,
    cancelling: generation !== null && cancelling
  }, userId);
}
async function resolveSceneMapMacro(context) {
  const chatId = context.env?.chat?.id;
  if (typeof chatId !== "string" || !chatId)
    return "";
  try {
    const messages = await spindle.chat.getMessages(chatId);
    const latest = getLatestTrackerEntry(messages);
    if (!latest)
      return "";
    const cached = macroLayoutsByChatId.get(chatId);
    const layout = cached && latest.schemaHash === cached.schemaHash ? cached.layout : undefined;
    return trackerToText(latest.data, layout);
  } catch (error) {
    spindle.log.warn(`SceneMap macro resolution failed: ${error.message}`);
    return "";
  }
}
async function updateChatPreset(chatId, presetKey, userId) {
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat)
    throw new Error("Active chat not found.");
  await spindle.chats.update(chatId, {
    metadata: {
      ...chat.metadata ?? {},
      [CHAT_METADATA_KEY]: {
        ...chat.metadata?.[CHAT_METADATA_KEY] ?? {},
        schemaPreset: presetKey
      }
    }
  }, userId);
}
function getChatPresetKey(chat, settings) {
  const meta = chat?.metadata?.[CHAT_METADATA_KEY];
  const key = meta && typeof meta === "object" ? meta.schemaPreset : null;
  return typeof key === "string" && settings.schemaPresets[key] ? key : settings.schemaPreset;
}
function removeLegacyExampleSection(template) {
  return template.replace(/EXAMPLE OF A PERFECT RESPONSE:\s*```json\s*\{\{\s*example_response\s*\}\}\s*```/gi, "");
}
async function generateTracker(userId, expectedLatestMessageId) {
  if (!userId)
    throw new Error("SceneMap needs a user context before generating a tracker.");
  const activeGeneration = activeGenerations.get(userId);
  if (activeGeneration) {
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
    return;
  }
  const controller = new AbortController;
  const generation = activeGenerations.start(userId, controller);
  sendGenerationStatus(userId);
  try {
    throwIfGenerationCancelled(controller.signal);
    const { chat, messages } = await raceWithAbort(getActiveContext(userId), controller.signal);
    if (!chat)
      throw new Error("Open a chat before generating a SceneMap tracker.");
    const target = findLatestAssistantMessage(messages);
    if (!target)
      throw new Error("No assistant message found for SceneMap.");
    if (expectedLatestMessageId && target.id !== expectedLatestMessageId)
      return;
    activeGenerations.setMessageId(generation, target.id);
    sendGenerationStatus(userId);
    const targetSwipeId = getActiveSwipeId(target);
    const targetSwipeSnapshot = captureSwipeSnapshot(target, targetSwipeId);
    if (!targetSwipeSnapshot)
      throw new Error("SceneMap could not read the target swipe.");
    const settings = await raceWithAbort(loadSettings(userId), controller.signal);
    const presetKey = getChatPresetKey(chat, settings);
    const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
    validateSchemaDefinition(preset.value);
    const currentSchemaHash = schemaFingerprint(preset.value);
    const previousTracker = getPreviousTrackerJson(messages, target.id, { presetKey, schemaHash: currentSchemaHash }, (message) => getTrackerFromStore(getTrackerStore2(message), getActiveSwipeId(message)));
    const schemaExample = createValidatedSchemaExample(preset.value);
    const exampleResponse = schemaExample === null ? "" : JSON.stringify(schemaExample, null, 2);
    const exampleSection = schemaExample === null ? "" : `EXAMPLE OF A PERFECT RESPONSE:
\`\`\`json
${exampleResponse}
\`\`\``;
    const rawPromptTemplate = getPresetPrompt(settings, presetKey);
    const promptTemplate = schemaExample === null ? removeLegacyExampleSection(rawPromptTemplate) : rawPromptTemplate;
    const finalPrompt = renderPrompt(promptTemplate, {
      schema: JSON.stringify(preset.value, null, 2),
      previous_tracker: previousTracker,
      example_response: exampleResponse,
      example_section: exampleSection
    });
    const characterId = resolveMessageCharacterId(chat, target);
    const context = { chatId: chat.id, characterId, userId };
    const promptMessages = await raceWithAbort(resolvePromptMessages(trimMessagesForPrompt(messages, target.id, settings.includeLastXMessages), context), controller.signal);
    const referenceMessages = await raceWithAbort(buildReferencePromptMessages(chat, userId, characterId), controller.signal);
    promptMessages.unshift(...referenceMessages);
    promptMessages.push({ role: "user", content: wrapInstructions(finalPrompt) });
    spindle.toast.info("Mapping this scene...", { title: "SceneMap", userId });
    const result = await raceWithAbort(generateQuiet({
      messages: promptMessages,
      connection_id: settings.connectionId || undefined,
      userId,
      parameters: {
        max_tokens: Math.max(1, Math.floor(settings.maxResponseTokens)),
        temperature: resolveSamplingParameter(settings.temperature, 0, 2),
        top_p: resolveSamplingParameter(settings.topP, 0, 1)
      },
      signal: controller.signal
    }), controller.signal);
    throwIfGenerationCancelled(controller.signal);
    const parsed = parseAndValidateModelJson(result.content, preset.value);
    const currentMessages = await raceWithAbort(spindle.chat.getMessages(chat.id), controller.signal);
    const currentTarget = currentMessages.find((message) => message.id === target.id);
    if (!currentTarget)
      throw new Error("SceneMap target message was deleted during generation.");
    if (!swipeSnapshotMatches(targetSwipeSnapshot, currentTarget, targetSwipeId)) {
      throw new Error("SceneMap target swipe changed during generation. Generate the tracker again.");
    }
    await raceWithAbort(spindle.chat.updateMessage(chat.id, target.id, {
      metadata: mergeTrackerMetadata(currentTarget.metadata, parsed, targetSwipeId, {
        presetKey,
        schemaHash: currentSchemaHash
      })
    }), controller.signal);
    spindle.toast.success("Tracker updated.", { title: "SceneMap", userId });
  } catch (error) {
    if (error.name !== "AbortError") {
      throw error;
    }
  } finally {
    activeGenerations.finish(generation);
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
  }
}
function cancelTrackerGeneration(userId) {
  const generation = activeGenerations.get(userId);
  if (!generation) {
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
    return;
  }
  activeGenerations.cancel(generation);
  sendGenerationStatus(userId, true);
  spindle.toast.info("SceneMap generation cancellation requested.", { userId });
}
async function maybeAutoGenerateTracker(messageId, userId) {
  const settings = await loadSettings(userId);
  if (!settings.autoGenerateAiTrackers) {
    await pushState(userId);
    return;
  }
  const interval = Math.max(1, Math.floor(settings.autoGenerateInterval || 1));
  const { messages } = await getActiveContext(userId);
  const target = findLatestAssistantMessage(messages);
  if (!target || target.id !== messageId) {
    await pushState(userId);
    return;
  }
  if (getMessageTracker(target)) {
    await pushState(userId);
    return;
  }
  if (getActiveGenerationMessageId(userId)) {
    await pushState(userId);
    return;
  }
  const latest = getLatestTrackerEntry(messages);
  const messagesDue = countAssistantMessagesBetween(messages, latest?.messageId ?? null, target.id);
  if (messagesDue >= interval) {
    await generateTracker(userId, target.id);
  } else {
    await pushState(userId);
  }
}
async function editTracker(chatId, messageId, swipeId, data, userId) {
  if (!userId)
    throw new Error("SceneMap needs a user context before editing a tracker.");
  if (!chatId)
    throw new Error("Tracker chat is missing.");
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat)
    throw new Error("Tracker chat was not found.");
  if (!Number.isInteger(swipeId) || swipeId < 0)
    throw new Error("Tracker swipe is invalid.");
  const messages = await spindle.chat.getMessages(chatId);
  const message = messages.find((item) => item.id === messageId);
  if (!message)
    throw new Error("Message not found.");
  if (Array.isArray(message.swipes) && swipeId >= message.swipes.length) {
    throw new Error("Tracker swipe was removed while the editor was open.");
  }
  const settings = await loadSettings(userId);
  const presetKey = getChatPresetKey(chat, settings);
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const currentSchemaHash = schemaFingerprint(preset.value);
  const storedTracker = getTrackerFromStore(getTrackerStore2(message), swipeId);
  if (!storedTracker || storedTracker.schemaHash !== currentSchemaHash) {
    throw new Error("This tracker was generated with another or unknown schema. Regenerate it before editing.");
  }
  const validatedData = validateTrackerData(data, preset.value);
  await spindle.chat.updateMessage(chatId, messageId, {
    metadata: mergeTrackerMetadata(message.metadata, validatedData, swipeId, {
      presetKey,
      schemaHash: currentSchemaHash
    })
  });
  spindle.toast.success("Tracker saved.", { title: "SceneMap", userId });
  await pushState(userId);
}
async function deleteTracker(messageId, userId) {
  if (!userId)
    throw new Error("SceneMap needs a user context before deleting a tracker.");
  const { chat, messages } = await getActiveContext(userId);
  if (!chat)
    throw new Error("Open a chat before deleting a tracker.");
  const message = messages.find((item) => item.id === messageId);
  if (!message)
    throw new Error("Message not found.");
  const { confirmed } = await spindle.modal.confirm({
    title: "Delete Tracker",
    message: "This will permanently remove SceneMap data from this message.",
    variant: "danger",
    confirmLabel: "Delete",
    userId
  });
  if (!confirmed)
    return;
  const currentMessages = await spindle.chat.getMessages(chat.id);
  const currentMessage = currentMessages.find((item) => item.id === messageId);
  if (!currentMessage)
    throw new Error("Message was deleted before its tracker could be removed.");
  await spindle.chat.updateMessage(chat.id, messageId, {
    metadata: withoutTrackerMetadata(currentMessage)
  });
  spindle.toast.success("Tracker deleted.", { title: "SceneMap", userId });
  await pushState(userId);
}
var registerPullMacro = spindle.registerMacro;
registerPullMacro({
  name: "scenemap",
  category: "extension:scenemap",
  description: "Latest SceneMap state formatted as plain text for prompts.",
  returnType: "string",
  handler: resolveSceneMapMacro,
  volatile: true
});
spindle.onFrontendMessage(async (payload, userId) => {
  try {
    if (!userId)
      throw new Error("SceneMap did not receive a user context from Lumiverse.");
    switch (payload?.type) {
      case "get_state":
        await pushState(userId);
        break;
      case "save_preset_settings":
        await settingsSaveQueue.enqueue(userId, () => savePresetSettings(payload.settings, userId));
        await pushState(userId, {
          settingsSaveRequestId: typeof payload.requestId === "string" ? payload.requestId : ""
        });
        spindle.toast.success("Preset saved.", { title: "SceneMap", userId });
        break;
      case "save_automatic_settings":
        await settingsSaveQueue.enqueue(userId, () => saveAutomaticSettingsPatch(payload.settings, userId));
        await pushState(userId, {
          automaticSettingsSaveRequestId: typeof payload.requestId === "string" ? payload.requestId : ""
        });
        break;
      case "set_chat_preset": {
        const { chat } = await getActiveContext(userId);
        if (!chat)
          throw new Error("Open a chat before setting a chat preset.");
        await updateChatPreset(chat.id, payload.presetKey, userId);
        await pushState(userId);
        spindle.toast.success("Chat preset updated.", { title: "SceneMap", userId });
        break;
      }
      case "generate_tracker":
        await generateTracker(userId);
        break;
      case "cancel_generation":
        cancelTrackerGeneration(userId);
        break;
      case "edit_tracker":
        await editTracker(payload.chatId, payload.messageId, payload.swipeId, payload.data, userId);
        break;
      case "delete_tracker":
        await deleteTracker(payload.messageId, userId);
        break;
      case "open_text_editor": {
        const result = await spindle.textEditor.open({
          title: typeof payload.title === "string" ? payload.title : "Edit Text",
          value: typeof payload.value === "string" ? payload.value : "",
          placeholder: typeof payload.placeholder === "string" ? payload.placeholder : "",
          userId
        });
        spindle.sendToFrontend({
          type: "text_editor_result",
          requestId: payload.requestId,
          text: result.text,
          cancelled: result.cancelled
        }, userId);
        break;
      }
    }
  } catch (error) {
    const isGenerationRequest = payload?.type === "generate_tracker";
    spindle.sendToFrontend({
      type: "error",
      message: error.message,
      requestId: typeof payload?.requestId === "string" ? payload.requestId : undefined
    }, userId);
    spindle.toast.error(error.message, {
      title: isGenerationRequest ? "SceneMap generation failed" : "SceneMap",
      duration: isGenerationRequest ? 1e4 : 9000,
      userId
    });
  }
});
spindle.on("GENERATION_ENDED", (payload, userId) => {
  if (payload.error || !payload.messageId)
    return;
  if (!userId) {
    spindle.log.warn("SceneMap auto-generation skipped: generation event did not include a user context.");
    return;
  }
  maybeAutoGenerateTracker(payload.messageId, userId).catch((error) => {
    const message = error.message;
    spindle.log.error(`SceneMap auto-generation failed: ${message}`);
    spindle.sendToFrontend({ type: "error", message }, userId);
    spindle.toast.error(message, {
      title: "SceneMap generation failed",
      duration: 1e4,
      userId
    });
  });
});
spindle.log.info("SceneMap loaded.");
