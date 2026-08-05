/**
 * Every control in the list toolbar (search input, sort select, sort
 * direction button, filter selects, clear-all button) shares this exact
 * height/border/focus treatment. A toolbar where each control has its own
 * slightly different padding is the single biggest tell of an unpolished
 * UI — this is the one place that difference is not allowed to drift.
 */
export const FIELD_CLASS =
  "h-9 rounded-md border border-neutral-300 bg-white text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";
