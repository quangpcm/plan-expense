# Go Plan Design System — Governance (Canonical Entry Point)

Design System V2 is **implemented and live**. This package is not another migration —
it is the standing engineering standard for every feature built after Go-Live
(2026-08, Go-Live Readiness: PASS). If you are a human developer or an AI coding
agent (Claude Code, Codex, or any AGENTS.md-compatible agent) about to touch product
UI, start here.

This is the **single canonical source of truth** for Design System governance. `AGENTS.md`
and `CLAUDE.md` are thin adapters that point here — they do not duplicate this content. If
anything in this package appears to conflict with `AGENTS.md`/`CLAUDE.md`, this package wins
unless the conflict is about tool-specific behavior (see [Conflict Precedence](#conflict-precedence)).

## Document map

| Doc | Answers |
|---|---|
| [ComponentUsage.md](./ComponentUsage.md) | Which existing component should I use? |
| [OverlayRules.md](./OverlayRules.md) | Which overlay (ResponsiveModal / ConfirmDialog / BottomSheet) should I use? |
| [VisualRules.md](./VisualRules.md) | What are the current visual principles (color, type, spacing, radius, Card hierarchy)? |
| [ProductSemantics.md](./ProductSemantics.md) | Which business/domain boundaries must never enter shared UI? |
| [FeatureImplementationRules.md](./FeatureImplementationRules.md) | What's the required workflow, evidence gate for new shared APIs, and stop conditions? |
| [ExceptionsAndDebt.md](./ExceptionsAndDebt.md) | What deviations are already accepted, and what's deliberately deferred? |

Also relevant, not duplicated here:
- [`docs/ui-modal-conventions.md`](../ui-modal-conventions.md) — the original Dialog/BottomSheet-instead-of-Page
  product rule (Vietnamese). `OverlayRules.md` is now the canonical detail doc for overlay
  *architecture*; `ui-modal-conventions.md` remains the canonical doc for the *page-vs-modal*
  product convention and points here for architecture detail.
- [`docs/design-sys-v2/`](../design-sys-v2/) — the full V2 specification, audit, pilot, rollout,
  and review history. This governance package is derived from it. Treat `docs/design-sys-v2/`
  as historical/evidentiary record, not as the thing to re-read for a normal feature — this
  README and its six docs already extract everything durable from it.

## The six questions

1. **Which existing component should I use?** → [ComponentUsage.md](./ComponentUsage.md)
2. **When should I keep product-specific UI?** → [ComponentUsage.md](./ComponentUsage.md) "Known
   product-specific exceptions" per component, and [ProductSemantics.md](./ProductSemantics.md)
   for the underlying rule.
3. **When may I create a new component/variant/token?** → [FeatureImplementationRules.md](./FeatureImplementationRules.md)
   "New Shared API / Component Evidence Gate".
4. **Which overlay should I use?** → [OverlayRules.md](./OverlayRules.md).
5. **Which business/domain boundaries must never enter shared UI?** → [ProductSemantics.md](./ProductSemantics.md).
6. **What checks are required before a feature is considered complete?** → [FeatureImplementationRules.md](./FeatureImplementationRules.md)
   "Verification" (risk-based, not the old Pilot-era audit process).

## Mandatory instructions (for AI agents and humans)

Before implementing or modifying product UI:

1. Read this README.
2. Follow [FeatureImplementationRules.md](./FeatureImplementationRules.md).
3. Reuse canonical components ([ComponentUsage.md](./ComponentUsage.md)) before creating UI primitives.
4. Preserve business/permission/data semantics ([ProductSemantics.md](./ProductSemantics.md)).
5. Follow [OverlayRules.md](./OverlayRules.md) for all modal/dialog/sheet behavior.
6. Do not add shared component APIs/tokens without consumer evidence ([FeatureImplementationRules.md](./FeatureImplementationRules.md)).

## Source of truth rule

`docs/design-system/README.md` (this file) is the canonical governance entry point.
`AGENTS.md` and `CLAUDE.md` carry only a short pointer to it — they must **not** be expanded
to restate Design System content. If you find yourself about to add component-usage or
overlay guidance to `AGENTS.md`/`CLAUDE.md`, put it in the relevant doc here instead and link it.

## Conflict precedence

When sources disagree, resolve in this order:

1. **Current product/business specification** (`docs/*.md` product specs, e.g. `docs/debt-plan-specs.md`,
   `docs/roles-permissions.md`, `docs/shared-fund*.md`, `docs/wedding-guest.md`)
2. **Explicit domain invariants** ([ProductSemantics.md](./ProductSemantics.md), sourced from
   `docs/design-sys-v2/13.BusinessInvariantRegistry.md`)
3. **Design System governance docs** (this package)
4. **Feature-specific implementation docs** (PR descriptions, feature specs written for a single change)
5. **Agent adapter instructions** (`AGENTS.md`, `CLAUDE.md`)
6. **Legacy/local code conventions** (an existing pattern in a file you're editing that isn't
   documented anywhere above)

**Later approved decisions override older speculative documentation.** Where `docs/design-sys-v2/`
sections read as "Proposed" (the original 16-section specification, sections 1–16) and a later
Pilot/Rollout/Review report amended or rejected that proposal in practice, the later report wins
and this governance package already reflects that outcome — you do not need to re-derive it.

**If documents genuinely conflict in a way that changes what you'd build** — surface the
conflict to the user/reviewer rather than silently picking a side. Silent resolution is only
acceptable for conflicts this package has already explicitly resolved (e.g. Card's legacy
24px radius vs. the V2 target — see [VisualRules.md](./VisualRules.md)).

## Governance history

This package supersedes ad hoc reading of the full `docs/design-sys-v2/` implementation history
(Audit → Foundation → Core Primitives → Overlay Architecture → Structural Components → Core
Patterns → 3 Pilots → STOP/GO review → Rollout Waves 0–7 → Post-Rollout review → Pre-Go-Live
fixes → Visual Polish → Go-Live Readiness: PASS). See
[GovernancePackaging.Report.md](./GovernancePackaging.Report.md) for how this package was
derived and validated.
