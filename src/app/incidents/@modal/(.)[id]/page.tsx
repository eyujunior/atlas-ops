import { IncidentDetailModal } from "@/features/incidents/components/incident-detail-modal";

export default async function InterceptedIncidentModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IncidentDetailModal id={id} />;
}
