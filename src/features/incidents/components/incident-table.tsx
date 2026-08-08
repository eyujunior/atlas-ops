"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Incident } from "@/lib/types";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { formatDateTime, formatRelativeTime } from "../utils";

/**
 * A single Link, absolutely positioned to cover the entire row/card
 * ("stretched link" pattern) — one Tab stop per incident with a
 * descriptive accessible name, rather than one stop per cell.
 *
 * `search` carries the list's current query string (search/filter/sort/
 * page) onto the detail URL. The intercepted modal route still changes
 * the actual browser URL to /incidents/[id] — there's only one canonical
 * URL for the whole page in the App Router, not a separate one per
 * rendered slot — so without this, the still-mounted list's own
 * useSearchParams() would read that new, filter-less URL and silently
 * reset to its defaults while the modal was open.
 */
function RowLink({ incident, search }: { incident: Incident; search: string }) {
  const href = search ? `/incidents/${incident.id}?${search}` : `/incidents/${incident.id}`;
  return (
    <Link
      href={href}
      data-row-link-id={incident.id}
      aria-label={`Open incident ${incident.id}: ${incident.title}`}
      // No base `outline-none` here: Tailwind's outline-none also resets
      // the --tw-outline-style variable that outline-2 reads via var(),
      // so it silently zeroes the focus-visible outline too. outline's
      // initial value is already none, so omitting it is enough.
      className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
    />
  );
}

/**
 * Focuses the row link for a given incident when the detail modal closes.
 * Radix's own auto-focus-return normally handles this by remembering
 * whatever was focused before the dialog opened, but that capture is
 * unreliable here: the modal opens via a route navigation (an intercepted
 * route), not a literal Dialog.Trigger click, so by the time the dialog's
 * focus scope activates, focus has often already fallen back to <body>
 * across that async transition. Since we already know exactly which
 * incident we're returning to (it's in the URL), we can just look its row
 * up deterministically instead of depending on that capture.
 *
 * The same data-row-link-id appears twice in the DOM (desktop table row +
 * mobile card — one is always display:none depending on viewport), so
 * this picks whichever copy is actually rendered.
 */
export function focusIncidentRowLink(id: string) {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-row-link-id="${id}"]`);
  for (const el of candidates) {
    if (el.offsetParent !== null) {
      el.focus();
      return;
    }
  }
  // The incident may no longer be on this page (e.g. a status change
  // moved or filtered it out) — don't leave focus stranded on <body>.
  document.getElementById("incident-search")?.focus();
}

function AssigneeCell({ incident }: { incident: Incident }) {
  return incident.assignee ? (
    <span>{incident.assignee.name}</span>
  ) : (
    <span className="text-neutral-400">Unassigned</span>
  );
}

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  const search = useSearchParams().toString();

  return (
    <>
      {/* Desktop: real table markup (valid thead/tbody/th/td structure). */}
      {/* Table appears at lg, not md: with seven columns it needs ~900px,
          so switching at md (768px) pushed the page into horizontal
          overflow on tablet widths. Cards carry 768px instead. */}
      <table className="hidden w-full text-left text-sm lg:table">
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
                <RowLink incident={incident} search={search} />
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
      <ul className="divide-y divide-neutral-100 lg:hidden">
        {incidents.map((incident) => (
          <li key={incident.id} className="relative p-3">
            <RowLink incident={incident} search={search} />
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
