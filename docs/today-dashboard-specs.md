# Today Dashboard ("Hôm nay") — Specs & Implementation Plan

Status: Phase 0 discovery PASS. Phase 1 (foundation/contracts), Phase 2 (bounded queries +
rebuild engine), Phase 3 (client orchestration — `useTodaySummary()`, localStorage cache, SWR),
and Phase 4 (real `/today` UI, landing redirect) implemented 2026-08-26. Post-Phase-4: awaiting
authenticated screenshot review (see §12) — no visual polish/next phase until then.

## 12. UI layer (Phase 4 — implemented)

Real `/today` page, single-column layout, composed from existing Design System components per
`docs/design-system/` governance — `docs/design-system/README.md`,
`FeatureImplementationRules.md`, `ComponentUsage.md`, `VisualRules.md` were read before
implementation. REUSE: `PageHeader`, `Section`, `EntityList`, `Badge`, `Button`, `EmptyState`,
`ErrorState`, `Skeleton`, `DataRow` (via the new `TodayItemRow`). PRODUCT-SPECIFIC:
`TodayItemRow` (`src/modules/today/components/today-item-row.tsx`) — composes `DataRow` with a
type badge, urgency badge (mapped from `DueUrgency` to Badge's closed tone vocabulary in product
code, not a new Badge variant), and a click handler that navigates to
`/plans/{planId}?tab=todos&todoId={itemId}` or `?tab=travelItinerary&activityId={itemId}` — an
existing, already-used route/query-param contract (`plan-module-registry.ts`,
`plans/[planId]/page.tsx`'s existing `todoId`/`activityId` param handling), not a new capability.
No new shared Design System API was added; no evidence-gate item arose. Container width reuses
`max-w-5xl` (the one existing non-modal "constrained content column" precedent in this codebase,
`src/app/page.tsx`) rather than inventing a new value.

Landing redirect: `src/app/page.tsx` now targets `appRoutes.today` instead of `appRoutes.plans`.
Nav active state required no code change — `navigation-items.ts` already resolves it via
`pathname === appRoutes.today`, which is exact-match against the real route.

**Discovered during this phase, fixed**: `npm run typecheck` (the lighter check used in Phases
1-3) had missed a real type error in `today-summary-window.ts`'s `zonedStartOfDayUtc` —
destructuring `dateKey.split('-').map(Number)` under this repo's `noUncheckedIndexedAccess`
produced `number | undefined`, which `Date.UTC()` rejects. `npm run build` (the authoritative
check per `FeatureImplementationRules.md`) caught it; fixed by reading each part via `Number(parts[N])`
(accepts `undefined` without a type error, `dateKey` is always well-formed by construction from
`getDateKey()`) instead of destructuring the mapped array. Not a business-logic defect — pure
type-safety gap, fixed directly, not something requiring a data-layer redesign.

**Verification performed**: `npm run build` (full authoritative typecheck + production build,
including static prerender of `/today`) — clean. `npm run test` — 33 files, 223/223 pass, no
regressions. `npx eslint` scoped to every file this phase touched — clean. Browser smoke test via
Playwright against the already-running dev server (unauthenticated): `/` → redirects to
`/login?next=%2F`, `/today` → redirects to `/login?next=%2Ftoday`, both with zero console errors —
confirms the new page compiles/renders without throwing and `AuthGuard` correctly protects the
real page the same way it protected the placeholder.

**Not verified — genuinely blocked in this environment, not skipped silently**: the actual
authenticated content (sections, item rows, empty/error states with real data) could not be
visually verified. This repo's `firebase.config.ts` has no emulator-connection wiring (confirmed
by grep), so even with the Firestore/Auth emulators running locally (verified they start
successfully — Java 11 is available in this environment now, unlike the "Java 11 vs required 21"
block noted in earlier project memory), the dev server still talks to the real production Firebase
project. Creating a throwaway account against production Firebase to get a screenshot was judged
not an appropriate unilateral action. Recommend the user verifies the authenticated states
directly — this is exactly what "wait for screenshot review" in the Phase 4 request anticipated.

## 1. Goal (recap)

User-level dashboard aggregating top items across all Plans the current user has active access
to, without loading each plan's full dataset. Three sections, capped:

- `Cần chú ý` (attention) — max 5
- `Hôm nay` (today) — max 10
- `Sắp tới` (upcoming) — max 5

## 2. Architecture decisions (final)

1. `/today` will become the authenticated default landing page, replacing the `/plans` redirect —
   **not done yet**, deferred to a later phase.
2. Cache lives at `/users/{userId}/todaySummary/current` — Firestore doc, disposable read-model,
   current day only (not source of truth; safe to delete/rebuild any time). No history is kept.
3. Item caps: attention 5, today 10, upcoming 5.
4. **No** `attentionUpdatedAt` field. Freshness is derived purely from `dateKey` + `timezone` +
   `rebuiltAt` + a **10-minute TTL** (`TODAY_SUMMARY_TTL_MS`).
5. **No** Today aggregates or module permissions denormalized into `userPlans`. `userPlans` is
   untouched by this feature; permission resolution reads the real `PlanMemberDocument` per plan
   at rebuild time instead.
6. **No** mutation-flow changes to Todo/Travel Activity to serve Today.
7. **No** realtime listeners or polling for Today. All reads are one-shot (`getDocs`/`getDoc`).
8. V1 module scope: **Todo** and **Travel Activity only**. **Debt and Milestone are fully
   deferred** — not in `TodaySummaryItemKind` at all for V1.
9. `firestore.indexes.json` is version-controlled, containing only the index Todo's bounded query
   actually needs (§5) — added in Phase 2 once that query existed, not before.

## 3. Data model (Phase 1 — `src/modules/today/`)

### 3.1 `/users/{userId}/todaySummary/current` (Firestore)

```ts
export type TodaySummaryItemKind = 'todo' | 'travelActivity';

export type TodaySummaryItem = {
  kind: TodaySummaryItemKind;
  planId: string;
  planName: string;
  itemId: string;
  title: string;
  dueAt: Timestamp | null;
  urgency: DueUrgency; // reused from src/shared/utils/date.ts
};

export type TodaySummaryDocument = {
  userId: string;
  dateKey: string; // 'YYYY-MM-DD' in `timezone`
  timezone: string;
  rebuiltAt: Timestamp;
  sourcePlanIds: string[];
  attentionItems: TodaySummaryItem[]; // max 5
  todayItems: TodaySummaryItem[]; // max 10
  upcomingItems: TodaySummaryItem[]; // max 5
};
```

### 3.2 Firestore rules

```
match /users/{userId}/todaySummary/{summaryId} {
  allow read, write: if isSignedIn() && request.auth.uid == userId;
}
```

### 3.3 Freshness — `utils/today-summary-freshness.ts`

`getDateKey(date, timeZone)` and `isTodaySummaryFresh(summary, { now, timezone })` — pure,
TTL + dateKey + timezone based, no `attentionUpdatedAt`. Covered by
`tests/unit/today-summary-freshness.test.ts` (8 cases).

### 3.4 Repository / service

`TodaySummaryRepository` (`getSummary`/`writeSummary`, plain `getDoc`/`setDoc`, no
`onSnapshot`) + `TodaySummaryService` — read/write pass-through, extended in Phase 2 with the
rebuild orchestration (§6).

## 4. Bounded source queries (Phase 2 — implemented)

All one-shot (`getDocs`), never `onSnapshot`, never a full-collection read. Added to the owning
module's existing repository/service, following that module's existing conventions.

### 4.1 Todo — `src/modules/todo/`

`ACTIVE_TODO_STATUSES = ['todo', 'in_progress']` (new `constants/todo-status.ts`). Two repository
methods (`repositories/todo.repository.ts` interface, `firestore-todo.repository.ts` impl,
`services/todo.service.ts` pass-through):

```ts
getOverdueActiveTodos(planId, { beforeAt, limitCount }):
  where('status', 'in', ACTIVE_TODO_STATUSES)
  where('dueDate', '<', beforeAt)
  orderBy('dueDate', 'asc')   // oldest/most-overdue first
  limit(limitCount)

getActiveTodosDueBetween(planId, { startAt, endAt, limitCount }):
  where('status', 'in', ACTIVE_TODO_STATUSES)
  where('dueDate', '>=', startAt)
  where('dueDate', '<', endAt)
  orderBy('dueDate', 'asc')
  limit(limitCount)
```

`getActiveTodosDueBetween` is reused for both the "today" window
(`[todayStart, tomorrowStart)`) and the "upcoming" window (`[tomorrowStart, upcomingEnd)`) — same
shape, different boundaries. All three call sites use **ascending** `dueDate` order (including
overdue — oldest/longest-neglected first, a deliberate product call: "needs attention most" reads
as "waiting longest," not "most recently overdue"). Using ascending consistently everywhere also
means a single composite index covers every Todo query Today issues (§5).

### 4.2 Travel Activity — `src/modules/travel-activity/`

One method, `getActivitiesStartingBetween(planId, { startAt, endAt, limitCount })` — single range
filter on `startsAt`, `orderBy('startsAt', 'asc')`, `limit()`. No status filter (Travel Activity
has none) and, per instruction, **no overdue variant** — a past `startsAt` is never surfaced as an
attention item.

### 4.3 Plan — `src/modules/plan/`

Rebuild needs the active-plan list without an open listener, and `watchUserPlans` is
`onSnapshot`-only. Added `getUserPlans(userId): Promise<PlanSummary[]>` — a one-shot mirror
(`getDocs` instead of `onSnapshot`, same `memberStatus === 'active' && planStatus !== 'archived'`
filter). This is the one place Phase 2 touched a module beyond Todo/Travel Activity; it was
necessary to satisfy decision 7 ("no realtime listeners") for the plan-list step of rebuild — see
§6.

### 4.4 Member — `src/modules/member/`

Similarly added a one-shot `getMember(planId, memberId): Promise<PlanMemberDocument | null>`
(plain `getDoc`) alongside the existing `onSnapshot`-only `watchMembers`. Needed so rebuild can
resolve the current user's per-plan capabilities without a listener.

### 4.5 Debt and Milestone — still fully deferred

No queries added. The earlier concern about Debt (no per-transaction outstanding/settled flag —
netting requires a counterparty's full transaction history, so a bounded date-range query on raw
transactions can't reliably say a loan is still owed) still applies whenever Debt is revisited.

## 5. Firestore composite indexes — `firestore.indexes.json` (Phase 2)

One index, added because it's the one query shape that actually needs it:

```json
{
  "indexes": [
    {
      "collectionGroup": "todos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ]
}
```

This single index serves all three Todo query call sites (overdue/today/upcoming) because all
three filter on `status in [...]` plus a `dueDate` range/inequality with **ascending** order —
same field combination, same direction, every time. Travel Activity needs no composite index
(single range field + matching `orderBy` is covered by Firestore's automatic single-field
indexing).

`firebase.json` now wires it up: `"firestore": { "rules": "firestore.rules", "indexes":
"firestore.indexes.json" }`.

**Deployment command (not run — no production deployment performed in this phase):**

```
firebase deploy --only firestore:indexes
```

No existing indexes were audited or touched — this is the first and only entry in the file.

## 6. Rebuild orchestration (Phase 2 — implemented)

Lives entirely in `TodaySummaryService.rebuild(userId, { now, timezone })`
(`src/modules/today/services/today-summary.service.ts`) — not in any React component, per
instruction. Flow:

```
planSource.getUserPlans(userId)                         // one-shot, active plans only
  → for each plan (in parallel via Promise.all):
      memberId = plan.memberId  // present on the userPlans doc at write time,
                                 // just not on the public PlanSummary type — see below
      if (!memberId) skip plan
      member = memberSource.getMember(plan.planId, memberId)
      if (!member || member.status !== 'active') skip plan
      { canViewTodo, canViewTravelActivity } = resolveTodayAccessibleModules(member)
      if (canViewTodo): run the 3 bounded Todo queries (§4.1)
      if (canViewTravelActivity): run the 2 bounded Travel Activity queries (§4.2)
  → buildTodaySummary({ ...collected source items, now, timezone })   // pure, see §6.2
  → todaySummaryRepository.writeSummary(userId, summary)              // full overwrite
```

### 6.1 Cross-module read boundary

`TodaySummaryService`'s constructor takes narrow, Today-defined interfaces (`TodayPlanSource`,
`TodayMemberSource`, `TodayTodoSource`, `TodayTravelActivitySource`) rather than the concrete
`PlanService`/`MemberService`/`TodoService`/`TravelActivityService` classes. `services/index.ts`
wires the real singletons in — they satisfy these interfaces structurally. This follows the
existing repository-interface-injection convention used throughout the codebase (every service
takes an interface, not a concrete repository class), applied one layer up since Today is the
first module that needs to compose *other modules' services* rather than just its own repository.
It also keeps `rebuild()` unit-testable without Firestore, though Phase 2 did not add such a test
— see §8's documented gap.

Cross-module access strictly goes through each module's service singleton (`planService`,
`memberService`, `todoService`, `travelActivityService`, all imported via their public barrel
`index.ts`) — never another module's repository class directly. Confirmed by grep: no module in
this codebase imports another module's `Firestore*Repository` class, so Today doesn't either.

### 6.2 Pure bucketing — `utils/today-summary-bucketing.ts`

`buildTodaySummary(input)` takes already-fetched, already permission-scoped source arrays (no
Firestore access) and produces the final `TodaySummaryDocument`:

- Normalizes `TodoDocument`/`TravelActivityDocument` into `TodaySummaryItem`.
- **Defensive active-status re-check**: filters `overdueTodos`/`todayTodos`/`upcomingTodos` by
  `status in ['todo', 'in_progress']` again, even though the repository query already enforces
  this server-side. This is a deliberate second check, not redundant paranoia — it's what makes
  the completed/cancelled exclusion rule independently unit-testable without an emulator (§8), and
  it's a real safety net if a caller (a future refactor, a manually-edited doc) ever hands the
  function unfiltered data.
- **Urgency**: `attention` items are always `'overdue'`, `today` items always `'danger'` — implied
  by which bounded query the caller already put them through, not recomputed. Only the `upcoming`
  bucket computes urgency (`'warning'` if due within 2 calendar days, else `'normal'`), via
  integer day-diff against `todayStart`, matching the existing `getDueUrgency` threshold
  convention in `shared/utils/date.ts` — reimplemented rather than reused because `getDueUrgency`
  calls `Date.now()`/local device timezone internally and isn't parameterizable, which would break
  both determinism (tests) and timezone-correctness (server/user timezone mismatch).
- **Dedup**: composite key `${kind}:${planId}:${itemId}`, first occurrence wins.
- **Sort**: ascending `dueAt`, tiebreak by `itemId` ascending — deterministic even when many items
  share an identical timestamp (e.g. todos with no time-of-day component all defaulting to the
  same instant).
- **Cap**: `slice(0, MAX_*)` after sort — for `attention`, ascending sort + slice means the
  *oldest* overdue items win a slot when there are more than 5, not the most recent.

### 6.3 Day-boundary math — `utils/today-summary-window.ts`

No timezone library is available in this repo (confirmed in Phase 0/1). `zonedStartOfDayUtc(date,
timeZone)` computes the UTC instant of local midnight using only `Intl.DateTimeFormat`: format
`date` in `timeZone` to get the calendar day, then compute that timezone's UTC offset near that
day's naive midnight (via a second `Intl.DateTimeFormat` call) and apply it. `getTodaySummaryWindows(now,
timezone)` builds `{ todayStart, tomorrowStart, upcomingEnd }` from it, with `tomorrowStart` /
`upcomingEnd` as fixed `+1 day` / `+UPCOMING_WINDOW_DAYS days` (`UPCOMING_WINDOW_DAYS = 7`)
instant-arithmetic offsets from `todayStart`.

**Known limitation, not fixed in this phase**: the offset used for a day boundary is resolved from
the *naive* UTC-interpreted midnight, then re-resolved once at that point — correct for all normal
cases, but could be off by up to an hour on the rare calendar day where a DST transition falls
between the naive guess and the true local midnight. No timezone library is available to close
this gap cleanly; flagging it rather than working around it with more hand-rolled date math.

## 7. Files

### Created (Phase 1)
`src/modules/today/{types/today-summary.ts, constants/today-summary.constants.ts,
utils/today-summary-freshness.ts, repositories/today-summary.repository.ts,
repositories/firestore-today-summary.repository.ts, services/today-summary.service.ts (initial),
services/index.ts, index.ts}`, `tests/unit/today-summary-freshness.test.ts`.

### Created (Phase 2)
- `src/modules/todo/constants/todo-status.ts`
- `src/modules/today/utils/today-summary-window.ts`
- `src/modules/today/utils/today-summary-access.ts`
- `src/modules/today/utils/today-summary-bucketing.ts`
- `firestore.indexes.json`
- `tests/unit/today-summary-window.test.ts`
- `tests/unit/today-summary-access.test.ts`
- `tests/unit/today-summary-bucketing.test.ts`

### Modified (Phase 2)
- `src/modules/todo/repositories/todo.repository.ts` + `firestore-todo.repository.ts` +
  `services/todo.service.ts` — `getOverdueActiveTodos`, `getActiveTodosDueBetween`.
- `src/modules/travel-activity/repositories/travel-activity.repository.ts` +
  `firestore-travel-activity.repository.ts` + `services/travel-activity.service.ts` —
  `getActivitiesStartingBetween`.
- `src/modules/plan/repositories/plan.repository.ts` + `firestore-plan.repository.ts` +
  `services/plan.service.ts` — `getUserPlans` (one-shot mirror of `watchUserPlans`).
- `src/modules/member/repositories/member.repository.ts` + `firestore-member.repository.ts` +
  `services/member.service.ts` — `getMember` (one-shot).
- `src/modules/today/constants/today-summary.constants.ts` — added `UPCOMING_WINDOW_DAYS = 7`.
- `src/modules/today/services/today-summary.service.ts` — added `rebuild()` and the
  `TodayPlanSource`/`TodayMemberSource`/`TodayTodoSource`/`TodayTravelActivitySource` interfaces.
- `src/modules/today/services/index.ts` — wires `planService`/`memberService`/`todoService`/
  `travelActivityService` into `TodaySummaryService`.
- `src/modules/today/index.ts` — exports the new utils/types.
- `firebase.json` — wired `firestore.indexes.json`.

### Created (Phase 3)
- `src/modules/today/utils/today-summary-local-cache.ts`
- `src/modules/today/utils/today-summary-validation.ts`
- `src/modules/today/hooks/use-today-summary.ts`
- `tests/unit/today-summary-local-cache.test.ts`
- `tests/unit/today-summary-validation.test.ts`

### Modified (Phase 3)
- `src/modules/plan/types/plan.ts` — added required `memberId: string` to `PlanSummary` (§10.1).
- `src/modules/today/services/today-summary.service.ts` — removed the `memberId` cast in
  `rebuild()`, reads `plan.memberId` directly now.
- `src/modules/today/index.ts` — exports the new cache/validation/hook APIs.

### Not touched (explicitly out of scope for Phase 3)
- [src/app/page.tsx](src/app/page.tsx) — still redirects to `/plans`.
- [src/app/(authenticated)/today/page.tsx](src/app/(authenticated)/today/page.tsx) — still the
  placeholder; `useTodaySummary()` is not wired into it yet.
- Debt, Milestone, `attentionUpdatedAt`, IndexedDB, realtime listeners/polling, Cloud Functions.

## 8. Tests

**Added (34 new test cases across 3 files, all passing):**
- `tests/unit/today-summary-window.test.ts` (7) — `zonedStartOfDayUtc` across UTC+7/UTC-7/UTC
  timezones, window adjacency/non-overlap, boundary-instant ownership.
- `tests/unit/today-summary-access.test.ts` (6) — permission/module-access filtering: null
  member, owner bypass, editor defaults, `planning`/`travelItinerary` hidden overrides, viewer.
- `tests/unit/today-summary-bucketing.test.ts` (14) — overdue→attention, today classification
  (todo + activity), upcoming warning/normal threshold, **completed/cancelled Todo exclusion**,
  deterministic sort + tiebreak, 5/10/5 limits (including which items survive the cap), **duplicate
  prevention** (same item twice, and same `itemId` across different plans is *not* deduped), fresh
  summary document shape.

**Full repo regression**: `npm run test` → 31 files, **205/205 pass** (up from 178 pre-Phase-2, no
regressions). `npm run typecheck` (`next build --webpack --experimental-build-mode compile`) →
compiles clean. `npx eslint` on every file touched in Phase 2 → clean (a handful of pre-existing
warnings/errors elsewhere in the repo, e.g. `use-attention-todos.ts`, are unrelated and untouched
by this phase — verified by scoping eslint to exactly the changed file list).

**Explicitly not exercised — documented per instruction rather than worked around:**
- No emulator was available in this environment (consistent with prior project history — see
  memory: Java version blocked emulator runs previously) to verify the actual Firestore composite
  index (§5) resolves the intended query shapes, or to verify `firestore.rules` enforcement for
  `todaySummary`. The query builders and rules were reviewed by hand against Firestore's documented
  index rules and the existing rules file's conventions, not executed against a live/emulated
  Firestore.
- `TodaySummaryService.rebuild()`'s I/O orchestration itself (plan → member → bounded queries →
  write sequencing) has no direct unit test. It's a thin composition of already-tested pieces
  (`buildTodaySummary` is fully tested; each repository method is a straightforward query
  matching an established pattern), and the interfaces it depends on (`TodayPlanSource` etc.) are
  narrow enough to be mocked if a future phase wants an orchestration-level test — that groundwork
  is in place, just not exercised yet.

## 9. Correctness/performance notes discovered during Phase 2

1. **`memberId` on `PlanSummary` is a type/runtime mismatch that predates this feature.** The
   `userPlans/{userId}/plans/{planId}` document has a `memberId` field written at creation time
   (`firestore-plan.repository.ts`, `firestore-invitation.repository.ts`), and an existing call
   site (`cascadeNicknameUpdate` in `firestore-member.repository.ts`) already reads it via a local
   cast — but the `PlanSummary` TypeScript type never declared it. Rebuild does the same local
   cast (`plan as PlanSummary & { memberId?: string }`) rather than editing the shared type,
   consistent with the existing precedent and "no unrelated refactors." Worth fixing at the type
   level someday, but out of scope here.
2. **Per-plan query bound, not a global one.** Each bounded query uses the *global* section limit
   (5/10/5) as its own `limit()`, per plan. Worst-case reads for the rebuild step scale as
   `O(active plans × up to 5 queries)`, not `O(1)`. This is intentional — it's what "bounded per
   source, capped globally after merge" means in practice — but it does mean a user with many
   active plans triggers proportionally more reads on a rebuild (not on every `/today` view, only
   on cache-miss/stale rebuilds gated by the 10-minute TTL). Acceptable for V1; would need
   revisiting if "many active plans per user" turns out to be a common case.
3. **DST-transition edge case in day-boundary math** — see §6.3. Rare, undeployed-and-unverified
   against a real timezone database beyond Node's built-in `Intl`, flagged rather than silently
   accepted.
4. Sections 4.3/4.4 (`getUserPlans`, `getMember`) went beyond the two named modules (Todo, Travel
   Activity) in the Phase 2 brief. This was necessary, not scope creep: decision 7 ("no realtime
   listeners") is incompatible with the only pre-existing way to get "active user plans" and "this
   user's member doc" (`watchUserPlans`/`watchMembers`, both `onSnapshot`-only) — a one-shot
   equivalent had to exist somewhere, and repository-boundary conventions (§6.1) meant it belonged
   in those modules, not bypassed via direct Firestore access from Today.

## 10. Client orchestration layer (Phase 3 — implemented)

### 10.1 `PlanSummary`/`memberId` type drift — resolved, fixed

Investigated before touching anything (per instruction: verify before treating as guaranteed).
Findings:

- `UserPlanDocument` (`src/modules/plan/types/plan.ts`) already declared `memberId: string` as
  **required** — it's a type that already existed, correctly, but was never actually used to type
  any repository return value; `PlanSummary` (the type actually used everywhere, including
  `watchUserPlans`/`getUserPlans`) is otherwise-identical to `UserPlanDocument` minus `userId` and
  `memberId`. This looks like `PlanSummary` was forked from `UserPlanDocument` for read-facing
  consumers and simply dropped those two fields from the type, not from the underlying document.
- Both places that ever create a `userPlans/{userId}/plans/{planId}` document —
  `firestore-plan.repository.ts` (owner path, `createPlanGraph`) and
  `firestore-invitation.repository.ts` (invitation-acceptance path) — write `memberId` as part of
  the initial `set()`. `git log -S` on both write sites shows `memberId` was present **since the
  commit that first introduced each write path** (`9a4bfa9` "feat: phase 3" for the owner path,
  `0d4787f` "feat: invitation for new member" for the invitation path) — there is no earlier
  version of either write path in this repo's history that omitted it, and no third creation path
  exists (grepped for every `userPlans` collection write).
- An existing call site, `cascadeNicknameUpdate` in `firestore-member.repository.ts`, already reads
  `memberId` off a raw `userPlans` doc via an unchecked local cast — i.e. the existing code already
  treats it as guaranteed.

**Conclusion: guaranteed for every document this codebase's write paths can produce.** Fixed at
the type level rather than kept as a local workaround:

- Added `memberId: string` to `PlanSummary` (`src/modules/plan/types/plan.ts`), positioned to
  match `UserPlanDocument`'s field order. Verified no other consumer of `PlanSummary` (10+ call
  sites checked) constructs one via object literal — all of them only read it as a function
  parameter or `useState<PlanSummary[]>` type, so adding a required field is compile-safe; confirmed
  via `npm run typecheck`.
- Removed the Today-specific cast (`plan as PlanSummary & { memberId?: string }`) in
  `today-summary.service.ts`'s `rebuild()` — it now reads `plan.memberId` directly. Kept a
  defensive `if (!plan.memberId) return` guard (not a type workaround anymore, just the same
  "skip a malformed plan entry, don't fail the whole rebuild" treatment already used for a missing
  member).
- Did **not** touch `userId` (also missing from `PlanSummary`, also present on `UserPlanDocument`)
  or `cascadeNicknameUpdate`'s own cast — out of scope, not what Today needs, avoids unrelated Plan
  type cleanup.

### 10.2 localStorage cache — `utils/today-summary-local-cache.ts`

Local to `src/modules/today/`, no generic cache abstraction. One key per user
(`today-summary:{userId}`); the stored value additionally carries `dateKey`/`timezone`/`cachedAt`
so all three required namespace dimensions (user, dateKey, timezone) are validated **on the
value**, not just inferred from the key — defense in depth against a hypothetical key collision or
future key-scheme change, tested explicitly (§11.4).

- `Timestamp` fields (`rebuiltAt`, each item's `dueAt`) don't survive `JSON.stringify`/`parse` as
  class instances — serialized to epoch-ms numbers on write, reconstructed via `Timestamp.fromMillis`
  on read.
- Any mismatch (wrong user/dateKey/timezone), malformed JSON, structurally implausible shape, or
  unavailable storage (SSR, privacy mode) is a **safe miss** — returns `null`, never throws. Old-day
  entries are not retained as history; a write always fully overwrites the single per-user key.

### 10.3 `validateTodaySummary()` — `utils/today-summary-validation.ts`

Pure orchestration, no React: read the Firestore summary once, use it if
`isTodaySummaryFresh()` (existing Phase 1 logic — `dateKey`/`timezone`/`rebuiltAt`/10-min TTL, no
`attentionUpdatedAt`) says it's fresh, otherwise call `TodaySummaryService.rebuild()` and return
the result. Takes a narrow `TodaySummaryValidationSource` interface (`getSummary`/`rebuild`),
satisfied structurally by `todaySummaryService` — same consumer-defined-interface pattern as
Phase 2's `TodayPlanSource` etc., chosen here specifically so this function is unit-testable with
a fake source instead of a real Firestore call.

**Duplicate-rebuild guard**: a module-scoped `Map<string, Promise<TodaySummaryDocument>>` keyed by
`${userId}:${dateKey}` — a concurrent call for the same key returns the same in-flight promise
instead of starting a second `getSummary`+possibly-`rebuild()` sequence. This is what "smallest
local solution" meant here: not a lock, lease, or generic dedup utility — a five-line `Map` scoped
to this one function, cleaned up via `.then(clear, clear)` (deliberately not `.finally()`, which
would create an unhandled-rejection-prone derived promise since nothing else awaits it).

### 10.4 `useTodaySummary()` — `hooks/use-today-summary.ts`

The hook owns lifecycle/state only — no decision logic lives here that isn't already tested in
§11.2/§11.3.

**A note on how it's structured**: an early draft called `setState` synchronously at the top of
the effect body (the common "if no user, reset everything" + "if cached, show it" pattern). ESLint's
`react-hooks/set-state-in-effect` rule flags this as a real anti-pattern (a synchronous
`useEffect`-body `setState` causes an extra cascading render) — and this codebase already has two
pre-existing, unfixed instances of the same violation (`use-attention-todos.ts`,
`use-todos-by-milestone.ts`), which was a signal to write this new hook correctly rather than add a
third. Restructured around React's documented "adjust state during render" pattern instead: a
`requestKey` (`${userId}:${dateKey}:${refreshToken}`) is computed every render; when it changes
from the previous render's key, `setState` is called **during the render body itself** (not in the
effect) to synchronously re-seed state from the localStorage cache — this is an explicitly
React-supported pattern (bails out and re-renders immediately, before commit/effects), not a lint
violation, and it's what makes the very first paint able to show cached content with no flash. The
`useEffect` is then left doing only the actual async work, with every `setState` call inside a
`.then()`/`.catch()` callback — never synchronously in the effect body. Verified clean:
`npx eslint src/modules/today/hooks/use-today-summary.ts` → no output.

**Lifecycle**, driven by `requestKey`:
1. Render-time (not effect): if `requestKey` changed, synchronously read the localStorage cache
   for `(userId, dateKey, timezone)`. If present → `summary = cached`, `isLoading = false`,
   `isRefreshing = true`. If absent → `isLoading = true`, `isRefreshing = false`.
2. Effect: call `validateTodaySummary(todaySummaryService, { userId, timezone, dateKey, now })`.
3. On success: `summary = result`, `isLoading = isRefreshing = false`, `error = null`; write the
   result to localStorage.
4. On failure: leave `summary` untouched (still whatever was showing — cache or nothing), set
   `error`, clear `isLoading`/`isRefreshing`.
5. `refresh()` bumps a `refreshToken` counter, which changes `requestKey` and re-runs the whole
   cycle (still SWR — re-seeds from cache first, shows `isRefreshing` not `isLoading`, since the
   cache write from the previous cycle is normally already in place by the time a manual refresh
   is triggered).

**API**: `{ summary, isLoading, isRefreshing, error, refresh }` — no presentation/copy logic, no
Vietnamese strings, nothing UI-specific.

### 10.5 Tests added (28 new cases, all passing)

- `tests/unit/today-summary-local-cache.test.ts` (10) — valid round-trip (Timestamp fields
  preserved), userId/dateKey/timezone mismatch → miss, embedded-userId mismatch even with a
  matching key (defense in depth), malformed JSON → no throw, structurally implausible JSON → miss,
  empty cache → miss, no `window` (SSR) → no throw, later write overwrites earlier (no history).
- `tests/unit/today-summary-validation.test.ts` (8) — fresh summary used as-is (no rebuild call),
  stale summary triggers rebuild, missing summary triggers rebuild, day-rollover triggers rebuild
  even if `rebuiltAt` looks recent, rebuild failure propagates as a rejection, concurrent calls for
  the same `(userId, dateKey)` dedupe to one `getSummary`/`rebuild` call each, calls for different
  users don't dedupe against each other, a new call after the previous one settled runs fresh (no
  stale caching of the dedup itself).

**Explicitly not tested — documented rather than worked around**: hook-level SWR state-transition
tests ("cached summary remains visible during refresh," "cached summary survives refresh failure,"
"no-cache initial failure exposes error") were **not** written as direct React hook tests. This
repo has no `jsdom`/`@testing-library/react` dependency anywhere — confirmed by inspecting every
existing `.tsx` test (`card.test.tsx`, `data-row.test.tsx`, etc.), all of which use
`react-dom/server`'s `renderToStaticMarkup` (static HTML string rendering, does not execute
`useEffect` by React's design) — and `vitest.config.ts` runs tests in a plain Node environment, not
jsdom. Adding hook-testing infrastructure would be a new dependency decision, not something to
introduce unilaterally alongside a data-layer phase. Instead, the equivalent behavior is proven at
the layer that actually implements it: `today-summary-validation.test.ts`'s rebuild-failure test
proves the promise rejects without touching any cache state, and the hook's `.catch()` handler
(reviewed, not independently executed in a test) is the only place `summary` could be cleared —
it deliberately never is. This is the same kind of gap Phase 2 hit with the Firestore
emulator — flagged here rather than glossed over.

**Full regression**: `npm run test` → 33 files, **223/223 pass** (up from 205 pre-Phase-3).
`npm run typecheck` → clean. `npx eslint` scoped to every file this phase touched → clean.

### 10.6 Firebase deployment requirements (not deployed — reported per instruction)

Two artifacts are still only local, never applied to a real Firestore project:

- `firestore.rules` (includes the Phase 1 `todaySummary` rule)
- `firestore.indexes.json` (the Phase 2 `todos` composite index)

**This repo has no `.firebaserc`** — no Firebase project is currently linked to this directory for
CLI deployment, even though `.env`/`.env.local` do contain a real
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`/admin credentials (values not inspected/printed here) and the
`firebase` CLI is available on this machine. Deploying would require first running `firebase use
--add` (or creating `.firebaserc` by hand) to link a project, then:

```
firebase deploy --only firestore:rules,firestore:indexes
```

**Not run.** The feature is not integration-verified against a real Firestore/emulator — same
caveat already logged in Phase 2 (no emulator available in this environment either; the query
shapes and rules were reviewed by hand against Firestore's documented behavior, not executed).

## 11. Resolved from earlier drafts

- Debt V1 scope → resolved: fully deferred, not partially shipped.
- `firestore.indexes.json` introduction → resolved: added in Phase 2, exactly one index, only
  once the Todo query that needs it existed.
- Rebuild staleness definition → resolved: pure TTL (10 min) + day-rollover via `dateKey`, no
  writer-driven `attentionUpdatedAt` signal.
- Attention/overdue sort direction → resolved during Phase 2 implementation (not pre-specified):
  ascending (oldest/most-neglected first), which also simplified the index requirement to one
  entry instead of two.

Phase 3+ (localStorage/SWR cache, rebuild trigger wiring on `/today` mount, final UI, landing
redirect) not started — awaiting go-ahead.
