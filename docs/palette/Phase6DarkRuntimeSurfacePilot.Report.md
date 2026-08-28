# Phase 6 Dark Runtime + Dark Surface Pilot Report

## 1. Status

**Status: STOP / BLOCKED**

Date recorded from current repo session context: **2026-08-28**.

Phase 6 was assessed and partially prototyped locally, but **was not shipped** because enabling global runtime Dark Mode would make representative non-pilot pages unreadable, not merely visually degraded.

## 2. Files Changed

- `docs/palette/Phase6DarkRuntimeSurfacePilot.Report.md`

No runtime/theme code changes were kept in the application source after the safety assessment.

## 3. Runtime Theme Architecture

Assessed target architecture:

- provider: `next-themes` `ThemeProvider`
- attribute mode: `class`
- default theme: `system`
- system support: `enableSystem`
- persistence mechanism: standard `next-themes` local persistence
- hydration treatment: `suppressHydrationWarning` on `<html>` only

This architecture remains the approved direction, but it was **not left enabled** because the global safety gate failed.

## 4. Theme Initialization / Persistence

Evaluated approach:

- first load would resolve from system preference
- manual override would support `system | light | dark`
- persistence would rely on `next-themes`, not Firestore or profile schema

This was intentionally **not shipped** pending non-pilot-page safety.

## 5. Browser Theme Color

Evaluated safe browser-chrome strategy:

- light media query → `#f7f8fc`
- dark media query → `#101525`

This was also **not shipped**, because runtime Dark itself was blocked.

## 6. Dark Semantic Mapping Changes

No semantic token mapping changes were kept.

| Semantic Role | Before | After | Reason |
|---|---|---|---|
| none shipped | — | — | Global Dark runtime blocked before semantic tuning could be safely released |

## 7. App Shell Dark Pilot

Assessment only:

- shell token architecture is close to ready
- `AppShell`, `AppHeader`, `AppBottomNav`, and `AccountMenu` already consume semantic roles correctly after Phases 4–5
- the shell itself is **not** the blocker

Known shell-adjacent note:

- `route-loading-screen.tsx` still contains Light-only visual assumptions, but this is a **contained follow-up**, not the global blocker

## 8. Shared Primitive Dark Pilot

Assessment only:

- Phase 3 primitives are structurally positioned for Dark runtime because they mostly consume semantic tokens
- `Button`, `Card`, `DropdownMenu`, `DropdownSelect`, overlay primitives, `Skeleton`, `Avatar`, `Switch`, `PageHeader`, `ErrorState`, and `EmptyState` are directionally ready for pilot tuning
- `PhotoPreview` remains an intentional immersive exception, not a blocker

Primary shared-layer risk discovered:

- the shared `Card` now darkens correctly under semantic runtime
- many non-pilot consumers still place `text-slate-*` content inside that Card
- that consumer mismatch is what turns several real pages from “degraded” into “broken”

## 9. Today Dark Pilot

Assessment:

- Today remains the strongest Dark pilot candidate
- after Phase 5, Today has `0` generic legacy `--color-primary` / `--color-accent` consumers in its own scope
- row/title/metadata/surface/focus roles are already semantic

Dark-specific product note:

- Today Todo category chips still need **local** dark-aware category tint treatment if/when runtime Dark is enabled
- that is acceptable as a product-specific exception and is **not** the blocking issue

## 10. Brand Interaction Validation

No runtime visual validation was shipped.

What is already known from the architecture:

- Dark `brand.primary` target remains `violet-10` / `#6459E1`
- hover target remains `violet-8`
- active target remains `violet-7`

No released change was made to those mappings in this phase.

## 11. Surface / Border / Elevation Validation

No released Dark tuning was kept.

Current assessment:

- provisional Dark surfaces in `globals.css` remain the correct place for future tuning
- border and luminance hierarchy should still be validated in a future pilot
- overlay shadow/backdrop tuning is still pending real runtime release

## 12. Status / Product-Specific Color Findings

Status:

- no status architecture changes were shipped
- Dark status tokens were **not** expanded to Radix Green/Amber/Red/Blue in this phase

Product-specific findings:

- Today Todo category colors remain product-specific, not generic semantic-token debt
- expense remains distinct from danger
- plan-type and other domain palettes remain out of scope

## 13. Unmigrated Page Safety Assessment

| Area | SAFE / DEGRADED / BROKEN | Notes |
|---|---|---|
| App shell chrome (`AppHeader`, `AppBottomNav`, `AppShell`) | `SAFE` | semantic shell roles already in place; not the blocker |
| Shared primitives in isolation | `SAFE` | mostly semantic after Phase 3; pilot tuning still needed but architecture is sound |
| Today | `SAFE` | best-prepared full product surface for Dark pilot |
| Plans list (`src/app/(authenticated)/plans/page.tsx`) | `DEGRADED-BUT-USABLE` | mixed semantic + Light-only product cards; likely visually inconsistent, but not obviously unreadable from current composition |
| Profile (`src/app/(authenticated)/profile/page.tsx`) | `BROKEN` | page-level `text-slate-950` / `text-slate-600` render directly on dark page surface with no compensating light card |
| Plan detail / Planning (`src/modules/planning/components/planning-tab.tsx`) | `BROKEN` | semantic `Card` darkens under runtime while child content still uses hardcoded `text-slate-*`; example empty-state card would become dark background with dark text |
| Settlement (`src/modules/settlement/components/settlement-list.tsx`) | `DEGRADED-BUT-USABLE` | many rows remain hardcoded white/slate pairs, so readability likely survives but Dark UI becomes visually incoherent |
| Statistic / Finance-adjacent summary (`src/modules/statistic/components/category-breakdown.tsx`) | `BROKEN` | outer shared `Card` would darken while heading/body content still uses `text-slate-950` / `text-slate-600` |
| Wedding surfaces | `DEGRADED-BUT-USABLE` | many white/slate product-owned surfaces would stay readable but remain Light-styled against dark shell |
| Travel surfaces outside Today | `DEGRADED-BUT-USABLE` | evidence suggests many hardcoded light surfaces; visually inconsistent, but no concrete unreadable example was required to block on their own |
| Debt / broader finance domains | `DEGRADED-BUT-USABLE` | many product-owned hardcoded light surfaces remain; not yet piloted for Dark |

Blocking conclusion:

- **Profile**
- **Planning / Plan detail**
- **Statistic / Finance summaries**

already provide enough evidence that global Dark runtime would break real primary workflows.

## 14. Residual Theme-Breaking Assumptions

Representative blocking patterns outside the pilot scope:

- hardcoded `text-slate-950` / `text-slate-600` on page surface
- hardcoded `text-slate-*` content inside shared `Card`
- mixed Light-only `bg-white`/`bg-slate-*` product surfaces across non-pilot modules

Representative examples:

- `src/app/(authenticated)/profile/page.tsx`
- `src/modules/planning/components/planning-tab.tsx`
- `src/modules/statistic/components/category-breakdown.tsx`

Within the intended pilot scope itself, the remaining assumptions are smaller and manageable:

- `route-loading-screen.tsx` still has Light-only shell visuals
- `Today` category tints need local dark-aware treatment when runtime Dark is eventually enabled

## 15. Explicitly Deferred

- actual global runtime enablement with `next-themes`
- browser theme-color media strategy shipping
- Dark shell visual tuning release
- Dark shared-primitives visual tuning release
- Today Dark local category-tint treatment
- Radix Dark status palette sourcing/mapping
- migration of non-pilot product pages
- Travel / Wedding / Finance / Debt / Statistics Dark migration
- plan-type Dark treatment
- unrelated lint debt

## 16. Verification

Performed:

- read/audited the Phase 1 / 3 / 4 / 5 reports and current token architecture
- audited `src/app/layout.tsx`, `src/app/providers.tsx`, and `package.json`
- installed `next-themes` locally for prototype evaluation, then **rolled the dependency back out** when the safety gate failed
- inspected representative non-pilot pages and modules for runtime-Dark safety
- `npm run build` after rollback — **PASS**
- `npm run lint` after rollback — **FAIL (baseline unchanged: 6 errors / 17 warnings)**

No runtime theme code remains enabled in the repo after this assessment.

## 17. User Visual Review Checklist

- Confirm the blocker examples if you want a second pass before approving any rollout strategy:
  - `Profile`
  - `Plan detail / Planning`
  - `Statistic / category breakdown`
- Confirm whether the next safe step should be:
  - widen migration scope to make representative non-pilot pages Dark-safe, then re-attempt Phase 6
  - or adopt an explicitly limited rollout strategy for Dark that product approves in advance
