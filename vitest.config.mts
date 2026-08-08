import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Pinned so the relative paths in the MSW handlers ("/api/incidents")
    // resolve against a known origin.
    environmentOptions: { jsdom: { url: "http://localhost:3000" } },
    // A spy left installed by one test (e.g. one forcing fetch to fail)
    // must not leak into the next.
    restoreMocks: true,
    // These are integration-style tests: real userEvent typing plus real
    // round trips through the MSW mock API. The 5s default is tight
    // enough that the heavier ones flake on it.
    testTimeout: 20000,
    // The app code is exercised through the UI; the mock API and seed
    // generator are test infrastructure, not subjects under test.
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
