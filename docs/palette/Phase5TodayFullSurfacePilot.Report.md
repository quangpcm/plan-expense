# Phase 5 Today Full-Surface Pilot Report

## 1. Status

**Status: COMPLETE**

Phase 5 is implemented for the intended Today Light-only product-surface pilot scope.

Date recorded from current repo session context: **2026-08-28**.

## 2. Files Changed

- `src/app/(authenticated)/today/page.tsx`
- `src/modules/today/components/today-item-card.tsx`
- `src/modules/today/components/today-context-strip.tsx`
- `src/modules/today/components/today-context-card.tsx`
- `src/modules/today/components/priority-next-card.tsx`
- `src/modules/today/utils/todo-visual-category.ts`
- `docs/palette/Phase5TodayFullSurfacePilot.Report.md`

No shared primitive API, shell/layout file, data hook, repository, or Today summary logic was changed.

## 3. Today Component Classification

| Component | Classification | Before | Action | Result |
|---|---|---|---|---|
| `src/app/(authenticated)/today/page.tsx` | `A/B` | Core page structure already semantic; a few block/divider borders were still heavier than needed for page hierarchy | softened empty/error/completed-section dividers to `border.subtle` | page hierarchy stays calm and semantic without IA change |
| `TodaySectionHeading` | `A/C` | already semantic and product-appropriate | left icon/heading grammar intact | section headings remain calm, information-first |
| `TodayItemCard` | `B/C/E` | row surfaces used semantic tokens, but hover/border hierarchy still leaned too heavy and upcoming hover was explicitly disabled | shifted row hover to `surface.subtle`, softened upcoming/today borders, preserved status/category semantics | rows now read as neutral interactive surfaces with targeted status/category accents |
| `TodaySectionList` | `A` | already semantic; text-link disclosure button already used approved interaction roles | unchanged | REUSE confirmed |
| `TodayContextStrip` | `B/C` | strip hover mixed toward literal white from brand tint | remapped hover to neutral `surface.subtle`, added semantic radius for focus/hover containment | travel context remains product-specific but theme-safe for generic roles |
| `TodayContextCard` | `B/C` | semantic surface/text/border already present, but shadow was raw neutral rgba | remapped shadow to token-derived overlay-backdrop expression; preserved travel-specific content | clickable context card is dark-ready at token level without redesign |
| `PriorityNextCard` | `B/C` | same raw neutral shadow issue as context card | remapped shadow/focus offset semantically | priority card remains product-specific but theme-safer |
| `RecentlyCompletedRow` | `A/E` | already composes DataRow semantically | unchanged | REUSE confirmed |
| `TodayProgressCard` | `A/C` | already semantic for container/text/track/fill | unchanged | progress stays brand-based, no new primitive introduced |
| `TodayProgressSummary` | `A/D` | semantic visually, but file has a pre-existing hook-order lint defect unrelated to color migration | left unchanged | visual semantics remain fine; logic lint debt explicitly deferred |
| `DailyBrief` | `A/C/E` | already semantic and correctly product-specific | unchanged | REUSE/COMPOSE confirmed |
| `todo-visual-category.ts` | `B/C` | `document` category still used `slate-*`; `general` icon shell still depended on a flatter default-surface neutral | migrated only neutral/category-shell roles to semantic tokens | deterministic category mapping preserved; product colors retained where meaningful |

## 4. Page / Surface Hierarchy

Actual implementation after Phase 5:

- page background
  - inherited from shell `surface.page`
- section/item surfaces
  - `surface.default`
- soft informational/error shell
  - `surface.subtle`
- supporting dividers
  - `border.subtle`
- stronger interactive card edges where needed
  - `border.default` / `border.strong`

No page gradient, shell redesign, or card-on-card expansion was introduced.

## 5. Today Header

- page title continues through shared `PageHeader`
  - title → `text.primary`
  - localized date/supporting description → shared semantic text roles
- no brand color was introduced into the page title
- no decorative gradient or Violet block was added

## 6. Attention Section

- section heading remains neutral with a targeted warning icon
- attention rows remain neutral `surface.default` cards
- attention rows no longer push hover toward a status-colored border
- urgency meaning remains in Badge/status text, not the full section surface

## 7. Today Section

- today rows use `surface.default`
- row hover now uses `surface.subtle`
- row title stays `text.primary`
- row metadata stays `text.secondary`
- completed subsection divider now uses `border.subtle`

## 8. Upcoming Section

- upcoming rows remain quieter than today/attention
- row border/divider now uses `border.subtle`
- upcoming hover now uses a restrained neutral surface instead of staying visually flat
- upcoming status text remains `text.secondary`, not brand

## 9. Today Item Rows

Actual row-level mappings:

- row title
  - `text.primary`
- row metadata
  - `text.secondary`
- low-emphasis separators/icons
  - `text.muted`
- row surface
  - `surface.default`
- row hover
  - `surface.subtle`
- row borders
  - upcoming: `border.subtle`
  - standard attention/today card: `border.default`
  - stronger hover edge where needed: `border.strong`
- focus
  - `focus.ring`

Item-type/status semantics preserved:

- travel immediate time remains `brand.primary`
- overdue/warning/info badge tone mapping remains status-driven
- upcoming travel/todo countdown remains neutral readable text

## 10. Empty / Loading / Error States

- empty rows remain neutral `surface.default` blocks with `border.subtle`
- loading continues to use shared `Skeleton`
- blocking error continues to use shared `ErrorState`
- non-blocking refresh banner remains `surface.subtle` with `border.subtle`
- retry/action behavior was unchanged

## 11. Progress / Summary

- `TodayProgressCard` already matched the approved semantic architecture
  - container → shared `Card`
  - metric text → `text.primary`
  - supporting copy → `text.secondary`
  - track → `surface.subtle` + `border.default`
  - fill → `brand.primary`
- `TodayProgressSummary` already used the same semantic structure visually
- no new shared Progress primitive was introduced

## 12. Product-Specific Category Colors

Intentionally preserved as product-specific visual meaning, not generic theme debt:

- Todo category accent pairs for `call`, `payment`, `booking`, `transport`, `shopping`, `people`, `location`, `food`
  - these remain local category expression, not promoted to global semantic tokens
- Todo `document`
  - changed from `slate-*` to semantic neutral because it is a generic neutral category shell, not a meaningfully colored domain accent
- Todo `general`
  - normalized to semantic neutral shell for the same reason
- travel context/travel item leading chips
  - remain brand-tinted product accents where they represent the travel-focused Today context rather than a generic page background
- urgency/status badges
  - remain status-semantic and were not converted to brand

## 13. Legacy / Raw Color Residual Counts

Search scope:

- `src/app/(authenticated)/today/**`
- `src/modules/today/**`

Production residue after Phase 5:

| Pattern | Count | Notes |
|---|---:|---|
| `--gp-*` | `0` | none |
| `var(--color-primary)` | `0` | none |
| `var(--color-accent)` | `0` | none |
| `var(--color-brand-accent)` | `0` | none |
| `slate-*` | `0` production | removed from Today scope; remaining hits are comment-free |
| `bg-white` | `0` | none |
| `text-white` | `0` | none |
| `border-white` | `0` | none |
| raw neutral hex | `0` | none |
| `rgba(` | `0` production | none |
| `color-mix(` | `2` production | token-derived shadow expressions in `today-context-card.tsx` and `priority-next-card.tsx` |

Residual `color-mix(...)` classification:

- acceptable token-derived elevation treatment, not Light-only literal mixing
- both derive from `--color-overlay-backdrop`
- one extra `color-mix` search hit remains comment-only in `today-context-card.tsx`

## 14. Explicitly Deferred

- Dark runtime enablement
- Dark Today visual tuning / approval
- broader Dark surface tuning for provisional semantic surface values
- Radix status palette work / richer status-token families
- remaining non-Today product/domain `var(--color-primary)` consumers
- Travel surface migration outside the Today pilot
- Wedding surface migration
- Finance / Debt / Statistics migration
- Plan-Type expression architecture
- shared Progress primitive extraction
- Today data/model/query/cache/bucketing changes
- pre-existing `today-progress-summary.tsx` hook-order lint defect
- unrelated lint debt outside Today scope

## 15. Verification

Performed:

- scoped code inspection across `src/app/(authenticated)/today/**` and `src/modules/today/**`
- residue searches for `slate-*`, `bg-white`, `text-white`, `border-white`, raw hex, `rgba(`, `color-mix(`, legacy brand aliases, and `--gp-*`
- `npm run build` — **PASS**
- `npm run lint` — **FAIL**

Lint status details:

- pre-existing Today-scope error remains in `src/modules/today/components/today-progress-summary.tsx`
  - conditional `useState`
  - conditional `useEffect`
- remaining lint errors/warnings also exist outside Phase 5 scope in Expense, Todo, Member, Plan, Milestone, and Travel files
- no additional lint cleanup was performed

## 16. User Visual Review Checklist

- Check page header hierarchy: title calm/neutral, date secondary.
- Check `Cần chú ý` rows: neutral surface, clear urgency badges, no heavy warning-surface takeover.
- Check `Hôm nay` rows: hover reads as subtle neutral emphasis, not Violet fill.
- Check `Sắp tới` rows: quieter than Today/Attention but still interactive on hover/focus.
- Check Todo category chips: colored categories preserved; `document` and `general` now read as neutral.
- Check travel context surfaces: brand is present in compact accents only, not as dominant card background.
- Check completed subsection divider and empty/error surfaces: restrained separation, not heavy chrome.
- Check keyboard focus on clickable Today rows/cards/strips.
