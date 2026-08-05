# Senior React Frontend Take-Home Challenge

## Project: AtlasOps Incident Management Console

Build a production-quality frontend for an operations team that monitors, investigates, and manages service incidents.

The assignment is intentionally open enough to reveal how you make architectural and product decisions, but constrained enough to complete within the deadline.

## Deadline

Submit the completed assignment **within 3 calendar days (72 hours)** of receiving it.

A strong submission does not need to implement every optional feature. Prioritize correctness, maintainability, user experience, and clear engineering decisions.

## Recommended Timebox

We recommend spending approximately **12–18 focused hours**.

Do not sacrifice quality by attempting every bonus feature. Clearly document anything you intentionally did not complete.

## What We Are Evaluating

We are evaluating your ability to:

- Build maintainable React applications.
- Model complex UI and server state.
- Use TypeScript effectively.
- Design reusable but practical component APIs.
- Handle asynchronous workflows and failure states.
- Build accessible, responsive interfaces.
- Test meaningful user behavior.
- Make sound architectural trade-offs.
- Communicate decisions clearly.
- Deliver a polished, runnable application.

## Required Technology

- React 18 or newer.
- TypeScript.
- A modern build setup such as Vite, Next.js, Remix, or an equivalent React framework.
- A testing framework suitable for React applications.
- Git.

You may use third-party packages, but be prepared to explain why each important dependency was chosen.

## Product Scenario

AtlasOps is used by support engineers and technical leads to manage incidents affecting customer-facing systems.

Users need to:

1. Review incidents quickly.
2. Search, filter, and sort incidents.
3. inspect incident details.
4. Change incident status and ownership.
5. Add investigation notes.
6. Create new incidents.
7. Continue working gracefully when requests fail or connectivity is unreliable.

## Core Deliverables

Your repository must include:

- A working application.
- A clear `README.md` with setup and run instructions.
- Automated tests.
- A production build command.
- A short architecture and trade-off explanation.
- A list of incomplete items or known limitations.
- A working deployment URL.
- A Git repository URL.
- A working API documentation or mock API reference where applicable.

## Required Screens

### 1. Incident List

Display incidents in a data-dense but readable interface.

Required capabilities:

- Search by incident title, service, assignee, or incident ID.
- Filter by status, severity, and service.
- Sort by at least:
  - Last updated
  - Severity
  - Created date
- Pagination or incremental loading.
- URL-synchronized search, filter, sort, and page state.
- Loading, empty, error, and retry states.
- Responsive behavior for desktop and smaller screens.
- Clear visual distinction between severity levels.
- Keyboard-accessible row or card navigation.

### 2. Incident Details

Selecting an incident must open a dedicated page, modal, or side panel.

Display:

- ID
- Title
- Description
- Status
- Severity
- Service
- Assignee
- Created date
- Last updated date
- Timeline or notes

Required interactions:

- Change status.
- Assign or reassign an owner.
- Add a note.
- Return to the previous list state without losing filters or pagination.

### 3. Create Incident

Provide a form containing:

- Title
- Description
- Severity
- Service
- Assignee
- Initial status

The form must include:

- Client-side validation.
- Accessible labels and error messages.
- Submission loading state.
- Server error handling.
- Protection against accidental duplicate submissions.
- A clear success state or redirect.

## Required Engineering Behaviors

### Data Fetching

The application must:

- Avoid duplicate requests where reasonably possible.
- Handle slow responses.
- Handle failed requests.
- Support request cancellation or prevent stale responses from overwriting newer results.
- Keep server state consistent after mutations.
- Explain the chosen caching and invalidation strategy.

You may use TanStack Query, SWR, Redux Toolkit Query, framework-native data utilities, or a well-designed custom approach.

### Optimistic Update

Implement at least one optimistic interaction, such as:

- Updating an incident status.
- Reassigning an incident.
- Adding a note.

The UI must recover correctly if the server rejects the mutation.

### State Management

Use the simplest appropriate state model.

Your solution should clearly distinguish between:

- Local component state.
- URL state.
- Form state.
- Shared client state.
- Remote server state.

Using a global state library is optional. If you use one, explain why it is necessary.

### Accessibility

At minimum:

- All interactive elements must be keyboard accessible.
- Form fields must have associated labels.
- Validation errors must be perceivable.
- Focus behavior must be intentional.
- Dialogs or drawers must manage focus correctly.
- Status must not be communicated by color alone.
- Semantic HTML should be preferred over unnecessary ARIA.

### Performance

The provided dataset may contain more than 1,000 incidents.

The application should remain responsive while:

- Searching.
- Filtering.
- Sorting.
- Opening incident details.
- Updating records.

Avoid premature optimization, but identify and address measurable bottlenecks.

### Testing

Include meaningful automated tests.

At minimum, test:

- Incident list rendering.
- Search or filtering behavior.
- A successful mutation.
- A failed mutation and rollback or error state.
- Form validation.
- One accessibility-sensitive interaction, such as keyboard navigation or dialog focus.

Prefer testing observable behavior over implementation details.

## Design Expectations

A design file is not provided.

Create a clean, professional interface suitable for an internal operations tool.

We value:

- Strong information hierarchy.
- Consistency.
- Readable dense data.
- Sensible responsive behavior.
- Clear interaction feedback.
- Thoughtful loading and error states.

Visual polish matters, but engineering quality matters more.

## Optional Enhancements

These are not required. Select only the enhancements that best demonstrate your strengths.

- Real-time updates using WebSocket, Server-Sent Events, or simulated polling.
- Offline awareness and recovery.
- Saved filter views.
- Command palette.
- Bulk incident actions.
- Virtualized large lists.
- Dark mode.
- Audit history.
- Role-based actions.
- Internationalization.
- Error monitoring integration.
- Component documentation using Storybook.
- End-to-end testing.
- CI workflow.
- Docker support.
- Performance measurements or budgets.

## Constraints

- Do not use a prebuilt admin dashboard template as the primary implementation.
- Do not copy an existing project.
- Do not include secrets in the repository.
- Do not rely exclusively on generated code you cannot explain.
- The application must run using the documented setup steps.
- The application must be usable without requiring access to private infrastructure.

## Use of AI Tools

AI-assisted development is allowed.

You remain responsible for:

- Understanding all submitted code.
- Verifying correctness.
- Removing irrelevant generated code.
- Explaining architectural decisions.
- Identifying security or reliability risks.

During the follow-up interview, you may be asked to modify or explain any part of the submission.

## Submission

Follow the instructions in [`SUBMISSION.md`](./SUBMISSION.md).

The complete product requirements are in [`REQUIREMENTS.md`](./REQUIREMENTS.md).

The mock API contract is in [`MOCK_API.md`](./MOCK_API.md).
