"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { FIELD_CLASS } from "./field-styles";

const DEBOUNCE_MS = 300;

export function IncidentSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Stay in sync if the URL changes from elsewhere (back/forward nav,
  // "clear all filters") — adjusted during render rather than in an
  // effect, so it doesn't cost an extra commit/paint cycle.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  function handleChange(next: string) {
    setDraft(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(next), DEBOUNCE_MS);
  }

  function handleClear() {
    clearTimeout(timerRef.current);
    setDraft("");
    onChange("");
  }

  return (
    <div className="relative flex-1 min-w-0">
      <label htmlFor="incident-search" className="sr-only">
        Search incidents by ID, title, service, or assignee
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
      />
      <input
        id="incident-search"
        type="text"
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by ID, title, service, or assignee…"
        className={`${FIELD_CLASS} w-full pl-9 pr-9 placeholder:text-neutral-400`}
      />
      {draft && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
