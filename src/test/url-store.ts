/**
 * A tiny observable URL used to stand in for the Next.js router in tests.
 *
 * The incident list keeps all of its state (search, filters, sort, page)
 * in the URL, so a static router mock would make those tests meaningless —
 * pushing a new URL has to actually re-render the components reading it.
 * This store is subscribed to via useSyncExternalStore in the
 * next/navigation mock, so it behaves like the real thing.
 */
let currentUrl = "/incidents";
const listeners = new Set<() => void>();

export function getUrl() {
  return currentUrl;
}

export function setUrl(url: string) {
  currentUrl = url;
  for (const listener of listeners) listener();
}

export function subscribeToUrl(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetUrl(url = "/incidents") {
  setUrl(url);
}
