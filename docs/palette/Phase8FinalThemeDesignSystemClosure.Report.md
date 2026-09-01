# Phase 8 Final Theme & Design System Closure Report

## 1. Final Status

**DESIGN SYSTEM THEME INITIATIVE COMPLETE — PRODUCTION READY.**

Design System V2, Option D, and the semantic Light/Dark architecture (`next-themes`,
`attribute="class"`, `defaultTheme="system"`, `enableSystem`) are the production baseline. This
phase found and fixed real regressions left by the uncommitted Phase 7 migration, finalized the
governance docs, reconciled internal spec contradictions, and re-verified build/lint/test/diff.

## 2. Initiative Summary

Phases 1–7 built the architecture (Option D foundation → semantic tokens → theme-safe primitives →
App Shell pilot → Today pilot → Dark runtime → full product migration). Entering this phase, the
repository's last **committed** state was `1b4845b "phase 6B"` — the entire Phase 7 full-product
migration (100 files) plus a first pass at Phase 8 governance docs was sitting **uncommitted** in
the working tree, undocumented by any report. Phase 8 work here:

1. Audited that uncommitted state (two research passes: one over governance docs, one grepping the
   live repo for legacy patterns and classifying flagged usages by reading real component context).
2. Found and fixed **3 real visual regressions** introduced by Phase 7's mechanical migration (not
   pre-existing debt — see §11).
3. Cleaned 4 more files of duplicated/ad hoc hardcoded color that had no Dark handling (generic
   debt, not product-owned).
4. Reconciled `ColorArchitecture.Spec.md`'s historical PROVISIONAL/PENDING markers against the
   Phase 7/8 reality, and was honest where something is still genuinely open (status AA contrast)
   rather than marking it resolved.
5. Closed governance gaps (accessibility STOP condition, tracked AA debt entry).
6. Re-verified build/lint/test/`git diff --check` against the known baselines.

No information architecture, navigation, business logic, permissions, or Firestore model changes
were made. This was a closure/cleanup pass, not a redesign.

## 3. Files Changed

### Visual / Foundation
- `src/modules/storage/components/attachment-picker.tsx` — fixed white-on-white delete-photo scrim.
- `src/shared/components/media/thumbnail-compact.tsx` — fixed white-on-white "+N more" scrim.
- `src/modules/wedding-guest/components/wedding-guest-group-nav.tsx` — fixed invisible active-chip
  state (×2) and a broken hover token.
- `src/modules/milestone/components/milestone-list.tsx` — fixed invisible ghost-button hover on
  selected milestone cards (×3), aligned to the sibling `milestone-timeline-board.tsx` pattern.
- `src/modules/plan/constants/overview-widget-registry.tsx` — fixed 2 invisible progress-bar fills
  (fill color equalled track color), gave 3 progress tracks a visible background, made the Travel
  hero gradient Dark-aware, replaced a bright fixed white border with a token-based one.

### Legacy Cleanup
- `src/modules/todo/components/todo-detail-view.tsx` — 12 hardcoded blue vendor-info hex values →
  `--color-info` / `--color-info-soft` tokens (no Dark handling before).
- `src/modules/todo/components/todo-milestone-card.tsx` — 8 duplicated hex values → same info
  tokens; "done" toggle now uses `--color-success` instead of a hardcoded `emerald-500` that
  contradicted the token already used two lines above it in the same file.
- `src/modules/wedding-guest/components/wedding-guest-create-form.tsx` — hardcoded peach "possible
  duplicate guest" warning card → `--color-warning` / `--color-warning-soft`.

### Governance
- `docs/palette/ColorArchitecture.Spec.md` — reconciled §9/§16/§18 (surface rows relabeled LOCKED,
  status rows relabeled LOCKED-values-with-open-AA-item instead of PENDING, §18 items marked
  resolved/still-open accurately).
- `docs/design-system/ExceptionsAndDebt.md` — added deferred item 11 (status token AA contrast /
  role-classification gap).
- `docs/design-system/FeatureImplementationRules.md` — added an accessibility-conflict STOP
  condition.

### Other
- `docs/palette/Phase8FinalThemeDesignSystemClosure.Report.md` — this report (new).

### Carried forward from the pre-existing uncommitted state (not re-done, verified sound)
`docs/design-system/README.md`, `docs/design-system/VisualRules.md`, and 96 product/component
files from the Phase 7 migration — see `docs/palette/Phase7FullProductThemeMigration.Report.md`
(also uncommitted, written by that earlier work) for its own file list. This report does not
restate that work; it audited it, fixed what was broken, and left the rest alone.

## 4. Final Color Architecture

Unchanged from the locked spec: Approved palette → private `--gp-violet-*`/`--gp-gray-*` foundation
scales (zero leakage into component code, confirmed by repo-wide grep) → semantic `surface.*` /
`text.*` / `border.*` / `brand.*` / `status.*` / `focus.*` / `overlay.*` tokens → shared primitives
(`src/shared/components/ui/*`, 35 files) → product/domain code. `next-themes` remains the sole
runtime; no second theme provider, no Firestore preference, no parallel JS color map exists.

## 5. Final Light Theme

Clean, cool-neutral, Option D as designed. No regression toward generic white-SaaS gray panels was
found. The one Light-specific defect found this phase (§11) was components rendering literally
invisible content in Light (white text/fill on a white token), not a stylistic regression —
inherited from the migration mechanically choosing the wrong semantic token, not a Light-theme
design flaw.

## 6. Final Dark Theme

`#101525` page background remains the anchor; surface hierarchy (`#181D23` → `#1F252E` → `#232C37`)
is unchanged from the locked spec. No near-black-everything, no Violet wash, no glowing borders were
found in the audit. Dark surface rows in `ColorArchitecture.Spec.md` §9 are now formally relabeled
LOCKED (they were still marked PROVISIONAL in the spec text despite being implemented and reviewed
— a documentation gap, not an implementation gap; closed this phase).

## 7. Surface / Text / Border Polish

No surface-hierarchy, text-hierarchy, or border-hierarchy defects were found beyond the specific
token-misuse bugs in §11 (all now fixed). `surface.raised`/`surface.subtle` intentionally sharing a
Dark value, and `text.muted`/`text.secondary` intentionally sharing a value, remain as documented in
the spec — both are deliberate, not accidental duplication.

## 8. Brand Interaction Finalization

`brand.primary/-hover/-active` mappings are unchanged from the Phase 1 spec (Light `violet-9/10/11`,
Dark `violet-10/8/7` — the non-sequential Dark ladder is intentional, documented, AA-driven). No
evidence surfaced this phase that these need retuning. One brand-adjacent fix: the wedding-guest
active-filter-chip regression (§11) is now a correct `brand.primary` solid treatment, consistent
with "active navigation/selected interaction = brand."

## 9. Status Architecture

Values are final and Radix-sourced (Light pre-existing, Dark Green/Amber/Red/Blue). **Not fully
finalized**: the §8 consumer role-classification (text vs. icon vs. fill vs. border vs. chart) was
never performed to completion. A minimal `--color-status-*` (text/icon) vs. `--color-status-*-surface`
(soft background) split exists, but ~60 call sites still use a raw status token directly as
normal-size (12–14px) text, inheriting the pre-existing Light AA shortfall (`success`/`income`
≈3.6–3.8:1, `warning` ≈3.0:1, `expense` ≈3.5:1, all below 4.5:1). This is **not treated as resolved**
in this report — see §16 and `ExceptionsAndDebt.md` item 11. Fixing it requires a product/
accessibility decision (new hex vs. formal role split vs. accepted exception), which is out of
scope for a closure pass to invent unilaterally.

## 10. Product / Domain Colors

### Plan-Type
Confirmed zero `planType` references inside `src/shared/components/ui/`. Gradients and badge colors
remain product-owned in `plan-card-visuals.ts`/`plan.constants.ts`, both already carrying explicit
`dark:` pairs. **Minor documented inconsistency, not fixed**: 7 of 8 plan types' `accentTextClassName`
hardcode the identical `#0c48d7` (only `debt` differs, `#9a3412`) — functions correctly in both
themes, just undermines the "distinct accent per type" framing. Low-risk, pre-existing (not
introduced by this initiative); left alone per the "don't redesign Plan-Type for novelty" rule —
flagged here for future evidence-gathering, not fixed today.

### Todo
Category colors (`todo-visual-category.ts`, 16 `dark:` pairs) are correctly product-owned and
already theme-paired — no changes needed. The vendor-info hex duplication (§3, Legacy Cleanup) was
the one real Todo-module defect and is fixed.

### Travel
Activity categories unaffected. The Overview hero widget's gradient and glass border (§3) were
Light-only assumptions baked into a Plan-Type-adjacent widget, now Dark-aware.

### Wedding
Guest category/accent colors unaffected. The group-nav active-chip regression and the
duplicate-guest warning card (§3) are fixed.

### Finance
`income`/`expense` remain a distinct finance-domain family, not silently absorbed into
`status.success`/`status.danger` — confirmed unchanged. They share the same open AA item as status
(§9).

### Charts
`finance-category-donut.tsx` (24 hex, Tailwind-name→hex lookup table) and `rsvp-donut-chart.tsx` (1
hex, deliberately decoupled from `status.danger` per its own inline comment) are legitimate
data-visualization ownership — confirmed by reading both files, not just counting hex.

## 11. Elevation / Shadow Findings

No shadow-family cleanup was needed. `milestone-timeline-board.tsx`'s status-colored `rgba()`
shadows are product-specific layer-relationship shadows (LAYER-RELATIONSHIP), consistent across
themes at low visual risk. No Violet glows found. No obsolete Light-only shadow assumptions found
beyond the gradient/border issues already listed under Product/Domain Colors.

**The three real regressions found and fixed this phase** (all mechanical migration mistakes, not
pre-existing debt, not stylistic decisions):

1. `--color-surface-overlay` (an elevation token — white in Light, dark gray-4 in Dark) was
   substituted for what used to be a literal dark scrim (`bg-slate-950`) in 4 files, paired with
   `text-white`. Result: white-on-white/invisible content in Light mode, in two cases directly
   contradicting the documented media-overlay intentional exception. Fixed by using
   `--color-overlay-backdrop` (the actual scrim token, dark-navy in both themes) for the two media
   overlays, and `--color-brand-primary`/an established sibling-component hover pattern for the two
   navigation/action-button cases.
2. Two progress-bar fills in `overview-widget-registry.tsx` used the identical token as their own
   track (`--color-surface-overlay` on both), making the fill invisible regardless of progress
   percentage. Fixed to match the sibling (working) progress bar's `bg-sky-600` fill.
3. Progress-bar tracks in the same widget used `surface-overlay` (white in Light) as a track color,
   blending into the surrounding white card. Changed to `surface-subtle` for a visible groove.

## 12. Legacy Token Lifecycle

| Token | Final State | Consumers | Reason |
|---|---|---|---|
| `--color-primary` / `-hover` / `-foreground` | REMOVED | 0 (verified) | Fully migrated to `--color-brand-primary` family; only a historical comment references the old name. |
| `--color-accent` / `-soft` | REMOVED | 0 (verified) | Per-consumer triage complete; no single replacement was ever appropriate (conflated ≥4 roles). |
| `--color-brand-accent` | REMOVED | 0 (verified) | Same disposition as `--color-accent`. |
| `--color-background/-foreground/-surface/-surface-soft/-muted/-border/-border-strong` | COMPATIBILITY | Foundation value-holders for `surface.*`/`text.*`/`border.*` | Permanent by design, not debt. |
| `--color-secondary` / `-foreground` | COMPATIBILITY | `Badge` neutral tone | Confirmed legitimate, no semantic alias needed. |
| `--gp-violet-*` / `--gp-gray-*` | PRIVATE FOUNDATION | 0 outside `globals.css` (verified) | Never leaked into shared/product code. |
| `surface.*` / `text.*` / `border.*` / `brand.*` / `focus.*` / `overlay.*` | CANONICAL | Repo-wide | Public semantic contract; Dark rows in the spec formally relabeled LOCKED this phase. |
| `status.*` / `income` / `expense` | CANONICAL VALUES, OPEN ROLE-SPLIT | ~60 direct-text consumers + surface/icon consumers | Values final and Radix-sourced; consumer role-classification and the resulting AA fix are tracked, not invented here. |

## 13. Residual Color Audit

| Pattern | Count | Classification | Action |
|---|---|---|---|
| `text-slate-`/`bg-slate-`/`border-slate-` | 0 | — | None needed. |
| `bg-white` | 3 (1 file: `photo-preview.tsx`, all `bg-white/10`) | INTENTIONAL-EXCEPTION | Media lightbox; documented. |
| `text-white` (component files) | 13 across 7 files | Mixed: mostly INTENTIONAL-EXCEPTION (inverse text on colored/gradient/media surfaces), all previously-GENERIC-DEBT instances fixed this phase | See §11 for what was fixed; remainder verified legitimate. |
| `bg-black`/`text-black` | 3 (1 file: `photo-preview.tsx`) | INTENTIONAL-EXCEPTION | Media lightbox; documented. |
| `--color-primary*`/`--color-accent*` legacy | 1 (comment only) | LEGACY-COMPATIBILITY (historical note) | No live consumers; safe as a comment. |
| `--gp-*` outside `globals.css` | 0 | — | No leakage confirmed. |
| Raw hex outside `globals.css` | 6 files (down from 9) | `layout.tsx`/`manifest.ts` = INTENTIONAL-EXCEPTION (platform constraints); `plan.constants.ts`/`plan-card-visuals.ts` = PRODUCT-SEMANTIC; `finance-category-donut.tsx`/`rsvp-donut-chart.tsx` = DATA-VISUALIZATION | 3 files fully cleaned this phase (`todo-detail-view.tsx`, `todo-milestone-card.tsx`, `wedding-guest-create-form.tsx`); remainder explained, no action. |
| `rgba(` | 16 files | Mostly PRODUCT-SEMANTIC (status/milestone-colored shadows) or LAYER-RELATIONSHIP shadow tints | None required; one Light-only gradient stop fixed (Travel hero, §3). |
| `color-mix(` | 25 files, incl. 4 shared primitives (`button`, `card`, `dropdown-select`, `breadcrumbs`) | SEMANTIC-DERIVED — all 4 shared-primitive instances confirmed mixing a semantic token with `transparent` only, never literal `white`/`black` | No Light-only assumption found; no action needed. |
| `dark:` | 24, only 2 files (`todo-visual-category.ts`, `plan.constants.ts`) | PRODUCT-THEME-PAIR | Both are documented product-category/Plan-Type color families with correct pairs from the start; no generic workaround usage found anywhere in the repo. |

**Unexplained generic theme debt after this phase: 0.** Every remaining residual above is
explained by one of the five allowed classifications; the one item that is genuinely still open
(status AA/role-classification) is tracked as debt, not silently classified away.

## 14. Intentional Exceptions

Unchanged from `ExceptionsAndDebt.md` items 1–7 (legacy `Dialog` in `WeddingGuestImportDialog`,
`BottomSheet` KEEP cases, `TodoNotificationScreen`, `NotificationBadge`, Plan-Type product ownership,
`StatisticOverview`'s green "Tổng thu", media viewer/overlay inverse treatment). All verified still
accurate; none contradicted by this phase's fixes — the media-overlay fixes in §11 in fact *restored*
compliance with exception #7 rather than violating it.

## 15. Resolved Design Debt

- Light-only shared primitives / Dark-runtime absence: confirmed resolved, `next-themes` live.
- Generic primary/accent ambiguity: confirmed resolved, 0 legacy consumers.
- Generic Light islands in vendor-info panels (Todo) and a duplicate-guest warning card (Wedding
  Guest): resolved this phase (§3).
- Dark surface pilot-provisional status: resolved this phase — spec text now matches implementation
  reality (§6, §16 of this report).
- 3 real Phase-7-introduced visual regressions (invisible content in Light): resolved this phase
  (§11) — these were not previously tracked as debt because they were never reported; found via
  direct code audit, not from the prior migration's own verification.

## 16. Remaining Non-Blocking Debt

Carried forward, unchanged, from `ExceptionsAndDebt.md` (Progress primitive, `Button size="icon"`,
TextAction pattern, opportunistic radius cleanup, Todo bell-tone dedup, 2 dead Statistic components,
3 bare backlog entries, Plan-Type token extraction) plus one new item added this phase:

- **Status token AA contrast / role-classification** (new, item 11) — real, evidenced, requires a
  product/accessibility decision, explicitly not resolved by this closure pass.
- **Plan-Type `accentTextClassName` duplication** (§10, not formally added to the registry —
  low-risk enough to note here rather than open a new tracked entry; revisit if a second consumer
  or a visual complaint surfaces).

## 17. Governance Changes

- `docs/design-system/README.md` / `VisualRules.md` / `FeatureImplementationRules.md` already
  carried a Theme-Safe Feature Checklist, an AI Color Workflow, explicit private-foundation and
  `dark:` rules, and STOP conditions from the pre-existing uncommitted work — verified accurate and
  left in place rather than rewritten. One gap closed: an explicit accessibility-conflict STOP
  condition added to `FeatureImplementationRules.md`.
- `docs/palette/ColorArchitecture.Spec.md` reconciled: Dark surface rows and status-value rows no
  longer say PROVISIONAL/PENDING while the Production Baseline Amendment simultaneously claims they
  are final — both now agree, and the one genuinely open item (status AA) is stated as open in both
  places instead of glossed over.
- `docs/design-system/ExceptionsAndDebt.md` gained the new AA-debt entry.

## 18. Rules for New Features

Already documented (verified, not rewritten): reuse shared primitives; generic surface/text/border
use semantic tokens; brand only for interaction/emphasis; product/status/data-viz colors stay in
their own layer; no `--gp-*` in component code; no unexplained raw neutral color; no
`bg-white`/`slate-*`/generic `dark:`; Light and Dark both reviewed before a feature ships. See
`README.md`'s Theme-Safe Feature Checklist for the literal checklist.

## 19. AI Coding Rules

Already documented: classify each color (`GENERIC UI` / `BRAND` / `STATUS` / `PRODUCT-DOMAIN or
DATA VISUALIZATION` / `INTENTIONAL EXCEPTION`) before implementation; `dark:` is normally
disallowed for generic UI; stop and surface a decision before adding a color family, semantic role,
or shared API change; the workflow steps in `FeatureImplementationRules.md` (understand → map to
components → classify color → implement → verify) already cover the READ→CLASSIFY→REUSE/COMPOSE/
PRODUCT-SPECIFIC→IMPLEMENT→VERIFY→REPORT shape this phase's brief asked for.

## 20. Runtime Verification

`next-themes` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`) confirmed as the sole
runtime in `src/app/providers.tsx`; no second provider, no Firestore preference, no parallel JS
color map exists anywhere in the repo. Browser `theme-color` is set per-scheme in `layout.tsx`
(`#F7F8FC` / `#101525`). Not modified this phase; verified correct.

## 21. Visual Verification

No in-session browser automation was available. Per this phase's own instructions, that alone is
not a blocker given Phase 7 already received a full-product manual Light/Dark user visual review.
This phase's own contribution was a direct source-code audit (reading actual component context, not
just grepping for patterns), which is how the 3 real regressions in §11 were found — a class of
defect that a visual pass could plausibly have caught by observation, but that source review caught
with certainty. **USER VISUAL REVIEW RECOMMENDED** specifically for the files touched in §3, since
they were not part of Phase 7's own reviewed scope in the same form.

## 22. Build / Diff / Lint / Test

- `npm run build` — **PASS**, no TypeScript errors, all 14 routes generated.
- `git diff --check` — **PASS**, exit 0, no whitespace errors.
- `npm run lint` — **6 errors, 17 warnings** — identical to the known pre-Phase-8 baseline. All are
  pre-existing (`react-hooks/rules-of-hooks` in `today-progress-summary.tsx`, `react-hooks/set-
  state-in-effect` in two Todo hooks, `react-hooks/incompatible-library` warnings for `watch()`, and
  unused-var warnings) — **0 new lint regressions**.
- `npm test` — **322 passing, 1 pre-existing failure** — identical to the known baseline.
  `tests/unit/today-priority.test.ts` fails on a date-sensitive fixture ("Trễ 6 ngày" vs. expected
  "Trễ 1 ngày"), unrelated to color/theme work, not touched per this phase's own instructions to
  treat it as separate test debt. **0 new test regressions.**

## 23. Production Readiness

All 20 completion criteria from the Phase 8 brief are met:

1. Phase 7 theme coverage intact — confirmed, extended with 3 regression fixes.
2. Light and Dark visually coherent — confirmed by code audit; no browser pass this session, but not
   required given Phase 7's prior manual approval (see §21 for the one recommended spot-check).
3. Final semantic mappings reflect production reality — spec reconciled this phase.
4. No known primary theme blocker — confirmed (the 3 found regressions are fixed).
5. No unexplained generic theme debt — confirmed, §13.
6. Legacy token lifecycle explicitly decided — §12.
7. Private foundation scales don't leak — confirmed, 0 occurrences outside `globals.css`.
8. Valid product/domain colors preserved — confirmed, §10.
9. Status architecture documented, including its one open item — §9.
10. Plan-Type treatment documented — §10.
11. Intentional exceptions documented — §14.
12. Stale resolved debt removed from governance — confirmed current.
13. Future feature rules include Light/Dark requirements — confirmed present.
14. Claude Code/Codex guidance explicit — confirmed present.
15. Build passes — §22.
16. `git diff --check` passes — §22.
17. No new lint regression — §22.
18. No new test regression — §22.
19. Source-of-truth docs match implementation — reconciled this phase.
20. This closure report exists.

## 24. Final Recommendation

```text
DESIGN SYSTEM THEME INITIATIVE COMPLETE
PRODUCTION READY
```
