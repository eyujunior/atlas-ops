import { AlertCircle, AlertOctagon, AlertTriangle, Info } from "lucide-react";
import type { IncidentSeverity } from "@/lib/types";

// Color is never the only signal: every badge pairs an icon shape with a
// text label, so severity reads correctly for colorblind users and in
// screen readers alike.
const SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; icon: typeof AlertOctagon; className: string }
> = {
  critical: {
    label: "Critical",
    icon: AlertOctagon,
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    className: "bg-orange-50 text-orange-700 ring-orange-600/20",
  },
  medium: {
    label: "Medium",
    icon: AlertCircle,
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  low: {
    label: "Low",
    icon: Info,
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = SEVERITY_CONFIG[severity];
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
