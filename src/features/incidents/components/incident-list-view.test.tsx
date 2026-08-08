import { useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor, within } from "@/test/utils";
import { getUrl, resetUrl, setUrl, subscribeToUrl } from "@/test/url-store";

// The list keeps search/filters/sort/page entirely in the URL, so the
// router mock has to be reactive — pushing has to re-render the
// components reading it, or these tests would prove nothing.
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

async function findTableRows() {
  const table = await screen.findByRole("table", {}, { timeout: 5000 });
  return Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"));
}

describe("IncidentListView", () => {
  beforeEach(() => {
    resetUrl("/incidents");
  });

  it("loads and renders a page of incidents", async () => {
    renderWithProviders(<IncidentListView />);

    const rows = await waitFor(async () => {
      const found = await findTableRows();
      expect(found.length).toBeGreaterThan(0);
      return found;
    });

    // Default page size is 20.
    expect(rows).toHaveLength(20);
    expect(screen.getByText(/Showing 1–20 of/)).toBeInTheDocument();
  });

  it("writes the search term to the URL and narrows the results", async () => {
    const { user } = renderWithProviders(<IncidentListView />);
    await waitFor(async () => expect((await findTableRows()).length).toBeGreaterThan(0));

    const totalBefore = screen.getByText(/Showing 1–20 of (\d+)/).textContent;

    await user.type(screen.getByLabelText(/Search incidents/i), "payments-api");

    // Debounced by 300ms before it reaches the URL.
    await waitFor(() => expect(getUrl()).toContain("q=payments-api"), { timeout: 3000 });

    await waitFor(
      () => {
        const totalAfter = screen.getByText(/Showing 1–\d+ of (\d+)/).textContent;
        expect(totalAfter).not.toEqual(totalBefore);
      },
      { timeout: 5000 },
    );

    const rows = await findTableRows();
    for (const row of rows) {
      expect(within(row).getByText("payments-api")).toBeInTheDocument();
    }
  });

  it("adds a status filter as a removable tag and reflects it in the URL", async () => {
    const { user } = renderWithProviders(<IncidentListView />);
    await waitFor(async () => expect((await findTableRows()).length).toBeGreaterThan(0));

    await user.click(screen.getByRole("combobox", { name: /Status/i }));
    await user.click(await screen.findByRole("option", { name: "resolved" }));

    await waitFor(() => expect(getUrl()).toContain("status=resolved"));

    const tag = await screen.findByText(/Status: resolved/i);
    expect(tag).toBeInTheDocument();

    await waitFor(async () => {
      const rows = await findTableRows();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(within(row).getByText("Resolved")).toBeInTheDocument();
      }
    });

    // Removing the tag clears it from the URL again.
    await user.click(screen.getByRole("button", { name: /Remove Status: resolved filter/i }));
    await waitFor(() => expect(getUrl()).not.toContain("status=resolved"));
  });

  it("shows a no-results state when a search matches nothing, and can clear it", async () => {
    const { user } = renderWithProviders(<IncidentListView />);
    await waitFor(async () => expect((await findTableRows()).length).toBeGreaterThan(0));

    await user.type(
      screen.getByLabelText(/Search incidents/i),
      "zzzz-no-incident-matches-this",
    );

    expect(
      await screen.findByText(/No incidents match your search/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Clear search and filters/i }));

    await waitFor(async () => expect((await findTableRows()).length).toBeGreaterThan(0));
  });

  it("surfaces a retry-able error state when the request fails", async () => {
    // Force the list request to fail via the mock API's own control header.
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("X-Mock-Failure", "500");
      return originalFetch(input, { ...init, headers });
    });

    renderWithProviders(<IncidentListView />);

    expect(
      await screen.findByText(/Couldn't load incidents/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();

    vi.mocked(globalThis.fetch).mockRestore();
  });
});
