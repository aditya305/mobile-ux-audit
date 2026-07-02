# UX heuristics reference

Ground findings in recognized heuristics so the audit is defensible, not just opinion. Cite
the relevant heuristic in each finding when useful.

## Nielsen's 10 usability heuristics
1. **Visibility of system status** — keep users informed (loading, progress, confirmations).
2. **Match between system and real world** — plain language, familiar concepts, logical order.
3. **User control and freedom** — clear exits, undo/redo, cancel; no dead ends.
4. **Consistency and standards** — follow platform + internal conventions.
5. **Error prevention** — confirm destructive actions, constrain inputs, good defaults.
6. **Recognition rather than recall** — show options; don't make users remember.
7. **Flexibility and efficiency** — shortcuts, autofill, remembered choices for repeat users.
8. **Aesthetic and minimalist design** — no clutter; every element earns its place.
9. **Help users recognize, diagnose, recover from errors** — plain-language errors + a fix path.
10. **Help and documentation** — discoverable, task-focused help when needed.

## Mobile-specific principles
- **Thumb reachability** — primary actions within easy thumb reach; avoid top-corner criticals.
- **One primary action per screen** — make the main action obvious.
- **Forgiving input** — large targets, generous hit areas, undo over confirm where possible.
- **Fast perceived performance** — skeletons/optimistic UI beat spinners on blank screens.
- **Respect the system** — dark mode, dynamic type, reduce-motion, system back, safe areas.
- **Offline & flaky networks** — degrade gracefully; never leave the user stuck on a spinner.

## Accessibility standards (WCAG-aligned, mobile)
- **Contrast:** ≥ 4.5:1 body text, ≥ 3:1 large text (≥ 18pt or 14pt bold) and UI components.
- **Target size:** ≥ 44×44pt (iOS) / 48×48dp (Android); WCAG 2.2 min 24×24 CSS px with spacing.
- **Labels:** all non-text controls have text alternatives.
- **Don't rely on color alone** to convey meaning.
- **Support assistive tech:** screen readers, switch control, font scaling.

## Common mobile UX anti-patterns to flag
- Blank screen while loading (no skeleton/spinner).
- No empty state ("0 results" on a bare screen).
- Errors shown as raw codes or silently swallowed.
- Placeholder text used as the only label (disappears on input).
- Tiny icon buttons with no padding/hit area.
- Text clipped when font size increased.
- Content hidden behind the keyboard.
- Content under the notch / home indicator / status bar.
- Destructive action with no confirmation or undo.
- Inconsistent components across screens.
