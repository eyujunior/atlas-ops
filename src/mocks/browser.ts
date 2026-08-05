import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// Memoized so React Strict Mode's double effect-invocation (dev only)
// doesn't call worker.start() twice, which MSW rejects with
// "cannot configure an already enabled network".
let startPromise: Promise<void> | null = null;

export function startMockWorker(): Promise<void> {
  if (!startPromise) {
    startPromise = worker
      .start({ onUnhandledRequest: "bypass", quiet: true })
      .then(() => undefined);
  }
  return startPromise;
}
