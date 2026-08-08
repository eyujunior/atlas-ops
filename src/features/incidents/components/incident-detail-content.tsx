"use client";

import type { Incident } from "@/lib/types";
import { STATUS_TRANSITIONS } from "@/lib/types";
import { useIncidentQuery, useUpdateStatusMutation } from "../queries";
import { useToast } from "@/components/ui/toast";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { capitalize, formatDateTime, formatRelativeTime } from "../utils";
import { ErrorState, ListSkeleton } from "./list-states";
import { AssigneeControl } from "./incident-assignee-control";
import { IncidentNotes } from "./incident-notes";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

function StatusTransitions({ incident }: { incident: Incident }) {
  const mutation = useUpdateStatusMutation(incident.id);
  const { showToast } = useToast();
  const nextStatuses = STATUS_TRANSITIONS[incident.status] ?? [];

  if (nextStatuses.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-neutral-500">Change status:</span>
      {nextStatuses.map((next) => (
        <button
          key={next}
          type="button"
          disabled={mutation.isPending}
          onClick={() => {
            mutation.mutate(
              { status: next, version: incident.version },
              {
                onError: (error) => {
                  showToast({
                    variant: "error",
                    title: "Couldn't update status",
                    description: error.userMessage,
                  });
                },
                onSuccess: () => {
                  showToast({ variant: "success", title: `Status changed to ${capitalize(next)}` });
                },
              },
            );
          }}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {mutation.isPending && mutation.variables?.status === next ? "Updating…" : `Mark ${capitalize(next)}`}
        </button>
      ))}
    </div>
  );
}

export function IncidentDetailContent({
  id,
  headingLevel = "h2",
}: {
  id: string;
  /** "h1" on the standalone full page (needs exactly one page heading);
   * "h2" inside the modal (not a standalone document). A plain string,
   * not a render-prop function — those can't cross from a Server
   * Component page into this Client Component. */
  headingLevel?: "h1" | "h2";
}) {
  const query = useIncidentQuery(id);
  const Heading = headingLevel;

  if (query.isPending) {
    return (
      <div className="p-6">
        <ListSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this incident"
        message={query.error.userMessage}
        onRetry={() => query.refetch()}
      />
    );
  }

  const incident = query.data;

  return (
    <div className="p-6">
      <p className="font-mono text-xs text-neutral-500">{incident.id}</p>
      <Heading className="mt-0.5 text-lg font-semibold text-neutral-900">{incident.title}</Heading>

      <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{incident.description}</p>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Status">
          <StatusBadge status={incident.status} />
        </Field>
        <Field label="Severity">
          <SeverityBadge severity={incident.severity} />
        </Field>
        <Field label="Service">{incident.service}</Field>
        <Field label="Created">
          <span title={formatDateTime(incident.createdAt)}>{formatRelativeTime(incident.createdAt)}</span>
        </Field>
        <Field label="Last updated">
          <span title={formatDateTime(incident.updatedAt)}>{formatRelativeTime(incident.updatedAt)}</span>
        </Field>
      </dl>

      <div className="mt-5 flex flex-wrap items-end gap-6 border-t border-neutral-100 pt-4">
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-500">Assignee</p>
          <AssigneeControl incident={incident} />
        </div>
        <StatusTransitions incident={incident} />
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <h3 className="text-xs font-medium text-neutral-500">Notes</h3>
        <div className="mt-2">
          <IncidentNotes incidentId={incident.id} notes={incident.notes} />
        </div>
      </div>
    </div>
  );
}
