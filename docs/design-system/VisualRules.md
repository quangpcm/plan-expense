# Visual Rules

Final visual principles, not pixel-by-pixel rules. Where the original 16-section specification
(`docs/design-sys-v2/6.Foundation.md` etc.) proposed a value and implementation/rollout evidence
amended it, the amended value here is authoritative.

## Typography hierarchy

Use semantic type roles, not raw px values: `display, page-title, section-title, component-title,
body, body-strong, label, metadata, metric-lg/md/sm`. Numbers in Finance/statistics contexts should
use tabular figures. Hierarchy comes from scale/weight/spacing choices within this role system —
don't introduce a new font size or weight outside it for a one-off need.

## Semantic colors

Three separated jobs, kept separate:
- **Neutral** — structure, ~80–90% of the UI (backgrounds, borders, most text).
- **Semantic** — meaning (`success` / `warning` / `danger` / `info`). Use only when something
  genuinely carries state.
- **Brand** — identity, ~5–10% of a normal screen (primary buttons, selection accents, logo/
  onboarding moments).

**Financial amounts are neutral by default.** Color on a money value is a *state* signal (e.g.
over-budget), never decoration, and never used alone — direction/state must also be explicit in
text/copy (e.g. "Quá hạn", not just red). This is a hard accessibility requirement (state must not
be conveyed by color alone) as well as a Debt-specific requirement (who-owes-whom must be explicit
through copy+layout+icon, never "green vs red" alone).

**Known accepted exception**: `StatisticOverview`'s "Tổng thu" (plan-wide total income) is colored
green as a plan-wide aggregate — this is a different, valid use of green from "member balance is
positive," reviewed and judged not a real confusion risk, and deliberately left unchanged. If you
add new green/red usage, make sure it's clear which of these two meanings ("member owes/is owed"
vs. "this is an income aggregate") applies, rather than introducing a third meaning.

## Theme Baseline

Every generic surface must be first-class in Light and Dark at the time it is introduced. Use the
semantic CSS-variable roles already exposed by the foundation, for example:

```tsx
<div className="border border-[var(--color-border-default)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)]" />
```

Do not use raw `bg-white`, `slate-*`, gray neutral hex values, or generic `dark:` utilities as the
normal visual contract. `dark:` is valid only for a product/domain theme pair (Plan-Type or Todo
category, for example) or a documented intentional exception. Numbered `--gp-*` scales are private
foundation implementation details and must never appear in shared or product component code.

Status roles have text/surface forms for `success`, `warning`, `danger`, and `info`; destructive
solid controls additionally use the documented danger fill/hover/foreground roles. Status conveys
application state, never Plan-Type, category, or finance identity.

Raw color remains appropriate for data visualization, product-owned category/Plan-Type expression,
and media-overlay/inverse-text treatment. It must be explainable by one of those roles, not used as
generic UI hierarchy.

## Spacing & density

4px grid. Related things stay closer together; different groups get more space — not uniform 16px
everywhere. Density is **task-based, not viewport-based**: Comfortable / Default / Compact modes
map to what the content is (e.g. a dense guest list can be Compact on desktop too; an empty state
stays Comfortable on mobile too). Compact means less padding/gap/redundant surface — never smaller
font or smaller touch targets.

## Radius

Canonical scale: `--radius-ds-sm` (8px) / `--radius-ds-md` (12px) / `--radius-ds-lg` (16px) /
`--radius-ds-xl` (20px, limited use) / full-pill. Do not introduce `rounded-[24px]`,
`rounded-[26px]`, `rounded-[28px]` or other arbitrary values in new code — those are legacy drift,
not canonical roles. See [ExceptionsAndDebt.md](./ExceptionsAndDebt.md) for the current, tracked,
non-urgent radius-drift backlog (fix opportunistically only when a change already touches that
surface — this is **not** an invitation to open a dedicated radius-cleanup pass).

**`Card`'s own 24px radius + shadow is a documented temporary legacy default**, not the canonical
target — see [ComponentUsage.md](./ComponentUsage.md) Card section. Don't cite Card's own
className as evidence that 24px is canonical elsewhere.

## Border & elevation

Border: use `subtle/default/strong/focus` roles. Prefer not adding a border at all if spacing,
background, or the parent surface already visually groups the content adequately — the goal is
fewer "box inside box" moments, not more borders for consistency's sake.

Elevation (shadow) only signals a layer relationship (none/low/medium/high) — it is not a default
decoration. Cards do not get a shadow just because they're a Card.

## Card hierarchy — the "Card in Card" rule

**Avoid**:
```
Card
  inside Card
    inside Card
```
**Prefer**:
```
Page/surface
→ Section/group via spacing and typography (no chrome)
→ actual data/interactive item Card when needed
```

Do not globally flatten every Card — the rule is about *redundant* nested chrome, not about
eliminating Card. Two real defects were found and fixed under this rule during Visual Polish:

1. **Wedding `AttentionItemRow`** (desktop-only, `lg:` breakpoint): each row gained its own full
   nested Card treatment (border + `lg:rounded-[26px]` + independent drop shadow + hover-lift)
   *inside* the parent widget's own Card. Fixed by replacing it with the lighter treatment already
   used by the "Sắp tới" `DataRow` rows in the same widget: canonical 20px radius, plain border,
   subtle hover background, no independent shadow layered on top of the parent Card's own
   elevation.
2. **Travel `TravelItinerarySummaryWidget`**: a boxed aside (`rounded-[24px] border bg-slate-50/70
   p-4`) around a single stat, inside the widget's own Card. Fixed by removing the box and
   rendering the stat as plain right-aligned typography with lower visual weight than its sibling.

**A nested bordered/shadowed surface is fine when it earns its own separation** — this is the
actual distinguishing test, apply it before "flattening" anything:
- Legibility need (e.g. a semi-opaque panel over a gradient background for contrast) — keep.
- Genuine semantic distinctness (e.g. a pending-RSVP warning banner inside a summary card) — keep,
  it's a distinct alert, not a duplicate frame.
- It's the actual clickable/interactive item (e.g. individually-clickable milestone/todo buttons
  inside a Card) — keep, the border marks the real interactive unit.

A nested box is the anti-pattern specifically when it's **purely decorative re-framing of content
that's already inside a Card** — a redundant frame around a single stat, or an unnecessary
desktop-only elevation layer with no new information or interaction.

## List density

For a list of many short entries (e.g. pending invitations, settlement history), prefer `DataRow`
over giving every item its own full `Card` (border+shadow+padding) — a full Card per row compounds
badly as the count grows. This is the same pattern already applied to `SettlementList` and
`CategoryBreakdown`.

## Money formatting

- Card/summary slots with constrained width: use `formatCompactCurrency` (the established
  space-constrained pattern used everywhere else in the app).
- Full-precision `formatCurrency` is for contexts where the exact value matters and there's room
  for it.
- **Never truncate money mid-number into an ambiguous string.** `PlanCard` was found using
  full-precision formatting in a card-width slot, causing mid-digit ellipsis truncation — fixed by
  switching to the already-centralized compact formatter, not by inventing a new one.

## Responsive & accessibility principles

- Same capability, appropriate presentation per viewport — never "desktop shrunk down."
  Breakpoints: Mobile <768px, Tablet 768–1023px, Desktop ≥1024px. A breakpoint is not a device
  assumption (desktop can be touch/keyboard-only).
- When space is tight, the priority order is: preserve critical content → reflow → collapse
  secondary info → move to contextual menu → truncate last.
- Tables should transform to stacked rows on mobile rather than defaulting to horizontal scroll.
- Accessibility baseline: **WCAG 2.2 AA**. Focus always visible (never `outline: none` without a
  replacement), full keyboard operability, native HTML semantics before ARIA, state never conveyed
  by color alone, 44×44px minimum touch targets, real form labels (not placeholder-as-label) with
  explicit errors, Skeleton over full-screen spinners, destructive actions need explicit
  confirmation with entity identity in the copy (see [OverlayRules.md](./OverlayRules.md)
  ConfirmDialog), and permission-driven UI hiding is never a substitute for backend authorization —
  the Service + Firestore Rules layer is the real gate (see [ProductSemantics.md](./ProductSemantics.md)).

## Brand expression

Brand direction: Violet→Indigo→Blue→Cyan, split into Brand Solid (primary interaction color),
Brand Soft (light selection surfaces), and Brand Gradient (reserved for logo/onboarding/Premium/
celebration moments — **gradient is not the default for primary buttons**, this is a hard rule).
Brand presence budget on a normal screen is roughly 90% neutral / 7% semantic / 3% brand, and
brand expression should shrink as data density increases (a dashboard can carry more brand
presence than a dense import-preview table). Premium sells capability, not "prettier UI" — core UI
quality must be identical for free and paid users.

## Plan-Type expression

**"Different emphasis, same grammar."** PlanTypes (Wedding, Travel, Debt, Saving, Event, ...) may
differ in accent color, emotional tone, information emphasis, domain motif, and expression
intensity. They must **not** differ in typography system, spacing system, radius system,
accessibility, core component anatomy, basic interaction behavior, button hierarchy, modal
behavior, navigation grammar, or semantic status colors. If there's ever a conflict, semantic
status color wins over PlanType accent color, always. See
[ProductSemantics.md](./ProductSemantics.md) for where this logic is allowed to live (never inside
shared UI).

Finance and Members modules are hard-capped at low expression intensity regardless of PlanType —
don't let a Wedding-themed accent bleed into a balance table or member list just because the
containing Plan is a Wedding plan.
