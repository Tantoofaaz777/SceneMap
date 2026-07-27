function cancellationError(): Error {
  const error = new Error("SceneMap generation was cancelled.");
  error.name = "AbortError";
  return error;
}

/**
 * Stops waiting for a non-abortable Spindle RPC when the surrounding
 * generation is cancelled. The underlying RPC may still settle later, but its
 * result can no longer keep SceneMap's generation registry or UI locked.
 */
export function raceWithAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(cancellationError());

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(cancellationError());
    };

    signal.addEventListener("abort", onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}
