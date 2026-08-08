import { describe, expect, it } from "vitest";

/**
 * Exercises the mock API through real fetch calls, the same way the app
 * reaches it. This is the contract every UI test below depends on, so if
 * something here breaks, the UI failures elsewhere are downstream noise.
 */
describe("mock API", () => {
  it("returns a paginated list of incidents", async () => {
    const res = await fetch("http://localhost:3000/api/incidents?page=1&pageSize=20");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(20);
    expect(body.total).toBeGreaterThan(1000);
    expect(body.page).toBe(1);
    expect(body.items[0]).toMatchObject({
      id: expect.stringMatching(/^INC-\d+$/),
      status: expect.any(String),
      severity: expect.any(String),
    });
  });

  it("filters by status and searches across id, title, service and assignee", async () => {
    const res = await fetch("http://localhost:3000/api/incidents?status=resolved&pageSize=50");
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i: { status: string }) => i.status === "resolved")).toBe(true);

    const search = await fetch("http://localhost:3000/api/incidents?q=payments-api&pageSize=50");
    const searchBody = await search.json();
    expect(searchBody.items.length).toBeGreaterThan(0);
    expect(
      searchBody.items.every((i: { service: string }) => i.service === "payments-api"),
    ).toBe(true);
  });

  it("ignores unrecognized filter values rather than returning nothing", async () => {
    const res = await fetch("http://localhost:3000/api/incidents?status=not-a-real-status");
    const body = await res.json();
    expect(body.total).toBeGreaterThan(1000);
  });

  it("rejects an invalid create with per-field errors", async () => {
    const res = await fetch("http://localhost:3000/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "no",
        description: "too short",
        severity: "high",
        service: "payments-api",
        status: "triggered",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.fieldErrors.title).toBeDefined();
    expect(body.fieldErrors.description).toBeDefined();
  });

  it("rejects a status transition that isn't allowed", async () => {
    const list = await fetch("http://localhost:3000/api/incidents?status=triggered&pageSize=1");
    const { items } = await list.json();
    const incident = items[0];

    // triggered -> resolved is not a legal single step.
    const res = await fetch(`http://localhost:3000/api/incidents/${incident.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown incident", async () => {
    const res = await fetch("http://localhost:3000/api/incidents/INC-does-not-exist");
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("INCIDENT_NOT_FOUND");
  });

  it("honours the X-Mock-Failure header so failure paths are testable", async () => {
    const res = await fetch("http://localhost:3000/api/incidents", {
      headers: { "X-Mock-Failure": "500" },
    });
    expect(res.status).toBe(500);
  });
});
