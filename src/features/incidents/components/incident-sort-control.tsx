"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortField, SortOrder } from "../types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "updatedAt", label: "Last updated" },
  { value: "createdAt", label: "Created date" },
  { value: "severity", label: "Severity" },
];

export function IncidentSortControl({
  sort,
  order,
  onChange,
}: {
  sort: SortField;
  order: SortOrder;
  onChange: (sort: SortField, order: SortOrder) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-field" className="text-xs font-medium text-neutral-500">
        Sort by
      </label>
      <select
        id="sort-field"
        value={sort}
        onChange={(e) => onChange(e.target.value as SortField, order)}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange(sort, order === "asc" ? "desc" : "asc")}
        aria-label={order === "asc" ? "Sort ascending, click for descending" : "Sort descending, click for ascending"}
        className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        {order === "asc" ? (
          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {order === "asc" ? "Ascending" : "Descending"}
      </button>
    </div>
  );
}
