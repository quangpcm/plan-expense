# Phase 7 - Full Product Theme Migration

Date: 2026-09-01

## Outcome

Primary product presentation now consumes the existing semantic surface, text, border, and brand roles in both Light and Dark. The locked `next-themes` runtime and account-menu selector were unchanged.

## Migrated Batches

- Core: Plan cards and overview widgets, milestone planning, Todo cards/details/forms, attachment UI, and selected-state treatment.
- Experience: Travel activities, Wedding Guest surfaces, plan members, invitations, and related forms, tables, empty states, and controls.
- Finance: Expense, Income, Statistic, Settlement, and Debt list/detail/form presentation. Financial calculations, fund semantics, settlement direction, and permissions were not changed.
- Cross-cutting: neutral form labels, helper copy, selection controls, cards, rows, tables, loading/empty treatment, and media thumbnails now use semantic roles.

## Token Decisions

- Existing status roles receive Dark values from Radix Colors Dark scales: Green (`#4cc38a`/`#0d281c`), Amber (`#ffca16`/`#302008`), Red (`#ff9592`/`#3b1219`), and Blue (`#70b8ff`/`#0d2847`). No separate theme provider or parallel state was introduced.
- Milestone remains product-owned, with Dark-aware completed and upcoming values layered onto the existing milestone token family.
- Plan-Type, category, chart, finance, Travel, and Wedding accents remain product/domain-owned. Plan-Type background gradients now include Dark variants instead of terminating in a white surface.
- The only remaining `bg-white`/Slate neutral utilities in the audited scope are the intentionally translucent white controls of `PhotoPreview`, rendered over photos rather than a generic application surface.

## Governance Classification

- REUSE: existing `Card`, `Badge`, `DataRow`, `ResponsiveModal`, inputs, and other shared primitives.
- COMPOSE: product lists, forms, overview widgets, statistic rows, and settlement surfaces compose those existing primitives.
- PRODUCT-SPECIFIC: Plan-Type visuals, chart series, Todo/Travel/Wedding category expression, finance presentation, and Milestone treatment remain local because their semantics are domain-specific.
- No new shared component API or runtime architecture was introduced. The existing status token family was completed under explicit Phase 7 scope with documented Radix source values.

## Verification

- `npm run build`: passed, including TypeScript and static-page generation.
- Compiled CSS inspection: semantic utility classes and Dark status/Milestone variable overrides are emitted.
- `git diff --check`: passed.
- `npm run lint`: remains at the existing baseline of 6 errors and 17 warnings in unrelated hooks/components.
- `npm test`: 322 passed, 1 existing date-sensitive Today priority failure (`Trễ 6 ngày` received vs `Trễ 1 ngày` expected).
- Browser visual smoke was not available in this session because the in-app browser runtime was not exposed. Manual Light/Dark review of authenticated data states remains the final recommended handoff check.
