import type { Timestamp } from 'firebase/firestore';

import type { PlanMemberStatus, PlanRole } from '@/modules/member/types/member';

export type PlanStatus = 'active' | 'closed' | 'archived';

export type PlanType =
  | 'travel'
  | 'wedding'
  | 'saving'
  | 'birthday'
  | 'event'
  | 'shared_living'
  | 'general';

export type CurrencyCode = 'VND';

export type PlanDocument = {
  id: string;
  name: string;
  description: string | null;
  planType: PlanType;
  ownerUserId: string;
  ownerMemberId: string;
  currency: CurrencyCode;
  timezone: string;
  coverImageUrl: string | null;
  coverImageStoragePath: string | null;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  status: PlanStatus;
  memberCount: number;
  expenseCount: number;
  incomeCount: number;
  settlementCount: number;
  totalExpense: number;
  totalIncome: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt: Timestamp | null;
  archivedAt: Timestamp | null;
};

export type UserPlanDocument = {
  id: string;
  planId: string;
  userId: string;
  planName: string;
  planType: PlanType;
  role: PlanRole;
  memberId: string;
  memberStatus: PlanMemberStatus;
  planStatus: PlanStatus;
  coverImageUrl: string | null;
  joinedAt: Timestamp | null;
  lastActivityAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreatePlanInput = {
  name: string;
  description?: string | undefined;
  planType: PlanType;
  startDate?: string | undefined;
  endDate?: string | undefined;
};

export type PlanSummary = {
  id: string;
  planId: string;
  planName: string;
  planType: PlanType;
  role: PlanRole;
  memberStatus: PlanMemberStatus;
  planStatus: PlanStatus;
  coverImageUrl: string | null;
  joinedAt: Timestamp | null;
  lastActivityAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
