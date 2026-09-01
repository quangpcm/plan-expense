# Feature Implementation Rules

The mandatory workflow for implementing or modifying product UI, and the evidence gate for
touching shared Design System code. This is the **normal-weight process** — the heavy Pilot-era
audit process (pre-migration behavior baseline, formal disposition records, STOP/GO gates) is
retired. Do not reintroduce it for ordinary feature work.

## Workflow

1. **Understand domain behavior and invariants.** Check [ProductSemantics.md](./ProductSemantics.md)
   and the relevant `docs/*.md` product spec for anything the feature touches.
2. **Identify permissions/data ownership** for the feature (who can see it, who can act, which
   module owns the data).
3. **Map UI needs to existing Design System components** — read
   [ComponentUsage.md](./ComponentUsage.md) and [OverlayRules.md](./OverlayRules.md) before
   sketching anything custom.
4. **Mark each UI element** with one of:
   - `REUSE` — an existing component fits as-is.
   - `COMPOSE` — an existing component fits when combined with product-specific children/props it
     already supports.
   - `PRODUCT-SPECIFIC` — the element correctly stays custom (see the rejection examples in
     [ComponentUsage.md](./ComponentUsage.md) for what "correctly stays custom" looks like).
   - `NEW-CAPABILITY-REVIEW` — you believe no existing component/variant/token fits and something
     shared needs to change. Go to the evidence gate below before writing code.
   Before choosing a color, also classify it as `GENERIC UI`, `BRAND`, `STATUS`, `PRODUCT/DOMAIN`,
   `DATA VISUALIZATION`, or `INTENTIONAL EXCEPTION`. Generic UI must use semantic roles and be
   reviewed in both Light and Dark; private `--gp-*` scales and generic `dark:` workarounds are not
   valid component contracts.
5. **Implement product logic outside the Design System** — in product composition, hooks,
   services, domain utilities. Never inside `src/shared/components/ui/*`.
6. **Verify business/permission/data invariants** are unchanged (see
   [ProductSemantics.md](./ProductSemantics.md)).
7. **Run the automated gate**: typecheck via `npm run build` (not `npm run typecheck` alone — it
   runs a lighter check and has missed real errors before), lint, tests. If you touched any
   token/CSS-variable/arbitrary-value, inspect the compiled CSS output directly rather than
   trusting a green build alone — a self-referencing `var()` or a similar silent-zero bug will not
   fail typecheck/lint/test/build.
8. **Perform targeted P0/P1 interaction verification** for what you actually changed — not a full
   regression sweep. Scale effort to risk (see Verification below).
9. **Do not spend disproportionate effort on P2 pixel polish** unless the user asked for it.

## New Shared API / Component Evidence Gate

Before adding a new shared component, a Button variant/size, a ResponsiveModal prop, a token
family, a shared layout abstraction, or any other shared visual primitive, establish:

1. **Real consumer evidence** — an actual current need in the code, not a hypothetical future one.
2. **Repeated semantic pattern** — the same structural/interaction need recurring across genuinely
   different contexts, not just visual similarity.
3. **Clear ownership at the shared layer** — the need is domain-neutral and stable, not one
   product's local requirement wearing a generic-looking shape.
4. **No existing component fits cleanly** — you've actually tried composition first (a slot, a
   wrapper, an existing token) and it didn't work, not just "a new prop would be more convenient."

**"Two consumers do not automatically justify abstraction."** Ask whether the repeated need is
structural, interaction-level, stable, and domain-neutral — visually similar domain components may
still correctly need to stay separate (see `DataRow`'s rejections in
[ComponentUsage.md](./ComponentUsage.md)). The rough rule of thumb used throughout Rollout: 1st
occurrence = local implementation, 2nd = observe similarity, 3rd = consider extraction — except for
Button/Input/Dialog-class primitives, which can be systemized immediately given a single strong
consumer.

**One consumer alone normally does NOT justify expanding a shared contract.** Exceptions are
allowed for:
- a confirmed accessibility defect (example: `Collapsible.leading`, added to fix a real invalid
  nested-`<button>`-in-`<button>` hydration/accessibility bug without regressing the existing UX —
  this is the model case for a justified one-consumer exception),
- an architecture defect (example: the `ResponsiveModal`/`ConfirmDialog` focus-return fix — a
  library-integration bug, not a new capability, but still required a code change to shared
  overlay components),
- a capability required to preserve established UX cleanly with no working alternative.

**Worked examples from this project:**
- `ResponsiveModal.size` — approved after real evidence (12 of ~30 call sites rendered fully
  unconstrained on desktop; a concrete reported bug on `WeddingGuestImportDialog`). Values were
  reused from widths already observed in real consumers, not invented pixels.
- `Collapsible.leading` — approved to fix a real invalid nested-interactive accessibility defect.
- `Button.destructive` variant, `Button.sm` size — harvested byte-for-byte from existing consumer
  overrides (`confirm-dialog.tsx`, `settlement-suggestion-card.tsx`), not invented.
- `Button size="icon"` — evidence bar was judged met on paper (a real Dashboard bell-icon consumer)
  but deliberately **not implemented** — remains a deferred, additive, low-risk backlog item. See
  [ExceptionsAndDebt.md](./ExceptionsAndDebt.md). If you hit a real icon-only Button need, this is
  your evidence — consider picking this up rather than hand-rolling a one-off icon button.
- A single-value **Progress primitive** has strong evidence (4+ modules with hand-rolled progress
  bars) but is deliberately deferred — current hand-rolled implementations work and the
  abstraction is not release-critical. Don't build it opportunistically inside an unrelated feature
  PR; if you need a progress bar, follow the existing hand-rolled pattern in the nearest similar
  component and flag the accumulating evidence, don't silently add a 5th bespoke instance without
  noting it.

### Correct-layer test

Before changing anything shared, identify which layer actually owns the problem: Foundation?
Primitive? Overlay? Structural Component? Pattern? Product composition? Fix at the lowest correct,
reusable layer. Don't patch Foundation for a one-screen issue, and don't repeatedly patch product
CSS around a real primitive defect instead of fixing the primitive.

### Practical decision flowchart

```
Can existing composition solve it cleanly?      → Use what exists.
Is the need product-specific?                    → Keep it product-local (PRODUCT-SPECIFIC).
Is the need recurring and domain-neutral?         → Propose a shared evolution (evidence gate above).
Would the change affect many consumers?           → Treat it as higher-risk; wider review.
Would it change business behavior?                → It is not a UI-only change — see STOP conditions.
```

### Anti-patterns to catch before they ship

- A domain-flavored prop on a shared component (`planType`, `role`, `guestStatus`, `expenseType`).
- A boolean-prop pile (`compact, dense, bordered, elevated, highlighted, interactive, selected,
  mobile, finance, wedding...`) accumulating on one component — this is the "God Component" smell;
  stop and reconsider the component's responsibility instead of adding the next boolean.
- A shared component evolving into a schema-driven page builder, entity renderer, generic CRUD
  engine, domain filter DSL, or permission-aware UI engine.
- Permanent parallel systems (`ButtonV2`, `ModernCard`) instead of evolving the one canonical
  component.

## Verification — proportional, not uniform

Verification effort must be proportional to **business severity × blast radius**, not to how
interesting the change is. Use this as a rough calibration (adapted from the project's Impact
Classification, `docs/design-sys-v2/14.ImpactClassification.md`):

- **Visual-only change** (color/weight/radius/spacing within a component): visual check + contrast
  + responsive smoke. Low ceremony.
- **Layout/composition change** (arrangement changes, meaning preserved): also check desktop/
  mobile/tablet, long Vietnamese text, empty/dense states, keyboard tab order.
- **Interaction-mechanism change** (e.g. Dialog → Drawer, or wiring a new ResponsiveModal): also
  verify the underlying workflow result is unchanged, focus management, permission variants,
  loading/error/cancel/confirm paths.
- **Information/semantic presentation change** (what's prioritized/labeled/summarized — e.g.
  changing a raw total to a percentage, or a permission label's wording): treat as higher risk of
  misleading interpretation — verify the metric's source, the label's accuracy against the real
  permission/capability, and the scope of any total shown.
- **Business/calculation/permission/data-model change**: this is not a Design System task — see
  STOP conditions below.

Do not run the old Pilot-era full regression manifest (business-invariant mapping, permission
matrix snapshot testing, before/after value fixtures) for a normal feature — that ceremony was
correct for validating the Design System itself during migration, not for every subsequent
feature. Reserve that level of rigor for genuinely high-risk changes (financial calculation
surfaces, settlement/debt balance display, permission-gated actions) where blast radius is large.

## STOP conditions

Stop and surface the issue to the user/reviewer instead of improvising when implementation would
require:

- Changing a business invariant (see [ProductSemantics.md](./ProductSemantics.md)).
- Changing permission semantics.
- Changing financial calculations.
- Changing service/repository/data semantics for what was framed as a UI task.
- Adding a shared public Design System API without clearing the evidence gate above.
- Adding a token family.
- Inventing a new generic abstraction (config-driven renderer, filter DSL, etc.).
- Contradicting an intentional exception documented in
  [ExceptionsAndDebt.md](./ExceptionsAndDebt.md) — if you think an exception should be
  reconsidered, say so explicitly rather than silently working around it.
- Resolving an ambiguous domain rule without product guidance (e.g. an underspecified Debt rule —
  see [ProductSemantics.md](./ProductSemantics.md) "Note on Debt").
- Accessibility requiring a change that conflicts with an approved product/brand semantic (e.g. a
  status or Plan-Type color that fails contrast in a role it's newly being used in) — surface it
  rather than picking a new hex on your own; see the status AA item in
  [ExceptionsAndDebt.md](./ExceptionsAndDebt.md) for the standing example.

For ordinary local UI composition using existing contracts, continue autonomously — these stop
conditions are not a license to ask before every small decision.

## Governance anti-goals

This process must not become bureaucracy for every CSS change, a ban on product-specific
components, a requirement to abstract everything, or a blocker to reasonable experimentation. Use
heavier process only when shared impact or risk is genuinely higher. **Standardize what is truly
shared. Compose what is product-specific. Evolve shared contracts only with evidence. Protect
business behavior at every layer.**
