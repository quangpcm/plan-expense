import { describe, expect, it } from 'vitest';

import { SettlementService } from '@/modules/settlement/services/settlement.service';
import type { SettlementRepository } from '@/modules/settlement/repositories/settlement.repository';

const repositoryStub: SettlementRepository = {
  async createSettlement() {
    return { settlementId: 'settlement-1' };
  },
  async cancelSettlement() {},
  watchSettlements() {
    return () => {};
  },
};

describe('SettlementService.suggest', () => {
  const service = new SettlementService(repositoryStub);

  it('greedily matches debtors and creditors using adjusted balance', () => {
    expect(
      service.suggest([
        {
          memberId: 'creditor-1',
          nickname: 'A',
          paid: 0,
          owed: 0,
          balance: 0,
          totalIncome: 0,
          settlementPaid: 0,
          settlementReceived: 0,
          adjustedBalance: 500,
        },
        {
          memberId: 'creditor-2',
          nickname: 'B',
          paid: 0,
          owed: 0,
          balance: 0,
          totalIncome: 0,
          settlementPaid: 0,
          settlementReceived: 0,
          adjustedBalance: 200,
        },
        {
          memberId: 'debtor-1',
          nickname: 'C',
          paid: 0,
          owed: 0,
          balance: 0,
          totalIncome: 0,
          settlementPaid: 0,
          settlementReceived: 0,
          adjustedBalance: -300,
        },
        {
          memberId: 'debtor-2',
          nickname: 'D',
          paid: 0,
          owed: 0,
          balance: 0,
          totalIncome: 0,
          settlementPaid: 0,
          settlementReceived: 0,
          adjustedBalance: -400,
        },
      ]),
    ).toEqual([
      { fromMemberId: 'debtor-1', toMemberId: 'creditor-1', amount: 300 },
      { fromMemberId: 'debtor-2', toMemberId: 'creditor-1', amount: 200 },
      { fromMemberId: 'debtor-2', toMemberId: 'creditor-2', amount: 200 },
    ]);
  });

  it('returns empty suggestions when balances are already settled', () => {
    expect(
      service.suggest([
        {
          memberId: 'member-1',
          nickname: 'A',
          paid: 0,
          owed: 0,
          balance: 0,
          totalIncome: 0,
          settlementPaid: 0,
          settlementReceived: 0,
          adjustedBalance: 0,
        },
      ]),
    ).toEqual([]);
  });
});
