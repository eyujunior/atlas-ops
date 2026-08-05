import { Suspense } from "react";
import { IncidentListView } from "@/features/incidents/components/incident-list-view";

export default function IncidentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading incidents…</div>}>
      <IncidentListView />
    </Suspense>
  );
}
