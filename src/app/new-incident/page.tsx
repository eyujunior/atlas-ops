import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateIncidentForm } from "@/features/incidents/components/create-incident-form";

export default function NewIncidentPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to incidents
      </Link>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">New incident</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Record a new incident so it can be triaged and assigned.
        </p>

        <div className="mt-5">
          <CreateIncidentForm />
        </div>
      </div>
    </div>
  );
}
