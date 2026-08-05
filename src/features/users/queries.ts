import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchServices, fetchUsers } from "./api";

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: 5 * 60_000,
  });
}

export function useServicesQuery() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: ({ signal }) => fetchServices(signal),
    staleTime: 5 * 60_000,
  });
}
