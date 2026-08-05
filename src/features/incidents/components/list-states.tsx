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
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 px-6 py-16 text-center"
    >
      <AlertTriangle aria-hidden="true" className="h-8 w-8 text-red-400" />
      <p className="text-sm font-medium text-neutral-700">Couldn&apos;t load incidents</p>
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
