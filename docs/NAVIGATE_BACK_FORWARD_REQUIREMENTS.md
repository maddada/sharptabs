# Navigate Back / Forward — Requirements

## 1) Purpose
Provide “back” and “forward” navigation between recently active tabs in the current window (not browser page history). The feature must be reliable and consistent across UI buttons and keyboard shortcuts.

## 2) Scope
- In scope: tracking recently active tabs per window; navigating to previous/next tab; updating UI state for back/forward buttons; keyboard shortcuts and Chrome commands triggering navigation.
- Out of scope: browser page history; tab grouping; workspace logic; UI layout/styling; hotkey configuration UI.

## 3) Definitions
- Active tab: the tab most recently activated in a given window.
- Navigation history: an ordered list of tab IDs representing activation order within a window.
- Current index: position in the navigation history corresponding to the currently active tab.
- Programmatic navigation: navigation initiated by this feature (back/forward), which should not be added to history.

## 4) Feature Entry Points (Must Support)
The same navigation behavior must be invoked from all entry points:

1) Chrome commands
- navigate-back, navigate-forward commands must navigate in the command’s window.

2) Tab Manager header buttons
- Back/Forward buttons send messages:
  - NAVIGATE_BACK with windowId
  - NAVIGATE_FORWARD with windowId

3) Tab Manager keyboard shortcuts
- Back: Alt+Left or Cmd/Ctrl+[
- Forward: Alt+Right or Cmd/Ctrl+]
- Must ignore key events from text inputs or textareas.

## 5) Data Model Requirements
- Per-window history: Maintain navigation history separately for each window.
- History list content: array of tab IDs.
- Max size: 30 entries (drop oldest when exceeding).
- Current index: integer pointer to the current active tab within history.
- Storage: in-memory (service worker lifecycle). No persistence required.

## 6) History Update Rules
When a tab becomes active (tabs.onActivated):

1) Skip programmatic navigations
- If activation was triggered by a back/forward action, do not add to history.

2) Truncate forward history
- If currentIndex is not at the end, drop all items after currentIndex before adding the new tab.

3) De-duplicate
- If the activated tab already exists in history, remove its prior occurrence before adding it to the end.

4) Append and update current index
- Add tab to end of history and set currentIndex to the last element.

5) Enforce max size
- If history exceeds 30, drop the oldest item and adjust currentIndex accordingly.

6) Broadcast state change
- After update, broadcast navigation state to UI.

## 7) Back/Forward Navigation Behavior
### Back
- Preconditions: currentIndex > 0
- Action: activate tab at currentIndex - 1
- Update currentIndex to the new position
- Mark the target tab as “programmatic navigation” to prevent re-adding to history
- Broadcast navigation state on success

### Forward
- Preconditions: currentIndex < history.length - 1
- Action: activate tab at currentIndex + 1
- Update currentIndex to the new position
- Mark the target tab as “programmatic navigation”
- Broadcast navigation state on success

### Error handling
- If activating target tab fails:
  - Remove invalid tab from history
  - Adjust currentIndex if needed
  - Return failure (no navigation state should be inaccurate after this)

## 8) Cleanup / Validity
1) On tab removal
- If removed tab exists in history, remove it.
- Adjust currentIndex to remain valid and within bounds.
- Broadcast updated navigation state.

2) On window removal
- Remove the history for that window.
- Remove any programmatic navigation flags for that window.

3) History validation when navigating
- Before back/forward, validate entries and remove closed/invalid tabs.
- If validation changes the history, ensure currentIndex stays valid.

## 9) UI State Contract
### Request/Response (UI -> Service Worker)
- GET_NAVIGATION_STATE with windowId
  Response: { canGoBack: boolean, canGoForward: boolean }

### Push Notification (Service Worker -> UI)
- NAVIGATION_STATE_CHANGED with { windowId, navigationState }

### UI Expectations
- Back button disabled when canGoBack === false
- Forward button disabled when canGoForward === false
- UI should avoid concurrent navigation (UI-side “isNavigating” guard is fine)

## 10) Concurrency & Consistency
- Navigation requests should be processed serially per window to avoid index corruption.
- Programmatic navigation flags should not persist indefinitely; they must clear after use.

## 11) Non-Goals / Explicit Exclusions
- Do not integrate browser page history.
- Do not persist history across browser restarts or service worker reloads.
- Do not change UI/shortcut wiring or labels.

## 12) Acceptance Tests / Examples
### A) Basic activation history
Given window W has tabs A, B, C and the user activates in order A -> B -> C:
- history = [A, B, C]
- currentIndex = 2
- canGoBack = true, canGoForward = false

### B) Navigate back then forward
Starting from history [A, B, C], currentIndex = 2 (C active):
1) Back -> activate B
   - currentIndex = 1
   - history unchanged
   - canGoBack = true, canGoForward = true
2) Forward -> activate C
   - currentIndex = 2
   - history unchanged
   - canGoBack = true, canGoForward = false

### C) Forward history truncation
Starting from history [A, B, C], currentIndex = 2 (C active):
1) Back -> activate B (currentIndex = 1)
2) User manually activates D (not programmatic)
Expected:
- history = [A, B, D]
- currentIndex = 2
- C is removed (forward history truncated)

### D) De-duplication when re-activating an existing tab
Starting from history [A, B, C], currentIndex = 2:
User activates A manually.
Expected:
- history = [B, C, A]
- currentIndex = 2

### E) Programmatic navigation is not re-added
Starting from history [A, B, C], currentIndex = 2:
Back -> activate B (programmatic)
Expected:
- history remains [A, B, C]
- currentIndex = 1
- No duplicate B appended to the end

### F) Max history size
Given a history limit of 30 and 31 distinct activations in a window:
Expected:
- history length = 30
- oldest entry is dropped
- currentIndex points to the newest entry

### G) Tab removal adjusts history and index
Starting from history [A, B, C], currentIndex = 1 (B active):
Tab A is closed.
Expected:
- history = [B, C]
- currentIndex = 0 (B remains active)
- canGoBack = false, canGoForward = true

### H) Invalid/closed tab during navigation
Starting from history [A, B, C], currentIndex = 2 (C active):
Tab B is closed, then user presses Back.
Expected:
- cleanup removes B
- history = [A, C]
- currentIndex adjusts to 1 (C active)
- Back navigates to A successfully

### I) Per-window isolation
Given window W1 history [A, B] and window W2 history [X, Y]:
Back in W1 affects only W1 state.
Expected:
- W2 history and currentIndex remain unchanged.

### J) UI state contract
At any time:
- canGoBack is true iff currentIndex > 0
- canGoForward is true iff currentIndex < history.length - 1
UI must disable buttons accordingly.
