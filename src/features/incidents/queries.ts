import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Incident, IncidentNote, IncidentStatus } from "@/lib/types";
import {
  addIncidentNote,
  createIncident,
  fetchIncident,
  fetchIncidents,
  updateIncidentAssignee,
  updateIncidentStatus,
  type CreateIncidentPayload,
} from "./api";
import type { IncidentListParams } from "./types";

export function useIncidentsQuery(params: IncidentListParams) {
  return useQuery({
    queryKey: queryKeys.incidents.list(params),
    queryFn: ({ signal }) => fetchIncidents(params, signal),
    // Keep showing the previous page's data while the next page loads,
    // instead of flashing a loading state on every param change.
    placeholderData: keepPreviousData,
  });
}

export function useIncidentQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.incidents.detail(id),
    queryFn: ({ signal }) => fetchIncident(id, signal),
    enabled: Boolean(id),
  });
}

function invalidateIncidentLists(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "incidents" && query.queryKey[1] === "list",
  });
}

export function useCreateIncidentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => createIncident(payload),
    onSuccess: () => {
      invalidateIncidentLists(queryClient);
    },
  });
}

export function useUpdateStatusMutation(id: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.incidents.detail(id);

  return useMutation({
    mutationFn: ({ status, version }: { status: IncidentStatus; version?: number }) =>
      updateIncidentStatus(id, status, version),
    onMutate: async ({ status }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Incident>(detailKey);
      if (previous) {
        queryClient.setQueryData<Incident>(detailKey, {
          ...previous,
          status,
          updatedAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
      invalidateIncidentLists(queryClient);
    },
  });
}

export function useUpdateAssigneeMutation(id: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.incidents.detail(id);

  return useMutation({
    mutationFn: ({ assigneeId }: { assigneeId: string | null; assigneeSnapshot?: Incident["assignee"] }) =>
      updateIncidentAssignee(id, assigneeId),
    onMutate: async ({ assigneeSnapshot }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Incident>(detailKey);
      if (previous) {
        queryClient.setQueryData<Incident>(detailKey, {
          ...previous,
          assignee: assigneeSnapshot ?? null,
          updatedAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
      invalidateIncidentLists(queryClient);
    },
  });
}

export function useAddNoteMutation(id: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.incidents.detail(id);

  return useMutation({
    mutationFn: ({ message }: { message: string; optimisticId: string }) =>
      addIncidentNote(id, message),
    onMutate: async ({ message, optimisticId }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Incident>(detailKey);
      if (previous) {
        const optimisticNote: IncidentNote = {
          id: optimisticId,
          incidentId: id,
          author: { id: "usr-current", name: "You", email: "" },
          message,
          createdAt: new Date().toISOString(),
          pending: true,
        };
        queryClient.setQueryData<Incident>(detailKey, {
          ...previous,
          notes: [...previous.notes, optimisticNote],
        });
      }
      return { previous };
    },
    onSuccess: (createdNote, { optimisticId }) => {
      const current = queryClient.getQueryData<Incident>(detailKey);
      if (current) {
        queryClient.setQueryData<Incident>(detailKey, {
          ...current,
          notes: current.notes.map((n) => (n.id === optimisticId ? createdNote : n)),
        });
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}
