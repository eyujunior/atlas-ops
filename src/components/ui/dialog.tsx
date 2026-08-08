"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef } from "react";

export const Dialog = DialogPrimitive.Root;

export const DialogOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs data-[state=open]:animate-[toast-in_150ms_ease-out] ${className}`}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className = "", children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-modal="true"
      className={`fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/20 outline-none ${className}`}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        // No `focus:outline-none` here: it also resets the
        // --tw-outline-style variable that outline-2 reads via var(),
        // silently killing the focus-visible outline too — see the
        // identical fix on RowLink in incident-table.tsx. outline's
        // initial value is already none, so omitting it is enough.
        className="absolute right-4 top-4 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogTitle = DialogPrimitive.Title;
