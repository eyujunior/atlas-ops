import { CheckCircle2, Eye, Search, Siren } from "lucide-react";
import type { IncidentStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; icon: typeof Siren; className: string }
> = {
  triggered: {
    label: "Triggered",
    icon: Siren,
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  acknowledged: {
    label: "Acknowledged",
    icon: Eye,
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  investigating: {
    label: "Investigating",
    icon: Search,
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 ring-green-600/20",
  },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {config.label}
    </span>
  );
}
