import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

const pushed: string[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => pushed.push(url),
    replace: () => {},
    back: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/new-incident",
  useSearchParams: () => new URLSearchParams(),
}));

const { CreateIncidentForm } = await import("./create-incident-form");

/** Field-level errors are alerts too, so the summary can't be found by
 * role alone — locate it by its heading text and walk up to the region. */
async function findSummary() {
  const heading = await screen.findByText(/problems? with this form/i);
  const summary = heading.closest('[role="alert"]');
  if (!summary) throw new Error("validation summary not found");
  return summary as HTMLElement;
}

async function fillValidForm(user: ReturnType<typeof renderWithProviders>["user"]) {
  await user.type(screen.getByLabelText("Title"), "Search shard rebalance stalled");
  await user.type(
    screen.getByLabelText("Description"),
    "Rebalance has been stuck at 62% for 40 minutes and read latency is climbing.",
  );
  await user.click(screen.getByRole("combobox", { name: "Service" }));
  await user.click(await screen.findByRole("option", { name: "payments-api" }));
}

describe("CreateIncidentForm", () => {
  it("blocks submission and reports every problem when the form is empty", async () => {
    const { user } = renderWithProviders(<CreateIncidentForm />);

    await user.click(screen.getByRole("button", { name: /Create incident/i }));

    const summary = await findSummary();
    expect(summary).toHaveTextContent(/There are 3 problems with this form/i);
    expect(summary).toHaveTextContent(/Title/);
    expect(summary).toHaveTextContent(/Description/);
    expect(summary).toHaveTextContent(/Service/);

    // Nothing was sent.
    expect(pushed).toHaveLength(0);
  });

  it("moves focus to the validation summary so it is announced", async () => {
    const { user } = renderWithProviders(<CreateIncidentForm />);

    await user.click(screen.getByRole("button", { name: /Create incident/i }));

    const summary = await findSummary();
    await waitFor(() => expect(summary).toHaveFocus());
  });

  it("associates each field with its own error message", async () => {
    const { user } = renderWithProviders(<CreateIncidentForm />);
    await user.click(screen.getByRole("button", { name: /Create incident/i }));

    const title = await screen.findByLabelText("Title");
    await waitFor(() => expect(title).toHaveAttribute("aria-invalid", "true"));
    expect(title).toHaveAttribute("aria-describedby", "title-error");
    expect(document.getElementById("title-error")).toHaveTextContent(
      /Title must be at least 5 characters/i,
    );
  });

  it("clears the summary as problems are fixed", async () => {
    const { user } = renderWithProviders(<CreateIncidentForm />);
    await user.click(screen.getByRole("button", { name: /Create incident/i }));
    expect(await findSummary()).toHaveTextContent(/3 problems/i);

    await user.type(screen.getByLabelText("Title"), "Search shard rebalance stalled");
    await user.click(screen.getByRole("button", { name: /Create incident/i }));

    await waitFor(async () => expect(await findSummary()).toHaveTextContent(/2 problems/i));
  });

  it("creates the incident and navigates to it", async () => {
    pushed.length = 0;
    const { user } = renderWithProviders(<CreateIncidentForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /Create incident/i }));

    await waitFor(() => expect(pushed).toHaveLength(1), { timeout: 5000 });
    expect(pushed[0]).toMatch(/^\/incidents\/INC-\d+$/);
  });

  it("keeps what the user typed when the server rejects the request", async () => {
    pushed.length = 0;
    const { user } = renderWithProviders(<CreateIncidentForm />);
    // Fill the form first: the spy below fails *every* request, so
    // installing it earlier would also break loading the service list.
    await fillValidForm(user);

    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("X-Mock-Failure", "500");
      return originalFetch(input, { ...init, headers });
    });

    await user.click(screen.getByRole("button", { name: /Create incident/i }));

    expect(
      await screen.findByText(/Couldn't create incident/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument();

    // Still on the form, with the entered data intact.
    expect(pushed).toHaveLength(0);
    expect(screen.getByLabelText("Title")).toHaveValue("Search shard rebalance stalled");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Rebalance has been stuck at 62% for 40 minutes and read latency is climbing.",
    );
  });

  it("disables submit while in flight so it can't be double-submitted", async () => {
    pushed.length = 0;
    let createRequests = 0;

    const { user } = renderWithProviders(<CreateIncidentForm />);
    await fillValidForm(user);

    // Slow the create call down (via the mock API's own delay header) so
    // the pending window is actually observable, and count the requests.
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : String(input);
      if (init?.method === "POST" && url.includes("/api/incidents")) {
        createRequests++;
        const headers = new Headers(init?.headers);
        headers.set("X-Mock-Delay", "300");
        return originalFetch(input, { ...init, headers });
      }
      return originalFetch(input, init);
    });

    const submit = screen.getByRole("button", { name: /Create incident/i });
    await user.click(submit);

    // The guard: disabled and labelled as in-progress while it runs.
    await waitFor(() => expect(submit).toBeDisabled());
    expect(submit).toHaveTextContent(/Creating/i);

    await waitFor(() => expect(pushed).toHaveLength(1), { timeout: 5000 });
    expect(createRequests).toBe(1);
  });
});
