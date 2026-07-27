import { describe, expect, test } from "bun:test";
import { raceWithAbort } from "./abortable";

describe("raceWithAbort", () => {
  test("passes through a completed operation", async () => {
    const controller = new AbortController();
    await expect(raceWithAbort(Promise.resolve("done"), controller.signal)).resolves.toBe("done");
  });

  test("rejects immediately when already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(raceWithAbort(Promise.resolve("late"), controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  test("releases the caller when a pending operation cannot be cancelled itself", async () => {
    const controller = new AbortController();
    const neverSettles = new Promise<string>(() => {});
    const result = raceWithAbort(neverSettles, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
  });
});
