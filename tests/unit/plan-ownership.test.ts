import { describe, expect, it } from 'vitest';

import { planModuleRegistry } from '@/modules/plan/constants/plan-module-registry';
import { supportedModularPlanTypes } from '@/modules/plan/constants/plan-type-config';
import { getPlanModuleDefinitions, getPlanOwnedCollectionPaths } from '@/modules/plan/utils/plan-type-config';

describe('plan ownership metadata', () => {
  it('includes all enabled module collections in owned collection paths', () => {
    for (const planType of supportedModularPlanTypes) {
      const ownedCollectionPaths = getPlanOwnedCollectionPaths(planType);
      const moduleDefinitions = getPlanModuleDefinitions(planType);

      expect(ownedCollectionPaths).toContain('members');
      expect(ownedCollectionPaths).toContain('invitations');

      for (const moduleDefinition of moduleDefinitions) {
        for (const collectionDefinition of moduleDefinition.collections ?? []) {
          expect(ownedCollectionPaths).toContain(collectionDefinition.path);
        }
      }
    }
  });

  it('keeps registry-backed debt cleanup collections visible to deletePlan', () => {
    // docs/debt-plan-specs.md (native_debt): debtTracking owns the flat
    // debtTransactions ledger; expenses/incomes/settlements stay owned by the
    // finance module (still enabled for legacy finance_aggregate debt plans).
    expect(planModuleRegistry.debtTracking.collections).toEqual([{ path: 'debtTransactions' }]);
    expect(getPlanOwnedCollectionPaths('debt')).toEqual(
      expect.arrayContaining(['members', 'invitations', 'expenses', 'incomes', 'settlements', 'debtTransactions']),
    );
  });
});
