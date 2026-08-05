import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  UserSummary,
} from "@/lib/types";

/**
 * Deterministic PRNG (mulberry32) so the generated dataset — and therefore
 * every test that runs against it — is identical on every run, in every
 * environment, without shipping a giant JSON fixture.
 */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(1042);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export const SERVICES = [
  "payments-api",
  "checkout-web",
  "identity-service",
  "notification-worker",
  "reporting-api",
  "search-index",
  "billing-service",
  "mobile-gateway",
] as const;

export const USERS: UserSummary[] = [
  "Maya Chen",
  "Omar Hassan",
  "Daniel Brooks",
  "Priya Patel",
  "Lucas Ferreira",
  "Ingrid Sorensen",
  "Haruto Sato",
  "Aisha Bello",
  "Noah Kim",
  "Fatima Al-Sayed",
  "Elena Petrova",
  "Marcus Webb",
  "Yuki Tanaka",
  "Sofia Rossi",
  "Tendai Moyo",
  "Grace O'Connell",
].map((name, i) => ({
  id: `usr-${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@atlasops.example`,
}));

const CURRENT_USER: UserSummary = {
  id: "usr-current",
  name: "Current User",
  email: "current.user@atlasops.example",
};

const ISSUE_TEMPLATES: Record<string, string[]> = {
  "payments-api": [
    "Elevated payment failure rate",
    "Card authorization timeouts",
    "Duplicate charge reports increasing",
    "Refund processing delayed",
  ],
  "checkout-web": [
    "Checkout latency increased",
    "Cart totals miscalculating for bundled items",
    "Checkout page 5xx spike",
    "Promo code validation failing",
  ],
  "identity-service": [
    "Login failures for SSO users",
    "Session tokens expiring early",
    "Password reset emails delayed",
    "MFA challenge not delivered",
  ],
  "notification-worker": [
    "Push notification delivery backlog",
    "Duplicate email notifications sent",
    "Webhook delivery failures rising",
    "SMS queue processing stalled",
  ],
  "reporting-api": [
    "Nightly report generation failing",
    "Dashboard queries timing out",
    "Export endpoint returning stale data",
    "Aggregation job memory spike",
  ],
  "search-index": [
    "Search index lag exceeding SLA",
    "Autocomplete returning empty results",
    "Reindex job stuck at partial completion",
    "Relevance ranking regression",
  ],
  "billing-service": [
    "Invoice generation errors",
    "Subscription renewal failures",
    "Tax calculation mismatch",
    "Usage metering undercounting",
  ],
  "mobile-gateway": [
    "API gateway elevated 502s for mobile clients",
    "Push token registration failing",
    "Rate limiting misfiring for iOS clients",
    "App version negotiation errors",
  ],
};

const DESCRIPTION_SUFFIXES = [
  "Impact appears limited to a subset of regions so far, but the trend is worsening over the last hour.",
  "Initial reports came in from customer support; monitoring confirms an anomaly above baseline.",
  "Correlates with a deploy that went out earlier today. Rollback is being evaluated.",
  "No clear root cause yet. On-call is actively investigating logs and recent config changes.",
  "Downstream dependency is showing degraded latency, which may be the underlying cause.",
];

function statusForSeverityAndAge(
  severity: IncidentSeverity,
  ageHours: number,
): IncidentStatus {
  // Older incidents skew resolved; critical/high skew toward active investigation.
  if (ageHours > 24 * 14) {
    return pickWeighted<IncidentStatus>({
      triggered: 1,
      acknowledged: 2,
      investigating: 3,
      resolved: 30,
    });
  }
  if (severity === "critical" || severity === "high") {
    return pickWeighted<IncidentStatus>({
      triggered: 4,
      acknowledged: 4,
      investigating: 5,
      resolved: 7,
    });
  }
  return pickWeighted<IncidentStatus>({
    triggered: 2,
    acknowledged: 3,
    investigating: 3,
    resolved: 6,
  });
}

export function generateIncidents(count: number): Incident[] {
  const incidents: Incident[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const service = pick(SERVICES);
    const severity = pickWeighted<IncidentSeverity>({
      critical: 1,
      high: 3,
      medium: 5,
      low: 4,
    });
    const ageHours = Math.floor(rand() * 24 * 60); // up to ~60 days old
    const createdAt = new Date(now - ageHours * 60 * 60 * 1000);
    const status = statusForSeverityAndAge(severity, ageHours);
    const updatedOffsetHours = rand() * Math.min(ageHours, 48);
    const updatedAt = new Date(
      createdAt.getTime() + updatedOffsetHours * 60 * 60 * 1000,
    );

    const title = pick(ISSUE_TEMPLATES[service]);
    const assignee =
      status === "triggered" && rand() < 0.4 ? null : pick(USERS);

    const noteCount =
      status === "triggered" ? 0 : Math.floor(rand() * 4);
    const notes = Array.from({ length: noteCount }, (_, n) => {
      const noteAt = new Date(
        createdAt.getTime() +
          ((n + 1) / (noteCount + 1)) *
            (updatedAt.getTime() - createdAt.getTime()),
      );
      return {
        id: `note-${i + 1}-${n + 1}`,
        incidentId: `INC-${1000 + i}`,
        author: pick(USERS),
        message: pick(DESCRIPTION_SUFFIXES),
        createdAt: noteAt.toISOString(),
      };
    });

    incidents.push({
      id: `INC-${1000 + i}`,
      title,
      description: `${title}. ${pick(DESCRIPTION_SUFFIXES)}`,
      status,
      severity,
      service,
      assignee,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      notes,
      version: 1 + notes.length,
    });
  }

  return incidents;
}

export function getCurrentUser(): UserSummary {
  return CURRENT_USER;
}
