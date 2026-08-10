import { describe, expect, test } from "bun:test";
import {
  appendTrackerArrayItem,
  createTrackerEditDefaultValue,
  getTrackerEditControlKind,
  getTrackerSchemaAtPath,
  parseTrackerEditValue,
  removeTrackerArrayItem,
  setTrackerValueAtPath,
} from "./tracker-inline-edit";

const schema = {
  type: "object",
  properties: {
    health: { type: "integer", minimum: 0, maximum: 100 },
    present: { type: "array", items: { type: "string" } },
    characters: {
      type: "array",
      items: { $ref: "#/$defs/character" },
    },
  },
  $defs: {
    character: {
      type: "object",
      properties: {
        name: { type: "string" },
        state: { enum: ["calm", "hurt"] },
      },
    },
  },
};

describe("inline tracker editing", () => {
  test("resolves schemas through arrays and local refs", () => {
    expect(getTrackerSchemaAtPath(schema, ["characters", 0, "name"]).type).toBe("string");
    expect(getTrackerSchemaAtPath(schema, ["characters", 2, "state"]).enum).toEqual(["calm", "hurt"]);
  });

  test("selects and parses controls without losing JSON types", () => {
    const healthSchema = getTrackerSchemaAtPath(schema, ["health"]);
    expect(getTrackerEditControlKind(healthSchema, 80)).toBe("integer");
    expect(parseTrackerEditValue("integer", "42", healthSchema)).toBe(42);
    expect(parseTrackerEditValue("integer", "4.2", healthSchema)).toBe("4.2");
    expect(parseTrackerEditValue("string_array", "Maya\nAlexis\n", {})).toEqual(["Maya", "Alexis"]);
    expect(parseTrackerEditValue("enum", "1", getTrackerSchemaAtPath(schema, ["characters", 0, "state"]))).toBe("hurt");
  });

  test("updates nested fields and manages card arrays", () => {
    const draft: any = { characters: [{ name: "Maya" }] };
    expect(setTrackerValueAtPath(draft, ["characters", 0, "name"], "Alexis")).toBe(true);
    expect(appendTrackerArrayItem(draft, ["characters"], { name: "June" })).toBe(true);
    expect(removeTrackerArrayItem(draft, ["characters"], 0)).toBe(true);
    expect(draft).toEqual({ characters: [{ name: "June" }] });
  });

  test("creates a new card with required schema fields", () => {
    const itemSchema = getTrackerSchemaAtPath(schema, ["characters", 0]);
    const requiredSchema = { ...itemSchema, required: ["name", "state"] };
    expect(createTrackerEditDefaultValue(requiredSchema)).toEqual({ name: "", state: "calm" });
  });

  test("rejects prototype-polluting paths", () => {
    const draft = {};
    expect(setTrackerValueAtPath(draft, ["__proto__", "polluted"], true)).toBe(false);
    expect(({} as any).polluted).toBeUndefined();
  });
});
