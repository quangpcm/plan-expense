import type { RefinementCtx } from 'zod';

type PaymentSourceInput = {
  paymentSourceType: 'member' | 'fund';
  paidByMemberId?: string | undefined;
};

export function validatePaymentSource(value: PaymentSourceInput, ctx: RefinementCtx) {
  if (value.paymentSourceType === 'member' && !value.paidByMemberId) {
    ctx.addIssue({
      code: 'custom',
      path: ['paidByMemberId'],
      message: 'Vui lòng chọn người chi trả.',
    });
  }
}
