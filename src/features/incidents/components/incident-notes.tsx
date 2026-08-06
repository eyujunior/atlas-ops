"use client";

import { useState } from "react";
import type { IncidentNote } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useAddNoteMutation } from "../queries";
import { formatDateTime, formatRelativeTime } from "../utils";

function NotesList({ notes }: { notes: IncidentNote[] }) {
  if (notes.length === 0) {
    return <p className="text-sm text-neutral-400">No notes yet.</p>;
  }

  // Chronological — oldest first, newest at the bottom, like a thread.
  const ordered = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <ul className="flex flex-col gap-2">
      {ordered.map((note) => (
        <li
          key={note.id}
          className={`rounded-md border border-neutral-200 p-3 ${note.pending ? "opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-700">{note.author.name}</span>
            <span className="text-xs text-neutral-500" title={formatDateTime(note.createdAt)}>
              {note.pending ? "Sending…" : formatRelativeTime(note.createdAt)}
            </span>
          </div>
          {/* Plain JSX text interpolation — React escapes this automatically,
              so a note's message can never be rendered as HTML/scripts. */}
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{note.message}</p>
        </li>
      ))}
    </ul>
  );
}

function NoteForm({ incidentId }: { incidentId: string }) {
  const [text, setText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useAddNoteMutation(incidentId);
  const { showToast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError("Note cannot be empty.");
      return;
    }
    setValidationError(null);

    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    mutation.mutate(
      { message: trimmed, optimisticId },
      {
        // Clear only on confirmed success — a failed submission must
        // preserve what the user typed rather than lose it.
        onSuccess: () => setText(""),
        onError: (error) => {
          showToast({
            variant: "error",
            title: "Couldn't add note",
            description: error.userMessage,
          });
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="note-message" className="text-xs font-medium text-neutral-500">
        Add a note
      </label>
      <textarea
        id="note-message"
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (validationError) setValidationError(null);
        }}
        disabled={mutation.isPending}
        aria-invalid={validationError ? true : undefined}
        aria-describedby={validationError ? "note-message-error" : undefined}
        placeholder="Add an investigation note…"
        className="rounded-md border border-neutral-300 bg-white p-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
      />
      {validationError && (
        <p id="note-message-error" role="alert" className="text-xs text-red-600">
          {validationError}
        </p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="self-start rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        {mutation.isPending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}

export function IncidentNotes({
  incidentId,
  notes,
}: {
  incidentId: string;
  notes: IncidentNote[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <NotesList notes={notes} />
      <NoteForm incidentId={incidentId} />
    </div>
  );
}
