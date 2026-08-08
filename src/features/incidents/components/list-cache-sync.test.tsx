import { useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/types";
import { renderWithProviders, screen, waitFor, within } from "@/test/utils";
import { getUrl, resetUrl, setUrl, subscribeToUrl } from "@/test/url-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => setUrl(url),
    replace: (url: string) => setUrl(url),
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  usePathname: () => useSyncExternalStore(subscribeToUrl, getUrl, getUrl).split("?")[0],
  useSearchParams: () =>
    new URLSearchParams(useSyncExternalStore(subscribeToUrl, getUrl, getUrl).split("?")[1] ?? ""),
}));

const { IncidentListView } = await import("./incident-list-view");
const { IncidentDetailContent } = await import("./incident-detail-content");

/**
 * Regression test.
 *
 * Mutations used to only invalidate the incident caches, leaving the list
 * to catch up via a background refetch — a full network round trip later.
 * Closing the detail view straight after a status change showed the old
 * status for up to a couple of seconds.
 *
 * The list refetch is deliberately broken here after the mutation fires,
 * so the row can only be correct if the confirmed response was written
 * into the list cache directly. Against the old invalidate-only code the
 * row keeps its stale status and this fails.
 */
describe("list stays in sync with detail mutations", () => {
  beforeEach(() => {
    resetUrl("/incidents");
  });

  it("updates the list row from the mutation response, not a refetch", async () => {
    // An incident that's on page 1 of the default list ordering.
    const res = await fetch(
      "http://localhost:3000/api/incidents?status=acknowledged&pageSize=1",
    );
    const incident: Incident = (await res.json()).items[0];
    resetUrl(`/incidents?q=${encodeURIComponent(incident.id)}`);

    const { user } = renderWithProviders(
      <>
        <IncidentListView />
        <IncidentDetailContent id={incident.id} />
      </>,
    );

    // Wait for the row to show up in the list with its original status.
    const row = await waitFor(
      async () => {
        const table = await screen.findByRole("table");
        const found = table.querySelector<HTMLTableRowElement>("tbody tr");
        expect(found).not.toBeNull();
        expect(within(found!).getByText("Acknowledged")).toBeInTheDocument();
        return found!;
      },
      { timeout: 5000 },
    );

    // From here on, any list refetch fails — so a stale row cannot be
    // rescued by re-fetching. Mutations still go through.
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : String(input);
      const isListRead =
        (!init?.method || init.method === "GET") && /\/api\/incidents(\?|$)/.test(url);
      if (isListRead) {
        const headers = new Headers(init?.headers);
        headers.set("X-Mock-Failure", "500");
        return originalFetch(input, { ...init, headers });
      }
      return originalFetch(input, init);
    });

    await user.click(screen.getByRole("button", { name: /Mark Investigating/i }));

    await waitFor(
      () => expect(within(row).getByText("Investigating")).toBeInTheDocument(),
      { timeout: 5000 },
    );
    expect(within(row).queryByText("Acknowledged")).not.toBeInTheDocument();
  });
});
