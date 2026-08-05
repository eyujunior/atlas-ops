import { apiRequest } from "@/lib/api-client";
import type { UserSummary } from "@/lib/types";

export function fetchUsers(signal?: AbortSignal): Promise<{ items: UserSummary[] }> {
  return apiRequest("/users", { signal });
}

export function fetchServices(signal?: AbortSignal): Promise<{ items: string[] }> {
  return apiRequest("/services", { signal });
}
