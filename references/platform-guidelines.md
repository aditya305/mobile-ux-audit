# Platform guidelines (quick reference)

Apply the conventions of the platform the screen ships on. Flag foreign-feeling patterns.

## iOS — Human Interface Guidelines (HIG)
- **Navigation:** navigation bar with back button (chevron + previous title); tab bar at bottom
  for top-level sections; swipe-from-left-edge to go back.
- **Controls:** system-style buttons, switches (`Toggle`), segmented controls, action sheets for
  choices, alerts for confirmations.
- **Touch target:** ≥ 44×44 pt.
- **Typography:** San Francisco system font; support **Dynamic Type**.
- **Gestures:** swipe-to-delete in lists, pull-to-refresh, edge-swipe back.
- **Feedback:** haptics for meaningful events; respect Reduce Motion.
- **Presentation:** sheets/modals for focused tasks; respect safe areas & home indicator.
- **Dark mode:** support both appearances.

## Android — Material Design
- **Navigation:** top app bar; bottom navigation bar or navigation drawer for top-level; system
  back button/gesture must work everywhere.
- **Controls:** Material buttons (filled/tonal/outlined/text), FAB for the primary action,
  chips, snackbars for transient feedback, dialogs for confirmations.
- **Touch target:** ≥ 48×48 dp.
- **Typography:** Roboto / system font; support font scaling.
- **Feedback:** ripple on touch; snackbar (not toast) for undoable actions.
- **Elevation & motion:** meaningful shadows and Material motion; respect reduce-motion.
- **Theming:** Material 3 dynamic color where appropriate; support dark theme.
- **Edge-to-edge:** handle window insets / system bars.

## Cross-platform notes (React Native / Flutter)
- Prefer platform-adaptive components where the framework offers them (e.g. Flutter
  `Cupertino*` vs `Material*`; RN `Platform.select`).
- Don't ship an iOS-only pattern (e.g. bottom "Done" nav-bar button) unchanged on Android, or a
  Material FAB unchanged on iOS, unless the brand intentionally unifies the design.
- Back behavior: Android has a system back; ensure it's handled. iOS relies on edge-swipe / nav
  back — provide it.
- Keep one design language consistent within a platform.
