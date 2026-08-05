"use client";

import { useEffect, useState } from "react";

/**
 * Starts the MSW browser worker before rendering the app. This app has no
 * real backend — MSW *is* the backend, in every environment including the
 * deployed build — so we block first paint on it being ready rather than
 * letting early requests race the worker registration.
 */
export function MockingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@/mocks/browser").then(({ startMockWorker }) =>
      startMockWorker().then(() => {
        if (!cancelled) setReady(true);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-neutral-500">
        Starting AtlasOps…
      </div>
    );
  }

  return <>{children}</>;
}
