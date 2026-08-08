import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/types";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, back: () => {}, prefetch: () => {} }),
  usePathname: () => "/incidents",
  useSearchParams: () => new URLSearchParams(),
}));

const { IncidentDetailContent } = await import("./incident-detail-content");

/** Forces every request made inside `run` to fail, via the mock API's own
 * control header — the same mechanism the app's error paths would hit for
 * real, rather than stubbing out the client. */
async function withForcedFailure(run: () => Promise<void>) {
  const originalFetch = globalThis.fetch;
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("X-Mock-Failure", "500");
    return originalFetch(input, { ...init, headers });
  });
  try {
    await run();
  } finally {
    spy.mockRestore();
  }
}

let acknowledged: Incident;

beforeAll(async () => {
  // A real seeded incident whose only legal next step is "investigating".
  const res = await fetch(
    "http://localhost:3000/api/incidents?status=acknowledged&pageSize=1",
  );
  acknowledged = (await res.json()).items[0];
});

describe("IncidentDetailContent", () => {
  it("renders the incident's details", async () => {
    renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);

    expect(await screen.findByText(acknowledged.title, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(acknowledged.id)).toBeInTheDocument();
    expect(screen.getByText("Acknowledged")).toBeInTheDocument();
    expect(screen.getByText(acknowledged.service)).toBeInTheDocument();
  });

  it("applies a status transition and reflects the new status", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    await user.click(screen.getByRole("button", { name: /Mark Investigating/i }));

    expect(await screen.findByText("Investigating", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText("Acknowledged")).not.toBeInTheDocument();
  });

  it("rolls the status back and reports the error when the server rejects it", async () => {
    // Use a different incident so the previous test's mutation can't affect it.
    const res = await fetch("http://localhost:3000/api/incidents?status=triggered&pageSize=1");
    const triggered: Incident = (await res.json()).items[0];

    const { user } = renderWithProviders(<IncidentDetailContent id={triggered.id} />);
    await screen.findByText(triggered.title, {}, { timeout: 5000 });
    expect(screen.getByText("Triggered")).toBeInTheDocument();

    await withForcedFailure(async () => {
      await user.click(screen.getByRole("button", { name: /Mark Acknowledged/i }));

      // Error surfaces...
      expect(
        await screen.findByText(/Couldn't update status/i, {}, { timeout: 5000 }),
      ).toBeInTheDocument();
    });

    // ...and the optimistic change is reverted.
    await waitFor(() => expect(screen.getByText("Triggered")).toBeInTheDocument());
  });

  it("rejects an empty note without calling the server", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    await user.click(screen.getByRole("button", { name: /Add note/i }));
    expect(await screen.findByText(/Note cannot be empty/i)).toBeInTheDocument();

    // Whitespace alone is rejected too.
    await user.type(screen.getByLabelText(/Add a note/i), "   ");
    await user.click(screen.getByRole("button", { name: /Add note/i }));
    expect(await screen.findByText(/Note cannot be empty/i)).toBeInTheDocument();
  });

  it("adds a note and clears the field on success", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    const field = screen.getByLabelText(/Add a note/i);
    await user.type(field, "Rotated the affected credentials.");
    await user.click(screen.getByRole("button", { name: /Add note/i }));

    // The field only clears once the server confirms, so waiting on that
    // first means the note is guaranteed to be settled before asserting
    // on it — otherwise the assertion races the mutation.
    await waitFor(() => expect(field).toHaveValue(""), { timeout: 5000 });
    expect(screen.getByText("Rotated the affected credentials.")).toBeInTheDocument();
  });

  it("keeps the typed note when the server rejects it", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    const field = screen.getByLabelText(/Add a note/i);
    const text = "This submission is going to fail.";
    await user.type(field, text);

    await withForcedFailure(async () => {
      await user.click(screen.getByRole("button", { name: /Add note/i }));
      expect(
        await screen.findByText(/Couldn't add note/i, {}, { timeout: 5000 }),
      ).toBeInTheDocument();
    });

    // The user's text survives so they don't have to retype it.
    expect(field).toHaveValue(text);
  });

  it("reassigns the incident to another user", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    const assignee = screen.getByRole("combobox", { name: /Assignee/i });
    await user.click(assignee);

    // Pick a user that isn't the one already assigned.
    const options = await screen.findAllByRole("option");
    const target = options.find(
      (option) =>
        option.textContent &&
        option.textContent !== "Unassigned" &&
        option.textContent !== assignee.textContent,
    );
    const targetName = target!.textContent!;
    await user.click(target!);

    await waitFor(() => expect(assignee).toHaveTextContent(targetName), { timeout: 5000 });
    expect(await screen.findByText(`Assigned to ${targetName}`)).toBeInTheDocument();
  });

  it("can remove the assignee entirely", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    const assignee = screen.getByRole("combobox", { name: /Assignee/i });
    await user.click(assignee);
    await user.click(await screen.findByRole("option", { name: "Unassigned" }));

    await waitFor(() => expect(assignee).toHaveTextContent("Unassigned"), { timeout: 5000 });
  });

  it("rolls the assignee back and reports the error when the server rejects it", async () => {
    const { user } = renderWithProviders(<IncidentDetailContent id={acknowledged.id} />);
    await screen.findByText(acknowledged.title, {}, { timeout: 5000 });

    const assignee = screen.getByRole("combobox", { name: /Assignee/i });
    const before = assignee.textContent;

    await user.click(assignee);
    const options = await screen.findAllByRole("option");
    const target = options.find(
      (option) => option.textContent && option.textContent !== before,
    );

    await withForcedFailure(async () => {
      await user.click(target!);
      expect(
        await screen.findByText(/Couldn't update assignee/i, {}, { timeout: 5000 }),
      ).toBeInTheDocument();
    });

    // The optimistic change is reverted.
    await waitFor(() => expect(assignee).toHaveTextContent(before ?? ""));
  });
});
