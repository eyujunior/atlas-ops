"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortField, SortOrder } from "../types";
import { FIELD_CLASS } from "./field-styles";

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
    <div className="flex items-center gap-1.5">
      <label htmlFor="sort-field" className="sr-only">
        Sort by
      </label>
      <select
        id="sort-field"
        value={sort}
        onChange={(e) => onChange(e.target.value as SortField, order)}
        className={`${FIELD_CLASS} pl-2.5 pr-1`}
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
        title={order === "asc" ? "Ascending" : "Descending"}
        className={`${FIELD_CLASS} flex w-9 items-center justify-center text-neutral-600 hover:bg-neutral-50`}
      >
        {order === "asc" ? (
          <ArrowUp aria-hidden="true" className="h-4 w-4" />
        ) : (
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
