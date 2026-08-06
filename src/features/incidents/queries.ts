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

/**
 * Writes a confirmed field patch directly into every cached list page/
 * filter combination that currently contains this incident, rather than
 * just invalidating and waiting for a background refetch. invalidate +
 * refetch alone leaves a real gap — the refetch has to complete a full
 * network round trip (200–1200ms simulated latency here) before the list
 * reflects the change, so closing the detail view right after a mutation
 * shows stale data for up to ~1-2s. This makes the list consistent in
 * the same tick as the mutation's success, with invalidation kept as a
 * background safety net for anything this patch doesn't cover.
 */
function patchIncidentInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<Incident>,
) {
  queryClient.setQueriesData<IncidentListResponse>(
    {
      predicate: (query) => query.queryKey[0] === "incidents" && query.queryKey[1] === "list",
    },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      };
    },
  );
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
    onSuccess: (result) => {
      queryClient.setQueryData<Incident>(detailKey, (old) =>
        old ? { ...old, status: result.status, updatedAt: result.updatedAt, version: result.version } : old,
      );
      patchIncidentInLists(queryClient, id, { status: result.status, updatedAt: result.updatedAt });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: () => {
      // Background safety net (e.g. reconciling anything a concurrent
      // change touched) — the onSuccess patch above already makes the UI
      // correct immediately, so this isn't what the user waits on.
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
    onSuccess: (updatedIncident) => {
      queryClient.setQueryData<Incident>(detailKey, updatedIncident);
      patchIncidentInLists(queryClient, id, {
        assignee: updatedIncident.assignee,
        updatedAt: updatedIncident.updatedAt,
      });
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
