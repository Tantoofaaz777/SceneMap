import { describe, expect, test } from "bun:test";
import { getGenerationButtonCommand } from "./generation-action";

describe("getGenerationButtonCommand", () => {
  test("starts while idle", () => {
    expect(getGenerationButtonCommand(false, false)).toBe("generate_tracker");
  });

  test("cancels an acknowledged generation", () => {
    expect(getGenerationButtonCommand(true, false)).toBe("cancel_generation");
  });

  test("cancels before the start acknowledgement arrives", () => {
    expect(getGenerationButtonCommand(false, true)).toBe("cancel_generation");
  });
});
