"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ToastInput {
  title: string;
  description?: string;
  variant?: "success" | "error";
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Imperative toast trigger — `const { showToast } = useToast()`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {/* label: distinguishes this live region from anything else on the
          page for assistive tech, per Radix's recommendation. */}
      <ToastPrimitive.Provider swipeDirection="right" duration={6000} label="Notification">
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            className="flex items-start gap-2.5 rounded-lg border bg-white p-3 shadow-lg shadow-neutral-900/10 data-[state=open]:animate-[toast-in_150ms_ease-out] data-[state=closed]:animate-[toast-out_150ms_ease-in] data-[variant=error]:border-red-200 data-[variant=success]:border-green-200"
            data-variant={toast.variant ?? "success"}
          >
            {toast.variant === "error" ? (
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            )}
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-sm font-medium text-neutral-900">
                {toast.title}
              </ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="mt-0.5 text-xs text-neutral-500">
                  {toast.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-100 flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
