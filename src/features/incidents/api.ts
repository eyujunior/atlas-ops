import { apiRequest } from "@/lib/api-client";
import type { Incident, IncidentListResponse, IncidentNote, IncidentStatus } from "@/lib/types";
import type { IncidentListParams } from "./types";

export function fetchIncidents(
  params: IncidentListParams,
  signal?: AbortSignal,
): Promise<IncidentListResponse> {
  return apiRequest<IncidentListResponse>("/incidents", {
    signal,
    query: {
      q: params.q || undefined,
      status: params.status.join(",") || undefined,
      severity: params.severity.join(",") || undefined,
      service: params.service || undefined,
      sort: params.sort,
      order: params.order,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export function fetchIncident(id: string, signal?: AbortSignal): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}`, { signal });
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  status: IncidentStatus;
  severity: Incident["severity"];
  service: string;
  assigneeId?: string | null;
}

export function createIncident(payload: CreateIncidentPayload): Promise<Incident> {
  return apiRequest<Incident>("/incidents", { method: "POST", body: payload });
}

export interface UpdateStatusResult {
  id: string;
  status: IncidentStatus;
  updatedAt: string;
  version: number;
}

export function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  version?: number,
): Promise<UpdateStatusResult> {
  return apiRequest<UpdateStatusResult>(`/incidents/${id}/status`, {
    method: "PATCH",
    body: { status, version },
  });
}

export function updateIncidentAssignee(
  id: string,
  assigneeId: string | null,
): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/assignee`, {
    method: "PATCH",
    body: { assigneeId },
  });
}

export function addIncidentNote(id: string, message: string): Promise<IncidentNote> {
  return apiRequest<IncidentNote>(`/incidents/${id}/notes`, {
    method: "POST",
    body: { message },
  });
}
