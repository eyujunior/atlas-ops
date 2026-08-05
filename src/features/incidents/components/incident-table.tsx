import Link from "next/link";
import type { Incident } from "@/lib/types";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { formatDateTime, formatRelativeTime } from "../utils";

/**
 * A single Link, absolutely positioned to cover the entire row/card
 * ("stretched link" pattern) — one Tab stop per incident with a
 * descriptive accessible name, rather than one stop per cell.
 */
function RowLink({ incident }: { incident: Incident }) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      aria-label={`Open incident ${incident.id}: ${incident.title}`}
      // No base `outline-none` here: Tailwind's outline-none also resets
      // the --tw-outline-style variable that outline-2 reads via var(),
      // so it silently zeroes the focus-visible outline too. outline's
      // initial value is already none, so omitting it is enough.
      className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
    />
  );
}

function AssigneeCell({ incident }: { incident: Incident }) {
  return incident.assignee ? (
    <span>{incident.assignee.name}</span>
  ) : (
    <span className="text-neutral-400">Unassigned</span>
  );
}

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  return (
    <>
      {/* Desktop: real table markup (valid thead/tbody/th/td structure). */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
            <th scope="col" className="px-3 py-2 font-medium">ID</th>
            <th scope="col" className="px-3 py-2 font-medium">Title</th>
            <th scope="col" className="px-3 py-2 font-medium">Status</th>
            <th scope="col" className="px-3 py-2 font-medium">Severity</th>
            <th scope="col" className="px-3 py-2 font-medium">Service</th>
            <th scope="col" className="px-3 py-2 font-medium">Assignee</th>
            <th scope="col" className="px-3 py-2 font-medium">Last updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {incidents.map((incident) => (
            <tr key={incident.id} className="relative hover:bg-neutral-50">
              <td className="px-3 py-3 font-mono text-xs text-neutral-500">
                <RowLink incident={incident} />
                {incident.id}
              </td>
              <td className="max-w-xs truncate px-3 py-3 font-medium text-neutral-900">
                {incident.title}
              </td>
              <td className="px-3 py-3">
                <StatusBadge status={incident.status} />
              </td>
              <td className="px-3 py-3">
                <SeverityBadge severity={incident.severity} />
              </td>
              <td className="px-3 py-3 text-neutral-600">{incident.service}</td>
              <td className="px-3 py-3 text-neutral-600">
                <AssigneeCell incident={incident} />
              </td>
              <td className="px-3 py-3 text-neutral-500" title={formatDateTime(incident.updatedAt)}>
                {formatRelativeTime(incident.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile / narrow: card list. */}
      <ul className="divide-y divide-neutral-100 md:hidden">
        {incidents.map((incident) => (
          <li key={incident.id} className="relative p-3">
            <RowLink incident={incident} />
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs text-neutral-500">{incident.id}</span>
              <span
                className="text-xs text-neutral-500"
                title={formatDateTime(incident.updatedAt)}
              >
                {formatRelativeTime(incident.updatedAt)}
              </span>
            </div>
            <p className="mt-1 font-medium text-neutral-900">{incident.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={incident.status} />
              <SeverityBadge severity={incident.severity} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>{incident.service}</span>
              <AssigneeCell incident={incident} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
