"use client";

import { X } from "lucide-react";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, type IncidentSeverity, type IncidentStatus } from "@/lib/types";
import { useServicesQuery } from "@/features/users/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Radix Select reserves the empty string as an internal "no selection"
// sentinel — an Item can't use value="". "All services" needs a real,
// stable value distinct from any actual service name to round-trip
// through that.
const ALL_SERVICES_VALUE = "__all__";

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-2.5 pr-1 text-xs font-medium capitalize text-blue-700 ring-1 ring-inset ring-blue-600/20">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full p-0.5 hover:bg-blue-100 focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <X aria-hidden="true" className="h-3 w-3" />
      </button>
    </span>
  );
}

function FilterDropdown<T extends string>({
  id,
  label,
  placeholder,
  options,
  selected,
  onAdd,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: readonly T[];
  selected: T[];
  onAdd: (value: T) => void;
}) {
  const available = options.filter((option) => !selected.includes(option));

  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {/* value="" always: this is an "add one" control, not a persistent
          selection — after adding, it resets to the placeholder rather
          than showing the just-picked value (that value now lives as a
          tag below). */}
      <Select
        value=""
        onValueChange={(value) => onAdd(value as T)}
        disabled={available.length === 0}
      >
        <SelectTrigger id={id} className="w-37">
          <SelectValue placeholder={available.length === 0 ? "All added" : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {available.map((option) => (
            <SelectItem key={option} value={option} className="capitalize">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function IncidentFilters({
  status,
  severity,
  service,
  onStatusChange,
  onSeverityChange,
  onServiceChange,
  hasActiveFilters,
  onClearAll,
}: {
  status: IncidentStatus[];
  severity: IncidentSeverity[];
  service: string;
  onStatusChange: (status: IncidentStatus[]) => void;
  onSeverityChange: (severity: IncidentSeverity[]) => void;
  onServiceChange: (service: string) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}) {
  const servicesQuery = useServicesQuery();
  const hasTags = status.length > 0 || severity.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterDropdown
          id="status-filter"
          label="Status"
          placeholder="Add status…"
          options={INCIDENT_STATUSES}
          selected={status}
          onAdd={(value) => onStatusChange([...status, value])}
        />

        <FilterDropdown
          id="severity-filter"
          label="Severity"
          placeholder="Add severity…"
          options={INCIDENT_SEVERITIES}
          selected={severity}
          onAdd={(value) => onSeverityChange([...severity, value])}
        />

        <label htmlFor="service-filter" className="sr-only">
          Service
        </label>
        <Select
          value={service || ALL_SERVICES_VALUE}
          onValueChange={(value) => onServiceChange(value === ALL_SERVICES_VALUE ? "" : value)}
        >
          <SelectTrigger id="service-filter" className="w-42">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SERVICES_VALUE}>All services</SelectItem>
            {servicesQuery.data?.items.map((svc) => (
              <SelectItem key={svc} value={svc}>
                {svc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex h-9 items-center rounded-md px-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            Clear all
          </button>
        )}
      </div>

      {hasTags && (
        <div
          className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-2"
          aria-label="Active filters"
        >
          {status.map((s) => (
            <FilterTag
              key={`status-${s}`}
              label={`Status: ${s}`}
              onRemove={() => onStatusChange(status.filter((x) => x !== s))}
            />
          ))}
          {severity.map((s) => (
            <FilterTag
              key={`severity-${s}`}
              label={`Severity: ${s}`}
              onRemove={() => onSeverityChange(severity.filter((x) => x !== s))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
