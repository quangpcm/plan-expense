# Go Plan Color System Audit

**Status**: Report only. No application code, CSS, or Design System docs were modified to produce this document.
**Scope**: Migration readiness for Option D palette + future Light/Dark mode.
**Date**: 2026-08-28

---

## 1. Executive Summary

Go Plan's color system today is a **single-theme (light-only), two-layer token stack**:

1. A **raw foundation layer** (`--color-primary`, `--color-accent`, `--color-surface`, …) — hand-picked
   hex values, not derived from a systematic scale (no 1–12 step ladder, no OKLCH source).
2. A **Design System V2 "Wave 1" semantic alias layer** (`--color-brand-primary`,
   `--color-surface-page`, `--color-text-primary`, `--color-status-*`, `--color-focus-ring`, …) added
   on top, most of which **alias the raw layer 1:1** because a distinct value was never approved
   (explicitly documented in `globals.css` comments as "Deferred").

This is a reasonable Wave 1 outcome, but it means most semantic tokens today have **no independent
identity** — they're names, not yet values. That is actually good news for an Option D migration:
consumer-usage evidence (§3) shows several of these aliases (`surface-raised`, `surface-page`,
`surface-overlay`, `text-disabled`, `text-link`, `border-subtle`, `brand-primary-active`) have **zero
real product-code consumers** — only the self-referential declaration in `globals.css`. They can be
safely repointed to genuine Option D values with no blast radius.

The bigger risk is not the token layer — it's **851 raw `slate-*` Tailwind utility occurrences**, ~140
raw hex literals, ~43 `rgba()` shadows, and ~27 `color-mix(…, white/black)` hover mixes scattered across
product components, entirely bypassing the semantic layer. These are the actual blockers for Dark
Mode: a `text-slate-950` label or a `shadow-[…rgba(23,32,51,0.06)]` card will not adapt to a dark
surface no matter how well the token layer is redesigned underneath it.

**Recommendation in one sentence**: adopt Option D as the new raw foundation (kept private, not
exposed as Tailwind utility classes), finish giving the existing V2 semantic layer real distinct
values, and treat the `slate-*`/hex/`rgba`/`color-mix` sprawl as a separate, component-by-component
migration (Phases 3–7) — not a single mass find-and-replace.

---

## 2. Current Color Architecture

```
src/styles/globals.css (@theme block)
  ├─ Raw foundation tokens (Wave 0, pre-Design-System)
  │    --color-background, --color-foreground, --color-surface, --color-surface-soft,
  │    --color-muted, --color-subtle, --color-border, --color-border-strong,
  │    --color-primary(-hover), --color-secondary(-foreground), --color-accent(-soft),
  │    --color-success/warning/danger/info(-soft), --color-income/expense(-soft),
  │    --color-milestone-*
  │
  └─ V2 semantic alias layer (Wave 1, additive, all `var(--raw-token)` aliases today)
       --color-brand-*, --color-surface-{page,default,subtle,raised,overlay},
       --color-text-{primary,secondary,muted,disabled,inverse,link},
       --color-border-{default,subtle,strong,focus}, --color-status-*,
       --color-focus-ring(-soft), --color-overlay-backdrop, --shadow-overlay
```

No `.dark` class, `[data-theme]` attribute, or `prefers-color-scheme` media query exists anywhere in
`globals.css` or the app shell. There is exactly **one theme**, defined once, applied unconditionally
via `:root`/`@theme`. `docs/palette/` already contains the six Radix-exported Option D CSS files
(Light/Dark × accent/gray/background), including P3 (`oklch`) enhanced variants gated behind
`@supports (color: color(display-p3 1 1 1))`. These are **not yet wired into `globals.css`** — they
exist only as reference exports.

`package.json` has **no `next-themes`** dependency and **no `@radix-ui/themes`** package (only
individual Radix primitives: `react-dialog`, `react-alert-dialog`, `react-dropdown-menu`). Tailwind is
v4.3.3, confirming the `@theme` CSS-first token model is the correct integration point.

---

## 3. Current Token Inventory

Consumer counts below are real product-code (`.ts`/`.tsx`) references to `var(--token)`, excluding the
declaration in `globals.css` itself.

| Token | Value / source | Semantic role | Consumers | Classification |
|---|---|---|---|---|
| `--color-background` | `#f6f8fc` | raw/foundation (page bg) | 6 (+ `body` gradient override, see §5) | REMAP → Option D `--color-background` (`#f7f8fc`) |
| `--color-foreground` | `#172033` | raw/foundation (default text) | 15 | REMAP → Option D `gray-12` (`#162130`) |
| `--color-surface` | `#ffffff` | raw/foundation (card/panel bg) | 39 | KEEP (white surface still correct in Light; needs Dark counterpart, see §8) |
| `--color-surface-soft` | `#f1f5fb` | raw/foundation (subtle bg) | 5 | REMAP → Option D `gray-2`/`gray-3` |
| `--color-muted` | `#68738a` | neutral semantic (secondary text) | 29 | REMAP → Option D `gray-11` (`#4d5d73`, 6.32:1 AA) |
| `--color-subtle` | `#94a0b5` | neutral semantic (tertiary/disabled text) | 18 | REMAP → Option D `gray-10`/`gray-9` (see §13 contrast caveat) |
| `--color-border` | `#dfe5ef` | neutral semantic (default border) | 54 | REMAP → Option D `gray-6`/`gray-7` |
| `--color-border-strong` | `#cbd5e1` | neutral semantic (emphasized border) | 21 | REMAP → Option D `gray-8` |
| `--color-primary` | `#243b6b` (navy) | brand semantic | 68 | **SPLIT** — see below |
| `--color-primary-hover` | `#1d315b` | brand semantic | 7 | REMAP → Option D `violet-10` |
| `--color-primary-foreground` | `#ffffff` | brand semantic (on-brand text) | (via primary) | KEEP |
| `--color-secondary` | `#edf2f8` | neutral semantic (secondary button bg) | 18 | REMAP → Option D `gray-3` |
| `--color-secondary-foreground` | `#334155` | neutral semantic | 13 | REMAP → Option D `gray-12`/`gray-11` |
| `--color-accent` | `#3b82f6` (Tailwind blue-500) | **unclear/mixed** — used as both "link/interactive blue" and the header's active-nav color | 24 | **SPLIT** (see below) |
| `--color-accent-soft` | `#e8f1ff` | brand-adjacent soft surface | 9 | REMAP → Option D `violet-3`/`violet-4`, pending §18 decision |
| `--color-success` / `-soft` | `#059669` / `#dff7ec` | status semantic | 20 / — | PRESERVE_FOR_NOW (Light); ADD Dark counterpart |
| `--color-warning` / `-soft` | `#d97706` / `#fff4d8` | status semantic | 22 / — | PRESERVE_FOR_NOW; **flag** contrast (§13) |
| `--color-danger` / `-soft` | `#dc2626` / `#feecec` | status semantic | 20 / — | PRESERVE_FOR_NOW; ADD Dark counterpart |
| `--color-info` / `-soft` | `#2563eb` / `#e8f0ff` | status semantic | 6 / — | PRESERVE_FOR_NOW |
| `--color-income` / `-soft` | `#059669` / `#e2f7ef` | finance/domain semantic | 18 / 3 | PRESERVE_FOR_NOW — same value as `success` today (intentional overlap, not a bug: "income" and "success" happen to share meaning) |
| `--color-expense` / `-soft` | `#dc5a4c` / `#fcebe8` | finance/domain semantic | 16 / 1 | PRESERVE_FOR_NOW — distinct from `--color-danger` on purpose (expense ≠ error) |
| `--color-milestone-selected(*)` | `#243b6b` family | Plan-Type/product-owned | 2 each | KEEP — product-owned, out of scope |
| `--color-milestone-completed(*)` | `#eef7f3` family | Plan-Type/product-owned | 2 each | KEEP |
| `--color-milestone-upcoming(*)` | `#ffffff` family | Plan-Type/product-owned | 2 each | KEEP |
| `--radius-card` | `1.5rem` (24px) | legacy alias (documented) | — | out of scope (radius, not color) |
| `--color-brand-primary` | alias of `--color-primary` | brand semantic (V2) | 23 | REMAP → real Option D `violet-9` value, decoupled from raw `--color-primary` |
| `--color-brand-primary-hover` | alias of `--color-primary-hover` | brand semantic (V2) | 2 | REMAP → Option D `violet-10` |
| `--color-brand-primary-active` | alias of `--color-primary-hover` (no distinct value) | brand semantic (V2) | **0** | ADD real value — Option D `violet-11` is a natural "active/pressed" step distinct from `hover` |
| `--color-brand-foreground` | alias of `--color-primary-foreground` | brand semantic (V2) | (via brand-primary) | KEEP |
| `--color-brand-accent` | alias of `--color-accent` | unclear/mixed (V2) | 2 | DEPRECATE or REMAP — overlaps with `--color-brand-primary`; needs one owner (§18) |
| `--color-brand-subtle` | alias of `--color-accent-soft` | brand semantic (V2) | 12 | REMAP → Option D `violet-3` |
| `--color-surface-page` | alias of `--color-background` | neutral semantic (V2) | **0** | REMAP → Option D `--color-background`, safe (no consumers to break) |
| `--color-surface-default` | alias of `--color-surface` | neutral semantic (V2) | 16 | KEEP name; ADD Dark value |
| `--color-surface-subtle` | alias of `--color-surface-soft` | neutral semantic (V2) | 7 | REMAP → Option D `gray-2` |
| `--color-surface-raised` | alias of `--color-surface` (no distinct tint — elevation via shadow only) | neutral semantic (V2) | **0** | PRESERVE_FOR_NOW as an elevation-only alias in Light; **ADD** a real distinct value in Dark (flat black-on-black elevation doesn't read without a tint shift — see §8) |
| `--color-surface-overlay` | alias of `--color-surface` | overlay/focus (V2) | **0** | Same as above — ADD Dark value |
| `--color-text-primary` | alias of `--color-foreground` | neutral semantic (V2) | 29 | REMAP → Option D `gray-12` |
| `--color-text-secondary` | alias of `--color-muted` | neutral semantic (V2) | 30 | REMAP → Option D `gray-11` |
| `--color-text-muted` | alias of `--color-subtle` | neutral semantic (V2) | 19 | REMAP → Option D `gray-10` (see §13) |
| `--color-text-disabled` | alias of `--color-subtle` (same value as muted — no distinct value yet) | neutral semantic (V2) | **0** | ADD real distinct value — Option D `gray-8` on a `gray-2` disabled-surface reads as genuinely "disabled" vs. "muted" |
| `--color-text-inverse` | alias of `--color-primary-foreground` | neutral semantic (V2) | (via brand-foreground path) | KEEP |
| `--color-text-link` | alias of `--color-accent` | neutral/brand semantic (V2) | **0** | REMAP → Option D `violet-9` (Light) / `violet-11` (Dark, contrast — §13) once the `--color-accent` split (§18) is resolved |
| `--color-border-default` | alias of `--color-border` | neutral semantic (V2) | 21 | REMAP → Option D `gray-6` |
| `--color-border-subtle` | alias of `--color-border` (no distinct tier yet) | neutral semantic (V2) | **0** | ADD real value — Option D `gray-4`/`gray-5` gives a genuine subtle tier below `default` |
| `--color-border-focus` | alias of `--color-accent` | overlay/focus (V2) | 5 | REMAP → Option D `violet-9`, decoupled from `--color-accent` |
| `--color-status-success(-surface)` | alias of `--color-success(-soft)` | status semantic (V2) | 11 / — | PRESERVE_FOR_NOW |
| `--color-status-warning(-surface)` | alias of `--color-warning(-soft)` | status semantic (V2) | 11 / — | PRESERVE_FOR_NOW |
| `--color-status-danger(-surface)` | alias of `--color-danger(-soft)` | status semantic (V2) | 10 / — | PRESERVE_FOR_NOW |
| `--color-status-info(-surface)` | alias of `--color-info(-soft)` | status semantic (V2) | 5 / — | PRESERVE_FOR_NOW |
| `--color-focus-ring` | alias of `--color-accent` | overlay/focus (V2) | 16 | REMAP → Option D `violet-9`/`violet-8` |
| `--color-focus-ring-soft` | alias of `--color-accent-soft` | overlay/focus (V2) | 5 | REMAP → Option D `violet-a5`/`violet-4` |
| `--color-overlay-backdrop` | `rgb(2 6 23 / 40%)` (harvested from `bg-slate-950/40`) | overlay/focus | 5 | KEEP in Light; evaluate Dark opacity separately (usually needs to be *lighter* alpha in Dark, since the backdrop already sits on a dark canvas) |
| `--shadow-overlay` | `0 16px 60px rgb(15 23 42 / 10%)` | overlay/focus | 4 | KEEP in Light; ADD Dark value (dark shadows need to lean on a darker/less-visible shadow or a border instead — pure black shadow on black bg is invisible) |

### The `--color-accent` / `--color-primary` overlap (SPLIT)

`--color-primary` (navy `#243b6b`) is the actual brand color used by primary buttons, the FAB, and
`--color-brand-primary`. `--color-accent` (Tailwind blue-500 `#3b82f6`) is a **second, undocumented
"brand-ish" color** used for: the header's active nav link/underline, links (`--color-text-link`),
focus rings (`--color-focus-ring`), and `--color-border-focus`. These are two different blues serving
overlapping "interactive/brand" roles with no documented reason for the split. Option D's single
`violet-9` accent scale is an opportunity to **resolve this into one brand-interactive family**
(`brand.primary` for buttons/CTAs, using the same `violet-9` step consistently for focus/link/nav-active
too) rather than preserving two parallel blues. This is flagged as an **open decision** (§18) since
unifying them is a visible behavior change (header links currently render blue, not navy) even though
it's a net simplification.

---

## 4. Hardcoded Color Audit

Search scope: `src/**/*.{ts,tsx}` (raw Tailwind/CSS colors only; `globals.css` excluded since it's the
declaration site).

| Pattern | Occurrences | Dominant category |
|---|---:|---|
| `slate-{n}` | **851** | mostly **C** (neutral text/border/bg hardcode) |
| `bg-white` / `text-white` / `bg-black` / `text-black` | 131 combined | mixed **B**/**C** |
| Hex literals `#RRGGBB`/`#RGB` | 140 | mixed **B**/**C** |
| `rgba(...)` | 43 | mostly **C** (shadows) |
| `color-mix(in srgb, …, white/black)` | 27 | **C** (hover mixing) |
| `amber-{n}` | 40 | mixed **A**/**B** |
| `red-{n}` | 16 | mostly **A** |
| `orange-{n}` | 16 | **B** (Plan-Type: debt) |
| `violet-{n}` | 10 | **B**/pre-existing brand exploration |
| `blue-{n}` | 9 | **B**/**C** |
| `indigo-{n}` | 8 | **B** (Plan-Type: event) |
| `green-{n}` | 5 | **A** |
| `gray-{n}` (Tailwind, not CSS var) | 1 | negligible |
| `zinc-{n}` | 2 | negligible |
| `neutral-{n}` | 0 | — |
| `rgb(...)` / `hsl(...)` | 0 | — |

**`slate-*` is the single largest finding by an order of magnitude.** It is functioning as an
**unofficial second neutral-color system**, parallel to and disconnected from `--color-text-*` /
`--color-border-*` / `--color-surface-*`. Top consumers by count:

- `modules/plan/constants/overview-widget-registry.tsx` (89), `overview-widget-registry.wedding.tsx` (42)
- `modules/wedding-guest/components/wedding-guest-group-table.tsx` (26)
- `modules/statistic/components/completed-plan-overview.tsx` (25) — dead code per `ExceptionsAndDebt.md` #6, low priority
- `modules/expense/components/expense-form.tsx` (22), `app/(authenticated)/plans/[planId]/page.tsx` (22)
- `modules/debt-tracking/components/debt-native-detail.tsx` (21), `modules/todo/components/todo-detail-view.tsx` (20)
- `shared/components/ui/responsive-modal.tsx` (8) — **notable**: a Design-System-owned shared primitive with 8 raw `slate-*` occurrences (dialog/bottom-sheet title, description, backdrop border, drag-handle)

Representative lines (all category **C**, theme-breaking):
```
text-slate-950   → should be text-[var(--color-text-primary)]
text-slate-600   → should be text-[var(--color-text-secondary)]
text-slate-400   → should be text-[var(--color-text-muted)]
border-slate-200 → should be border-[var(--color-border-default)]
bg-slate-50      → should be bg-[var(--color-surface-subtle)]
```

### A. Safe domain/status use
`red-{n}`/`green-{n}` for explicit error/positive states (e.g. destructive button harvested
byte-for-byte from `confirm-dialog.tsx`), Badge tone rendering. Low volume, already intentional.

### B. Legitimate product-owned visual
`plan-card-visuals.ts` (all 9 `PlanType` entries: raw hex gradients + raw hex `accentTextClassName`).
Confirmed product-owned per `ExceptionsAndDebt.md` #5 (zero `planType` refs inside
`src/shared/components/ui/`). `finance-category-donut.tsx`'s `TAILWIND_600_HEX` map (a Tailwind-name
→ hex lookup, needed because SVG `stroke` requires a real color value, not a class) is the same
category — a legitimate categorical/domain palette, not a Foundation gap. See §11 for dark-mode
caveats on both.

### C. Theme-breaking hardcode (representative, not exhaustive)
- `shared/components/ui/card.tsx`: `shadow-[0_18px_54px_rgba(23,32,51,0.06)]` — light-RGB shadow baked into the canonical Card primitive.
- `shared/components/ui/button.tsx` primary variant: `shadow-[0_12px_28px_rgba(36,59,107,0.2)]` — colored shadow tied to the light navy value, will look wrong against a dark surface/dark brand color.
- `shared/components/ui/button.tsx` secondary variant: `hover:bg-[color-mix(in_srgb,var(--color-secondary)_78%,white)]` — mixes toward literal white; in Dark this would visibly *lighten* a hover state that should darken/brighten differently.
- `shared/components/ui/responsive-modal.tsx`: `bg-white`, `border-slate-200`, `text-slate-950/600/400`, and a second hardcoded shadow (`shadow-[0_-16px_60px_rgba(15,23,42,0.08)]` for the bottom-sheet variant) — a **shared overlay primitive**, so this alone blocks Dark Mode for every dialog/sheet in the app.
- `app/layout.tsx` `viewport.themeColor: '#020617'` — a single static browser-chrome color; will be visibly wrong once a Light theme (`#f7f8fc`) ships if left unconditional.
- `globals.css` `body { background: linear-gradient(180deg, #f8faff 0%, #f4f7fb 45%, #f6f8fc 100%); }` — a literal light gradient applied directly to `body`, bypassing `--color-background` entirely.
- `shared/components/layout/route-loading-screen.tsx`: `bg-[linear-gradient(135deg,#4F9CF9_0%,#7C5CF5_100%)]` + matching rgba shadow — an unsourced brand gradient (not derived from any approved token), used at the loading-screen "moment" — arguably fits VisualRules' "Brand Gradient reserved for … onboarding" allowance in *spirit*, but the exact stops were never approved as a token.
- Widespread `color-mix(in_srgb, var(--color-primary)_78%, black)` / `…white)` hover-darken/lighten pattern (11+ files: `expense-activity-link.tsx`, `expense-form.tsx`, `finance-tab.tsx` ×3, `timeline-list.tsx`, `settlement-workspace.tsx`, `daily-brief.tsx`, `today-context-strip.tsx`, `overview-widget-registry.tsx` ×3, `overview-widget-registry.wedding.tsx`) — functionally elegant (derives hover from the token itself) but **directionally wrong for Dark**: mixing toward literal `black` to darken a hover state on a *light* accent color is correct in Light, but the same literal-`black` mix on a *light-in-Dark* accent value would crush contrast instead of lightening it. This pattern needs a token-driven hover step (Option D `violet-10`/`violet-8`), not a `color-mix`-toward-a-fixed-literal, once Dark exists.

### D. Intentional exception/debt (already tracked — not in scope here)
`Card`'s legacy 24px radius/shadow (`ExceptionsAndDebt.md`), the ~74-occurrence `rounded-[24/26/28px]`
radius drift backlog (radius, not color, but frequently co-located with the `slate-*`/hex color drift
in the same `className` strings — worth knowing they'll often be touched together opportunistically).

**No mass replace is proposed.** Given 851 `slate-*` + 140 hex + 43 rgba + 27 color-mix occurrences
spread across ~120+ files, a single PR touching all of them is both high-risk (VisualRules/Card-in-Card
review debt shows large simultaneous visual changes get reverted) and unreviewable. See §16–17 for the
phased approach.

---

## 5. Shared Component Findings

### Button (`src/shared/components/ui/button.tsx`)
| Aspect | Finding |
|---|---|
| Tokens used correctly | `--color-brand-primary(-hover/-foreground)`, `--color-secondary(-foreground)`, `--color-brand-subtle`, `--color-status-info`, `--color-status-danger`, `--color-focus-ring` — the variant surface/text colors are already fully token-driven. |
| Light-theme-specific values | `primary` variant's shadow `rgba(36,59,107,0.2)` is the raw navy value as an rgba shadow — tightly coupled to the *current* `--color-primary`, will visually mismatch once brand becomes Option D violet. |
| Hardcoded | `secondary` hover: `color-mix(…, white)`; `destructive` hover: raw `hover:bg-red-700` (documented gap — no `--color-status-danger-hover` token exists yet). |
| New token justified? | Yes — `--color-status-danger-hover` and a token-driven (not `color-mix`-to-white) secondary-hover value are both real gaps with a real consumer (this component) already. |
| Dark-mode-ready via remap alone? | **Partially.** Text/surface roles remap cleanly. The primary shadow and secondary/destructive hovers need new values, not just remapped tokens. |

### Card (`src/shared/components/ui/card.tsx`)
| Aspect | Finding |
|---|---|
| Tokens used correctly | `--color-border-default`, `--color-surface-default`. |
| Hardcoded | `shadow-[0_18px_54px_rgba(23,32,51,0.06)]` — literal, and `--radius-card` (24px) is a separately-tracked legacy value (not in scope here, see §4/D). |
| New token justified? | Yes — a `shadow.low`/`elevation.card` token with distinct Light/Dark values (58 consumers, high-confidence evidence). |
| Dark-mode-ready via remap alone? | **No** for the shadow (needs a real Dark value, since a light-RGB shadow is invisible/wrong on a dark surface). Border/surface remap cleanly. |

### App Header / Navbar (`src/shared/components/layout/app-header.tsx`)
| Aspect | Finding |
|---|---|
| Tokens used correctly | `--color-border` (bottom border), `bg-[var(--color-surface)]/95 backdrop-blur` (translucent chrome — already the right *shape* for the "future direction" in §11 of the brief). |
| Light-theme-specific values | Active/hover nav link and its underline use `--color-accent` (Tailwind blue `#3b82f6`), **not** `--color-brand-primary` (navy). This is the `--color-accent`/`--color-primary` split from §3 made visible in the one component where it matters most — the header currently expresses a *different* brand color than every primary button. |
| Hardcoded | None found directly in this file — good. |
| New token justified? | Possibly `nav.active`/`nav.background` (see §12), but current evidence suggests reusing `brand.primary` + `surface.overlay` is sufficient — see §12 recommendation. |
| Dark-mode-ready via remap alone? | **Yes**, once the `--color-accent` vs `--color-primary` question (§18) is resolved and `--color-surface`/`--color-border` get Dark values. No structural change needed. |

---

## 6. Option D Source Palette

Confirmed present in `docs/palette/` as six Radix-exported CSS files (Light/Dark × accent/gray/
background), each with a base sRGB block and a P3/OKLCH-enhanced block gated behind
`@supports (color: color(display-p3 1 1 1)) and (color-gamut: p3)`. Full values are reproduced in the
task brief (§1) and were cross-checked byte-for-byte against the files in `docs/palette/`; no
discrepancies found. Alpha (`-a1`..`-a12`) variants are present for both `violet` and `gray`, in both
Light and Dark — useful for:
- **Dark overlay/backdrop tints** (`gray-a` steps work well as scrims that composite correctly over
  whatever's beneath, unlike a flat opaque gray).
- **Hover/pressed states derived from the base color itself** (e.g. `violet-a3` as a hover wash over
  any surface) — a token-driven replacement for the `color-mix(…, white/black)` pattern flagged in §4/C.
- **Focus ring soft glow** (`violet-a4`/`a5`) instead of a flat `-soft` background.

`--violet-contrast` (`#fff` in both themes), `--violet-surface`, `--violet-indicator`, and
`--violet-track` are Radix Themes component-specific tokens (built for `@radix-ui/themes`, which this
app does not use). They are **not directly needed** — this app's own semantic layer (`brand.foreground`,
`focus.ring`, etc.) already covers their purpose. Recommend NOT importing them 1:1; extract only the
underlying step values already covered by the 1–12 scales.

---

## 7. Proposed Color Architecture

```
OPTION D SOURCE PALETTE  (docs/palette/*.css — Radix exports, reference only)
    ↓  hand-curated subset, renamed to Go Plan's own private variable names
FOUNDATION SCALES  (private, --gp-violet-1..12 / --gp-gray-1..12, Light+Dark, NOT Tailwind utilities)
    ↓
SEMANTIC TOKENS  (--color-* in @theme — the only layer Tailwind utility classes / arbitrary values ever reference)
    ↓
SHARED COMPONENTS  (Button, Card, AppHeader, … — consume --color-* only, never a raw scale step)
    ↓
PRODUCT / DOMAIN PRESENTATION  (plan-card-visuals.ts, finance-category-donut.tsx, … — may use raw
    hex/scale values directly where genuinely product-owned, per ProductSemantics.md boundary)
```

This is the same shape the brief describes and is **consistent with the current codebase's own
pattern** — `globals.css` already separates a "raw" layer from a "V2 semantic" layer; this proposal
just inserts one more layer *underneath* the existing raw layer (the Option D scale) and gives Light/
Dark values to what's already there, rather than inventing a new model.

### Should foundation scales (`brand-1..12`, `neutral-1..12`) be exposed publicly, or kept private?

**Recommendation: keep private.** Do not expose `--gp-violet-1..12`/`--gp-gray-1..12` as Tailwind
utility classes (e.g. no `bg-violet-9` utility) or as documented public API. Reasons:

1. **Consistency with current practice.** The existing raw layer (`--color-primary`, `--color-border`,
   etc.) is already private in this sense — nothing in the codebase reaches for a numbered scale step
   directly today; everything goes through a named semantic token. Introducing public numbered steps
   now would be a second, parallel color vocabulary living alongside the semantic one.
2. **Prevents step-number leakage into product code.** The brief explicitly warns against this
   ("Do not blindly expose Radix step numbers directly to product components"). If `violet-7` is
   directly reachable, some future component will reach for it because "it looked right," bypassing
   the semantic layer the same way `slate-600` does today (§4) — recreating the exact problem this
   migration is meant to fix.
3. **Semantic tokens can still cover legitimate multi-step needs.** Where a component genuinely needs
   more than one brand step (e.g. `brand.primary` + `brand.primary-hover` + `brand.primary-active`),
   each gets its own named semantic token (§8) rather than the component picking `violet-9`/`violet-10`/
   `violet-11` itself.

**Tradeoff acknowledged**: a private scale means every *new* semantic need requires a deliberate token
addition (via the evidence gate in `FeatureImplementationRules.md`) rather than "just reach for step
8." This is intentional friction — it's the same evidence-gate discipline already governing shared
component APIs, now extended to color.

**Exception**: `finance-category-donut.tsx`'s categorical Tailwind-hue map (§4/B) and
`plan-card-visuals.ts`'s per-`PlanType` hex values are legitimate product-owned exceptions to "always
go through semantic tokens" — they are enumerating an *open, product-defined* set of categories, not
picking a style off a shared UI shelf.

---

## 8. Proposed Light Semantic Mapping

| Semantic token | Current | Light D | Source | Rationale | Confidence | Risk |
|---|---|---|---|---|---|---|
| `surface.page` | `--color-background` `#f6f8fc` | `#f7f8fc` | Option D `--color-background` | Direct 1:1 swap, near-identical hue | High | Low |
| `surface.default` | `--color-surface` `#ffffff` | `#ffffff` | (unchanged — Option D has no separate "card" white) | Card/panel white stays white in Light | High | Low |
| `surface.subtle` | `--color-surface-soft` `#f1f5fb` | `gray-2` `#eef2f7` | Option D gray scale | Closest existing-role match | High | Low |
| `surface.raised` | alias of `surface.default` (no distinct tint) | **unchanged in Light** (elevation via shadow only) | — | No evidence yet of a Light "raised" tint need; keep elevation-only per existing `globals.css` rationale | Medium | Low |
| `surface.overlay` | alias of `surface.default` | `#ffffff` (unchanged) | — | Dialog/BottomSheet already read correctly as white-on-white-canvas in Light | High | Low |
| `surface.selected` | *(no current token — ad hoc per component, e.g. milestone-selected)* | `violet-3` `#e6e9f8` | Option D violet scale | New, low-risk addition — selection wash | Medium | Low (additive) |
| `text.primary` | `--color-foreground` `#172033` | `gray-12` `#162130` | Option D gray | 15.29:1 vs. bg — AA/AAA safe | High | Low |
| `text.secondary` | `--color-muted` `#68738a` | `gray-11` `#4d5d73` | Option D gray | 6.32:1 vs. bg — AA safe for normal text | High | Low |
| `text.muted` | `--color-subtle` `#94a0b5` | `gray-10` `#687b96` | Option D gray | 4.07:1 — **fails AA for normal text** (needs 4.5:1); restrict to large text/icons/metadata, see §13 | High | **Medium — needs component-level review of current `text-muted` consumers (19)** |
| `text.disabled` | alias of `text.muted` (no distinct value, 0 consumers) | `gray-9` `#7185a2` | Option D gray | Genuinely distinct from `muted`; disabled text is exempt from AA contrast requirements by WCAG, but this stays legible | High | Low (0 consumers today) |
| `text.inverse` | `--color-primary-foreground` `#ffffff` | `#ffffff` (unchanged) | — | White text on brand-solid stays white | High | Low |
| `text.link` | alias of `--color-accent` (0 consumers) | `violet-9` `#5147e5` | Option D violet | 5.85:1 — AA safe; resolves §3/§18 accent-split question | High | Low (0 consumers today, but resolves the split — see §18) |
| `border.subtle` | alias of `border.default` (0 consumers) | `gray-4` `#d7e0ed` | Option D gray | Genuine subtle tier below default | High | Low (0 consumers) |
| `border.default` | `--color-border` `#dfe5ef` | `gray-6` `#c4d1e3` | Option D gray | Closest existing-role match | High | Low |
| `border.strong` | `--color-border-strong` `#cbd5e1` | `gray-8` `#9eb3d1` | Option D gray | Closest existing-role match | High | Low |
| `border.focus` | alias of `--color-accent` | `violet-9` `#5147e5` | Option D violet | Unifies with `brand.primary`/`text.link` (§18) | High | Low |
| `brand.primary` | `--color-primary` `#243b6b` (navy) | `violet-9` `#5147e5` | Option D violet | **Visible brand-color change** — navy → violet. This is the core ask of the migration. | High (value); the *change itself* needs explicit sign-off — see §18 | **High — touches 68 `--color-primary` + 23 `--color-brand-primary` consumers** |
| `brand.primary-hover` | `--color-primary-hover` `#1d315b` | `violet-10` `#463bcb` | Option D violet | Next step down in the scale, standard hover pattern | High | Medium (follows brand.primary) |
| `brand.primary-active` | alias of `hover` (0 consumers, no distinct value) | `violet-11` `#4940d0` | Option D violet | First real "active/pressed" value — additive | High | Low (0 consumers) |
| `brand.foreground` | `#ffffff` | `#ffffff` (unchanged) | Option D `violet-contrast` confirms white is correct | White-on-violet-9 = 6.21:1, AA safe | High | Low |
| `brand.subtle` | `--color-accent-soft` `#e8f1ff` | `violet-3` `#e6e9f8` | Option D violet | Near-identical hue/lightness to current value | High | Low |
| `brand.selected` | *(no current token)* | `violet-4` `#d9dffe` | Option D violet | New — selection-state background, one step up from `subtle` | Medium | Low (additive) |
| `focus.ring` | alias of `--color-accent` | `violet-9` `#5147e5` | Option D violet | 5.85:1 against bg — clearly visible ring | High | Low |
| `focus.ring-soft` | alias of `--color-accent-soft` | `violet-a5` `#cbd3ff` (alpha variant) | Option D violet alpha | Alpha variant composites correctly over any surface underneath, unlike a flat soft color | Medium | Low |
| `overlay.backdrop` | `rgb(2 6 23 / 40%)` | **unchanged** in Light | — | Already dark-on-light, functions correctly | High | Low |
| `shadow.low` (Card) | literal `rgba(23,32,51,0.06)` | `rgba(22,33,48,0.06)` (derive from `gray-12` instead of an unrelated literal) | Derived from Option D `gray-12` | Same visual weight, now traceable to the palette instead of an arbitrary rgba | Medium | Low |
| `shadow.medium` | *(no current token; ad hoc per component — Button primary, header dropdowns, etc.)* | `rgba(22,33,48,0.10)` | Derived from `gray-12` | Only add if Phase 3 evidence shows ≥3 real consumers need a step between `low` and `high` — do not add speculatively | Low | Low (deferred, not committed) |
| `shadow.high` (`--shadow-overlay`) | `rgb(15 23 42 / 10%)` | `rgba(22,33,48,0.10)` | Derived from `gray-12` | Same weight, traceable source | Medium | Low |

---

## 9. Proposed Dark Semantic Mapping

| Semantic token | Dark D | Source | Rationale | Confidence | Risk |
|---|---|---|---|---|---|
| `surface.page` | `#101525` | Option D `--color-background` (Dark) | Direct source value | High | N/A (net-new, Dark doesn't exist yet) |
| `surface.default` | `gray-2` `#181d23` | Option D gray (Dark) | Cards need to sit *above* the page background, not equal to it — `gray-1` (`#12161c`) is nearly indistinguishable from `#101525` | Medium | Medium — needs a visual pass once implemented (Phase 6), this is the one value in this table without a pre-existing Light analog to anchor against |
| `surface.subtle` | `gray-3` `#1f252e` | Option D gray (Dark) | One step above `default`, mirrors the Light `subtle`-below-`default` relationship inverted for dark | Medium | Low |
| `surface.raised` | `gray-3` `#1f252e` (same as `subtle`, distinct from `default`) | Option D gray (Dark) | **This is the one place Dark genuinely needs a value Light doesn't**: pure elevation-via-shadow (the Light approach) doesn't read on a dark canvas — dark UI conventionally signals elevation via a lightness step, not a shadow. This finally gives `surface.raised` real distinct meaning. | Medium | Low (0 current consumers to break) |
| `surface.overlay` | `gray-3` `#1f252e` or `gray-4` `#232c37` | Option D gray (Dark) | Dialog/BottomSheet need to visibly separate from the page — pick `gray-4` if `gray-3` proves too close to `surface.raised` in Phase 3 testing | Medium | Low |
| `surface.selected` | `violet-4` `#2c256c` | Option D violet (Dark) | Selection wash, dark-appropriate saturation | Medium | Low |
| `text.primary` | `gray-12` `#eaeef5` | Option D gray (Dark) | 15.61:1 vs. bg | High | Low |
| `text.secondary` | `gray-11` `#a6b5ca` | Option D gray (Dark) | 8.72:1 vs. bg | High | Low |
| `text.muted` | `gray-10` `#697d98` | Option D gray (Dark) | 4.31:1 — same AA caveat as Light `text.muted`, see §13 | High | Medium (same caveat as Light) |
| `text.disabled` | `gray-9` `#5b6f8c` | Option D gray (Dark) | 3.54:1, consistent with Light's disabled-exempt treatment | High | Low |
| `text.inverse` | `#ffffff` | unchanged | Text on solid brand fill | High | Low |
| `text.link` | `violet-11` `#a7aaff` — **not** `violet-9` | Option D violet (Dark) | `violet-9` (`#7067f0`) on `#101525` only reaches **4.23:1**, just under the 4.5:1 AA threshold for normal text. `violet-11` reaches **8.51:1**. Standard Radix convention: step 9 is for *solid fills*, step 11 is for *text on the app background* — this app should follow that convention in Dark specifically, since Light's `violet-9` (5.85:1) happens to already clear AA and doesn't need the same split. | High | Low — but **flag this divergence explicitly during implementation review** (§13/§18) |
| `border.subtle` | `gray-4` `#232c37` | Option D gray (Dark) | Genuine subtle tier | High | Low |
| `border.default` | `gray-6` `#2f3b4b` | Option D gray (Dark) | Matches Light's `gray-6` role | High | Low |
| `border.strong` | `gray-8` `#4d627e` | Option D gray (Dark) | Matches Light's `gray-8` role | High | Low |
| `border.focus` | `violet-9` `#7067f0` | Option D violet (Dark) | Ring visibility is about the glow/outline, not text-contrast rules — `violet-9` is fine here even though it's not used for `text.link` in Dark | High | Low |
| `brand.primary` | `violet-9` `#7067f0` for **fills only** | Option D violet (Dark) | Solid button background — see accessibility flag below | High | **Medium — see §13, white-on-violet-9 fails AA in Dark** |
| `brand.primary-hover` | `violet-10` `#6459e1` | Option D violet (Dark) | Radix's own Dark scale intentionally makes step 10 *darker* than step 9 (inverted from Light) — confirmed against the supplied palette data. This is a genuine hover-darken step. | High | Low |
| `brand.primary-active` | `violet-8` `#5954bd` | Option D violet (Dark) | One step further than hover for a pressed state | Medium | Low |
| `brand.foreground` | `#ffffff` — **needs a fallback, see §13** | — | White text on `violet-9` fails AA in Dark (4.30:1); recommend the *button fill* use `violet-10` (`#6459e1`, 5.17:1 with white text) rather than changing the foreground color, to keep `brand.foreground` = white consistent across both themes | High | **Medium — accessibility-driven deviation from a literal 1:1 step mapping, needs explicit approval (§18)** |
| `brand.subtle` | `violet-3` `#22204d` | Option D violet (Dark) | Selection/soft-background role | High | Low |
| `brand.selected` | `violet-4` `#2c256c` | Option D violet (Dark) | One step up from `subtle` | Medium | Low |
| `focus.ring` | `violet-9` `#7067f0` | Option D violet (Dark) | 4.23:1 against bg — acceptable for a *ring* (not text; WCAG 2.2's 3:1 non-text-contrast criterion applies, which this clears) | High | Low |
| `focus.ring-soft` | `violet-a5` `#6c56ff66` (alpha) | Option D violet alpha (Dark) | Alpha composites correctly regardless of what's underneath | Medium | Low |
| `overlay.backdrop` | `rgb(2 6 23 / 55–60%)` (needs a slightly *higher* opacity than Light's 40%, or the same color reads too close to the page bg it's supposed to recede from) | Derived, not a direct Option D value | Backdrop must still visually separate overlay content from a dark canvas | Low | Low — flag as "needs visual verification in Phase 6," don't lock the exact % now |
| `shadow.low` / `.medium` / `.high` | Prefer **borders over shadows** in Dark; if shadows are kept, derive from `#000000` at low opacity (`rgba(0,0,0,0.4–0.6)`), not from `gray-12` | — | Dark-mode elevation conventionally reads via a lightness step (`surface.raised`) + a 1px `border.subtle`, not via a shadow that has almost no visible falloff against an already-dark canvas | Low | Low — deferred to Phase 6 with real visual review, don't pre-commit to an exact rgba |

---

## 10. Status / Finance / Domain Colors

| Token | Light | Dark needed? | Decision |
|---|---|---|---|
| `success` | `#059669` | Yes | Current value works in Light (3.55:1 on bg — see §13 flag). Do **not** derive from Option D violet/gray (no green in the supplied palette). Recommend sourcing a Dark-appropriate green from a standard Radix `green` Dark scale in a later phase — **not decided here**, see §18. |
| `warning` | `#d97706` | Yes | Same reasoning; **also flag**: 3.00:1 contrast on Light bg is a **pre-existing AA failure** for text use (§13) — worth a note to the Design System owner, out of scope to fix in this report. |
| `danger` | `#dc2626` | Yes | Same reasoning — source a Dark-appropriate red later. |
| `info` | `#2563eb` | Yes | Same reasoning. Also candidate for the `--color-accent`/`--color-primary` cleanup discussion (§18) since `info` is a third blue in the system today. |
| `income` | `#059669` (= `success` today) | Yes, mirrors `success` | Preserve the intentional overlap with `success` — do not force a different value just because Option D exists; this is a deliberate finance/domain choice, not a Foundation gap. |
| `expense` | `#dc5a4c` | Yes | Preserve as distinct from `danger` (`#dc2626`) — expense is a neutral-polarity finance color, not an error color; keep that separation in Dark too. |

**None of these should be recolored using Violet/Slate.** Confirmed: Option D supplies only an accent
(violet) and a neutral (gray) scale — no red/green/amber/blue family. Status colors are **out of
scope for Option D itself** and need their own (likely Radix `red`/`green`/`amber`/`blue`) Dark
scales sourced in a dedicated later step — this is called out as an **open decision** (§18), not
solved by this report.

**Accessibility flags** (see §13 for full detail): `warning` (3.00:1) and `expense` (3.53:1) and
`success`/`income` (3.55:1) all fall under the 4.5:1 AA threshold for normal text *today*, in Light,
independent of this migration. They're likely used at larger sizes or as backgrounds/icons rather
than small body text in practice — verify per-consumer before Phase 2, don't assume.

---

## 11. Plan-Type Expression

`plan-card-visuals.ts` (`src/modules/plan/constants/`) defines 9 `PlanType` visual configs, 100%
raw hex/Tailwind-gradient values, `PlanType`-keyed. Confirmed zero `planType` references inside
`src/shared/components/ui/` (per `ExceptionsAndDebt.md` #5) — the product/shared boundary is already
holding.

**Dark-mode readiness**: **Not yet dark-safe**, and does not need to be fixed in this phase.
- `iconBgClassName` (gradients like `from-amber-500 to-orange-300`) and `iconFgClassName: 'text-white'`
  sit inside a colored circle/badge — these will likely continue to work visually in Dark since
  they're self-contained saturated fills with white text, not text-on-page.
- `accentTextClassName` (literal hex, e.g. `#0c48d7` shared across 7 of 9 plan types, `#9a3412` for
  debt) is text rendered **directly on the page/card surface** — this is the part that will need a
  Dark-safe counterpart later (Phase 7), since a navy-blue `#0c48d7` accent text tuned for a white
  card will likely have poor contrast on a dark card surface.
- `progressTrackClassName: 'bg-[#eceef0]'` (shared across all 9 types) and each type's
  `progressFillClassName` are also light-surface-tuned and will need Dark values in Phase 7.

**Named sub-risk** (already tracked in `ExceptionsAndDebt.md` #10, corroborated here): Debt's
`accentTextClassName` (`#9a3412`, a dark amber/brown) sits close to the semantic `warning` token
(`#d97706`) — worth explicit attention if/when Plan-Type token extraction is revisited, not resolved
here.

**Recommendation**: leave `plan-card-visuals.ts` entirely product-owned, as today. Do not migrate it
into a Foundation token layer as part of this Option D work — no new evidence has emerged beyond
what `ExceptionsAndDebt.md` #10 already tracks as a deferred, second-surface-gated item.

---

## 12. Navbar / Application Shell

Current `AppHeader` already implements the *shape* the brief's "future direction" describes: a
translucent chrome (`bg-[var(--color-surface)]/95 backdrop-blur`) with a hairline border
(`border-[var(--color-border)]`) rather than an opaque, heavy nav bar. This is a good foundation —
**no structural rework is needed**, only token-value updates.

Proposed strategy for the four requested roles:

| Requested token | Recommendation | Reasoning |
|---|---|---|
| `nav.background` | **Reuse `surface.overlay`** (`bg-[var(--color-surface-overlay)]/95` + `backdrop-blur`) — no dedicated `nav.background` token | The header's translucent-white-over-content need is architecturally identical to a Dialog's overlay surface; a second token with the same value is pure duplication. |
| `nav.border` | **Reuse `border.default`** — no dedicated `nav.border` token | Already what's used today; no evidence of a need to diverge from the app's standard border role. |
| `nav.active` | **Reuse `brand.primary`** — no dedicated `nav.active` token, **but this requires resolving the `--color-accent`/`--color-primary` split (§3/§18) first** | Today's active-nav color (`--color-accent`, blue) already duplicates the *role* `brand.primary` (navy) plays elsewhere. A dedicated `nav.active` token would just enshrine that duplication instead of fixing it. |
| `nav.icon-surface` | **Do not add yet** — insufficient evidence | `AppHeader` has no icon-in-a-surface pattern today (nav items are text+icon inline, not icon-in-a-chip). Adding this token now would be speculative, not evidence-based, violating the evidence-gate principle already governing this codebase's shared-API additions (`FeatureImplementationRules.md`). Revisit if Phase 4 (Navbar pilot) surfaces a real need, e.g. an active-icon background chip. |

**Recommendation: zero new nav-specific tokens.** All four requested roles are already expressible
through existing/soon-to-exist generic semantic tokens once §3's `--color-accent`/`--color-primary`
split is resolved. This matches the brief's own steer ("prefer fewer semantic tokens when existing
roles express the same meaning") and avoids adding shared-API surface without consumer evidence.

No glassmorphism, blur-intensity change, or visual redesign is implemented or proposed here — this
section is architecture-only, per the brief's explicit non-goal.

---

## 13. Dark Mode Runtime Readiness

**Current state**: No runtime theme capability exists. `src/app/layout.tsx` renders
`<html className={inter.variable}>` with no theme class/attribute. `src/app/providers.tsx` wraps only
`AuthProvider` — no `ThemeProvider`, no theme context, no `localStorage`/cookie read. `package.json`
has no `next-themes` dependency. `viewport.themeColor` in `layout.tsx` is a single static hex
(`#020617`), unconditional.

**Selector strategy**: **`.dark` class on `<html>`** is the right choice, for two concrete reasons:
1. It's exactly what the already-copied `docs/palette/` Dark files use (`.dark, .dark-theme { … }`)
   — zero adaptation needed to wire them in as-is.
2. Tailwind v4's `@theme`/`dark:` variant defaults to a `.dark` class ancestor out of the box; a
   `[data-theme="dark"]` attribute strategy would require an explicit `@custom-variant` override in
   `globals.css` for no added benefit here.

One cleanup note for implementation (not done in this report): the copied Dark files' compound
selector `:is(.dark, .dark-theme) :where(.radix-themes:not(.light, .light-theme))` references
`.radix-themes`, a class from `@radix-ui/themes` — a package this app **does not depend on** (only
individual Radix primitives). That compound selector is inert cruft; the real selector needed is
just `.dark, .dark-theme`.

**Is `next-themes` actually needed?** Not strictly, but **recommended**. Without it, avoiding a
flash-of-wrong-theme on first paint requires hand-rolling a blocking inline `<script>` in `<head>`
that reads `localStorage`/`prefers-color-scheme` and sets the `.dark` class *before* React hydrates
— exactly the problem `next-themes` already solves (it injects that script automatically and is
purpose-built for the Next.js App Router's SSR/hydration model, including `suppressHydrationWarning`
guidance for `<html>`). Given this app already avoids reinventing solved problems elsewhere (Radix
primitives instead of hand-rolled dialogs), the same logic applies here. A hand-rolled approach is
viable and would avoid one more dependency — this is an **open decision** for the user (§18), not
decided by this report.

**System theme support**: Achievable either way (`next-themes`'s `enableSystem` prop, or a manual
`prefers-color-scheme` media-query listener) — not a differentiator between the two approaches.

**Hydration/SSR considerations**:
- The theme class must be set before first paint (blocking script), not in a `useEffect` (causes
  visible flash).
- `<html>` needs `suppressHydrationWarning` if the class is set by a script the server can't predict.
- `viewport.themeColor` (browser chrome color) will need to become theme-aware too — either a static
  compromise value, or (with `next-themes`) reading the resolved theme client-side to update it via
  `useEffect`, since Next's static `viewport` export can't be conditional on runtime theme.

**Recommended later implementation approach** (not implemented here): adopt `next-themes`,
`attribute="class"`, wrap `AppProviders` (alongside the existing `AuthProvider`), default to
`system`, and update `layout.tsx`'s static `themeColor` to a theme-neutral compromise or move it to a
small client component that syncs the `<meta>` tag to the resolved theme.

---

## 14. Accessibility / Contrast Findings

WCAG 2.2 AA thresholds: **4.5:1** normal text, **3:1** large text (≥24px, or ≥18.66px bold) and
non-text UI (borders, focus rings, icons). All ratios below computed via the standard relative-
luminance formula against the exact Option D hex values.

| Pair | Ratio | AA (normal text) | Note |
|---|---:|:---:|---|
| Light `gray-12` (#162130) on bg (#f7f8fc) | 15.29:1 | ✅ | `text.primary` |
| Light `gray-11` (#4d5d73) on bg | 6.32:1 | ✅ | `text.secondary` |
| Light `gray-10` (#687b96) on bg | 4.07:1 | ❌ (passes large-text 3:1 only) | `text.muted` — **restrict to large text/icons/metadata; do not use for body-size muted labels** |
| Light `gray-9` (#7185a2) on bg | 3.55:1 | ❌ (fails even large-text-adjacent use marginally above 3:1, borderline) | `text.disabled` — acceptable since WCAG exempts disabled controls from contrast requirements, but do not repurpose this step for any *enabled* text |
| Light `violet-9` (#5147e5) on bg | 5.85:1 | ✅ | `text.link`, `focus.ring` |
| Light white on `violet-9` button | 6.21:1 | ✅ | `brand.foreground` on `brand.primary` |
| Light white on `violet-10` button | 7.64:1 | ✅ | hover state, even safer |
| Light `gray-6`/`gray-7` borders on white | 1.46:1 / 1.73:1 | N/A (borders use the 3:1 non-text criterion loosely, but Radix border steps are conventionally *not* held to the same bar as focus rings) | Acceptable — borders are a structural cue, not the sole means of conveying state (VisualRules already requires state to never be color-only) |
| Dark `gray-12` (#eaeef5) on bg (#101525) | 15.61:1 | ✅ | `text.primary` |
| Dark `gray-11` (#a6b5ca) on bg | 8.72:1 | ✅ | `text.secondary` |
| Dark `gray-10` (#697d98) on bg | 4.31:1 | ❌ (same restriction as Light) | `text.muted` |
| Dark `violet-11` (#a7aaff) on bg | 8.51:1 | ✅ | **Use for `text.link` in Dark** |
| Dark `violet-9` (#7067f0) on bg | 4.23:1 | ❌ (just under 4.5:1) | **Do not use `violet-9` for text/links in Dark** — use `violet-11` instead (see above) |
| Dark white on `violet-9` button fill | 4.30:1 | ❌ (just under 4.5:1) | **Flag**: `brand.primary` solid button fill fails AA for its own white foreground text in Dark if implemented as a literal step-for-step port of Light |
| Dark white on `violet-10` button fill | 5.17:1 | ✅ | **Recommended fix**: use `violet-10`, not `violet-9`, as the Dark solid-button fill |
| Dark `gray-6`/`gray-7` borders on bg | 1.60:1 / 1.95:1 | N/A (same structural-cue reasoning as Light) | Acceptable |
| Existing `success`/`income` (#059669) on Light bg | 3.55:1 | ❌ | Pre-existing, not introduced by this migration — flagged for awareness, not fixed here |
| Existing `warning` (#d97706) on Light bg | 3.00:1 | ❌ | Pre-existing; weakest of the four status colors — flag to Design System owner |
| Existing `danger` (#dc2626) on Light bg | 4.55:1 | ✅ (barely) | Pre-existing |
| Existing `info` (#2563eb) on Light bg | 4.87:1 | ✅ | Pre-existing |
| Existing `expense` (#dc5a4c) on Light bg | 3.53:1 | ❌ | Pre-existing |

**Two generated Radix values are flagged as unsuitable for their most obvious use**:
1. **`violet-9` for Dark-mode text/links** — reaches only 4.23:1; use `violet-11` (8.51:1) instead for
   any text-on-page role, reserving `violet-9` for solid fills where its own foreground color (white)
   is chosen deliberately, not for text sitting directly on `surface.page`.
2. **`violet-9` as the Dark-mode solid-button fill with a white foreground** — reaches only 4.30:1
   with white text; use `violet-10` (5.17:1) for that specific composition instead.

Both are called out explicitly as **deviations from a literal 1:1 Light→Dark step mapping**, driven
by contrast math, not aesthetic preference — flagged for explicit approval in §18 since "just port
the same step number" would otherwise be the natural (and here, wrong) default.

---

## 15. Design System Governance Amendments

If this architecture is approved, the following existing statements would need amendment (not
rewritten in this report):

**`VisualRules.md` — "Semantic colors" section**: currently describes only a single (Light) palette
with no Dark counterpart language. Would need a new subsection describing the Light/Dark token
pairing model (§8/§9 of this report) and the rule that **no component may reference a raw
`slate-*`/hex/`rgba`/`color-mix(…,white/black)` value going forward** — only `--color-*` semantic
tokens. This formalizes what's already implicit but currently unenforced (§4 shows 851+140+43+27
violations exist today).

**`VisualRules.md` — "Brand expression" section**: the `--color-accent`/`--color-primary` split
(§3/§18) is a genuine open question this doc doesn't currently address — once resolved, the
resolution (which blue "wins" for link/focus/nav-active) should be recorded here as the new brand
grammar.

**`ExceptionsAndDebt.md` — item #10** ("Plan-Type Expression token extraction"): **not resolved** by
this report — Plan-Type stays product-owned (§11). No change needed to this entry, but its
"Debt's amber accent sits close to the semantic warning color" sub-risk is now corroborated with an
exact pair (`#9a3412` vs `#d97706`) — worth adding that specific pair as a parenthetical if/when this
item is next touched, not urgent.

**`ExceptionsAndDebt.md` — potential new deferred item**: the `color-mix(…, white/black)` hover
pattern (§4/C, 11+ files) is architecturally clean *today* (Light-only) but will need a token-driven
replacement once Dark ships (§9's `brand.primary-hover`/`-active` steps). Worth tracking as a new
Deferred Improvement once Dark Mode is scheduled, not before.

**`README.md`**: no change needed — the document map and governance process remain correct; only the
content of `VisualRules.md` is affected.

---

## 16. Migration Risk Matrix

| Area | Current state | Proposed change | Risk | Scope | Recommendation |
|---|---|---|---|---|---|
| Foundation token values | Hand-picked hex, no scale | Option D violet/gray 1–12 scales (private) | Low | Foundation only | Proceed — additive, no consumer touches yet |
| `--color-primary`/`brand.primary` value | Navy `#243b6b` | Violet `#5147e5` | **High** | 68 + 23 = 91 direct consumers | Requires explicit visual sign-off before Phase 2 — this is the single most visible change in the whole migration |
| `--color-accent` vs `--color-primary` split | Two undocumented parallel blues | Unify into one `brand.primary` family | Medium | 24 (`--color-accent`) + touches header, links, focus rings | Resolve as part of Phase 1 token design, before Phase 2 rollout — see §18 |
| `slate-*` hardcodes | 851 occurrences, ~120+ files | Migrate to `--color-text-*`/`--color-border-*`/`--color-surface-*` | Medium (per-file), **High in aggregate** | App-wide | Phase 3–7, component/page-by-page, never one mass PR |
| `Button` primary shadow | `rgba(36,59,107,0.2)` | Token-derived shadow | Low | 1 shared component, many indirect consumers | Phase 3, alongside Card |
| `Button` secondary/destructive hover | `color-mix(…,white)` / raw `red-700` | Token-driven hover steps | Low–Medium | 1 shared component | Phase 3 — add `--color-status-danger-hover`, replace `color-mix` target |
| `Card` shadow | `rgba(23,32,51,0.06)` | Derived `shadow.low` token | Low | 58 consumers (indirect — value change only, no API change) | Phase 3 |
| `ResponsiveModal`/BottomSheet | 8 raw `slate-*` + 2 raw shadows | Token remap | Medium | Shared overlay primitive — blocks every dialog's Dark readiness until fixed | Phase 3, high priority within that phase |
| `AppHeader` nav-active color | `--color-accent` (blue) | `brand.primary` (post-unification) | Medium | 1 component, but user-visible color change (blue → violet nav-active) | Phase 4 pilot |
| Status colors (success/warning/danger/info) | Light-only, 2 pre-existing AA failures | Add Dark counterparts; do not recolor via Option D | Medium | ~20 consumers each | Deferred — needs its own red/green/amber/blue Dark source (§18), separate from Option D violet/gray |
| Plan-Type visuals | Product-owned, light-tuned | Add Dark-safe variants | Low–Medium (isolated) | 9 `PlanType` entries, 1 file, but many rendering consumers | Phase 7, product-owned, no shared-UI change |
| `color-mix(…,white/black)` hover pattern | 27 occurrences, Light-correct | Replace with token-driven hover step | Medium | 11+ files | Phase 3 for shared components, Phase 5+ opportunistically for product code |
| Runtime theme toggle | None exists | `next-themes` (recommended) or hand-rolled `.dark` class + blocking script | Low (additive) | App shell only | Phase 6, after Phases 1–5 have made every shared surface theme-safe |
| `docs/palette/` Radix cruft (`.radix-themes` selector) | Present in copied files | Strip when wiring into `globals.css` | Low | Copy-paste cleanup only | Phase 1, trivial |

---

## 17. Proposed Implementation Phases

```
Phase 1 — Foundation palette + semantic token architecture
  Wire Option D private scales into globals.css; give every "0-consumer" alias (§3) a real
  distinct value; resolve the --color-accent/--color-primary split; strip .radix-themes cruft.
  No visible UI change yet if done purely at the token layer for tokens with existing consumers
  whose old and new values are close — brand.primary IS a visible change and should ship in
  Phase 2, not silently inside Phase 1.

Phase 2 — Light-mode migration with visual parity review
  Roll brand.primary navy→violet through its 91 real consumers. Explicit before/after visual
  review given this is the single highest-risk, highest-visibility change in the plan.

Phase 3 — Theme-safe shared primitives
  Button, Card, ResponsiveModal/BottomSheet, Badge, and other src/shared/components/ui/*
  primitives: replace hardcoded shadows/color-mix/slate- with token references. This is the
  gating phase — nothing in Phase 4+ can be genuinely theme-safe until shared primitives are.

Phase 4 — Navbar/application shell pilot
  AppHeader token cleanup (nav-active unification, confirmed no new nav.* tokens needed per §12).

Phase 5 — Today pilot (per brief's suggested phase name)
  Pick one already-token-adjacent product surface (Today module, given its recent activity in
  this branch) as the first full product-composition migration off slate-*/hex, validating the
  Phase 3 primitives under real product content before wider rollout.

Phase 6 — Dark-mode runtime
  Add next-themes (or hand-rolled equivalent per §13's open decision), wire .dark selector,
  fix viewport.themeColor, verify hydration. Only attempt this once Phases 1–5 have removed the
  worst of the hardcode sprawl — flipping a runtime toggle before then would expose broken
  surfaces immediately.

Phase 7 — Product/domain dark-mode audit
  Plan-Type visuals (plan-card-visuals.ts), finance-category-donut.tsx categorical colors,
  status-color Dark sourcing (§10/§18), and the remaining long tail of slate-*/hex occurrences
  outside Phase 5's pilot surface — module by module.

Phase 8 — Rollout + governance update
  Amend VisualRules.md (§15), close out the color-mix hover-pattern deferred item, final AA
  contrast re-verification across both themes.
```

This order deliberately front-loads **shared primitives (Phase 3) before any single product surface**,
because Phase 5's pilot and every later product-module migration depend on Button/Card/
ResponsiveModal already being theme-safe — migrating a product page before its underlying primitives
are ready would just move the hardcode problem from the page into the (still-broken) shared component
it renders.

---

## 18. Open Decisions Requiring Approval

1. **`brand.primary` value change (navy `#243b6b` → violet `#5147e5`)** — the single most visible
   change in this entire migration, touching 91 direct token consumers plus every component that
   inherits `brand.primary` indirectly (primary buttons, FAB, milestone-selected accents, header
   active state once unified). Needs explicit visual/product sign-off before Phase 2, not just
   engineering approval.

2. **Unifying `--color-accent` and `--color-primary` into one `brand.primary` family** (§3, §12,
   §16) — resolves a real architectural ambiguity but changes the header's active-nav-link color from
   blue to violet, a user-visible change beyond pure refactor. Alternative: keep them permanently
   separate and name both explicitly (`brand.primary` + `brand.interactive-secondary` or similar) —
   this report recommends unification but the user should confirm before Phase 1 locks in a name.

3. **Status/finance color Dark sourcing** (§10) — Option D supplies no red/green/amber/blue scale.
   Need a decision on where Dark-mode `success`/`warning`/`danger`/`info`/`income`/`expense` values
   come from: (a) a matching Radix `green`/`amber`/`red`/`blue` export request (parallel to how
   Option D itself was sourced), (b) programmatically derived from the existing Light hex values via
   an OKLCH lightness/chroma adjustment, or (c) hand-picked. This report does not recommend one —
   it's a sourcing decision, not an architecture decision.

4. **`next-themes` vs. hand-rolled runtime theming** (§13) — recommended `next-themes` for solved
   SSR/hydration handling, but this is a new dependency and the user may prefer to avoid it.

5. **Two explicit accessibility deviations from literal step-for-step Option D porting** (§13/§14):
   using `violet-11` (not `violet-9`) for Dark-mode text/links, and `violet-10` (not `violet-9`) as
   the Dark-mode solid-button fill paired with white text. Both are contrast-driven, not aesthetic —
   flagged for sign-off since they mean Dark mode is not a literal mirror of Light's step choices.

6. **Pre-existing Light-mode AA failures** (`warning` 3.00:1, `success`/`income` 3.55:1, `expense`
   3.53:1) — not introduced by this migration, not fixed by this report, but surfaced here since an
   accessibility audit that stayed silent about them would be incomplete. Decide whether these get a
   dedicated fix (separate from the Option D/Dark-mode work) or stay as accepted debt.

7. **Whether the `color-mix(…, white/black)` hover pattern (§4/C, §16) should become a formally
   tracked `ExceptionsAndDebt.md` Deferred Improvement now**, or wait until Dark Mode is actually
   scheduled (§15) — a process/timing question, not an architecture one.
