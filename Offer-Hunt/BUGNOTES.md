# Bug Notes - Offer Hunt
## Defect 1: Timer Closure in useEffect

- **Symptom** : The seconds counter/timer running after opening the application was not updating consistently as expected. The counter was not reliably increasing by +1 every second.
- **Root Cause**: The `useEffect` running the `setInterval` has an empty dependency array `[]` and references `secondsOpen` directly within the closure. Because the closure captures `secondsOpen` as `0` on initial render, `setSecondsOpen(secondsOpen + 1)` repeatedly evaluates to `setSecondsOpen(0 + 1)`, constantly setting the state back to `1`.

## setInterval(() => setSecondsOpen(secondsOpen + 1), 1000);

- **Why Fix is Correct**: Updating `setSecondsOpen` to use the updater function `setSecondsOpen((prev) => prev + 1)` removes the dependency on the outer lexical scope's state variable. It correctly receives the latest state value from React on every interval tick without requiring `setInterval` to be torn down and recreated every second.

## setSecondsOpen((prev) => prev + 1)

- **Verification**: Ran `npm run dev`, let the application sit open for 60+ seconds, and verified that the timer continuously and correctly increments lineally (`1s`, `2s`, `3s`, ...).
