# Bug Notes - Offer Hunt
## Defect 1: Timer Closure in useEffect

- **Symptom** : The seconds counter/timer running after opening the application was not updating consistently as expected. The counter was not reliably increasing by +1 every second.
- **Root Cause**: The `useEffect` running the `setInterval` has an empty dependency array `[]` and references `secondsOpen` directly within the closure. Because the closure captures `secondsOpen` as `0` on initial render, `setSecondsOpen(secondsOpen + 1)` repeatedly evaluates to `setSecondsOpen(0 + 1)`, constantly setting the state back to `1`.

## setInterval(() => setSecondsOpen(secondsOpen + 1), 1000);

- **Why Fix is Correct**: Updating `setSecondsOpen` to use the updater function `setSecondsOpen((prev) => prev + 1)` removes the dependency on the outer lexical scope's state variable. It correctly receives the latest state value from React on every interval tick without requiring `setInterval` to be torn down and recreated every second.

## setSecondsOpen((prev) => prev + 1)

- **Verification**: Ran `npm run dev`, let the application sit open for 60+ seconds, and verified that the timer continuously and correctly increments lineally (`1s`, `2s`, `3s`, ...).

## Defect 2: Array Index Used as Key in ApplicationRow List

* **Symptom**: The notes entered in an application row could move to another row or stay visible on the wrong row after deleting or filtering items.

* **Root Cause**: `ApplicationRow` was using the array index as its `key` with `key={index}`. When an item was deleted or the list was filtered, the indexes changed. React could then reuse the existing row component for a different item, which caused the local `note` state to appear on the wrong row.

* **Why Fix is Correct**: I changed the key to `key={x.id}`. Since each application has its own unique and stable `id`, React can correctly identify each row even when the list changes.

* **Verification**: I entered a note in row 2, deleted row 1, and checked that the note was still attached to the correct company.


## Defect 3: Object Reference Dependency in useEffect

**Symptom**: The pagination was going back to page 1 even when I changed other things that were not related to search or filters.

**Root Cause**: activeView was created as an object inside the App component like { search: query, round: roundFilter }. Since a new object is created on every render, its reference also changes every time. Because useEffect was depending on this object, the effect was running again on every render and resetting the page to 1.

**Why Fix is Correct**: I changed the dependency from the activeView object to the actual values [query, roundFilter]. Now the effect runs only when the search query or round filter changes.

**Verification**: I went to page 2 and then changed the notes/timer without changing the search or filter. The page stayed on page 2, so the pagination was working correctly.


## Defect 4: Inline Component Declaration for NewApplicationForm

* **Symptom**: When I typed in the "Company name" or "Expected CTC" field, the input was losing focus after every keypress.

* **Root Cause**: `NewApplicationForm` was declared inside the `App` component. Whenever the state changed, `App` re-rendered and a new `NewApplicationForm` component was created. React treated it as a different component, so the old input was removed and a new one was created, which caused the focus to be lost.

* **Why Fix is Correct**: I moved `NewApplicationForm` outside the `App` component. This keeps the component reference stable when `App` re-renders, so the input is not recreated on every keypress.

* **Verification**: I typed complete company names and CTC values in both fields and confirmed that the input focus stayed active while typing.


## Defect 5: Direct State Mutation in Toggle Handler

* **Symptom**: The "Followed up" checkbox was not updating reliably because the application state was being changed directly.

* **Root Cause**: `toggleFollowedUp` was directly changing `x.followedUp` and then passing the same `applications` array to `setApplications`. Since the original state was being modified instead of creating a new array and object, React might not detect the change properly.

* **Why Fix is Correct**: I changed the update to use `map()` and created a new object for the updated application using `{ ...item, followedUp: !item.followedUp }`. This keeps the original state unchanged and gives React a new reference to detect the update.

* **Verification**: I clicked the "Followed up" checkbox on different rows and confirmed that each checkbox updated correctly without affecting the other rows.


## Defect 6: Search Query Race Condition

* **Symptom**: When I typed quickly in the search box, the results sometimes showed matches for an older search instead of the latest search.

* **Root Cause**: `lookupApplications` has different response times for different search terms. When I typed quickly, an older search request could finish after the newer request and update the results with outdated data.

* **Why Fix is Correct**: I added an `active` flag inside `useEffect` and used a cleanup function. When the search query changes, the previous request is marked as inactive. So, when an older request finishes, it cannot update `setServerMatches`.

* **Verification**: I quickly typed "Zoho" in the search box and checked the server search results. The final results consistently matched "Zoho" instead of an older query like "Z" or "Zo".
