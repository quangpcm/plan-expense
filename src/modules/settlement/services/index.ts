import { FirestoreSettlementRepository } from '@/modules/settlement/repositories/firestore-settlement.repository';
import { SettlementService } from '@/modules/settlement/services/settlement.service';

const settlementRepository = new FirestoreSettlementRepository();

export const settlementService = new SettlementService(settlementRepository);
