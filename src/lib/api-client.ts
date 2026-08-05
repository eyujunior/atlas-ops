import type { ApiErrorBody } from "./types";

/** Typed client-side representation of any API failure. */
export class ApiClientError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;
  currentVersion?: number;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? "Request failed");
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.code ?? "UNKNOWN_ERROR";
    this.fieldErrors = body.fieldErrors;
    this.currentVersion = body.currentVersion;
  }

  /** Human-safe message — never leaks stack traces or raw payloads. */
  get userMessage(): string {
    if (this.status === 0) return "Network error. Check your connection and try again.";
    if (this.code === "TIMEOUT") return "The request took too long. Please try again.";
    if (this.code === "ABORTED") return "Request was cancelled.";
    if (this.status === 404) return "That item could not be found.";
    if (this.status === 409) return this.message || "This was changed by someone else. Refresh and try again.";
    if (this.status >= 500) return "Something went wrong on our end. Please try again.";
    return this.message || "The request could not be completed.";
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildQueryString(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Thin fetch wrapper: JSON in/out, typed errors, request timeout, and
 * respects an external AbortSignal (used by TanStack Query to cancel
 * stale in-flight requests when params change or the component unmounts).
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", query, body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);
  const timeout = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs);

  try {
    const response = await fetch(`/api${path}${buildQueryString(query)}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody: Partial<ApiErrorBody> = {};
      try {
        errorBody = await response.json();
      } catch {
        // Non-JSON error body — fall back to a generic message.
      }
      throw new ApiClientError(response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiClientError(0, { code: "TIMEOUT", message: "Request timed out." });
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError(0, { code: "ABORTED", message: "Request was cancelled." });
    }
    throw new ApiClientError(0, { code: "NETWORK_ERROR", message: "Network error." });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
