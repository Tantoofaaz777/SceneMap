import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SCHEMA_VALUE,
  jsonValuesEqual,
  mergeAutomaticSettingsPatch,
  mergePresetSettings,
  mergeSettings,
  resolveSamplingParameter,
  schemaFingerprint,
  schemaToExample,
  trackerToText,
} from "./shared";
import {
  createValidatedSchemaExample,
  parseAndValidateModelJson,
  validateSchemaDefinition,
  validateTrackerData,
} from "./schema-validator";

describe("parseAndValidateModelJson", () => {
  test("accepts a fenced response that matches the configured schema", () => {
    const tracker = schemaToExample(DEFAULT_SCHEMA_VALUE) as object;
    const response = `\`\`\`json\n${JSON.stringify(tracker)}\n\`\`\``;

    expect(parseAndValidateModelJson(response, DEFAULT_SCHEMA_VALUE)).toEqual(tracker);
  });

  test("rejects missing required properties", () => {
    expect(() => parseAndValidateModelJson("{}", DEFAULT_SCHEMA_VALUE)).toThrow(
      "Model response does not match the SceneMap schema",
    );
    expect(() => parseAndValidateModelJson("{}", DEFAULT_SCHEMA_VALUE)).toThrow("/time");
  });

  test("rejects properties with the wrong type", () => {
    const tracker = schemaToExample(DEFAULT_SCHEMA_VALUE) as Record<string, unknown>;
    tracker.characters = "Alice";

    expect(() => parseAndValidateModelJson(JSON.stringify(tracker), DEFAULT_SCHEMA_VALUE)).toThrow(
      "/characters must be array",
    );
  });

  test("keeps malformed JSON errors distinct from schema errors", () => {
    expect(() => parseAndValidateModelJson("{", DEFAULT_SCHEMA_VALUE)).toThrow(
      "Model response is not valid JSON",
    );
  });

  test("reports an invalid configured schema", () => {
    expect(() => parseAndValidateModelJson("{}", { type: "not-a-json-schema-type" })).toThrow(
      "SceneMap schema is invalid",
    );
  });

  test("rejects values that do not match a standard JSON Schema format", () => {
    const schema = {
      type: "object",
      properties: {
        timestamp: { type: "string", format: "date-time" },
      },
      required: ["timestamp"],
    };

    expect(() => parseAndValidateModelJson('{"timestamp":"tomorrow afternoon"}', schema)).toThrow(
      '/timestamp must match format "date-time"',
    );
  });

  test("accepts values that match a standard JSON Schema format", () => {
    const schema = {
      type: "object",
      properties: {
        timestamp: { type: "string", format: "date-time" },
      },
      required: ["timestamp"],
    };

    expect(parseAndValidateModelJson('{"timestamp":"2026-07-11T12:30:00Z"}', schema)).toEqual({
      timestamp: "2026-07-11T12:30:00Z",
    });
  });
});

describe("validateSchemaDefinition", () => {
  test("rejects invalid schemas before generation", () => {
    expect(() => validateSchemaDefinition({
      type: "object",
      properties: { name: { type: "strnig" } },
    })).toThrow("#/properties/name/type contains an unsupported JSON Schema type");
  });

  test("accepts valid recursive schemas", () => {
    expect(() => validateSchemaDefinition({
      type: "object",
      properties: { node: { $ref: "#/$defs/node" } },
      $defs: {
        node: {
          type: "object",
          properties: { child: { $ref: "#/$defs/node" } },
        },
      },
    })).not.toThrow();
  });
});

describe("schemaFingerprint", () => {
  test("is stable across object key order", () => {
    expect(schemaFingerprint({ type: "object", title: "Tracker" })).toBe(
      schemaFingerprint({ title: "Tracker", type: "object" }),
    );
  });

  test("changes when the schema changes", () => {
    expect(schemaFingerprint({ type: "object" })).not.toBe(schemaFingerprint({ type: "string" }));
  });
});

describe("validateTrackerData", () => {
  test("rejects a manual edit that violates the configured schema", () => {
    expect(() => validateTrackerData({}, DEFAULT_SCHEMA_VALUE)).toThrow(
      "Tracker data does not match the SceneMap schema",
    );
  });

  test("accepts a manual edit that satisfies the configured schema", () => {
    const tracker = schemaToExample(DEFAULT_SCHEMA_VALUE);

    expect(validateTrackerData(tracker, DEFAULT_SCHEMA_VALUE)).toEqual(tracker as object);
  });
});

describe("mergeSettings", () => {
  test("drops the removed message-button setting from legacy settings", () => {
    const legacySettings = { showMessageButtons: true } as unknown as Parameters<typeof mergeSettings>[0];
    const settings = mergeSettings(legacySettings);

    expect(Object.hasOwn(settings, "showMessageButtons")).toBe(false);
  });

  test("adds empty sampling overrides to existing settings", () => {
    const settings = mergeSettings({ maxResponseTokens: 4096 });

    expect(settings.temperature).toBeNull();
    expect(settings.topP).toBeNull();
    expect(settings.showTopToolbarButton).toBe(false);
  });

  test("normalizes numeric settings to the values shown and sent", () => {
    const settings = mergeSettings({
      maxResponseTokens: 0,
      temperature: 4,
      topP: -1,
    });

    expect(settings.maxResponseTokens).toBe(1);
    expect(settings.temperature).toBe(2);
    expect(settings.topP).toBe(0);

    const patched = mergeAutomaticSettingsPatch(settings, {
      maxResponseTokens: 0,
      temperature: -2,
      topP: 3,
    });
    expect(patched.maxResponseTokens).toBe(1);
    expect(patched.temperature).toBe(0);
    expect(patched.topP).toBe(1);
  });

  test("defaults invalid tracker placement values to the dock", () => {
    const settings = mergeSettings({ trackerPlacement: "floating" as "dock" });

    expect(settings.trackerPlacement).toBe("dock");
    expect(mergeSettings({ trackerPlacement: "drawer" }).trackerPlacement).toBe("drawer");
  });
});

describe("split settings persistence", () => {
  test("automatic settings cannot overwrite preset edits", () => {
    const current = mergeSettings({
      schemaPresets: {
        default: {
          name: "Custom",
          value: { type: "object", properties: { mood: { type: "string" } } },
        },
      },
    });

    const next = mergeAutomaticSettingsPatch(current, {
      temperature: 0.35,
      trackerPlacement: "drawer",
      showTopToolbarButton: true,
      schemaPreset: "attacker-controlled",
      schemaPresets: {},
    });

    expect(next.temperature).toBe(0.35);
    expect(next.trackerPlacement).toBe("drawer");
    expect(next.showTopToolbarButton).toBe(true);
    expect(next.schemaPreset).toBe(current.schemaPreset);
    expect(next.schemaPresets).toEqual(current.schemaPresets);
  });

  test("saving a preset cannot overwrite automatic settings", () => {
    const current = mergeSettings({
      temperature: 0.4,
      showInputBarButton: false,
      showTopToolbarButton: true,
      trackerPlacement: "drawer",
    });
    const incoming = mergeSettings({
      ...current,
      temperature: 1.8,
      showInputBarButton: true,
      showTopToolbarButton: false,
      trackerPlacement: "dock",
      schemaPresets: {
        ...current.schemaPresets,
        default: {
          ...current.schemaPresets.default,
          promptJson: "Updated prompt",
        },
      },
    });

    const next = mergePresetSettings(current, incoming);

    expect(next.temperature).toBe(0.4);
    expect(next.showInputBarButton).toBe(false);
    expect(next.showTopToolbarButton).toBe(true);
    expect(next.trackerPlacement).toBe("drawer");
    expect(next.schemaPresets.default.promptJson).toBe("Updated prompt");
  });
});

describe("resolveSamplingParameter", () => {
  test("uses the hint value when a sampling setting is empty", () => {
    expect(resolveSamplingParameter(null, 0, 2)).toBe(1);
    expect(resolveSamplingParameter(undefined, 0, 1)).toBe(1);
  });

  test("keeps valid values and clamps invalid ranges", () => {
    expect(resolveSamplingParameter(0.25, 0, 2)).toBe(0.25);
    expect(resolveSamplingParameter(3, 0, 2)).toBe(2);
    expect(resolveSamplingParameter(-0.5, 0, 1)).toBe(0);
  });
});

describe("jsonValuesEqual", () => {
  test("treats equivalent JSON objects as unchanged regardless of key order", () => {
    expect(jsonValuesEqual(
      { type: "object", properties: { name: { type: "string" } } },
      { properties: { name: { type: "string" } }, type: "object" },
    )).toBe(true);
  });

  test("detects nested JSON changes", () => {
    expect(jsonValuesEqual(
      { sections: [{ fields: ["name", "outfit"] }] },
      { sections: [{ fields: ["name", "hair"] }] },
    )).toBe(false);
  });
});

describe("trackerToText", () => {
  test("keeps custom fields alongside the standard scene summary", () => {
    const text = trackerToText({
      location: "Tavern",
      currentQuest: "Find the mage",
      dangerLevel: 8,
    });

    expect(text).toContain("Location: Tavern");
    expect(text).toContain("Current Quest: Find the mage");
    expect(text).toContain("Danger Level: 8");
  });

  test("keeps custom fields nested inside topics", () => {
    const text = trackerToText({
      location: "Tavern",
      topics: {
        primaryTopic: "Investigation",
        objective: "Find the hidden door",
      },
    });

    expect(text).toContain("Scene tone: Investigation.");
    expect(text).toContain("Objective: Find the hidden door");
  });

  test("keeps reserved field names when a custom schema gives them another shape", () => {
    const text = trackerToText({
      location: "Dock",
      characters: ["Alice", "Bob"],
      topics: "Custom topic",
    });

    expect(text).toContain("Location: Dock");
    expect(text).toContain("Characters:");
    expect(text).toContain("- Alice");
    expect(text).toContain("Topics: Custom topic");
  });
});

describe("schemaToExample", () => {
  test.each([
    {
      name: "enum",
      schema: {
        type: "object",
        properties: { mood: { type: "string", enum: ["happy", "sad"] } },
        required: ["mood"],
      },
    },
    {
      name: "minimum",
      schema: {
        type: "object",
        properties: { level: { type: "integer", minimum: 1 } },
        required: ["level"],
      },
    },
    {
      name: "minItems",
      schema: {
        type: "object",
        properties: { party: { type: "array", minItems: 2, items: { type: "string" } } },
        required: ["party"],
      },
    },
    {
      name: "local ref",
      schema: {
        type: "object",
        properties: { status: { $ref: "#/$defs/status" } },
        required: ["status"],
        $defs: { status: { type: "string", const: "active" } },
      },
    },
  ])("creates a valid example for $name constraints", ({ schema }) => {
    const example = schemaToExample(schema);

    expect(parseAndValidateModelJson(JSON.stringify(example), schema)).toEqual(example as object);
  });

  test("omits an automatically generated example when it cannot satisfy the schema", () => {
    const schema = {
      type: "object",
      properties: {
        code: { type: "string", pattern: "^Z{8}$" },
      },
      required: ["code"],
    };

    expect(createValidatedSchemaExample(schema)).toBeNull();
  });
});
