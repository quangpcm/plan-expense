# Go Plan Color Architecture Specification

## 1. Status and Scope

This document is the **approved architectural specification** for Go Plan's Option D color migration
and future Light/Dark mode. It converts the findings in
[`ColorSystemAudit.Report.md`](./ColorSystemAudit.Report.md) plus a set of product/design decisions
into a single implementation-ready contract.

**Relationship to the audit**: the audit is evidence (current architecture, consumer counts,
hardcode findings, migration risk). This spec is the decision (what engineers must build). Where
this spec and the audit's §18 "Open Decisions" disagree, **this spec wins** — several audit proposals
are explicitly amended below (Dark `brand.primary`, `text.muted`) and the reasoning is recorded inline
so the amendment isn't mistaken for an oversight.

**Not in scope / not done here**: no application code, CSS, React components, `providers.tsx`,
`package.json`, or existing Design System governance docs (`README.md`, `VisualRules.md`,
`ExceptionsAndDebt.md`, `ComponentUsage.md`, `ProductSemantics.md`) were modified to produce this
document. The only file this task creates is this one.

---

## 2. Architectural Principles

1. **Semantic tokens are the public UI contract.** Foundation scale steps (`violet-9`, `gray-11`, …)
   are private implementation detail — no shared or product component may reference a numbered step
   directly.
2. **Accessibility and semantic role outrank numerical symmetry.** Light and Dark do not need to use
   the same foundation step number for the "same" semantic token. Two tokens amended in this spec
   (Dark `brand.primary`, `text.muted`) exist specifically because a literal step-for-step port failed
   this principle.
3. **Brand is not status.** Violet expresses interaction/identity; it never substitutes for
   success/warning/danger/info meaning.
4. **Domain/finance color is not automatically status color.** `income`/`expense` are finance-domain
   semantics that happen to be evaluated for parity with status colors, not the same tokens.
5. **Plan-Type expression stays product-owned.** No PlanType branching enters
   `src/shared/components/ui/` as part of this architecture.
6. **No mass rewrite.** 851 `slate-*` occurrences and the legacy raw token layer migrate
   incrementally, component/module by component/module, gated by the phase plan in §17.
7. **Provisional means provisional.** Dark surface values not yet visually piloted are explicitly
   labeled and must not be treated as final by an implementation task.

---

## 3. Layer Model

```
Approved palette sources (Option D Violet + Gray; status-family scales — pending, see §18)
        ↓
Private foundation scales (--gp-violet-*, --gp-gray-*, and later --gp-{green,amber,red,blue}-*)
        ↓
Semantic color tokens (--color-surface-*, --color-text-*, --color-border-*, --color-brand-*,
                        --color-status-*, --color-focus-*, --color-overlay-*)
        ↓
Shared UI components (Button, Card, ResponsiveModal/BottomSheet, AppHeader, …)
        ↓
Product / domain presentation (plan-card-visuals.ts, finance-category-donut.tsx, …)
```

**Hard rule**: shared or product UI components consume semantic tokens only.

```css
/* Bad — inside any component */
color: var(--gp-violet-11);
background: var(--gp-gray-2);

/* Good */
color: var(--color-text-link);
background: var(--color-surface-default);
```

Foundation-scale variables exist so semantic tokens have a traceable, palette-sourced origin — they
are not an alternate public vocabulary.

---

## 4. Foundation Palette

**Approved**: Option D Violet (brand) and Option D Gray (neutral), Light + Dark, sourced verbatim
from the six files already in `docs/palette/` (cross-checked byte-for-byte against this task's source
files — no discrepancies).

Recommended private naming (may be refined for technical reasons, but must not become public
Tailwind utilities or component-facing API):

```text
--gp-violet-1 … --gp-violet-12
--gp-violet-a1 … --gp-violet-a12      (alpha variants — for hover washes, focus glows, backdrops)

--gp-gray-1 … --gp-gray-12
--gp-gray-a1 … --gp-gray-a12
```

**Not imported**: Radix Themes–specific variables (`violet-contrast`, `violet-surface`,
`violet-indicator`, `violet-track`, and their `gray-*` equivalents). These exist to support
`@radix-ui/themes` components, which Go Plan does not use (`package.json` confirms only individual
`@radix-ui/react-*` primitives). No current semantic role requires them; if one is identified in a
later phase, add it then, evidence-gated — not now, speculatively.

P3/OKLCH-enhanced blocks (`@supports (color: color(display-p3 1 1 1))`) present in the source files
are retained as-is when foundation variables are wired in — they're a progressive enhancement of the
same steps, not a separate decision.

---

## 5. Semantic Token Model

Semantic groups and their required tokens (minimum set — do not add roles without evidence):

```text
surface.page, surface.default, surface.subtle, surface.raised, surface.overlay, surface.selected
text.primary, text.secondary, text.muted, text.disabled, text.inverse, text.link
border.subtle, border.default, border.strong, border.focus
brand.primary, brand.primary-hover, brand.primary-active, brand.foreground, brand.subtle, brand.selected
focus.ring, focus.ring-soft
overlay.backdrop
status.success, status.warning, status.danger, status.info   (values pending §8/§18)
income, expense                                                (finance/domain — unchanged this phase)
```

Each semantic token is a single `--color-*` CSS custom property in `@theme`, resolving (directly or
via a private foundation variable) to one Light value and one Dark value. See §9 for the canonical
table.

---

## 6. Brand Architecture

**Approved**: the historical two-family split (`--color-primary` navy vs. `--color-accent` blue) is
**deprecated**. Go Plan moves to **one Brand interaction family**, sourced from Option D Violet. No
second generic "accent" brand family is preserved for its own sake.

```text
brand.primary
brand.primary-hover
brand.primary-active
brand.foreground
brand.subtle
brand.selected
```

Related interaction roles draw from the same Violet foundation but are **not required to match
brand.primary's step number** — semantic purpose and accessibility decide the exact step per role:

```text
text.link
border.focus
focus.ring
focus.ring-soft
```

### Light brand mapping — LOCKED

| Token | Value | Source | White-fg / self contrast | Rationale |
|---|---|---|---|---|
| `brand.primary` | `#5147E5` | Light `violet-9` | white-on-fill: 6.21:1 ✅ | Approved anchor value |
| `brand.primary-hover` | `#463BCB` | Light `violet-10` | white-on-fill: 7.64:1 ✅ | One step more saturated — standard hover-darken |
| `brand.primary-active` | `#4940D0` | Light `violet-11` | white-on-fill: 7.17:1 ✅ | Confirmed via recalculation; distinct from hover, still clearly a "further pressed" state despite the lower raw hex value than `violet-10` — visually reads as more saturated/deep, not lighter |
| `brand.foreground` | `#FFFFFF` | — | — | Text/icon color on any brand-primary fill |
| `brand.subtle` | `#E6E9F8` | Light `violet-3` | — (surface, not text) | Soft selection/hover background |
| `brand.selected` | `#D9DFFE` | Light `violet-4` | — (surface) | One step up from `subtle` for an active-selected state |

### Dark brand mapping — LOCKED (amended from audit)

**Amendment**: the audit proposed Dark `brand.primary = violet-9 (#7067F0)` while separately
concluding the Button itself should use `violet-10` — an internal contradiction (a shared Button must
consume `--color-brand-primary`, never a different foundation step directly). This spec resolves the
contradiction at the **token** level, not the component level.

**Rule**: `brand.primary` must itself be the accessible resting solid-fill value. A component never
bypasses the semantic token to reach for a "more correct" foundation step.

| Token | Value | Source | White-fg contrast | Rationale |
|---|---|---|---|---|
| `brand.primary` | `#6459E1` | Dark `violet-10` | 5.17:1 ✅ | **Amended.** Dark `violet-9` (#7067F0) only reaches 4.30:1 with white foreground — fails AA. `violet-10`, despite being numerically "step 10," has *lower* luminance than `violet-9` in this Dark scale (0.153 vs. 0.194) and is the correct accessible resting value. |
| `brand.primary-hover` | `#5954BD` | Dark `violet-8` | 6.13:1 ✅ | Recalculated full Dark violet luminance ladder (steps 1–12) to find the next AA-passing, visually-distinguishable step in the "further emphasis" direction from `violet-10`. Step 9 is skipped deliberately — it sits between 8 and 10 in luminance but fails AA (see above), so it cannot appear anywhere in the interactive-fill ladder. |
| `brand.primary-active` | `#4B469E` | Dark `violet-7` | 7.87:1 ✅ | One step further than hover, same reasoning — continues the accessible, monotonically-more-emphasized ladder `10 → 8 → 7`. |
| `brand.foreground` | `#FFFFFF` | — | — | Unchanged — same foreground color works in both themes once the fill itself is corrected. |
| `brand.subtle` | `#22204D` | Dark `violet-3` | text.primary-on-this: 11.7:1 (`gray-12`); brand-tinted text (`violet-12`) on this: 11.7:1 | Soft selection/hover background |
| `brand.selected` | `#2C256C` | Dark `violet-4` | brand-tinted text (`violet-12`) on this: 10.2:1 | One step up from `subtle` |

**Explicit statement required by this spec**: *Light and Dark semantic tokens do not need to map to
identical foundation step numbers. Semantic role, perception, and accessibility take precedence over
numerical symmetry.* Both the Dark `brand.primary` ladder above (10 → 8 → 7, skipping 9) and the Dark
`text.link` decision (§7) are direct applications of this rule, not exceptions to it.

---

## 7. Neutral / Surface Architecture

### Text — including the `text.muted` amendment

**Amendment**: the audit proposed `text.muted = gray-10` in both themes (Light 4.07:1, Dark 4.31:1),
both failing AA, with a documented restriction to "large text/icons/metadata only." **That proposal
is rejected.** Go Plan's metadata commonly renders at 12–14px, which is normal text size under WCAG
2.2 (large text requires ≥24px, or ≥18.66px bold) — a semantic token literally named `muted` that
silently fails at the sizes it's most used for is a defect waiting to happen, not a usable role.

**Resolution** (recalculated against `surface.page`, `surface.default`, and `surface.subtle` in both
themes): Option D Gray has no step between 10 (fails, 3.5–4.3:1 across all surfaces checked) and 11
(passes everywhere, 5.4–8.7:1). There is no intermediate value to select without inventing an
unapproved hex, which is out of scope. Therefore:

**`text.muted` uses the same foundation step as `text.secondary` in both themes** (Light `gray-11`
`#4D5D73`; Dark `gray-11` `#A6B5CA`). This is a deliberate, evidence-driven outcome, not an
oversight — recorded explicitly so a later implementer doesn't "fix" it by reintroducing `gray-10`.
`text.secondary` and `text.muted` remain **distinct semantic tokens** (different intended use in
markup/intent) even though they currently resolve to the same value; a future typographic treatment
(weight/size/letter-spacing) — not color — is the correct way to differentiate them further if needed.

`text.disabled` is unaffected by this rule: disabled controls are explicitly exempt from WCAG
contrast requirements, and Option D `gray-9` (Light `#7185A2`, Dark `#5B6F8C`) remains appropriate —
**but disabled-tier contrast must never be reused for any enabled/readable text role.**

| Token | Light | Source | Light contrast (worst case across page/default/subtle) | Dark | Source | Dark contrast (worst case) |
|---|---|---|---|---|---|---|
| `text.primary` | `#162130` | `gray-12` | 13.18–16.22:1 | `#EAEEF5` | `gray-12` | 12.14–15.61:1 |
| `text.secondary` | `#4D5D73` | `gray-11` | 5.45–6.71:1 | `#A6B5CA` | `gray-11` | 6.78–8.72:1 |
| `text.muted` | `#4D5D73` | `gray-11` (amended — same as `text.secondary`, see above) | 5.45–6.71:1 | `#A6B5CA` | `gray-11` (amended) | 6.78–8.72:1 |
| `text.disabled` | `#7185A2` | `gray-9` | 3.06–3.76:1 (exempt) | `#5B6F8C` | `gray-9` | 2.76–3.54:1 (exempt) |
| `text.inverse` | `#FFFFFF` | — | — (on brand-solid fills) | `#FFFFFF` | — | — |
| `text.link` | `#5147E5` | `violet-9` | 5.85:1 | `#A7AAFF` | `violet-11` (amended — see below) | 8.51:1 |

**Dark `text.link` — LOCKED**: Dark `violet-9` (#7067F0) on `surface.page` reaches only 4.23:1,
failing AA. Dark `violet-11` (#A7AAFF) reaches 8.51:1. **Approved: Dark `text.link = violet-11`.**
This is the same "step number doesn't need to match" principle as `brand.primary` — `violet-9`
remains reserved for solid-fill contexts (where its own foreground is chosen deliberately), never for
text sitting directly on a page/card surface in Dark.

### Surface

| Token | Light | Source | Status | Dark | Source | Status |
|---|---|---|---|---|---|---|
| `surface.page` | `#F7F8FC` | Option D `--color-background` | LOCKED | `#101525` | Option D `--color-background` | LOCKED |
| `surface.default` | `#FFFFFF` | unchanged | LOCKED | `#181D23` | Dark `gray-2` | **PROVISIONAL — VISUAL PILOT** |
| `surface.subtle` | `#EEF2F7` | Light `gray-2` | LOCKED | `#1F252E` | Dark `gray-3` | **PROVISIONAL — VISUAL PILOT** |
| `surface.raised` | `#FFFFFF` (elevation via shadow only, no distinct tint) | unchanged | LOCKED | `#1F252E` (same value as `surface.subtle` by design — see below) | Dark `gray-3` | **PROVISIONAL — VISUAL PILOT** |
| `surface.overlay` | `#FFFFFF` | unchanged | LOCKED | `#232C37` | Dark `gray-4` | **PROVISIONAL — VISUAL PILOT** |
| `surface.selected` | `#E6E9F8` | Light `violet-3` | LOCKED (additive, 0 current consumers) | `#22204D` | Dark `violet-3` | LOCKED (additive) |

**Dark surface.raised deliberately shares its value with `surface.subtle`** per the architectural
principle in §11: different semantic roles may share a physical value where border/elevation/context
differentiates them. `surface.raised`'s real job in Dark is providing a lightness step *above*
`surface.page` (dark UI conventionally signals elevation via luminance, not shadow — Light's
shadow-only approach doesn't read on a dark canvas) — `surface.subtle` already provides exactly that
step, so no second HEX value is manufactured just to give `raised` a nominally unique color. This is
provisional pending the pilot in §16; the pilot may find `raised` needs its own `gray-4` step if
`subtle` and `raised` co-occur in the same view and become visually ambiguous.

### Border

| Token | Light | Source | Dark | Source |
|---|---|---|---|---|
| `border.subtle` | `#D7E0ED` | Light `gray-4` | `#232C37` | Dark `gray-4` |
| `border.default` | `#C4D1E3` | Light `gray-6` | `#2F3B4B` | Dark `gray-6` |
| `border.strong` | `#9EB3D1` | Light `gray-8` | `#4D627E` | Dark `gray-8` |
| `border.focus` | `#5147E5` | Light `violet-9` | `#7067F0` | Dark `violet-9` |

`border.focus` intentionally uses `violet-9` in **both** themes even though `text.link`/`brand.primary`
do not — a focus ring is judged under WCAG's 3:1 non-text-contrast criterion, not the 4.5:1 text
criterion, and `violet-9` clears 3:1 against both page backgrounds (Light 5.85:1, Dark 4.23:1) with
room to spare. There is no accessibility reason to move it off step 9, so it stays aligned with
`focus.ring` (§9) rather than with `brand.primary`'s amended step.

---

## 8. Status and Domain Color Architecture

Option D (Violet + Gray) **does not own status meaning**. `status.success/warning/danger/info` and
finance-domain `income/expense` remain **separate semantic families**, unaffected by the brand
migration in §6.

**Approved sourcing strategy**: use matching **Radix Light/Dark Green/Amber/Red/Blue** scales, the
same philosophy already applied to Violet/Gray (Option D). Do not hand-pick Dark status hex values,
do not derive them via an undocumented OKLCH formula, and do not substitute brand Violet for any
status role.

**Blocking input**: `docs/palette/` currently contains only the six Violet/Gray Light+Dark files.
**No Green/Amber/Red/Blue scale files exist yet.** This spec does not invent them — see §18.

**Role classification required before implementation**: a single status hex today is reused across
several visually distinct jobs (text, icon, solid fill, soft background, border, chart/dataviz).
Before the future status token architecture is finalized, implementation must classify real
consumers by role:

```text
text · icon · solid fill · soft surface · border · chart/data visualization
```

The eventual architecture may need role separation (illustrative, not committed):

```text
status.success
status.success-text
status.success-surface
```

or an equivalent minimal set — **do not build this matrix speculatively**; derive it from the actual
consumer classification.

**Pre-existing accessibility debt** (Light, normal-text use, found by the audit, unaffected by this
migration): `success`/`income` 3.55:1, `warning` 3.00:1, `expense` 3.53:1 — all below AA. **This is
not accepted as permanent debt.** The eventual status/domain migration must resolve these — but the
fix requires the consumer-role classification above first (a color that fails as *text* may be
perfectly fine as an *icon fill* or *chart segment*, which have different or no WCAG text-contrast
obligation), so no single replacement hex is proposed here. `income`/`expense` continue to be treated
as their own finance-domain family, not silently absorbed into `status.success`/`status.danger` just
because they currently share/resemble those hex values.

---

## 9. Canonical Light / Dark Mapping

| Semantic role | Light | Source | Dark | Source | Status |
|---|---|---|---|---|---|
| `surface.page` | `#F7F8FC` | Option D bg | `#101525` | Option D bg | LOCKED |
| `surface.default` | `#FFFFFF` | — | `#181D23` | Dark gray-2 | PROVISIONAL — VISUAL PILOT |
| `surface.subtle` | `#EEF2F7` | Light gray-2 | `#1F252E` | Dark gray-3 | PROVISIONAL — VISUAL PILOT |
| `surface.raised` | `#FFFFFF` | — | `#1F252E` | Dark gray-3 | PROVISIONAL — VISUAL PILOT |
| `surface.overlay` | `#FFFFFF` | — | `#232C37` | Dark gray-4 | PROVISIONAL — VISUAL PILOT |
| `surface.selected` | `#E6E9F8` | Light violet-3 | `#22204D` | Dark violet-3 | LOCKED |
| `text.primary` | `#162130` | Light gray-12 | `#EAEEF5` | Dark gray-12 | LOCKED |
| `text.secondary` | `#4D5D73` | Light gray-11 | `#A6B5CA` | Dark gray-11 | LOCKED |
| `text.muted` | `#4D5D73` | Light gray-11 (amended) | `#A6B5CA` | Dark gray-11 (amended) | LOCKED |
| `text.disabled` | `#7185A2` | Light gray-9 | `#5B6F8C` | Dark gray-9 | LOCKED |
| `text.inverse` | `#FFFFFF` | — | `#FFFFFF` | — | LOCKED |
| `text.link` | `#5147E5` | Light violet-9 | `#A7AAFF` | Dark violet-11 (amended) | LOCKED |
| `border.subtle` | `#D7E0ED` | Light gray-4 | `#232C37` | Dark gray-4 | LOCKED |
| `border.default` | `#C4D1E3` | Light gray-6 | `#2F3B4B` | Dark gray-6 | LOCKED |
| `border.strong` | `#9EB3D1` | Light gray-8 | `#4D627E` | Dark gray-8 | LOCKED |
| `border.focus` | `#5147E5` | Light violet-9 | `#7067F0` | Dark violet-9 | LOCKED |
| `brand.primary` | `#5147E5` | Light violet-9 | `#6459E1` | Dark violet-10 (amended) | LOCKED |
| `brand.primary-hover` | `#463BCB` | Light violet-10 | `#5954BD` | Dark violet-8 (amended) | LOCKED |
| `brand.primary-active` | `#4940D0` | Light violet-11 | `#4B469E` | Dark violet-7 (amended) | LOCKED |
| `brand.foreground` | `#FFFFFF` | — | `#FFFFFF` | — | LOCKED |
| `brand.subtle` | `#E6E9F8` | Light violet-3 | `#22204D` | Dark violet-3 | LOCKED |
| `brand.selected` | `#D9DFFE` | Light violet-4 | `#2C256C` | Dark violet-4 | LOCKED |
| `focus.ring` | `#5147E5` | Light violet-9 | `#7067F0` | Dark violet-9 | LOCKED |
| `focus.ring-soft` | `violet-a5` `#CBD3FF` | Light violet alpha | `violet-a5` `#6C56FF66` | Dark violet alpha | LOCKED |
| `overlay.backdrop` | `rgb(2 6 23 / 40%)` | unchanged (harvested value, works correctly today) | `rgb(2 6 23 / ~55–60%)` | derived, not a direct Option D value | PROVISIONAL — VISUAL PILOT |
| `status.success/warning/danger/info` | unchanged existing hex (Light) | pre-existing | — | Radix Green/Amber/Red/Blue Dark (not yet available) | **PENDING STATUS PALETTE** |
| `income` / `expense` | unchanged existing hex (Light) | pre-existing | — | same as above | **PENDING STATUS PALETTE** |

---

## 10. Legacy Token Lifecycle

| Existing token | Target semantic token | Lifecycle | Migration note |
|---|---|---|---|
| `--color-background` | `--color-surface-page` | KEEP AS FOUNDATION COMPATIBILITY | Repoint its own value to Option D `#F7F8FC`; `surface-page` continues aliasing it — no rename needed, only a value update. |
| `--color-foreground` | `--color-text-primary` | KEEP AS FOUNDATION COMPATIBILITY | Repoint value to `gray-12` `#162130`. |
| `--color-surface` | `--color-surface-default` | KEEP AS FOUNDATION COMPATIBILITY | Value unchanged in Light (`#FFFFFF`); gains a real Dark value (§9, provisional). |
| `--color-surface-soft` | `--color-surface-subtle` | KEEP AS FOUNDATION COMPATIBILITY | Repoint value to `gray-2` `#EEF2F7`. |
| `--color-muted` | `--color-text-secondary` **and** `--color-text-muted` | KEEP AS FOUNDATION COMPATIBILITY | Repoint value to `gray-11` `#4D5D73`. **Naming collision risk**: the legacy raw name `--color-muted` and the new semantic `--color-text-muted` sound like the same thing but historically aliased different raw tokens (`--color-muted` vs. `--color-subtle`). Post-amendment (§7) both semantic tokens resolve to the same value anyway, which removes the risk in practice — but keep the two names conceptually distinct in code review. |
| `--color-subtle` | (superseded — see note) | DEPRECATED | Since `text.muted` now equals `text.secondary`'s value (§7 amendment), a separate raw `--color-subtle` holding a different hex than `--color-muted` no longer has a real role. Do not delete immediately (18 consumers) — repoint its value to also equal `gray-11`, then let it fall out of use as consumers migrate to `--color-text-secondary`/`--color-text-muted` directly; remove once consumer count reaches 0. |
| `--color-border` | `--color-border-default` | KEEP AS FOUNDATION COMPATIBILITY | Repoint value to `gray-6` `#C4D1E3`. |
| `--color-border-strong` | `--color-border-strong` (name already matches) | KEEP AS FOUNDATION COMPATIBILITY | Repoint value to `gray-8` `#9EB3D1`. |
| `--color-primary` | `--color-brand-primary` | TEMPORARY ALIAS | Today `--color-brand-primary` aliases `--color-primary` (68 + 23 combined consumers). Flip the alias direction — `--color-primary` becomes a temporary compatibility alias of `--color-brand-primary` — so the 68 direct `--color-primary` consumers keep working unchanged while new/touched code is written against `--color-brand-primary`. Target: DEPRECATED once direct `--color-primary` consumer count reaches 0 (tracked per-phase, not a deadline). |
| `--color-primary-hover` | `--color-brand-primary-hover` | TEMPORARY ALIAS | Same pattern, 7 consumers. |
| `--color-primary-foreground` | `--color-brand-foreground` | TEMPORARY ALIAS | Low consumer count; same pattern. |
| `--color-secondary` | *(no rename — stays raw)* | KEEP AS FOUNDATION COMPATIBILITY | Confirmed legitimate as-is: `Badge`'s `neutral` tone documentation explicitly notes no exact semantic alias exists and none is needed (`ComponentUsage.md`). Not part of the brand family; leave alone. |
| `--color-secondary-foreground` | *(no rename — stays raw)* | KEEP AS FOUNDATION COMPATIBILITY | Same reasoning. |
| `--color-accent` | *(none — retired, not renamed 1:1)* | DEPRECATED → REPLACE | **No single replacement.** Today's 24 consumers span at least four different semantic roles (nav-active, link text, focus ring, border-focus) that must each resolve to their own correct token (`--color-brand-primary`, `--color-text-link`, `--color-focus-ring`, `--color-border-focus` respectively) — a mechanical rename would just relocate the original `--color-accent`/`--color-primary` conflation (§6) one level down. Requires **per-consumer triage**, not a find-and-replace. Target: fully removed by the end of Phase 4 (§17). |
| `--color-accent-soft` | `--color-brand-subtle` / `--color-focus-ring-soft` | DEPRECATED → REPLACE | Same triage requirement as `--color-accent` — 9 consumers, likely split between "soft brand background" and "soft focus glow" roles. |

**Distinction used throughout this table**:
- **KEEP AS FOUNDATION COMPATIBILITY** — the raw token stays, permanently, as the underlying value-holder a semantic token aliases. Not legacy debt.
- **TEMPORARY ALIAS** — the raw token is kept working during migration by aliasing *to* the new semantic token (reversed from today's direction), with an intent to reach 0 consumers and be removed.
- **DEPRECATED** — no longer the recommended token; new code must not reach for it; existing consumers migrate opportunistically.
- **REPLACE** — DEPRECATED with a specific required per-consumer triage (no single 1:1 target token exists).

---

## 11. Interaction State Rules

**Deprecated pattern for new code**: deriving a theme-sensitive hover/active state by mixing a
semantic color toward a literal `white` or `black`:

```css
/* Deprecated for new code */
color-mix(in srgb, var(--color-primary) 78%, white)
color-mix(in srgb, var(--color-primary) 78%, black)
```

This pattern is Light-correct today (27 occurrences, per the audit) but breaks under Dark: mixing
toward literal `black` to "darken" a hover state is only correct when the base color is tuned for a
light canvas; the same literal-black mix on a Dark-appropriate value would crush contrast instead of
producing the intended hover feedback.

**Preferred replacement**: explicit semantic interaction tokens —

```text
brand.primary-hover, brand.primary-active   (§6/§9)
status.*-hover  (add per-role only when a real consumer needs it — not speculatively, per §8)
```

or an approved alpha foundation step (`--gp-violet-a*`) where a translucent wash (not a solid color
swap) is the actual desired effect, e.g. a hover wash over an arbitrary underlying surface where a
flat hex can't be pre-computed.

**Migration posture**: existing `color-mix(…, white/black)` occurrences do **not** require a mass
cleanup. They migrate incrementally as the owning component/module becomes theme-safe (Phase 3 for
shared primitives, later phases for product code) — consistent with the audit's "no mass replace"
finding (851 `slate-*`, same posture applies here).

---

## 12. Dark Mode Runtime Direction

**Approved future direction** (not implemented by this task):

- **`next-themes`**, class-based theming: `attribute="class"`, `defaultTheme="system"`,
  `enableSystem`. `.dark` applied to the root `<html>` element (matches the selector already present
  in the copied Option D Dark files — `.dark, .dark-theme`, once the inert `.radix-themes` compound
  selector is stripped during wiring).
- Implementation must address: SSR/hydration, flash-of-wrong-theme prevention (via `next-themes`'
  built-in blocking script), `suppressHydrationWarning` on `<html>` if required, syncing the browser
  `theme-color` meta tag to the resolved theme (today a static `#020617` in `layout.tsx`'s `viewport`
  export, which can't be conditional at the Next.js static-export level and needs a small client-side
  sync), persisted user preference, and system (`prefers-color-scheme`) support.

This section records the approved direction only. `next-themes` is **not installed** by this task.

---

## 13. Accessibility Requirements

These are binding architectural requirements, not suggestions:

1. **Enabled readable text** — `text.primary`, `text.secondary`, `text.muted`, `text.link` — must
   satisfy WCAG 2.2 AA normal-text contrast (≥4.5:1) against the surfaces they're intended to appear
   on (§7, §9 tables record the worst-case ratio actually checked, across `surface.page`,
   `surface.default`, `surface.subtle`).
2. **Brand solid controls** — `brand.primary` + `brand.foreground` together must meet AA normal-text
   contrast (≥4.5:1) for button/CTA label text, in both Light and Dark. This is the rule that drove
   the Dark `brand.primary` amendment (§6) — a shared Button consumes `--color-brand-primary` and
   never a different foundation step to "fix" a contrast failure after the fact.
3. **Focus indicators** must satisfy the WCAG 2.2 non-text-contrast criterion (≥3:1) and remain
   visually obvious in both themes — `focus.ring` (`violet-9` in both themes) clears this with margin
   (Light 5.85:1, Dark 4.23:1, both ≥3:1).
4. **State is never color-only.** Consistent with existing `VisualRules.md` policy — this
   specification does not change that rule, only the palette beneath it.
5. **Disabled treatment is exempt but non-transferable.** `text.disabled` may use lower contrast than
   the 4.5:1 floor; that lower-contrast treatment must never be reused for any enabled/readable text
   role (this is why `text.muted` was amended in §7 rather than left at a failing `gray-10`).

---

## 14. Plan-Type Boundary

Unchanged from current governance (`ProductSemantics.md`, `ExceptionsAndDebt.md` #5/#10) — this
architecture does not touch it:

- Plan-Type (Wedding, Travel, Debt, Saving, Event, …) accent/expression logic remains entirely
  product-owned in `plan-card-visuals.ts` and equivalents. It is not extracted into the Foundation
  token layer as part of this work.
- Confirmed zero `planType` references inside `src/shared/components/ui/` today — this architecture
  preserves that boundary; nothing in §3–§9 introduces a PlanType-aware token.
- Dark-safe Plan-Type variants (raw hex gradients/accent text currently tuned for a light card
  surface) will be needed eventually — that is a **product/domain migration phase** (§17 Phase 7),
  not a Foundation-layer concern.
- **Semantic status always outranks Plan-Type accent** where the two would visually conflict — this
  rule is unchanged and this architecture does not create any new conflict surface.

---

## 15. Implementation Invariants

1. Components consume semantic tokens, never numbered foundation steps.
2. Neutral UI must not introduce new raw `slate-*` usage — new code uses `text.*`/`border.*`/
   `surface.*` semantic tokens.
3. Brand is not semantic status.
4. Finance/domain colors (`income`/`expense`) are not automatically status colors.
5. Plan-Type colors remain product-owned.
6. Light/Dark mappings may use different foundation step numbers — accessibility and semantic role
   decide the step, not numerical symmetry.
7. Accessibility takes precedence over step-number symmetry (see the two amendments in §6/§7).
8. No theme-sensitive hover/active state derived via `color-mix(…, white)` / `color-mix(…, black)` in
   new code (§11).
9. No mass color replacement — `slate-*`, legacy raw tokens, and the `color-mix` pattern all migrate
   incrementally, gated by the phase plan (§17).
10. Dark surface values marked **PROVISIONAL — VISUAL PILOT** in §9 remain provisional until the
    acceptance criteria in §16 are met and a reviewer explicitly relabels them LOCKED.

---

## 16. Provisional Values and Pilot Acceptance

**Provisional today** (§9): Dark `surface.default`, `surface.subtle`, `surface.raised`,
`surface.overlay`, and `overlay.backdrop`'s exact Dark opacity. Everything else in §9 is LOCKED.

**Why provisional**: Dark UI hierarchy is highly sensitive to small luminance deltas in a way Light
isn't — the audit and this spec can compute contrast math, but "does this look like a stack of gray
boxes," "is there too much violet atmosphere," and "does the overlay actually recede/emerge
correctly" are perceptual judgments that require a rendered pilot, not another calculation.

### Pilot acceptance criteria

**App Shell / Navbar**
- Page vs. navbar surfaces are clearly separated.
- Active navigation item is clearly visible against the nav background.
- Brand (violet) presence does not read as an atmospheric wash across the shell.
- The translucent/backdrop-blur surface remains legible over varied page content.

**Card**
- Card clearly separates from the page surface.
- Nested surfaces (Card containing a sub-surface) do not collapse into an indistinguishable stack of
  gray boxes — `surface.raised`/`surface.subtle` sharing a value (§7) must still read as intentional
  layering once a `border.subtle` and real content are present, not as a mistake.
- Border is sufficient on its own to read as a boundary (elevation is not relied on where shadows are
  weak/invisible in Dark).

**ResponsiveModal / BottomSheet**
- Overlay surface clearly separates from both the page and any Card behind it.
- Backdrop (`overlay.backdrop`) is strong enough to visually recede the page without becoming pure
  black.
- Title (`text.primary`) / body (`text.secondary`) / muted (`text.muted`) hierarchy remains legible —
  confirm this specifically since `text.secondary`/`text.muted` now share a value (§7).
- Overlay surface is not excessively bright relative to the surrounding Dark UI.

**Button**
- Primary: Light and Dark resting-state contrast both verified live (not just computed).
- Hover, active, and focus states are each visually distinguishable from resting and from each other.
- Disabled state is visually distinct from both resting and muted-text treatments.

**Typography**
- 12px and 14px metadata rendered in `text.secondary` and `text.muted` (now identical, §7) is
  confirmed readable against real `surface.default`/`surface.subtle` card content, not just the flat
  contrast-checker numbers.

Only after these are confirmed does an implementer relabel the affected §9 rows from
**PROVISIONAL — VISUAL PILOT** to **LOCKED**.

---

## 17. Rollout Phases

```text
Phase 1 — Color Foundation Architecture
  Wire Option D private foundation scales into globals.css. Give every currently-0-consumer V2
  alias a real distinct value per §7/§9. Resolve --color-accent/--color-primary at the token
  level (§6, §10) via the TEMPORARY ALIAS / DEPRECATED-REPLACE pattern. Strip inert
  .radix-themes selector cruft from the copied Dark files during wiring.

Phase 2 — Light Brand Migration
  Roll brand.primary navy → violet (#5147E5) through its 91 real consumers (--color-primary +
  --color-brand-primary combined). Explicit before/after visual review — highest-visibility
  single change in the whole migration.

Phase 3 — Theme-Safe Shared Primitives
  Button, Card, ResponsiveModal/BottomSheet, and other src/shared/components/ui/* primitives:
  replace hardcoded shadows/color-mix(white|black)/slate- with semantic tokens. --color-accent
  legacy triage (§10) completes here for shared-component consumers specifically. Gating phase —
  nothing downstream is genuinely theme-safe until this lands.

Phase 4 — App Shell / Navbar Visual Pilot
  AppHeader token cleanup (nav-active unification onto brand.primary, per audit §12/this spec
  §14 — no new nav.* tokens). First real visual pilot surface for the App Shell acceptance
  criteria (§16).

Phase 5 — Today Full-Surface Pilot
  One complete product-composition migration off slate-*/hex (Today module, given its recent
  activity), validating Phase 3 primitives under real product content before wider rollout.

Phase 6 — Dark Runtime + Dark Surface Pilot
  Install next-themes (§12), wire .dark selector, fix viewport theme-color sync, verify
  hydration. Run the full §16 pilot acceptance pass across App Shell / Card / Modal / Button /
  Typography. Relabel confirmed PROVISIONAL rows in §9 to LOCKED. Do not attempt this phase
  before Phases 1–5 have removed the worst of the hardcode sprawl — flipping the runtime toggle
  early would expose still-broken surfaces immediately.

Phase 7 — Status / Finance / Product Domain Migration
  Source the required Radix Green/Amber/Red/Blue Light+Dark scales (§8/§18, currently missing).
  Classify real status/finance consumers by role (text/icon/fill/surface/border/chart) per §8.
  Resolve the pre-existing Light AA failures as part of this classification. Plan-Type Dark-safe
  variants (plan-card-visuals.ts and equivalents) — product-owned, per §14.

Phase 8 — Remaining Module Rollout + Governance Update
  Long tail of slate-*/hex/color-mix occurrences outside the Phase 5 pilot surface, module by
  module. Amend VisualRules.md per the audit's §15 findings once the architecture is proven in
  production, not before.
```

Principles preserved from the audit's phase proposal: shared primitives before broad product
rollout, no single app-wide rewrite, Dark runtime only after enough underlying UI is theme-safe,
provisional Dark values validated before being called final, and governance-doc updates come after
the architecture is proven — not as a Phase 1 activity.

---

## 18. Remaining Inputs / Decisions

Only genuinely unresolved items remain here — every decision this prompt explicitly settled (Light/
Dark `brand.primary`, the accent/primary unification, `next-themes` as the runtime direction, Dark
`text.link = violet-11`, the `text.muted` AA requirement, and the deprecation of literal white/black
`color-mix` for new code) is **locked** by §6/§7/§9/§11/§12 above and is not reopened here.

1. **Radix Green/Amber/Red/Blue Light+Dark palette files are not yet present under `docs/palette/`.**
   Required before Phase 7 (`status.*`, `income`, `expense` Dark values) can proceed. This spec
   deliberately does not invent these values — they must be sourced/generated with the same care
   Option D itself received, then reviewed the same way this spec reviewed Violet/Gray.
2. **Exact Dark provisional surface mapping** (`surface.default/subtle/raised/overlay`,
   `overlay.backdrop` opacity) — architecture and recommended values are set (§7/§9), but remain
   subject to the visual pilot in §16 before being relabeled LOCKED.
3. **Status-role token split** (§8) — whether the eventual architecture needs `status.success` /
   `status.success-text` / `status.success-surface` (or a smaller equivalent) depends on the real
   per-consumer role classification (text/icon/fill/surface/border/chart) called for in §8, which has
   not been performed yet — it is Phase 7 work, not something this spec can pre-decide.
