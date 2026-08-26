# Overlay Rules

Canonical rules for every modal/dialog/sheet in the app. This consolidates the original Overlay
Architecture spec with the corrective findings from Amendment #2 and the Focus Return fix — those
later findings take precedence over the original spec wherever they differ.

For the product-level rule ("form tạo/sửa luôn hiển thị qua Dialog/BottomSheet, không route qua
page riêng"), see [`docs/ui-modal-conventions.md`](../ui-modal-conventions.md). This doc is the
canonical detail reference it points to.

## The three overlay components

**Visual similarity does not justify collapsing Dialog, AlertDialog, and Sheet semantics into one
generic primitive.** They're different interaction contracts even when they render similarly:

| Component | Family | Use for |
|---|---|---|
| `ResponsiveModal` | Dialog/Modal | Forms, non-destructive workflows |
| `ConfirmDialog` | Alert/Confirmation | Consequential/destructive acknowledgment |
| `BottomSheet` | Legacy sheet | Menu/popover/read-only drilldown **only**, and only under the coexistence constraint below |

## ResponsiveModal

`src/shared/components/ui/responsive-modal.tsx` — canonical overlay for **every** create/edit form
and workflow (Plan, Milestone, Todo, Vendor, Transaction — expense/income/debt — and any similar
future entity). Never route these through a dedicated page.

- **Desktop/mobile split**: `useMediaQuery('(min-width: 768px)')` — desktop renders Radix `Dialog`,
  mobile renders `vaul` `Drawer`. Only one tree mounts; content is never duplicated between a
  hand-rolled `Dialog`+`BottomSheet` pair wrapped in `hidden md:flex`/`md:hidden`. Don't hand-write
  that pattern — it's exactly what `ResponsiveModal` replaced.
- **Size contract**: `size?: 'sm' | 'md' | 'lg' | 'xl'` (desktop-only; mobile Drawer is always
  full-width and ignores `size`). Maps to `sm→max-w-md (448px)`, `md→max-w-xl (576px)`,
  `lg→max-w-2xl (672px)`, `xl→max-w-4xl (896px)`. Omitting `size` preserves old behavior exactly
  (no width constraint unless your own `className` supplies one). Pick a `size` whenever your
  content doesn't need to fill most of the viewport on desktop. Applied examples: Wedding Guest
  quick-add/edit-guest/edit-invitation = `md`; group manager/export = `sm`.
- **Nested chains are supported and verified**: `ResponsiveModal → ResponsiveModal → ResponsiveModal`
  (3 deep) works correctly on both desktop and mobile — correct interactivity, Escape closes only
  the topmost layer, focus restoration cascades back down each layer on close — **as long as every
  layer in the chain is itself a ResponsiveModal/Radix/vaul participant.** This breaks the instant a
  non-participating component (see BottomSheet below) is inserted into the chain.
- **API shape**: fully controlled — `open`, `onOpenChange(open: boolean)` (not `onClose()` — wrap
  it if your form uses `onClose`/`onCancel`), `title`, `description?`, `children`, `className?`,
  `size?`. Form components inside must receive `onSuccess`/`onCancel` via props and must not
  navigate themselves (`router.push`, `<Button href>`) — the caller of `ResponsiveModal` owns
  post-success navigation.
- **Mobile scroll container ("vaul no-drag")**: the scrollable content wrapper carries
  `data-vaul-no-drag` (vaul's own supported opt-out from its `shouldDrag()` heuristic). Without it,
  a touch-drag starting anywhere in that region while `scrollTop === 0` gets misread as
  "dismiss the sheet" instead of "scroll the content." The drag handle/header stay outside this
  wrapper so intentional drag-to-dismiss still works. Don't remove this attribute, and don't merge
  a caller `className` (like `max-h-[90vh] overflow-y-auto`) into the mobile branch — that class is
  meant for the desktop `Dialog.Content`, which has no built-in scroll region; the mobile `Drawer`
  already manages its own max-height/overflow and merging conflicting Tailwind classes silently
  breaks it.
- **Focus lifecycle**: initial focus and focus trapping are owned entirely by Radix/vaul — never
  reimplement them. Focus **return** on close uses `onCloseAutoFocus` with a trigger element
  captured via React's "adjusting state during render" pattern (`useState`, not a ref write during
  render — the project's React Compiler lint rule forbids ref mutation during render). This exists
  because `ResponsiveModal`/`ConfirmDialog` are fully controlled with no `Dialog.Trigger`
  subcomponent, so Radix's own `triggerRef`-based restoration is always a no-op for them. If you
  ever need to touch this code: use the library's own documented extension point
  (`onOpenAutoFocus`/`onCloseAutoFocus`), never `setTimeout`, never a `useEffect`-based
  restoration, never a ref write during render.

## ConfirmDialog

`src/shared/components/ui/confirm-dialog.tsx` — canonical overlay for destructive/consequential
action confirmation (delete, remove, cancel-a-settlement, etc.). Never use `window.confirm()`.

- **Platform**: desktop `@radix-ui/react-alert-dialog`, mobile `vaul` `Drawer` with
  `dismissible={false}`. Escape and outside-click dismissal are both explicitly prevented on both
  platforms — destructive confirmations must not be casually dismissible.
- **Mutation contract**: Cancel = zero mutation, dialog closes, focus returns to trigger. Confirm =
  the underlying mutation fires exactly once with the same arguments the pre-migration flow used.
  Any mutating action — not only "delete" — that has no confirmation step is a gap: Settlement's
  "Xác nhận đã chuyển"/"Hủy" actions were the last remaining zero-confirmation mutations in the app
  and were closed as a P1 fix before Go-Live.
- **Severity is not automatically destructive-red.** `confirmVariant: 'default' | 'destructive' |
  'success'`. Use `destructive` for anything that deletes or reverses recorded state (it maps to
  Button's native `destructive` variant). Use `default` for a neutral confirm (maps to `primary`).
  Use `success` for a positive/completing confirm (raw `bg-emerald-600` override — no Button-native
  equivalent yet). Don't default every ConfirmDialog to red; match the actual severity.
- **Safe initial focus**: never defaults to the destructive/confirm action. Desktop uses Radix's
  `AlertDialog.Cancel` mechanism; mobile uses an explicit `onOpenAutoFocus` handler locating Cancel
  via a `data-confirm-dialog-cancel` attribute. Both are library-supported extension points.

## BottomSheet — legacy, limited intentional exception

`src/shared/components/ui/bottom-sheet.tsx` — marked `@deprecated` in source. No new usage.
May remain **only** for approved menu/popover or read-only drilldown cases, under one hard
constraint:

> **A `BottomSheet` may only remain in use when it can never coexist with, contain, or be
> contained in a `ResponsiveModal` interaction chain. If there is even one real path where it
> could — migrate it to `ResponsiveModal`.**

**Why this rule exists (root cause, not a guess — confirmed by direct `pointer-events`
measurement):** `BottomSheet` is a hand-rolled `position: fixed` div that never registers with
Radix's shared `DismissableLayerContext`. When any `ResponsiveModal` is open anywhere in the tree,
Radix (and independently, vaul) sets `document.body.style.pointerEvents = 'none'` and re-enables
`pointer-events: auto` only on DOM nodes that are themselves registered `DismissableLayer`
instances. `BottomSheet` has no such registration, so it inherits `pointer-events: none` with no
path back to `auto` — it becomes **fully inert**, including its own close button, the instant any
`ResponsiveModal` is open, regardless of open order. A second, independent defect: its hardcoded
`z-50` also outranks `ResponsiveModal`'s shared `--z-index-overlay: 40` token.

**Do not fix this with z-index escalation or a consumer-specific `pointer-events` override** — that
patches the symptom, not the missing participation in the shared dismissable-layer system. If a
BottomSheet needs to coexist with a ResponsiveModal, the fix is migration to ResponsiveModal, full
stop.

**Currently exempt (correctly KEEP, do not re-flag as debt without new evidence):**
- Plan Detail Shell header "⋮" menu
- The 2 statistic drilldown sheets that never open a further ResponsiveModal from inside themselves
- `PlanningTab`'s milestone-expense drilldown
- `member-actions-menu.tsx`'s "⋮" action menu

**Already migrated because they violated the rule:** `statisticMemberDrilldown` and
`statisticMilestoneMemberDrilldown` (each opens a "Chi tiết khoản chi" `ResponsiveModal` from
inside itself) — both migrated to `ResponsiveModal` with `size="sm"` to preserve BottomSheet's old
`md:max-w-md` desktop width. `AttachmentPicker`, `ExpenseForm`'s payer-picker, and three
debt-tracking sheets were migrated for the same reason during Rollout.

If you're building something new and reach for `BottomSheet`, first check whether it can ever be
opened while, or open, a `ResponsiveModal`. If you're unsure, use `ResponsiveModal`.

## Explicit prohibitions (all overlays)

- No z-index escalation hacks.
- No consumer-specific `pointer-events` overrides.
- No `setTimeout`/`useEffect`/polling-based focus restoration hacks.
- No manual reimplementation of focus trapping where Radix/vaul already provides it.
- No downgrading `AlertDialog` semantics to an ordinary `Dialog` for code-sharing convenience.
- Every fix to overlay behavior uses the underlying library's own documented, supported extension
  point (`onOpenAutoFocus`, `onCloseAutoFocus`, `data-vaul-no-drag`, etc.) — not a workaround
  layered on top.
- A `position: absolute` dropdown/menu nested inside any `overflow-hidden` ancestor (accordions,
  `Collapsible`, expand/collapse rows) is at risk of being clipped even though it isn't strictly an
  "overlay" in the modal sense — use `position: fixed` computed from the trigger's
  `getBoundingClientRect()` instead of a portal or an `overflow-visible` escape hatch that would
  break the ancestor's own animation.

## Legacy `Dialog` component

`src/shared/components/ui/dialog.tsx` is also deprecated (no accessible focus/Escape handling,
predates `ResponsiveModal`). The one remaining intentional exception is documented in
[ExceptionsAndDebt.md](./ExceptionsAndDebt.md) (`WeddingGuestImportDialog`).
