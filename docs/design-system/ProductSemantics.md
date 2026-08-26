# Product Semantics — Domain Boundaries

Shared Design System code (`src/shared/components/ui/*`) must stay unaware of domain meaning.
This doc defines exactly what that means and lists the invariants shared UI must never violate,
sourced from `docs/design-sys-v2/13.BusinessInvariantRegistry.md` and confirmed unchanged through
Rollout. This is not a full business spec — for full domain detail see `docs/debt-plan-specs.md`,
`docs/roles-permissions.md`, `docs/shared-fund*.md`, `docs/wedding-guest.md`.

## The boundary, stated plainly

Shared UI receives already-resolved:
- label
- value
- tone
- state
- children
- actions

**It must not calculate domain truth.** It presents what product code hands it.

Canonical DS code must stay unaware of: Wedding, Travel, Debt, Finance, Guest, Member, Expense,
Income, RSVP, Milestone, Todo, Shared Fund, Owner/Editor/Viewer, or premium entitlement — **unless
a concept has genuinely become a product-wide generic UI semantic and has been explicitly approved
through the evidence gate** in
[FeatureImplementationRules.md](./FeatureImplementationRules.md). Similarity alone is not enough.

## Business/domain branching that must never enter shared UI

- `PlanType` branching (`if (plan.type === 'wedding')` or equivalent) inside anything in
  `src/shared/components/ui/`. PlanType is configuration, resolved and applied in product
  composition (e.g. `plan-card-visuals.ts`), never inside a generic component.
- Wedding Guest semantics: Guest identity vs. GuestInvitation (RSVP, attendeeCount, moneyGift,
  goldGift) are separated concepts; **Guest count ≠ Attendee count**; **money gift ≠ gold gift**
  (never summed into one total; gold is stored in its own smallest unit and never auto-converted).
- Member vs. Wedding Guest semantics: `PlanMember` (manages the Plan) is a different entity from a
  Wedding Guest (attends the event) — never conflate them in a shared component's data shape.
- Invitation vs. attendee count — distinct numbers, never merged.
- Debt direction (who-owes-whom) — must be explicit through copy+layout+icon in product code;
  shared UI never infers or renders direction from a raw sign/color alone.
- Settlement direction (payer → receiver) — same rule; this is exactly why
  `SettlementSuggestionCard` stays product-specific (see [ComponentUsage.md](./ComponentUsage.md)).
- Shared Fund calculations and finance aggregation — Expense is the sole source of truth for
  actual spend; Plan/Milestone/Activity/Category totals are computed on independent dimensions and
  must never be summed across dimensions to derive a different total. This logic lives in
  services/domain utilities, never in a `Metric`/`DataRow`/`Card`.
- Owner/Editor/Viewer permission roles and module access decisions.

## Financial trust rules

**UI components display financial truth. They do not calculate financial truth.**

- Financial calculations stay in services, domain utilities, or the repository/data layer where
  already defined. Do not move calculation logic into `Metric`, `MetricGroup`, `DataRow`, or `Card`
  — these components accept an already-computed, already-formatted value.
- Money formatting: use compact formatting (`formatCompactCurrency`) where space is constrained;
  use full formatting where the exact value matters. Never truncate money mid-number into an
  ambiguous string (see [VisualRules.md](./VisualRules.md) "Money formatting").
- Color on money: neutral by default; semantic color only when it communicates genuine state/
  polarity, and direction must always also be explicit in text/content — never inferred from color
  alone.
- Zero-tolerance domains for regression: Finance calculation drift, authorization drift, data
  loss, Wedding Guest money/gold merge, Debt/Finance double-count. A UI change that risks any of
  these is not a UI-only change — see the STOP conditions in
  [FeatureImplementationRules.md](./FeatureImplementationRules.md).

## Permission rules

- UI refactoring must preserve the current permission model exactly.
- Shared Design System components MUST NOT know about Owner/Editor/Viewer or module permissions.
- Product code resolves permission first and passes shared components only post-resolution state:
  whether an action exists (render it or don't), whether content is visible, whether a control is
  disabled.
- Never infer permission from visual role or component choice.
- `canEditAllExpenses` is a narrow Expense-only override — copy must never overstate it as "full
  Finance management" or similar. Editor ≠ Owner even with this override.
- UI visibility is never authorization. Hiding a control in the UI is a UX convenience, not a
  security boundary — the Service + Firestore Rules layer is the real enforcement point, and a UI
  task must never be treated as satisfying a permission requirement.

## Cross-module rules

- Relationships need explicit semantic — never infer meaning from field-to-field proximity.
- No bidirectional duplication added purely for query convenience.
- No cascade delete/update introduced without a spec change.
- Module-disable (e.g. disabling Planning) must not corrupt existing cross-module historical
  references, and must not crash sibling modules.
- Shared visual grouping (a Timeline, a MetricGroup, etc.) never implies shared domain ownership —
  grouping two things visually doesn't make them the same kind of thing.
- Responsive recomposition must preserve capability — the same business result must be reachable
  on mobile and desktop unless a spec explicitly restricts it.
- Labels must not overstate capability (see `canEditAllExpenses` above).
- Totals must declare their scope when filtered (e.g. a filtered subtotal must say so, not present
  as the grand total).

## Note on Debt

The Business Invariant Registry's Debt section is sourced only from an architecture-prototype-
level document, not a full business spec. Treat Debt's documented invariants (Debt is a separate
domain, never disguised as Expense/Income; Debt balance ≠ Finance cash flow; no Debt/Finance double
counting; repayment affects remaining debt) as the current floor, not a complete spec — if a Debt
feature needs a rule not covered here, that's a real ambiguous-domain-rule case; see the STOP
conditions in [FeatureImplementationRules.md](./FeatureImplementationRules.md) rather than
inventing the missing rule.

## If you're unsure whether something is a domain boundary

Ask: "if I moved this logic into `src/shared/components/ui/`, would it need to know about a
specific Plan type, entity, or role to work?" If yes, it's product logic — keep it in product
composition and pass the shared component only the resolved output.
