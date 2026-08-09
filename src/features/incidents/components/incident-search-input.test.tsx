import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IncidentSearchInput } from "./incident-search-input";

/**
 * How long the parent takes to reflect a change back down as a new `value`.
 * In the real app this is router.push -> URL commit -> useSearchParams, which
 * is never synchronous; the exact duration doesn't matter, only that it lands
 * after the keystrokes that follow it.
 */
const ECHO_MS = 50;

const DEBOUNCE_MS = 300;

/** Mirrors IncidentListView: onChange writes the URL, which feeds `value` back. */
function Harness() {
  const [value, setValue] = useState("");
  return (
    <IncidentSearchInput
      value={value}
      onChange={(next) => {
        setTimeout(() => setValue(next), ECHO_MS);
      }}
    />
  );
}

function getInput() {
  return screen.getByRole("textbox", { name: /search incidents/i });
}

describe("IncidentSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps characters deleted while the previous change is still round-tripping", () => {
    render(<Harness />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "database" } });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // Three quick backspaces, before the "database" echo has come back down.
    fireEvent.change(input, { target: { value: "datab" } });

    act(() => {
      vi.advanceTimersByTime(ECHO_MS);
    });

    expect(input).toHaveValue("datab");
  });

  it("still adopts a genuinely external change to the value", () => {
    const { rerender } = render(<IncidentSearchInput value="payments" onChange={() => {}} />);
    expect(getInput()).toHaveValue("payments");

    // e.g. back/forward navigation, or "clear all filters".
    rerender(<IncidentSearchInput value="" onChange={() => {}} />);
    expect(getInput()).toHaveValue("");
  });
});
