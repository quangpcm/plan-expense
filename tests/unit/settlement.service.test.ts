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

function makeBalanceRow(memberId: string, adjustedBalance: number) {
  return {
    memberId,
    nickname: memberId,
    paid: 0,
    owed: 0,
    balance: 0,
    totalIncome: 0,
    incomeAllocatedToMember: 0,
    settlementPaid: 0,
    settlementReceived: 0,
    adjustedBalance,
  };
}

describe('SettlementService.suggest', () => {
  const service = new SettlementService(repositoryStub);

  it('greedily matches debtors and creditors using adjusted balance', () => {
    expect(
      service.suggest([
        makeBalanceRow('creditor-1', 500),
        makeBalanceRow('creditor-2', 200),
        makeBalanceRow('debtor-1', -300),
        makeBalanceRow('debtor-2', -400),
      ]),
    ).toEqual([
      { fromMemberId: 'debtor-1', toMemberId: 'creditor-1', amount: 300 },
      { fromMemberId: 'debtor-2', toMemberId: 'creditor-1', amount: 200 },
      { fromMemberId: 'debtor-2', toMemberId: 'creditor-2', amount: 200 },
    ]);
  });

  it('returns empty suggestions when balances are already settled', () => {
    expect(service.suggest([makeBalanceRow('member-1', 0)])).toEqual([]);
  });

  it('SETTLEMENT-ALLOC-02: reproduces the spec regression case once all fund income is allocated', () => {
    expect(
      service.suggest(
        [
          makeBalanceRow('qp', -578000),
          makeBalanceRow('minh', 3748750),
          makeBalanceRow('huong', -1216250),
          makeBalanceRow('la', -1954500),
        ].sort((a, b) => b.adjustedBalance - a.adjustedBalance),
      ),
    ).toEqual([
      { fromMemberId: 'qp', toMemberId: 'minh', amount: 578000 },
      { fromMemberId: 'huong', toMemberId: 'minh', amount: 1216250 },
      { fromMemberId: 'la', toMemberId: 'minh', amount: 1954500 },
    ]);
  });

  it('SETTLEMENT-ALLOC-04: returns no suggestions while any fund income remains unallocated', () => {
    expect(
      service.suggest([makeBalanceRow('creditor-1', 100), makeBalanceRow('debtor-1', -100)], 500),
    ).toEqual([]);
  });

  it('SETTLEMENT-ALLOC-05: does not require any executor — plain member-to-member shape', () => {
    const [suggestion] = service.suggest([makeBalanceRow('creditor-1', 100), makeBalanceRow('debtor-1', -100)]);
    expect(suggestion).toEqual({ fromMemberId: 'debtor-1', toMemberId: 'creditor-1', amount: 100 });
  });
});

describe('SettlementService.confirm', () => {
  const plan = {
    id: 'plan-1',
    status: 'active',
  } as unknown as Parameters<SettlementService['confirm']>[1]['plan'];

  const members = [
    { id: 'member-owner', status: 'active', role: 'owner', permissions: { moduleAccess: {} } },
    { id: 'member-a', status: 'active', role: 'editor', permissions: { moduleAccess: {} } },
    { id: 'member-b', status: 'active', role: 'editor', permissions: { moduleAccess: {} } },
  ] as unknown as Parameters<SettlementService['confirm']>[1]['members'];

  const currentMember = members[0]!;
  const currentUser = { uid: 'owner-user' } as Parameters<SettlementService['confirm']>[1]['currentUser'];

  function makeContext(overrides: Partial<Parameters<SettlementService['confirm']>[1]> = {}) {
    return {
      plan,
      members,
      currentMember,
      currentUser,
      ...overrides,
    };
  }

  it('confirms a member-to-member settlement', async () => {
    const service = new SettlementService(repositoryStub);

    await expect(
      service.confirm({ fromMemberId: 'member-b', toMemberId: 'member-a', amount: 100 }, makeContext()),
    ).resolves.toEqual({ settlementId: 'settlement-1' });
  });

  it('rejects a settlement between the same member', async () => {
    const service = new SettlementService(repositoryStub);

    await expect(
      service.confirm({ fromMemberId: 'member-a', toMemberId: 'member-a', amount: 100 }, makeContext()),
    ).rejects.toThrow();
  });

  it('rejects a settlement with a payer outside the plan', async () => {
    const service = new SettlementService(repositoryStub);

    await expect(
      service.confirm({ fromMemberId: 'member-ghost', toMemberId: 'member-a', amount: 100 }, makeContext()),
    ).rejects.toThrow();
  });

  it('rejects a non-positive amount', async () => {
    const service = new SettlementService(repositoryStub);

    await expect(
      service.confirm({ fromMemberId: 'member-b', toMemberId: 'member-a', amount: 0 }, makeContext()),
    ).rejects.toThrow();
  });
});
