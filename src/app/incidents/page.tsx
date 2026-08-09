import { Suspense } from "react";
import { IncidentListView } from "@/features/incidents/components/incident-list-view";
import { IncidentListPageSkeleton } from "@/features/incidents/components/list-states";

export default function IncidentsPage() {
  return (
    <Suspense fallback={<IncidentListPageSkeleton />}>
      <IncidentListView />
    </Suspense>
  );
}
