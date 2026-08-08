# AtlasOps: Incident Management Console

Search, filter, sort and paginate 1,200 incidents; open one to change status,
reassign it, and add notes; create new incidents. Built for the
[take-home brief](docs/REQUIREMENTS.md).

## 1. Overview

**Workflows**

- **Browse.** Debounced search, multi-select status and severity filters as
  removable tags, service filter, sort, pagination. All list state lives in
  the URL, so a filtered view is shareable and survives refresh and
  back/forward.
- **Investigate.** Open an incident as a modal over the list (the list stays
  mounted, so its state is preserved) or as a full page via direct link.
  Change status, reassign, add notes. Each of these is optimistic, with
  rollback and an error toast on failure.
- **Create.** A validated form with an error summary that takes focus, a
  duplicate-submit guard, and input preserved if the server rejects it.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4,
TanStack Query, React Hook Form + Zod, Radix UI, Mock Service Worker,
Vitest + Testing Library.

## 2. Setup

```bash
npm install          # install
npm run dev          # dev server at http://localhost:3000
npm test             # run tests once
npm run test:watch   # tests in watch mode
npm run build        # production build
npm start            # serve the production build
```

No environment variables are required, and there is no backend to configure.
Every request is served by the client-side mock API, in all environments
including the deployed build.

## 3. Architecture

```
src/
  app/                    Routes. incidents/ holds the list, [id] (full-page
                          detail), and @modal/(.)[id] (intercepted modal).
  features/incidents/     API calls, query hooks, URL-state hook, components
  features/users/         Assignee and service lookups
  components/ui/          Shared Radix wrappers: Select, Dialog, Toast
  lib/                    API client, types, TanStack Query setup
  mocks/                  Seed data, in-memory store, MSW handlers
  test/                   Setup, reactive URL mock, render helpers
```

Feature-based rather than type-based: everything incident-related lives
together instead of being split across `components/`, `hooks/`, `api/`.

**State ownership.** Three kinds, kept separate:

| Kind | Where | Examples |
|---|---|---|
| Server state | TanStack Query | incidents, users, services |
| List state | The URL (`useIncidentListParams`) | search, filters, sort, page |
| Local UI state | `useState` | search draft, note textarea, form fields |

Values parsed from the URL are sanitized: an unknown status or a negative
page number falls back to its default rather than being trusted.

**Mutations** follow one pattern. An optimistic update with a snapshot in
`onMutate`, the confirmed server response written directly into the detail
*and* list caches in `onSuccess`, rollback to the snapshot in `onError`, and
a background invalidate in `onSettled` as a safety net.

The mock API is MSW, backed by an in-memory store seeded with 1,200
deterministic incidents. The same handlers run under `msw/node` in tests, so
app and tests share one source of truth, with chaos and latency disabled for
tests and enabled for the app.

Clicking a row opens the detail as an intercepted route: a modal over the
still-mounted list, so filters, sort, page and scroll position survive with no
state-restoration code. A direct link or refresh renders the same content as a
full page. Because the App Router has one URL per page, the row link carries
the list's query string forward; without it, opening the modal would wipe the
list's own `useSearchParams()`.

Forms use React Hook Form with a Zod schema mirroring the server's validation.
RHF's built-in error focusing is disabled in favour of a single validation
summary, because RHF can only focus native inputs, not a Radix Select trigger.
The summary is the one target that works for every field type.

On the error path, `apiRequest` converts 4xx/5xx, timeouts and aborts into a
typed `ApiClientError` with a safe user-facing message; raw server detail
never reaches the UI. Retries are disabled for 4xx, since a validation or
conflict error won't fix itself, and limited elsewhere. Every surface has
loading, empty, no-results and error+retry states.

Styling is Tailwind v4, with shared Radix wrappers so every dropdown, dialog
and toast behaves and looks consistent rather than being rebuilt per use site.

## 4. Important Decisions

**MSW instead of Next.js route handlers.** The mock API is stateful, and on
serverless hosting route handlers can run as multiple isolated instances, so
a mutation on one can be invisible to a read on another. MSW runs in the
browser, giving one memory space per session that can't fragment. Cost: it
isn't a real backend (see Limitations).

**Modal via intercepting routes, not a state-driven dialog.** Keeping the
list mounted underneath makes preserving its scroll position and filters
free, instead of writing explicit restoration logic. Cost: a less common
route structure (`@modal`, `(.)[id]`) that's harder to reason about than a
plain state-driven dialog.

**`/new-incident`, not `/incidents/new`.** The dynamic segment `[id]` matches
any value under `/incidents/`, so `new` would resolve as an incident ID.
Keeping create outside that segment avoids the collision and leaves detail
URLs clean at `/incidents/INC-1234`, which are the ones that get shared.

**Writing mutation responses into the cache, not just invalidating.**
`invalidateQueries` alone only schedules a refetch, leaving the list showing a
stale status for as long as that round trip takes (~2s with the mock API's
simulated latency). `onSuccess` patches the detail cache and the matching row
in every cached list page directly, with invalidation kept as a background
safety net.

**Tags for status and severity, plain selects for service and sort.** Status
and severity are genuinely multi-select, so add-then-remove-as-tag fits.
Service is single-valued by nature, so a tag pattern would add ceremony for
nothing.

## 5. Performance

**Dataset:** 1,200 incidents. **Measured on the production build**, not dev:

- **20 of 1,200 rows** in the DOM at a time (~875 nodes on the list page)
- Search: **12 keystrokes produce 1 request**
- Pagination: 1 request per page change, no overlap
- FCP ~84ms, DOMContentLoaded ~56ms locally

Mutations write the confirmed response straight into the caches, so a status
change or reassignment costs no extra round trip to be reflected everywhere it
appears.

**Avoided: list virtualization.** With server-side pagination at 20 rows,
the DOM never holds more than a page regardless of dataset size. It would only
pay off under infinite scroll, which isn't the chosen strategy.

One trade-off is worth naming: the table renders both desktop `<table>` and
mobile card markup at once, toggled by CSS, which roughly doubles the row
elements. Negligible at 20 rows, but a `useMediaQuery` single-mount version
would remove it if the page size grew.

## 6. Accessibility

- **Keyboard.** Every control is reachable, including rows: one stretched
  `<Link>` per row gives a single Tab stop with a descriptive `aria-label`
  rather than one stop per cell.
- **Focus management.** The dialog traps focus and closes on Escape. Focus
  *return* is handled explicitly, since Radix's built-in capture is unreliable
  when a dialog opens via route navigation; the originating row is re-focused
  by `data-row-link-id`.
- **Forms.** Accessible names on every field, `aria-invalid` and
  `aria-describedby` associations, and focus moved to an error summary on a
  failed submit.
- **Not colour alone.** Status and severity always pair an icon with text.
- **Announcements.** Mutation outcomes go through Radix's toast live region.
- **Tables.** Real `<table>`, `<thead>` and `<th scope="col">` structure.

**Tooling.** Manual keyboard testing plus Playwright-driven assertions on
computed `outline` styles, `:focus-visible` matching, focus-trap traversal and
`aria-*` attributes.

## 7. Testing

**34 tests, 6 files.** Vitest and Testing Library running against the real MSW
handlers, not a stubbed client, so they exercise genuine request and response
paths.

**Covered:** the mock API contract (pagination, filtering, sanitized invalid
values, field-level validation errors, illegal transitions, 404s); the list
(search into the URL, filter tags, no-results, retry-able errors); detail
mutations (status, assignment, notes, including **rollback on failure** and
**typed input preserved** when a note is rejected); the create form
(validation, focused summary, aria wiring, navigation on success, input
preserved on server error, duplicate-submit guard).

**Not covered, deliberately:** sorting and pagination controls; the severity
and service filters (only status is tested directly, though they share a code
path, which is exactly the assumption a test should verify); dialog focus
management (verified manually and with Playwright, not in the committed
suite); no committed E2E suite.

The split is deliberate. Mutation correctness (optimistic updates, rollback,
preserved input) is where a regression would be easiest to introduce and
hardest to notice, so it got depth first. Breadth across every control was the
next priority, not the first.

## 8. Incomplete Work

**Missing requirements:** none. The gaps below are depth and polish, not
absent features.

**Limitations**

- **No real persistence.** Data lives in an in-memory `Map` in the tab's
  memory: refreshing resets to the seeded 1,200 incidents, and nothing is
  shared across tabs or devices. A deliberate trade-off (see Decisions), but
  it means changes made during a review session won't survive a reload.
- Both table and card markup render simultaneously, toggled by CSS.
- The `X-Mock-Delay`, `X-Mock-Failure` and `X-Mock-Conflict` control headers
  work and are used from tests, but there's no in-app UI to toggle them.

**Next, in priority order**

1. `localStorage` persistence for the mock store, with a schema version key so
   a shape change invalidates stale cached data rather than causing confusing
   bugs.
2. Automated tests for dialog focus management, sorting, pagination and the
   remaining filters.
3. A `useMediaQuery` single-mount table/card switch.
4. A committed Playwright E2E suite covering the critical end-to-end flows
   (create, then confirm it appears in the list; status change, then confirm
   list and detail agree).

## Submission Note

**Most proud of:** the mutation architecture. Optimistic updates with
rollback across status, assignment and notes, and writing the confirmed
response directly into both caches so the list and detail never disagree.

**Largest compromise:** no real persistence. A deliberate choice to avoid a
worse failure mode (stateful serverless functions fragmenting across
instances), but still a real limitation when evaluating the deployed app.

**Would improve with more time:** the 34 tests target the highest-risk paths
on purpose, but sorting, pagination and dialog focus management are verified
manually rather than in the committed suite.
