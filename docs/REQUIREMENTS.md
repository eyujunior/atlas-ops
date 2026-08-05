# AtlasOps Product Requirements

## 1. Product Goal

Build an incident management console that helps technical operations teams detect, prioritize, investigate, and resolve service incidents efficiently.

The interface should work well for users who manage many incidents under time pressure.

## 2. Primary User

The primary user is an operations engineer who:

- Monitors multiple services.
- Investigates active incidents.
- Coordinates incident ownership.
- Records investigation notes.
- Updates incident status.
- Needs reliable feedback when the network is slow or unavailable.

## 3. Incident Model

Each incident contains:

```ts
type IncidentStatus =
  | "triggered"
  | "acknowledged"
  | "investigating"
  | "resolved";

type IncidentSeverity = "critical" | "high" | "medium" | "low";

interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface IncidentNote {
  id: string;
  incidentId: string;
  author: UserSummary;
  message: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  service: string;
  assignee: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  notes: IncidentNote[];
}
```

You may extend the model, but avoid changing the required semantics.

## 4. Incident List Requirements

### 4.1 Display

For each incident, show at least:

- Incident ID
- Title
- Status
- Severity
- Service
- Assignee
- Last updated time

The presentation may use a table, responsive cards, or a hybrid design.

### 4.2 Search

Search must match at least:

- Incident ID
- Title
- Service
- Assignee name

Expected behavior:

- Search should not submit on every keystroke without control.
- Search state must be represented in the URL.
- Clearing search must restore the full result set.
- Stale requests must not replace newer search results.

### 4.3 Filtering

Support multiple filters:

- Status
- Severity
- Service

Expected behavior:

- Multiple filters may be active simultaneously.
- Active filters must be visible.
- Users must be able to clear individual filters.
- Users must be able to clear all filters.
- Filters must persist in the URL.
- Invalid URL filter values must be handled safely.

### 4.4 Sorting

Support:

- Last updated
- Created date
- Severity

The interface must clearly communicate the active sort field and direction.

### 4.5 Pagination

Support either:

- Page-based pagination.
- Cursor-based pagination.
- Infinite loading.

The implementation must prevent accidental duplicate records and preserve the selected list state during navigation.

### 4.6 List States

Implement:

- Initial loading state.
- Background refresh state.
- Empty dataset state.
- No search results state.
- Request failure state.
- Retry behavior.
- Partial or stale-data state where appropriate.

## 5. Incident Detail Requirements

### 5.1 Navigation

Users must be able to open an incident and return to the same list context.

The following state should remain intact:

- Search
- Filters
- Sort
- Page or cursor position

### 5.2 Status Updates

Users may transition between statuses.

At minimum, support:

```text
triggered -> acknowledged
acknowledged -> investigating
investigating -> resolved
resolved -> investigating
```

You may support additional transitions.

Requirements:

- Show mutation progress.
- Prevent accidental duplicate requests.
- Use an optimistic update.
- Roll back when the server rejects the update.
- Display a useful error.
- Refresh or reconcile server state after completion.

### 5.3 Assignment

Users must be able to:

- Assign an unassigned incident.
- Reassign an incident.
- Remove an assignee.

The user list may be fetched separately.

### 5.4 Notes

Users must be able to add a plain-text investigation note.

Requirements:

- Empty notes are rejected.
- Whitespace-only notes are rejected.
- Submission state is visible.
- Failed submissions preserve the user's text.
- Newly created notes appear in the correct order.
- Dates are rendered in a human-readable format.
- User-provided content must not be rendered as unsafe HTML.

## 6. Create Incident Requirements

### 6.1 Fields

| Field | Requirement |
|---|---|
| Title | Required, 5–120 characters |
| Description | Required, 20–2,000 characters |
| Severity | Required |
| Service | Required |
| Assignee | Optional |
| Initial status | Required |

### 6.2 Behavior

- Display validation near the relevant field.
- Summarize submission errors when useful.
- Move focus to the first invalid field or validation summary.
- Disable or guard against duplicate submission.
- Preserve entered data after a server error.
- Navigate to the created incident or display a clear success state.

## 7. Error Simulation

The mock API can intentionally fail.

Your application should handle at least:

- `400 Bad Request`
- `404 Not Found`
- `409 Conflict`
- `500 Internal Server Error`
- Network timeout
- Aborted request

Do not display raw stack traces or implementation details to users.

## 8. Accessibility Acceptance Criteria

- All controls can be reached and operated with a keyboard.
- Focus indicators are visible.
- The active incident row or selected state is identifiable without color alone.
- Form controls have accessible names.
- Validation messages are associated with their fields.
- Dynamic mutation results are announced where appropriate.
- Dialogs use appropriate semantics and focus trapping.
- Escape closes a dismissible dialog.
- Focus returns to the triggering element after dialog closure.
- Tables use valid table structure when a table is used.
- Icon-only buttons have accessible names.

## 9. Responsive Acceptance Criteria

The application must be usable at approximately:

- 1440px wide.
- 1024px wide.
- 768px wide.
- 375px wide.

You do not need pixel-perfect rendering at every width, but core actions must remain available.

## 10. Performance Acceptance Criteria

Use a dataset containing at least 1,000 incidents when evaluating the interface.

The application should:

- Avoid blocking the main thread unnecessarily.
- Avoid rendering the entire dataset when pagination or virtualization is appropriate.
- Avoid repeated expensive calculations.
- Avoid unstable prop patterns that cause excessive rendering.
- Avoid unnecessary network requests.
- Avoid loading large dependencies for trivial functionality.

Document any performance investigation you performed.

## 11. Security Expectations

- Do not expose secrets in frontend code.
- Do not trust client-side authorization.
- Do not render user notes using unsafe HTML.
- Validate API responses or explain the trust boundary.
- Sanitize or constrain URL-derived values.
- Do not log sensitive information.
- Treat all API failures as untrusted input.

Authentication is outside the required scope. You may simulate the current user.

## 12. Suggested Project Structure

This is only a suggestion. You are free to choose another structure.

```text
src/
  app/
  features/
    incidents/
    users/
  components/
  hooks/
  lib/
  routes/
  styles/
  test/
```

We value coherent boundaries more than any specific folder convention.

## 13. Definition of Done

The project is considered complete when:

- Required screens and workflows function.
- The application handles expected loading and failure states.
- Tests cover critical behavior.
- The production build succeeds.
- Setup instructions work from a clean checkout.
- Architectural decisions are documented.
- Known limitations are documented.
- The application is deployed and accessible.
