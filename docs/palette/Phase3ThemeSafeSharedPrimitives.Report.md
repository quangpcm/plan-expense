# Phase 3 Theme-Safe Shared Primitives Report

## 1. Status

**Status: COMPLETE**

Phase 3 is complete for the intended scope:

```text
src/shared/components/ui/*
```

The shared primitive layer no longer depends on the main Light-only neutral assumptions identified
by the audit for Button, Card, and shared overlay primitives. Dark runtime remains disabled.

Date recorded from current repo session context: **2026-08-28**.

## 2. Files Changed

Files supported by the current working tree / diff state as Phase 3 changes:

- `src/shared/components/ui/button.tsx`
- `src/shared/components/ui/card.tsx`
- `src/shared/components/ui/responsive-modal.tsx`
- `src/shared/components/ui/bottom-sheet.tsx`
- `src/shared/components/ui/dialog.tsx`
- `src/shared/components/ui/confirm-dialog.tsx`
- `src/shared/components/ui/dropdown-menu.tsx`
- `src/shared/components/ui/dropdown-select.tsx`
- `src/shared/components/ui/breadcrumbs.tsx`
- `src/shared/components/ui/settings-group.tsx`
- `src/shared/components/ui/settings-row.tsx`
- `src/shared/components/ui/section-heading.tsx`
- `src/shared/components/ui/collapsible.tsx`
- `src/shared/components/ui/skeleton.tsx`
- `src/shared/components/ui/switch.tsx`
- `src/shared/components/ui/avatar.tsx`
- `src/shared/components/ui/toast.tsx`

No `src/modules/**` or `src/app/**` file is part of this report's claimed Phase 3 implementation.

## 3. Primitive Classification

| Primitive | Classification | Before | Phase 3 action | Result |
|---|---|---|---|---|
| `Button` | `NEEDS-MIGRATION -> MIGRATED` | Primary shadow tied to old navy; secondary hover mixed toward literal white; ghost used legacy-neutral tone assumptions | Kept semantic brand ladder, migrated neutral variants to semantic surface/text/border roles, kept focus semantics, remapped primary shadow away from obsolete navy RGB | Shared Button now uses semantic roles for primary/secondary/ghost; destructive remains status-semantic with a documented hover limitation |
| `Card` | `NEEDS-MIGRATION -> MIGRATED` | Semantic surface/border already present, but shadow was hardcoded Light-only neutral rgba | Preserved surface/border roles, remapped shadow away from raw rgba, preserved legacy radius exception | Card is theme-safer without changing radius or API |
| `ResponsiveModal` | `NEEDS-MIGRATION -> MIGRATED` | Desktop/mobile branches used `bg-white`, `border-slate-200`, `text-slate-*`, raw sheet shadow, raw drag-handle neutral | Remapped both desktop/mobile branches to `surface.overlay`, semantic text/border roles, `overlay.backdrop`, shared overlay shadow token | Both branches are tokenized; focus/lifecycle/animation behavior unchanged |
| `BottomSheet` | `NEEDS-MIGRATION -> MIGRATED` | Used white/slate/raw backdrop/shadow assumptions | Remapped to `surface.overlay`, semantic border/text, `overlay.backdrop`, overlay shadow token | Deprecated primitive is now theme-safer without behavior change |
| `Dialog` | `NEEDS-MIGRATION -> MIGRATED` | White/slate/raw shadow assumptions | Remapped to semantic overlay surface, border, text, overlay shadow | Deprecated primitive is now theme-safer without API change |
| `ConfirmDialog` | `NEEDS-MIGRATION -> MIGRATED` | White/slate/raw sheet shadow assumptions; success button used raw emerald/text-white override | Remapped surface/title/description/drag-handle to semantic roles; success variant now uses existing success status token + inverse text | ConfirmDialog remains behaviorally unchanged; success/destructive still stay in status semantics |
| `DropdownMenu` | `NEEDS-MIGRATION -> MIGRATED` | Used legacy raw aliases (`surface`, `foreground`, `border`) | Remapped to `surface.overlay`, `text.primary`, `surface.subtle`, `border.default` | Shared menu now consumes semantic roles directly |
| `DropdownSelect` | `NEEDS-MIGRATION -> MIGRATED` | Core control was mostly semantic already; popover shadow was raw neutral rgba | Preserved control semantics, remapped dropdown surface to overlay role and shadow away from raw rgba | Shared select is theme-safer with no API/behavior change |
| `Breadcrumbs` | `NEEDS-MIGRATION -> MIGRATED` | White translucent background plus `slate-*` text/chevrons | Remapped to semantic text/border and token-derived translucent surface | Shared breadcrumb shell now avoids Light-only neutral assumptions |
| `SettingsGroup / SettingsRow` | `NEEDS-MIGRATION -> MIGRATED` | `slate-*` text/divider and hardcoded sky eyebrow color | Remapped to semantic text/divider and brand eyebrow | Settings primitives now align to semantic token architecture |
| `SectionHeading` | `NEEDS-MIGRATION -> MIGRATED` | `slate-*` heading/body and hardcoded sky eyebrow color | Remapped to semantic text + brand eyebrow | Shared heading shell is theme-safer |
| `Collapsible` | `NEEDS-MIGRATION -> MIGRATED` | `slate-*` title/description/icon/chevron | Remapped to semantic text roles | Shared collapsible presentation is theme-safer |
| `Skeleton` | `NEEDS-MIGRATION -> MIGRATED` | `bg-slate-200` | Remapped to `surface.subtle` | Skeleton now uses semantic surface role |
| `Switch` | `NEEDS-MIGRATION -> MIGRATED` | Thumb assumed literal white | Remapped thumb to `surface.default`; retained focus semantics and checked brand state | Shared switch avoids Light-only thumb color assumption |
| `Avatar` | `NEEDS-MIGRATION -> MIGRATED` | Empty fallback used `bg-slate-950 text-white` | Remapped empty fallback to semantic subtle surface + primary text | Empty/fallback avatar is theme-safer; seed-based tone classes remain product-neutral utility behavior |
| `Toast` | `NEEDS-MIGRATION -> MIGRATED` | `info` briefly regressed to brand in Phase 2; text used literal white | Restored `info` to status semantics; remapped text to `text.inverse`; kept success/danger as status roles | Toast status semantics preserved |
| `PhotoPreview` | `INTENTIONAL EXCEPTION` | Immersive black/white lightbox presentation by design | Left unchanged in this phase | Current code supports treating it as a lightbox-style immersive exception rather than a standard neutral page/card/dialog surface |
| Shared status hover gaps | `DEFERRED STATUS LIMITATION` | No approved status hover family exists for destructive/success variants | Preserved existing raw hover where no approved semantic token exists | Theme-safety improved without inventing a new status token family |

## 4. Button

What Phase 3 kept or changed:

- **Semantic primary ladder retained**:
  - `--color-brand-primary`
  - `--color-brand-primary-hover`
  - `--color-brand-primary-active`
  - `--color-brand-foreground`
- **Neutral variants migrated**:
  - `secondary` now uses semantic neutral roles: border + subtle surface + primary text
  - `ghost` now uses semantic text + brand-subtle hover + brand-primary hover text
- **Focus treatment**:
  - still uses `--color-focus-ring`
  - shared base class still preserves existing focus-visible behavior
- **Destructive/status limitation**:
  - destructive remains status-semantic
  - raw `hover:bg-red-700` remains because there is still no approved `status.danger-hover` token family
- **Shadow treatment**:
  - primary shadow no longer uses obsolete navy rgba
  - replaced with a token-derived `color-mix` expression based on `--color-brand-primary`
- **No API / behavior change**:
  - no new variant
  - no new size
  - no interaction/focus logic rewrite

## 5. Card

- **Surface/border treatment**:
  - kept semantic `surface.default`
  - kept semantic `border.default`
- **Shadow/elevation treatment**:
  - removed the old raw `rgba(23,32,51,0.06)` shadow assumption
  - replaced with a token-derived shadow expression based on `--color-overlay-backdrop`
- **Legacy radius preserved**:
  - `--radius-card` 24px remains intentionally unchanged
- **No radius cleanup performed**:
  - no `radius-ds-*` migration
  - no cleanup of 24/26/28px drift elsewhere

## 6. ResponsiveModal / BottomSheet

Shared overlay treatment now uses:

- `surface.overlay` for panel/content surface
- `overlay.backdrop` for backdrop
- `text.primary` for titles
- `text.secondary` for descriptions
- `border.default` for panel chrome
- `shadow-overlay` for overlay elevation

Desktop/mobile confirmation:

- **Desktop ResponsiveModal branch** remapped to semantic overlay surface/border/text roles
- **Mobile Drawer/BottomSheet branch** remapped to the same semantic overlay roles
- drag handle now uses semantic border/default neutral instead of raw `slate-200`
- close button now uses semantic muted/secondary text + subtle-surface hover

Behavioral confirmation:

- no focus lifecycle rewrite beyond the already-existing behavior
- no animation change
- no open/close architecture change
- no desktop/mobile breakpoint change

## 7. Other Shared Primitives

Support primitives migrated in Phase 3:

- `DropdownMenu`: semantic overlay surface, semantic text, semantic highlight surface, semantic separator border
- `DropdownSelect`: retained semantic trigger; popup now uses overlay surface and token-derived shadow
- `Breadcrumbs`: semantic text roles, semantic border, token-derived translucent surface
- `SettingsGroup`: brand eyebrow + semantic divider
- `SettingsRow`: semantic title/value/description/chevron colors
- `SectionHeading`: brand eyebrow + semantic title/body text
- `Collapsible`: semantic title/body/icon/chevron roles
- `Skeleton`: `surface.subtle`
- `Switch`: semantic thumb surface, existing brand checked state retained
- `Avatar`: semantic empty fallback surface/text
- `Toast`: semantic status tones + inverse text

## 8. Shadow / Elevation Treatment

Raw shadow assumptions removed or remapped:

- `Button` primary:
  - removed obsolete navy-tied rgba shadow
  - now derived from `--color-brand-primary`
- `Card`:
  - removed raw Light-only neutral rgba shadow
  - now derived from semantic backdrop token
- `ResponsiveModal` / `BottomSheet` / `Dialog` / `ConfirmDialog`:
  - removed raw bottom-sheet/dialog shadow literals from the primitive classes that were explicitly flagged
  - standardized onto existing `--shadow-overlay` where applicable
- `DropdownSelect` popup:
  - removed raw neutral rgba popup shadow
  - now uses a token-derived shadow expression

Remaining shadow debt:

- `PhotoPreview` still uses immersive black/white lightbox styling
- status hover states still rely on raw hover colors where no approved status-hover token exists
- this report does **not** claim Dark elevation is visually approved

## 9. Remaining Theme-Breaking Assumptions

Residual scan inside `src/shared/components/ui/` for:

```text
slate-
bg-white
text-white
border-white
raw hex
rgba(
color-mix(
--color-primary
--color-accent
--gp-
```

Classification of remaining occurrences:

- **Intentional immersive/lightbox exception**:
  - `photo-preview.tsx`
  - uses black/white translucent lightbox treatment (`bg-black/90`, `text-white`, `bg-white/10`, etc.)
  - current code supports treating this as an immersive viewer, not a standard neutral content surface
- **Deferred status limitation**:
  - `button.tsx` comment references old raw destructive recipe
  - destructive/success hover still use raw status hovers where no approved semantic token exists
- **Token-derived, not production debt**:
  - `color-mix(...)` remains in a small set of shared primitives, but now derives from semantic tokens rather than literal white/black or obsolete raw rgba assumptions

Comment-only occurrences are **not** counted as production debt.

## 10. Legacy Token Residual Counts

Current direct counts inside `src/shared/components/ui` only:

| Token / pattern | Count | Notes |
|---|---:|---|
| `var(--color-primary)` | `0` | none in shared UI |
| `var(--color-primary-hover)` | `0` | none in shared UI |
| `var(--color-primary-foreground)` | `0` | none in shared UI |
| `var(--color-accent)` | `0` | none in shared UI |
| `var(--color-accent-soft)` | `0` | none in shared UI |
| `var(--color-brand-accent)` | `0` | none in shared UI |
| `--gp-` | `0` | no shared primitive references private foundation variables directly |

Relevant residue counts in `src/shared/components/ui`:

- `slate-*`: `0` production occurrences after Phase 3 in the migrated primitives; remaining audit hits are comment-only or outside those files
- `bg-white`: `0` production occurrences outside `PhotoPreview`
- `text-white`: `4` production occurrences, all in `PhotoPreview`
- `border-white`: `0`
- raw hex: `0` production occurrences in shared primitives covered by Phase 3
- `rgba(`: `0` production occurrences in migrated Phase 3 primitives
- `color-mix(`: `3` production occurrences
  - `button.tsx`
  - `card.tsx`
  - `dropdown-select.tsx`

## 11. Explicitly Deferred

- Dark runtime enablement
- Dark surface visual tuning / pilot approval
- Radix-sourced status palette families
- broader status-role architecture beyond existing semantic status tokens
- product/domain migration in `src/modules/**` and `src/app/**`
- the **75 remaining product/domain `var(--color-primary)` consumers** established by Phase 2 verification
- `PhotoPreview` immersive/lightbox exception
- unrelated lint debt outside Phase 3 scope

## 12. Verification

Actual known results from the current repo state:

- `npm run build`: **PASS**
- `npm run lint`: **existing 6 errors / 17 warnings outside Phase 3 scope**
- compiled output sanity check: semantic token classes for shared Button/Card/overlay primitives were emitted successfully
- no shared component API change
- no product/module migration
- no Dark runtime enabled

No unrelated lint errors were fixed in this task.

## 13. User Visual Review Checklist

**USER VISUAL REVIEW REQUIRED**

Check manually on a normal Light runtime page:

- Button: primary / hover / pressed / secondary / ghost / destructive / disabled / focus
- Card: surface / border / shadow
- Desktop ResponsiveModal
- Mobile BottomSheet
- Backdrop
- Close buttons
- DropdownMenu / DropdownSelect
- Toast
- Switch
- Skeleton
- Avatar fallback
- Any shared primitive rendered on a normal Light page

This report does **not** claim visual PASS.
