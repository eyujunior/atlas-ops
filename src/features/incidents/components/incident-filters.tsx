"use client";

import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, type IncidentSeverity, type IncidentStatus } from "@/lib/types";
import { useServicesQuery } from "@/features/users/queries";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function TogglePill({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span className="inline-flex items-center rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/50 peer-focus-visible:ring-offset-1 hover:border-neutral-400">
        {label}
      </span>
    </label>
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

  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
      <fieldset className="flex flex-wrap items-center gap-1.5">
        <legend className="mb-1 w-full text-xs font-medium text-neutral-500">Status</legend>
        {INCIDENT_STATUSES.map((s) => (
          <TogglePill
            key={s}
            label={s}
            checked={status.includes(s)}
            onChange={() => onStatusChange(toggle(status, s))}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap items-center gap-1.5">
        <legend className="mb-1 w-full text-xs font-medium text-neutral-500">Severity</legend>
        {INCIDENT_SEVERITIES.map((s) => (
          <TogglePill
            key={s}
            label={s}
            checked={severity.includes(s)}
            onChange={() => onSeverityChange(toggle(severity, s))}
          />
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="service-filter" className="text-xs font-medium text-neutral-500">
          Service
        </label>
        <select
          id="service-filter"
          value={service}
          onChange={(e) => onServiceChange(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All services</option>
          {servicesQuery.data?.items.map((svc) => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="self-end rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
