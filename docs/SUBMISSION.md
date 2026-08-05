# Submission Instructions

Submit the assignment within **72 hours** of receiving it.

## Required Submission Links

Provide:

1. **Git repository URL**
2. **Working deployment URL**
3. **Working API or mock API reference**
4. Optional Storybook or component documentation URL

The deployed application must be usable without access to private infrastructure.

## Repository Requirements

The repository must include:

- Source code.
- Setup instructions.
- Development command.
- Test command.
- Production build command.
- Environment variable documentation.
- Architecture notes.
- Known limitations.
- License information for copied assets, when applicable.
- A `.gitignore` that excludes secrets and generated dependencies.

## Candidate README

Your project README should include the following sections.

### 1. Overview

Briefly explain:

- What you built.
- The main user workflows.
- The selected technology stack.

### 2. Setup

Provide exact commands for:

```bash
install
run development server
run tests
run production build
start production build
```

The commands should work from a clean checkout.

### 3. Architecture

Explain:

- Project structure.
- Component boundaries.
- Data-fetching strategy.
- State ownership.
- URL state handling.
- Form architecture.
- Error handling.
- Testing strategy.
- Styling approach.

### 4. Important Decisions

Document at least three important trade-offs.

Examples:

- Why a particular framework was selected.
- Why a state library was or was not used.
- Why a table or card layout was selected.
- Why optimistic updates were implemented in a particular way.
- Why a dependency was introduced.
- Why a feature was intentionally excluded.

### 5. Performance

Describe:

- The dataset size used for testing.
- Any performance issue identified.
- Any optimization implemented.
- Any optimization intentionally avoided.

### 6. Accessibility

Describe:

- Keyboard behavior.
- Focus management.
- Form error handling.
- Any accessibility tooling used.
- Known accessibility limitations.

### 7. Testing

List:

- What is covered.
- What is not covered.
- Why those test levels were selected.

### 8. Incomplete Work

Clearly list:

- Missing requirements.
- Known bugs.
- Shortcuts.
- What you would implement next.

An honest incomplete section is better than hiding unfinished work.

## Commit History

We expect a readable Git history that shows how the solution evolved.

The history does not need to be perfect, but avoid submitting one unexplained commit containing the entire project.

## Deployment

The deployment must:

- Load without authentication.
- Avoid exposing secrets.
- Support the required workflows.
- Display a useful error if the mock API is unavailable.
- Work on a modern desktop browser.
- Be reasonably usable on a mobile viewport.

## Optional Submission Note

You may include a short submission note covering:

- The amount of focused time spent.
- The area you are most proud of.
- The largest compromise you made.
- One area you would improve with more time.

## Follow-Up Technical Review

Candidates may be asked to:

- Explain the architecture.
- Trace a user interaction through the code.
- Debug a failing request.
- Modify a component.
- Add a small feature.
- Explain a test.
- Identify a performance issue.
- Discuss accessibility behavior.
- Defend or reconsider a trade-off.

Submit only code you understand and can maintain.
