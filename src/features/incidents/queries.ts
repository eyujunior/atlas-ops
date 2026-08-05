import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Incident, IncidentListResponse, IncidentNote, IncidentStatus } from "@/lib/types";
import {
  addIncidentNote,
  createIncident,
  fetchIncident,
  fetchIncidents,
  updateIncidentAssignee,
  updateIncidentStatus,
  type CreateIncidentPayload,
  type UpdateStatusResult,
} from "./api";
import type { IncidentListParams } from "./types";

export function useIncidentsQuery(params: IncidentListParams) {
  return useQuery<IncidentListResponse, ApiClientError>({
    queryKey: queryKeys.incidents.list(params),
    queryFn: ({ signal }) => fetchIncidents(params, signal),
    // Keep showing the previous page's data while the next page loads,
    // instead of flashing a loading state on every param change.
    placeholderData: keepPreviousData,
  });
}

export function useIncidentQuery(id: string) {
  return useQuery<Incident, ApiClientError>({
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
  return useMutation<Incident, ApiClientError, CreateIncidentPayload>({
    mutationFn: (payload: CreateIncidentPayload) => createIncident(payload),
    onSuccess: () => {
      invalidateIncidentLists(queryClient);
    },
  });
}

export function useUpdateStatusMutation(id: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.incidents.detail(id);

  return useMutation<
    UpdateStatusResult,
    ApiClientError,
    { status: IncidentStatus; version?: number },
    { previous?: Incident }
  >({
    mutationFn: ({ status, version }) => updateIncidentStatus(id, status, version),
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

  return useMutation<
    Incident,
    ApiClientError,
    { assigneeId: string | null; assigneeSnapshot?: Incident["assignee"] },
    { previous?: Incident }
  >({
    mutationFn: ({ assigneeId }) => updateIncidentAssignee(id, assigneeId),
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

  return useMutation<
    IncidentNote,
    ApiClientError,
    { message: string; optimisticId: string },
    { previous?: Incident }
  >({
    mutationFn: ({ message }) => addIncidentNote(id, message),
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
