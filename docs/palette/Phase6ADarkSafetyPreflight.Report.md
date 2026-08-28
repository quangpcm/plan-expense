# Phase 6A Dark Safety Preflight Report

## 1. Status

**Status: COMPLETE**

Date recorded from current repo session context: **2026-08-28**.

Phase 6A completed the intended hard-scope safety migration for the three confirmed Phase 6 blockers. However, the representative reassessment found additional primary-workflow `BROKEN` surfaces outside the hard scope, so Phase 6B is **not yet ready**.

## 2. Files Changed

- `src/app/(authenticated)/profile/page.tsx`
- `src/modules/planning/components/planning-tab.tsx`
- `src/modules/statistic/components/category-breakdown.tsx`
- `docs/palette/Phase6ADarkSafetyPreflight.Report.md`

No runtime/theme files were changed:

- `package.json`
- `src/app/providers.tsx`
- `src/app/layout.tsx`

## 3. Confirmed Phase 6 Blockers

Phase 6 established these concrete blockers:

- `Profile`
  - direct `text-slate-950` / `text-slate-600` on page surface
- `Planning / Plan detail`
  - generic control/empty-state content still depended on Light-only neutral assumptions
- `Statistic / CategoryBreakdown`
  - shared semantic `Card` containing hardcoded `text-slate-*`

Failure class:

```text
semantic surface becomes dark
+ hardcoded Light text stays dark
= unreadable UI
```

## 4. Profile Safety Migration

File:

- `src/app/(authenticated)/profile/page.tsx`

Safety fixes:

- display name
  - `text-slate-950` → `text-[var(--color-text-primary)]`
- email / supporting copy
  - `text-slate-600` → `text-[var(--color-text-secondary)]`
- version/footer metadata
  - `text-slate-400` → `text-[var(--color-text-muted)]`

Result:

- Profile header content no longer depends on Light-only dark text against the future dark page surface.

## 5. Planning Safety Migration

File:

- `src/modules/planning/components/planning-tab.tsx`

Safety fixes:

- segmented-control shell
  - `bg-slate-100` → `surface.subtle`
- selected toggle
  - `bg-white text-slate-950` → `surface.default + text.primary`
- inactive toggle
  - `text-slate-600` → `text.secondary`
- milestone-empty-state Card override
  - `border-slate-200 bg-slate-50` → `border.subtle + surface.subtle`
- milestone-empty-state text
  - `text-slate-600` → `text.secondary`

Result:

- the blocker path no longer depends on Light-only neutral text/surface assumptions inside the scoped Planning surface.

## 6. Statistic Safety Migration

File:

- `src/modules/statistic/components/category-breakdown.tsx`

Safety fixes:

- heading
  - `text-slate-950` → `text.primary`
- row chrome
  - `border-slate-200 bg-white` → `border.default + surface.default`
- row label
  - `text-slate-900` → `text.primary`
- row amount
  - `text-slate-600` → `text.secondary`
- empty state
  - `border-slate-200 bg-slate-50 text-slate-600` → semantic border/surface/text roles

Result:

- `CategoryBreakdown` no longer contains the specific semantic-Card + dark-slate-text mismatch that blocked Phase 6.

## 7. Semantic Consumer Fixes

Applied semantic role remaps:

- `text.primary`
- `text.secondary`
- `text.muted`
- `surface.default`
- `surface.subtle`
- `border.subtle`
- `border.default`

No private `--gp-*` variables were introduced.

No `dark:*` utilities were introduced.

## 8. Product / Domain Colors Preserved

Intentionally preserved:

- category icon colors in `CategoryBreakdown`
  - product/domain categorical meaning, not generic neutral debt
- planning FAB brand styling
  - interaction/brand treatment, not a readability blocker
- existing status/alert colors
  - semantic meaning preserved; not normalized to brand

## 9. Residual Light-Only Assumptions

Inside touched files, remaining non-semantic occurrences are limited to:

- `src/modules/planning/components/planning-tab.tsx`
  - one `rgba(...)` brand shadow on the create-milestone FAB

Classification:

- not a generic readability blocker
- does not create dark-text-on-dark-surface failure
- acceptable to defer to later Dark visual polish

## 10. Representative Global Safety Reassessment

| Area | Before | After | Notes |
|---|---|---|---|
| App shell | `SAFE` | `SAFE` | unchanged; already semantic after Phase 4 |
| Today | `SAFE` | `SAFE` | unchanged; strongest pilot surface |
| Profile | `BROKEN` | `SAFE` | direct page-level text mismatch removed |
| Planning / Plan detail | `BROKEN` | `SAFE` | scoped generic control/empty-state mismatch removed |
| Statistic | `BROKEN` | `BROKEN` | `CategoryBreakdown` fixed, but additional statistic surfaces still show the same mismatch pattern |
| Plans | `DEGRADED-BUT-USABLE` | `DEGRADED-BUT-USABLE` | unchanged; still largely readable transitional Light islands |
| Settlement | `DEGRADED-BUT-USABLE` | `DEGRADED-BUT-USABLE` | unchanged; readable but visually transitional |
| Wedding | `DEGRADED-BUT-USABLE` | `DEGRADED-BUT-USABLE` | unchanged; many Light-styled readable panels remain |
| Travel | `DEGRADED-BUT-USABLE` | `BROKEN` | representative audit found additional semantic-Card + hardcoded-slate mismatch in `travel-activity-list.tsx` |
| Debt / Finance | `DEGRADED-BUT-USABLE` | `BROKEN` | representative audit found additional semantic-Card + hardcoded-slate mismatch in statistic/finance-adjacent surfaces |

## 11. Remaining BROKEN Areas

Representative additional blockers found after the hard-scope fixes:

- `src/modules/statistic/components/fund-balance-card.tsx`
  - shared semantic `Card`
  - `text-slate-950` heading
  - warning copy uses `text-slate-700`
  - same consumer-mismatch class as the original statistic blocker
- `src/modules/travel-activity/components/travel-activity-list.tsx`
  - multiple shared semantic `Card` consumers still use `text-slate-950` / `text-slate-600` / Light-only mixed neutrals
  - enough to classify representative Travel as `BROKEN` for future global Dark runtime

Per Phase 6A expansion rule, these were **not** silently migrated in this pass.

## 12. Explicitly Deferred

- `next-themes` / runtime Dark activation
- browser `themeColor` changes
- global Dark surface tuning
- shared-primitives Dark pilot
- Today Dark local category-tint treatment
- broader Statistics Dark migration
- broader Travel Dark migration
- Wedding / Settlement / Plans visual Dark cleanup
- any repository-wide `slate-*` sweep
- unrelated lint debt

## 13. Verification

Performed:

- scoped pattern scan in the three touched blocker files
- representative post-fix audit across Profile / Planning / Statistic / Plans / Settlement / Wedding / Travel / Debt-Finance surfaces
- `npm run build` — **PASS**
- `npm run lint` — **FAIL (baseline unchanged: 6 errors / 17 warnings)**

Lint status:

- no new Phase 6A lint errors introduced
- existing baseline errors remain in Expense / Today / Todo hooks and unrelated modules

## 14. Phase 6B Readiness

**NOT READY FOR PHASE 6B**
