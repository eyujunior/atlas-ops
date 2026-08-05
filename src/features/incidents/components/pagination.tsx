"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  isFetching,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isFetching: boolean;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-neutral-200 px-1 py-3">
      <p className="text-sm text-neutral-500" aria-live="polite">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
        {isFetching && <span className="ml-2 text-neutral-400">Updating…</span>}
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Previous
        </button>
        <span className="px-2 text-sm text-neutral-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          Next
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
