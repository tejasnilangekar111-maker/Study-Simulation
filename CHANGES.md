# Changes

## UI improvements — frontend polish pass

Scope: `frontend/src` only (no backend changes). Goal: fix real layout/collision
bugs, bring the UI up to accessibility basics (keyboard focus, contrast), and
smooth out a few rough transitions. All changes verified with `npm run build`
and `npm run lint` (clean).

### 1. Mobile sidebar is now a proper drawer
- `frontend/src/store/uiStore.js` — added `sidebarMobileOpen` state plus
  `toggleSidebarMobile` / `closeSidebarMobile` actions.
- `frontend/src/components/Sidebar/Sidebar.jsx` — rewritten:
  - On screens narrower than `md` (768px), the sidebar is hidden off-canvas
    by default instead of permanently overlaying page content.
  - A hamburger button (top-left) opens it as a slide-in drawer with a dark
    backdrop; tapping the backdrop, the close (X) button, or a nav link
    closes it.
  - Desktop behavior (collapse to a 56px icon rail via the chevron toggle)
    is unchanged.
  - The sidebar now fades out smoothly on focus mode instead of abruptly
    unmounting.

### 2. Sidebar-aware page padding
- `frontend/src/pages/TodoPage.jsx`, `frontend/src/pages/AnalyticsPage.jsx`
  — content left-padding now reads `sidebarCollapsed` from the store
  (`md:pl-24` when collapsed vs `md:pl-72` when expanded) instead of a
  static `pl-[280px]`. Collapsing the sidebar on desktop now actually
  reclaims the freed-up space instead of leaving a dead gap.

### 3. Pomodoro settings panel opens upward
- `frontend/src/components/Pomodoro/PomodoroTimer.jsx` — the work/break
  duration settings panel (gear icon) now expands *above* the timer widget
  instead of below, so it can no longer get clipped off the bottom edge of
  the viewport on short/mobile screens.

### 4. Growth plant repositioned on mobile
- `frontend/src/components/Growth/GrowthPlant.jsx` — raised from `bottom-4`
  to `bottom-24` on small screens (desktop unchanged at `bottom-6`) so it no
  longer horizontally overlaps the Pomodoro timer / sound mixer widgets.
  Also added a hover tooltip explaining what the plant represents.

### 5. Keyboard focus states
Added visible `focus-visible:ring-2` outlines to icon-only buttons that
previously relied on hover-only styling:
- Pomodoro controls (play/pause, skip, settings)
- Sound mixer toggle button and per-channel mute buttons
- Sidebar nav links, collapse/expand toggle, hamburger, close button
- Todo item actions (edit, save, cancel, delete, goal toggle) — the
  hover-revealed action row now also reveals on `focus-within`, so keyboard
  users can actually reach and see these buttons
- Navbar links, landing page "Start Focus Session" CTA, "Back to study
  room" buttons

### 6. Contrast pass
Bumped low-opacity secondary text app-wide for legibility:
`text-offwhite/40` → `/55`, `text-offwhite/50` → `/60` (todo previews, stat
card labels, chart axis labels, quote attribution, etc.).

### 7. Smoother page transitions + nicer loading state
- `frontend/src/App.jsx`:
  - Routes now cross-fade via `AnimatePresence`/`framer-motion` instead of
    hard-cutting between the landing page's warm theme and the in-app cool
    "lofi" theme.
  - `PageLoader` (shown while a lazy route chunk loads) is now a small
    glass-card spinner matching the app's visual style, instead of bare
    text on a flat background.

---

## Files touched
```
frontend/src/App.jsx
frontend/src/store/uiStore.js
frontend/src/components/Sidebar/Sidebar.jsx
frontend/src/components/Pomodoro/PomodoroTimer.jsx
frontend/src/components/Growth/GrowthPlant.jsx
frontend/src/components/SoundMixer/SoundMixer.jsx
frontend/src/components/SoundMixer/SoundSlider.jsx
frontend/src/components/Navbar/Navbar.jsx
frontend/src/pages/LandingPage.jsx
frontend/src/pages/TodoPage.jsx
frontend/src/pages/AnalyticsPage.jsx
```

## Not yet addressed
Flagged during review but out of scope for this pass (kept as future work):
- Two disconnected visual themes (warm "walnut" landing page vs. cool
  "lofi" in-app palette) — the cross-fade (#7) softens the cut but a full
  palette unification would be a larger design decision.
- The AI chat assistant described in `project_details.md` doesn't exist
  in the frontend (`FloatingOrb`/`ChatPanel` components are absent) — a
  documentation/implementation gap, not a UI bug.
