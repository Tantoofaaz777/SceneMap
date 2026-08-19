import { describe, expect, test } from "bun:test";
import { StateRefreshGate } from "./state-refresh-gate";

describe("StateRefreshGate", () => {
  test("collapses an event burst into one follow-up refresh", () => {
    const gate = new StateRefreshGate();
    expect(gate.begin("state-1")).toBe(true);
    expect(gate.begin("state-2")).toBe(false);
    expect(gate.begin("state-3")).toBe(false);
    expect(gate.complete("state-1")).toEqual({ matched: true, rerun: true });
    expect(gate.begin("state-4")).toBe(true);
  });

  test("ignores unrelated responses without releasing the active request", () => {
    const gate = new StateRefreshGate();
    expect(gate.begin("state-1")).toBe(true);
    expect(gate.complete("other")).toEqual({ matched: false, rerun: false });
    expect(gate.begin("state-2")).toBe(false);
    expect(gate.complete("state-1")).toEqual({ matched: true, rerun: true });
  });

  test("reset discards both the active request and queued rerun", () => {
    const gate = new StateRefreshGate();
    gate.begin("state-1");
    gate.begin("state-2");
    gate.reset();
    expect(gate.begin("state-3")).toBe(true);
    expect(gate.complete("state-3")).toEqual({ matched: true, rerun: false });
  });
});
