import { z } from 'zod';

import { weddingGuestIdentitySchema } from '@/modules/wedding-guest/schemas/wedding-guest-identity.schema';

export const createWeddingGuestSchema = weddingGuestIdentitySchema.extend({
  groupId: z.string().min(1),
  rsvp: z.enum(['pending', 'attending', 'not_attending']).default('pending'),
  attendeeCount: z.coerce.number().int().nonnegative().default(1),
  moneyGiftAmount: z.coerce.number().int().nonnegative().optional(),
  goldGiftAmount: z.coerce.number().int().nonnegative().optional(),
  goldGiftNote: z.string().trim().max(500).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  transportArrangement: z
    .enum(['undecided', 'self_arranged', 'bride_side', 'groom_side'])
    .default('undecided'),
});

export type CreateWeddingGuestSchema = z.infer<typeof createWeddingGuestSchema>;
