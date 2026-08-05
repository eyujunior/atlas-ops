import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Used by Vitest (see src/test/setup.ts). Same handlers/store as the
// browser worker — one source of truth for mock API behavior.
export const server = setupServer(...handlers);
