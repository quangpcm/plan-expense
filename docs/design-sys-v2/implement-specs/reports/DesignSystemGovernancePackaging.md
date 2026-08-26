# Go Plan — Design System Governance Packaging

The Go Plan Design System V2 implementation is complete.

Current state:

- Design System V2 specification complete
- Core infrastructure complete
- 3 product Pilots complete
- Rollout Waves 0–7 complete
- Post-rollout review complete
- Pre-Go-Live fixes complete
- Visual Polish complete
- Go-Live Readiness PASS
- Overlay Architecture corrective amendments complete
- Product manually verified and considered stable for Go Live

We are NOT implementing another UI migration.

The final task is to turn the proven Design System into a durable
engineering standard that future AI coding agents and developers MUST
follow when implementing new features.

This governance system must work for both:

- Claude Code
- Codex / AGENTS.md-compatible coding agents
- human developers

────────────────────────────────────────
PRIMARY OBJECTIVE
────────────────────────────────────────

Create a single canonical Design System governance layer for the repo.

Future feature implementation should automatically answer:

1. Which existing component should I use?
2. When should I keep product-specific UI?
3. When may I create a new component/variant/token?
4. Which overlay should I use?
5. Which business/domain boundaries must never enter shared UI?
6. What checks are required before a feature is considered complete?

Do NOT create competing rule sets for different agents.

There must be ONE canonical source of truth.

Agent-specific files should be thin adapters pointing to it.

────────────────────────────────────────
REQUIRED INPUT
────────────────────────────────────────

Before writing anything, read:

/docs/design-sys-v2/*

especially:

- Design System Sections 1–16
- Audit Specification
- Audit Decision Record
- Implementation Specifications 01–08
- Pilot reports
- STOP/GO review
- Rollout reports
- Post-Rollout Design System Review
- Pre-Go-Live Fix reports
- Visual Polish reports
- Overlay Architecture corrective amendment reports
- docs/ui-modal-conventions.md

Also inspect current canonical shared components in:

src/shared/components/ui/

Do NOT derive rules from old specification alone when later Pilot/Rollout
evidence amended or refined them.

Current production behavior and final approved decisions take precedence
over early speculative guidance.

────────────────────────────────────────
STEP 1 — INVENTORY CURRENT GOVERNANCE
────────────────────────────────────────

Inspect existing repo-level AI/developer instruction files.

Examples may include:

- AGENTS.md
- CLAUDE.md
- .claude/*
- README instructions
- docs conventions
- coding rules
- project rules

Do not assume which files exist.

Identify:

- duplicate rules
- conflicting rules
- stale Design System guidance
- rules that should be centralized
- rules that must remain tool-specific

Do NOT modify anything yet.

────────────────────────────────────────
STEP 2 — DEFINE CANONICAL GOVERNANCE STRUCTURE
────────────────────────────────────────

Create or consolidate a canonical documentation package under:

docs/design-system/

Preferred conceptual structure:

docs/design-system/README.md
docs/design-system/ComponentUsage.md
docs/design-system/OverlayRules.md
docs/design-system/VisualRules.md
docs/design-system/ProductSemantics.md
docs/design-system/FeatureImplementationRules.md
docs/design-system/ExceptionsAndDebt.md

You may adjust filenames if current repository conventions strongly
justify a better structure.

Do not create unnecessary documents.

Each document must have a clear responsibility.

────────────────────────────────────────
SOURCE OF TRUTH RULE
────────────────────────────────────────

docs/design-system/README.md is the canonical entry point.

AGENTS.md and CLAUDE.md must NOT duplicate the entire Design System.

They should contain concise mandatory instructions such as:

Before implementing or modifying product UI:

1. Read docs/design-system/README.md.
2. Follow FeatureImplementationRules.md.
3. Reuse canonical components before creating UI primitives.
4. Preserve business/permission/data semantics.
5. Follow OverlayRules.md for all modal/dialog/sheet behavior.
6. Do not add shared component APIs/tokens without consumer evidence.

Then link/reference the canonical docs.

Avoid rule drift between agents.

────────────────────────────────────────
COMPONENT USAGE STANDARD
────────────────────────────────────────

Document the CURRENT approved component contracts and usage guidance.

Include at minimum:

Button
Badge
Card
Section
SectionHeading
Metric
MetricGroup
DataRow
EmptyState
ErrorState
FilterBar
PageHeader
EntityList
DropdownSelect
ResponsiveModal
ConfirmDialog
Collapsible
Skeleton

For each relevant component describe concisely:

USE WHEN
DO NOT USE WHEN
COMPOSITION NOTES
KNOWN PRODUCT-SPECIFIC EXCEPTIONS if important

Do not document every prop mechanically.

Focus on decision-making.

Examples of important learned boundaries:

- PlanCard rejected Metric composition when semantic hierarchy did not fit.
- WeddingGuestList rejected DataRow because row interaction structure was richer.
- SettlementSuggestionCard stayed product-specific because two identities +
  transfer direction are core semantics.
- MemberBalanceTable stayed product-specific because embedded progress bars make
  DataRow a poor fit.

These are positive examples of correct Design System usage.

Semantic fit is more important than adoption percentage.

────────────────────────────────────────
OVERLAY STANDARD
────────────────────────────────────────

Consolidate the final overlay rules including the later corrective findings.

Required principles:

ResponsiveModal:
- canonical form/workflow overlay
- desktop Dialog / mobile Drawer behavior
- approved size contract:
  sm / md / lg / xl
- nested ResponsiveModal chains are supported
- mobile scroll container uses vaul no-drag behavior
- focus lifecycle requirements

ConfirmDialog:
- destructive/consequential action confirmation
- Cancel = zero mutation
- Confirm = intended mutation once
- preserve severity semantics; not every confirmation must be destructive-red

BottomSheet:
- legacy / limited intentional exception
- may remain for approved menu/popover/read-only drilldown cases
- MUST NOT coexist with, contain, or participate in a ResponsiveModal chain
- if it does, migrate to ResponsiveModal

Also document:
- no z-index escalation hacks
- no setTimeout/useEffect focus hacks
- no consumer-specific pointer-event fixes

Use the final ui-modal-conventions.md decisions as evidence.

────────────────────────────────────────
VISUAL STANDARD
────────────────────────────────────────

Document the final visual principles rather than arbitrary pixel rules.

Include:

- typography hierarchy
- semantic colors
- neutral-first financial presentation
- spacing/density philosophy
- radius roles
- elevation philosophy
- responsive principles
- Card hierarchy

Important learned rule:

Avoid excessive:

Card
  inside Card
    inside Card

Prefer:

Page/surface
→ Section/group via spacing and typography
→ actual data/interactive item Card when needed

Do not globally flatten Cards.

Do not create raw radius/color values when an approved semantic role exists.

Document controlled legacy compatibility separately from canonical target.

────────────────────────────────────────
PRODUCT / DOMAIN BOUNDARIES
────────────────────────────────────────

Document what shared Design System code MUST NOT own.

Examples:

- PlanType branching
- Wedding Guest semantics
- Member vs Wedding Guest semantics
- invitation vs attendee count
- money gift vs gold gift
- Debt direction
- settlement direction
- Shared Fund calculations
- finance aggregation
- Owner/Editor/Viewer permissions
- module access decisions

Shared UI receives already-resolved:

- label
- value
- tone
- state
- children
- actions

It must not calculate domain truth.

────────────────────────────────────────
FINANCIAL TRUST RULES
────────────────────────────────────────

Explicitly document:

UI components DISPLAY financial truth.

They do not CALCULATE financial truth.

Financial calculations stay in:

- services
- domain utilities
- repositories/data layer where already defined

Do not move calculations into Metric/DataRow/Card.

Money presentation:
- use compact formatting where constrained presentation needs it
- use full formatting where exact value is appropriate
- never truncate money mid-number into an ambiguous string

Color:
- neutral by default
- semantic color only when it communicates genuine state/polarity
- direction must be explicit through text/content, never inferred from color alone

────────────────────────────────────────
PERMISSION RULES
────────────────────────────────────────

Document that UI refactoring must preserve the current permission model.

Shared Design System components MUST NOT know about:

Owner
Editor
Viewer
module permissions

Product layer resolves permission first and passes:

- whether an action exists
- whether content is visible
- whether controls are disabled

Do not infer permissions from visual role.

────────────────────────────────────────
NEW SHARED API / COMPONENT RULE
────────────────────────────────────────

Create a clear evidence gate.

Before adding:

- a new shared component
- Button variant
- Button size
- ResponsiveModal prop
- token family
- shared layout abstraction
- shared visual primitive

the implementer must establish:

1. real consumer evidence,
2. repeated semantic pattern,
3. clear ownership at shared layer,
4. no existing component fits cleanly.

One consumer alone normally does NOT justify expanding a shared contract.

Exceptions are allowed for:
- confirmed accessibility defects
- architecture defects
- capabilities required to preserve established UX cleanly

Document examples from this initiative:

ResponsiveModal.size:
approved after many unconstrained real consumers.

Collapsible.leading:
approved to fix a real invalid nested-interactive accessibility defect
without regressing UX.

Progress:
has strong evidence but deliberately remains deferred because current
implementations work and abstraction is not release-critical.

────────────────────────────────────────
FEATURE IMPLEMENTATION RULES
────────────────────────────────────────

Create a concise mandatory workflow for every future feature.

Recommended conceptual flow:

1. Understand domain behavior and invariants.
2. Identify permissions/data ownership.
3. Map UI needs to existing Design System components.
4. Mark each UI element:
   REUSE
   COMPOSE
   PRODUCT-SPECIFIC
   NEW-CAPABILITY-REVIEW
5. Implement product logic outside the Design System.
6. Verify business/permission/data invariants.
7. Run automated gate.
8. Perform targeted P0/P1 interaction verification.
9. Do not spend disproportionate effort on P2 pixel polish unless requested.

Do NOT require the huge Pilot-era audit process for normal features.

Verification effort must be proportional to:

business severity × blast radius.

────────────────────────────────────────
STOP CONDITIONS FOR FUTURE AI AGENTS
────────────────────────────────────────

Define when Claude/Codex MUST stop rather than improvise.

At minimum:

STOP if implementation requires:

- changing a business invariant
- changing permission semantics
- changing financial calculations
- changing service/repository/data semantics for a UI task
- adding a shared public Design System API
- adding a token family
- inventing a new generic abstraction
- contradicting an intentional exception
- resolving an ambiguous domain rule without product guidance

For ordinary local UI composition using existing contracts:

continue autonomously.

────────────────────────────────────────
EXCEPTIONS / DEFERRED BACKLOG
────────────────────────────────────────

Create a short maintained registry.

Distinguish:

INTENTIONAL EXCEPTION

from:

DEFERRED IMPROVEMENT

Known examples to capture accurately from final approved reports:

Intentional:
- WeddingGuestImportDialog legacy wide Dialog
- approved BottomSheet menu/read-only exceptions
- TodoNotificationScreen product-specific bottom overlay
- NotificationBadge not justified as its own primitive
- PlanType expression remains product-owned

Deferred:
- single-value Progress primitive
- Button size="icon"
- TextAction / link pattern
- opportunistic radius cleanup
- todo bell-tone dedup
- dead Statistic code
- stronger brand expression
- Debt visual-density polish
- Finance modal IA redesign

Do not automatically treat deferred items as required work for a future feature.

────────────────────────────────────────
CLAUDE CODE ADAPTER
────────────────────────────────────────

Inspect current CLAUDE.md / .claude rules.

Update them minimally so Claude Code:

- must read docs/design-system/README.md for UI work
- follows FeatureImplementationRules
- obeys stop conditions
- does not invent shared DS capabilities
- preserves domain/business boundaries
- uses risk-based verification

Do not duplicate all canonical documentation inside CLAUDE.md.

────────────────────────────────────────
CODEX / AGENTS ADAPTER
────────────────────────────────────────

Inspect existing AGENTS.md.

If one exists:
update it minimally.

If none exists:
create one.

It should instruct coding agents to:

- read docs/design-system/README.md before UI/feature work
- use canonical shared components
- follow FeatureImplementationRules
- respect ProductSemantics
- follow OverlayRules
- stop on shared API/business/permission/calculation changes
- use risk-based verification

Keep AGENTS.md concise.

Do not copy the full Design System into it.

────────────────────────────────────────
CONFLICT PRECEDENCE
────────────────────────────────────────

Define precedence explicitly.

Recommended:

1. Current product/business specification
2. Explicit domain invariants
3. Design System governance docs
4. Feature-specific implementation docs
5. Agent adapter instructions
6. Legacy/local code conventions

If documents conflict:

do NOT silently choose.

The agent should surface the conflict when it affects semantics.

Later approved decisions override older speculative documentation.

────────────────────────────────────────
OPTIONAL CODE COMMENTS
────────────────────────────────────────

Only add code comments where they prevent a proven architecture mistake.

Good example:

ResponsiveModal / BottomSheet nesting rule.

Bad example:

large comments repeating docs next to every Card/Button.

Prefer documentation over comment duplication.

────────────────────────────────────────
VALIDATION
────────────────────────────────────────

After writing governance docs:

Validate them against at least these hypothetical future tasks:

A.
"Add a new Wedding overview KPI"

Can the rules tell the agent whether Metric is appropriate?

B.
"Add a delete action"

Can the agent determine ConfirmDialog usage and mutation contract?

C.
"Add a new modal form"

Can the agent determine ResponsiveModal and size choice?

D.
"Add a new financial balance card"

Can the agent avoid calculating financial values in the UI?

E.
"Add a PlanType-specific visual"

Can the agent keep PlanType out of shared UI?

F.
"Need a new Button variant for one screen"

Do the rules correctly trigger shared-API review instead of allowing
the agent to invent it?

Document only shortcomings found by this validation.

Do not create artificial rules solely to make the validation examples pass.

────────────────────────────────────────
FILES / CHANGE CONTROL
────────────────────────────────────────

This task MAY modify documentation / agent-rule files.

Expected categories:

docs/design-system/*
AGENTS.md
CLAUDE.md / .claude/* where applicable
docs/ui-modal-conventions.md only if consolidation requires a pointer
to the canonical OverlayRules document

Do NOT modify application source code.

Do NOT modify business logic.

Do NOT modify Design System component implementation.

If you believe application source must change:
STOP and report why.

────────────────────────────────────────
REPORT
────────────────────────────────────────

Create:

docs/design-system/GovernancePackaging.Report.md

Include:

1. governance structure created
2. existing rule files found
3. files created/modified
4. duplicated/stale rules consolidated
5. Claude Code adapter
6. Codex/AGENTS adapter
7. precedence model
8. feature implementation workflow
9. stop conditions
10. validation scenarios
11. unresolved conflicts, if any
12. final recommendation

Final disposition:

GOVERNANCE READY

or

HOLD — GOVERNANCE CONFLICT

────────────────────────────────────────
FINAL RULE
────────────────────────────────────────

This is the LAST Design System V2 packaging task.

Do not start another migration, audit, polish, or cleanup wave.

The goal is not a perfect documentation library.

The goal is:

Future developers and AI coding agents should be able to build new
Go Plan features consistently without needing to reconstruct the entire
Design System V2 decision history.

After producing the governance package and report:

STOP.