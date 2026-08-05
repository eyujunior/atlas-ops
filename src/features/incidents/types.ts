import type { IncidentSeverity, IncidentStatus } from "@/lib/types";

export type SortField = "updatedAt" | "createdAt" | "severity";
export type SortOrder = "asc" | "desc";

export interface IncidentListParams {
  q: string;
  status: IncidentStatus[];
  severity: IncidentSeverity[];
  service: string;
  sort: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

export const DEFAULT_LIST_PARAMS: IncidentListParams = {
  q: "",
  status: [],
  severity: [],
  service: "",
  sort: "updatedAt",
  order: "desc",
  page: 1,
  pageSize: 25,
};
