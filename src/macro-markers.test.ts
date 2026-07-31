import { describe, expect, test } from "bun:test";
import { hasResolvableMacro } from "./macro-markers";

describe("hasResolvableMacro", () => {
  test("recognizes current Lumiverse macros", () => {
    expect(hasResolvableMacro("Hello {{user}}")).toBe(true);
  });

  test("recognizes legacy character and user macros case-insensitively", () => {
    expect(hasResolvableMacro("Hello <user> and <CHAR>")).toBe(true);
    expect(hasResolvableMacro("Hello <bot>")).toBe(true);
  });

  test("does not invoke macro resolution for ordinary angle-bracket text", () => {
    expect(hasResolvableMacro("value < 3 and <unknown>")).toBe(false);
  });
});
