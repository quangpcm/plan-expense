import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { TravelActivityRepository } from '@/modules/travel-activity/repositories/travel-activity.repository';
import type {
  CreateTravelActivityInput,
  UpdateTravelActivityInput,
} from '@/modules/travel-activity/types/travel-activity';
import { AppError } from '@/shared/errors/app-error';

export class TravelActivityService {
  constructor(private readonly travelActivityRepository: TravelActivityRepository) {}

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  private assertCanManageActivities(currentMember: PlanMemberDocument | null) {
    if (currentMember?.role !== 'owner' && currentMember?.role !== 'editor') {
      throw new AppError('Only owners or editors can manage itinerary activities.', 'TRAVEL_ACTIVITY_FORBIDDEN', 403);
    }
  }

  private assertValidInput(input: CreateTravelActivityInput | UpdateTravelActivityInput) {
    if (!input.title.trim()) {
      throw new AppError('Activity title is required.', 'TRAVEL_ACTIVITY_TITLE_REQUIRED', 400);
    }

    if (!input.startsAt) {
      throw new AppError('Activity start time is required.', 'TRAVEL_ACTIVITY_START_REQUIRED', 400);
    }

    if (input.endsAt && new Date(input.endsAt).getTime() < new Date(input.startsAt).getTime()) {
      throw new AppError('End time must be after the start time.', 'TRAVEL_ACTIVITY_INVALID_RANGE', 400);
    }
  }

  async createActivity(
    plan: PlanDocument,
    input: CreateTravelActivityInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanManageActivities(currentMember);
    this.assertValidInput(input);

    return this.travelActivityRepository.createActivity({
      ...input,
      planId: plan.id,
      activityId: this.travelActivityRepository.generateActivityId(plan.id),
      createdByUserId: currentUser.uid,
      createdByMemberId: currentMember!.id,
    });
  }

  async updateActivity(
    plan: PlanDocument,
    input: UpdateTravelActivityInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    void currentUser;
    this.assertEditablePlan(plan);
    this.assertCanManageActivities(currentMember);
    this.assertValidInput(input);

    await this.travelActivityRepository.updateActivity(plan.id, input);
  }

  async deleteActivity(
    plan: PlanDocument,
    activityId: string,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    void currentUser;
    this.assertEditablePlan(plan);
    this.assertCanManageActivities(currentMember);

    await this.travelActivityRepository.deleteActivity(plan.id, activityId);
  }

  watchActivities(
    planId: string,
    callback: Parameters<TravelActivityRepository['watchActivities']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.travelActivityRepository.watchActivities(planId, callback, onError);
  }
}
