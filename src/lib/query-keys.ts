import type { IncidentListParams } from "@/features/incidents/types";

export const queryKeys = {
  incidents: {
    all: ["incidents"] as const,
    list: (params: IncidentListParams) => ["incidents", "list", params] as const,
    detail: (id: string) => ["incidents", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
  },
  services: {
    all: ["services"] as const,
  },
};
