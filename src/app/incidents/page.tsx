"use client";

import { useIncidentsQuery } from "@/features/incidents/queries";
import { DEFAULT_LIST_PARAMS } from "@/features/incidents/types";

/**
 * Placeholder checkpoint: confirms the MSW mock API + TanStack Query
 * pipeline works end to end before the real list UI (search, filters,
 * sort, pagination, URL state) is built on top of it.
 */
export default function IncidentsPage() {
  const { data, isPending, isError, error } = useIncidentsQuery(DEFAULT_LIST_PARAMS);

  if (isPending) {
    return <p className="p-8 text-neutral-500">Loading incidents…</p>;
  }

  if (isError) {
    return (
      <p className="p-8 text-red-600">
        Failed to load incidents: {error.message}
      </p>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">AtlasOps — Incident List (checkpoint)</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {data.total} total incidents · page {data.page} of {data.totalPages}
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        {data.items.map((incident) => (
          <li key={incident.id}>
            <span className="font-mono text-neutral-500">{incident.id}</span>{" "}
            — {incident.title} ({incident.status}, {incident.severity})
          </li>
        ))}
      </ul>
    </div>
  );
}
