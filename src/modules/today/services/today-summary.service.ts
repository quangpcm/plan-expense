import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanSummary } from '@/modules/plan/types/plan';
import type { TodoDueWindowQuery, TodoOverdueQuery } from '@/modules/todo/repositories/todo.repository';
import type { TodoDocument } from '@/modules/todo/types/todo';
import type { TravelActivityStartWindowQuery } from '@/modules/travel-activity/repositories/travel-activity.repository';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import type { TodaySummaryRepository } from '@/modules/today/repositories/today-summary.repository';
import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';
import { resolveTodayAccessibleModules } from '@/modules/today/utils/today-summary-access';
import type { ActivitySourceItem, TodoSourceItem } from '@/modules/today/utils/today-summary-bucketing';
import { buildTodaySummary } from '@/modules/today/utils/today-summary-bucketing';
import { getTodaySummaryWindows } from '@/modules/today/utils/today-summary-window';
import {
  MAX_ATTENTION_ITEMS,
  MAX_TODAY_ITEMS,
  MAX_UPCOMING_ITEMS,
} from '@/modules/today/constants/today-summary.constants';

// Narrow, consumer-defined interfaces — Today only depends on the read
// capability it actually needs from each module's service, not the full
// service class. planService/memberService/todoService/travelActivityService
// each satisfy these structurally; see services/index.ts for the wiring.
export interface TodayPlanSource {
  getUserPlans(userId: string): Promise<PlanSummary[]>;
}

export interface TodayMemberSource {
  getMember(planId: string, memberId: string): Promise<PlanMemberDocument | null>;
}

export interface TodayTodoSource {
  getOverdueActiveTodos(planId: string, params: TodoOverdueQuery): Promise<TodoDocument[]>;
  getActiveTodosDueBetween(planId: string, params: TodoDueWindowQuery): Promise<TodoDocument[]>;
}

export interface TodayTravelActivitySource {
  getActivitiesStartingBetween(planId: string, params: TravelActivityStartWindowQuery): Promise<TravelActivityDocument[]>;
}

export type RebuildTodaySummaryParams = {
  now: Date;
  timezone: string;
};

// Diagnostic only — logs the ORIGINAL Firebase error (code + message) next
// to which Today operation/query it came from, then the caller always
// re-throws the same, unmodified `error`. Never replaces it with a generic
// message; this is purely a visibility aid for local debugging
// (docs/today-dashboard-specs.md — Phase 4 follow-up diagnosis).
function logTodayFirestoreError(operation: string, context: Record<string, unknown>, error: unknown): void {
  const code = error && typeof error === 'object' && 'code' in error ? (error as { code: unknown }).code : undefined;
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[Today] ${operation} failed`, { ...context, code, message });
  console.error(error);
}

function hasDueDate(todo: TodoDocument): todo is TodoDocument & { dueDate: NonNullable<TodoDocument['dueDate']> } {
  return todo.dueDate !== null;
}

function toTodoSourceItems(plan: PlanSummary, todos: TodoDocument[]): TodoSourceItem[] {
  return todos.filter(hasDueDate).map((todo) => ({
    planId: plan.planId,
    planName: plan.planName,
    todoId: todo.id,
    title: todo.title,
    dueDate: todo.dueDate,
    status: todo.status,
  }));
}

function toActivitySourceItems(plan: PlanSummary, activities: TravelActivityDocument[]): ActivitySourceItem[] {
  return activities.map((activity) => ({
    planId: plan.planId,
    planName: plan.planName,
    activityId: activity.id,
    title: activity.title,
    startsAt: activity.startsAt,
  }));
}

export class TodaySummaryService {
  constructor(
    private readonly todaySummaryRepository: TodaySummaryRepository,
    private readonly planSource: TodayPlanSource,
    private readonly memberSource: TodayMemberSource,
    private readonly todoSource: TodayTodoSource,
    private readonly travelActivitySource: TodayTravelActivitySource,
  ) {}

  async getSummary(userId: string) {
    try {
      return await this.todaySummaryRepository.getSummary(userId);
    } catch (error) {
      logTodayFirestoreError('getSummary (users/{userId}/todaySummary/current read)', { userId }, error);
      throw error;
    }
  }

  async replaceSummary(userId: string, summary: TodaySummaryDocument) {
    await this.todaySummaryRepository.writeSummary(userId, summary);
  }

  // Rebuild flow: active user plans -> resolve member/capabilities per plan
  // -> bounded one-shot queries only for accessible modules -> normalize ->
  // bucket/sort/cap (pure) -> overwrite the disposable summary doc. No
  // realtime listeners, no partial per-plan patching, best-effort overall
  // (see docs/today-dashboard-specs.md — a plan/member that fails to load is
  // skipped, not fatal to the whole rebuild).
  async rebuild(userId: string, params: RebuildTodaySummaryParams): Promise<TodaySummaryDocument> {
    const windows = getTodaySummaryWindows(params.now, params.timezone);
    let plans: PlanSummary[];

    try {
      plans = await this.planSource.getUserPlans(userId);
    } catch (error) {
      logTodayFirestoreError('getUserPlans (userPlans/{userId}/plans read)', { userId }, error);
      throw error;
    }

    const sourcePlanIds: string[] = [];
    const overdueTodos: TodoSourceItem[] = [];
    const todayTodos: TodoSourceItem[] = [];
    const upcomingTodos: TodoSourceItem[] = [];
    const todayActivities: ActivitySourceItem[] = [];
    const upcomingActivities: ActivitySourceItem[] = [];

    await Promise.all(
      plans.map(async (plan) => {
        // memberId is a required PlanSummary field (matches UserPlanDocument,
        // guaranteed by every userPlans-doc write path — see
        // docs/today-dashboard-specs.md #2). Still guarded defensively, same
        // as the member-lookup check below: skip a malformed plan entry
        // rather than fail the whole rebuild.
        if (!plan.memberId) {
          return;
        }

        let member: PlanMemberDocument | null;

        try {
          member = await this.memberSource.getMember(plan.planId, plan.memberId);
        } catch (error) {
          logTodayFirestoreError('getMember (plans/{planId}/members/{memberId} read)', {
            planId: plan.planId,
            memberId: plan.memberId,
          }, error);
          throw error;
        }

        if (!member || member.status !== 'active') {
          return;
        }

        sourcePlanIds.push(plan.planId);

        const { canViewTodo, canViewTravelActivity } = resolveTodayAccessibleModules(member);

        const todoFetch = canViewTodo
          ? Promise.all([
              this.todoSource.getOverdueActiveTodos(plan.planId, {
                beforeAt: windows.todayStart,
                limitCount: MAX_ATTENTION_ITEMS,
              }),
              this.todoSource.getActiveTodosDueBetween(plan.planId, {
                startAt: windows.todayStart,
                endAt: windows.tomorrowStart,
                limitCount: MAX_TODAY_ITEMS,
              }),
              this.todoSource.getActiveTodosDueBetween(plan.planId, {
                startAt: windows.tomorrowStart,
                endAt: windows.upcomingEnd,
                limitCount: MAX_UPCOMING_ITEMS,
              }),
            ]).catch((error: unknown) => {
              logTodayFirestoreError(
                'Todo bounded queries (getOverdueActiveTodos/getActiveTodosDueBetween — requires the status+dueDate composite index)',
                { planId: plan.planId },
                error,
              );
              throw error;
            })
          : null;

        const activityFetch = canViewTravelActivity
          ? Promise.all([
              this.travelActivitySource.getActivitiesStartingBetween(plan.planId, {
                startAt: windows.todayStart,
                endAt: windows.tomorrowStart,
                limitCount: MAX_TODAY_ITEMS,
              }),
              this.travelActivitySource.getActivitiesStartingBetween(plan.planId, {
                startAt: windows.tomorrowStart,
                endAt: windows.upcomingEnd,
                limitCount: MAX_UPCOMING_ITEMS,
              }),
            ]).catch((error: unknown) => {
              logTodayFirestoreError('Travel Activity bounded queries (getActivitiesStartingBetween)', { planId: plan.planId }, error);
              throw error;
            })
          : null;

        const [todoResult, activityResult] = await Promise.all([todoFetch, activityFetch]);

        if (todoResult) {
          const [overdue, dueToday, dueUpcoming] = todoResult;

          overdueTodos.push(...toTodoSourceItems(plan, overdue));
          todayTodos.push(...toTodoSourceItems(plan, dueToday));
          upcomingTodos.push(...toTodoSourceItems(plan, dueUpcoming));
        }

        if (activityResult) {
          const [today, upcoming] = activityResult;

          todayActivities.push(...toActivitySourceItems(plan, today));
          upcomingActivities.push(...toActivitySourceItems(plan, upcoming));
        }
      }),
    );

    const summary = buildTodaySummary({
      userId,
      now: params.now,
      timezone: params.timezone,
      sourcePlanIds,
      overdueTodos,
      todayTodos,
      upcomingTodos,
      todayActivities,
      upcomingActivities,
    });

    try {
      await this.todaySummaryRepository.writeSummary(userId, summary);
    } catch (error) {
      logTodayFirestoreError('writeSummary (users/{userId}/todaySummary/current write)', { userId }, error);
      throw error;
    }

    return summary;
  }
}
