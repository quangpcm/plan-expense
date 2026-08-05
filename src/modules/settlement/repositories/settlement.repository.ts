import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type {
  ConfirmSettlementInput,
  SettlementDocument,
} from '@/modules/settlement/types/settlement';

export type CreateSettlementPersistenceInput = ConfirmSettlementInput & {
  planId: string;
  settledAt: Date;
  createdByUser: AuthUser;
  createdByMember: PlanMemberDocument;
};

export interface SettlementRepository {
  createSettlement(input: CreateSettlementPersistenceInput): Promise<{ settlementId: string }>;
  cancelSettlement(planId: string, settlementId: string, actor: AuthUser): Promise<void>;
  watchSettlements(
    planId: string,
    callback: (settlements: SettlementDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
