'use client';

import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  CreateSettlementPersistenceInput,
  SettlementRepository,
} from '@/modules/settlement/repositories/settlement.repository';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

export class FirestoreSettlementRepository implements SettlementRepository {
  async createSettlement(input: CreateSettlementPersistenceInput) {
    const db = getFirebaseFirestore();
    const settlementRef = doc(collection(db, 'plans', input.planId, 'settlements'));
    const planRef = doc(db, 'plans', input.planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(settlementRef, {
        id: settlementRef.id,
        planId: input.planId,
        fromMemberId: input.fromMemberId,
        toMemberId: input.toMemberId,
        amount: input.amount,
        currency: 'VND',
        note: input.note?.trim() || null,
        attachments: [],
        settledAt: Timestamp.fromDate(input.settledAt),
        status: 'completed',
        createdByUserId: input.createdByUser.uid,
        createdByMemberId: input.createdByMember.id,
        createdAt: now,
        updatedAt: now,
        cancelledAt: null,
        cancelledByUserId: null,
        version: 1,
      });

      transaction.update(planRef, {
        settlementCount: increment(1),
        updatedAt: now,
      });
    });

    return { settlementId: settlementRef.id };
  }

  async cancelSettlement(planId: string, settlementId: string, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const settlementRef = doc(db, 'plans', planId, 'settlements', settlementId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const settlementSnapshot = await transaction.get(settlementRef);

      if (!settlementSnapshot.exists()) {
        return;
      }

      const settlement = settlementSnapshot.data() as SettlementDocument;

      if (settlement.status === 'cancelled') {
        return;
      }

      transaction.update(settlementRef, {
        status: 'cancelled',
        cancelledAt: now,
        cancelledByUserId: actor.uid,
        updatedAt: now,
        version: settlement.version + 1,
      });

      transaction.update(planRef, {
        settlementCount: increment(-1),
        updatedAt: now,
      });
    });
  }

  watchSettlements(planId: string, callback: (settlements: SettlementDocument[]) => void) {
    const settlementsQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'settlements'),
      orderBy('settledAt', 'desc'),
    );

    return onSnapshot(settlementsQuery, (snapshot) => {
      callback(snapshot.docs.map((item) => item.data() as SettlementDocument));
    });
  }
}
