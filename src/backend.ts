import {
  CHAT_METADATA_KEY,
  MESSAGE_METADATA_KEY,
  SETTINGS_PATH,
  defaultSettings,
  getPresetLayout,
  getPresetPrompt,
  jsonValuesEqual,
  mergeAutomaticSettingsPatch,
  mergePresetSettings,
  mergeSettings,
  renderPrompt,
  resolveSamplingParameter,
  schemaFingerprint,
  trackerToText,
  type SceneMapSettings,
  type SceneMapState,
  type TrackerEntry,
} from "./shared";
import {
  createValidatedSchemaExample,
  parseAndValidateModelJson,
  validateSchemaDefinition,
  validateTrackerData,
} from "./schema-validator";
import { GenerationRegistry } from "./generation-registry";
import { mergeTrackerMetadata } from "./tracker-metadata";
import { KeyedAsyncQueue } from "./keyed-async-queue";
import { captureSwipeSnapshot, swipeSnapshotMatches } from "./swipe-snapshot";
import { resolveMessageCharacterId } from "./group-character-context";
import { getPreviousTrackerJson, type StoredTracker } from "./tracker-history";
import { raceWithAbort } from "./abortable";
import { hasResolvableMacro } from "./macro-markers";
import { WorldInfoActivationCache } from "./world-info-activation-cache";
import {
  applyTrackerFieldUpdates,
  collectRegeneratableFields,
  formatTrackerPath,
  getTrackerSubschema,
  normalizeTrackerPaths,
  trackerPathKey,
  type TrackerPathSegment,
} from "./partial-regeneration";
import type {
  GenerationEndedPayloadDTO,
  GenerationRequestDTO,
  GenerationResponseDTO,
  GenerationStartedPayloadDTO,
  GenerationStoppedPayloadDTO,
} from "lumiverse-spindle-types";

declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  swipe_id?: number;
  swipes?: string[];
  swipe_dates?: number[];
  metadata?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

type PromptMessage = Pick<ChatMessage, "role" | "content">;

type ActiveChat = {
  id: string;
  character_id?: string | null;
  metadata?: Record<string, unknown>;
};

type CharacterCard = {
  id?: string;
  name?: unknown;
  description?: unknown;
  personality?: unknown;
  scenario?: unknown;
  extensions?: Record<string, unknown>;
};

type ReferenceContext = {
  chatId: string;
  characterId?: string | null;
  userId: string;
};

type ConnectionSummary = {
  id: string;
  name: string;
  provider: string;
  model: string;
  is_default?: boolean;
};

const activeGenerations = new GenerationRegistry();
const worldInfoActivations = new WorldInfoActivationCache();
// State responses and settings writes are independently ordered per user. This
// prevents slow storage/API calls from delivering stale acknowledgements last.
const statePushQueue = new KeyedAsyncQueue();
const settingsSaveQueue = new KeyedAsyncQueue();
const STATE_BUILD_TIMEOUT_MS = 10_000;
// Pull macros do not carry the frontend state, so cache only the layout metadata
// needed to format the latest tracker for each chat.
const macroLayoutsByChatId = new Map<string, {
  layout: ReturnType<typeof getPresetLayout>;
  schemaHash: string;
}>();
const alternateCharacterFields = ["description", "personality", "scenario"] as const;

type SceneMapMacroContext = {
  env?: {
    chat?: {
      id?: unknown;
    };
  };
};

type PullMacroDefinition = Omit<import("lumiverse-spindle-types").MacroDefinitionDTO, "handler"> & {
  handler: (context: SceneMapMacroContext) => string | Promise<string>;
};

async function loadSettings(userId?: string): Promise<SceneMapSettings> {
  return mergeSettings(
    await spindle.userStorage.getJson<Partial<SceneMapSettings>>(SETTINGS_PATH, {
      fallback: defaultSettings,
      userId,
    }),
  );
}

async function saveSettings(settings: SceneMapSettings, userId: string) {
  await spindle.userStorage.setJson(SETTINGS_PATH, mergeSettings(settings), { indent: 2, userId });
}

async function saveAutomaticSettingsPatch(value: unknown, userId: string) {
  const current = await loadSettings(userId);
  await saveSettings(mergeAutomaticSettingsPatch(current, value), userId);
}

async function savePresetSettings(settings: SceneMapSettings, userId: string) {
  for (const preset of Object.values(settings.schemaPresets)) validateSchemaDefinition(preset.value);
  const current = await loadSettings(userId);
  await saveSettings(mergePresetSettings(current, settings), userId);
}

function getActiveSwipeId(message: ChatMessage | null | undefined): number {
  return typeof message?.swipe_id === "number" && Number.isFinite(message.swipe_id) ? message.swipe_id : 0;
}

function getActiveGenerationMessageId(userId: string): string | null {
  return activeGenerations.getMessageId(userId);
}

function throwIfGenerationCancelled(signal: AbortSignal): void {
  if (!signal.aborted) return;
  const error = new Error("SceneMap generation was cancelled.");
  error.name = "AbortError";
  throw error;
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function isGenerationResponse(value: unknown): value is GenerationResponseDTO {
  return Boolean(
    value
    && typeof value === "object"
    && typeof (value as { content?: unknown }).content === "string",
  );
}

async function generateQuiet(
  input: Omit<GenerationRequestDTO, "type">,
): Promise<GenerationResponseDTO> {
  // quiet() supplies the discriminator at runtime, but the public request DTO
  // still requires it and currently exposes the response as unknown.
  const result = await spindle.generate.quiet({ ...input, type: "quiet" });
  if (!isGenerationResponse(result)) {
    throw new Error("Lumiverse returned an invalid response for SceneMap generation.");
  }
  return result;
}

function getTrackerStore(message: ChatMessage | null | undefined): Record<string, unknown> | null {
  const data = message?.metadata?.[MESSAGE_METADATA_KEY];
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

function getTrackerFromStore(store: Record<string, unknown> | null, swipeId: number): StoredTracker | null {
  if (!store) return null;
  const swipes = store.swipes;
  if (swipes && typeof swipes === "object" && !Array.isArray(swipes)) {
    const item = (swipes as Record<string, unknown>)[String(swipeId)];
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      if (!("value" in record)) return null;
      return {
        value: record.value,
        presetKey: typeof record.presetKey === "string" ? record.presetKey : null,
        schemaHash: typeof record.schemaHash === "string" ? record.schemaHash : null,
      };
    }
  }

  // Pre-v3 metadata stored one tracker directly on the SceneMap object. Reading
  // it here keeps old chats usable until their next write migrates the structure.
  if ("value" in store) {
    const legacySwipeId = store.swipeId;
    if (typeof legacySwipeId !== "number" || legacySwipeId === swipeId) {
      return {
        value: store.value,
        presetKey: typeof store.presetKey === "string" ? store.presetKey : null,
        schemaHash: typeof store.schemaHash === "string" ? store.schemaHash : null,
      };
    }
  }
  return null;
}

function getMessageTracker(message: ChatMessage | null | undefined): unknown | null {
  return getTrackerFromStore(getTrackerStore(message), getActiveSwipeId(message))?.value ?? null;
}

function withoutTrackerMetadata(message: ChatMessage): Record<string, unknown> {
  const next = { ...(message.metadata ?? {}) };
  const existing = getTrackerStore(message);
  const swipeId = getActiveSwipeId(message);
  const swipes = existing?.swipes && typeof existing.swipes === "object" && !Array.isArray(existing.swipes)
    ? { ...(existing.swipes as Record<string, unknown>) }
    : {};
  if (existing && "value" in existing) {
    const legacySwipeId = typeof existing.swipeId === "number" ? existing.swipeId : swipeId;
    swipes[String(legacySwipeId)] ??= {
      value: existing.value,
      updatedAt: typeof existing.updatedAt === "string" ? existing.updatedAt : new Date().toISOString(),
    };
  }
  // Delete only the active swipe. Other swipe trackers and unrelated extension
  // metadata belong to the same message and must survive.
  delete swipes[String(swipeId)];
  if (Object.keys(swipes).length === 0) {
    delete next[MESSAGE_METADATA_KEY];
  } else {
    next[MESSAGE_METADATA_KEY] = {
      version: 3,
      swipes,
      updatedAt: new Date().toISOString(),
    };
  }
  return next;
}

function getLatestTrackerEntry(messages: ChatMessage[]): TrackerEntry | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role !== "assistant") continue;
    const stored = getTrackerFromStore(getTrackerStore(messages[i]), getActiveSwipeId(messages[i]));
    if (stored?.value) {
      return {
        messageId: messages[i].id,
        swipeId: getActiveSwipeId(messages[i]),
        data: stored.value,
        presetKey: stored.presetKey,
        schemaHash: stored.schemaHash,
        schemaMatchesCurrent: false,
      };
    }
  }
  return null;
}

function countAssistantMessagesAfter(messages: ChatMessage[], messageId: string): number {
  const index = messages.findIndex((message) => message.id === messageId);
  if (index === -1) return 0;
  return messages.slice(index + 1).filter((message) => message.role === "assistant").length;
}

function countAssistantMessagesBetween(messages: ChatMessage[], afterMessageId: string | null, throughMessageId: string): number {
  const startIndex = afterMessageId ? messages.findIndex((message) => message.id === afterMessageId) + 1 : 0;
  const endIndex = messages.findIndex((message) => message.id === throughMessageId);
  if (endIndex === -1) return 0;
  return messages
    .slice(Math.max(0, startIndex), endIndex + 1)
    .filter((message) => message.role === "assistant")
    .length;
}

function findLatestAssistantMessage(messages: ChatMessage[]): ChatMessage | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "assistant") return messages[i];
  }
  return null;
}

function getAutoGenerateMessagesRemaining(settings: SceneMapSettings, messages: ChatMessage[], latest: TrackerEntry | null, activeMessage: ChatMessage | null): number | null {
  if (!settings.autoGenerateAiTrackers || !activeMessage || activeMessage.role !== "assistant") return null;
  const interval = Math.max(1, Math.floor(settings.autoGenerateInterval || 1));
  const messagesDue = latest
    ? countAssistantMessagesAfter(messages, latest.messageId)
    : countAssistantMessagesBetween(messages, null, activeMessage.id);
  return Math.max(0, interval - messagesDue);
}

function trimMessagesForPrompt(messages: ChatMessage[], targetId: string, includeLastXMessages: number): PromptMessage[] {
  const targetIndex = messages.findIndex((message) => message.id === targetId);
  const end = targetIndex === -1 ? messages.length : targetIndex + 1;
  const start = includeLastXMessages > 0 ? Math.max(0, end - includeLastXMessages) : 0;
  return messages.slice(start, end).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function resolvePromptMessages(messages: PromptMessage[], context: ReferenceContext): Promise<PromptMessage[]> {
  return Promise.all(messages.map(async (message) => ({
    ...message,
    content: await resolveDisplayText(message.content, context),
  })));
}

async function listConnections(userId?: string): Promise<ConnectionSummary[]> {
  try {
    const connections = await spindle.connections.list(userId);
    return connections.map((conn: any) => ({
      id: conn.id,
      name: conn.name,
      provider: conn.provider,
      model: conn.model,
      is_default: conn.is_default,
    }));
  } catch {
    return [];
  }
}

async function getActiveContext(userId: string) {
  const chat = await spindle.chats.getActive(userId) as ActiveChat | null;
  if (!chat) return { chat: null, messages: [] as ChatMessage[] };
  const messages = (await spindle.chat.getMessages(chat.id)) as ChatMessage[];
  return { chat, messages };
}

async function resolveTrackerDisplayData(value: unknown, context: { chatId: string; characterId?: string | null; userId: string }): Promise<unknown> {
  if (typeof value === "string") return resolveDisplayText(value, context);
  if (Array.isArray(value)) return Promise.all(value.map((item) => resolveTrackerDisplayData(item, context)));
  if (!value || typeof value !== "object") return value;

  const entries = await Promise.all(
    Object.entries(value as Record<string, unknown>).map(async ([key, child]) => [
      key,
      await resolveTrackerDisplayData(child, context),
    ] as const),
  );
  return Object.fromEntries(entries);
}

async function buildReferencePromptMessages(
  chat: ActiveChat,
  userId: string,
  characterId: string | null,
  targetMessageId: string,
): Promise<PromptMessage[]> {
  const context: ReferenceContext = {
    chatId: chat.id,
    characterId,
    userId,
  };
  const [characterContext, personaReference, activeWorldInfo] = await Promise.all([
    buildCharacterContext(chat, userId, characterId),
    buildPersonaReference(chat, userId, characterId),
    buildActiveWorldInfo(chat.id, userId, targetMessageId),
  ]);
  // Scenario intentionally leads World Info instead of the character block. Each
  // reference block is a separate system message so sources stay distinguishable.
  const worldInfoReference = separatedReferenceBlock("World Info", [
    characterContext.scenario,
    ...activeWorldInfo,
  ]);
  const sections = [characterContext.reference, personaReference, worldInfoReference].filter(Boolean) as string[];
  return Promise.all(sections.map(async (content) => ({
    role: "system",
    content: await resolveDisplayText(content, context),
  })));
}

async function buildCharacterContext(
  chat: ActiveChat,
  userId: string,
  characterId: string | null,
): Promise<{ reference: string | null; scenario: string }> {
  if (!characterId) return { reference: null, scenario: "" };
  try {
    const character = await spindle.characters.get(characterId, userId);
    if (!character) return { reference: null, scenario: "" };
    const effectiveCharacter = resolveCharacterAlternateFields(character, chat);
    return {
      reference: separatedReferenceBlock("{{char}}", [
        compactText(effectiveCharacter.description),
        compactText(effectiveCharacter.personality),
      ]),
      scenario: compactText(effectiveCharacter.scenario),
    };
  } catch (error) {
    spindle.log.warn(`SceneMap could not read character card context: ${(error as Error).message}`);
    return { reference: null, scenario: "" };
  }
}

async function buildPersonaReference(
  chat: ActiveChat,
  userId: string,
  characterId: string | null,
): Promise<string | null> {
  try {
    const persona = await spindle.personas.getActive(userId) ?? await spindle.personas.getDefault(userId);
    if (!persona) return null;
    const resolvedPersona = await resolvePersonaMacro(chat, userId, persona.description, characterId);
    return separatedReferenceBlock("{{user}}", [
      compactText(resolvedPersona),
    ]);
  } catch (error) {
    spindle.log.warn(`SceneMap could not read persona context: ${(error as Error).message}`);
    return null;
  }
}

async function buildActiveWorldInfo(
  chatId: string,
  userId: string,
  targetMessageId: string,
): Promise<string[]> {
  try {
    // Prefer the exact activation emitted for the generation that produced the
    // target reply. Manual/imported/ambiguous cases deliberately fall back to
    // Lumiverse's complete activation query for the current chat.
    let entryIds = worldInfoActivations.get(userId, chatId, targetMessageId);
    if (entryIds === null) {
      const activated = await spindle.world_books.getActivated(chatId, userId);
      entryIds = activated.map((entry) => entry.id);
    }
    if (!entryIds.length) return [];

    const entries = await Promise.all(entryIds.map(async (entryId) => {
      try {
        const fullEntry = await spindle.world_books.entries.get(entryId, userId);
        return compactText(fullEntry?.content);
      } catch (error) {
        spindle.log.warn(`SceneMap could not read active world info entry ${entryId}: ${(error as Error).message}`);
        return "";
      }
    }));
    return entries.filter(Boolean);
  } catch (error) {
    spindle.log.warn(`SceneMap could not read active world info context: ${(error as Error).message}`);
    return [];
  }
}

function resolveCharacterAlternateFields(character: CharacterCard, chat: ActiveChat): CharacterCard {
  const selections = getCharacterAlternateFieldSelections(character, chat);
  const alternateFields = getRecord(character.extensions?.alternate_fields);
  if (!selections || !alternateFields) return character;

  const overrides: Partial<CharacterCard> = {};
  for (const field of alternateCharacterFields) {
    const variantId = compactText(selections[field]);
    if (!variantId) continue;
    const variants = alternateFields[field];
    if (!Array.isArray(variants)) continue;
    const variant = variants.find((item) => {
      const record = getRecord(item);
      return record ? compactText(record.id) === variantId : false;
    });
    const content = compactText(getRecord(variant)?.content);
    if (content) overrides[field] = content;
  }

  return Object.keys(overrides).length > 0 ? { ...character, ...overrides } : character;
}

function getCharacterAlternateFieldSelections(character: CharacterCard, chat: ActiveChat): Record<string, unknown> | null {
  const metadata = chat.metadata;
  if (!metadata) return null;

  // Lumiverse stores group selections per character, while one-on-one chats use
  // a single selection object. Do not borrow the primary member's variant for a
  // different group speaker when that member has no explicit selection.
  if (metadata.group === true) {
    const byCharacter = getRecord(metadata.group_alternate_field_selections);
    const characterId = compactText(character.id);
    const groupSelections = characterId ? getRecord(byCharacter?.[characterId]) : null;
    if (groupSelections) return groupSelections;

    if (chat.character_id && characterId && chat.character_id !== characterId) return null;
  }

  return getRecord(metadata.alternate_field_selections);
}

function separatedReferenceBlock(label: string, parts: string[]): string | null {
  const body = parts.map(compactText).filter(Boolean).join("\n\n");
  return body ? `>>> ${label} <<<\n${body}` : null;
}

function wrapInstructions(text: string): string {
  const body = compactText(text);
  return body ? `>>> Instructions <<<\n${body}` : "";
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function resolvePersonaMacro(
  chat: ActiveChat,
  userId: string,
  fallback: unknown,
  characterId: string | null,
): Promise<string> {
  try {
    const result = await spindle.macros.resolve("{{persona}}", {
      chatId: chat.id,
      characterId: characterId || undefined,
      userId,
      // Context assembly is read-only; resolving it must not commit macro state.
      commit: false,
    });
    const text = compactText(result.text);
    return text && text !== "{{persona}}" ? text : compactText(fallback);
  } catch (error) {
    spindle.log.warn(`SceneMap could not resolve persona add-ons: ${(error as Error).message}`);
    return compactText(fallback);
  }
}

function compactText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

async function resolveDisplayText(text: string, context: { chatId: string; characterId?: string | null; userId: string }): Promise<string> {
  if (!hasResolvableMacro(text)) return text;
  try {
    const result = await spindle.macros.resolve(text, {
      chatId: context.chatId,
      characterId: context.characterId || undefined,
      userId: context.userId,
      commit: false,
    });
    return result.text;
  } catch (error) {
    spindle.log.warn(`SceneMap macro display resolve failed: ${(error as Error).message}`);
    return text;
  }
}

async function buildState(userId: string): Promise<SceneMapState> {
  const settings = await loadSettings(userId);
  const { chat, messages } = await getActiveContext(userId);
  const effectivePresetKey = getChatPresetKey(chat, settings);
  const latest = getLatestTrackerEntry(messages);
  const effectivePreset = settings.schemaPresets[effectivePresetKey]
    ?? settings.schemaPresets[settings.schemaPreset]
    ?? settings.schemaPresets.default;
  const effectiveSchemaHash = schemaFingerprint(effectivePreset.value);
  if (latest) latest.schemaMatchesCurrent = latest.schemaHash === effectiveSchemaHash;
  const activeMessage = findLatestAssistantMessage(messages);
  if (latest && chat) {
    const trackerMessage = messages.find((message) => message.id === latest.messageId);
    // Resolve macros only in the transient display copy. Stored JSON remains the
    // source of truth and can be resolved again under the correct chat context.
    latest.displayData = await resolveTrackerDisplayData(latest.data, {
      chatId: chat.id,
      characterId: resolveMessageCharacterId(chat, trackerMessage),
      userId,
    });
  }
  const connections = await listConnections(userId);
  // Read generation state after every slow RPC. Otherwise an old state build
  // can publish "active" after the generation has already completed.
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
    connections,
  };
}

function pushState(userId: string, response: Record<string, unknown> = {}): Promise<void> {
  // Queue the complete build+send operation, not just sendToFrontend, otherwise
  // an older slow build could arrive after a newer state snapshot.
  return statePushQueue.enqueue(userId, async () => {
    const state = await withTimeout(
      buildState(userId),
      STATE_BUILD_TIMEOUT_MS,
      "SceneMap timed out while refreshing its state.",
    );
    if (state.chatId) {
      const preset = state.settings.schemaPresets[state.effectivePresetKey]
        ?? state.settings.schemaPresets[state.settings.schemaPreset]
        ?? state.settings.schemaPresets.default;
      macroLayoutsByChatId.set(state.chatId, {
        layout: getPresetLayout(state.settings, state.effectivePresetKey),
        schemaHash: schemaFingerprint(preset.value),
      });
    }
    spindle.sendToFrontend({ type: "state", state, ...response }, userId);
  });
}

function pushStateInBackground(userId: string): void {
  void pushState(userId).catch((error) => {
    spindle.log.warn(`SceneMap state refresh failed: ${(error as Error).message}`);
  });
}

function sendGenerationStatus(userId: string, cancelling = false): void {
  const generation = activeGenerations.get(userId);
  spindle.sendToFrontend({
    type: "generation_status",
    active: generation !== null,
    messageId: generation?.messageId ?? null,
    cancelling: generation !== null && cancelling,
  }, userId);
}

async function resolveSceneMapMacro(context: SceneMapMacroContext): Promise<string> {
  const chatId = context.env?.chat?.id;
  if (typeof chatId !== "string" || !chatId) return "";
  try {
    const messages = (await spindle.chat.getMessages(chatId)) as ChatMessage[];
    const latest = getLatestTrackerEntry(messages);
    if (!latest) return "";
    const cached = macroLayoutsByChatId.get(chatId);
    // Never interpret old tracker data through a layout built for another schema.
    // Generic text formatting is safer until that tracker is regenerated.
    const layout = cached && latest.schemaHash === cached.schemaHash ? cached.layout : undefined;
    return trackerToText(latest.data, layout);
  } catch (error) {
    spindle.log.warn(`SceneMap macro resolution failed: ${(error as Error).message}`);
    return "";
  }
}

async function updateChatPreset(chatId: string, presetKey: string, userId: string) {
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat) throw new Error("Active chat not found.");
  await spindle.chats.update(chatId, {
    metadata: {
      ...(chat.metadata ?? {}),
      [CHAT_METADATA_KEY]: {
        ...((chat.metadata?.[CHAT_METADATA_KEY] as Record<string, unknown> | undefined) ?? {}),
        schemaPreset: presetKey,
      },
    },
  }, userId);
}

function getChatPresetKey(chat: { metadata?: Record<string, unknown> } | null, settings: SceneMapSettings): string {
  // A chat-specific preset overrides the global picker only while that preset
  // still exists; deleted presets fall back cleanly to the global selection.
  const meta = chat?.metadata?.[CHAT_METADATA_KEY];
  const key = meta && typeof meta === "object" ? (meta as Record<string, unknown>).schemaPreset : null;
  return typeof key === "string" && settings.schemaPresets[key] ? key : settings.schemaPreset;
}

function removeLegacyExampleSection(template: string): string {
  return template.replace(
    /EXAMPLE OF A PERFECT RESPONSE:\s*```json\s*\{\{\s*example_response\s*\}\}\s*```/gi,
    "",
  );
}

type PartialFieldSelection = {
  id: string;
  path: TrackerPathSegment[];
  label: string;
  currentValue: unknown;
  schema: unknown;
};

function buildPartialResponseSchema(
  trackerSchema: Record<string, unknown>,
  selections: PartialFieldSelection[],
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
      updates: {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(selections.map((selection) => [selection.id, selection.schema])),
        required: selections.map((selection) => selection.id),
      },
    },
    required: ["updates"],
  };
  if (typeof trackerSchema.$schema === "string") schema.$schema = trackerSchema.$schema;
  return schema;
}

function buildPartialRegenerationPrompt(
  tracker: unknown,
  selections: PartialFieldSelection[],
  responseSchema: Record<string, unknown>,
  originalInstructions: string,
): string {
  const fieldMap = selections.map((selection) => [
    `${selection.id}: ${selection.label}`,
    `Current value: ${JSON.stringify(selection.currentValue, null, 2)}`,
    `Value schema: ${JSON.stringify(selection.schema, null, 2)}`,
  ].join("\n")).join("\n\n");

  return [
    "ORIGINAL TRACKER INSTRUCTIONS (semantic guidance only):",
    originalInstructions,
    "",
    "PARTIAL TRACKER UPDATE TASK (this output contract takes precedence):",
    "Regenerate only the selected tracker fields using the conversation and reference context.",
    "Keep identities and continuity consistent with the current tracker. Do not invent changes unsupported by the scene.",
    "Return exactly one JSON object matching the response schema. Do not add prose or markdown outside it.",
    "",
    "CURRENT TRACKER (read-only except for the selected fields):",
    JSON.stringify(tracker, null, 2),
    "",
    "SELECTED FIELDS:",
    fieldMap,
    "",
    "RESPONSE JSON SCHEMA:",
    JSON.stringify(responseSchema, null, 2),
  ].join("\n");
}

async function regenerateTrackerFields(
  messageId: unknown,
  swipeId: unknown,
  rawPaths: unknown,
  userId?: string,
) {
  if (!userId) throw new Error("SceneMap needs a user context before regenerating tracker fields.");
  if (typeof messageId !== "string" || !messageId) throw new Error("The tracker message is missing.");
  if (!Number.isSafeInteger(swipeId) || (swipeId as number) < 0) throw new Error("The tracker swipe is invalid.");
  const paths = normalizeTrackerPaths(rawPaths);
  const activeGeneration = activeGenerations.get(userId);
  if (activeGeneration) {
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
    return;
  }

  const controller = new AbortController();
  const generation = activeGenerations.start(userId, controller);
  sendGenerationStatus(userId);
  try {
    throwIfGenerationCancelled(controller.signal);
    const { chat, messages } = await raceWithAbort(getActiveContext(userId), controller.signal);
    if (!chat) throw new Error("Open a chat before regenerating SceneMap fields.");
    const target = messages.find((message) => message.id === messageId);
    if (!target || target.role !== "assistant") throw new Error("The tracker message is no longer available.");
    if (getActiveSwipeId(target) !== swipeId) {
      throw new Error("The tracker swipe changed while the field picker was open.");
    }
    activeGenerations.setMessageId(generation, target.id);
    sendGenerationStatus(userId);
    const targetSwipeSnapshot = captureSwipeSnapshot(target, swipeId as number);
    if (!targetSwipeSnapshot) throw new Error("SceneMap could not read the target swipe.");

    const settings = await raceWithAbort(loadSettings(userId), controller.signal);
    const presetKey = getChatPresetKey(chat, settings);
    const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
    validateSchemaDefinition(preset.value);
    const currentSchemaHash = schemaFingerprint(preset.value);
    const storedTracker = getTrackerFromStore(getTrackerStore(target), swipeId as number);
    if (!storedTracker || storedTracker.schemaHash !== currentSchemaHash) {
      throw new Error("This tracker uses another or unknown schema. Regenerate the entire tracker first.");
    }
    const baseline = validateTrackerData(storedTracker.value, preset.value);
    const availableFields = new Map(
      collectRegeneratableFields(baseline).map((field) => [trackerPathKey(field.path), field]),
    );
    const selections = paths.map((path, index): PartialFieldSelection => {
      const field = availableFields.get(trackerPathKey(path));
      if (!field) throw new Error(`Tracker field "${formatTrackerPath(path, baseline)}" cannot be regenerated separately.`);
      const fieldSchema = getTrackerSubschema(preset.value, path);
      if (fieldSchema === null) {
        throw new Error(`SceneMap could not find the schema for "${formatTrackerPath(path, baseline)}".`);
      }
      return {
        id: `field_${index + 1}`,
        path,
        label: formatTrackerPath(path, baseline),
        currentValue: field.currentValue,
        schema: fieldSchema,
      };
    });
    const responseSchema = buildPartialResponseSchema(preset.value, selections);
    const schemaExample = createValidatedSchemaExample(preset.value);
    const originalInstructions = renderPrompt(getPresetPrompt(settings, presetKey), {
      schema: JSON.stringify(preset.value, null, 2),
      previous_tracker: JSON.stringify(baseline, null, 2),
      example_response: schemaExample === null ? "" : JSON.stringify(schemaExample, null, 2),
      example_section: "",
    });
    const partialPrompt = buildPartialRegenerationPrompt(
      baseline,
      selections,
      responseSchema,
      originalInstructions,
    );
    const characterId = resolveMessageCharacterId(chat, target);
    const context = { chatId: chat.id, characterId, userId };
    const promptMessages = await raceWithAbort(
      resolvePromptMessages(trimMessagesForPrompt(messages, target.id, settings.includeLastXMessages), context),
      controller.signal,
    );
    const referenceMessages = await raceWithAbort(
      buildReferencePromptMessages(chat, userId, characterId, target.id),
      controller.signal,
    );
    promptMessages.unshift(...referenceMessages);
    promptMessages.push({ role: "user", content: wrapInstructions(partialPrompt) });

    spindle.toast.info(
      selections.length === 1 ? "Regenerating selected field..." : `Regenerating ${selections.length} selected fields...`,
      { title: "SceneMap", userId },
    );
    const result = await raceWithAbort(
      generateQuiet({
        messages: promptMessages,
        connection_id: settings.connectionId || undefined,
        userId,
        parameters: {
          max_tokens: Math.max(1, Math.floor(settings.maxResponseTokens)),
          temperature: resolveSamplingParameter(settings.temperature, 0, 2),
          top_p: resolveSamplingParameter(settings.topP, 0, 1),
        },
        signal: controller.signal,
      }),
      controller.signal,
    );
    throwIfGenerationCancelled(controller.signal);
    const parsed = parseAndValidateModelJson(result.content, responseSchema) as {
      updates: Record<string, unknown>;
    };
    const merged = applyTrackerFieldUpdates(
      baseline,
      selections.map((selection) => ({
        path: selection.path,
        value: parsed.updates[selection.id],
      })),
    );
    const validated = validateTrackerData(merged, preset.value, "Partially regenerated tracker");

    // Partial regeneration is optimistic: abort rather than overwrite an edit or
    // another tracker write that landed while the model was running.
    const currentMessages = await raceWithAbort(
      spindle.chat.getMessages(chat.id) as Promise<ChatMessage[]>,
      controller.signal,
    );
    const currentTarget = currentMessages.find((message) => message.id === target.id);
    if (!currentTarget) throw new Error("SceneMap target message was deleted during generation.");
    if (!swipeSnapshotMatches(targetSwipeSnapshot, currentTarget, swipeId as number)) {
      throw new Error("SceneMap target swipe changed during generation. Select the fields again.");
    }
    const currentStoredTracker = getTrackerFromStore(getTrackerStore(currentTarget), swipeId as number);
    if (
      !currentStoredTracker
      || currentStoredTracker.schemaHash !== currentSchemaHash
      || !jsonValuesEqual(currentStoredTracker.value, baseline)
    ) {
      throw new Error("The tracker changed during generation. Select the fields again.");
    }
    await raceWithAbort(
      spindle.chat.updateMessage(chat.id, target.id, {
        metadata: mergeTrackerMetadata(currentTarget.metadata, validated, swipeId as number, {
          presetKey,
          schemaHash: currentSchemaHash,
        }),
      }),
      controller.signal,
    );
    spindle.toast.success(
      selections.length === 1 ? "Selected field updated." : "Selected fields updated.",
      { title: "SceneMap", userId },
    );
  } catch (error) {
    if ((error as Error).name !== "AbortError") throw error;
  } finally {
    activeGenerations.finish(generation);
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
  }
}

async function generateTracker(userId?: string, expectedLatestMessageId?: string) {
  if (!userId) throw new Error("SceneMap needs a user context before generating a tracker.");
  const activeGeneration = activeGenerations.get(userId);
  if (activeGeneration) {
    // Starts are idempotent. Cancellation has its own command so a delayed or
    // duplicated first click can never accidentally stop an active generation.
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
    return;
  }

  const controller = new AbortController();
  const generation = activeGenerations.start(userId, controller);
  sendGenerationStatus(userId);
  try {
    throwIfGenerationCancelled(controller.signal);

    const { chat, messages } = await raceWithAbort(getActiveContext(userId), controller.signal);
    if (!chat) throw new Error("Open a chat before generating a SceneMap tracker.");

    const target = findLatestAssistantMessage(messages);
    if (!target) throw new Error("No assistant message found for SceneMap.");
    if (expectedLatestMessageId && target.id !== expectedLatestMessageId) return;
    activeGenerations.setMessageId(generation, target.id);
    sendGenerationStatus(userId);
    const targetSwipeId = getActiveSwipeId(target);
    const targetSwipeSnapshot = captureSwipeSnapshot(target, targetSwipeId);
    if (!targetSwipeSnapshot) throw new Error("SceneMap could not read the target swipe.");

    const settings = await raceWithAbort(loadSettings(userId), controller.signal);
    const presetKey = getChatPresetKey(chat, settings);
    const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
    validateSchemaDefinition(preset.value);
    const currentSchemaHash = schemaFingerprint(preset.value);
    // Selection also handles schema migration on the target message; see the
    // documented invariants in tracker-history.ts.
    const previousTracker = getPreviousTrackerJson(
      messages,
      target.id,
      { presetKey, schemaHash: currentSchemaHash },
      (message) => getTrackerFromStore(getTrackerStore(message), getActiveSwipeId(message)),
    );
    const schemaExample = createValidatedSchemaExample(preset.value);
    const exampleResponse = schemaExample === null ? "" : JSON.stringify(schemaExample, null, 2);
    const exampleSection = schemaExample === null
      ? ""
      : `EXAMPLE OF A PERFECT RESPONSE:\n\`\`\`json\n${exampleResponse}\n\`\`\``;
    const rawPromptTemplate = getPresetPrompt(settings, presetKey);
    const promptTemplate = schemaExample === null ? removeLegacyExampleSection(rawPromptTemplate) : rawPromptTemplate;
    const finalPrompt = renderPrompt(promptTemplate, {
      schema: JSON.stringify(preset.value, null, 2),
      previous_tracker: previousTracker,
      example_response: exampleResponse,
      example_section: exampleSection,
    });
    const characterId = resolveMessageCharacterId(chat, target);
    const context = { chatId: chat.id, characterId, userId };
    const promptMessages = await raceWithAbort(
      resolvePromptMessages(trimMessagesForPrompt(messages, target.id, settings.includeLastXMessages), context),
      controller.signal,
    );
    const referenceMessages = await raceWithAbort(
      buildReferencePromptMessages(chat, userId, characterId, target.id),
      controller.signal,
    );
    promptMessages.unshift(...referenceMessages);
    promptMessages.push({ role: "user", content: wrapInstructions(finalPrompt) });

    spindle.toast.info("Mapping this scene...", { title: "SceneMap", userId });

    const result = await raceWithAbort(
      generateQuiet({
        messages: promptMessages,
        connection_id: settings.connectionId || undefined,
        userId,
        parameters: {
          max_tokens: Math.max(1, Math.floor(settings.maxResponseTokens)),
          temperature: resolveSamplingParameter(settings.temperature, 0, 2),
          top_p: resolveSamplingParameter(settings.topP, 0, 1),
        },
        signal: controller.signal,
      }),
      controller.signal,
    );
    throwIfGenerationCancelled(controller.signal);
    const parsed = parseAndValidateModelJson(result.content, preset.value);
    // Generation can be slow. Re-fetch before writing so concurrent metadata from
    // Lumiverse or another extension is merged instead of overwritten.
    const currentMessages = await raceWithAbort(
      spindle.chat.getMessages(chat.id) as Promise<ChatMessage[]>,
      controller.signal,
    );
    const currentTarget = currentMessages.find((message) => message.id === target.id);
    if (!currentTarget) throw new Error("SceneMap target message was deleted during generation.");
    if (!swipeSnapshotMatches(targetSwipeSnapshot, currentTarget, targetSwipeId)) {
      throw new Error("SceneMap target swipe changed during generation. Generate the tracker again.");
    }
    await raceWithAbort(
      spindle.chat.updateMessage(chat.id, target.id, {
        metadata: mergeTrackerMetadata(currentTarget.metadata, parsed, targetSwipeId, {
          presetKey,
          schemaHash: currentSchemaHash,
        }),
      }),
      controller.signal,
    );
    spindle.toast.success("Tracker updated.", { title: "SceneMap", userId });
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      throw error;
    }
  } finally {
    activeGenerations.finish(generation);
    sendGenerationStatus(userId);
    pushStateInBackground(userId);
  }
}

function cancelTrackerGeneration(userId: string): void {
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

async function maybeAutoGenerateTracker(messageId: string | null | undefined, userId: string) {
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

async function editTracker(chatId: string, messageId: string, swipeId: number, data: unknown, userId?: string) {
  if (!userId) throw new Error("SceneMap needs a user context before editing a tracker.");
  if (!chatId) throw new Error("Tracker chat is missing.");
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat) throw new Error("Tracker chat was not found.");
  if (!Number.isInteger(swipeId) || swipeId < 0) throw new Error("Tracker swipe is invalid.");
  const messages = (await spindle.chat.getMessages(chatId)) as ChatMessage[];
  const message = messages.find((item) => item.id === messageId);
  if (!message) throw new Error("Message not found.");
  if (Array.isArray(message.swipes) && swipeId >= message.swipes.length) {
    throw new Error("Tracker swipe was removed while the editor was open.");
  }
  const settings = await loadSettings(userId);
  const presetKey = getChatPresetKey(chat, settings);
  const preset = settings.schemaPresets[presetKey] ?? settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const currentSchemaHash = schemaFingerprint(preset.value);
  const storedTracker = getTrackerFromStore(getTrackerStore(message), swipeId);
  // Editing an old shape under a new schema could silently discard information.
  // Require regeneration, which can migrate the old tracker through the model.
  if (!storedTracker || storedTracker.schemaHash !== currentSchemaHash) {
    throw new Error("This tracker was generated with another or unknown schema. Regenerate it before editing.");
  }
  const validatedData = validateTrackerData(data, preset.value);
  await spindle.chat.updateMessage(chatId, messageId, {
    metadata: mergeTrackerMetadata(message.metadata, validatedData, swipeId, {
      presetKey,
      schemaHash: currentSchemaHash,
    }),
  });
  spindle.toast.success("Tracker saved.", { title: "SceneMap", userId });
  await pushState(userId);
}

async function deleteTracker(messageId: string, userId?: string) {
  if (!userId) throw new Error("SceneMap needs a user context before deleting a tracker.");
  const { chat, messages } = await getActiveContext(userId);
  if (!chat) throw new Error("Open a chat before deleting a tracker.");
  const message = messages.find((item) => item.id === messageId);
  if (!message) throw new Error("Message not found.");
  const { confirmed } = await spindle.modal.confirm({
    title: "Delete Tracker",
    message: "This will permanently remove SceneMap data from this message.",
    variant: "danger",
    confirmLabel: "Delete",
    userId,
  });
  if (!confirmed) return;
  const currentMessages = (await spindle.chat.getMessages(chat.id)) as ChatMessage[];
  const currentMessage = currentMessages.find((item) => item.id === messageId);
  if (!currentMessage) throw new Error("Message was deleted before its tracker could be removed.");
  await spindle.chat.updateMessage(chat.id, messageId, {
    metadata: withoutTrackerMetadata(currentMessage),
  });
  spindle.toast.success("Tracker deleted.", { title: "SceneMap", userId });
  await pushState(userId);
}

// The Lumiverse runtime accepts async volatile pull handlers, while the installed
// type package still narrows this overload to the static handler shape.
const registerPullMacro = spindle.registerMacro as unknown as (definition: PullMacroDefinition) => void;
registerPullMacro({
  name: "scenemap",
  category: "extension:scenemap",
  description: "Latest SceneMap state formatted as plain text for prompts.",
  returnType: "string",
  handler: resolveSceneMapMacro,
  volatile: true,
});

spindle.onFrontendMessage(async (payload: any, userId?: string) => {
  try {
    if (!userId) throw new Error("SceneMap did not receive a user context from Lumiverse.");
    switch (payload?.type) {
      case "get_state":
        await pushState(userId);
        break;
      case "save_preset_settings":
        await settingsSaveQueue.enqueue(userId, () => savePresetSettings(payload.settings, userId));
        await pushState(userId, {
          settingsSaveRequestId: typeof payload.requestId === "string" ? payload.requestId : "",
        });
        spindle.toast.success("Preset saved.", { title: "SceneMap", userId });
        break;
      case "save_automatic_settings":
        await settingsSaveQueue.enqueue(userId, () => saveAutomaticSettingsPatch(payload.settings, userId));
        await pushState(userId, {
          automaticSettingsSaveRequestId: typeof payload.requestId === "string" ? payload.requestId : "",
        });
        break;
      case "set_chat_preset": {
        const { chat } = await getActiveContext(userId);
        if (!chat) throw new Error("Open a chat before setting a chat preset.");
        await updateChatPreset(chat.id, payload.presetKey, userId);
        await pushState(userId);
        spindle.toast.success("Chat preset updated.", { title: "SceneMap", userId });
        break;
      }
      case "generate_tracker":
        await generateTracker(userId);
        break;
      case "regenerate_fields":
        await regenerateTrackerFields(payload.messageId, payload.swipeId, payload.paths, userId);
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
          userId,
        });
        spindle.sendToFrontend({
          type: "text_editor_result",
          requestId: payload.requestId,
          text: result.text,
          cancelled: result.cancelled,
        }, userId);
        break;
      }
    }
  } catch (error) {
    const isGenerationRequest = payload?.type === "generate_tracker" || payload?.type === "regenerate_fields";
    spindle.sendToFrontend({
      type: "error",
      message: (error as Error).message,
      requestId: typeof payload?.requestId === "string" ? payload.requestId : undefined,
    }, userId);
    spindle.toast.error((error as Error).message, {
      title: isGenerationRequest ? "SceneMap generation failed" : "SceneMap",
      duration: isGenerationRequest ? 10000 : 9000,
      userId,
    });
  }
});

spindle.on("GENERATION_STARTED", (payload: GenerationStartedPayloadDTO, userId?: string) => {
  if (!userId) return;
  worldInfoActivations.begin(userId, payload.generationId, payload.chatId);
});

spindle.on("WORLD_INFO_ACTIVATED", (payload: unknown, userId?: string) => {
  if (!userId) return;
  const event = getRecord(payload);
  const chatId = compactText(event?.chatId);
  const entries = Array.isArray(event?.entries)
    ? event.entries.filter((entry): entry is { id: unknown } => getRecord(entry) !== null)
    : null;
  if (chatId && entries) worldInfoActivations.capture(userId, chatId, entries);
});

spindle.on("GENERATION_STOPPED", (payload: GenerationStoppedPayloadDTO, userId?: string) => {
  if (!userId) return;
  worldInfoActivations.discard(userId, payload.generationId, payload.chatId);
});

// Any edit or swipe can change the text that World Info scanned. Invalidating
// the whole chat is cheap and prevents a later manual tracker from borrowing a
// snapshot produced from a different history/swipe selection.
for (const event of ["MESSAGE_EDITED", "MESSAGE_DELETED", "MESSAGE_SWIPED", "SWIPE_EDITED"]) {
  spindle.on(event, (payload: unknown, userId?: string) => {
    if (!userId) return;
    const chatId = compactText(getRecord(payload)?.chatId);
    if (chatId) worldInfoActivations.invalidateChat(userId, chatId);
  });
}

spindle.on("GENERATION_ENDED", (payload: GenerationEndedPayloadDTO, userId?: string) => {
  if (!userId) {
    if (!payload.error && payload.messageId) {
      spindle.log.warn("SceneMap auto-generation skipped: generation event did not include a user context.");
    }
    return;
  }
  if (payload.error || !payload.messageId) {
    worldInfoActivations.discard(userId, payload.generationId, payload.chatId);
    return;
  }
  worldInfoActivations.complete(userId, payload.generationId, payload.chatId, payload.messageId);
  void maybeAutoGenerateTracker(payload.messageId, userId).catch((error) => {
    const message = (error as Error).message;
    spindle.log.error(`SceneMap auto-generation failed: ${message}`);
    spindle.sendToFrontend({ type: "error", message }, userId);
    spindle.toast.error(message, {
      title: "SceneMap generation failed",
      duration: 10000,
      userId,
    });
  });
});

spindle.log.info("SceneMap loaded.");
