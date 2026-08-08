"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/lib/types";
import { DEFAULT_LIST_PARAMS, type IncidentListParams, type SortField } from "../types";

const SORT_FIELDS: SortField[] = ["updatedAt", "createdAt", "severity"];
/** Search terms are constrained to a sane length — defense against a
 * pathological URL rather than a real attack surface, since this never
 * reaches a real backend, but it's cheap and it documents the intent. */
const MAX_QUERY_LENGTH = 200;

function parseCsvEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T[] {
  if (!value) return [];
  const allowedSet = new Set<string>(allowed);
  const seen = new Set<T>();
  for (const raw of value.split(",")) {
    const trimmed = raw.trim();
    if (allowedSet.has(trimmed)) seen.add(trimmed as T);
  }
  return Array.from(seen);
}

function parsePage(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/**
 * Parses and sanitizes list state from raw URL search params. Invalid or
 * unrecognized values (an unknown status, a garbage page number) are
 * silently dropped back to their default rather than trusted — the URL is
 * user-editable input, not a validated payload.
 */
export function parseListParams(searchParams: URLSearchParams): IncidentListParams {
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");

  return {
    q: (searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    status: parseCsvEnum<IncidentStatus>(searchParams.get("status"), INCIDENT_STATUSES),
    severity: parseCsvEnum<IncidentSeverity>(
      searchParams.get("severity"),
      INCIDENT_SEVERITIES,
    ),
    service: searchParams.get("service") ?? "",
    sort: (SORT_FIELDS as string[]).includes(sort ?? "")
      ? (sort as SortField)
      : DEFAULT_LIST_PARAMS.sort,
    order: order === "asc" ? "asc" : "desc",
    page: parsePage(searchParams.get("page")),
    pageSize: DEFAULT_LIST_PARAMS.pageSize,
  };
}

function serializeListParams(params: IncidentListParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status.length) sp.set("status", params.status.join(","));
  if (params.severity.length) sp.set("severity", params.severity.join(","));
  if (params.service) sp.set("service", params.service);
  if (params.sort !== DEFAULT_LIST_PARAMS.sort) sp.set("sort", params.sort);
  if (params.order !== DEFAULT_LIST_PARAMS.order) sp.set("order", params.order);
  if (params.page !== 1) sp.set("page", String(params.page));
  return sp.toString();
}

/**
 * Single source of truth for incident-list state, held entirely in the
 * URL. Any change to search/filters/sort resets pagination to page 1
 * (changing what the result set *is* while keeping an old page number
 * would silently show a confusing, possibly out-of-range page).
 */
export function useIncidentListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => parseListParams(searchParams), [searchParams]);

  // Tracks the most recently *requested* params — not just the last
  // committed URL. Next's router.push doesn't commit the URL (or
  // window.location) synchronously, so if two setParams calls fire
  // back-to-back (e.g. two filter selects clicked quickly) before the
  // first navigation lands, both would compute their patch against the
  // same stale snapshot and the second router.push would silently
  // overwrite the first change instead of compounding on top of it.
  // This ref advances optimistically inside setParams itself, so the
  // second call always builds on the first regardless of navigation
  // timing. It's resynced from the real URL only when that URL actually
  // changes (effect below), so external navigation (back/forward) still
  // wins over a stale ref once it lands.
  const latestParamsRef = useRef(params);
  useEffect(() => {
    latestParamsRef.current = params;
  }, [params]);

  const setParams = useCallback(
    (patch: Partial<IncidentListParams>) => {
      const next: IncidentListParams = { ...latestParamsRef.current, ...patch };
      if (!("page" in patch)) {
        next.page = 1;
      }
      latestParamsRef.current = next;
      const qs = serializeListParams(next);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const clearAllFilters = useCallback(() => {
    setParams({ status: [], severity: [], service: "", q: "" });
  }, [setParams]);

  const hasActiveFilters =
    params.status.length > 0 ||
    params.severity.length > 0 ||
    Boolean(params.service) ||
    Boolean(params.q);

  return { params, setParams, clearAllFilters, hasActiveFilters };
}
