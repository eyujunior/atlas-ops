"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useIncidentQuery } from "../queries";
import { IncidentDetailContent } from "./incident-detail-content";

/**
 * Rendered by the intercepted route (@modal/(.)[id]) when navigating here
 * from the list — the list page underneath never unmounts, so its
 * search/filter/sort/page state survives automatically. Closing (Escape,
 * backdrop click, the X button) calls router.back() rather than pushing
 * to /incidents directly, so it's real browser history navigation.
 */
export function IncidentDetailModal({ id }: { id: string }) {
  const router = useRouter();
  // Same queryKey as IncidentDetailContent's own useIncidentQuery(id), so
  // this shares one cached request rather than firing a second one — used
  // only to give the dialog a real, specific accessible name once loaded.
  const query = useIncidentQuery(id);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl">
        {/* Visually hidden: IncidentDetailContent renders its own visible
            heading. Radix requires a Dialog.Title for accessibility
            regardless — this is it, kept in sync with the loaded data
            without depending on a function prop crossing into a Client
            Component from a Server Component page (which isn't allowed). */}
        <DialogTitle className="sr-only">
          {query.data ? `Incident ${query.data.id}: ${query.data.title}` : "Incident details"}
        </DialogTitle>
        <IncidentDetailContent id={id} />
      </DialogContent>
    </Dialog>
  );
}
