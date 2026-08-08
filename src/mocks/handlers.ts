import { delay, http, HttpResponse } from "msw";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/lib/types";
import {
  addNote,
  ApiError,
  createIncident,
  getIncident,
  listIncidents,
  listServices,
  listUsers,
  updateAssignee,
  updateStatus,
} from "./store";

/**
 * Chaos is disabled by default in the Vitest environment (deterministic
 * fixtures for automated tests) and enabled everywhere else so the live
 * app demonstrates real loading/error/retry handling. Tests that need to
 * exercise failure paths do so explicitly via the X-Mock-Failure /
 * X-Mock-Conflict headers, which work regardless of this flag.
 */
const chaosEnabled = process.env.NODE_ENV !== "test";

const RANDOM_FAILURE_RATE = 0.05;

function randomBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

function parseCsv<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is T => (allowed as readonly string[]).includes(v));
}

/** Applies simulated latency and header/random-driven failure injection. */
async function simulateNetwork(
  request: Request,
): Promise<HttpResponse<Record<string, unknown>> | null> {
  const forcedDelay = request.headers.get("X-Mock-Delay");
  const forcedFailure = request.headers.get("X-Mock-Failure");
  const forcedConflict = request.headers.get("X-Mock-Conflict") === "true";

  const ms = forcedDelay
    ? Number(forcedDelay)
    : chaosEnabled
      ? randomBetween(200, 1200)
      : 0;
  await delay(ms);

  if (forcedConflict) {
    return HttpResponse.json(
      {
        code: "INCIDENT_VERSION_CONFLICT",
        message: "The incident was changed by another user.",
        currentVersion: 999,
      },
      { status: 409 },
    );
  }

  if (forcedFailure) {
    const status = Number(forcedFailure);
    return HttpResponse.json(
      { code: "FORCED_FAILURE", message: `Forced ${status} for testing.` },
      { status },
    );
  }

  if (chaosEnabled && Math.random() < RANDOM_FAILURE_RATE) {
    return HttpResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    );
  }

  return null;
}

function errorResponse(error: unknown): HttpResponse<Record<string, unknown>> {
  if (error instanceof ApiError) {
    return HttpResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        ...(error.currentVersion !== undefined
          ? { currentVersion: error.currentVersion }
          : {}),
      },
      { status: error.status },
    );
  }
  return HttpResponse.json(
    { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    { status: 500 },
  );
}

export const handlers = [
  http.get("/api/incidents", async ({ request }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;

    const url = new URL(request.url);
    const sortParam = url.searchParams.get("sort");
    const orderParam = url.searchParams.get("order");

    const result = listIncidents({
      q: url.searchParams.get("q") ?? undefined,
      status: parseCsv<IncidentStatus>(
        url.searchParams.get("status"),
        INCIDENT_STATUSES,
      ),
      severity: parseCsv<IncidentSeverity>(
        url.searchParams.get("severity"),
        INCIDENT_SEVERITIES,
      ),
      service: url.searchParams.get("service") ?? undefined,
      sort:
        sortParam === "createdAt" || sortParam === "severity"
          ? sortParam
          : "updatedAt",
      order: orderParam === "asc" ? "asc" : "desc",
      page: Number(url.searchParams.get("page") ?? "1") || 1,
      pageSize: Number(url.searchParams.get("pageSize") ?? "20") || 20,
    });

    return HttpResponse.json(result);
  }),

  http.get("/api/incidents/:id", async ({ request, params }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    try {
      const incident = getIncident(String(params.id));
      return HttpResponse.json(incident);
    } catch (error) {
      return errorResponse(error);
    }
  }),

  http.post("/api/incidents", async ({ request }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    try {
      const body = await request.json();
      const incident = createIncident(body as Record<string, unknown>);
      return HttpResponse.json(incident, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }),

  http.patch("/api/incidents/:id/status", async ({ request, params }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    try {
      const body = (await request.json()) as {
        status: IncidentStatus;
        version?: number;
      };
      const incident = updateStatus(String(params.id), body.status, body.version);
      return HttpResponse.json({
        id: incident.id,
        status: incident.status,
        updatedAt: incident.updatedAt,
        version: incident.version,
      });
    } catch (error) {
      return errorResponse(error);
    }
  }),

  http.patch("/api/incidents/:id/assignee", async ({ request, params }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    try {
      const body = (await request.json()) as { assigneeId: string | null };
      const incident = updateAssignee(String(params.id), body.assigneeId);
      return HttpResponse.json(incident);
    } catch (error) {
      return errorResponse(error);
    }
  }),

  http.post("/api/incidents/:id/notes", async ({ request, params }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    try {
      const body = (await request.json()) as { message: string };
      const note = addNote(String(params.id), body.message ?? "");
      return HttpResponse.json(note, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }),

  http.get("/api/users", async ({ request }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    return HttpResponse.json({ items: listUsers() });
  }),

  http.get("/api/services", async ({ request }) => {
    const chaos = await simulateNetwork(request);
    if (chaos) return chaos;
    return HttpResponse.json({ items: listServices() });
  }),
];
