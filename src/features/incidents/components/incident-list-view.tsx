"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useIncidentsQuery } from "../queries";
import { useIncidentListParams } from "../hooks/use-incident-list-params";
import { IncidentSearchInput } from "./incident-search-input";
import { IncidentFilters } from "./incident-filters";
import { IncidentSortControl } from "./incident-sort-control";
import { IncidentTable } from "./incident-table";
import { Pagination } from "./pagination";
import { EmptyDatasetState, ErrorState, ListSkeleton, NoResultsState } from "./list-states";

export function IncidentListView() {
  const { params, setParams, clearAllFilters, hasActiveFilters } = useIncidentListParams();
  const query = useIncidentsQuery(params);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Incidents</h1>
          <p className="text-sm text-neutral-500">
            Monitor, investigate, and manage service incidents.
          </p>
        </div>
        <Link
          href="/incidents/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New Incident
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <IncidentSearchInput value={params.q} onChange={(q) => setParams({ q })} />
          <IncidentSortControl
            sort={params.sort}
            order={params.order}
            onChange={(sort, order) => setParams({ sort, order })}
          />
        </div>
        <IncidentFilters
          status={params.status}
          severity={params.severity}
          service={params.service}
          onStatusChange={(status) => setParams({ status })}
          onSeverityChange={(severity) => setParams({ severity })}
          onServiceChange={(service) => setParams({ service })}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearAllFilters}
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        {query.isPending && <ListSkeleton />}

        {query.isError && (
          <ErrorState message={query.error.userMessage} onRetry={() => query.refetch()} />
        )}

        {query.isSuccess && query.data.total === 0 && !hasActiveFilters && (
          <EmptyDatasetState />
        )}

        {query.isSuccess && query.data.total === 0 && hasActiveFilters && (
          <NoResultsState onClearFilters={clearAllFilters} />
        )}

        {query.isSuccess && query.data.total > 0 && (
          <>
            <IncidentTable incidents={query.data.items} />
            <div className="px-3">
              <Pagination
                page={query.data.page}
                totalPages={query.data.totalPages}
                total={query.data.total}
                pageSize={query.data.pageSize}
                onPageChange={(page) => setParams({ page })}
                isFetching={query.isFetching && !query.isPending}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
