# Bug Notes - Offer Hunt

## Defect 1: Timer Closure in `useEffect`

* **Symptom:** Timer was stuck at `1s` instead of continuously increasing.
* **Root Cause:** `setInterval` used stale `secondsOpen` because the effect had `[]` dependencies.
* **Fix:** Changed `setSecondsOpen(secondsOpen + 1)` to `setSecondsOpen((prev) => prev + 1)`.
* **Verification:** Timer was tested for 60+ seconds and increased correctly.

## Defect 2: Array Index Used as Key

* **Symptom:** Notes could appear on the wrong application after deleting/filtering rows.
* **Root Cause:** `key={index}` caused React to reuse row components incorrectly.
* **Fix:** Changed the key to the stable application ID: `key={x.id}`.
* **Verification:** Added a note, deleted another row, and confirmed the note stayed with the correct company.

## Defect 3: Object Reference Dependency

* **Symptom:** Pagination unexpectedly reset to page 1.
* **Root Cause:** `activeView` was a new object on every render, causing the effect to run repeatedly.
* **Fix:** Changed dependency from `[activeView]` to `[query, roundFilter]`.
* **Verification:** Pagination remained unchanged when unrelated state was updated.

## Defect 4: Inline Component Declaration

* **Symptom:** Form inputs lost focus while typing.
* **Root Cause:** `NewApplicationForm` was declared inside `App` and recreated on every render.
* **Fix:** Moved `NewApplicationForm` outside the `App` component.
* **Verification:** Typed in both inputs and confirmed focus remained active.

## Defect 5: Direct State Mutation

* **Symptom:** Follow-up checkbox did not update reliably.
* **Root Cause:** Application state was directly mutated before calling `setApplications`.
* **Fix:** Used `map()` with immutable state updates.
* **Verification:** Tested multiple checkboxes and confirmed each updated correctly.

## Defect 6: Search Query Race Condition

* **Symptom:** Older search results could overwrite newer results.
* **Root Cause:** Older asynchronous searches could finish after newer searches.
* **Fix:** Added an `active` flag with effect cleanup to ignore stale results.
* **Verification:** Typed search queries quickly and confirmed the final results matched the latest query.

## Additional Requirements

### Local Storage

* Added `localStorage` persistence with lazy state initialization.
* Applications are saved whenever the `applications` state changes.

### Application Count

* Added `Showing {shown.length} of {visible.length} applications`.
* Count updates correctly with search, filters, and pagination.

### Form Validation

* Company name is required.
* Expected CTC must be greater than `0`.
* Submit button is disabled for invalid input.

### Keyboard Controls

* **Enter:** Submits the form.
* **Escape:** Clears the draft fields.
