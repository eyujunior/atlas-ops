import type {
  Incident,
  IncidentNote,
  IncidentSeverity,
  IncidentStatus,
  UserSummary,
} from "@/lib/types";
import { STATUS_TRANSITIONS } from "@/lib/types";
import { generateIncidents, getCurrentUser, SERVICES, USERS } from "./seed";

const INCIDENT_COUNT = 1200;

class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;
  currentVersion?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: { fieldErrors?: Record<string, string[]>; currentVersion?: number },
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = extra?.fieldErrors;
    this.currentVersion = extra?.currentVersion;
  }
}

export { ApiError };

// Module-level singleton: one dataset per JS runtime (one browser tab, or
// one Node test worker). See README "Architecture" for why this is safe.
const incidents = new Map<string, Incident>(
  generateIncidents(INCIDENT_COUNT).map((incident) => [incident.id, incident]),
);

let nextIncidentSeq = INCIDENT_COUNT + 1000;
let nextNoteSeq = 100000;

export interface ListParams {
  q?: string;
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  service?: string;
  sort?: "updatedAt" | "createdAt" | "severity";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function matches(incident: Incident, params: ListParams): boolean {
  if (params.q) {
    const q = params.q.trim().toLowerCase();
    const haystack = [
      incident.id,
      incident.title,
      incident.service,
      incident.assignee?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (params.status?.length && !params.status.includes(incident.status)) {
    return false;
  }
  if (
    params.severity?.length &&
    !params.severity.includes(incident.severity)
  ) {
    return false;
  }
  if (params.service && incident.service !== params.service) {
    return false;
  }
  return true;
}

export function listIncidents(params: ListParams) {
  const sort = params.sort ?? "updatedAt";
  const order = params.order ?? "desc";
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));

  const filtered = Array.from(incidents.values()).filter((incident) =>
    matches(incident, params),
  );

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sort === "severity") {
      cmp = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    } else {
      cmp =
        new Date(a[sort]).getTime() - new Date(b[sort]).getTime();
    }
    // Stable tiebreaker so pagination doesn't reshuffle equal keys.
    if (cmp === 0) cmp = a.id.localeCompare(b.id);
    return order === "asc" ? cmp : -cmp;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, page, pageSize, total, totalPages };
}

export function getIncident(id: string): Incident {
  const incident = incidents.get(id);
  if (!incident) {
    throw new ApiError(404, "INCIDENT_NOT_FOUND", "The requested incident does not exist.");
  }
  return incident;
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  service: string;
  assigneeId?: string | null;
}

function validateCreate(input: Partial<CreateIncidentInput>) {
  const fieldErrors: Record<string, string[]> = {};

  const title = input.title?.trim() ?? "";
  if (title.length < 5 || title.length > 120) {
    fieldErrors.title = ["Title must be between 5 and 120 characters."];
  }

  const description = input.description?.trim() ?? "";
  if (description.length < 20 || description.length > 2000) {
    fieldErrors.description = [
      "Description must be between 20 and 2,000 characters.",
    ];
  }

  if (!input.severity) {
    fieldErrors.severity = ["Severity is required."];
  }
  if (!input.service) {
    fieldErrors.service = ["Service is required."];
  }
  if (!input.status) {
    fieldErrors.status = ["Initial status is required."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "The submitted incident is invalid.", {
      fieldErrors,
    });
  }
}

export function createIncident(input: Partial<CreateIncidentInput>): Incident {
  validateCreate(input);

  const assignee = input.assigneeId
    ? USERS.find((u) => u.id === input.assigneeId) ?? null
    : null;

  const now = new Date().toISOString();
  const id = `INC-${nextIncidentSeq++}`;
  const incident: Incident = {
    id,
    title: input.title!.trim(),
    description: input.description!.trim(),
    status: input.status!,
    severity: input.severity!,
    service: input.service!,
    assignee,
    createdAt: now,
    updatedAt: now,
    notes: [],
    version: 1,
  };
  incidents.set(id, incident);
  return incident;
}

export function updateStatus(
  id: string,
  status: IncidentStatus,
  expectedVersion?: number,
) {
  const incident = getIncident(id);

  if (expectedVersion !== undefined && incident.version !== expectedVersion) {
    throw new ApiError(
      409,
      "INCIDENT_VERSION_CONFLICT",
      "The incident was changed by another user.",
      { currentVersion: incident.version },
    );
  }

  const allowed = STATUS_TRANSITIONS[incident.status] ?? [];
  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      `Cannot transition from "${incident.status}" to "${status}".`,
    );
  }

  incident.status = status;
  incident.updatedAt = new Date().toISOString();
  incident.version += 1;
  return incident;
}

export function updateAssignee(id: string, assigneeId: string | null) {
  const incident = getIncident(id);
  const assignee = assigneeId
    ? USERS.find((u) => u.id === assigneeId)
    : null;

  if (assigneeId && !assignee) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unknown assignee.");
  }

  incident.assignee = assignee ?? null;
  incident.updatedAt = new Date().toISOString();
  incident.version += 1;
  return incident;
}

export function addNote(id: string, message: string): IncidentNote {
  const incident = getIncident(id);
  const trimmed = message.trim();
  if (!trimmed) {
    throw new ApiError(400, "VALIDATION_ERROR", "Note message cannot be empty.", {
      fieldErrors: { message: ["Note cannot be empty."] },
    });
  }

  const note: IncidentNote = {
    id: `note-${nextNoteSeq++}`,
    incidentId: id,
    author: getCurrentUser(),
    message: trimmed,
    createdAt: new Date().toISOString(),
  };
  incident.notes = [...incident.notes, note];
  incident.updatedAt = note.createdAt;
  incident.version += 1;
  return note;
}

export function listUsers(): UserSummary[] {
  return USERS;
}

export function listServices(): string[] {
  return [...SERVICES];
}
