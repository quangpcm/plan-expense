import { z } from 'zod';

export const weddingGuestIdentitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  sideId: z.enum(['bride_family', 'groom_family', 'shared']),
  relationshipId: z.enum([
    'family',
    'friend',
    'colleague',
    'neighbor',
    'partner_client',
    'other',
  ]),
  invitedById: z.enum([
    'bride',
    'groom',
    'bride_parents',
    'groom_parents',
    'shared',
  ]),
});

export type WeddingGuestIdentitySchema = z.infer<
  typeof weddingGuestIdentitySchema
>;
