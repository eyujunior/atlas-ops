import Link from "next/link";
import { Radar } from "lucide-react";

/**
 * Renders immediately, outside the MSW readiness gate — branding should
 * never wait on the mock backend to start.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/incidents" className="flex items-center gap-2 rounded focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-600">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
            <Radar aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            AtlasOps
          </span>
        </Link>
      </div>
    </header>
  );
}
