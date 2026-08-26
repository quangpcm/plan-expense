---
name: new-feature
description: Use whenever the user asks to implement, add, or build a new feature or product UI change in this repo (Go Plan / plan-expense) — e.g. "thêm tính năng", "implement feature X", "add a new screen/form/card". Runs the mandatory Go Plan Design System governance checklist (AGENTS.md/CLAUDE.md, docs/design-system/README.md, FeatureImplementationRules.md) before and during implementation, so component reuse, product-specific exceptions, the new-shared-API evidence gate, business/permission/financial semantics, and STOP conditions are always checked, not skipped. Do not use for pure bug fixes, refactors, or non-UI backend-only work with no new product surface.
---

# New Feature — Go Plan Design System Governance Checklist

Implement the requested feature while treating `docs/design-system/` as the governing contract for
every UI decision. This skill is the repo's standing process for *any* new feature/product-UI
work — not a one-off checklist to satisfy once.

## 0. Before writing any code

Read, in this order (skip only a doc you've already loaded this session and know is current):

1. `AGENTS.md` (and whatever it pulls in via `CLAUDE.md`'s `@AGENTS.md` import) — repo-wide
   conventions, including the Dialog/BottomSheet-instead-of-Page product rule.
2. `docs/design-system/README.md` — canonical governance entry point and doc map.
3. `docs/design-system/FeatureImplementationRules.md` — the required workflow, the new-shared-API
   evidence gate, verification calibration, and STOP conditions (full text, not paraphrase).

Then, as relevant to what you're building:

4. `docs/design-system/ComponentUsage.md` — before reaching for or building any UI element, check
   whether an approved component already fits (and check the "known product-specific exceptions"
   for the closest analog to what you're building — many decisions have real precedent).
5. `docs/design-system/OverlayRules.md` — if the feature includes any create/edit form, confirmation,
   menu, or drilldown.
6. `docs/design-system/ProductSemantics.md` — before touching anything Finance, Debt, Wedding Guest,
   Members/Permissions, or Shared Fund related.
7. `docs/design-system/VisualRules.md` — if you're making layout/visual decisions not already
   dictated by an existing pattern (Card hierarchy, money formatting, density).
8. `docs/design-system/ExceptionsAndDebt.md` — check before "fixing" something that looks
   inconsistent; it may be a documented intentional exception, not debt.

## 1. Plan the UI surface

For each UI element the feature needs, classify it explicitly (don't skip this even for a small
feature):

- **REUSE** — an existing component fits as-is.
- **COMPOSE** — an existing component fits combined with product-specific children/props it
  already supports.
- **PRODUCT-SPECIFIC** — correctly stays custom (cite the closest precedent in
  `ComponentUsage.md` if one exists, e.g. "this is a two-identity/direction row like
  `SettlementSuggestionCard`, staying custom for the same reason").
- **NEW-CAPABILITY-REVIEW** — you believe nothing existing fits. Do not write the new shared
  component/prop/token yet — go to step 2 first.

## 2. New shared API / component / token gate

Only if step 1 produced a `NEW-CAPABILITY-REVIEW` item: apply the evidence gate in
`FeatureImplementationRules.md` (real consumer evidence, repeated semantic pattern, clear shared
ownership, composition genuinely doesn't work). One consumer alone normally does not justify a new
shared API. If the gate isn't clearly satisfied, default to **PRODUCT-SPECIFIC** instead and note
the deferred evidence (see `ExceptionsAndDebt.md` for the pattern — this may already be a tracked
deferred item, e.g. `Button size="icon"` or the Progress primitive; check before building a
duplicate one-off).

## 3. Preserve semantics

Before and while implementing, verify the feature does not change:

- Business invariants (`ProductSemantics.md` — PlanType-in-shared-UI, Guest≠Member, money≠gold
  gift, debt/settlement direction, Expense-as-source-of-truth, etc.)
- Permission semantics (Owner/Editor/Viewer resolution stays in product code, never in shared UI;
  UI hiding is never authorization)
- Financial calculations (shared UI displays pre-computed values only — never calculates)
- Data model / service / repository contracts (a UI task should not need to touch these — if it
  seems to, that's a STOP condition, see step 5)

## 4. Implement

- Use `ResponsiveModal`/`ConfirmDialog` per `OverlayRules.md` for any form or destructive
  confirmation — never a new page, never `window.confirm()`, never a hand-rolled
  Dialog+BottomSheet pair.
- Follow `VisualRules.md` for typography/color/spacing/radius/Card-nesting decisions instead of
  inventing new values.
- Keep all business/domain logic in product composition, hooks, services — never inside
  `src/shared/components/ui/*`.

## 5. STOP conditions — check continuously, not just at the start

Stop and report the decision needed (don't silently pick a side or work around it) if
implementation would require:

- Changing a business invariant, permission semantics, or financial calculations
- Changing service/repository/data semantics for what was framed as a UI task
- Adding a shared public Design System API/token without clearing the evidence gate in step 2
- Inventing a new generic abstraction (config-driven renderer, filter DSL, schema-driven engine)
- Contradicting a documented intentional exception in `ExceptionsAndDebt.md`
- Resolving an ambiguous domain rule without product guidance (e.g. an underspecified Debt rule)

Ordinary local UI composition using existing contracts continues autonomously — this is not
license to ask before every small decision, only before the items above.

## 6. Verify — proportional to risk, not uniform

Scale verification to business severity × blast radius (see `FeatureImplementationRules.md`
"Verification"):

- Visual-only → visual/contrast/responsive smoke.
- Layout/composition → also desktop/mobile/tablet, long VN text, empty/dense states, keyboard order.
- New interaction mechanism (new overlay wiring, etc.) → also verify workflow result unchanged,
  focus management, permission variants, loading/error/cancel/confirm paths.
- Touches Finance/Debt/Settlement/permission-gated actions or changes what a total/label means →
  treat as high-risk: verify the value's source, label accuracy against real capability, and total
  scope explicitly.

Then run the automated gate (`npm run build` for the authoritative typecheck — not
`npm run typecheck` alone — plus lint/tests), and if you touched any token/CSS-variable/arbitrary
value, check the compiled CSS output directly rather than trusting a green build alone.

## 7. Report

When done, state explicitly (briefly, not a full audit report — this isn't the old Pilot-era
process): which elements were REUSE/COMPOSE/PRODUCT-SPECIFIC, any STOP condition raised and how it
was resolved, and what verification was actually performed.
