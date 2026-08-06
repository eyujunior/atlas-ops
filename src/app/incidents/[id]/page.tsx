import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IncidentDetailContent } from "@/features/incidents/components/incident-detail-content";

/**
 * The dedicated full-page detail view — what renders on a direct link or
 * a page refresh, when there's no list underneath to show a modal over.
 * (Navigating here by clicking a list row instead hits the intercepted
 * route at @modal/(.)[id], which renders the same IncidentDetailContent
 * inside a Dialog.)
 */
export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to incidents
      </Link>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white shadow-sm">
        <IncidentDetailContent id={id} headingLevel="h1" />
      </div>
    </div>
  );
}
