# Phase 6A.1 Remaining Dark Safety Blockers Report

## 1. Status

**Status: COMPLETE**

Date recorded from current repo session context: **2026-09-01**.

Phase 6A.1 completed the narrow remediation pass for the two additional Dark-safety blockers discovered after Phase 6A. Dark runtime remains disabled.

## 2. Files Changed

- `src/modules/statistic/components/fund-balance-card.tsx`
- `src/modules/travel-activity/components/travel-activity-list.tsx`
- `docs/palette/Phase6A1RemainingDarkSafetyBlockers.Report.md`

No runtime/theme activation files were changed:

- `package.json`
- `src/app/providers.tsx`
- `src/app/layout.tsx`

## 3. Blocker Confirmation Before Editing

Confirmed current-source failure class in both target files before editing:

```text
semantic surface becomes dark
+ hardcoded Light-oriented neutral consumer remains
= unreadable content
```

Confirmed blockers:

- `src/modules/statistic/components/fund-balance-card.tsx`
  - semantic shared `Card`
  - `text-slate-950` heading
  - `text-slate-700` warning/supporting copy
- `src/modules/travel-activity/components/travel-activity-list.tsx`
  - semantic shared `Card` / shared `Button` usage paths with hardcoded neutral consumers
  - `text-slate-950`, `text-slate-800`, `text-slate-700`, `text-slate-600`, `text-slate-500`, `text-slate-400`
  - `border-slate-200`, `border-slate-300`, `bg-slate-50`, `bg-slate-100`, `bg-white`

No adjacent dependency edits were required.

## 4. FundBalanceCard Remediation

File:

- `src/modules/statistic/components/fund-balance-card.tsx`

Applied:

- heading
  - `text-slate-950` → `text-[var(--color-text-primary)]`
- warning/supporting copy
  - `text-slate-700` → `text-[var(--color-text-secondary)]`

Preserved:

- warning semantic meaning
  - existing warning border/icon/background treatment remains warning-semantic
- metric structure / business logic
  - unchanged

Result:

- the statistic blocker no longer depends on Light-only dark text inside a semantic `Card`.

## 5. TravelActivityList Remediation

File:

- `src/modules/travel-activity/components/travel-activity-list.tsx`

Applied neutral-role remaps only where they were part of the unreadability class:

- empty state
  - `border-slate-200 bg-slate-50 text-slate-600` → semantic border/surface/text
- inactive day filter buttons
  - `bg-slate-100 text-slate-700 hover:bg-slate-200` → semantic surface/text hover roles
- insight card copy
  - `text-slate-950 / 600 / 500` → semantic text roles
- day-group supporting subtitle
  - `text-slate-500` → `text.muted`
- timeline time label
  - `text-slate-800` → `text.primary`
- default activity node
  - `border-slate-300 bg-white` → semantic border/surface
- past/default timeline cards
  - `border-slate-200 bg-white/90 text-slate-500` and `bg-white` → semantic border/surface/text roles
- "Tiếp theo" neutral pill
  - `bg-slate-100 text-slate-700` → semantic subtle surface + secondary text
- activity title/meta/note/icon neutrals
  - `text-slate-950 / 700 / 600 / 500 / 400` → semantic text roles

Preserved intentionally:

- brand/interaction accents using `--color-primary`
- selection state and click/keyboard behavior
- category/domain presentation semantics
- existing custom shadow recipes and white-mixed brand washes where they did **not** create unreadable content

Result:

- the representative Travel blocker no longer depends on Light-only neutral content inside the blocking interaction path.

## 6. Residual Non-Goals Preserved

Left untouched on purpose because they are not the confirmed blocker class:

- no Dark runtime enablement
- no `next-themes`
- no global surface tuning
- no broader Statistic or Travel migration
- no repository-wide `slate-*` cleanup
- no business/data/permission changes

Residual target-file occurrences after remediation are limited to:

- `bg-white` on the "next" activity node
  - small accent/detail treatment, not unreadable content
- raw rgba shadow values / `color-mix(...)`
  - visual debt only, not a Dark readability blocker

## 7. Representative Safety Reassessment

Reassessed against the previously flagged blocker set:

| Area | Phase 6A status | Phase 6A.1 status | Notes |
|---|---|---|---|
| Statistic / `FundBalanceCard` path | `BROKEN` | `SAFE` | semantic Card text mismatch removed |
| Travel / `TravelActivityList` path | `BROKEN` | `SAFE` | hardcoded neutral consumer mismatch removed |

Working conclusion for this remediation step:

- no remaining **known** `BROKEN` surfaces from the Phase 6A post-fix reassessment
- broader app-wide Dark visual quality is still unreviewed and remains out of scope

## 8. Verification

Performed:

- source confirmation of both reported blockers before editing
- scoped post-fix pattern scan in the two target files
- `npm run build` — **PASS**
- `npm run lint` — **FAIL (baseline unchanged: 6 errors / 17 warnings)**

Lint baseline remained in unrelated files:

- `src/modules/expense/components/timeline-list.tsx`
- `src/modules/today/components/today-progress-summary.tsx`
- `src/modules/todo/hooks/use-attention-todos.ts`
- `src/modules/todo/hooks/use-todos-by-milestone.ts`

No new Phase 6A.1 lint errors were introduced.

## 9. Phase 6B Readiness

**READY FOR PHASE 6B RETRY**

Reason:

- the only two additional concrete Dark-safety blockers discovered after Phase 6A were remediated in this pass
- Dark runtime itself is still disabled and must be retried separately in Phase 6B
