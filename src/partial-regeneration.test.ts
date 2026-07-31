import { describe, expect, test } from "bun:test";
import {
  applyTrackerFieldUpdates,
  collectRegeneratableFields,
  formatTrackerPath,
  getTrackerSubschema,
  normalizeTrackerPaths,
  trackerPathKey,
} from "./partial-regeneration";

const tracker = {
  time: "10:00",
  charactersPresent: ["Maya", "Alexis"],
  characters: [
    { name: "Maya", hair: "Black bob", position: "By the door" },
    { name: "Alexis", hair: "Long blonde hair", position: "On the sofa" },
  ],
};

describe("partial tracker regeneration", () => {
  test("collects primitive fields and expands object arrays by item", () => {
    const fields = collectRegeneratableFields(tracker);
    expect(fields.map((field) => trackerPathKey(field.path))).toEqual([
      '["time"]',
      '["charactersPresent"]',
      '["characters",0,"name"]',
      '["characters",0,"hair"]',
      '["characters",0,"position"]',
      '["characters",1,"name"]',
      '["characters",1,"hair"]',
      '["characters",1,"position"]',
    ]);
    expect(fields[4]).toMatchObject({
      label: "Position",
      groups: ["Characters", "Maya"],
      currentValue: "By the door",
    });
    expect(formatTrackerPath(fields[4].path, tracker)).toBe("Characters \u203a Maya \u203a Position");
  });

  test("normalizes safe paths and rejects duplicates, overlaps, and prototype keys", () => {
    expect(normalizeTrackerPaths([["characters", 0, "position"]])).toEqual([
      ["characters", 0, "position"],
    ]);
    expect(() => normalizeTrackerPaths([])).toThrow("Select at least one");
    expect(() => normalizeTrackerPaths([["characters"], ["characters", 0, "hair"]])).toThrow(
      "either a tracker field or one of its children",
    );
    expect(() => normalizeTrackerPaths([["characters", 0, "__proto__"]])).toThrow("unsafe");
  });

  test("applies multiple values atomically without mutating the original tracker", () => {
    const updated = applyTrackerFieldUpdates(tracker, [
      { path: ["characters", 0, "position"], value: "At the table" },
      { path: ["characters", 1, "hair"], value: "Braided blonde hair" },
    ]) as typeof tracker;

    expect(updated.characters[0].position).toBe("At the table");
    expect(updated.characters[1].hair).toBe("Braided blonde hair");
    expect(updated.characters[0].hair).toBe("Black bob");
    expect(tracker.characters[0].position).toBe("By the door");
  });

  test("derives materialized field schemas through refs, arrays, and allOf", () => {
    const schema = {
      type: "object",
      properties: {
        characters: {
          type: "array",
          items: {
            allOf: [
              { $ref: "#/$defs/named" },
              {
                type: "object",
                properties: {
                  position: { type: "string", minLength: 3 },
                },
              },
            ],
          },
        },
      },
      $defs: {
        named: {
          type: "object",
          properties: {
            name: { $ref: "#/$defs/nonEmpty" },
          },
        },
        nonEmpty: { type: "string", minLength: 1 },
      },
    };

    expect(getTrackerSubschema(schema, ["characters", 0, "name"])).toEqual({
      type: "string",
      minLength: 1,
    });
    expect(getTrackerSubschema(schema, ["characters", 0, "position"])).toEqual({
      type: "string",
      minLength: 3,
    });
    expect(getTrackerSubschema(schema, ["missing"])).toBeNull();
  });
});
