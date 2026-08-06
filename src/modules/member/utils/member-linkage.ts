type LinkedExpenseRef = {
  paidByMemberId: string;
  participants: { memberId: string }[];
};

type LinkedIncomeRef = {
  contributedByMemberId: string;
};

type LinkedSettlementRef = {
  fromMemberId: string;
  toMemberId: string;
};

export type MemberLinkedRecordsInput = {
  expenses: LinkedExpenseRef[];
  incomes: LinkedIncomeRef[];
  settlements: LinkedSettlementRef[];
};

export function buildLinkedMemberIdSet(input: MemberLinkedRecordsInput): Set<string> {
  const memberIds = new Set<string>();

  for (const expense of input.expenses) {
    memberIds.add(expense.paidByMemberId);
    for (const participant of expense.participants) {
      memberIds.add(participant.memberId);
    }
  }

  for (const income of input.incomes) {
    memberIds.add(income.contributedByMemberId);
  }

  for (const settlement of input.settlements) {
    memberIds.add(settlement.fromMemberId);
    memberIds.add(settlement.toMemberId);
  }

  return memberIds;
}
