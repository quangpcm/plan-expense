# Phase 4 App Shell / Navbar Visual Pilot Report

## 1. Status

**Status: COMPLETE**

Phase 4 is implemented for the intended Light-only shell pilot scope.

Date recorded from current repo session context: **2026-08-28**.

## 2. Files Changed

- `src/shared/components/layout/app-shell.tsx`
- `src/shared/components/layout/app-header.tsx`
- `src/shared/components/layout/app-bottom-nav.tsx`
- `src/shared/components/layout/account-menu.tsx`
- `docs/palette/Phase4AppShellNavbarVisualPilot.Report.md`

No `src/modules/**` product surface migration was performed.

## 3. Shell Classification

- `AppShell` — `B/C`
  - needed semantic shell-page remap
  - needed a small shell-only loading-overlay correction away from a Light-only literal rgba
- `AppHeader` — `B/C`
  - structure and active underline pattern were already correct
  - needed semantic remap from legacy aliases to approved shell roles
  - needed a lighter inactive/hover hierarchy for shell chrome
- `AppBottomNav` — `B/C`
  - structure, safe-area behavior, and compact selected-state grammar were already correct
  - needed semantic remap from legacy aliases to approved shell roles
- `AccountMenu` — `A/B`
  - menu primitive inheritance was already correct after Phase 3
  - only trigger integration and local text aliases were adjusted
- `Authenticated layout` — `A`
  - no change required; it already delegates to `AppShell`
- Product/domain page internals — `D`
  - intentionally deferred and untouched

## 4. Page Surface

- `AppShell` now establishes shell-level page background with `--color-surface-page`
- no page gradient was introduced or restored
- route-transition overlay no longer uses a hardcoded Light rgba; it now derives from the semantic page surface

## 5. Desktop Header

- header surface now uses `--color-surface-default`
- header divider now uses `--color-border-subtle`
- header chrome text now resolves through `--color-text-primary`
- no header shadow was added
- header was not recolored as a Violet surface

## 6. Desktop Navigation

- active text remains `--color-brand-primary`
- active underline pattern is preserved
- inactive text now uses `--color-text-secondary`
- hover text now strengthens to `--color-text-primary`
- no pill, glow, tinted block, or information-architecture change was introduced

## 7. Mobile Bottom Navigation

- bottom nav surface now uses `--color-surface-default`
- top divider now uses `--color-border-subtle`
- active icon/text remains `--color-brand-primary`
- inactive icon/text now uses `--color-text-secondary`
- hover strengthens to `--color-text-primary`
- compact selected state and safe-area behavior were preserved
- no selected background fill was added

## 8. Account / Notification Integration

- `AccountMenu` trigger now uses semantic text, subtle-surface hover, and explicit focus-ring offset against the shell surface
- account identity text inside the menu now uses `text.primary` / `text.secondary`
- menu structure, logout behavior, and dropdown primitive internals were unchanged
- notification bell placement/behavior was not changed in this phase

## 9. Semantic Token Usage

Touched shell files use approved generic semantics only:

- `surface.page`
- `surface.default`
- `surface.subtle`
- `text.primary`
- `text.secondary`
- `brand.primary`
- `border.subtle`
- `focus.ring`

Verification for touched shell files:

- no private `--gp-*` usage
- no deprecated `--color-accent`
- no new raw Option D hex values
- no Dark runtime/provider/package changes
- no product/module migration

Engineering verification:

- `npm run build` — **PASS**
- `npm run lint` — **FAIL (existing 6 errors / 17 warnings outside Phase 4 shell scope)**

The lint findings remain in:

- `src/modules/expense/components/timeline-list.tsx`
- `src/modules/today/components/today-progress-summary.tsx`
- `src/modules/todo/hooks/use-attention-todos.ts`
- `src/modules/todo/hooks/use-todos-by-milestone.ts`
- plus unrelated warnings in other product files

## 10. Explicitly Deferred

- Dark runtime enablement
- `next-themes` / `ThemeProvider`
- dedicated `nav.*` token family
- product/domain surface migration in `src/modules/**`
- migration of remaining product/domain `var(--color-primary)` consumers
- Travel / Wedding / Debt / Finance / Today surface redesign
- notification content/logic changes
- account menu behavior or structure changes
- route-loading-screen component visual redesign beyond the shell overlay wrapper
