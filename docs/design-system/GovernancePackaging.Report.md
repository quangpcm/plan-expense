# Governance Packaging Report

Design System V2 implementation is complete and live (Go-Live Readiness: PASS). This task
packages the proven system into a durable governance layer for future feature work. It made no
application source, business logic, or Design System component implementation changes —
documentation and agent-rule files only.

## 1. Governance structure created

```
docs/design-system/
  README.md                      canonical entry point, doc map, precedence model
  ComponentUsage.md               per-component USE WHEN / DO NOT USE WHEN / exceptions
  OverlayRules.md                 ResponsiveModal / ConfirmDialog / BottomSheet final rules
  VisualRules.md                  typography, color, spacing, radius, Card hierarchy, money format
  ProductSemantics.md             domain boundaries, business invariants, permission, financial trust
  FeatureImplementationRules.md   workflow, evidence gate, verification, STOP conditions
  ExceptionsAndDebt.md            intentional exceptions vs. deferred improvements registry
  GovernancePackaging.Report.md   this report
```

Each doc has one responsibility; none duplicates another's content — they cross-link instead.

## 2. Existing rule files found (inventory, before any changes)

- `AGENTS.md` — 17 lines. An auto-regenerated Next.js block (owned by `next dev`, not edited) plus
  one hand-written "Coding conventions" section with a single rule: Dialog/BottomSheet-instead-of-
  Page, pointing to `docs/ui-modal-conventions.md`.
- `CLAUDE.md` — 1 line, `@AGENTS.md` (Claude Code's import syntax — it already pulls in AGENTS.md
  in full, no separate content to inventory).
- `.claude/settings.local.json` — tool permission allowlist only, no instructional content.
- `docs/ui-modal-conventions.md` — 131 lines, Vietnamese. The existing, correct, evidence-based
  source of truth for the page-vs-modal product convention and (until now) the most detailed
  available doc on the BottomSheet/ResponsiveModal coexistence defect.
- `docs/design-sys-v2/` — the full 40+ document V2 specification/audit/pilot/rollout/review
  corpus. Not a "rule file" a feature implementer should read directly; this is the evidentiary
  record this governance package was derived from.
- No other `.claude/*` instruction files, no README-embedded conventions, no other
  `docs/*coding*` or `docs/*rules*` files existed.

**No duplicate or conflicting rule files were found** — the pre-existing surface was small and
consistent. The gap was absence, not conflict: nothing above told an implementer which shared
component to reach for, when to keep something product-specific, when a new shared API is
justified, or what the confirmed domain boundaries are. That gap is what this package fills.

## 3. Files created / modified

**Created:**
- `docs/design-system/README.md`
- `docs/design-system/ComponentUsage.md`
- `docs/design-system/OverlayRules.md`
- `docs/design-system/VisualRules.md`
- `docs/design-system/ProductSemantics.md`
- `docs/design-system/FeatureImplementationRules.md`
- `docs/design-system/ExceptionsAndDebt.md`
- `docs/design-system/GovernancePackaging.Report.md` (this file)

**Modified:**
- `AGENTS.md` — added a "Design System governance" bullet ahead of the existing Dialog/BottomSheet
  bullet, pointing to `docs/design-system/README.md` and the mandatory-instructions list, plus a
  condensed STOP-condition summary. The existing Dialog/BottomSheet bullet is kept (still the
  correct product-level rule) and now also cross-links to `OverlayRules.md` for architecture
  detail. No Design System content was copied into `AGENTS.md` itself.
- `docs/ui-modal-conventions.md` — added a one-paragraph pointer under the title clarifying its
  continuing role (product-level page-vs-modal convention, in Vietnamese) versus
  `docs/design-system/OverlayRules.md`'s new role (canonical overlay *architecture* detail:
  focus lifecycle, size contract, nesting, the BottomSheet pointer-events defect). No existing
  content in this file was removed or altered.

**Not modified:** `CLAUDE.md` — already a minimal, correct adapter (`@AGENTS.md`), which now
transitively carries the new governance pointer. Per the task's own instruction not to duplicate
canonical documentation inside `CLAUDE.md`, no direct edit was needed or made.

## 4. Duplicated / stale rules consolidated

None were found duplicated or stale in the pre-existing rule files (see §2) — there was only one
prior rule (Dialog/BottomSheet-instead-of-Page), and it remains accurate and unchanged. The
consolidation work in this task was almost entirely **extraction**, not deduplication: pulling
durable, still-true decisions out of ~40 historical spec/audit/pilot/rollout/review documents (many
of which explicitly supersede earlier proposals within the same corpus — e.g. the original 16-
section specification's sections are all individually marked "Proposed," and later Pilot/Rollout/
Review evidence amended, confirmed, or rejected each proposal in practice) into one place that
states only the current, final answer. Where the corpus disagreed with itself over time (e.g. the
original Overlay Architecture spec vs. Amendment #2's corrective BottomSheet finding; Card's
originally-proposed V2 radius/shadow vs. its actually-shipped temporary legacy default), this
package states the **later, evidence-confirmed** version and cites the earlier one only where it
adds useful contrast (e.g. `ComponentUsage.md`'s Card section explains *why* the legacy default is
still in place, not just what it is).

## 5. Claude Code adapter

`AGENTS.md` §"Coding conventions" (Claude Code loads this via `CLAUDE.md`'s `@AGENTS.md` import)
now instructs Claude Code to, before UI/feature work:
1. Read `docs/design-system/README.md`.
2. Follow `FeatureImplementationRules.md`.
3. Reuse canonical components before creating primitives.
4. Preserve business/permission/data semantics.
5. Follow `OverlayRules.md` for modal/dialog/sheet behavior.
6. Not add shared APIs/tokens without consumer evidence.

Plus a condensed stop-condition list (business invariant, permission, financial calculation,
unreviewed shared API/token, ambiguous domain rule → stop and ask). No Design System content was
duplicated into `AGENTS.md`/`CLAUDE.md` — every point is a pointer.

## 6. Codex / AGENTS adapter

Same file, same edit — `AGENTS.md` already existed and is the canonical AGENTS.md-compatible
adapter location, so one edit serves both Claude Code and any other AGENTS.md-compatible agent.
No separate Codex-specific file was created, matching the task's "do not create competing rule
sets" instruction.

## 7. Precedence model

Documented in `README.md` "Conflict Precedence":

1. Current product/business specification (`docs/*.md` product specs)
2. Explicit domain invariants (`ProductSemantics.md`)
3. Design System governance docs (this package)
4. Feature-specific implementation docs
5. Agent adapter instructions (`AGENTS.md`, `CLAUDE.md`)
6. Legacy/local code conventions

Later approved decisions override older speculative documentation — stated explicitly, with the
Card radius/shadow legacy-default case cited as the worked example of a conflict this package has
already resolved rather than leaving for the implementer to re-derive.

## 8. Feature implementation workflow

`FeatureImplementationRules.md` defines: understand domain behavior → identify permissions/data
ownership → map UI needs to existing components → mark each element REUSE / COMPOSE /
PRODUCT-SPECIFIC / NEW-CAPABILITY-REVIEW → implement product logic outside the Design System →
verify invariants → run the automated gate → targeted P0/P1 verification → don't over-invest in
P2 polish. Verification effort is explicitly proportional to business severity × blast radius, not
uniform — the old Pilot-era full regression manifest is retired for normal feature work and
reserved for genuinely high-risk changes.

## 9. Stop conditions

Defined once, in `FeatureImplementationRules.md`, and referenced (not restated) everywhere else:
business invariant change, permission semantics change, financial calculation change,
service/repository/data semantics change for a UI task, new shared public API without clearing the
evidence gate, new token family, new generic abstraction, contradicting a documented intentional
exception, or resolving an ambiguous domain rule without product guidance. Ordinary local UI
composition using existing contracts continues autonomously.

## 10. Validation scenarios

Each hypothetical was checked against the shipped docs (not against artificially added rules):

**A. "Add a new Wedding overview KPI."** `ComponentUsage.md`'s Metric section gives USE WHEN
(single label+value, closed tone vocabulary, no per-item accent need) and both a negative
precedent (`PlanCard` rejected Metric — masking + 9-way accent) and a positive precedent
(`WeddingGuestStatTiles` accepted Metric/MetricGroup cleanly). A new KPI without masking/accent
complexity should default to Metric/MetricGroup. **Answerable.**

**B. "Add a delete action."** `OverlayRules.md`'s ConfirmDialog section gives the exact mutation
contract (Cancel = zero mutation, Confirm = mutation fires once) and severity guidance
(`destructive` for delete, not automatically every confirm). **Answerable.**

**C. "Add a new modal form."** `ComponentUsage.md`/`OverlayRules.md` both state forms always use
`ResponsiveModal`, never a page. Size selection has a concrete mapping table (`sm→448px` …
`xl→896px`) and a rule of thumb (pick a size unless content needs most of the viewport).
**Answerable.**

**D. "Add a new financial balance card."** `ProductSemantics.md`'s Financial Trust Rules and
`ComponentUsage.md`'s Metric section both state calculations stay in services/domain utilities;
shared components receive already-resolved values. **Answerable.**

**E. "Add a PlanType-specific visual."** `ProductSemantics.md` explicitly forbids `PlanType`
branching inside `src/shared/components/ui/`; `VisualRules.md`'s Plan-Type Expression section
gives the "different emphasis, same grammar" boundary and where semantic color wins over PlanType
accent; `ExceptionsAndDebt.md` names the actual pattern in use (`plan-card-visuals.ts`) as the
place PlanType branching belongs. **Answerable**, with a concrete existing pattern to follow.

**F. "Need a new Button variant for one screen."** `FeatureImplementationRules.md`'s evidence gate
states plainly: "One consumer alone normally does NOT justify expanding a shared contract," and
the decision flowchart routes a product-specific single-screen need to "keep it product-local,"
not to inventing a Button variant. **Answerable** — correctly routes to shared-API review (and
likely rejection) rather than silent invention.

No scenario required adding a new rule solely to make it pass. One doc (`ComponentUsage.md`'s
Metric section) was strengthened with an already-researched positive precedent
(`WeddingGuestStatTiles`) that had been gathered but not yet included, to make scenario A's answer
more direct — this is existing evidence, not a fabricated rule.

## 11. Unresolved conflicts / known limitations

- **No genuine semantic conflicts were found.** The one apparent conflict — the original 16-
  section specification (`docs/design-sys-v2/1-5.specification.md` through
  `15-16.MigrationRule-Regression.md`) formally marks every section "Proposed," while this
  governance package treats their Pilot/Rollout-amended content as settled — is not treated as an
  open conflict: the task brief itself states V2 is implemented, rolled out, and Go-Live
  Readiness is PASS, which is the authoritative signal that supersedes the spec's own draft
  labeling. Documented here for transparency, not left ambiguous.
- **`ProductSemantics.md` is a condensed summary, not the full Business Invariant Registry.** The
  source (`docs/design-sys-v2/13.BusinessInvariantRegistry.md`) is substantially longer (full
  per-module invariant lists for Finance, Travel, Members, Permissions, Invitation, Wedding Guest,
  Wedding Guest CSV, Debt, cross-module, and presentation-layer invariants). This package
  extracted the boundary-relevant subset — what shared UI must never do — by design (the task
  asked for decision-making guidance, not a full spec copy). If a feature touches a business area
  in unusual depth (most likely: Debt, which the registry itself flags as sourced only from an
  architecture-prototype document, not a full business spec), the implementer should still consult
  the full registry or the relevant `docs/*.md` product spec, not treat `ProductSemantics.md` alone
  as exhaustive. This is called out explicitly in `ProductSemantics.md`'s "Note on Debt."
- **No new gaps found during validation** beyond the one addressed in §10.

## 12. Final recommendation

**GOVERNANCE READY**

The governance package answers all six required question categories, was validated against six
concrete hypothetical feature tasks with no artificial rules added to force a pass, and the two
agent adapters (`AGENTS.md`/`CLAUDE.md`) are thin pointers with zero content duplication. No
application source, business logic, or Design System component implementation was touched. This
is the terminal packaging task for Design System V2 — no further migration, audit, polish, or
cleanup wave should follow from it.
