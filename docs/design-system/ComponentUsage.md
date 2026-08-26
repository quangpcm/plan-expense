# Component Usage

Current approved component contracts, as implemented in `src/shared/components/ui/`, amended by
Pilot and Rollout evidence. This is not exhaustive prop documentation — read the component source
for exact prop types. This doc is about **decision-making**: when to reach for a component, when
not to, and the real product cases where reaching for it was the wrong call.

Layer model (dependency flows one direction only, lower never imports upward):

```
Foundation → Core Primitives → Overlay Architecture → Structural Components → Core Patterns → Product Composition
```

Canonical DS code (`src/shared/components/ui/*`) must stay unaware of Wedding, Travel, Debt,
Finance, Guest, Member, Expense, Income, RSVP, Milestone, Todo, Shared Fund, Owner/Editor/Viewer,
or premium entitlement — see [ProductSemantics.md](./ProductSemantics.md). Every component below
already satisfies that; if you're tempted to add a domain-aware prop to any of them, stop and read
[FeatureImplementationRules.md](./FeatureImplementationRules.md) first.

---

## Button

`src/shared/components/ui/button.tsx` — variants `primary | secondary | ghost | destructive`,
sizes `sm | md`.

**USE WHEN**: any clickable action — primary CTA, secondary action, destructive action (delete,
remove), or a link-styled action (`href` renders a `next/link` with the same visual classes).

**DO NOT USE WHEN**: you need an icon-only button. There is no `size="icon"` — it was evaluated
twice (STOP/GO review, Post-Rollout review) and deliberately not added for lack of a real
consumer to derive/verify accessible-name and 44×44 touch-target behavior against. If you have a
genuine icon-only need, this is real evidence — see [FeatureImplementationRules.md](./FeatureImplementationRules.md)
evidence gate, don't hand-roll a workaround silently.

**COMPOSITION NOTES**: no `lg` size exists either (same "no consumer, no value" reasoning). No
domain variants (no "wedding" or "finance" Button) — ever. `destructive` variant's hover state
still uses a raw `hover:bg-red-700` (a known Foundation gap — no `--color-status-danger-hover`
token yet); don't treat that as license to add other raw hex hovers elsewhere.

---

## Badge

`src/shared/components/ui/badge.tsx` — tones `neutral | info | success | warning | danger`.

**USE WHEN**: a compact semantic label (status word, count chip, category tag).

**DO NOT USE WHEN**: you need a domain-state variant, e.g. `status="wedding-confirmed"` — Badge's
tone vocabulary is generic on purpose. Resolve the domain meaning to one of the five tones in
product code, then pass that tone in.

**COMPOSITION NOTES**: `neutral` still uses raw `--color-secondary`/`-foreground` tokens (no exact
Foundation semantic alias exists yet) — leave as-is rather than forcing an inexact remap.

---

## Card

`src/shared/components/ui/card.tsx` — a **surface**, not a layout strategy.

**USE WHEN**: content genuinely needs a bounded, elevated, independently-interactive surface —
an actual data or interactive item, not every visual grouping.

**DO NOT USE WHEN**: you're tempted to wrap a Section, or a row inside a list, in another Card
"for consistency." **Avoid `Card` inside `Card` inside `Card`.** Prefer:
`Page/surface → Section (spacing + typography, no chrome) → Card only for the actual
data/interactive item`. This was a concrete, fixed defect during Visual Polish (Wedding
`AttentionItemRow`'s desktop-only nested card-in-card with a non-canonical 26px radius, and
Travel's boxed single-stat aside) — see [VisualRules.md](./VisualRules.md) "Card hierarchy" for
the exact rule that distinguishes a legitimate nested surface from decorative re-framing.

**COMPOSITION NOTES**: Card currently ships `--radius-card` (24px) + a soft shadow as a
**documented, intentional temporary legacy default** — not the V2 target (`--radius-ds-lg`/16px +
`elevation.none`). This was implemented once, then reverted because Card has 58 consumers and a
blanket radius/shadow change is a simultaneous app-wide visual cascade that needs a
per-consumer hierarchy review first, not a global flip. **Do not** add a "legacy" variant prop to
carry this — when a consumer's surrounding context gets reviewed, move that consumer straight to
the V2 recipe via its own className/context, not an opt-in flag on Card itself.

---

## Section

`src/shared/components/ui/section.tsx` (composes `SectionHeading`).

**USE WHEN**: grouping page content with optional header (eyebrow/title/description/action). This
is the default way to organize a page — it creates **no background, border, or shadow** by
design.

**DO NOT USE WHEN**: you actually need a bounded surface — use `Card` for that (inside a Section
if needed).

**COMPOSITION NOTES**: `SectionHeading` can be used standalone if you need the header anatomy
without Section's `flex flex-col gap-4` wrapper.

---

## Metric

`src/shared/components/ui/metric.tsx` — label + already-resolved value + optional
supporting/leading/tone/size.

**USE WHEN**: a single label+value pair with a flat, closed tone vocabulary
(`default | success | warning | danger | brand`) is enough, and the value has already been
computed and formatted by the caller.

**DO NOT USE WHEN**: your value needs a raw per-item accent color outside that closed tone set, or
your label/value visual weighting is inverted relative to Metric's fixed internal roles. **Known
product-specific exception: `PlanCard` rejected Metric composition** — Metric's fixed
label/value color roles are inverted relative to PlanCard's original weighting (composing would
silently flip which text reads as more prominent), Metric's closed `tone` union has no slot for
PlanCard's 9-way per-plan-type accent system, and PlanCard's per-field money-masking
(`getMaskedMoneyClassName`) can't be expressed through one closed `tone` prop. This is the
canonical example of "semantic fit matters more than adoption percentage" — PlanCard staying
custom is the correct outcome of Metric's guardrail working, not a failure of either component.

**Positive precedent (for calibration)**: `WeddingGuestStatTiles` (4 KPI tiles: guest/invitation
counts, RSVP, etc.) adopted `Metric`/`MetricGroup` cleanly — no masking, no per-plan-type accent
complexity, a genuinely clean fit. Minor disclosed trade-offs (icon position, size-scaling
granularity) were judged acceptable since none affected the underlying guest-count-≠-attendee-
count / money-≠-gold-gift invariants. A new KPI tile without PlanCard-style masking or a 9-way
accent need should default to this pattern, not a bespoke component.

**COMPOSITION NOTES**: **Metric never calculates.** It receives a display-ready value; all
aggregation happens in product code. See [ProductSemantics.md](./ProductSemantics.md) Financial
Trust Rules.

---

## MetricGroup

`src/shared/components/ui/metric-group.tsx` — layout only: `columns (2|3|4)`, `density
(comfortable|default|compact)`.

**USE WHEN**: arranging `Metric` children in a responsive grid, e.g. 3–4 stat tiles that share a
surface (or none) instead of being four separate Cards.

**DO NOT USE WHEN**: your "metrics" aren't really Metric-shaped (see PlanCard exception above) —
don't force MetricGroup as a wrapper just to get the grid if the children can't cleanly be
`Metric`.

**COMPOSITION NOTES**: MetricGroup does not accept a data/config array — compose real `<Metric>`
children into it. It never infers column count or aggregates anything from its children; you pick
`columns` explicitly.

---

## DataRow

`src/shared/components/ui/data-row.tsx` — `leading | main | status | trailing` slots,
`selected`, `disabled`, `density`, optional `onClick`.

**USE WHEN**: a repeated list row has a single primary interaction zone (the whole row opens
something, or the row is purely informational with no interaction).

**DO NOT USE WHEN**: the row has **two independent interaction zones** — e.g. a large
click-to-open area plus a separate trailing delete/icon button. DataRow's own contract says: if
trailing already has its own interactive control, keep the row non-interactive with explicit
trailing actions rather than also making the whole row a `<button>` (avoids nested-interactive
conflicts, the same defect class as the Member nested-button hydration bug). Also do not use when
the row has a breakpoint-dependent identity change (e.g. becomes a bordered/shadowed/hover-lifting
card only at a `lg:` breakpoint) — that's a distinct visual identity, not "more horizontal
alignment," which is the extent of layout variation DataRow supports.

**KNOWN PRODUCT-SPECIFIC EXCEPTIONS** (do not re-attempt these without new evidence):
- `WeddingGuestList` rows — rejected: two independent interaction zones (name/summary opens edit;
  separate trailing delete icon button).
- `MemberBalanceTable` / `MemberSpendingList` — rejected: each row embeds one or two progress bars
  (`ComparisonBar`) plus a breakdown-chips line, too rich for DataRow's single-line leading/main/
  trailing shape.
- `SettlementSuggestionCard` — rejected: two identities (payer + receiver avatars/names) plus a
  transfer-direction arrow is core semantic content that doesn't fit into DataRow's one `main`
  slot without destroying the two-identity/arrow meaning.
- Wedding Overview `AttentionItemRow` — rejected: desktop-only card-ification (see above).

**Rows that DID compose cleanly** (for calibration — not every domain row is an exception):
plain "upcoming todo" rows (Wedding Overview), `SettlementList`'s history row, `MemberBalanceRowItem`,
`CategoryBreakdown`, `FinanceSummaryHero`'s row-shaped content — all migrated to DataRow with no
disclosed fidelity loss.

**COMPOSITION NOTES**: DataRow never knows what it's displaying (no Guest/Member/Debt/Expense/RSVP
concept). Defaults to non-interactive (`<div>`); passing `onClick` renders a real `<button>`.

---

## EmptyState / ErrorState

`src/shared/components/ui/empty-state.tsx`, `error-state.tsx` — `visual`, `title`, `description`,
`action`, `secondaryAction`.

**USE WHEN**: EmptyState — there is genuinely nothing to show yet. ErrorState — something failed
to load. These are deliberately two separate exports (not one component with a `variant` prop) so
"nothing here" and "something broke" can never blur together.

**DO NOT USE WHEN**: you need the component to decide *why* it's empty, what the CTA does, or
whether the user has permission to see the action. Neither component has a permission prop by
design — resolve permission/copy in product code and only pass `action` when it should render.

**COMPOSITION NOTES**: ErrorState does not implement retry, parse backend errors, or log
anything — the product layer supplies whatever `action` fits (`"Thử lại"`, `"Quay lại"`,
`"Yêu cầu quyền truy cập"`, or none).

---

## FilterBar

`src/shared/components/ui/filter-bar.tsx` — `search | filters | actions` slots.

**USE WHEN**: you need a layout shell for search + filter controls + a reset/action region.

**DO NOT USE WHEN**: you're looking for a filter *engine* — FilterBar has no filter-schema/DSL
prop. It owns zero state: all filter values, `useState`, and `onChange` wiring stay entirely in
product code (e.g. `WeddingGuestFilterBar` adopts FilterBar purely as a shell).

**COMPOSITION NOTES**: compose real controls (`Input`, `DropdownSelect`, etc.) into its slots.

---

## PageHeader

`src/shared/components/ui/page-header.tsx` — `title | description | metadata | actions`.

**USE WHEN**: a page-level identity/action shell is needed and the page doesn't already have a
richer, product-specific header.

**DO NOT USE WHEN**: you need the rich Plan/Wedding header with tabs, PlanType accent, etc. —
those stay their own product-specific components and may compose `PageHeader` internally rather
than being replaced by it. (Not required for every page — e.g. Wedding Overview Pilot didn't use
it.)

**COMPOSITION NOTES**: does not know who may act or what an action does — product resolves
permission/copy/behavior before passing `actions`.

---

## EntityList

`src/shared/components/ui/entity-list.tsx` — `loading | error | empty | children`, `divided`,
`density`.

**USE WHEN**: a collection needs coordinated loading/error/empty/content presentation with
consistent row spacing.

**DO NOT USE WHEN**: your collection has its own bespoke grid/registry logic — e.g. `PlanCard`'s
grid (card grid + a "create new" special item + a trailing action card) was evaluated and judged
not a clean EntityList fit; left custom rather than stretched.

**COMPOSITION NOTES**: renders whichever of `loading > error > empty > children` is truthy, in
that priority — it does not introspect children to infer state; the product decides which slot is
truthy. Children don't have to be `DataRow`. Never fetches, sorts, filters, or paginates.

---

## DropdownSelect

`src/shared/components/ui/dropdown-select.tsx` — `value`, `options: {value,label,icon}[]`,
`onValueChange`.

**USE WHEN**: a generic single-select dropdown with icon support is needed.

**DO NOT USE WHEN**: you need domain-aware option generation baked in — build the `options` array
in product code (e.g. don't add a `guestGroups` or `expenseCategories` special-case prop).

---

## ResponsiveModal

See [OverlayRules.md](./OverlayRules.md) — canonical overlay for all create/edit forms and
workflows.

## ConfirmDialog

See [OverlayRules.md](./OverlayRules.md) — canonical overlay for destructive/consequential action
confirmation.

## Collapsible

`src/shared/components/ui/collapsible.tsx` — `title | description | icon | header | leading |
defaultOpen`.

**USE WHEN**: expand/collapse disclosure for a section or list-row-like block.

**DO NOT USE WHEN**: you need a full accordion with multiple independent open panels tracked
together — this component is single-panel, uncontrolled (`defaultOpen` only, no controlled `open`
prop).

**COMPOSITION NOTES**: `leading` is an **approved shared API addition** (Pre-Go-Live Fix Batch) —
it renders as a true DOM sibling immediately before the trigger `<button>`, never inside it. It
exists specifically so a consumer can place its own interactive control (e.g. an avatar-change
button in `member-list.tsx`) next to the trigger without nesting one `<button>` inside another
(invalid HTML, breaks hydration, and would let a click on that control also bubble into the
trigger's own toggle). This is the canonical example of a **justified** shared-API addition: it
fixed a confirmed accessibility/hydration defect without regressing UX, not a speculative
convenience add. Also note the resulting rule it's evidence for: any `position: absolute`
dropdown/menu nested inside a `Collapsible` (or any `overflow-hidden` expand/collapse ancestor)
will get clipped — use `position: fixed` computed from the trigger's `getBoundingClientRect()`
instead (see the MemberActionsMenu clipping fix), not a portal, not `overflow-visible` on the
Collapsible itself (that would break its grid-row expand animation).

## Skeleton

`src/shared/components/ui/skeleton.tsx` — a single pulse-animated block.

**USE WHEN**: loading placeholders. Prefer Skeleton over full-screen spinners per the
accessibility/responsive principles in [VisualRules.md](./VisualRules.md).

**DO NOT USE WHEN**: nothing new needed here — kept as-is through the whole rollout; no known
exceptions.

---

## Cross-cutting reminders

- **"Third Use" rule**: 1st occurrence of a UI shape = local implementation, 2nd = observe
  similarity, 3rd = consider extraction (Button/Input/Dialog-class primitives are the exception —
  they can be systemized immediately). Don't extract a shared component off two data points unless
  they're a strong, unambiguous match — see [FeatureImplementationRules.md](./FeatureImplementationRules.md).
- **"Shared visual anatomy does not imply shared product semantics."** A domain row/list can look
  like `DataRow` and still correctly stay product-specific if the interaction/semantic shape
  doesn't fit. Composing generic patterns is preferred over replacing domain components with them.
- If you're about to add a `planType`, `role`, `guestStatus`, or similar domain-flavored prop to
  any component on this page, or a boolean-prop pile (`compact/bordered/elevated/highlighted/
  interactive/selected/finance/mobileCard...`) — stop; that's the God Component smell. See
  [ProductSemantics.md](./ProductSemantics.md) and [FeatureImplementationRules.md](./FeatureImplementationRules.md).
