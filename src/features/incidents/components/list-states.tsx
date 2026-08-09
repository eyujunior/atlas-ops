import { AlertTriangle, Inbox, SearchX } from "lucide-react";

export function ListSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-neutral-200" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-4">
          <div className="h-3 w-16 rounded bg-neutral-200" />
          <div className="h-3 flex-1 rounded bg-neutral-200" />
          <div className="h-5 w-20 rounded-full bg-neutral-200" />
          <div className="h-5 w-16 rounded-full bg-neutral-200" />
          <div className="h-3 w-24 rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * Route-level fallback for /incidents, shown until IncidentListView mounts
 * (it suspends on useSearchParams). Mirrors that component's layout, so the
 * real view lands in the boxes the skeleton already drew instead of the page
 * reflowing out of a single line of text.
 *
 * Two sibling animate-pulse wrappers rather than one around everything:
 * ListSkeleton brings its own, and nesting them would multiply the opacity
 * animations so the rows pulsed deeper than the chrome above them.
 */
export function IncidentListPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <span role="status" className="sr-only">
        Loading incidents
      </span>

      <div aria-hidden="true" className="flex animate-pulse flex-col gap-4">
        {/* Page heading and the New Incident button. */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-28 rounded bg-neutral-200" />
            <div className="h-3.5 w-72 max-w-full rounded bg-neutral-100" />
          </div>
          <div className="h-9 w-33 shrink-0 rounded-md bg-neutral-200" />
        </div>

        {/* Toolbar card: search and sort, then the filter row. */}
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="h-9 flex-1 rounded-md bg-neutral-100" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-38 rounded-md bg-neutral-100" />
              <div className="h-9 w-9 rounded-md bg-neutral-100" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="h-9 w-37 rounded-md bg-neutral-100" />
            <div className="h-9 w-37 rounded-md bg-neutral-100" />
            <div className="h-9 w-42 rounded-md bg-neutral-100" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <ListSkeleton />
      </div>
    </div>
  );
}

export function EmptyDatasetState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <Inbox aria-hidden="true" className="h-8 w-8 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-700">No incidents yet</p>
      <p className="max-w-sm text-sm text-neutral-500">
        When an incident is created, it will show up here.
      </p>
    </div>
  );
}

export function NoResultsState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <SearchX aria-hidden="true" className="h-8 w-8 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-700">No incidents match your search</p>
      <p className="max-w-sm text-sm text-neutral-500">
        Try a different search term or adjust your filters.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-2 rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        Clear search and filters
      </button>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  title = "Couldn't load incidents",
}: {
  message: string;
  onRetry: () => void;
  /** Defaults to the list wording; the detail view overrides it so a
   * single incident's failure doesn't read as a list failure. */
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 px-6 py-16 text-center"
    >
      <AlertTriangle aria-hidden="true" className="h-8 w-8 text-red-400" />
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      <p className="max-w-sm text-sm text-neutral-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        Retry
      </button>
    </div>
  );
}
