"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "@/lib/query-client";
import { ToastProvider } from "@/components/ui/toast";
import { MockingGate } from "./mocking-gate";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MockingGate>{children}</MockingGate>
      </ToastProvider>
    </QueryClientProvider>
  );
}
