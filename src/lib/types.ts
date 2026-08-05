export type IncidentStatus =
  | "triggered"
  | "acknowledged"
  | "investigating"
  | "resolved";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  author: UserSummary;
  message: string;
  createdAt: string;
  /** True while an optimistic add-note mutation is still in flight. */
  pending?: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  service: string;
  assignee: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  notes: IncidentNote[];
  /** Optimistic-concurrency counter. Extension beyond the base contract. */
  version: number;
}

export interface IncidentListResponse {
  items: Incident[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  currentVersion?: number;
}

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "triggered",
  "acknowledged",
  "investigating",
  "resolved",
];

export const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

/** Allowed forward/back transitions per REQUIREMENTS.md 5.2. */
export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  triggered: ["acknowledged"],
  acknowledged: ["investigating"],
  investigating: ["resolved"],
  resolved: ["investigating"],
};
