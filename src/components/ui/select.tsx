"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { forwardRef } from "react";

/**
 * A styled Radix Select. Native <select> dropdown *panels* are rendered
 * by the OS, not the browser's CSS engine — there is no cross-browser way
 * to restyle that overlay (rounded corners, shadow, spacing, hover state)
 * while keeping a real <select>. Radix renders the popover itself, so it
 * behaves like plain elements to style, while still implementing the
 * full WAI-ARIA listbox pattern (keyboard nav, typeahead, focus handling)
 * under the hood.
 */
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={`flex h-9 items-center justify-between gap-2 rounded-md border border-neutral-300 bg-white pl-2.5 pr-2 text-sm text-neutral-900 outline-none data-[placeholder]:text-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown aria-hidden="true" strokeWidth={1.75} className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className = "", children, position = "popper", sideOffset = 6, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={`z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg shadow-neutral-900/5 ${className}`}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={`relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-7 pr-3 text-sm text-neutral-900 outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 ${className}`}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
