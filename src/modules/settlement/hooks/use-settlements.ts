'use client';

import { useEffect, useState } from 'react';

import { settlementService } from '@/modules/settlement/services';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

export function useSettlements(planId: string) {
  const [settlements, setSettlements] = useState<SettlementDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return settlementService.watchSettlements(
      planId,
      (items) => {
        setSettlements(items);
        setErrorMessage(null);
      },
      (error) => {
        setSettlements([]);
        setErrorMessage(error.message);
      },
    );
  }, [planId]);

  return {
    settlements,
    errorMessage,
  };
}
