'use client';

import { useEffect, useState } from 'react';

import { settlementService } from '@/modules/settlement/services';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

export function useSettlements(planId: string) {
  const [settlements, setSettlements] = useState<SettlementDocument[]>([]);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return settlementService.watchSettlements(planId, setSettlements);
  }, [planId]);

  return {
    settlements,
  };
}
