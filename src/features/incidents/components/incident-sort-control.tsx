"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortField, SortOrder } from "../types";
import { FIELD_CLASS } from "./field-styles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <Select value={sort} onValueChange={(value) => onChange(value as SortField, order)}>
        <SelectTrigger id="sort-field" className="w-38">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
