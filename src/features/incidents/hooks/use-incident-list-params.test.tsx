import { useSyncExternalStore } from "react";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { getUrl, resetUrl, setUrl, subscribeToUrl } from "@/test/url-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => setUrl(url),
    replace: (url: string) => setUrl(url),
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  usePathname: () => useSyncExternalStore(subscribeToUrl, getUrl, getUrl).split("?")[0],
  useSearchParams: () =>
    new URLSearchParams(useSyncExternalStore(subscribeToUrl, getUrl, getUrl).split("?")[1] ?? ""),
}));

const { useIncidentListParams } = await import("./use-incident-list-params");

type Hook = ReturnType<typeof useIncidentListParams>;

function renderHook() {
  const captured: { current: Hook | null } = { current: null };
  function Harness() {
    captured.current = useIncidentListParams();
    return null;
  }
  renderWithProviders(<Harness />);
  return captured;
}

describe("useIncidentListParams", () => {
  beforeEach(() => {
    resetUrl("/incidents");
  });

  it("parses list state out of the URL", () => {
    resetUrl("/incidents?q=payments&status=triggered&severity=critical&sort=createdAt&order=asc&page=3");
    const hook = renderHook();

    expect(hook.current?.params).toMatchObject({
      q: "payments",
      status: ["triggered"],
      severity: ["critical"],
      sort: "createdAt",
      order: "asc",
      page: 3,
    });
  });

  it("drops unrecognized values rather than trusting the URL", () => {
    resetUrl("/incidents?status=not-a-status&severity=bogus&sort=whatever&page=-5");
    const hook = renderHook();

    expect(hook.current?.params).toMatchObject({
      status: [],
      severity: [],
      sort: "updatedAt",
      page: 1,
    });
  });

  /**
   * Regression test.
   *
   * setParams used to build its patch by spreading the `params` value from
   * the render it was created in. Two calls made before React re-rendered
   * with the first result therefore both started from the same stale
   * snapshot, and the second router.push silently discarded the first
   * change — selecting a status and a severity in quick succession kept
   * only the severity. Fired in a single act() here so no re-render can
   * happen in between, which is exactly the condition that broke it.
   */
  it("compounds back-to-back updates instead of overwriting the earlier one", () => {
    const hook = renderHook();

    act(() => {
      hook.current?.setParams({ status: ["triggered"] });
      hook.current?.setParams({ severity: ["critical"] });
    });

    const url = getUrl();
    expect(url).toContain("status=triggered");
    expect(url).toContain("severity=critical");
  });

  it("resets to page 1 when the filters change", () => {
    resetUrl("/incidents?page=4");
    const hook = renderHook();

    act(() => {
      hook.current?.setParams({ status: ["resolved"] });
    });

    expect(getUrl()).not.toContain("page=4");
    expect(getUrl()).toContain("status=resolved");
  });

  it("keeps the requested page when paginating", () => {
    resetUrl("/incidents?status=resolved");
    const hook = renderHook();

    act(() => {
      hook.current?.setParams({ page: 3 });
    });

    expect(getUrl()).toContain("page=3");
    expect(getUrl()).toContain("status=resolved");
  });
});
