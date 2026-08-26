# Exceptions & Deferred Backlog

A maintained registry, split into two kinds of entry. Don't confuse them:

- **INTENTIONAL EXCEPTION** — a permanently accepted deviation. Not debt. Do not "fix" it without
  new evidence changing the calculus; if you think one should be revisited, say so explicitly (see
  STOP conditions in [FeatureImplementationRules.md](./FeatureImplementationRules.md)) rather than
  quietly reworking it.
- **DEFERRED IMPROVEMENT** — real, evidenced, not required for any specific future feature. Do not
  treat items here as required work just because you're touching a nearby file — pick them up only
  if the user asks, or if your feature naturally already needs the capability (in which case, note
  that you're resolving a tracked deferred item, don't silently duplicate it again).

## Intentional exceptions

1. **`WeddingGuestImportDialog`** — still uses the legacy `Dialog`, not `ResponsiveModal`. Reason:
   a 3-step wizard + wide CSV preview table has no fit even under `ResponsiveModal`'s size
   contract (`sm..xl`, max 896px) — it needs more width than any approved size, and is the only
   consumer with that need. Documented, deliberate boundary, not migration debt. **Revisit trigger:
   a second wide-content consumer appears** — that would be real evidence for either widening the
   size contract or building an exception-width pattern.

2. **`BottomSheet` KEEP cases** (policy-exempt, not debt) — Plan Detail Shell header "⋮" menu, the
   2 statistic drilldown sheets that never open a further `ResponsiveModal` from inside themselves,
   `PlanningTab`'s milestone-expense drilldown, and `member-actions-menu.tsx`'s "⋮" menu. All are
   explicitly exempted by the coexistence rule in [OverlayRules.md](./OverlayRules.md) §BottomSheet.
   Do not re-flag these as migration debt solely because `BottomSheet` still appears in the file.

3. **`TodoNotificationScreen`** — a bottom-anchored, product-specific overlay that doesn't match
   `ResponsiveModal`'s interaction model (stays bottom-anchored at all viewport widths). A single
   instance is not sufficient evidence for a new canonical BottomPanel/ResponsivePanel abstraction.
   Stays product-specific.

4. **`NotificationBadge`** — a numeric badge overlaid on an icon corner (Dashboard bell). Single
   occurrence; closest comparisons (`Badge` next to a heading, tone-colored bell icons) are not the
   same shape. Insufficient evidence for a dedicated primitive — stays product-specific.

5. **Plan-Type Expression accent-color layer remains product-owned.** Raw `planType ===`
   branching lives in product configuration (e.g. `plan-card-visuals.ts`), not in a formal
   Foundation token layer. Confirmed zero `planType` references exist inside
   `src/shared/components/ui/` — the architectural guarantee a token layer would formalize is
   already holding by convention. No action required before this is revisited; see deferred item
   below for the token-extraction proposal this exception sits next to.

6. **`StatisticOverview`'s green "Tổng thu"** — colored green as a plan-wide income aggregate, a
   different, valid meaning from "member balance is positive" (the more common red/green usage
   elsewhere). Reviewed and judged not a real confusion risk; preserved exactly as-is. If you add
   new red/green usage, be clear about which of these two meanings applies — see
   [VisualRules.md](./VisualRules.md) "Semantic colors."

## Deferred improvements

1. **Single-value `Progress`/`ProgressBar` core primitive.** Evidence: 4+ modules with independent
   hand-rolled progress bars (Wedding Overview, Dashboard `PlanCard`, Statistic's
   `FinanceBudgetProgress`/`FinanceMilestoneBars`/`MemberBalanceTable`'s `ComparisonBar`s/
   `MemberSpendingList`, Settlement's `SettlementProgressSummary`). Evidence bar is met; not
   release-critical, current hand-rolled implementations work. Recommended as the first item to
   pick up post-launch if/when someone has bandwidth, not a blocker for any feature.
   *(Segmented/donut progress — `RsvpDonutChart`, `FinanceCategoryDonut` — is a separate, weaker-
   evidenced family; evaluate independently, don't fold it into this one.)*

2. **`Button size="icon"`.** Evidence bar met (5 known hand-rolled icon-only button consumers:
   Plan Detail Shell header "⋮", 2 in `travel-activity-detail.tsx`, 2 toggles in
   `todo-list-controls.tsx`) — purely additive, low risk. Not implemented. If your feature needs an
   icon-only button, this is a reasonable one to finally add (see the evidence-gate exception
   language in [FeatureImplementationRules.md](./FeatureImplementationRules.md)) rather than
   hand-rolling a 6th bespoke instance.

3. **TextAction / link pattern.** Evidence: 8+ "Xem thêm/Xem tất cả" instances across Dashboard,
   Wedding Overview, Wedding Guest, Settlement, Debt-tracking, most hand-overriding Button's
   chrome. `Button variant="link"` is judged the more likely fit over a brand-new component. Not
   blocking, not implemented.

4. **Opportunistic radius cleanup.** ~74 occurrences across ~34 files of ad-hoc literal
   `rounded-[24px]`/`rounded-[26px]`/`rounded-[28px]` outside Card's own controlled legacy default.
   Explicit policy: **fix opportunistically only when a change already needs to touch that
   surface** — do not open a dedicated cleanup pass, before or after Go-Live. The drift has not
   worsened across 8 rollout waves under this policy; keep following it.

5. **Todo bell-tone dedup (`getBellToneClass`).** Byte-for-byte duplicated in
   `todo-notification-screen.tsx` and `todo-attention-section.tsx` — a correctness trap (likely to
   diverge on a future edit to one but not the other), not a current bug. Recommended fix:
   extract to a shared util (e.g. `todo/utils/attention-tone.ts`). Not resolved at Go-Live.

6. **Dead Statistic code** — `ExpenseTimelineChart` and `CompletedPlanOverview` have zero
   consumers anywhere in the repo. Safe, zero-risk deletion whenever convenient; no urgency since
   unreachable code has no runtime effect.

7. **Stronger brand expression** — named only as a backlog entry with no elaborating detail in any
   source document. Treat as a real but unspecified future direction, not an actionable item on
   its own.

8. **Debt visual-density polish** — same as above: a bare backlog entry, no further detail
   documented anywhere.

9. **Finance modal IA (information architecture) redesign** — same as above: a bare backlog entry,
   no further detail documented.

10. **Plan-Type Expression token extraction** (`plan.{type}.accent/.surface/.text` tokens, consumed
    only by `plan-card-visuals.ts`, never leaking `planType` into generic components). The
    underlying amendment proposal remains on record as deferred/not-implemented, even though the
    *current* architecture is judged sufficient (see Intentional Exception 5 above) — pick this up
    only if a second PlanType-heavy surface provides new evidence beyond Dashboard's single data
    point. Named sub-risk to watch if this work happens: Debt's amber accent color sits close to
    the semantic warning color — needs explicit attention, not silent resolution.

## If you're about to duplicate a deferred item

If your feature needs a 4th, 5th, or 6th instance of something on this list (another hand-rolled
progress bar, another icon-only button, another "Xem thêm" override), that's exactly the kind of
evidence this registry exists to track — consider resolving the deferred item instead of adding
another one-off, but don't block your feature on it without checking with the user first if it's
not a small addition.
