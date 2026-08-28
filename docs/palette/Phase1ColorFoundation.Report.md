# Phase 1 Color Foundation Report

## Files Changed

- `src/styles/globals.css` — sole application-source change.
- `docs/palette/Phase1ColorFoundation.Report.md` — this report (new).

No other file was modified. No component, provider, or `package.json` change was required.

## Foundation Added

Private Option D foundation scales, declared outside `@theme` (so Tailwind never generates
utilities for them):

- `:root { --gp-violet-1..12, --gp-violet-a1..a12, --gp-gray-1..12, --gp-gray-a1..a12, --gp-background }` — Light, plus a `@supports (color: color(display-p3 1 1 1))` / `@media (color-gamut: p3)` progressive-enhancement block mirroring the source files.
- `.dark { --gp-violet-* / --gp-gray-* / --gp-background }` — Dark, same structure, same P3 block. Structural only — nothing applies `.dark` to any element yet.

All values cross-checked byte-for-byte against the six approved files in `docs/palette/`.

## Semantic Mapping Implemented

All LOCKED Light and Dark mappings from `ColorArchitecture.Spec.md` §9 are implemented in `@theme`
(Light defaults) plus a `.dark` override block (Dark values that use a different foundation step
than Light). Tokens where Light and Dark use the *same* foundation step (e.g. `text.primary` =
gray-12 in both) need no explicit Dark override — they resolve correctly via the private
foundation cascade alone.

Explicit `.dark` semantic overrides (different step than Light, or non-foundation Light value):
`surface.default/subtle/raised/overlay` (provisional), `text.link` (violet-11, not violet-9),
`brand.primary/-hover/-active` (violet-10/8/7 — the accessibility-driven amendment), `overlay.backdrop`.

`text.secondary` and `text.muted` intentionally resolve to the same `gray-11` value in both themes
(Option D has no AA-passing step between gray-10 and gray-11) — implemented as specified, not
"corrected."

## Compatibility Aliases

Reversed alias direction per spec §10/§15 — canonical semantic token is now the source, legacy raw
token aliases it:

- `--color-primary(-hover)` → `var(--color-brand-primary(-hover))`
- `--color-primary-foreground` → `var(--color-brand-foreground)`
- `--color-background/-foreground/-surface/-surface-soft/-muted/-border` → alias their corresponding semantic token (`surface.page`, `text.primary`, `surface.default`, `surface.subtle`, `text.secondary`, `border.default`)

No circular references (verified programmatically — see Verification).

## Deprecated Tokens Retained Temporarily

- `--color-subtle` — DEPRECATED compatibility token, repointed to `var(--color-text-muted)` (now
  equal to `text.secondary`'s value). 18 existing consumers keep resolving; new code should use
  `--color-text-secondary`/`--color-text-muted` directly.
- `--color-accent` / `--color-accent-soft` — DEPRECATED, frozen at their original literal values
  (`#3b82f6` / `#e8f1ff`), **not** aliased to the new brand family. The old token covers at least
  four distinct roles (nav-active, link, focus, border-focus) that now resolve to different
  semantic tokens — aliasing it to any single one would silently misrepresent the others and
  visibly recolor `AppHeader`'s nav-active state ahead of its Phase 4 migration. Per-consumer
  triage deferred to Phase 3/4, per the spec.
- `--color-brand-accent` — same status as `--color-accent` (2 consumers, unchanged value).
- `--color-secondary` / `--color-secondary-foreground` — kept as neutral compatibility roles per
  spec §18, remapped to Option D neutral values (`gray-3` / `gray-12`) directly (no intermediate
  `secondary.*` semantic tier was created, per explicit non-goal).

## Provisional Dark Values

Marked `PROVISIONAL — VISUAL PILOT` in code comments, per `ColorArchitecture.Spec.md` §7/§9/§16:

- `surface.default` = `gray-2`, `surface.subtle` = `surface.raised` = `gray-3`, `surface.overlay` = `gray-4`
- `overlay.backdrop` (Dark) = `rgb(2 6 23 / 55%)` — implemented at the low end of the spec's
  recommended ~55–60% range; not locked.

## Verification

- **Variable graph**: programmatic cycle-detection over every `--*: value;` declaration in the
  file — no cycles found; no `--color-*`/`--gp-*` reference resolves to an undefined property.
- **Exact values**: every Light/Dark hex called out in the task (brand.primary/-hover/-active,
  text.link, text.secondary/muted) cross-checked against the compiled source — all match.
- **No leaked foundation API**: confirmed no `--gp-*` property is *declared* inside `@theme` (only
  *referenced* via `var()`), so Tailwind generates no `bg-gp-*`/`text-gp-*` utilities.
- **Build**: `npm run typecheck` (`next build --webpack --experimental-build-mode compile`) —
  compiled successfully, all 14 routes collected without error.
- **Lint**: `npm run lint` — 6 errors / 17 warnings, all pre-existing and unrelated to this change
  (React hooks rules, unused imports in `today-progress-summary.tsx`,
  `use-attention-todos.ts`, `use-todos-by-milestone.ts`, and others) — none touch
  `globals.css` or any color token. Not fixed, per scope.
- **Runtime sanity**: started `next dev`, requested `/login` (200 OK), fetched the compiled CSS
  bundle, and confirmed: `--color-brand-primary: var(--gp-violet-9)` (Light) and
  `--color-brand-primary: var(--gp-violet-10)` (inside the compiled `.dark` block); `body { background:
  var(--color-surface-page); }`; `::selection` now derives from `--color-brand-primary` via
  `color-mix(..., transparent)` (with Lightning CSS's own `@supports` fallback layered on top).
  Dev server stopped afterward.

## Deferred to Later Phases

- Button/Card/ResponsiveModal/BottomSheet/AppHeader/Today component migration (Phase 3–5) — not
  touched; their hardcoded shadows, `slate-*` usage, and `color-mix(…, white/black)` patterns are
  unchanged.
- `next-themes` install, `ThemeProvider`, `.dark` class on any element, theme toggle — none added;
  Dark Mode is not runtime-enabled.
- Radix Green/Amber/Red/Blue status-color scales — not sourced or invented; `success`/`warning`/
  `danger`/`info`/`income`/`expense` remain unchanged Light-only literals.
- Plan-Type (Milestone/`plan-card-visuals.ts`) visuals — untouched.
- `--shadow-overlay`, Card/Button shadow literals, radius debt — untouched (Phase 3 scope).
- Relabeling provisional Dark surfaces/backdrop as `LOCKED` — requires the Phase 6 visual pilot.
