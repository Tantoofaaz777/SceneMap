import type { SpindleFrontendContext, SpindleSelectHandle, SpindleSelectOption } from "lumiverse-spindle-types";
import Sortable from "sortablejs";
import {
  DEFAULT_DISPLAY_LAYOUT,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_SCHEMA_VALUE,
  defaultSettings,
  formatPrimitive,
  getPresetLayout,
  getPresetSystemPrompt,
  getPresetUserPrompt,
  humanizeTrackerKey,
  jsonValuesEqual,
  migrateLegacyUserPrompt,
  mergeSettings,
  schemaFingerprint,
  type SceneMapSettings,
  type SceneMapState,
  type TrackerBoardDisplayLayout,
  type TrackerBoardField,
  type TrackerFieldDisplay,
} from "./shared";
import { SettingsDraftTracker } from "./settings-draft";
import { AutomaticSettingsDraftTracker } from "./automatic-settings-draft";
import { validateSchemaDefinition, validateTrackerData } from "./schema-validator";
import { getGenerationButtonCommand } from "./generation-action";
import {
  collectRegeneratableFields,
  type RegeneratableField,
} from "./partial-regeneration";
import { getTopToolbarStatus } from "./top-toolbar-status";
import {
  appendTrackerArrayItem,
  cloneTrackerEditValue,
  createTrackerEditDefaultValue,
  getTrackerEditControlKind,
  getTrackerSchemaAtPath,
  getTrackerValueAtPath,
  parseTrackerEditValue,
  removeTrackerArrayItem,
  setTrackerValueAtPath,
  type TrackerEditControlKind,
  type TrackerEditPath,
} from "./tracker-inline-edit";
import { LEGACY_SCENEMAP_PROMPT_MACROS, SCENEMAP_PROMPT_MACROS } from "./prompt-templates";

let state: SceneMapState = {
  settings: defaultSettings,
  chatId: null,
  effectivePresetKey: defaultSettings.schemaPreset,
  latest: null,
  messagesBehind: 0,
  autoGenerateMessagesRemaining: null,
  activeMessageId: null,
  activeSwipeId: null,
  generationActive: false,
  generatingMessageId: null,
  connections: [],
};

let ctxRef: SpindleFrontendContext | null = null;
let rootRef: HTMLElement | null = null;
let dockRootRef: HTMLElement | null = null;
let toolbarRootRef: Element | null = null;
let topToolbarInjection: Element | null = null;
let topToolbarObserver: MutationObserver | null = null;
let topToolbarObservationRoot: Element | null = null;
let topToolbarEnsureQueued = false;
let topToolbarTapTimer: ReturnType<typeof setTimeout> | null = null;
let topToolbarSuppressClickUntil = Number.NEGATIVE_INFINITY;
let tabHandle: ReturnType<SpindleFrontendContext["ui"]["registerDrawerTab"]> | null = null;
let dockPanelHandle: ReturnType<SpindleFrontendContext["ui"]["requestDockPanel"]> | null = null;
let dockResizeObserver: MutationObserver | null = null;
let dockPanelWidth = 380;
let dockPanelHeight = 380;
const decoratedDockResizeHandles = new Set<HTMLElement>();
let dockPanelError: string | null = null;
let settingsRuntimeError: string | null = null;
let trackerRuntimeError: string | null = null;
let isGenerationRequestPending = false;
let generationRequestWatchdog: ReturnType<typeof setTimeout> | null = null;
let editorRequestSeq = 0;
let trackerEditRequestSeq = 0;
let settingsSaveRequestSeq = 0;
let automaticSaveRequestSeq = 0;
let drawerSelectHandles: SpindleSelectHandle[] = [];
let automaticSaveTimer: ReturnType<typeof setTimeout> | null = null;
let drawerScrollRestoreFrame: number | null = null;
type DrawerView = "tracker" | "settings" | "macros";

let drawerView: DrawerView = "settings";
let appliedTrackerPlacement: SceneMapSettings["trackerPlacement"] | null = null;
let hasReceivedInitialState = false;
let regenerationModalHandle: ReturnType<SpindleFrontendContext["ui"]["showModal"]> | null = null;

type TrackerEditSession = {
  chatId: string;
  messageId: string;
  swipeId: number;
  baseline: unknown;
  draft: unknown;
  requestId: string | null;
};

let trackerEditSession: TrackerEditSession | null = null;

type AutomaticallySavedSetting =
  | "connectionId"
  | "autoGenerateAiTrackers"
  | "autoGenerateInterval"
  | "maxResponseTokens"
  | "temperature"
  | "topP"
  | "showInputBarButton"
  | "showTopToolbarButton"
  | "trackerPlacement";

type PresetEditorDraft = {
  schemaText: string;
  systemPromptText: string;
  userPromptText: string;
  schemaError: string | null;
};

type PresetTextEditor = "schema" | "systemPrompt" | "userPrompt";

const presetEditorDrafts = new Map<string, PresetEditorDraft>();

type PendingTextEditor = {
  title: string;
  surface: "settings" | "tracker";
  onSave: (value: string) => void;
};

const pendingTextEditors = new Map<string, PendingTextEditor>();
const settingsDraft = new SettingsDraftTracker();
const automaticSettingsDraft = new AutomaticSettingsDraftTracker<SceneMapSettings>();
const GENERATION_REQUEST_TIMEOUT_MS = 10_000;
const TOP_TOOLBAR_DOUBLE_CLICK_MS = 280;
const TOP_TOOLBAR_DOUBLE_TOUCH_MS = 440;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>`;
const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></svg>`;
const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>`;

export function setup(ctx: SpindleFrontendContext) {
  hasReceivedInitialState = false;
  trackerEditSession = null;
  settingsDraft.reset();
  automaticSettingsDraft.reset();
  presetEditorDrafts.clear();
  pendingTextEditors.clear();
  settingsDraft.initialize(presetSettingsFingerprint(state.settings));
  if (automaticSaveTimer) clearTimeout(automaticSaveTimer);
  automaticSaveTimer = null;
  if (drawerScrollRestoreFrame !== null) cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  dockPanelWidth = readStoredDockPanelSize("width", 380);
  dockPanelHeight = readStoredDockPanelSize("height", 380);
  settingsRuntimeError = null;
  trackerRuntimeError = null;
  clearGenerationRequestPending();
  ctxRef = ctx;
  const removeStyle = ctx.dom.addStyle(styles);
  const tab = ctx.ui.registerDrawerTab({
    id: "scenemap",
    title: "SceneMap",
    shortName: "Map",
    headerTitle: "SceneMap",
    description: "View the SceneMap tracker, settings, and macro reference",
    keywords: ["tracker", "scene", "map", "json", "settings", "macros"],
    iconSvg,
  });
  tabHandle = tab;
  rootRef = tab.root;
  rootRef.classList.add("scenemap-lv", "scenemap-drawer-root");
  syncTrackerPlacement();
  const offTabActivate = tab.onActivate(() => {
    syncTrackerPlacement();
    renderDrawerContent();
  });
  const toolbarRoot = ctx.ui.mount("chat_toolbar");
  toolbarRootRef = toolbarRoot;
  toolbarRoot.classList.add("scenemap-chat-toolbar-root");
  render();

  const offBackend = ctx.onBackendMessage((payload: any) => {
    if (payload?.type === "state") {
      // Full state snapshots can arrive while a native select is open or text is
      // focused. Reconcile drafts first, then avoid rebuilding an unchanged form.
      const preserveActiveSettings = settingsSurfaceHasActiveInteraction();
      const previousState = state;
      const incomingState = payload.state as SceneMapState;
      hasReceivedInitialState = true;
      reconcileTrackerEditSession(incomingState, payload);
      if (!settingsDraft.initialized) settingsDraft.initialize(presetSettingsFingerprint(incomingState.settings));
      if (typeof payload.automaticSettingsSaveRequestId === "string") {
        automaticSettingsDraft.acknowledge(payload.automaticSettingsSaveRequestId);
        clearSettingsRuntimeError();
      }
      if (typeof payload.settingsSaveRequestId === "string") {
        const acknowledged = settingsDraft.acknowledge(payload.settingsSaveRequestId);
        clearSettingsRuntimeError();
        if (acknowledged && !settingsDraft.dirty) presetEditorDrafts.clear();
      }
      const baseSettings = settingsDraft.dirty ? state.settings : incomingState.settings;
      const nextState: SceneMapState = {
        ...incomingState,
        settings: automaticSettingsDraft.overlay(baseSettings),
      };
      state = nextState;
      if (!settingsDraft.dirty && !settingsDraft.saving) {
        settingsDraft.synchronize(presetSettingsFingerprint(nextState.settings));
      }
      syncSettingsDraftUi();
      render({
        preserveSettingsSurface: preserveActiveSettings && settingsSurfaceStructureMatches(previousState, nextState),
      });
      return;
    }
    if (payload?.type === "generation_status") {
      clearGenerationRequestPending();
      const active = payload.active === true;
      state = {
        ...state,
        generationActive: active,
        generatingMessageId: active && typeof payload.messageId === "string" ? payload.messageId : null,
      };
      renderTrackerSurfaces();
      renderChatToolbar();
      renderTopToolbarButton();
      return;
    }
    if (payload?.type === "error") {
      const saveFailed = typeof payload.requestId === "string" && settingsDraft.fail(payload.requestId);
      const automaticSaveFailed = typeof payload.requestId === "string" && automaticSettingsDraft.fail(payload.requestId);
      const pendingEditor = typeof payload.requestId === "string" ? takePendingTextEditor(payload.requestId) : null;
      const trackerEditFailed = typeof payload.requestId === "string"
        && trackerEditSession?.requestId === payload.requestId;
      if (trackerEditFailed && trackerEditSession) trackerEditSession.requestId = null;
      if (!saveFailed && !automaticSaveFailed && !pendingEditor && !trackerEditFailed) clearGenerationRequestPending();
      syncSettingsDraftUi();
      renderChatToolbar();
      renderTopToolbarButton();
      if (saveFailed || automaticSaveFailed) {
        tabHandle?.activate();
        showSettingsError(payload.message);
      } else if (pendingEditor?.surface === "settings") {
        showSettingsError(payload.message);
      } else {
        showTrackerError(payload.message);
      }
    }
    if (payload?.type === "text_editor_result") {
      handleTextEditorResult(payload);
    }
  });
  const offEvents = [
    ctx.events.on("CHAT_SWITCHED", () => requestState()),
    ctx.events.on("MESSAGE_EDITED", () => requestState()),
    ctx.events.on("MESSAGE_DELETED", () => requestState()),
    ctx.events.on("MESSAGE_SWIPED", () => requestState()),
    ctx.events.on("SWIPE_EDITED", () => requestState()),
    // Auto-generation is handled by the backend event subscription, which
    // receives the triggering userId directly from Spindle.
    ctx.events.on("GENERATION_ENDED", () => requestState()),
  ];

  rootRef.addEventListener("click", handleClick);
  rootRef.addEventListener("change", handleChange);
  rootRef.addEventListener("input", handleInput);
  rootRef.addEventListener("keydown", handleRootKeydown);
  toolbarRoot.addEventListener("click", handleClick);
  requestState();

  return () => {
    flushAutomaticSettingsSave();
    closeRegenerationModal();
    destroyTopToolbarButton();
    rootRef?.removeEventListener("click", handleClick);
    rootRef?.removeEventListener("change", handleChange);
    rootRef?.removeEventListener("input", handleInput);
    rootRef?.removeEventListener("keydown", handleRootKeydown);
    dockRootRef?.removeEventListener("click", handleClick);
    toolbarRoot.removeEventListener("click", handleClick);
    offBackend();
    for (const off of offEvents) off();
    offTabActivate();
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    if (drawerScrollRestoreFrame !== null) cancelAnimationFrame(drawerScrollRestoreFrame);
    drawerScrollRestoreFrame = null;
    tab.destroy();
    destroyDockPanel();
    removeStyle();
    ctx.dom.cleanup();
    ctxRef = null;
    rootRef = null;
    dockRootRef = null;
    toolbarRootRef = null;
    tabHandle = null;
    appliedTrackerPlacement = null;
    hasReceivedInitialState = false;
    drawerView = "settings";
    clearGenerationRequestPending();
    settingsRuntimeError = null;
    trackerRuntimeError = null;
    trackerEditSession = null;
    settingsDraft.reset();
    presetEditorDrafts.clear();
    automaticSettingsDraft.reset();
    pendingTextEditors.clear();
  };
}

function ensureDockPanel() {
  const ctx = ctxRef;
  if (!ctx || mergeSettings(state.settings).trackerPlacement !== "dock") return;
  // A registered Spindle root may be temporarily detached while its panel is
  // collapsed or inactive. The handle, not root.isConnected, owns its lifetime.
  if (dockRootRef && dockPanelHandle) return;
  dockRootRef?.removeEventListener("click", handleClick);
  dockRootRef?.removeEventListener("change", handleChange);
  dockRootRef?.removeEventListener("input", handleInput);
  cleanupDockResizeHandles();
  dockPanelHandle?.destroy();
  let panel: ReturnType<SpindleFrontendContext["ui"]["requestDockPanel"]>;
  try {
    panel = ctx.ui.requestDockPanel({
      edge: "right",
      title: "SceneMap",
      size: isMobileDockViewport() ? dockPanelHeight : dockPanelWidth,
      minSize: 300,
      maxSize: 620,
      resizable: true,
      startCollapsed: false,
    });
  } catch (error) {
    dockPanelHandle = null;
    dockRootRef = null;
    dockPanelError = `Could not open the SceneMap panel: ${(error as Error).message}`;
    return;
  }
  dockPanelHandle = panel;
  dockPanelError = null;
  dockRootRef = panel.root;
  dockRootRef.classList.add("scenemap-lv", "scenemap-dock-root");
  dockRootRef.addEventListener("click", handleClick);
  dockRootRef.addEventListener("change", handleChange);
  dockRootRef.addEventListener("input", handleInput);
  renderDockPanel();
  watchDockResizeHandle();
}

function destroyDockPanel() {
  dockRootRef?.removeEventListener("click", handleClick);
  dockRootRef?.removeEventListener("change", handleChange);
  dockRootRef?.removeEventListener("input", handleInput);
  dockResizeObserver?.disconnect();
  cleanupDockResizeHandles();
  dockPanelHandle?.destroy();
  dockRootRef = null;
  dockPanelHandle = null;
  dockResizeObserver = null;
  dockPanelError = null;
}

function syncTrackerPlacement() {
  // Defaults say "dock", but persisted settings may say "drawer". Waiting for the
  // first backend state prevents a dock from flashing briefly during startup.
  if (!hasReceivedInitialState) {
    destroyDockPanel();
    return;
  }
  const placement = mergeSettings(state.settings).trackerPlacement;
  if (placement !== appliedTrackerPlacement) {
    drawerView = placement === "drawer" ? "tracker" : "settings";
    appliedTrackerPlacement = placement;
  }
  if (placement === "drawer") destroyDockPanel();
  else ensureDockPanel();
}

function watchDockResizeHandle() {
  // The dock API exposes resizability but no resize-end callback or handle node.
  // Discover Lumiverse's native handle so its size can be styled and persisted.
  dockResizeObserver?.disconnect();
  cleanupDockResizeHandles();
  let observedHost: HTMLElement | null = null;

  const decorate = () => {
    const root = dockRootRef;
    if (!root?.isConnected) return null;
    const host = findDockPanelHost(root);
    if (!host) return null;

    for (let ancestor = root.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
      for (const child of ancestor.children) {
        if (!(child instanceof HTMLElement) || child.contains(root)) continue;
        const cursor = getComputedStyle(child).cursor;
        if (cursor !== "ew-resize" && cursor !== "ns-resize") continue;

        child.classList.add("scenemap-dock-resize-handle");
        child.classList.toggle("scenemap-dock-resize-horizontal", cursor === "ew-resize");
        child.classList.toggle("scenemap-dock-resize-vertical", cursor === "ns-resize");
        if (!decoratedDockResizeHandles.has(child)) {
          decoratedDockResizeHandles.add(child);
          child.addEventListener("pointerup", handleNativeDockResizeEnd);
        }
        return host;
      }
    }
    return host;
  };

  dockResizeObserver = new MutationObserver((records) => {
    const root = dockRootRef;
    if (root?.isConnected && records.every((record) => root.contains(record.target))) return;
    const host = decorate();
    if (host && host !== observedHost) {
      observedHost = host;
      dockResizeObserver?.disconnect();
      dockResizeObserver?.observe(host, { childList: true, subtree: true });
    }
  });
  dockResizeObserver.observe(document.documentElement, { childList: true, subtree: true });
  const host = decorate();
  if (host) {
    observedHost = host;
    dockResizeObserver.disconnect();
    dockResizeObserver.observe(host, { childList: true, subtree: true });
  }
}

function findDockPanelHost(element: HTMLElement): HTMLElement | null {
  for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
    if (getComputedStyle(ancestor).position === "fixed") return ancestor;
  }
  return null;
}

function handleNativeDockResizeEnd(event: PointerEvent) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const handle = event.currentTarget;
  const host = findDockPanelHost(handle);
  if (!host) return;
  const cursor = getComputedStyle(handle).cursor;
  const rect = host.getBoundingClientRect();
  const nextSize = cursor === "ns-resize" ? rect.height : rect.width;
  const clampedSize = Math.max(300, Math.min(620, Math.round(nextSize)));
  if (cursor === "ns-resize") {
    dockPanelHeight = clampedSize;
    storeDockPanelSize("height", clampedSize);
  } else {
    dockPanelWidth = clampedSize;
    storeDockPanelSize("width", clampedSize);
  }
}

function cleanupDockResizeHandles() {
  for (const handle of decoratedDockResizeHandles) {
    handle.removeEventListener("pointerup", handleNativeDockResizeEnd);
    handle.classList.remove(
      "scenemap-dock-resize-handle",
      "scenemap-dock-resize-horizontal",
      "scenemap-dock-resize-vertical",
    );
  }
  decoratedDockResizeHandles.clear();
}

function isMobileDockViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches;
}

function readStoredDockPanelSize(axis: "width" | "height", fallback: number): number {
  try {
    const stored = localStorage.getItem(`scenemap:dock-panel-${axis}`);
    const legacy = axis === "width" ? localStorage.getItem("scenemap:dock-panel-size") : null;
    const value = Number(stored ?? legacy);
    if (Number.isFinite(value) && value >= 300 && value <= 620) return Math.round(value);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
  return fallback;
}

function storeDockPanelSize(axis: "width" | "height", size: number) {
  try {
    localStorage.setItem(`scenemap:dock-panel-${axis}`, String(size));
  } catch {
    // Resizing still works for the current session when storage is unavailable.
  }
}

function send(payload: Record<string, unknown>) {
  ctxRef?.sendToBackend(payload);
}

function requestState() {
  send({ type: "get_state" });
}

function clearGenerationRequestPending() {
  isGenerationRequestPending = false;
  if (generationRequestWatchdog) clearTimeout(generationRequestWatchdog);
  generationRequestWatchdog = null;
}

function beginGenerationRequest() {
  isGenerationRequestPending = true;
  if (generationRequestWatchdog) clearTimeout(generationRequestWatchdog);
  generationRequestWatchdog = setTimeout(() => {
    generationRequestWatchdog = null;
    if (!isGenerationRequestPending) return;
    // Keep the pending flag as a conservative "may be active" state. The
    // button remains an enabled Cancel action even if the acknowledgement was
    // lost, and an explicit cancel will reset an idle backend as well.
    trackerRuntimeError = "SceneMap did not receive a generation response. Use Cancel to safely reset it.";
    renderTrackerSurfaces();
    renderChatToolbar();
    renderTopToolbarButton();
    requestState();
  }, GENERATION_REQUEST_TIMEOUT_MS);
}

function settingsSurfaceHasActiveInteraction(): boolean {
  if (!rootRef) return false;
  const settingsVisible = mergeSettings(state.settings).trackerPlacement === "dock" || drawerView === "settings";
  if (!settingsVisible) return false;
  const activeElement = document.activeElement;
  // An expanded native select is portalled, so focus alone is not sufficient.
  return (activeElement instanceof Element && rootRef.contains(activeElement))
    || rootRef.querySelector('[aria-expanded="true"]') !== null;
}

function settingsSurfaceStructureMatches(previous: SceneMapState, next: SceneMapState): boolean {
  return jsonValuesEqual(previous.settings, next.settings)
    && jsonValuesEqual(previous.connections, next.connections);
}

function render(options: { preserveSettingsSurface?: boolean } = {}) {
  syncTrackerPlacement();
  renderDockPanel();
  if (!options.preserveSettingsSurface) renderDrawerContent();
  renderChatToolbar();
  syncTopToolbarPlacement();
  renderTopToolbarButton();
  tabHandle?.setBadge(state.messagesBehind > 0 ? String(state.messagesBehind) : null);
}

function renderTrackerSurfaces() {
  renderDockPanel();
  if (mergeSettings(state.settings).trackerPlacement === "drawer" && drawerView === "tracker") {
    renderDrawerContent();
  }
}

function renderChatToolbar() {
  if (!toolbarRootRef) return;
  if (!hasReceivedInitialState) {
    toolbarRootRef.innerHTML = "";
    return;
  }
  if (!state.settings.showInputBarButton) {
    toolbarRootRef.innerHTML = "";
    return;
  }
  const isGenerating = Boolean(state.generationActive || isGenerationRequestPending);
  const isEditing = Boolean(getCurrentTrackerEditSession());
  const label = isEditing
    ? "Save or cancel the tracker edit first"
    : isGenerating ? "Cancel SceneMap generation" : state.latest ? "Regenerate SceneMap" : "Generate SceneMap";
  const isBehind = !state.latest || state.messagesBehind > 0;
  toolbarRootRef.innerHTML = `
    <button
      type="button"
      class="scenemap-chat-toolbar-btn ${isBehind ? "is-attention" : ""} ${isGenerating ? "is-generating" : ""}"
      data-action="generate"
      title="${escapeAttr(label)}"
      aria-label="${escapeAttr(label)}"
      ${state.activeMessageId && !isEditing ? "" : "disabled"}
    >
      ${isGenerating ? refreshSvg() : iconSvg}
    </button>
  `;
}

function renderDockPanel() {
  if (!dockRootRef) return;
  dockRootRef.innerHTML = trackerPanelMarkup();
}

function renderDrawerContent() {
  if (!rootRef) return;
  if (!hasReceivedInitialState) {
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    rootRef.innerHTML = "";
    return;
  }
  if (drawerScrollRestoreFrame !== null) cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  if (mergeSettings(state.settings).trackerPlacement === "drawer" && drawerView === "tracker") {
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    renderDrawerPage(trackerPanelMarkup());
    return;
  }
  if (drawerView === "macros") {
    destroySelectHandles(drawerSelectHandles);
    drawerSelectHandles = [];
    renderDrawerPage(macrosPanelMarkup());
    return;
  }
  renderDrawerSettings();
}

function renderDrawerPage(content: string) {
  if (!rootRef) return;
  let page = rootRef.firstElementChild;
  const viewSignature = availableDrawerViews().join(",");
  if (
    !(page instanceof HTMLElement)
    || !page.classList.contains("scenemap-drawer-scroll")
    || page.dataset.scenemapViews !== viewSignature
  ) {
    rootRef.innerHTML = drawerPageMarkup("");
    page = rootRef.firstElementChild;
  }
  if (!(page instanceof HTMLElement)) return;
  for (const viewName of availableDrawerViews()) {
    const active = drawerView === viewName;
    const tab = page.querySelector<HTMLElement>(`[data-action="show-${viewName}"]`);
    tab?.classList.toggle("is-active", active);
    tab?.setAttribute("aria-selected", String(active));
    tab?.setAttribute("tabindex", active ? "0" : "-1");
  }
  const view = page.querySelector<HTMLElement>(".scenemap-drawer-view");
  if (view) {
    view.setAttribute("aria-labelledby", `scenemap-tab-${drawerView}`);
    view.innerHTML = content;
  }
}

function drawerPageMarkup(content: string): string {
  const tabs = availableDrawerViews().map((viewName) => {
    const active = drawerView === viewName;
    const label = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    return `<button type="button" id="scenemap-tab-${viewName}" role="tab" data-action="show-${viewName}" aria-controls="scenemap-tabpanel" aria-selected="${active}" tabindex="${active ? "0" : "-1"}" class="${active ? "is-active" : ""}">${label}</button>`;
  }).join("");
  return `
    <div class="scenemap-drawer-scroll" data-scenemap-views="${availableDrawerViews().join(",")}">
      <nav class="scenemap-view-tabs" role="tablist" aria-label="SceneMap sections">
        ${tabs}
      </nav>
      <div class="scenemap-drawer-view" id="scenemap-tabpanel" role="tabpanel" aria-labelledby="scenemap-tab-${drawerView}">${content}</div>
    </div>
  `;
}

function availableDrawerViews(): DrawerView[] {
  return mergeSettings(state.settings).trackerPlacement === "drawer"
    ? ["tracker", "settings", "macros"]
    : ["settings", "macros"];
}

type MacroReference = { token: string; description: string };

function macrosPanelMarkup(): string {
  const roleplayMacros: readonly MacroReference[] = [{
    token: "{{scenemap}}",
    description: "Latest SceneMap tracker formatted as plain text for the roleplay prompt.",
  }];
  return `
    <div class="scenemap-shell scenemap-macros-shell">
      <section class="scenemap-macros-scroll">
        <header class="scenemap-reference-header">
          <span>Reference</span>
          <h2>Macros</h2>
        </header>
        ${macroReferenceSectionMarkup(
          "Roleplay prompt",
          "Place this in the prompt sent to your roleplay model.",
          roleplayMacros,
        )}
        ${macroReferenceSectionMarkup(
          "SceneMap generation prompts",
          "Use these inside the System and User prompt templates of a SceneMap preset. Native Lumiverse macros such as {{char}} and {{user}} also work there.",
          SCENEMAP_PROMPT_MACROS,
        )}
        ${macroReferenceSectionMarkup(
          "Legacy aliases",
          "Older presets can keep using these aliases, but the namespaced forms above are recommended for new prompts.",
          LEGACY_SCENEMAP_PROMPT_MACROS,
        )}
      </section>
    </div>
  `;
}

function macroReferenceSectionMarkup(
  title: string,
  help: string,
  macros: readonly MacroReference[],
): string {
  return `
    <section class="scenemap-macro-section">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(help)}</p>
      <div class="scenemap-macro-list">
        ${macros.map((macro) => `
          <article class="scenemap-macro-row">
            <div class="scenemap-macro-details">
              <code>${escapeHtml(macro.token)}</code>
              <span>${escapeHtml(macro.description)}</span>
            </div>
            <button type="button" class="scenemap-icon-btn scenemap-macro-copy" data-action="copy-macro" data-copy-macro="${escapeAttr(macro.token)}" title="Copy ${escapeAttr(macro.token)}" aria-label="Copy ${escapeAttr(macro.token)}">
              ${copySvg}
            </button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function trackerPanelMarkup(): string {
  const settings = mergeSettings(state.settings);
  const latest = state.latest;
  const schemaMatches = trackerMatchesEffectiveSchema(latest, settings);
  const editSession = getCurrentTrackerEditSession();
  const trackerValue = editSession?.draft ?? latest?.displayData ?? latest?.data;
  const trackerSchema = editSession ? getEffectiveTrackerSchema(settings) : null;
  // Until regeneration, derive a layout from the stored tracker itself. Applying
  // the new preset layout would hide fields from the old schema.
  const layout = latest && !schemaMatches
    ? createTrackerDataLayout(trackerValue)
    : getPresetLayout(settings, state.effectivePresetKey);
  return `
    <div class="scenemap-shell">
      <header class="scenemap-header">
        ${editSession ? `
          <button class="scenemap-pill-action scenemap-tracker-action scenemap-primary" data-action="save-tracker-edit" ${editSession.requestId ? "disabled" : ""}>${editSession.requestId ? "Saving..." : "Save"}</button>
          <button class="scenemap-pill-action scenemap-tracker-action" data-action="cancel-tracker-edit" ${editSession.requestId ? "disabled" : ""}>Cancel</button>
        ` : `
          <button class="scenemap-pill-action scenemap-tracker-action scenemap-primary" data-action="${latest && !state.generationActive && !isGenerationRequestPending ? "choose-regeneration" : "generate"}" ${state.activeMessageId ? "" : "disabled"}>
            ${state.generationActive || isGenerationRequestPending ? "Cancel" : latest ? "Regenerate" : "Generate"}
          </button>
          <button class="scenemap-pill-action scenemap-tracker-action" data-action="edit" ${schemaMatches && !state.generationActive && !isGenerationRequestPending ? "" : "disabled"}>Edit</button>
          <button class="scenemap-pill-action scenemap-tracker-action scenemap-danger" data-action="delete" ${latest ? "" : "disabled"}>Delete</button>
        `}
      </header>

      ${trackerRuntimeError ? `<div class="scenemap-runtime-error" role="alert" data-tracker-runtime-error>${escapeHtml(trackerRuntimeError)}</div>` : ""}

      <p class="scenemap-status is-${statusTone()}" role="status" aria-live="polite">${statusMarkup()}</p>

      <section class="scenemap-card scenemap-board ${editSession ? "is-editing" : ""}">
        ${latest ? renderTracker(trackerValue, layout, trackerSchema) : `<div class="scenemap-empty">Generate a SceneMap for this swipe</div>`}
      </section>
    </div>
  `;
}

function getEffectiveTrackerSchema(settings = mergeSettings(state.settings)): Record<string, unknown> {
  return settings.schemaPresets[state.effectivePresetKey]?.value
    ?? settings.schemaPresets[settings.schemaPreset]?.value
    ?? settings.schemaPresets.default.value;
}

function trackerMatchesEffectiveSchema(
  latest = state.latest,
  settings = mergeSettings(state.settings),
): boolean {
  return Boolean(latest?.schemaHash && latest.schemaHash === schemaFingerprint(getEffectiveTrackerSchema(settings)));
}

function getCurrentTrackerEditSession(): TrackerEditSession | null {
  const latest = state.latest;
  if (
    !trackerEditSession
    || !latest
    || state.chatId !== trackerEditSession.chatId
    || latest.messageId !== trackerEditSession.messageId
    || latest.swipeId !== trackerEditSession.swipeId
    || !trackerMatchesEffectiveSchema(latest)
  ) {
    trackerEditSession = null;
    return null;
  }
  return trackerEditSession;
}

function renderDrawerSettings() {
  if (!rootRef) return;
  if (drawerScrollRestoreFrame !== null) cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  // mountSelect requires rebuilding its host nodes. Preserve every possible scroll
  // owner because Lumiverse may place scrolling above the extension root.
  const scrollSnapshot = captureScrollPositions(rootRef);
  destroySelectHandles(drawerSelectHandles);
  drawerSelectHandles = [];
  const settings = mergeSettings(state.settings);
  const presetKeys = Object.keys(settings.schemaPresets);
  const canDeletePreset = settings.schemaPreset !== "default" && presetKeys.length > 1;
  const activePreset = settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const presetDraft = getPresetEditorDraft(settings, settings.schemaPreset);
  const settingsMarkup = `
    <div class="scenemap-shell scenemap-settings-shell">
      <section class="scenemap-settings-scroll">
        ${dockPanelError ? `<div class="scenemap-runtime-error" role="alert">${escapeHtml(dockPanelError)}</div>` : ""}
        ${settingsRuntimeError ? `<div class="scenemap-runtime-error" role="alert" data-settings-runtime-error>${escapeHtml(settingsRuntimeError)}</div>` : ""}
        <div class="scenemap-settings-group">
          <h3>Generation</h3>
      <label>
        <span>Connection</span>
        <div class="scenemap-native-select" data-native-setting="connectionId"></div>
      </label>
      <div class="scenemap-auto-row">
        <label class="scenemap-switch-row">
          <span>Auto-generate after assistant replies</span>
          <input type="checkbox" data-setting="autoGenerateAiTrackers" ${settings.autoGenerateAiTrackers ? "checked" : ""}>
          <span class="scenemap-switch" aria-hidden="true"></span>
        </label>
        <label class="scenemap-interval-field" ${settings.autoGenerateAiTrackers ? "" : "hidden"}>
          <span>Interval</span>
          <input type="number" min="1" step="1" data-setting="autoGenerateInterval" value="${settings.autoGenerateInterval > 1 ? settings.autoGenerateInterval : ""}" placeholder="Empty = 1 = every assistant message">
        </label>
      </div>
      <label>
        <span>Max response tokens</span>
        <input type="number" min="1" step="1" data-setting="maxResponseTokens" value="${settings.maxResponseTokens}">
      </label>
      <div class="scenemap-sampler-row">
        <label>
          <span>Temperature</span>
          <input type="number" min="0" max="2" step="0.05" data-setting="temperature" value="${settings.temperature ?? ""}" placeholder="1">
        </label>
        <label>
          <span>Top P</span>
          <input type="number" min="0" max="1" step="0.05" data-setting="topP" value="${settings.topP ?? ""}" placeholder="1">
        </label>
      </div>
        </div>
        <div class="scenemap-settings-group">
          <h3>Interface</h3>
          <label>
            <span>Tracker location</span>
            <div class="scenemap-native-select" data-native-setting="trackerPlacement"></div>
          </label>
          <div class="scenemap-interface-switches">
            <label class="scenemap-switch-row">
              <span>Show top toolbar button</span>
              <input type="checkbox" data-setting="showTopToolbarButton" ${settings.showTopToolbarButton ? "checked" : ""}>
              <span class="scenemap-switch" aria-hidden="true"></span>
            </label>
            <label class="scenemap-switch-row">
              <span>Show input bar button</span>
              <input type="checkbox" data-setting="showInputBarButton" ${settings.showInputBarButton ? "checked" : ""}>
              <span class="scenemap-switch" aria-hidden="true"></span>
            </label>
          </div>
        </div>
        <div class="scenemap-settings-group scenemap-settings-preset-row">
          <div class="scenemap-settings-group-heading">
            <h3>Presets</h3>
            <p class="scenemap-settings-dirty ${settingsDraft.dirty ? "is-visible" : ""}" data-settings-dirty aria-hidden="${!settingsDraft.dirty}">Unsaved preset changes</p>
          </div>
          <div class="scenemap-preset-toolbar">
            <label class="scenemap-preset-select">
              <span>Global preset</span>
              <div class="scenemap-native-select" data-native-setting="schemaPreset"></div>
            </label>
            <div class="scenemap-settings-preset-actions">
              <button class="scenemap-pill-action" data-action="create-preset">New</button>
              <button class="scenemap-pill-action" data-action="rename-preset">Rename</button>
              <button class="scenemap-pill-action" data-action="import-preset">Import</button>
              <button class="scenemap-pill-action" data-action="export-preset">Export</button>
              <button class="scenemap-pill-action scenemap-danger" data-action="delete-preset" ${canDeletePreset ? "" : "disabled"}>Delete</button>
            </div>
          </div>
          <div class="scenemap-preset-editor">
            <label>
              <span>Schema (JSON)</span>
              <div class="scenemap-expandable-textarea">
                <textarea data-preset-editor="schema" spellcheck="false" aria-label="Schema JSON for ${escapeAttr(activePreset.name)}">${escapeHtml(presetDraft.schemaText)}</textarea>
                ${expandEditorButton("schema")}
              </div>
            </label>
            <div class="scenemap-inline-error scenemap-preset-schema-error" role="alert" data-preset-schema-error ${presetDraft.schemaError ? "" : "hidden"}>${escapeHtml(presetDraft.schemaError ?? "")}</div>
            <label>
              <span>System prompt</span>
              <div class="scenemap-expandable-textarea">
                <textarea data-preset-editor="systemPrompt" aria-label="System prompt for ${escapeAttr(activePreset.name)}" placeholder="System instructions and reference context.">${escapeHtml(presetDraft.systemPromptText)}</textarea>
                ${expandEditorButton("systemPrompt")}
              </div>
            </label>
            <label>
              <span>User prompt</span>
              <div class="scenemap-expandable-textarea">
                <textarea data-preset-editor="userPrompt" aria-label="User prompt for ${escapeAttr(activePreset.name)}" placeholder="Chat history and tracker instructions.">${escapeHtml(presetDraft.userPromptText)}</textarea>
                ${expandEditorButton("userPrompt")}
              </div>
            </label>
            <div class="scenemap-preset-layout-row">
              <button class="scenemap-pill-action" data-action="edit-layout">Layout</button>
              <button class="scenemap-pill-action scenemap-primary" data-action="save-preset" data-save-preset ${settingsDraft.saving || !settingsDraft.dirty ? "disabled" : ""}>${settingsDraft.saving ? "Saving..." : "Save preset"}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
  renderDrawerPage(settingsMarkup);
  mountSettingsSelects(settings);
  restoreScrollPositions(scrollSnapshot);
  drawerScrollRestoreFrame = requestAnimationFrame(() => {
    drawerScrollRestoreFrame = null;
    restoreScrollPositions(scrollSnapshot);
  });
}

function mountSettingsSelects(settings: SceneMapSettings) {
  if (!ctxRef || !rootRef) return;
  const mount = (
    key: "connectionId" | "schemaPreset" | "trackerPlacement",
    options: SpindleSelectOption[],
    value: string,
    extra: Partial<Parameters<SpindleFrontendContext["components"]["mountSelect"]>[1]> = {},
  ) => {
    const target = rootRef?.querySelector(`[data-native-setting="${key}"]`);
    if (!target || !ctxRef) return;
    drawerSelectHandles.push(ctxRef.components.mountSelect(target, {
      options,
      value,
      portal: true,
      triggerClassName: "scenemap-secondary-control",
      ariaLabel: key === "connectionId"
        ? "Connection"
        : key === "schemaPreset"
          ? "Global preset"
          : "Tracker location",
      onChange: (nextValue) => updateNativeSetting(key, nextValue),
      ...extra,
    }));
  };

  mount(
    "connectionId",
    state.connections.map((connection) => ({
      value: connection.id,
      label: connection.name,
      sublabel: `${connection.model || connection.provider}${connection.is_default ? " · default" : ""}`,
    })),
    settings.connectionId,
    {
      placeholder: "Default active connection",
      clearable: true,
      clearLabel: "Default active connection",
      searchPlaceholder: "Search connections...",
    },
  );
  mount(
    "trackerPlacement",
    [
      { value: "dock", label: "Dock panel" },
      { value: "drawer", label: "Drawer" },
    ],
    settings.trackerPlacement,
    { searchThreshold: Number.MAX_SAFE_INTEGER },
  );
  mount(
    "schemaPreset",
    presetSelectOptions(settings),
    settings.schemaPreset,
    { searchPlaceholder: "Search presets..." },
  );
}

function presetSelectOptions(settings: SceneMapSettings): SpindleSelectOption[] {
  const nameCounts = new Map<string, number>();
  for (const preset of Object.values(settings.schemaPresets)) {
    const name = preset.name.trim().toLocaleLowerCase();
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  return Object.entries(settings.schemaPresets).map(([key, preset]) => ({
    value: key,
    label: preset.name,
    sublabel: (nameCounts.get(preset.name.trim().toLocaleLowerCase()) ?? 0) > 1 ? key : undefined,
  }));
}

function updateNativeSetting(
  key: "connectionId" | "schemaPreset" | "trackerPlacement",
  value: string,
) {
  const settings = mergeSettings(state.settings);
  if (key === "trackerPlacement") settings.trackerPlacement = value === "drawer" ? "drawer" : "dock";
  else settings[key] = value;
  if (key === "schemaPreset") {
    updateSettingsDraft(settings);
    queueMicrotask(() => render());
    return;
  }
  state = { ...state, settings };
  queueAutomaticSettingsSave(settings, key, true);
  if (key === "trackerPlacement") queueMicrotask(() => render());
}

function queueAutomaticSettingsSave(settings: SceneMapSettings, key: AutomaticallySavedSetting, immediate: boolean) {
  // Text/number inputs are debounced; discrete controls flush immediately. The
  // draft tracker keeps either path optimistic across backend state snapshots.
  automaticSettingsDraft.queue(key, settings[key]);
  if (automaticSaveTimer) clearTimeout(automaticSaveTimer);
  automaticSaveTimer = null;
  if (immediate) {
    flushAutomaticSettingsSave();
    return;
  }
  automaticSaveTimer = setTimeout(flushAutomaticSettingsSave, 450);
}

function flushAutomaticSettingsSave() {
  if (automaticSaveTimer) clearTimeout(automaticSaveTimer);
  automaticSaveTimer = null;
  const requestId = `automatic-settings-${Date.now()}-${++automaticSaveRequestSeq}`;
  const settings = automaticSettingsDraft.begin(requestId);
  if (!settings) return;
  send({ type: "save_automatic_settings", requestId, settings });
}

function destroySelectHandles(handles: SpindleSelectHandle[]) {
  for (const handle of handles) handle.destroy();
}

type ElementScrollSnapshot = {
  element: HTMLElement;
  top: number;
  left: number;
};

function captureScrollPositions(root: HTMLElement): ElementScrollSnapshot[] {
  const snapshots: ElementScrollSnapshot[] = [];
  // The drawer/modal host, not SceneMap itself, can own scroll depending on the
  // Lumiverse viewport. Snapshot the ancestor chain instead of guessing one node.
  for (let element: HTMLElement | null = root; element; element = element.parentElement) {
    snapshots.push({ element, top: element.scrollTop, left: element.scrollLeft });
  }
  return snapshots;
}

function restoreScrollPositions(snapshots: ElementScrollSnapshot[]) {
  for (const snapshot of snapshots) {
    if (!snapshot.element.isConnected) continue;
    snapshot.element.scrollTo({ top: snapshot.top, left: snapshot.left, behavior: "instant" });
  }
}

function statusText(): string {
  if (!state.chatId) return "Open a chat to start tracking";
  if (isMappingScene()) return "Mapping this scene";
  if (getCurrentTrackerEditSession()) return "Editing tracker — save or cancel your changes";
  if (state.latest && !state.latest.schemaMatchesCurrent) return "Schema changed — regenerate to update";
  const autoText = autoGenerateStatusText();
  if (autoText) return autoText;
  if (!state.latest) return "This scene is unmapped";
  if (state.messagesBehind > 0) return `SceneMap is ${state.messagesBehind} message${state.messagesBehind === 1 ? "" : "s"} behind`;
  return "SceneMap is updated";
}
function autoGenerateStatusText(): string | null {
  if (!state.settings.autoGenerateAiTrackers || state.autoGenerateMessagesRemaining == null) return null;
  if (state.autoGenerateMessagesRemaining <= 0) return "Auto-generation is due";
  if (state.autoGenerateMessagesRemaining === 1) return "Auto-generates on next assistant message";
  return `Auto-generates in ${state.autoGenerateMessagesRemaining} assistant messages`;
}

type SceneMapStatusTone = "neutral" | "info" | "warning" | "success" | "generating";

function isMappingScene(): boolean {
  return Boolean(state.generationActive || state.generatingMessageId || isGenerationRequestPending);
}

function statusTone(): SceneMapStatusTone {
  if (!state.chatId) return "neutral";
  if (isMappingScene()) return "generating";
  if (getCurrentTrackerEditSession()) return "info";
  if (state.latest && !state.latest.schemaMatchesCurrent) return "warning";
  if (state.settings.autoGenerateAiTrackers && state.autoGenerateMessagesRemaining != null) {
    return state.autoGenerateMessagesRemaining <= 0 ? "warning" : "info";
  }
  if (!state.latest) return "neutral";
  if (state.messagesBehind > 0) return "warning";
  return "success";
}

function statusMarkup(): string {
  const indicator = `<span class="scenemap-status-indicator" aria-hidden="true"></span>`;
  if (!isMappingScene()) return `${indicator}<span>${escapeHtml(statusText())}</span>`;
  return `${indicator}<span>Mapping this scene<span class="scenemap-loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></span>`;
}

function handleClick(event: Event) {
  const target = event.target as HTMLElement;
  const button = target.closest<HTMLElement>("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "show-tracker" && mergeSettings(state.settings).trackerPlacement === "drawer") {
    activateDrawerView("tracker");
  }
  if (action === "show-settings") activateDrawerView("settings");
  if (action === "show-macros") activateDrawerView("macros");
  if (action === "copy-macro") void copyMacroReference(button);
  if (action === "expand-preset-editor") {
    event.preventDefault();
    const editor = button.dataset.editor;
    if (editor === "schema" || editor === "systemPrompt" || editor === "userPrompt") {
      openPresetExpandedEditor(editor);
    }
  }
  if (action === "generate") {
    const command = getGenerationButtonCommand(state.generationActive, isGenerationRequestPending);
    dispatchGeneration({ type: command });
  }
  if (action === "choose-regeneration") openRegenerationModal();
  if (action === "edit") startTrackerEdit();
  if (action === "save-tracker-edit") saveTrackerEdit();
  if (action === "cancel-tracker-edit") cancelTrackerEdit();
  if (action === "add-tracker-card") addTrackerEditCard(button);
  if (action === "remove-tracker-card") removeTrackerEditCard(button);
  if (action === "add-tracker-chip") addTrackerEditChip(button);
  if (action === "remove-tracker-chip") removeTrackerEditChip(button);
  if (action === "delete" && state.latest) void confirmDeleteTracker();
  if (action === "create-preset" && ensureActivePresetEditorValid() && ensureCurrentPresetLayoutValid()) createPreset();
  if (action === "rename-preset") renamePreset();
  if (action === "import-preset") void importPreset();
  if (action === "export-preset" && ensureActivePresetEditorValid() && ensureCurrentPresetLayoutValid()) exportPreset();
  if (action === "delete-preset") deletePreset();
  if (action === "edit-layout" && ensureActivePresetEditorValid()) editLayout();
  if (action === "save-preset") {
    flushAutomaticSettingsSave();
    if (!preparePresetDraftsForSave()) return;
    const requestId = `settings-${Date.now()}-${++settingsSaveRequestSeq}`;
    if (!settingsDraft.beginSave(requestId)) return;
    renderDrawerSettings();
    send({ type: "save_preset_settings", requestId, settings: state.settings });
  }
}

function startTrackerEdit() {
  const latest = state.latest;
  const chatId = state.chatId;
  if (!latest || !trackerMatchesEffectiveSchema(latest) || !chatId || state.generationActive || isGenerationRequestPending) return;
  clearTrackerRuntimeError();
  trackerEditSession = {
    chatId,
    messageId: latest.messageId,
    swipeId: latest.swipeId,
    baseline: cloneTrackerEditValue(latest.data),
    draft: cloneTrackerEditValue(latest.data),
    requestId: null,
  };
  renderTrackerEditSurface({ focusFirstControl: true });
  renderChatToolbar();
  renderTopToolbarButton();
}

function saveTrackerEdit() {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  clearTrackerRuntimeError();
  try {
    const validated = validateTrackerData(session.draft, getEffectiveTrackerSchema(), "Edited tracker");
    session.draft = cloneTrackerEditValue(validated);
  } catch (error) {
    showTrackerError((error as Error).message);
    return;
  }
  const requestId = `tracker-edit-${Date.now()}-${++trackerEditRequestSeq}`;
  session.requestId = requestId;
  renderTrackerEditSurface();
  send({
    type: "edit_tracker",
    requestId,
    chatId: session.chatId,
    messageId: session.messageId,
    swipeId: session.swipeId,
    expectedData: session.baseline,
    data: session.draft,
  });
}

function cancelTrackerEdit() {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  trackerEditSession = null;
  clearTrackerRuntimeError();
  renderTrackerEditSurface();
  renderChatToolbar();
  renderTopToolbarButton();
}

function addTrackerEditCard(button: HTMLElement) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const itemSchema = path ? getTrackerSchemaAtPath(getEffectiveTrackerSchema(), [...path, 0]) : null;
  if (!path || !itemSchema || !appendTrackerArrayItem(session.draft, path, createTrackerEditDefaultValue(itemSchema))) return;
  renderTrackerEditSurface({ focusLastCardName: true });
}

function removeTrackerEditCard(button: HTMLElement) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const index = Number(button.dataset.editIndex);
  if (!path || !Number.isSafeInteger(index) || !removeTrackerArrayItem(session.draft, path, index)) return;
  renderTrackerEditSurface();
}

function addTrackerEditChip(button: HTMLElement) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const itemSchema = path ? getTrackerSchemaAtPath(getEffectiveTrackerSchema(), [...path, 0]) : null;
  if (!path || !itemSchema || !appendTrackerArrayItem(session.draft, path, createTrackerEditDefaultValue(itemSchema))) return;
  renderTrackerEditSurface({ focusLastChip: true });
}

function removeTrackerEditChip(button: HTMLElement) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  const path = readTrackerEditPath(button.dataset.editPath);
  const index = Number(button.dataset.editIndex);
  if (!path || !Number.isSafeInteger(index) || !removeTrackerArrayItem(session.draft, path, index)) return;
  renderTrackerEditSurface();
}

function renderTrackerEditSurface(options: {
  focusFirstControl?: boolean;
  focusLastCardName?: boolean;
  focusLastChip?: boolean;
} = {}) {
  const root = mergeSettings(state.settings).trackerPlacement === "drawer" ? rootRef : dockRootRef;
  const scrollSnapshot = root ? captureScrollPositions(root) : [];
  if (drawerScrollRestoreFrame !== null) cancelAnimationFrame(drawerScrollRestoreFrame);
  drawerScrollRestoreFrame = null;
  renderTrackerSurfaces();
  restoreScrollPositions(scrollSnapshot);
  drawerScrollRestoreFrame = requestAnimationFrame(() => {
    drawerScrollRestoreFrame = null;
    restoreScrollPositions(scrollSnapshot);
    const currentRoot = mergeSettings(state.settings).trackerPlacement === "drawer" ? rootRef : dockRootRef;
    if (options.focusFirstControl) {
      currentRoot?.querySelector<HTMLElement>("[data-tracker-edit-control]")?.focus();
    } else if (options.focusLastCardName) {
      const names = currentRoot?.querySelectorAll<HTMLElement>(".scenemap-character-name-edit [data-tracker-edit-control]");
      names?.item(names.length - 1)?.focus();
    } else if (options.focusLastChip) {
      const chips = currentRoot?.querySelectorAll<HTMLElement>("[data-tracker-edit-chip]");
      chips?.item(chips.length - 1)?.focus();
    }
  });
}

function reconcileTrackerEditSession(incomingState: SceneMapState, payload: any) {
  const session = trackerEditSession;
  if (!session) return;
  if (typeof payload?.trackerEditRequestId === "string" && payload.trackerEditRequestId === session.requestId) {
    trackerEditSession = null;
    trackerRuntimeError = null;
    return;
  }
  const latest = incomingState.latest;
  if (
    incomingState.chatId !== session.chatId
    || !latest
    || latest.messageId !== session.messageId
    || latest.swipeId !== session.swipeId
    || !latest.schemaMatchesCurrent
  ) {
    trackerEditSession = null;
    return;
  }
  if (!jsonValuesEqual(latest.data, session.baseline)) {
    trackerEditSession = null;
    trackerRuntimeError = "This tracker changed while it was being edited. Open Edit again to use the newest values.";
  }
}

function dispatchGeneration(payload: Record<string, unknown>) {
  clearTrackerRuntimeError();
  beginGenerationRequest();
  renderTrackerSurfaces();
  renderChatToolbar();
  send(payload);
}

function openRegenerationModal() {
  const ctx = ctxRef;
  const latest = state.latest;
  if (!ctx || !latest || state.generationActive || isGenerationRequestPending) return;
  closeRegenerationModal();

  const snapshot = {
    messageId: latest.messageId,
    swipeId: latest.swipeId,
    data: latest.data,
    schemaMatchesCurrent: latest.schemaMatchesCurrent,
  };
  const fields = snapshot.schemaMatchesCurrent ? collectRegeneratableFields(snapshot.data) : [];
  let modal: ReturnType<SpindleFrontendContext["ui"]["showModal"]>;
  try {
    modal = ctx.ui.showModal({
      title: "Regenerate SceneMap",
      width: 560,
      maxHeight: 680,
    });
  } catch (error) {
    showTrackerError((error as Error).message);
    return;
  }
  regenerationModalHandle = modal;
  const root = modal.root;
  root.classList.add("scenemap-editor", "scenemap-regeneration-modal");
  const modeName = `scenemap-regeneration-mode-${modal.modalId}`;
  const fieldMarkup = renderRegenerationFieldChoices(fields);
  root.innerHTML = `
    <div class="scenemap-regeneration-options">
      <label class="scenemap-regeneration-mode is-entire">
        <input type="radio" name="${escapeAttr(modeName)}" value="entire" checked>
        <span>
          <strong>Entire tracker</strong>
          <small>Regenerate everything and advance the tracker to the latest assistant reply.</small>
        </span>
      </label>
      <label class="scenemap-regeneration-mode">
        <input type="radio" name="${escapeAttr(modeName)}" value="fields" ${fields.length > 0 ? "" : "disabled"}>
        <span>
          <strong>Selected fields</strong>
          <small>Replace only the checked values in this tracker.</small>
        </span>
      </label>
      ${snapshot.schemaMatchesCurrent
        ? `<div class="scenemap-regeneration-fields">${fieldMarkup || `<p class="scenemap-regeneration-note">This tracker has no individual values to select.</p>`}</div>`
        : `<p class="scenemap-regeneration-note is-warning">This tracker uses another or unknown schema. Regenerate the entire tracker before updating individual fields.</p>`}
    </div>
    <div class="scenemap-inline-error" role="alert" data-regeneration-error hidden></div>
    <div class="scenemap-modal-actions">
      <span class="scenemap-modal-spacer"></span>
      <button type="button" class="scenemap-pill-action" data-regeneration-action="cancel">Cancel</button>
      <button type="button" class="scenemap-pill-action scenemap-primary" data-regeneration-action="submit">Regenerate</button>
    </div>
  `;

  const syncControls = () => {
    const mode = root.querySelector<HTMLInputElement>(`input[name="${CSS.escape(modeName)}"]:checked`)?.value ?? "entire";
    const selectedCount = root.querySelectorAll<HTMLInputElement>("[data-regeneration-field]:checked").length;
    root.classList.toggle("is-selecting-fields", mode === "fields");
    const submit = root.querySelector<HTMLButtonElement>('[data-regeneration-action="submit"]');
    if (submit) {
      submit.disabled = mode === "fields" && selectedCount === 0;
      submit.textContent = mode === "fields"
        ? selectedCount > 0 ? `Regenerate selected (${selectedCount})` : "Regenerate selected"
        : "Regenerate";
    }
  };
  const handleChange = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.matches("[data-regeneration-field]")) {
      const fieldsMode = root.querySelector<HTMLInputElement>(`input[name="${CSS.escape(modeName)}"][value="fields"]`);
      if (fieldsMode && !fieldsMode.disabled) fieldsMode.checked = true;
    }
    syncControls();
  };
  const handleModalClick = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-regeneration-action]");
    if (!button) return;
    if (button.dataset.regenerationAction === "cancel") {
      modal.dismiss();
      return;
    }
    if (button.dataset.regenerationAction !== "submit") return;

    const currentLatest = state.latest;
    const errorNode = root.querySelector<HTMLElement>("[data-regeneration-error]");
    if (
      !currentLatest
      || currentLatest.messageId !== snapshot.messageId
      || currentLatest.swipeId !== snapshot.swipeId
    ) {
      if (errorNode) {
        errorNode.textContent = "The active tracker changed while this window was open. Close it and choose the fields again.";
        errorNode.hidden = false;
      }
      return;
    }
    const mode = root.querySelector<HTMLInputElement>(`input[name="${CSS.escape(modeName)}"]:checked`)?.value ?? "entire";
    if (mode === "entire") {
      modal.dismiss();
      dispatchGeneration({ type: "generate_tracker" });
      return;
    }
    const paths = Array.from(root.querySelectorAll<HTMLInputElement>("[data-regeneration-field]:checked"))
      .map((input) => Number(input.dataset.regenerationField))
      .filter((index) => Number.isSafeInteger(index) && fields[index])
      .map((index) => fields[index].path);
    if (paths.length === 0) {
      syncControls();
      return;
    }
    modal.dismiss();
    dispatchGeneration({
      type: "regenerate_fields",
      messageId: snapshot.messageId,
      swipeId: snapshot.swipeId,
      paths,
    });
  };
  root.addEventListener("change", handleChange);
  root.addEventListener("click", handleModalClick);
  modal.onDismiss(() => {
    root.removeEventListener("change", handleChange);
    root.removeEventListener("click", handleModalClick);
    if (regenerationModalHandle === modal) regenerationModalHandle = null;
  });
  syncControls();
}

function renderRegenerationFieldChoices(fields: RegeneratableField[]): string {
  const groups = new Map<string, { labels: string[]; fields: Array<{ field: RegeneratableField; index: number }> }>();
  fields.forEach((field, index) => {
    const labels = field.groups.length > 0 ? field.groups : ["Tracker"];
    const key = JSON.stringify(labels);
    const group = groups.get(key) ?? { labels, fields: [] };
    group.fields.push({ field, index });
    groups.set(key, group);
  });
  return Array.from(groups.values()).map((group) => `
    <section class="scenemap-regeneration-group">
      <h3>${escapeHtml(group.labels.join(" \u203a "))}</h3>
      ${group.fields.map(({ field, index }) => `
        <label class="scenemap-regeneration-field">
          <input type="checkbox" data-regeneration-field="${index}">
          <span>
            <strong>${escapeHtml(field.label)}</strong>
            <small>${escapeHtml(regenerationValuePreview(field.currentValue))}</small>
          </span>
        </label>
      `).join("")}
    </section>
  `).join("");
}

function regenerationValuePreview(value: unknown): string {
  const formatted = formatDisplayValue(value).replace(/\s+/g, " ").trim();
  if (!formatted) return "Empty";
  return formatted.length > 140 ? `${formatted.slice(0, 137)}...` : formatted;
}

function closeRegenerationModal() {
  const modal = regenerationModalHandle;
  regenerationModalHandle = null;
  modal?.dismiss();
}

function activateDrawerView(view: DrawerView, focusTab = false) {
  drawerView = view;
  renderDrawerContent();
  if (focusTab) {
    queueMicrotask(() => rootRef?.querySelector<HTMLElement>(`[data-action="show-${view}"]`)?.focus());
  }
}

function handleRootKeydown(event: KeyboardEvent) {
  const tab = (event.target as HTMLElement).closest<HTMLElement>('.scenemap-view-tabs [role="tab"]');
  if (!tab) return;
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const views = availableDrawerViews();
  const currentView = tab.dataset.action?.replace(/^show-/, "") as DrawerView | undefined;
  const currentIndex = currentView ? views.indexOf(currentView) : -1;
  if (currentIndex < 0) return;
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? views.length - 1
      : event.key === "ArrowLeft"
        ? (currentIndex - 1 + views.length) % views.length
        : (currentIndex + 1) % views.length;
  const nextView = views[nextIndex];
  activateDrawerView(nextView, true);
}

async function copyMacroReference(button: HTMLElement): Promise<void> {
  const value = button.dataset.copyMacro;
  if (!value || !(button instanceof HTMLButtonElement)) return;
  button.disabled = true;
  const originalTitle = `Copy ${value}`;
  try {
    await copyTextToClipboard(value);
    button.innerHTML = checkSvg;
    button.classList.add("is-copied");
    button.title = `Copied ${value}`;
    button.setAttribute("aria-label", button.title);
    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.innerHTML = copySvg;
      button.classList.remove("is-copied");
      button.title = originalTitle;
      button.setAttribute("aria-label", originalTitle);
    }, 1500);
  } catch {
    button.title = "Could not copy macro";
    button.setAttribute("aria-label", button.title);
  } finally {
    button.disabled = false;
  }
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  try {
    if (!document.execCommand("copy")) throw new Error("The browser refused the copy command.");
  } finally {
    textarea.remove();
  }
}

async function confirmDeleteTracker() {
  const chatId = state.chatId;
  const messageId = state.latest?.messageId;
  if (!chatId || !messageId) return;
  const result = await ctxRef?.ui.showConfirm({
    title: "Delete SceneMap",
    message: "Delete the tracker for this scene? You can generate it again later.",
    variant: "danger",
    confirmLabel: "Delete",
  });
  // The confirmation is asynchronous; never delete a different tracker if the
  // user switches chats while the dialog is open.
  if (!result?.confirmed || state.chatId !== chatId || state.latest?.messageId !== messageId) return;
  clearTrackerRuntimeError();
  send({ type: "delete_tracker", messageId });
}

function updateSettingsDraft(settings: SceneMapSettings) {
  clearSettingsRuntimeError();
  state = { ...state, settings };
  settingsDraft.update(presetSettingsFingerprint(settings));
  syncSettingsDraftUi();
}

function presetSettingsFingerprint(settings: SceneMapSettings): string {
  // Invalid JSON cannot be copied into schemaPresets yet, but it must still make
  // the preset dirty and survive state refreshes until the user fixes it.
  const invalidSchemaDrafts = Object.fromEntries(
    Array.from(presetEditorDrafts.entries())
      .filter(([, draft]) => draft.schemaError !== null)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, draft]) => [key, draft.schemaText]),
  );
  return schemaFingerprint({
    schemaPreset: settings.schemaPreset,
    schemaPresets: settings.schemaPresets,
    invalidSchemaDrafts,
  });
}

function refreshSettingsDraftFingerprint(settings = state.settings) {
  clearSettingsRuntimeError();
  settingsDraft.update(presetSettingsFingerprint(settings));
  syncSettingsDraftUi();
}

function syncSettingsDraftUi() {
  const indicator = rootRef?.querySelector<HTMLElement>("[data-settings-dirty]");
  indicator?.classList.toggle("is-visible", settingsDraft.dirty);
  indicator?.setAttribute("aria-hidden", String(!settingsDraft.dirty));
  const saveButton = rootRef?.querySelector<HTMLButtonElement>("[data-save-preset]");
  if (saveButton) {
    saveButton.disabled = settingsDraft.saving || !settingsDraft.dirty;
    saveButton.textContent = settingsDraft.saving ? "Saving..." : "Save preset";
  }
}

function getPresetEditorDraft(settings: SceneMapSettings, key: string): PresetEditorDraft {
  const existing = presetEditorDrafts.get(key);
  if (existing) return existing;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const draft: PresetEditorDraft = {
    schemaText: JSON.stringify(preset.value, null, 2),
    systemPromptText: getPresetSystemPrompt(settings, key),
    userPromptText: getPresetUserPrompt(settings, key),
    schemaError: null,
  };
  presetEditorDrafts.set(key, draft);
  return draft;
}

function parseSchemaEditorText(text: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Schema JSON must be an object.");
  }
  const schema = parsed as Record<string, unknown>;
  validateSchemaDefinition(schema);
  return schema;
}

function updatePresetEditorControl(target: HTMLInputElement | HTMLTextAreaElement) {
  const editor = target.dataset.presetEditor;
  if (editor !== "schema" && editor !== "systemPrompt" && editor !== "userPrompt") return;
  updatePresetEditorValue(editor, target.value);
}

function updatePresetEditorValue(editor: PresetTextEditor, value: string) {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const draft = getPresetEditorDraft(settings, key);
  if (editor === "systemPrompt" || editor === "userPrompt") {
    const isSystem = editor === "systemPrompt";
    const nextPrompt = value;
    if (isSystem) draft.systemPromptText = value;
    else draft.userPromptText = value;
    const currentPrompt = isSystem
      ? getPresetSystemPrompt(settings, key)
      : getPresetUserPrompt(settings, key);
    if (nextPrompt !== currentPrompt) {
      settings.schemaPresets[key] = isSystem
        ? { ...preset, systemPrompt: nextPrompt }
        : { ...preset, userPrompt: nextPrompt };
      updateSettingsDraft(settings);
    } else {
      refreshSettingsDraftFingerprint(settings);
    }
    return;
  }

  draft.schemaText = value;
  try {
    const schema = parseSchemaEditorText(value);
    setPresetSchemaError(draft, null);
    if (!jsonValuesEqual(schema, preset.value)) {
      settings.schemaPresets[key] = { ...preset, value: schema };
      updateSettingsDraft(settings);
    } else {
      refreshSettingsDraftFingerprint(settings);
    }
  } catch (error) {
    setPresetSchemaError(draft, (error as Error).message);
    refreshSettingsDraftFingerprint(settings);
  }
}

function expandEditorButton(editor: PresetTextEditor): string {
  const label = editor === "schema" ? "Schema JSON" : editor === "systemPrompt" ? "System prompt" : "User prompt";
  return `
    <button
      type="button"
      class="scenemap-expand-editor-btn"
      data-action="expand-preset-editor"
      data-editor="${editor}"
      title="Expand editor"
      aria-label="Expand ${label} editor"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>
      </svg>
    </button>
  `;
}

function openPresetExpandedEditor(editor: PresetTextEditor) {
  const settings = mergeSettings(state.settings);
  const draft = getPresetEditorDraft(settings, settings.schemaPreset);
  const title = editor === "schema"
    ? "SceneMap Schema JSON"
    : editor === "systemPrompt" ? "SceneMap System Prompt" : "SceneMap User Prompt";
  const value = editor === "schema"
    ? draft.schemaText
    : editor === "systemPrompt" ? draft.systemPromptText : draft.userPromptText;
  openTextEditor(title, value, (nextValue) => {
    updatePresetEditorValue(editor, nextValue);
    renderDrawerSettings();
  }, "settings");
}

function setPresetSchemaError(draft: PresetEditorDraft, message: string | null) {
  draft.schemaError = message;
  const error = rootRef?.querySelector<HTMLElement>("[data-preset-schema-error]");
  if (!error) return;
  error.hidden = !message;
  error.textContent = message ?? "";
}

function applyPresetEditorDraft(settings: SceneMapSettings, key: string): void {
  const draft = presetEditorDrafts.get(key);
  const preset = settings.schemaPresets[key];
  if (!draft || !preset) return;
  try {
    const schema = parseSchemaEditorText(draft.schemaText);
    draft.schemaError = null;
    settings.schemaPresets[key] = {
      ...preset,
      value: schema,
      systemPrompt: draft.systemPromptText,
      userPrompt: draft.userPromptText,
    };
  } catch (error) {
    draft.schemaError = (error as Error).message;
    throw error;
  }
}

function ensureActivePresetEditorValid(): boolean {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  try {
    applyPresetEditorDraft(settings, key);
    state = { ...state, settings };
    const draft = presetEditorDrafts.get(key);
    if (draft) setPresetSchemaError(draft, null);
    return true;
  } catch {
    const draft = presetEditorDrafts.get(key);
    if (draft) setPresetSchemaError(draft, draft.schemaError);
    return false;
  }
}

function preparePresetDraftsForSave(): boolean {
  // Preset switches keep editor drafts in memory. Validate all of them so Save
  // cannot silently omit an invalid edit made in a previously selected preset.
  const settings = mergeSettings(state.settings);
  for (const key of presetEditorDrafts.keys()) {
    if (!settings.schemaPresets[key]) continue;
    try {
      applyPresetEditorDraft(settings, key);
    } catch {
      settings.schemaPreset = key;
      state = { ...state, settings };
      renderDrawerSettings();
      return false;
    }
  }
  state = { ...state, settings };
  for (const key of Object.keys(settings.schemaPresets)) {
    try {
      validatePresetLayout(settings, key);
    } catch (error) {
      const presetName = settings.schemaPresets[key]?.name ?? key;
      showSettingsError(`Layout for preset "${presetName}" needs attention: ${(error as Error).message}`);
      return false;
    }
  }
  return true;
}

function validatePresetLayout(settings: SceneMapSettings, key: string) {
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const layout = cloneLayout(getPresetLayout(settings, key));
  validateLayout(layout, extractSchemaFieldOptions(preset.value));
}

function ensureCurrentPresetLayoutValid(): boolean {
  const settings = mergeSettings(state.settings);
  try {
    validatePresetLayout(settings, settings.schemaPreset);
    return true;
  } catch (error) {
    showSettingsError(`Layout needs attention: ${(error as Error).message}`);
    return false;
  }
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (target.dataset.trackerEditControl) {
    updateTrackerEditControl(target);
    return;
  }
  const key = target.dataset.setting;
  if (!isAutomaticallySavedSetting(key)) return;
  updateSettingFromControl(target, key, true);
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target.dataset.trackerEditControl) {
    updateTrackerEditControl(target);
    return;
  }
  if (target.dataset.presetEditor) {
    updatePresetEditorControl(target);
    return;
  }
  const key = target.dataset.setting;
  if (!isAutomaticallySavedSetting(key) || target.type === "checkbox") return;
  updateSettingFromControl(target as HTMLInputElement, key, false);
}

function updateTrackerEditControl(target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const session = getCurrentTrackerEditSession();
  if (!session || session.requestId) return;
  const path = readTrackerEditPath(target.dataset.editPath);
  const kind = target.dataset.editKind as TrackerEditControlKind | undefined;
  if (!path || !kind) return;
  const schema = getTrackerSchemaAtPath(getEffectiveTrackerSchema(), path);
  const value = parseTrackerEditValue(kind, target.value, schema);
  if (!setTrackerValueAtPath(session.draft, path, value)) {
    showTrackerError("This field cannot be edited safely.");
  }
}

function readTrackerEditPath(value: string | undefined): TrackerEditPath | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.every((part) => typeof part === "string" || (Number.isSafeInteger(part) && part >= 0))
      ? parsed as TrackerEditPath
      : null;
  } catch {
    return null;
  }
}

function trackerEditPathAttr(path: TrackerEditPath): string {
  return escapeAttr(JSON.stringify(path));
}

function isAutomaticallySavedSetting(key: string | undefined): key is AutomaticallySavedSetting {
  return key === "connectionId"
    || key === "autoGenerateAiTrackers"
    || key === "autoGenerateInterval"
    || key === "maxResponseTokens"
    || key === "temperature"
    || key === "topP"
    || key === "showInputBarButton"
    || key === "showTopToolbarButton"
    || key === "trackerPlacement";
}

function updateSettingFromControl(
  target: HTMLInputElement | HTMLSelectElement,
  key: AutomaticallySavedSetting,
  immediate: boolean,
) {
  const settings = mergeSettings(state.settings);
  clearSettingsRuntimeError();
  if (key === "autoGenerateAiTrackers") {
    settings.autoGenerateAiTrackers = (target as HTMLInputElement).checked;
  } else if (key === "showInputBarButton") {
    settings.showInputBarButton = (target as HTMLInputElement).checked;
  } else if (key === "showTopToolbarButton") {
    settings.showTopToolbarButton = (target as HTMLInputElement).checked;
  } else if (key === "trackerPlacement") {
    settings.trackerPlacement = target.value === "drawer" ? "drawer" : "dock";
  } else if (key === "autoGenerateInterval") {
    settings.autoGenerateInterval = Math.max(1, Math.floor(Number(target.value) || 1));
  } else if (key === "temperature" || key === "topP") {
    const value = target.value.trim();
    const parsed = Number(value);
    const maximum = key === "temperature" ? 2 : 1;
    const normalized = value === "" || !Number.isFinite(parsed)
      ? null
      : Math.max(0, Math.min(maximum, parsed));
    settings[key] = normalized;
    if (normalized !== null && normalized !== parsed) target.value = String(normalized);
  } else if (key === "maxResponseTokens") {
    const value = target.value.trim();
    if (value === "" && !immediate) return;
    const normalized = value === ""
      ? defaultSettings.maxResponseTokens
      : Math.max(1, Math.floor(Number(value) || 1));
    settings.maxResponseTokens = normalized;
    if (value === "" || Number(value) !== normalized) target.value = String(normalized);
  } else {
    (settings as any)[key] = target.value;
  }
  state = { ...state, settings };
  queueAutomaticSettingsSave(settings, key, immediate);
  if (key === "autoGenerateAiTrackers") {
    const intervalField = rootRef?.querySelector<HTMLElement>(".scenemap-interval-field");
    if (intervalField) intervalField.hidden = !settings.autoGenerateAiTrackers;
  }
  if (key === "showInputBarButton") renderChatToolbar();
  if (key === "showTopToolbarButton") {
    syncTopToolbarPlacement();
    renderTopToolbarButton();
  }
  if (key === "trackerPlacement") render();
}

function createPreset() {
  const settings = mergeSettings(state.settings);
  const activePreset = settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  openNameEditor("New Preset", "", "Create preset", (name) => {
    ensureUniquePresetName(settings, name);
    const key = uniquePresetKey(slugifyPresetName(name), settings.schemaPresets);
    settings.schemaPresets[key] = {
      name,
      value: JSON.parse(JSON.stringify(activePreset.value)) as Record<string, unknown>,
      systemPrompt: getPresetSystemPrompt(settings),
      userPrompt: getPresetUserPrompt(settings),
      displayLayout: cloneLayout(getPresetLayout(settings)),
    };
    updateSettingsDraft({ ...settings, schemaPreset: key });
    render();
  });
}

function renamePreset() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  openNameEditor("Rename Preset", preset.name, "Save", (name) => {
    if (name === preset.name) return;
    ensureUniquePresetName(settings, name, key);
    settings.schemaPresets[key] = { ...preset, name };
    updateSettingsDraft(settings);
    render();
  });
}

async function deletePreset() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  if (key === "default") return;
  const preset = settings.schemaPresets[key];
  if (!preset || Object.keys(settings.schemaPresets).length <= 1) return;
  const result = await ctxRef?.ui.showConfirm({
    title: "Delete Preset",
    message: `Delete "${preset.name}"?`,
    variant: "danger",
    confirmLabel: "Delete",
  });
  if (!result?.confirmed) return;
  delete settings.schemaPresets[key];
  presetEditorDrafts.delete(key);
  const fallbackKey = settings.schemaPresets.default ? "default" : Object.keys(settings.schemaPresets)[0];
  updateSettingsDraft({ ...settings, schemaPreset: fallbackKey });
  render();
}

function exportPreset() {
  const settings = mergeSettings(state.settings);
  const preset = settings.schemaPresets[settings.schemaPreset] ?? settings.schemaPresets.default;
  const data = {
    type: "scenemap-preset",
    version: 2,
    name: preset.name,
    schema: preset.value,
    systemPrompt: getPresetSystemPrompt(settings),
    userPrompt: getPresetUserPrompt(settings),
    layout: getPresetLayout(settings),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugifyPresetName(preset.name)}.scenemap-preset.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importPreset() {
  const ctx = ctxRef;
  if (!ctx) return;
  try {
    const files = await ctx.uploads.pickFile({
      accept: [".json", "application/json"],
      multiple: false,
      maxSizeBytes: 512_000,
    });
    const file = files?.[0];
    if (!file) return;
    const text = new TextDecoder().decode(file.bytes);
    const imported = parsePresetImport(JSON.parse(text), file.name);
    openNameEditor("Import Preset", imported.name, "Import", (name) => {
      const settings = mergeSettings(state.settings);
      ensureUniquePresetName(settings, name);
      const key = uniquePresetKey(slugifyPresetName(name), settings.schemaPresets);
      settings.schemaPresets[key] = {
        name,
        value: imported.schema,
        systemPrompt: imported.systemPrompt,
        userPrompt: imported.userPrompt,
        displayLayout: imported.layout,
      };
      settings.schemaPreset = key;
      updateSettingsDraft(settings);
      render();
    });
  } catch (err) {
    showSettingsError((err as Error).message || "Could not import preset.");
  }
}

function parsePresetImport(value: unknown, filename: string): {
  name: string;
  schema: Record<string, unknown>;
  systemPrompt: string;
  userPrompt: string;
  layout: TrackerBoardDisplayLayout;
} {
  const record = getRecord(value);
  if (record.type !== "scenemap-preset") throw new Error("This is not a SceneMap preset file.");
  const schema = getRecord(record.schema);
  if (Object.keys(schema).length === 0) throw new Error("Preset file is missing a schema object.");
  validateSchemaDefinition(schema);
  const isVersionTwo = Number(record.version) >= 2;
  if (isVersionTwo && (typeof record.systemPrompt !== "string" || typeof record.userPrompt !== "string")) {
    throw new Error("Preset file is missing its System or User prompt.");
  }
  if (!isVersionTwo && typeof record.prompt !== "string") {
    throw new Error("Preset file is missing a prompt string.");
  }
  const layout = normalizeImportedLayout(record.layout);
  validateLayout(layout, extractSchemaFieldOptions(schema));
  return {
    name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : filename.replace(/\.json$/i, "").replace(/\.scenemap-preset$/i, ""),
    schema,
    systemPrompt: isVersionTwo ? record.systemPrompt as string : DEFAULT_SYSTEM_PROMPT,
    userPrompt: isVersionTwo
      ? record.userPrompt as string
      : migrateLegacyUserPrompt(record.prompt as string, 0),
    layout,
  };
}

function normalizeImportedLayout(value: unknown): TrackerBoardDisplayLayout {
  const record = getRecord(value);
  if (!Array.isArray(record.sections)) throw new Error("Preset file is missing a layout sections array.");
  return {
    sections: record.sections.map((section) => {
      const sectionRecord = getRecord(section);
      if (!Array.isArray(sectionRecord.fields)) throw new Error("Every layout section must include a fields array.");
      return {
        title: typeof sectionRecord.title === "string" ? sectionRecord.title : "",
        fields: sectionRecord.fields.map(normalizeImportedField),
      };
    }),
  };
}

function normalizeImportedField(value: unknown): TrackerBoardField {
  const record = getRecord(value);
  const display = typeof record.display === "string" && isTrackerFieldDisplay(record.display) ? record.display : "text";
  return {
    path: typeof record.path === "string" ? record.path : "",
    label: typeof record.label === "string" ? record.label : undefined,
    display,
    center: record.center === true,
    fields: Array.isArray(record.fields) ? record.fields.map(normalizeImportedField) : undefined,
  };
}

function isTrackerFieldDisplay(value: string): value is TrackerFieldDisplay {
  return ["text", "subtle", "mono", "chips", "progress", "character_cards"].includes(value);
}

function openNameEditor(title: string, initialValue: string, submitLabel: string, onSave: (name: string) => void) {
  const ctx = ctxRef;
  if (!ctx) return;
  const modal = ctx.ui.showModal({ title, width: 420, maxHeight: 260 });
  modal.root.innerHTML = `
    <div class="scenemap-name-editor">
      <label>
        <span>Name</span>
        <input data-name-input value="${escapeAttr(initialValue)}" placeholder="Preset name">
      </label>
      <div class="scenemap-modal-actions">
        <button class="scenemap-pill-action" data-modal-action="cancel">Cancel</button>
        <button class="scenemap-pill-action scenemap-primary" data-modal-action="save">${escapeHtml(submitLabel)}</button>
      </div>
      <div class="scenemap-inline-error" role="alert" hidden></div>
    </div>
  `;
  const input = modal.root.querySelector("[data-name-input]") as HTMLInputElement;
  const error = modal.root.querySelector(".scenemap-inline-error") as HTMLElement;
  input.focus();
  input.select();
  const save = () => {
    const name = input.value.trim();
    if (!name) throw new Error("Preset name is required.");
    onSave(name);
    modal.dismiss();
  };
  modal.root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    const target = event.target as HTMLElement;
    if (target !== input && !target.closest('[data-modal-action="save"]')) return;
    event.preventDefault();
    try {
      save();
    } catch (err) {
      error.hidden = false;
      error.textContent = (err as Error).message;
    }
  });
  modal.root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-modal-action]");
    if (!button) return;
    if (button.dataset.modalAction === "cancel") {
      modal.dismiss();
      return;
    }
    try {
      save();
    } catch (err) {
      error.hidden = false;
      error.textContent = (err as Error).message;
    }
  });
}

function slugifyPresetName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "preset";
}

function uniquePresetKey(base: string, presets: Record<string, unknown>): string {
  let key = base;
  let index = 2;
  while (Object.prototype.hasOwnProperty.call(presets, key)) {
    key = `${base}_${index}`;
    index += 1;
  }
  return key;
}

function ensureUniquePresetName(settings: SceneMapSettings, name: string, ignoredKey?: string) {
  const normalizedName = name.trim().toLocaleLowerCase();
  const duplicate = Object.entries(settings.schemaPresets).some(([key, preset]) => (
    key !== ignoredKey && preset.name.trim().toLocaleLowerCase() === normalizedName
  ));
  if (duplicate) throw new Error(`A preset named "${name.trim()}" already exists.`);
}

function editLayout() {
  const settings = mergeSettings(state.settings);
  const key = settings.schemaPreset;
  const preset = settings.schemaPresets[key] ?? settings.schemaPresets.default;
  const fieldOptions = extractSchemaFieldOptions(preset.value);
  // Work on an isolated clone: Cancel must not mutate the live settings object,
  // and equality against the original avoids false "unsaved changes" states.
  const originalLayout = cloneLayout(getPresetLayout(settings, key));
  const workingLayout = cloneLayout(originalLayout);
  const ctx = ctxRef;
  if (!ctx) return;

  const modal = ctx.ui.showModal({ title: "SceneMap Layout", width: 860, maxHeight: 760 });
  const modalScroller = modal.root.parentElement;
  const previousOverflowAnchor = modalScroller?.style.overflowAnchor ?? "";
  // Browser scroll anchoring fights DOM redraws in the modal and causes small
  // jumps on mobile, so SceneMap restores the exact position itself.
  if (modalScroller) modalScroller.style.overflowAnchor = "none";
  let layoutSelectHandles: SpindleSelectHandle[] = [];
  let layoutSortables: Sortable[] = [];
  let scrollRestoreFrame: number | null = null;
  const draw = (preserveScroll = true) => {
    const scroller = modal.root.querySelector(".scenemap-layout-sections") as HTMLElement | null;
    const scrollTop = preserveScroll ? scroller?.scrollTop ?? 0 : 0;
    const modalScrollTop = preserveScroll ? modalScroller?.scrollTop ?? 0 : 0;
    const modalScrollLeft = preserveScroll ? modalScroller?.scrollLeft ?? 0 : 0;
    if (scrollRestoreFrame !== null) {
      cancelAnimationFrame(scrollRestoreFrame);
      scrollRestoreFrame = null;
    }
    destroyLayoutSortables(layoutSortables);
    layoutSortables = [];
    destroySelectHandles(layoutSelectHandles);
    layoutSelectHandles = [];
    modal.root.innerHTML = renderLayoutEditor(workingLayout, fieldOptions);
    const nextScroller = modal.root.querySelector(".scenemap-layout-sections") as HTMLElement | null;
    if (nextScroller) nextScroller.scrollTop = scrollTop;
    layoutSelectHandles = mountLayoutSelects(modal.root, workingLayout, fieldOptions, draw);
    layoutSortables = mountLayoutSortables(modal.root, workingLayout, draw);
    if (preserveScroll && modalScroller) {
      modalScroller.scrollTo({ top: modalScrollTop, left: modalScrollLeft, behavior: "instant" });
      // Restore once synchronously and once after Lumiverse finishes layout.
      scrollRestoreFrame = requestAnimationFrame(() => {
        scrollRestoreFrame = null;
        if (!modal.root.isConnected) return;
        modalScroller.scrollTo({ top: modalScrollTop, left: modalScrollLeft, behavior: "instant" });
        if (nextScroller) nextScroller.scrollTop = scrollTop;
      });
    }
  };
  modal.onDismiss(() => {
    if (modalScroller) modalScroller.style.overflowAnchor = previousOverflowAnchor;
    if (scrollRestoreFrame !== null) cancelAnimationFrame(scrollRestoreFrame);
    scrollRestoreFrame = null;
    destroyLayoutSortables(layoutSortables);
    layoutSortables = [];
    destroySelectHandles(layoutSelectHandles);
    layoutSelectHandles = [];
  });
  draw(false);
  modal.root.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    const sectionIndex = readIndex(target.dataset.section);
    const fieldIndex = readIndex(target.dataset.field);
    const childIndex = readIndex(target.dataset.child);
    if (target.dataset.layoutInput === "section-title" && sectionIndex !== null) {
      workingLayout.sections[sectionIndex].title = target.value;
    }
    if (target.dataset.layoutInput === "field-label" && sectionIndex !== null && fieldIndex !== null) {
      workingLayout.sections[sectionIndex].fields[fieldIndex].label = target.value;
    }
    if (target.dataset.layoutInput === "child-label" && sectionIndex !== null && fieldIndex !== null && childIndex !== null) {
      const field = workingLayout.sections[sectionIndex].fields[fieldIndex];
      if (field.fields?.[childIndex]) field.fields[childIndex].label = target.value;
    }
  });
  modal.root.addEventListener("keydown", (event) => {
    // Drag handles double as an accessible keyboard reordering control.
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-layout-drag]");
    if (!handle) return;
    const kind = handle.dataset.layoutDrag as LayoutDragKind | undefined;
    if (!kind) return;
    const sectionIndex = readIndex(handle.dataset.section);
    const fieldIndex = readIndex(handle.dataset.field);
    const childIndex = readIndex(handle.dataset.child);
    const currentIndex = kind === "section" ? sectionIndex : kind === "field" ? fieldIndex : childIndex;
    if (currentIndex === null) return;
    event.preventDefault();
    const nextIndex = currentIndex + (event.key === "ArrowUp" ? -1 : 1);
    const itemCount = getLayoutItemCount(workingLayout, kind, sectionIndex, fieldIndex);
    if (!reorderLayoutItem(workingLayout, kind, currentIndex, nextIndex, sectionIndex, fieldIndex)) {
      announceLayoutReorder(modal.root, kind, currentIndex, itemCount, true);
      return;
    }
    draw();
    focusLayoutDragHandle(modal.root, kind, nextIndex, sectionIndex, fieldIndex);
    queueMicrotask(() => announceLayoutReorder(modal.root, kind, nextIndex, itemCount));
  });
  modal.root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-layout-action]");
    if (!button) return;
    const sectionIndex = readIndex(button.dataset.section);
    const fieldIndex = readIndex(button.dataset.field);
    const childIndex = readIndex(button.dataset.child);
    const action = button.dataset.layoutAction;
    try {
      if (action === "add-section") workingLayout.sections.push({ title: "New Section", fields: [] });
      if (action === "remove-section" && sectionIndex !== null) workingLayout.sections.splice(sectionIndex, 1);
      if (action === "add-field" && sectionIndex !== null) {
        workingLayout.sections[sectionIndex].fields.push(createFieldFromOption(getAvailableFieldOptions(workingLayout, fieldOptions)[0]));
      }
      if (action === "remove-field" && sectionIndex !== null && fieldIndex !== null) {
        workingLayout.sections[sectionIndex].fields.splice(fieldIndex, 1);
      }
      if (action === "add-child" && sectionIndex !== null && fieldIndex !== null) {
        const field = workingLayout.sections[sectionIndex].fields[fieldIndex];
        const parentOption = findFieldOption(fieldOptions, field.path);
        field.fields = field.fields ?? [];
        field.fields.push(createFieldFromOption(getAvailableChildOptions(field, parentOption?.children ?? [])[0]));
      }
      if (action === "remove-child" && sectionIndex !== null && fieldIndex !== null && childIndex !== null) {
        workingLayout.sections[sectionIndex].fields[fieldIndex].fields?.splice(childIndex, 1);
      }
      if (action === "cancel") {
        modal.dismiss();
        return;
      }
      if (action === "save-layout") {
        validateLayout(workingLayout, fieldOptions);
        if (jsonValuesEqual(workingLayout, originalLayout)) {
          modal.dismiss();
          return;
        }
        settings.schemaPresets[key] = { ...preset, displayLayout: cloneLayout(workingLayout) };
        updateSettingsDraft(settings);
        render();
        modal.dismiss();
        return;
      }
      draw();
    } catch (err) {
      const error = modal.root.querySelector(".scenemap-inline-error") as HTMLElement | null;
      if (error) {
        error.hidden = false;
        error.textContent = (err as Error).message;
      }
    }
  });
}

type SchemaFieldOption = {
  path: string;
  label: string;
  display: TrackerFieldDisplay;
  children?: SchemaFieldOption[];
};

function renderLayoutEditor(layout: TrackerBoardDisplayLayout, options: SchemaFieldOption[]): string {
  const hasAvailableFields = getAvailableFieldOptions(layout, options).length > 0;
  return `
    <div class="scenemap-layout-editor">
      <div class="scenemap-layout-intro">
        <button type="button" class="scenemap-layout-add-btn" data-layout-action="add-section" ${hasAvailableFields ? "" : "disabled"}>${layoutIcon("plus")}<span>Add section</span></button>
      </div>
      <div class="scenemap-layout-sections" data-layout-sortable="section">
        ${layout.sections.map((section, sectionIndex) => renderLayoutSection(section, sectionIndex, layout, options)).join("")}
      </div>
      <div class="scenemap-modal-actions">
        <span class="scenemap-modal-spacer"></span>
        <button type="button" class="scenemap-pill-action" data-layout-action="cancel">Cancel</button>
        <button type="button" class="scenemap-pill-action scenemap-primary" data-layout-action="save-layout">Save</button>
      </div>
      <div class="scenemap-inline-error" role="alert" hidden></div>
      <p class="scenemap-sr-only" aria-live="polite" data-layout-announcer></p>
    </div>
  `;
}

function renderLayoutSection(section: TrackerBoardDisplayLayout["sections"][number], sectionIndex: number, layout: TrackerBoardDisplayLayout, options: SchemaFieldOption[]): string {
  const hasAvailableFields = getAvailableFieldOptions(layout, options).length > 0;
  return `
    <section class="scenemap-layout-section" data-layout-section-item>
      <header class="scenemap-layout-section-header">
        <label>
          <span>Section name</span>
          <input data-layout-input="section-title" data-section="${sectionIndex}" value="${escapeAttr(section.title)}">
        </label>
        <div class="scenemap-layout-actions">
          ${iconButton("remove-section", "Remove section", "trash", { section: sectionIndex })}
          ${layoutDragHandle("section", "Drag to reorder section", { section: sectionIndex })}
        </div>
      </header>
      <div class="scenemap-layout-fields" data-layout-sortable="field" data-section="${sectionIndex}">
        ${section.fields.map((field, fieldIndex) => renderLayoutField(field, sectionIndex, fieldIndex, options)).join("")}
      </div>
      <button type="button" class="scenemap-layout-add-btn" data-layout-action="add-field" data-section="${sectionIndex}" ${hasAvailableFields ? "" : "disabled"}>${layoutIcon("plus")}<span>Add field</span></button>
    </section>
  `;
}

function renderLayoutField(field: TrackerBoardField, sectionIndex: number, fieldIndex: number, options: SchemaFieldOption[]): string {
  const option = findFieldOption(options, field.path);
  const missingFromSchema = !option;
  const childEditor = field.display === "character_cards"
    ? renderChildFieldEditor(field, option?.children ?? [], sectionIndex, fieldIndex)
    : "";
  return `
    <article class="scenemap-layout-field ${missingFromSchema ? "is-missing-schema-field" : ""}" data-layout-field-item>
      <div class="scenemap-layout-field-row ${field.display === "chips" ? "has-chip-center" : ""}">
        ${layoutDragHandle("field", "Drag to reorder field", { section: sectionIndex, field: fieldIndex })}
        <div class="scenemap-native-select" data-layout-select="field-path" data-section="${sectionIndex}" data-field="${fieldIndex}"></div>
        <input aria-label="Label" data-layout-input="field-label" data-section="${sectionIndex}" data-field="${fieldIndex}" value="${escapeAttr(field.label ?? option?.label ?? "")}" placeholder="Label">
        <div class="scenemap-layout-display-controls ${field.display === "chips" ? "has-center-select" : ""}">
          <div class="scenemap-native-select" data-layout-select="field-display" data-section="${sectionIndex}" data-field="${fieldIndex}"></div>
          ${field.display === "chips" ? `<div class="scenemap-native-select" data-layout-select="field-center" data-section="${sectionIndex}" data-field="${fieldIndex}"></div>` : ""}
        </div>
        ${iconButton("remove-field", "Remove field", "trash", { section: sectionIndex, field: fieldIndex })}
      </div>
      ${missingFromSchema ? `<div class="scenemap-layout-schema-warning" role="status">Field “${escapeHtml(field.path)}” no longer exists in this schema.</div>` : ""}
      ${childEditor}
    </article>
  `;
}

function renderChildFieldEditor(field: TrackerBoardField, options: SchemaFieldOption[], sectionIndex: number, fieldIndex: number): string {
  const children = field.fields ?? [];
  const hasAvailableChildren = getAvailableChildOptions(field, options).length > 0;
  return `
    <div class="scenemap-layout-child-box">
      <div class="scenemap-layout-child-header">
        <strong>Card fields</strong>
        <button type="button" class="scenemap-layout-add-btn" data-layout-action="add-child" data-section="${sectionIndex}" data-field="${fieldIndex}" ${hasAvailableChildren ? "" : "disabled"}>${layoutIcon("plus")}<span>Add card field</span></button>
      </div>
      <div class="scenemap-layout-child-list" data-layout-sortable="child" data-section="${sectionIndex}" data-field="${fieldIndex}">
        ${children.map((child, childIndex) => renderChildField(child, childIndex, sectionIndex, fieldIndex, options)).join("")}
      </div>
    </div>
  `;
}

function renderChildField(child: TrackerBoardField, childIndex: number, sectionIndex: number, fieldIndex: number, options: SchemaFieldOption[]): string {
  const missingFromSchema = !findFieldOption(options, child.path);
  return `
    <div class="scenemap-layout-child ${missingFromSchema ? "is-missing-schema-field" : ""}" data-layout-child-item>
      <div class="scenemap-layout-child-row ${child.display === "chips" ? "has-chip-center" : ""}">
        ${layoutDragHandle("child", "Drag to reorder card field", { section: sectionIndex, field: fieldIndex, child: childIndex })}
        <div class="scenemap-native-select" data-layout-select="child-path" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}"></div>
        <input aria-label="Card field label" data-layout-input="child-label" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}" value="${escapeAttr(child.label ?? "")}" placeholder="Label">
        <div class="scenemap-layout-display-controls ${child.display === "chips" ? "has-center-select" : ""}">
          <div class="scenemap-native-select" data-layout-select="child-display" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}"></div>
          ${child.display === "chips" ? `<div class="scenemap-native-select" data-layout-select="child-center" data-section="${sectionIndex}" data-field="${fieldIndex}" data-child="${childIndex}"></div>` : ""}
        </div>
        ${iconButton("remove-child", "Remove card field", "trash", { section: sectionIndex, field: fieldIndex, child: childIndex })}
      </div>
      ${missingFromSchema ? `<div class="scenemap-layout-schema-warning" role="status">Card field “${escapeHtml(child.path)}” no longer exists in this schema.</div>` : ""}
    </div>
  `;
}

function syncTopToolbarPlacement() {
  if (!ctxRef || !hasReceivedInitialState || !state.settings.showTopToolbarButton) {
    stopTopToolbarObserver();
    clearTopToolbarInjection();
    return;
  }
  observeTopToolbar();
  ensureTopToolbarInjection();
}

function ensureTopToolbarInjection() {
  const ctx = ctxRef;
  if (!ctx || !hasReceivedInitialState || !state.settings.showTopToolbarButton) return;
  const toolbar = document.querySelector<HTMLElement>('[class*="chatToolbar"]');
  if (!toolbar) return;
  if (topToolbarInjection?.isConnected && topToolbarInjection.parentElement === toolbar) return;
  clearTopToolbarInjection();
  topToolbarInjection = ctx.dom.inject(
    toolbar,
    '<span class="scenemap-top-toolbar-host"><button type="button" class="scenemap-top-toolbar-btn" data-scenemap-top-toolbar-button></button></span>',
    "beforeend",
  );
  topToolbarInjection.addEventListener("click", handleTopToolbarClick);
  topToolbarInjection.addEventListener("pointerup", handleTopToolbarPointerUp);
  topToolbarInjection.addEventListener("keydown", handleTopToolbarKeydown);
  renderTopToolbarButton();
}

function renderTopToolbarButton() {
  if (!state.settings.showTopToolbarButton) return;
  if (!topToolbarInjection?.isConnected) {
    scheduleTopToolbarEnsure();
    return;
  }
  const button = topToolbarInjection.querySelector<HTMLButtonElement>("[data-scenemap-top-toolbar-button]");
  if (!button) return;
  const isGenerating = Boolean(state.generationActive || isGenerationRequestPending);
  const isEditing = Boolean(getCurrentTrackerEditSession());
  const status = getTopToolbarStatus(state, isGenerationRequestPending);
  const actionLabel = isEditing
    ? "Save or cancel the tracker edit first"
    : isGenerating
    ? "Cancel SceneMap generation"
    : state.latest ? "Regenerate SceneMap" : "Generate SceneMap";
  const accessibleLabel = `${actionLabel} — ${status.text}`;
  button.className = `scenemap-top-toolbar-btn is-${status.tone} ${isGenerating ? "is-generating" : ""}`;
  button.title = `${accessibleLabel} — Double-click to open tracker`;
  button.setAttribute("aria-label", accessibleLabel);
  button.disabled = isEditing || (!state.activeMessageId && !isGenerating);
  button.innerHTML = `
    <span class="scenemap-top-toolbar-dot" aria-hidden="true"></span>
    <span class="scenemap-top-toolbar-icon" aria-hidden="true">${isGenerating ? refreshSvg() : iconSvg}</span>
  `;
}

function handleTopToolbarPointerUp(event: Event) {
  const pointerEvent = event as PointerEvent;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled || !pointerEvent.isPrimary || pointerEvent.button !== 0) return;
  // Mobile WebViews may synthesize a click with detail=0 after a touch. Suppress
  // every click following a real pointer event instead of treating detail=0 as
  // proof of keyboard activation.
  topToolbarSuppressClickUntil = performance.now() + 800;
  const delay = pointerEvent.pointerType === "touch" || pointerEvent.pointerType === "pen"
    ? TOP_TOOLBAR_DOUBLE_TOUCH_MS
    : TOP_TOOLBAR_DOUBLE_CLICK_MS;
  scheduleTopToolbarTap(delay);
}

function handleTopToolbarClick(event: Event) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled) return;
  // Pointer activations are already handled on pointerup. This click path is a
  // fallback for assistive technology and browsers without Pointer Events.
  if (performance.now() < topToolbarSuppressClickUntil) {
    event.preventDefault();
    return;
  }
  scheduleTopToolbarTap(TOP_TOOLBAR_DOUBLE_CLICK_MS);
}

function handleTopToolbarKeydown(event: Event) {
  const keyboardEvent = event as KeyboardEvent;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled || (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ")) return;
  event.preventDefault();
  topToolbarSuppressClickUntil = performance.now() + 800;
  if (topToolbarTapTimer) clearTimeout(topToolbarTapTimer);
  topToolbarTapTimer = null;
  runTopToolbarPrimaryAction();
}

function scheduleTopToolbarTap(delay: number) {
  if (topToolbarTapTimer) {
    clearTimeout(topToolbarTapTimer);
    topToolbarTapTimer = null;
    openTrackerSurface();
    return;
  }
  topToolbarTapTimer = setTimeout(() => {
    topToolbarTapTimer = null;
    runTopToolbarPrimaryAction();
  }, delay);
}

function runTopToolbarPrimaryAction() {
  const button = topToolbarInjection?.querySelector<HTMLButtonElement>("[data-scenemap-top-toolbar-button]");
  if (!button || button.disabled) return;
  const command = getGenerationButtonCommand(state.generationActive, isGenerationRequestPending);
  dispatchGeneration({ type: command });
}

function openTrackerSurface() {
  if (mergeSettings(state.settings).trackerPlacement === "drawer") {
    drawerView = "tracker";
    tabHandle?.activate();
    renderDrawerContent();
    return;
  }
  ensureDockPanel();
  dockPanelHandle?.expand();
  renderDockPanel();
}

function observeTopToolbar() {
  const root = document.querySelector<HTMLElement>('[class*="chatColumnInner"]')
    ?? document.querySelector<HTMLElement>('[class*="chatColumn"]')
    ?? document.body;
  if (topToolbarObserver && topToolbarObservationRoot === root && root.isConnected) return;
  stopTopToolbarObserver();
  topToolbarObservationRoot = root;
  topToolbarObserver = new MutationObserver((records) => {
    if (records.every((record) => (
      record.target instanceof Element
      && record.target.closest(".scenemap-top-toolbar-host")
    ))) return;
    scheduleTopToolbarEnsure();
  });
  topToolbarObserver.observe(root, { childList: true, subtree: true });
}

function scheduleTopToolbarEnsure() {
  if (topToolbarEnsureQueued) return;
  topToolbarEnsureQueued = true;
  queueMicrotask(() => {
    topToolbarEnsureQueued = false;
    ensureTopToolbarInjection();
  });
}

function clearTopToolbarInjection() {
  const injection = topToolbarInjection;
  topToolbarInjection = null;
  if (topToolbarTapTimer) clearTimeout(topToolbarTapTimer);
  topToolbarTapTimer = null;
  topToolbarSuppressClickUntil = Number.NEGATIVE_INFINITY;
  if (!injection) return;
  injection.removeEventListener("click", handleTopToolbarClick);
  injection.removeEventListener("pointerup", handleTopToolbarPointerUp);
  injection.removeEventListener("keydown", handleTopToolbarKeydown);
  ctxRef?.dom.uninject(injection);
}

function stopTopToolbarObserver() {
  topToolbarObserver?.disconnect();
  topToolbarObserver = null;
  topToolbarObservationRoot = null;
}

function destroyTopToolbarButton() {
  stopTopToolbarObserver();
  clearTopToolbarInjection();
  topToolbarEnsureQueued = false;
}

function getDisplayOptions(allowCards: boolean): Array<{ value: TrackerFieldDisplay; label: string }> {
  const displays: Array<{ value: TrackerFieldDisplay; label: string }> = [
    { value: "text", label: "Text" },
    { value: "subtle", label: "Subtle" },
    { value: "mono", label: "Mono" },
    { value: "chips", label: "Chips" },
    { value: "progress", label: "Progress" },
  ];
  if (allowCards) displays.push({ value: "character_cards", label: "Cards" });
  return displays;
}

function mountLayoutSelects(
  root: HTMLElement,
  layout: TrackerBoardDisplayLayout,
  options: SchemaFieldOption[],
  redraw: (preserveScroll?: boolean) => void,
): SpindleSelectHandle[] {
  const ctx = ctxRef;
  if (!ctx) return [];
  const handles: SpindleSelectHandle[] = [];
  for (const target of root.querySelectorAll<HTMLElement>("[data-layout-select]")) {
    const kind = target.dataset.layoutSelect;
    const sectionIndex = readIndex(target.dataset.section);
    const fieldIndex = readIndex(target.dataset.field);
    const childIndex = readIndex(target.dataset.child);
    if (sectionIndex === null || fieldIndex === null) continue;
    const field = layout.sections[sectionIndex]?.fields[fieldIndex];
    if (!field) continue;

    let value = "";
    let selectOptions: SpindleSelectOption[] = [];
    let ariaLabel = "Layout option";
    let searchable = false;
    if (kind === "field-path") {
      value = field.path;
      ariaLabel = "Field";
      searchable = true;
      selectOptions = getAvailableFieldOptions(layout, options, field.path).map((option) => ({
        value: option.path,
        label: option.label,
        sublabel: option.path,
      }));
    } else if (kind === "field-display") {
      const option = findFieldOption(options, field.path);
      value = field.display ?? option?.display ?? "text";
      ariaLabel = "Display";
      selectOptions = getDisplayOptions(!!option?.children?.length);
    } else if (kind === "field-center") {
      value = field.center === true ? "yes" : "no";
      ariaLabel = "Center chips";
      selectOptions = getChipCenterOptions();
    } else if (kind === "child-path" && childIndex !== null) {
      const child = field.fields?.[childIndex];
      if (!child) continue;
      const parentOption = findFieldOption(options, field.path);
      value = child.path;
      ariaLabel = "Card field";
      searchable = true;
      selectOptions = getAvailableChildOptions(field, parentOption?.children ?? [], child.path).map((option) => ({
        value: option.path,
        label: option.label,
        sublabel: option.path,
      }));
    } else if (kind === "child-display" && childIndex !== null) {
      const child = field.fields?.[childIndex];
      if (!child) continue;
      value = child.display ?? "text";
      ariaLabel = "Card field display";
      selectOptions = getDisplayOptions(false);
    } else if (kind === "child-center" && childIndex !== null) {
      const child = field.fields?.[childIndex];
      if (!child) continue;
      value = child.center === true ? "yes" : "no";
      ariaLabel = "Center card field chips";
      selectOptions = getChipCenterOptions();
    } else {
      continue;
    }

    handles.push(ctx.components.mountSelect(target, {
      options: selectOptions,
      value,
      portal: true,
      triggerClassName: "scenemap-secondary-control",
      ariaLabel,
      searchThreshold: searchable ? 8 : Number.MAX_SAFE_INTEGER,
      searchPlaceholder: searchable ? "Search fields..." : undefined,
      onChange: (nextValue) => {
        if (kind === "field-path") {
          const option = findFieldOption(options, nextValue);
          field.path = nextValue;
          field.label = option?.label ?? humanizeTrackerKey(nextValue.split(".").pop() || nextValue);
          field.display = option?.display ?? "text";
          field.fields = option?.children?.slice(0, 4).map((child) => ({
            path: child.path,
            label: child.label,
            display: child.display === "character_cards" ? "text" : child.display,
          }));
        } else if (kind === "field-display") {
          field.display = nextValue as TrackerFieldDisplay;
        } else if (kind === "field-center") {
          field.center = nextValue === "yes";
          // No structural change: avoid a redraw that would close the native select.
          return;
        } else if (kind === "child-path" && childIndex !== null && field.fields?.[childIndex]) {
          const parentOption = findFieldOption(options, field.path);
          const option = parentOption?.children?.find((child) => child.path === nextValue);
          field.fields[childIndex].path = nextValue;
          field.fields[childIndex].label = option?.label ?? humanizeTrackerKey(nextValue.split(".").pop() || nextValue);
          field.fields[childIndex].display = option?.display === "character_cards" ? "text" : option?.display ?? "text";
        } else if (kind === "child-display" && childIndex !== null && field.fields?.[childIndex]) {
          field.fields[childIndex].display = nextValue as TrackerFieldDisplay;
        } else if (kind === "child-center" && childIndex !== null && field.fields?.[childIndex]) {
          field.fields[childIndex].center = nextValue === "yes";
          // No structural change: avoid a redraw that would close the native select.
          return;
        }
        queueMicrotask(() => redraw());
      },
    }));
  }
  return handles;
}

function getChipCenterOptions(): SpindleSelectOption[] {
  return [
    { value: "yes", label: "Center - Yes" },
    { value: "no", label: "Center - No" },
  ];
}

type LayoutDragKind = "section" | "field" | "child";

function mountLayoutSortables(
  root: HTMLElement,
  layout: TrackerBoardDisplayLayout,
  redraw: (preserveScroll?: boolean) => void,
): Sortable[] {
  const instances: Sortable[] = [];
  const scrollContainer = root.querySelector<HTMLElement>(".scenemap-layout-sections");
  for (const container of root.querySelectorAll<HTMLElement>("[data-layout-sortable]")) {
    const kind = container.dataset.layoutSortable as LayoutDragKind | undefined;
    if (!kind) continue;
    const draggable = kind === "section"
      ? "> [data-layout-section-item]"
      : kind === "field"
        ? "> [data-layout-field-item]"
        : "> [data-layout-child-item]";
    instances.push(Sortable.create(container, {
      draggable,
      handle: `.scenemap-layout-drag-handle[data-layout-drag="${kind}"]`,
      direction: "vertical",
      animation: prefersReducedMotion() ? 0 : 170,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      delay: 200,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      fallbackTolerance: 4,
      // Sortable's fallback path is the consistent implementation across desktop
      // pointer input and mobile long-press; native HTML drag is unreliable on touch.
      forceFallback: true,
      fallbackOnBody: true,
      scroll: scrollContainer ?? true,
      bubbleScroll: false,
      scrollSensitivity: 24,
      scrollSpeed: 8,
      ghostClass: "scenemap-layout-drag-ghost",
      chosenClass: "scenemap-layout-drag-chosen",
      dragClass: "scenemap-layout-drag-active",
      fallbackClass: "scenemap-layout-drag-fallback",
      onStart: (event) => {
        document.body.classList.add("scenemap-layout-is-dragging");
        event.item.querySelector<HTMLElement>(".scenemap-layout-drag-handle")?.setAttribute("aria-grabbed", "true");
      },
      onEnd: (event) => {
        document.body.classList.remove("scenemap-layout-is-dragging");
        event.item.querySelector<HTMLElement>(".scenemap-layout-drag-handle")?.setAttribute("aria-grabbed", "false");
        if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex) return;
        const sectionIndex = readIndex(container.dataset.section);
        const fieldIndex = readIndex(container.dataset.field);
        if (!reorderLayoutItem(layout, kind, event.oldIndex, event.newIndex, sectionIndex, fieldIndex)) {
          queueMicrotask(() => redraw());
          return;
        }
        // Sortable already moved the DOM. Reindex in place instead of redrawing;
        // a redraw here makes mobile browsers jump to a new scroll anchor.
        queueMicrotask(() => {
          reindexLayoutEditor(root);
          announceLayoutReorder(root, kind, event.newIndex!, getLayoutItemCount(layout, kind, sectionIndex, fieldIndex));
        });
      },
      onUnchoose: () => {
        document.body.classList.remove("scenemap-layout-is-dragging");
      },
    }));
  }
  return instances;
}

function reindexLayoutEditor(root: HTMLElement) {
  const sectionsContainer = root.querySelector<HTMLElement>("[data-layout-sortable=\"section\"]");
  if (!sectionsContainer) return;
  const sections = getDirectLayoutItems(sectionsContainer, "data-layout-section-item");
  sections.forEach((section, sectionIndex) => {
    setLayoutDataIndex(section, "section", sectionIndex);
    const fieldsContainer = section.querySelector<HTMLElement>(":scope > [data-layout-sortable=\"field\"]");
    if (!fieldsContainer) return;
    const fields = getDirectLayoutItems(fieldsContainer, "data-layout-field-item");
    fields.forEach((field, fieldIndex) => {
      setLayoutDataIndex(field, "field", fieldIndex);
      const childrenContainer = field.querySelector<HTMLElement>("[data-layout-sortable=\"child\"]");
      if (!childrenContainer) return;
      const children = getDirectLayoutItems(childrenContainer, "data-layout-child-item");
      children.forEach((child, childIndex) => setLayoutDataIndex(child, "child", childIndex));
    });
  });
}

function getDirectLayoutItems(container: HTMLElement, attribute: string): HTMLElement[] {
  return Array.from(container.children).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && element.hasAttribute(attribute),
  );
}

function setLayoutDataIndex(root: HTMLElement, key: "section" | "field" | "child", index: number) {
  const attribute = `data-${key}`;
  if (root.hasAttribute(attribute)) root.dataset[key] = String(index);
  for (const element of root.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
    element.dataset[key] = String(index);
  }
}

function destroyLayoutSortables(instances: Sortable[]) {
  document.body.classList.remove("scenemap-layout-is-dragging");
  for (const instance of instances) instance.destroy();
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getLayoutItemCount(
  layout: TrackerBoardDisplayLayout,
  kind: LayoutDragKind,
  sectionIndex: number | null,
  fieldIndex: number | null,
): number {
  if (kind === "section") return layout.sections.length;
  if (sectionIndex === null) return 0;
  const section = layout.sections[sectionIndex];
  if (!section) return 0;
  if (kind === "field") return section.fields.length;
  if (fieldIndex === null) return 0;
  return section.fields[fieldIndex]?.fields?.length ?? 0;
}

function announceLayoutReorder(root: HTMLElement, kind: LayoutDragKind, index: number, count: number, boundary = false) {
  const announcer = root.querySelector<HTMLElement>("[data-layout-announcer]");
  if (!announcer) return;
  const item = kind === "section" ? "Section" : kind === "field" ? "Field" : "Card field";
  announcer.textContent = boundary
    ? `${item} is already at the ${index === 0 ? "first" : "last"} position.`
    : `${item} moved to position ${index + 1} of ${count}.`;
}

function reorderLayoutItem(
  layout: TrackerBoardDisplayLayout,
  kind: LayoutDragKind,
  from: number,
  to: number,
  sectionIndex: number | null,
  fieldIndex: number | null,
): boolean {
  if (kind === "section") return moveItem(layout.sections, from, to);
  if (sectionIndex === null) return false;
  const section = layout.sections[sectionIndex];
  if (!section) return false;
  if (kind === "field") return moveItem(section.fields, from, to);
  if (fieldIndex === null) return false;
  const children = section.fields[fieldIndex]?.fields;
  return children ? moveItem(children, from, to) : false;
}

function focusLayoutDragHandle(
  root: HTMLElement,
  kind: LayoutDragKind,
  itemIndex: number,
  sectionIndex: number | null,
  fieldIndex: number | null,
) {
  const selector = kind === "section"
    ? `[data-layout-drag="section"][data-section="${itemIndex}"]`
    : kind === "field" && sectionIndex !== null
      ? `[data-layout-drag="field"][data-section="${sectionIndex}"][data-field="${itemIndex}"]`
      : kind === "child" && sectionIndex !== null && fieldIndex !== null
        ? `[data-layout-drag="child"][data-section="${sectionIndex}"][data-field="${fieldIndex}"][data-child="${itemIndex}"]`
        : "";
  if (selector) queueMicrotask(() => root.querySelector<HTMLElement>(selector)?.focus());
}

function extractSchemaFieldOptions(schema: Record<string, unknown>): SchemaFieldOption[] {
  const normalized = normalizeSchemaForLayout(schema, schema);
  const properties = getSchemaProperties(normalized);
  if (!properties) return [];
  return Object.entries(properties).flatMap(([key, value]) => schemaToOptions(value, key, key, schema));
}

const MAX_LAYOUT_SCHEMA_DEPTH = 20;

function schemaToOptions(
  schema: unknown,
  path: string,
  labelSeed: string,
  rootSchema: Record<string, unknown>,
  seenRefs = new Set<string>(),
  depth = 0,
): SchemaFieldOption[] {
  const source = getRecord(schema);
  const ref = typeof source.$ref === "string" && source.$ref.startsWith("#/") ? source.$ref : null;
  // Recursive schemas are valid, but the visual editor must expose a finite tree.
  if (depth >= MAX_LAYOUT_SCHEMA_DEPTH || (ref && seenRefs.has(ref))) {
    return [{ path, label: schemaLabel(source, labelSeed), display: defaultDisplayForSchema(source, path) }];
  }
  const nextSeenRefs = ref ? new Set(seenRefs).add(ref) : seenRefs;
  const record = normalizeSchemaForLayout(schema, rootSchema, seenRefs);
  const type = record.type;
  if (type === "array") {
    const itemSource = getRecord(record.items);
    const itemRef = typeof itemSource.$ref === "string" && itemSource.$ref.startsWith("#/") ? itemSource.$ref : null;
    if (itemRef && nextSeenRefs.has(itemRef)) {
      return [{ path, label: schemaLabel(record, labelSeed), display: "chips" }];
    }
    const itemSeenRefs = itemRef ? new Set(nextSeenRefs).add(itemRef) : nextSeenRefs;
    const items = normalizeSchemaForLayout(record.items, rootSchema, nextSeenRefs);
    const itemProperties = getSchemaProperties(items);
    if (itemProperties) {
      return [{
        path,
        label: schemaLabel(record, labelSeed),
        display: "character_cards",
        children: Object.entries(itemProperties).flatMap(([key, value]) => schemaToOptions(
          value,
          key,
          key,
          rootSchema,
          itemSeenRefs,
          depth + 1,
        )),
      }];
    }
    return [{ path, label: schemaLabel(record, labelSeed), display: "chips" }];
  }
  const properties = getSchemaProperties(record);
  if (properties) {
    return Object.entries(properties).flatMap(([key, value]) => schemaToOptions(
      value,
      `${path}.${key}`,
      key,
      rootSchema,
      nextSeenRefs,
      depth + 1,
    ));
  }
  return [{ path, label: schemaLabel(record, labelSeed), display: defaultDisplayForSchema(record, path) }];
}

function normalizeSchemaForLayout(
  schema: unknown,
  rootSchema: Record<string, unknown>,
  seenRefs = new Set<string>(),
): Record<string, unknown> {
  const source = getRecord(schema);
  let normalized = { ...source };
  const ref = typeof source.$ref === "string" ? source.$ref : null;
  if (ref?.startsWith("#/") && !seenRefs.has(ref)) {
    const resolved = resolveLocalLayoutRef(rootSchema, ref);
    if (resolved) {
      const nextSeen = new Set(seenRefs).add(ref);
      normalized = mergeLayoutSchemas(normalizeSchemaForLayout(resolved, rootSchema, nextSeen), normalized);
    }
  }

  // This normalization is field discovery for the layout editor, not validation.
  // Merging variant properties makes every potentially renderable field visible.
  for (const keyword of ["allOf", "oneOf", "anyOf"] as const) {
    const variants = source[keyword];
    if (!Array.isArray(variants)) continue;
    for (const variant of variants) {
      normalized = mergeLayoutSchemas(normalized, normalizeSchemaForLayout(variant, rootSchema, seenRefs));
    }
  }
  return normalized;
}

function mergeLayoutSchemas(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): Record<string, unknown> {
  const leftProperties = getSchemaProperties(left);
  const rightProperties = getSchemaProperties(right);
  return {
    ...left,
    ...right,
    ...(leftProperties || rightProperties
      ? { properties: { ...(leftProperties ?? {}), ...(rightProperties ?? {}) } }
      : {}),
  };
}

function resolveLocalLayoutRef(rootSchema: Record<string, unknown>, ref: string): unknown {
  let current: unknown = rootSchema;
  for (const token of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function getSchemaProperties(schema: unknown): Record<string, unknown> | null {
  const record = getRecord(schema);
  return record.properties && typeof record.properties === "object" && !Array.isArray(record.properties)
    ? record.properties as Record<string, unknown>
    : null;
}

function schemaLabel(schema: Record<string, unknown>, fallback: string): string {
  return typeof schema.title === "string" && schema.title.trim()
    ? schema.title.trim()
    : humanizeTrackerKey(fallback.split(".").pop() || fallback);
}

function defaultDisplayForSchema(schema: Record<string, unknown>, path: string): TrackerFieldDisplay {
  if (schema.type === "array") return "chips";
  if (/posture|interaction|notes?|description/i.test(path)) return "mono";
  if (/tone|time|state|hair|makeup/i.test(path)) return "subtle";
  return "text";
}

function findFieldOption(options: SchemaFieldOption[], path: string): SchemaFieldOption | undefined {
  return options.find((option) => option.path === path);
}

function getAvailableFieldOptions(layout: TrackerBoardDisplayLayout, options: SchemaFieldOption[], currentPath?: string): SchemaFieldOption[] {
  const used = new Set<string>();
  for (const section of layout.sections) {
    for (const field of section.fields) {
      if (field.path && field.path !== currentPath) used.add(field.path);
    }
  }
  const available = options.filter((option) => !used.has(option.path));
  // Keep removed paths visible long enough to show a useful warning; silently
  // dropping them would make a schema edit look like unexplained data loss.
  if (currentPath && !available.some((option) => option.path === currentPath)) {
    available.unshift({ path: currentPath, label: `${humanizeTrackerKey(currentPath.split(".").pop() || currentPath)} (missing from schema)`, display: "text" });
  }
  return available;
}

function getAvailableChildOptions(parent: TrackerBoardField, options: SchemaFieldOption[], currentPath?: string): SchemaFieldOption[] {
  const used = new Set((parent.fields ?? [])
    .map((field) => field.path)
    .filter((path) => path && path !== currentPath));
  const available = options.filter((option) => !used.has(option.path));
  if (currentPath && !available.some((option) => option.path === currentPath)) {
    available.unshift({ path: currentPath, label: `${humanizeTrackerKey(currentPath.split(".").pop() || currentPath)} (missing from schema)`, display: "text" });
  }
  return available;
}

function createFieldFromOption(option: SchemaFieldOption | undefined, maxChildren = 4): TrackerBoardField {
  if (!option) return { path: "", label: "", display: "text" };
  return {
    path: option.path,
    label: option.label,
    display: option.display,
    fields: option.display === "character_cards"
      ? option.children?.slice(0, maxChildren).map((child) => ({ path: child.path, label: child.label, display: child.display === "character_cards" ? "text" : child.display }))
      : undefined,
  };
}

export function createSchemaDefaultLayout(schema: Record<string, unknown>): TrackerBoardDisplayLayout {
  if (JSON.stringify(schema) === JSON.stringify(DEFAULT_SCHEMA_VALUE)) return cloneLayout(DEFAULT_DISPLAY_LAYOUT);
  const options = extractSchemaFieldOptions(schema);
  const title = typeof schema.title === "string" && schema.title.trim() ? schema.title.trim() : "Scene";
  return {
    sections: [{
      title,
      fields: options.map((option) => createFieldFromOption(option, Number.POSITIVE_INFINITY)),
    }],
  };
}

function cloneLayout(layout: TrackerBoardDisplayLayout): TrackerBoardDisplayLayout {
  return JSON.parse(JSON.stringify(layout)) as TrackerBoardDisplayLayout;
}

function moveItem<T>(items: T[], from: number, to: number): boolean {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return false;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
  return true;
}

function readIndex(value: string | undefined): number | null {
  if (value === undefined) return null;
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function validateLayout(layout: TrackerBoardDisplayLayout, options: SchemaFieldOption[]) {
  if (!layout.sections.length) throw new Error("Add at least one section.");
  for (const section of layout.sections) {
    section.title = section.title.trim();
    section.fields = section.fields.filter((field) => field.path.trim());
    for (const field of section.fields) {
      field.path = field.path.trim();
      const option = findFieldOption(options, field.path);
      if (!option) throw new Error(`Field "${field.path}" no longer exists in the current schema.`);
      if (Object.prototype.hasOwnProperty.call(field, "label")) field.label = field.label?.trim() ?? "";
      field.fields = field.fields?.filter((child) => child.path.trim()).map((child) => ({
        ...child,
        path: child.path.trim(),
        label: Object.prototype.hasOwnProperty.call(child, "label") ? child.label?.trim() ?? "" : undefined,
        center: child.display === "chips" ? child.center === true : undefined,
      }));
      for (const child of field.fields ?? []) {
        if (!findFieldOption(option.children ?? [], child.path)) {
          throw new Error(`Card field "${child.path}" no longer exists under "${field.path}" in the current schema.`);
        }
      }
      // Centering has meaning only for chips; prune stale values when display type changes.
      field.center = field.display === "chips" ? field.center === true : undefined;
    }
  }
}

function layoutDragHandle(
  kind: LayoutDragKind,
  label: string,
  indexes: { section: number; field?: number; child?: number },
): string {
  const data = [
    `data-layout-drag="${kind}"`,
    `data-section="${indexes.section}"`,
    indexes.field !== undefined ? `data-field="${indexes.field}"` : "",
    indexes.child !== undefined ? `data-child="${indexes.child}"` : "",
  ].filter(Boolean).join(" ");
  return `<button type="button" class="scenemap-layout-drag-handle" title="${escapeAttr(label)}" aria-label="${escapeAttr(`${label}. Use arrow keys to reorder.`)}" aria-grabbed="false" ${data}>${layoutIcon(kind === "section" ? "grip-horizontal" : "grip")}</button>`;
}

function iconButton(action: string, label: string, icon: "trash", options: { section?: number; field?: number; child?: number }): string {
  const data = [
    `data-layout-action="${action}"`,
    options.section !== undefined ? `data-section="${options.section}"` : "",
    options.field !== undefined ? `data-field="${options.field}"` : "",
    options.child !== undefined ? `data-child="${options.child}"` : "",
  ].filter(Boolean).join(" ");
  return `<button type="button" class="scenemap-layout-icon-btn" title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}" ${data}>${layoutIcon(icon)}</button>`;
}

function layoutIcon(name: "plus" | "grip" | "grip-horizontal" | "trash"): string {
  const paths: Record<"plus" | "grip" | "grip-horizontal" | "trash", string> = {
    plus: `<path d="M12 5v14"/><path d="M5 12h14"/>`,
    grip: `<circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/>`,
    "grip-horizontal": `<circle cx="5" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="15" r="1" fill="currentColor" stroke="none"/>`,
    trash: `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v5"/><path d="M14 11v5"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function openTextEditor(
  title: string,
  value: string,
  onSave: (value: string) => void,
  surface: "settings" | "tracker" = "tracker",
) {
  if (Array.from(pendingTextEditors.values()).some((pending) => pending.title === title)) {
    const message = `${title} is already open.`;
    if (surface === "settings") showSettingsError(message);
    else showTrackerError(message);
    return;
  }
  // The expanded editor lives in the backend-owned Lumiverse modal. Correlate its
  // asynchronous result with the exact local callback that opened it.
  const requestId = `editor-${Date.now()}-${++editorRequestSeq}`;
  pendingTextEditors.set(requestId, {
    title,
    surface,
    onSave,
  });
  send({
    type: "open_text_editor",
    requestId,
    title,
    value,
    placeholder: "",
  });
}

function handleTextEditorResult(payload: any) {
  const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
  const pending = takePendingTextEditor(requestId);
  if (!pending) return;
  if (payload.cancelled) return;
  const text = typeof payload.text === "string" ? payload.text : "";
  try {
    pending.onSave(text);
  } catch (err) {
    if (pending.surface === "settings") showSettingsError((err as Error).message);
    else showTrackerError((err as Error).message);
    // Reopen with the rejected text so a validation error never destroys the edit.
    openTextEditor(pending.title, text, pending.onSave, pending.surface);
  }
}

function clearSettingsRuntimeError() {
  settingsRuntimeError = null;
  rootRef?.querySelector("[data-settings-runtime-error]")?.remove();
}

function mountSettingsRuntimeError(message: string) {
  const container = rootRef?.querySelector<HTMLElement>(".scenemap-settings-scroll");
  if (!container) return false;
  container.querySelector("[data-settings-runtime-error]")?.remove();
  const node = document.createElement("div");
  node.className = "scenemap-runtime-error";
  node.dataset.settingsRuntimeError = "";
  node.setAttribute("role", "alert");
  node.textContent = message;
  container.prepend(node);
  return true;
}

function clearTrackerRuntimeError() {
  trackerRuntimeError = null;
  rootRef?.querySelector("[data-tracker-runtime-error]")?.remove();
  dockRootRef?.querySelector("[data-tracker-runtime-error]")?.remove();
}

function showTrackerError(message: string) {
  trackerRuntimeError = message;
  if (mergeSettings(state.settings).trackerPlacement === "drawer") {
    drawerView = "tracker";
    tabHandle?.activate();
    renderDrawerContent();
  } else {
    renderDockPanel();
  }
}

function takePendingTextEditor(requestId: string): PendingTextEditor | null {
  const pending = pendingTextEditors.get(requestId) ?? null;
  if (pending) pendingTextEditors.delete(requestId);
  return pending;
}

function showSettingsError(message: string) {
  const preserveActiveSettings = settingsSurfaceHasActiveInteraction();
  settingsRuntimeError = message;
  drawerView = "settings";
  tabHandle?.activate();
  if (!preserveActiveSettings || !mountSettingsRuntimeError(message)) renderDrawerSettings();
}

function renderTracker(
  value: unknown,
  layout: TrackerBoardDisplayLayout,
  editSchema: Record<string, unknown> | null = null,
): string {
  const record = getRecord(value);
  if (Object.keys(record).length === 0) return `<div class="scenemap-empty">Tracker data is empty.</div>`;
  const sections = layout?.sections?.length ? layout.sections : DEFAULT_DISPLAY_LAYOUT.sections;
  const html = sections
    .map((section) => {
      const fields = section.fields
        .map((field) => editSchema
          ? renderEditableField(field, record, editSchema, [])
          : renderField(field, record))
        .filter(Boolean)
        .join("");
      if (!fields) return "";
      const title = section.title?.trim();
      return `<section class="scenemap-section ${title ? "" : "scenemap-section--untitled"}">${title ? `<h3>${escapeHtml(title)}</h3>` : ""}<div>${fields}</div></section>`;
    })
    .filter(Boolean)
    .join("");
  return html || `<div class="scenemap-empty">Tracker data is empty.</div>`;
}

function renderEditableField(
  field: TrackerBoardField,
  draft: Record<string, unknown>,
  rootSchema: Record<string, unknown>,
  basePath: TrackerEditPath,
): string {
  const path = [...basePath, ...field.path.split(".").filter(Boolean)];
  const value = getTrackerValueAtPath(draft, path);
  const label = getFieldLabel(field);
  const display = field.display || "text";
  if (display === "chips" && Array.isArray(value)) {
    return renderEditableChips(path, label, value, rootSchema, field.center === true);
  }
  if (display === "character_cards") {
    const cards = Array.isArray(value) ? value : [];
    return `
      <div class="scenemap-edit-card-list">
        <div class="scenemap-character-grid">
          ${cards.map((_, index) => renderEditableCharacterCard(draft, index, field, path, rootSchema)).join("")}
        </div>
        <button type="button" class="scenemap-edit-add-card" data-action="add-tracker-card" data-edit-path="${trackerEditPathAttr(path)}">+ Add item</button>
      </div>
    `;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return `<div class="scenemap-field">${label ? `<span>${escapeHtml(label)}</span>` : ""}<p>${escapeHtml(formatDisplayValue(value))}</p></div>`;
  }
  return renderTrackerEditControl(path, label, display, value, rootSchema);
}

function renderEditableChips(
  path: TrackerEditPath,
  label: string | null,
  values: unknown[],
  rootSchema: Record<string, unknown>,
  centered: boolean,
): string {
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  const chips = values.map((value, index) => {
    const itemPath = [...path, index];
    const schema = getTrackerSchemaAtPath(rootSchema, itemPath);
    const kind = getTrackerEditControlKind(schema, value);
    const common = `data-tracker-edit-control="true" data-tracker-edit-chip="true" data-edit-path="${trackerEditPathAttr(itemPath)}" data-edit-kind="${kind}" aria-label="${escapeAttr(`${label || "Item"} ${index + 1}`)}"`;
    let control: string;
    if (kind === "enum") {
      const options = Array.isArray(schema.enum) ? schema.enum : [];
      control = `<select ${common}>${options.map((option, optionIndex) => `<option value="${optionIndex}" ${jsonValuesEqual(option, value) ? "selected" : ""}>${escapeHtml(formatDisplayValue(option))}</option>`).join("")}</select>`;
    } else if (kind === "boolean") {
      control = `<select ${common}><option value="true" ${value === true ? "selected" : ""}>Yes</option><option value="false" ${value !== true ? "selected" : ""}>No</option></select>`;
    } else {
      const inputType = kind === "number" || kind === "integer" ? "number" : "text";
      const size = Math.max(4, Math.min(24, formatDisplayValue(value).length + 1));
      control = `<input type="${inputType}" ${common} size="${size}" ${kind === "integer" ? "step=\"1\"" : kind === "number" ? "step=\"any\"" : ""} value="${escapeAttr(value ?? "")}">`;
    }
    return `<span class="scenemap-edit-chip">${control}<button type="button" data-action="remove-tracker-chip" data-edit-path="${trackerEditPathAttr(path)}" data-edit-index="${index}" title="Remove item" aria-label="Remove ${escapeAttr(formatDisplayValue(value) || `item ${index + 1}`)}">×</button></span>`;
  }).join("");
  return `
    <div class="scenemap-field scenemap-edit-chip-field">
      ${labelMarkup}
      <div class="scenemap-edit-chips ${centered ? "is-centered" : ""}">
        ${chips}
        <button type="button" class="scenemap-edit-chip-add" data-action="add-tracker-chip" data-edit-path="${trackerEditPathAttr(path)}" aria-label="Add item">+</button>
      </div>
    </div>
  `;
}

function renderEditableCharacterCard(
  draft: Record<string, unknown>,
  index: number,
  parentField: TrackerBoardField,
  parentPath: TrackerEditPath,
  rootSchema: Record<string, unknown>,
): string {
  const itemPath = [...parentPath, index];
  const record = getRecord(getTrackerValueAtPath(draft, itemPath));
  const namePath = [...itemPath, "name"];
  const nameSchema = getTrackerSchemaAtPath(rootSchema, namePath);
  const hasEditableName = Object.keys(nameSchema).length > 0 || Object.prototype.hasOwnProperty.call(record, "name");
  const fallbackFields = Object.keys(record)
    .filter((key) => key !== "name")
    .map((key): TrackerBoardField => ({
      path: key,
      label: humanizeTrackerKey(key),
      display: key === "postureAndInteraction" ? "mono" : "text",
    }));
  const fields = (parentField.fields?.length ? parentField.fields : fallbackFields)
    .filter((field) => !(hasEditableName && field.path === "name"));
  return `
    <article class="scenemap-character scenemap-character-edit">
      <div class="scenemap-character-edit-header">
        ${hasEditableName
          ? renderTrackerEditControl(namePath, "Character name", "text", record.name, rootSchema, true)
          : `<h4>${escapeHtml(`Item ${index + 1}`)}</h4>`}
        <button type="button" class="scenemap-icon-btn scenemap-edit-remove-card" data-action="remove-tracker-card" data-edit-path="${trackerEditPathAttr(parentPath)}" data-edit-index="${index}" title="Remove item" aria-label="Remove item">${layoutIcon("trash")}</button>
      </div>
      ${fields.map((field) => renderEditableField(field, draft, rootSchema, itemPath)).join("")}
    </article>
  `;
}

function renderTrackerEditControl(
  path: TrackerEditPath,
  label: string | null,
  display: TrackerFieldDisplay,
  value: unknown,
  rootSchema: Record<string, unknown>,
  characterName = false,
): string {
  const schema = getTrackerSchemaAtPath(rootSchema, path);
  const kind = getTrackerEditControlKind(schema, value);
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  const common = `data-tracker-edit-control="true" data-edit-path="${trackerEditPathAttr(path)}" data-edit-kind="${kind}" aria-label="${escapeAttr(label || humanizeTrackerKey(String(path.at(-1) ?? "Value")))}"`;
  let control: string;
  if (kind === "enum") {
    const options = Array.isArray(schema.enum) ? schema.enum : [];
    control = `<select ${common}>${options.map((option, index) => `<option value="${index}" ${jsonValuesEqual(option, value) ? "selected" : ""}>${escapeHtml(formatDisplayValue(option))}</option>`).join("")}</select>`;
  } else if (kind === "boolean") {
    control = `<select ${common}><option value="true" ${value === true ? "selected" : ""}>Yes</option><option value="false" ${value !== true ? "selected" : ""}>No</option></select>`;
  } else if (kind === "number" || kind === "integer") {
    const minimum = typeof schema.minimum === "number" ? ` min="${schema.minimum}"` : "";
    const maximum = typeof schema.maximum === "number" ? ` max="${schema.maximum}"` : "";
    control = `<input type="number" ${common}${minimum}${maximum} step="${kind === "integer" ? "1" : "any"}" value="${escapeAttr(value ?? "")}">`;
  } else if (kind.endsWith("_array")) {
    const lines = Array.isArray(value) ? value.map(formatDisplayValue).join("\n") : "";
    control = `<textarea ${common} rows="${Math.max(2, Math.min(5, Array.isArray(value) ? value.length : 2))}" placeholder="One item per line">${escapeHtml(lines)}</textarea>`;
  } else if (display === "mono" || (typeof value === "string" && (value.length > 38 || value.includes("\n")))) {
    const rows = typeof value === "string" && value.length > 220 ? 4 : typeof value === "string" && value.length > 110 ? 3 : 2;
    control = `<textarea ${common} rows="${rows}">${escapeHtml(value ?? "")}</textarea>`;
  } else {
    control = `<input type="text" ${common} value="${escapeAttr(value ?? "")}">`;
  }
  if (characterName) {
    return `<label class="scenemap-character-name-edit">${labelMarkup}${control}</label>`;
  }
  return `<label class="scenemap-field scenemap-edit-field">${labelMarkup}${control}</label>`;
}

function createTrackerDataLayout(value: unknown): TrackerBoardDisplayLayout {
  // Used only when provenance says the configured layout belongs to another
  // schema. Infer a neutral layout so the old tracker remains readable/migratable.
  const record = getRecord(value);
  return {
    sections: [{
      title: "Tracker",
      fields: Object.entries(record).map(([key, child]) => {
        if (Array.isArray(child) && child.some((item) => item && typeof item === "object" && !Array.isArray(item))) {
          const childKeys = new Set<string>();
          for (const item of child) {
            for (const childKey of Object.keys(getRecord(item))) {
              if (childKey !== "name") childKeys.add(childKey);
            }
          }
          return {
            path: key,
            label: humanizeTrackerKey(key),
            display: "character_cards",
            fields: Array.from(childKeys).map((childKey) => ({
              path: childKey,
              label: humanizeTrackerKey(childKey),
              display: defaultDisplayForSchema({}, childKey),
            })),
          };
        }
        return {
          path: key,
          label: humanizeTrackerKey(key),
          display: Array.isArray(child) ? "chips" : defaultDisplayForSchema({}, key),
        };
      }),
    }],
  };
}

function renderField(field: TrackerBoardField, tracker: unknown): string {
  const value = getValueByPath(tracker, field.path);
  if (!hasRenderableValue(value)) return "";
  const label = getFieldLabel(field);
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  const display = field.display || "text";
  if (display === "chips") {
    return `<div class="scenemap-field">${labelMarkup}<div class="scenemap-chips ${field.center ? "is-centered" : ""}">${toChips(value).map((item) => `<b>${escapeHtml(item)}</b>`).join("")}</div></div>`;
  }
  if (display === "progress") return renderProgressField(label, field.path, value);
  if (display === "character_cards" && Array.isArray(value)) {
    return `<div class="scenemap-character-grid">${value.map((item, index) => renderCharacterCard(item, index, field.fields ?? [])).join("")}</div>`;
  }
  return `<div class="scenemap-field">${labelMarkup}<p class="${display === "subtle" ? "subtle" : ""} ${display === "mono" ? "mono" : ""}">${escapeHtml(formatDisplayValue(value))}</p></div>`;
}

function getFieldLabel(field: TrackerBoardField): string | null {
  if (Object.prototype.hasOwnProperty.call(field, "label")) {
    const label = field.label?.trim() ?? "";
    return label ? label : null;
  }
  return humanizeTrackerKey(field.path.split(".").pop() || field.path);
}

function renderProgressField(label: string | null, path: string, value: unknown): string {
  const progress = parseProgressValue(value);
  const labelMarkup = label ? `<span>${escapeHtml(label)}</span>` : "";
  if (!progress) return `<div class="scenemap-field">${labelMarkup}<p>${escapeHtml(formatDisplayValue(value))}</p></div>`;
  const tone = progress.value < 34 ? "danger" : progress.value < 67 ? "warning" : "success";
  const ariaLabel = label || humanizeTrackerKey(path.split(".").pop() || path);
  return `
    <div class="scenemap-field scenemap-progress-field" data-progress-tone="${tone}">
      <div class="scenemap-progress-head">
        ${labelMarkup}
        <strong>${progress.label}</strong>
      </div>
      <div class="scenemap-progress-track" role="meter" aria-label="${escapeAttr(ariaLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.value}">
        <i style="width: ${progress.value}%"></i>
      </div>
    </div>
  `;
}

function renderCharacterCard(value: unknown, index: number, fields: TrackerBoardField[]): string {
  const record = getRecord(value);
  const name = formatDisplayValue(record.name) || `Character ${index + 1}`;
  const innerFields = fields.length > 0
    ? fields.map((field) => renderField(field, record)).join("")
    : Object.entries(record)
        .filter(([key]) => key !== "name")
        .map(([key, child]) => renderField({ path: key, label: humanizeTrackerKey(key), display: key === "postureAndInteraction" ? "mono" : "text" }, { [key]: child }))
        .join("");
  return `<article class="scenemap-character"><h4>${escapeHtml(name)}</h4>${innerFields}</article>`;
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getValueByPath(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split(".").filter(Boolean)) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function hasRenderableValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(hasRenderableValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasRenderableValue);
  return true;
}

function toChips(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(formatDisplayValue).filter(Boolean).slice(0, 32);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 32);
  return [];
}

function parseProgressValue(value: unknown): { value: number; label: string } | null {
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
  const clamped = Math.max(0, Math.min(100, numeric));
  const rounded = Math.round(clamped);
  return { value: rounded, label: `${rounded}%` };
}

function formatDisplayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatDisplayValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => hasRenderableValue(child))
      .map(([key, child]) => `${humanizeTrackerKey(key)}: ${formatDisplayValue(child)}`)
      .join("\n");
  }
  return formatPrimitive(value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

function refreshSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-15.3 6.4"/><path d="M3 12A9 9 0 0 1 18.3 5.6"/><path d="M18 2v4h-4"/><path d="M6 22v-4h4"/></svg>`;
}

const styles = `
.scenemap-lv { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; color: var(--lumiverse-text); }
.scenemap-drawer-root { height: auto; min-height: 100%; overflow: visible; }
.scenemap-dock-resize-handle { background: var(--lumiverse-primary, var(--lumiverse-accent, #8ab4f8)) !important; opacity: .45; z-index: 4 !important; transition: opacity .15s ease; }
.scenemap-dock-resize-handle:hover { opacity: .9; }
.scenemap-dock-resize-horizontal { width: 6px !important; }
.scenemap-dock-resize-vertical { height: 6px !important; }
@media (max-width: 600px) {
  .scenemap-dock-resize-horizontal { width: auto !important; height: 6px !important; }
}
.scenemap-shell { flex: 1 1 auto; display: flex; flex-direction: column; gap: 12px; padding: 14px; min-height: 0; box-sizing: border-box; overflow: hidden; }
.scenemap-header { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; }
.scenemap-header h2 { margin: 0; font-size: 18px; font-weight: 700; }
.scenemap-header p { margin: 3px 0 0; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-status { align-self: center; display: inline-flex; align-items: center; gap: 7px; width: fit-content; max-width: 100%; box-sizing: border-box; margin: -2px 0 0; padding: 6px 10px; border: 1px solid var(--lumiverse-secondary-border, var(--lumiverse-border)); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text-muted); font-size: calc(11px * var(--lumiverse-font-scale, 1)); line-height: 1.35; text-align: left; }
.scenemap-status > span:last-child { min-width: 0; overflow-wrap: anywhere; }
.scenemap-status-indicator { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 14%, transparent); }
.scenemap-status.is-info, .scenemap-status.is-generating { color: var(--lumiverse-primary-text, var(--lumiverse-primary)); border-color: var(--lumiverse-primary-050, var(--lumiverse-primary)); background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary) 10%, transparent)); }
.scenemap-status.is-warning { color: var(--lumiverse-warning, #f59e0b); border-color: var(--lumiverse-warning-050, color-mix(in srgb, var(--lumiverse-warning) 50%, transparent)); background: var(--lumiverse-warning-015, color-mix(in srgb, var(--lumiverse-warning) 15%, transparent)); }
.scenemap-status.is-success { color: var(--lumiverse-success, #22c55e); border-color: var(--lumiverse-success-050, color-mix(in srgb, var(--lumiverse-success) 50%, transparent)); background: var(--lumiverse-success-015, color-mix(in srgb, var(--lumiverse-success) 15%, transparent)); }
.scenemap-status.is-generating .scenemap-status-indicator { animation: scenemap-status-pulse 1.2s ease-in-out infinite; }
.scenemap-loading-dots span { display: inline-block; animation: scenemap-dot-fade 1.2s ease-in-out infinite; }
.scenemap-loading-dots span:nth-child(2) { animation-delay: .16s; }
.scenemap-loading-dots span:nth-child(3) { animation-delay: .32s; }
[data-spindle-mount="chat_toolbar"]:has(.scenemap-chat-toolbar-root) { display: flex; align-items: center; gap: 2px; }
.scenemap-chat-toolbar-root { display: inline-flex; align-items: center; }
.scenemap-chat-toolbar-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 26px; padding: 0; border: 0; border-radius: var(--lumiverse-radius-sm, 5px); background: transparent; color: var(--lumiverse-text-dim, rgba(230, 230, 240, .4)); cursor: pointer; transition: color .12s ease, background .12s ease; }
.scenemap-chat-toolbar-btn:hover:not(:disabled) { color: var(--lumiverse-text, rgba(230, 230, 240, .92)); background: var(--lumiverse-fill, rgba(255, 255, 255, .06)); }
.scenemap-chat-toolbar-btn.is-attention { color: var(--lumiverse-primary, var(--lumiverse-accent)); background: color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent); }
.scenemap-chat-toolbar-btn.is-generating { color: var(--lumiverse-success, var(--lumiverse-accent)); animation: scenemap-status-pulse 1.8s ease-in-out infinite; }
.scenemap-chat-toolbar-btn.is-generating svg { animation: scenemap-spin .9s linear infinite; }
.scenemap-chat-toolbar-btn:disabled { opacity: .45; cursor: default; }
.scenemap-chat-toolbar-btn svg { width: 14px; height: 14px; }
.scenemap-top-toolbar-host { display: inline-flex; align-items: center; }
.scenemap-top-toolbar-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 34px; height: 28px; padding: 0 5px; border: 1px solid transparent; border-radius: var(--lumiverse-radius-sm, 6px); background: transparent; color: var(--lumiverse-text-dim); opacity: .68; cursor: pointer; touch-action: manipulation; transition: color var(--lumiverse-transition-fast, .12s ease), background var(--lumiverse-transition-fast, .12s ease), border-color var(--lumiverse-transition-fast, .12s ease), opacity var(--lumiverse-transition-fast, .12s ease); }
.scenemap-top-toolbar-btn:hover:not(:disabled), .scenemap-top-toolbar-btn:focus-visible { opacity: 1; color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); border-color: var(--lumiverse-border); outline: none; }
.scenemap-top-toolbar-btn:focus-visible { box-shadow: 0 0 0 2px var(--lumiverse-primary-020, color-mix(in srgb, var(--lumiverse-primary) 20%, transparent)); }
.scenemap-top-toolbar-btn:disabled { opacity: .38; cursor: default; }
.scenemap-top-toolbar-icon { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; flex: 0 0 auto; }
.scenemap-top-toolbar-icon svg { width: 14px; height: 14px; }
.scenemap-top-toolbar-dot { display: block; width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: var(--lumiverse-text-dim); box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 8%, transparent); }
.scenemap-top-toolbar-btn.is-success .scenemap-top-toolbar-dot { background: var(--lumiverse-success, #22c55e); box-shadow: 0 0 7px color-mix(in srgb, var(--lumiverse-success, #22c55e) 48%, transparent); }
.scenemap-top-toolbar-btn.is-warning .scenemap-top-toolbar-dot { background: var(--lumiverse-warning, #f59e0b); box-shadow: 0 0 7px color-mix(in srgb, var(--lumiverse-warning, #f59e0b) 48%, transparent); }
.scenemap-top-toolbar-btn.is-generating { opacity: 1; color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-top-toolbar-btn.is-generating .scenemap-top-toolbar-icon svg { animation: scenemap-spin .9s linear infinite; }
.scenemap-top-toolbar-btn.is-generating .scenemap-top-toolbar-dot { background: var(--lumiverse-primary, var(--lumiverse-accent)); animation: scenemap-status-pulse 1.2s ease-in-out infinite; box-shadow: 0 0 8px color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 55%, transparent); }
.scenemap-toolbar, .scenemap-row, .scenemap-modal-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.scenemap-modal-spacer { flex: 1 1 auto; }
.scenemap-card { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill-subtle); border-radius: var(--lumiverse-radius, 8px); padding: 12px; }
.scenemap-board { flex: 1 1 auto; min-height: 0; overflow: auto; background: transparent; border-color: transparent; padding: 0 10px 0 0; }
.scenemap-empty { color: var(--lumiverse-text-muted); font-size: 13px; text-align: center; padding: 20px 4px; }
.scenemap-section { padding: 10px 0 12px; }
.scenemap-section--untitled { padding-top: 4px; }
.scenemap-section h3 { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; color: var(--lumiverse-accent); font-size: 12px; text-align: center; text-transform: uppercase; font-weight: 800; white-space: pre-wrap; }
.scenemap-section h3::before, .scenemap-section h3::after { content: ""; height: 4px; flex: 1 1 auto; border-top: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent); }
.scenemap-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.scenemap-field span { color: var(--lumiverse-text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.scenemap-field p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.45; }
.scenemap-field p.subtle { color: var(--lumiverse-text-muted); }
.scenemap-field p.mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-style: italic; }
.scenemap-progress-field { gap: 6px; }
.scenemap-progress-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scenemap-progress-head strong { color: var(--lumiverse-text); font-size: 11px; font-weight: 750; font-variant-numeric: tabular-nums; }
.scenemap-progress-track { height: 7px; border-radius: var(--lumiverse-radius-sm, 5px); overflow: hidden; border: 1px solid color-mix(in srgb, var(--lumiverse-border) 72%, transparent); background: color-mix(in srgb, var(--lumiverse-fill) 72%, transparent); }
.scenemap-progress-track i { display: block; height: 100%; min-width: 2px; border-radius: inherit; background: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 35%, transparent); }
.scenemap-progress-field[data-progress-tone="success"] .scenemap-progress-track i { background: var(--lumiverse-success, var(--lumiverse-primary, var(--lumiverse-accent))); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-success, var(--lumiverse-primary, var(--lumiverse-accent))) 35%, transparent); }
.scenemap-progress-field[data-progress-tone="warning"] .scenemap-progress-track i { background: var(--lumiverse-warning, var(--lumiverse-primary, var(--lumiverse-accent))); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-warning, var(--lumiverse-primary, var(--lumiverse-accent))) 35%, transparent); }
.scenemap-progress-field[data-progress-tone="danger"] .scenemap-progress-track i { background: var(--lumiverse-danger, var(--lumiverse-primary, var(--lumiverse-accent))); box-shadow: 0 0 10px color-mix(in srgb, var(--lumiverse-danger, var(--lumiverse-primary, var(--lumiverse-accent))) 35%, transparent); }
.scenemap-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.scenemap-chips.is-centered { justify-content: center; }
.scenemap-chips b { border: 1px solid var(--lumiverse-primary-020, var(--lumiverse-border)); background: color-mix(in srgb, var(--lumiverse-fill) 82%, var(--lumiverse-primary, var(--lumiverse-accent)) 6%); border-radius: var(--lumiverse-radius, 8px); padding: 4px 8px; font-size: 12px; font-weight: 600; }
.scenemap-character-grid { display: flex; flex-direction: column; gap: 14px; }
.scenemap-character { border: 1px solid var(--lumiverse-primary-020, var(--lumiverse-border)); background: color-mix(in srgb, var(--lumiverse-fill) 82%, var(--lumiverse-primary, var(--lumiverse-accent)) 6%); border-radius: var(--lumiverse-radius, 8px); padding: 10px; }
.scenemap-character h4 { margin: 0 0 10px; color: color-mix(in srgb, var(--lumiverse-text) 72%, var(--lumiverse-primary, var(--lumiverse-accent)) 28%); font-size: 14px; font-weight: 760; }
.scenemap-edit-field > input, .scenemap-edit-field > textarea, .scenemap-edit-field > select, .scenemap-character-name-edit > input, .scenemap-character-name-edit > textarea, .scenemap-character-name-edit > select { width: 100%; box-sizing: border-box; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 8px 9px; font: inherit; font-size: 13px; line-height: 1.4; }
.scenemap-edit-field > textarea { min-height: 42px; max-height: 180px; resize: vertical; field-sizing: content; }
.scenemap-edit-field > select, .scenemap-character-name-edit > select { appearance: auto; }
.scenemap-edit-field > input:focus, .scenemap-edit-field > textarea:focus, .scenemap-edit-field > select:focus, .scenemap-character-name-edit > input:focus, .scenemap-character-name-edit > textarea:focus, .scenemap-character-name-edit > select:focus { outline: none; border-color: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 0 1px var(--lumiverse-primary-020, transparent); }
.scenemap-character-edit { display: flex; flex-direction: column; }
.scenemap-character-edit-header { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 10px; }
.scenemap-character-name-edit { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 4px; }
.scenemap-character-name-edit > span { color: var(--lumiverse-text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.scenemap-character-name-edit > input { color: color-mix(in srgb, var(--lumiverse-text) 72%, var(--lumiverse-primary, var(--lumiverse-accent)) 28%); font-size: 14px; font-weight: 760; }
.scenemap-lv .scenemap-edit-remove-card { flex: 0 0 auto; width: 34px; height: 34px; color: var(--lumiverse-danger, #ef4444); }
.scenemap-edit-chip-field { gap: 6px; }
.scenemap-edit-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.scenemap-edit-chips.is-centered { justify-content: center; }
.scenemap-edit-chip { display: inline-flex; min-width: 0; align-items: stretch; overflow: hidden; border: 1px solid var(--lumiverse-primary-020, var(--lumiverse-border)); border-radius: var(--lumiverse-radius, 8px); background: color-mix(in srgb, var(--lumiverse-fill) 82%, var(--lumiverse-primary, var(--lumiverse-accent)) 6%); }
.scenemap-edit-chip > input, .scenemap-edit-chip > select { width: auto; min-width: 42px; max-width: 180px; box-sizing: border-box; border: 0; outline: none; background: transparent; color: var(--lumiverse-text); padding: 5px 4px 5px 8px; font: inherit; font-size: 12px; font-weight: 600; }
.scenemap-edit-chip > input:focus, .scenemap-edit-chip > select:focus { background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent)); }
.scenemap-lv .scenemap-edit-chip > button { width: 28px; min-width: 28px; padding: 0; border: 0; border-left: 1px solid color-mix(in srgb, var(--lumiverse-border) 70%, transparent); border-radius: 0; background: transparent; color: var(--lumiverse-text-dim); font-size: 16px; line-height: 1; }
.scenemap-lv .scenemap-edit-chip > button:hover:not(:disabled) { color: var(--lumiverse-danger, #ef4444); background: var(--lumiverse-danger-015, rgba(239, 68, 68, .15)); }
.scenemap-lv .scenemap-edit-chip-add { width: 30px; height: 30px; padding: 0; border-style: dashed; border-radius: var(--lumiverse-radius, 8px); background: transparent; color: var(--lumiverse-text-muted); }
.scenemap-lv .scenemap-edit-chip-add:hover:not(:disabled) { color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-edit-card-list { display: flex; flex-direction: column; gap: 10px; }
.scenemap-lv .scenemap-edit-add-card { width: 100%; padding: 8px 10px; border-style: dashed; color: var(--lumiverse-text-muted); background: transparent; }
.scenemap-lv .scenemap-edit-add-card:hover:not(:disabled) { color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-drawer-scroll { flex: 0 0 auto; min-height: 0; overflow: visible; box-sizing: border-box; padding: 14px; }
.scenemap-drawer-view { min-height: 0; }
.scenemap-drawer-view > .scenemap-shell { flex: none; min-height: 0; overflow: visible; padding: 14px 0 0; }
.scenemap-drawer-view .scenemap-board, .scenemap-drawer-view .scenemap-settings-scroll, .scenemap-drawer-view .scenemap-macros-scroll { flex: none; overflow: visible; }
.scenemap-drawer-view .scenemap-settings-scroll, .scenemap-drawer-view .scenemap-macros-scroll { padding-right: 0; padding-bottom: 0; }
.scenemap-drawer-root > .scenemap-settings-shell { flex: none; overflow: visible; }
.scenemap-drawer-root > .scenemap-settings-shell .scenemap-settings-scroll { flex: none; overflow: visible; }
.scenemap-view-tabs { display: flex; gap: 2px; width: min(100%, 380px); box-sizing: border-box; margin: 0 auto; padding: 3px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-md, 10px); background: var(--lumiverse-fill-subtle); }
.scenemap-lv .scenemap-view-tabs button { flex: 1 1 0; min-width: 0; padding: 7px 10px; border: 1px solid transparent; border-radius: var(--lumiverse-radius, 8px); background: transparent; color: var(--lumiverse-text-dim); font-size: calc(12px * var(--lumiverse-font-scale, 1)); font-weight: 500; text-align: center; transition: color var(--lumiverse-transition-fast, .15s ease), border-color var(--lumiverse-transition-fast, .15s ease); }
.scenemap-lv .scenemap-view-tabs button:hover:not(:disabled):not(.is-active) { color: var(--lumiverse-text-muted); background: var(--lumiverse-fill-subtle); border-color: transparent; }
.scenemap-lv .scenemap-view-tabs button.is-active, .scenemap-lv .scenemap-view-tabs button.is-active:hover:not(:disabled) { color: var(--lumiverse-primary-text, var(--lumiverse-primary)); background: var(--lumiverse-primary-015, color-mix(in srgb, var(--lumiverse-primary) 15%, transparent)); border-color: var(--lumiverse-primary-050, var(--lumiverse-primary)); box-shadow: var(--lumiverse-shadow-sm); }
.scenemap-settings-shell { gap: 0; }
.scenemap-settings-group-heading { min-height: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scenemap-settings-group .scenemap-settings-group-heading h3 { margin: 0; }
.scenemap-settings-dirty { margin: 0; color: var(--lumiverse-warning, var(--lumiverse-accent)); font-size: 10px; line-height: 1.4; white-space: nowrap; visibility: hidden; }
.scenemap-settings-dirty.is-visible { visibility: visible; }
.scenemap-settings-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding: 12px 8px 12px 0; }
.scenemap-macros-shell { gap: 0; }
.scenemap-macros-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 12px; padding: 12px 8px 12px 0; }
.scenemap-reference-header { width: 100%; padding: 6px 0 2px; text-align: center; }
.scenemap-reference-header > span { color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
.scenemap-reference-header h2 { margin: 3px 0 2px; color: var(--lumiverse-text); font-size: 18px; line-height: 1.25; font-weight: 750; }
.scenemap-macro-section { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-lg, 12px); background: var(--lumiverse-fill-subtle); }
.scenemap-macro-section h3 { margin: 0; color: var(--lumiverse-text); font-size: 13px; font-weight: 750; }
.scenemap-macro-section > p { margin: 0; color: var(--lumiverse-text-muted); font-size: 11px; line-height: 1.5; }
.scenemap-macro-list { display: flex; flex-direction: column; gap: 8px; }
.scenemap-macro-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; border: 1px solid var(--lumiverse-secondary-border, var(--lumiverse-border)); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); }
.scenemap-macro-details { min-width: 0; }
.scenemap-macro-details code { display: block; overflow-wrap: anywhere; color: var(--lumiverse-text); font-family: var(--lumiverse-font-mono, ui-monospace, SFMono-Regular, Consolas, monospace); font-size: 12px; font-weight: 700; }
.scenemap-macro-details span { display: block; margin-top: 4px; color: var(--lumiverse-text-muted); font-size: 11px; line-height: 1.45; }
.scenemap-lv .scenemap-macro-copy { flex: 0 0 30px; width: 30px; height: 30px; padding: 6px; color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); background: transparent; }
.scenemap-lv .scenemap-macro-copy svg { display: block; width: 100%; height: 100%; }
.scenemap-lv .scenemap-macro-copy.is-copied { color: var(--lumiverse-success, #22c55e); border-color: var(--lumiverse-success-050, rgba(34, 197, 94, .5)); background: var(--lumiverse-success-015, rgba(34, 197, 94, .15)); }
.scenemap-settings-group { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill-subtle); border-radius: var(--lumiverse-radius, 8px); padding: 12px; }
.scenemap-settings-group h3 { margin: 0 0 10px; color: var(--lumiverse-accent); font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.scenemap-settings-shell label { display: flex; flex-direction: column; gap: 5px; margin: 10px 0; font-size: 12px; color: var(--lumiverse-text-muted); }
.scenemap-auto-row { display: flex; flex-direction: column; gap: 9px; border-top: 1px solid var(--lumiverse-border); border-bottom: 1px solid var(--lumiverse-border); padding: 9px 0; margin: 10px 0; }
.scenemap-interval-field[hidden] { display: none; }
.scenemap-sampler-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.scenemap-sampler-row label { margin-top: 0; }
.scenemap-settings-shell .scenemap-switch-row { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; color: var(--lumiverse-text); margin: 0; min-width: 0; }
.scenemap-interface-switches { display: grid; gap: 10px; margin-top: 10px; }
.scenemap-interval-field { margin: 0 !important; min-width: 0; }
.scenemap-switch-row input { position: absolute; opacity: 0; pointer-events: none; }
.scenemap-switch { position: relative; width: 32px; height: 18px; flex: 0 0 auto; border-radius: var(--lumiverse-radius-md, 10px); background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border-hover); transition: background .16s ease, border-color .16s ease; }
.scenemap-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--lumiverse-text-muted); transition: transform .16s ease, background .16s ease; }
.scenemap-switch-row input:focus-visible + .scenemap-switch { outline: 2px solid var(--lumiverse-primary, var(--lumiverse-accent)); outline-offset: 2px; }
.scenemap-switch-row input:checked + .scenemap-switch { background: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-switch-row input:checked + .scenemap-switch::after { transform: translateX(14px); background: var(--lumiverse-primary-contrast, #fff); }
.scenemap-settings-preset-row label { margin: 0; min-width: 0; }
.scenemap-preset-toolbar { display: flex; align-items: end; gap: 8px; flex-wrap: wrap; }
.scenemap-preset-select { flex: 1 1 220px; }
.scenemap-settings-preset-actions, .scenemap-settings-actions-left { display: flex; flex: 0 1 auto; flex-wrap: wrap; gap: 6px; align-items: center; }
.scenemap-settings-preset-actions .scenemap-pill-action, .scenemap-settings-actions-left .scenemap-pill-action { display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; padding: 5px 9px !important; min-height: 30px; }
.scenemap-preset-editor { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--lumiverse-border); }
.scenemap-preset-editor label { display: flex; flex-direction: column; gap: 6px; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-expandable-textarea { position: relative; width: 100%; }
.scenemap-expandable-textarea > textarea { width: 100%; box-sizing: border-box; }
.scenemap-lv .scenemap-expand-editor-btn { position: absolute; top: 5px; right: 5px; z-index: 1; display: flex; align-items: center; justify-content: center; width: var(--lumiverse-btn-icon-sm, 28px); height: var(--lumiverse-btn-icon-sm, 28px); padding: 0; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px); background: var(--lumiverse-bg, #0f0d15); color: var(--lumiverse-text-dim); cursor: pointer; opacity: 0; transition: all var(--lumiverse-transition-fast, .15s ease); }
.scenemap-expandable-textarea:hover .scenemap-expand-editor-btn, .scenemap-expandable-textarea:focus-within .scenemap-expand-editor-btn { opacity: 1; }
.scenemap-lv .scenemap-expand-editor-btn:hover:not(:disabled) { color: var(--lumiverse-primary); border-color: var(--lumiverse-primary); background: var(--lumiverse-bg, #0f0d15); }
@media (hover: none), (pointer: coarse) {
  .scenemap-lv .scenemap-expand-editor-btn { opacity: 1; }
}
.scenemap-preset-editor textarea { width: 100%; min-height: 180px; box-sizing: border-box; resize: vertical; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 10px 11px; font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; }
.scenemap-preset-editor textarea[data-preset-editor="systemPrompt"], .scenemap-preset-editor textarea[data-preset-editor="userPrompt"] { min-height: 150px; font-family: inherit; }
.scenemap-preset-editor textarea:focus { outline: none; border-color: var(--lumiverse-primary, var(--lumiverse-accent)); box-shadow: 0 0 0 1px var(--lumiverse-primary-020, transparent); }
.scenemap-preset-schema-error { margin-top: -4px; }
.scenemap-preset-layout-row { display: flex; justify-content: flex-end; gap: 8px; }
.scenemap-preset-layout-row .scenemap-primary { min-width: 112px; }
.scenemap-settings-shell input:not([type="checkbox"]), .scenemap-editor textarea, .scenemap-layout-editor input, .scenemap-name-editor input {
  width: 100%; box-sizing: border-box; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px);
  background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 7px 9px; font: inherit;
}
.scenemap-native-select { width: 100%; min-width: 0; }
.scenemap-secondary-control { background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)) !important; }
body:has(.scenemap-secondary-control[aria-expanded="true"]) > [role="listbox"] {
  background:
    linear-gradient(var(--lumiverse-secondary, rgba(128, 128, 128, .15)), var(--lumiverse-secondary, rgba(128, 128, 128, .15))),
    linear-gradient(var(--lumiverse-bg, rgba(28, 24, 38, .95)), var(--lumiverse-bg, rgba(28, 24, 38, .95))),
    var(--lumiverse-bg-deep, #0a0812) !important;
}
body:has([data-spindle-modal] .scenemap-layout-editor) > [role="listbox"] { z-index: 10004 !important; }
.scenemap-editor { display: flex; flex-direction: column; gap: 10px; }
.scenemap-regeneration-modal { min-height: 0; color: var(--lumiverse-text); }
.scenemap-regeneration-options { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 3px; }
.scenemap-regeneration-mode { display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); cursor: pointer; }
.scenemap-regeneration-mode:has(input:checked) { border-color: var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))); background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent)); }
.scenemap-regeneration-mode:has(input:disabled) { opacity: .55; cursor: default; }
.scenemap-regeneration-mode input, .scenemap-regeneration-field input { flex: 0 0 auto; margin: 2px 0 0; accent-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-regeneration-mode > span, .scenemap-regeneration-field > span { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.scenemap-regeneration-mode strong, .scenemap-regeneration-field strong { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
.scenemap-regeneration-mode small, .scenemap-regeneration-field small { color: var(--lumiverse-text-muted); font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
.scenemap-regeneration-fields { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; opacity: .72; transition: opacity var(--lumiverse-transition-fast, .15s ease); }
.scenemap-regeneration-modal.is-selecting-fields .scenemap-regeneration-fields { opacity: 1; }
.scenemap-regeneration-group { overflow: hidden; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-fill-subtle); }
.scenemap-regeneration-group h3 { margin: 0; padding: 8px 11px; border-bottom: 1px solid var(--lumiverse-border); color: var(--lumiverse-accent); font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; overflow-wrap: anywhere; }
.scenemap-regeneration-field { display: flex; align-items: flex-start; gap: 10px; padding: 9px 11px; cursor: pointer; }
.scenemap-regeneration-field + .scenemap-regeneration-field { border-top: 1px solid color-mix(in srgb, var(--lumiverse-border) 70%, transparent); }
.scenemap-regeneration-field:hover { background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); }
.scenemap-regeneration-note { margin: 4px 0 0; padding: 10px 11px; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); color: var(--lumiverse-text-muted); background: var(--lumiverse-fill-subtle); font-size: 12px; line-height: 1.45; }
.scenemap-regeneration-note.is-warning { color: var(--lumiverse-warning, #f59e0b); border-color: var(--lumiverse-warning-050, color-mix(in srgb, var(--lumiverse-warning) 50%, transparent)); background: var(--lumiverse-warning-015, color-mix(in srgb, var(--lumiverse-warning) 15%, transparent)); }
.scenemap-regeneration-modal > .scenemap-modal-actions { flex: 0 0 auto; padding-top: 2px; }
.scenemap-name-editor { display: flex; flex-direction: column; gap: 12px; color: var(--lumiverse-text); }
.scenemap-name-editor label { display: flex; flex-direction: column; gap: 5px; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-editor textarea { min-height: min(58vh, 520px); resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; }
.scenemap-layout-editor { display: flex; flex-direction: column; gap: 12px; color: var(--lumiverse-text); }
.scenemap-layout-intro { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
.scenemap-layout-sections { display: flex; flex-direction: column; gap: 12px; max-height: min(58vh, 520px); overflow: auto; overflow-anchor: none; padding-right: 4px; }
.scenemap-layout-section { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill-subtle); border-radius: var(--lumiverse-radius, 8px); padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.scenemap-layout-section-header { display: grid; grid-template-columns: minmax(180px, 1fr) auto; gap: 8px; align-items: end; }
.scenemap-layout-section label, .scenemap-layout-field label { display: flex; flex-direction: column; gap: 5px; color: var(--lumiverse-text-muted); font-size: 12px; }
.scenemap-layout-fields { display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-field { display: flex; flex-direction: column; gap: 8px; }
.scenemap-layout-schema-warning { border-left: 2px solid var(--lumiverse-warning, #f59e0b); color: var(--lumiverse-warning, #f59e0b); padding: 4px 7px; font-size: 11px; line-height: 1.4; }
.scenemap-layout-field-row { display: grid; grid-template-columns: auto minmax(120px, 1fr) minmax(110px, .8fr) minmax(96px, .6fr) auto; gap: 6px; align-items: center; }
.scenemap-layout-field-row.has-chip-center, .scenemap-layout-child-row.has-chip-center { grid-template-columns: auto minmax(120px, 1fr) minmax(110px, .8fr) minmax(210px, 1.1fr) auto; }
.scenemap-layout-display-controls { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
.scenemap-layout-display-controls.has-center-select { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.scenemap-layout-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.scenemap-layout-actions button, .scenemap-layout-child-row button { padding: 5px 8px; font-size: 12px; }
.scenemap-layout-icon-btn { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.scenemap-layout-icon-btn svg { width: 18px; height: 18px; }
.scenemap-layout-add-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.scenemap-layout-child-box { border-top: 1px solid var(--lumiverse-border); padding-top: 9px; display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-child-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.scenemap-layout-child-header strong { font-size: 12px; color: var(--lumiverse-text-muted); text-transform: uppercase; }
.scenemap-layout-child-list { display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-child { display: flex; flex-direction: column; gap: 7px; }
.scenemap-layout-child-row { display: grid; grid-template-columns: auto minmax(120px, 1fr) minmax(110px, .8fr) minmax(96px, .6fr) auto; gap: 6px; align-items: center; }
.scenemap-layout-editor .scenemap-layout-drag-handle, .scenemap-layout-drag-fallback .scenemap-layout-drag-handle { width: 36px; height: 36px; min-width: 36px; display: inline-flex; align-items: center; justify-content: center; align-self: end; padding: 0; color: var(--lumiverse-text-dim); cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
.scenemap-layout-section-header .scenemap-layout-drag-handle { width: 44px; min-width: 44px; color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); background: var(--lumiverse-primary-010, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 10%, transparent)); }
.scenemap-layout-drag-handle svg { width: 18px; height: 18px; pointer-events: none; }
.scenemap-layout-editor .scenemap-layout-drag-handle:hover, .scenemap-layout-editor .scenemap-layout-drag-handle:focus-visible { color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-layout-editor .scenemap-layout-drag-handle[aria-grabbed="true"] { cursor: grabbing; color: var(--lumiverse-primary, var(--lumiverse-accent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-layout-drag-ghost { opacity: 1 !important; border: 1px dashed var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))) !important; border-radius: var(--lumiverse-radius, 8px); background: linear-gradient(var(--lumiverse-primary-010, rgba(128, 128, 128, .1)), var(--lumiverse-primary-010, rgba(128, 128, 128, .1))), var(--lumiverse-bg-deep, #0a0812) !important; }
.scenemap-layout-drag-ghost > * { visibility: hidden !important; }
.scenemap-layout-drag-chosen { border-color: var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))) !important; }
.scenemap-layout-drag-active, .scenemap-layout-drag-fallback { opacity: 1 !important; border: 1px solid var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))) !important; border-radius: var(--lumiverse-radius, 8px); background: linear-gradient(var(--lumiverse-fill-subtle, rgba(128, 128, 128, .12)), var(--lumiverse-fill-subtle, rgba(128, 128, 128, .12))), var(--lumiverse-bg-deep, #0a0812) !important; box-shadow: 0 12px 30px rgba(0, 0, 0, .38); }
.scenemap-layout-drag-fallback { pointer-events: none !important; z-index: 10020 !important; }
.scenemap-layout-drag-fallback input:not([type="checkbox"]) { width: 100%; box-sizing: border-box; border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius-sm, 5px); background: var(--lumiverse-secondary, rgba(128, 128, 128, .15)); color: var(--lumiverse-text); padding: 7px 9px; font: inherit; }
.scenemap-layout-drag-fallback button { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill); color: var(--lumiverse-text); border-radius: var(--lumiverse-radius-sm, 5px); font: inherit; }
body.scenemap-layout-is-dragging, body.scenemap-layout-is-dragging * { cursor: grabbing !important; user-select: none !important; -webkit-user-select: none !important; }
.scenemap-lv button, .scenemap-editor button, .scenemap-layout-editor button, .scenemap-name-editor button { border: 1px solid var(--lumiverse-border); background: var(--lumiverse-fill); color: var(--lumiverse-text); border-radius: var(--lumiverse-radius-sm, 5px); padding: 7px 10px; cursor: pointer; font: inherit; }
.scenemap-lv button:hover:not(:disabled), .scenemap-editor button:hover:not(:disabled), .scenemap-layout-editor button:hover:not(:disabled), .scenemap-name-editor button:hover:not(:disabled) { border-color: var(--lumiverse-border-hover); }
.scenemap-lv button:disabled, .scenemap-editor button:disabled, .scenemap-layout-editor button:disabled, .scenemap-name-editor button:disabled { opacity: 0.45; cursor: default; }
.scenemap-lv .scenemap-primary, .scenemap-editor .scenemap-primary, .scenemap-layout-editor .scenemap-primary, .scenemap-name-editor .scenemap-primary { background: var(--lumiverse-primary-015, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 15%, transparent)); color: var(--lumiverse-primary-text, var(--lumiverse-primary, var(--lumiverse-accent))); border-color: var(--lumiverse-primary-050, var(--lumiverse-primary, var(--lumiverse-accent))); }
.scenemap-lv .scenemap-primary:hover:not(:disabled), .scenemap-editor .scenemap-primary:hover:not(:disabled), .scenemap-layout-editor .scenemap-primary:hover:not(:disabled), .scenemap-name-editor .scenemap-primary:hover:not(:disabled) { background: var(--lumiverse-primary-020, color-mix(in srgb, var(--lumiverse-primary, var(--lumiverse-accent)) 22%, transparent)); border-color: var(--lumiverse-primary, var(--lumiverse-accent)); }
.scenemap-lv .scenemap-danger, .scenemap-editor .scenemap-danger, .scenemap-layout-editor .scenemap-danger, .scenemap-name-editor .scenemap-danger { background: var(--lumiverse-danger-015, rgba(239, 68, 68, .15)); color: var(--lumiverse-danger, #ef4444); border-color: var(--lumiverse-danger-050, rgba(239, 68, 68, .5)); }
.scenemap-lv .scenemap-danger:hover:not(:disabled), .scenemap-editor .scenemap-danger:hover:not(:disabled), .scenemap-layout-editor .scenemap-danger:hover:not(:disabled), .scenemap-name-editor .scenemap-danger:hover:not(:disabled) { background: var(--lumiverse-danger-020, rgba(239, 68, 68, .2)); border-color: var(--lumiverse-danger, #ef4444); }
.scenemap-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; }
.scenemap-pill-action { border-radius: var(--lumiverse-radius, 8px) !important; padding: 7px 13px !important; min-height: 34px; }
.scenemap-tracker-action { min-height: 30px; padding: 5px 10px !important; font-size: calc(12px * var(--lumiverse-font-scale, 1)); }
.scenemap-runtime-error, .scenemap-inline-error { border: 1px solid rgba(255, 100, 100, 0.45); color: #ffb8b8; background: rgba(120, 0, 0, 0.18); border-radius: var(--lumiverse-radius, 8px); padding: 10px; font-size: 12px; }
.scenemap-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
@media (max-width: 760px) {
  .scenemap-layout-section-header { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
  .scenemap-layout-section-header .scenemap-layout-actions { grid-column: 2; flex-wrap: nowrap; }
  .scenemap-layout-section-header .scenemap-layout-icon-btn, .scenemap-layout-section-header .scenemap-layout-drag-handle { width: 44px; height: 44px; min-width: 44px; }
  .scenemap-layout-field-row, .scenemap-layout-child-row { grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; }
  .scenemap-layout-field-row.has-chip-center, .scenemap-layout-child-row.has-chip-center { grid-template-columns: 44px minmax(0, 1fr) 44px; }
  .scenemap-layout-editor .scenemap-layout-drag-handle { width: 44px; height: 44px; min-width: 44px; grid-column: 1; grid-row: 1; }
  .scenemap-layout-field-row > [data-layout-select="field-path"],
  .scenemap-layout-child-row > [data-layout-select="child-path"] { grid-column: 2; grid-row: 1; }
  .scenemap-layout-field-row > .scenemap-layout-icon-btn,
  .scenemap-layout-child-row > .scenemap-layout-icon-btn { grid-column: 3; grid-row: 1; width: 44px; height: 44px; }
  .scenemap-layout-field-row > input,
  .scenemap-layout-child-row > input { grid-column: 1 / -1; grid-row: 2; }
  .scenemap-layout-field-row > .scenemap-layout-display-controls,
  .scenemap-layout-child-row > .scenemap-layout-display-controls { grid-column: 1 / -1; grid-row: 3; }
  .scenemap-settings-actions-left { justify-content: flex-start; }
  .scenemap-layout-actions { justify-content: flex-end; }
  .scenemap-layout-intro { align-items: stretch; flex-direction: column; }
}
@keyframes scenemap-status-pulse {
  0%, 100% { opacity: .72; }
  50% { opacity: 1; }
}
@keyframes scenemap-dot-fade {
  0%, 20% { opacity: .2; transform: translateY(0); }
  45% { opacity: 1; transform: translateY(-1px); }
  80%, 100% { opacity: .2; transform: translateY(0); }
}
@keyframes scenemap-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .scenemap-lv *, .scenemap-editor *, .scenemap-layout-editor *, .scenemap-name-editor * {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
