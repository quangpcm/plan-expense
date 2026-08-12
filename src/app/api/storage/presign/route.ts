import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/config/firebase-admin.config';
import { getR2BucketName, getR2Client } from '@/config/r2.config';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { RequestUploadUrlInput } from '@/modules/storage/types/storage';
import { getMediaPublicUrl } from '@/modules/storage/utils/public-url';
import { buildStoragePath } from '@/modules/storage/utils/storage-path';
import { validateMediaUpload } from '@/modules/storage/utils/validate-media';
import { AppError } from '@/shared/errors/app-error';

export const runtime = 'nodejs';

const baseSchema = {
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
};

const requestSchema = z.discriminatedUnion('mediaType', [
  z.object({ mediaType: z.literal('avatar'), userId: z.string().min(1), ...baseSchema }),
  z.object({ mediaType: z.literal('plan-cover'), planId: z.string().min(1), ...baseSchema }),
  z.object({
    mediaType: z.literal('expense-attachment'),
    planId: z.string().min(1),
    expenseId: z.string().min(1),
    ...baseSchema,
  }),
  z.object({
    mediaType: z.literal('income-attachment'),
    planId: z.string().min(1),
    incomeId: z.string().min(1),
    ...baseSchema,
  }),
  z.object({
    mediaType: z.literal('settlement-attachment'),
    planId: z.string().min(1),
    settlementId: z.string().min(1),
    ...baseSchema,
  }),
]);

async function resolveActiveMember(planId: string, uid: string): Promise<PlanMemberDocument> {
  const db = getAdminFirestore();
  const userPlanSnapshot = await db.doc(`userPlans/${uid}/plans/${planId}`).get();
  const userPlan = userPlanSnapshot.data() as { memberId?: string; memberStatus?: string } | undefined;

  if (!userPlanSnapshot.exists || !userPlan?.memberId || userPlan.memberStatus !== 'active') {
    throw new AppError('You do not have access to this plan.', 'STORAGE_PLAN_ACCESS_DENIED', 403);
  }

  const memberSnapshot = await db.doc(`plans/${planId}/members/${userPlan.memberId}`).get();

  if (!memberSnapshot.exists) {
    throw new AppError('Plan membership not found.', 'STORAGE_MEMBER_NOT_FOUND', 403);
  }

  return memberSnapshot.data() as PlanMemberDocument;
}

async function resolvePlan(planId: string): Promise<PlanDocument> {
  const snapshot = await getAdminFirestore().doc(`plans/${planId}`).get();

  if (!snapshot.exists) {
    throw new AppError('Plan not found.', 'STORAGE_PLAN_NOT_FOUND', 404);
  }

  return snapshot.data() as PlanDocument;
}

async function assertPermission(input: RequestUploadUrlInput, uid: string): Promise<void> {
  if (input.mediaType === 'avatar') {
    if (input.userId !== uid) {
      throw new AppError('You can only upload your own avatar.', 'STORAGE_PERMISSION_DENIED', 403);
    }
    return;
  }

  const member = await resolveActiveMember(input.planId, uid);
  const permissions = resolvePlanPermissions(member);

  if (input.mediaType === 'plan-cover') {
    if (!permissions.canManagePlan) {
      throw new AppError('Only the plan owner can update the cover image.', 'STORAGE_PERMISSION_DENIED', 403);
    }
    return;
  }

  const plan = await resolvePlan(input.planId);

  if (plan.status === 'closed') {
    throw new AppError('This plan is closed and cannot be edited.', 'PLAN_CLOSED', 400);
  }

  if (input.mediaType === 'expense-attachment' && !permissions.canCreateExpense) {
    throw new AppError('You do not have permission to add expense attachments.', 'STORAGE_PERMISSION_DENIED', 403);
  }

  if (input.mediaType === 'income-attachment' && !permissions.canCreateIncome) {
    throw new AppError('You do not have permission to add income attachments.', 'STORAGE_PERMISSION_DENIED', 403);
  }

  if (input.mediaType === 'settlement-attachment' && !permissions.canManageSettlements) {
    throw new AppError('You do not have permission to add settlement attachments.', 'STORAGE_PERMISSION_DENIED', 403);
  }
}

function respondWithError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }

  console.error('POST /api/storage/presign failed', error);

  return NextResponse.json(
    { error: { code: 'STORAGE_PRESIGN_FAILED', message: 'Failed to create upload URL.' } },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') ?? '';
    const idToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;

    if (!idToken) {
      throw new AppError('Missing authentication token.', 'STORAGE_UNAUTHENTICATED', 401);
    }

    const decodedToken = await getAdminAuth()
      .verifyIdToken(idToken)
      .catch(() => {
        throw new AppError('Invalid authentication token.', 'STORAGE_UNAUTHENTICATED', 401);
      });

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError('Invalid upload request.', 'STORAGE_INVALID_REQUEST', 400);
    }

    const input = parsed.data as RequestUploadUrlInput;

    validateMediaUpload(input.contentType, input.size);
    await assertPermission(input, decodedToken.uid);

    const fileId = crypto.randomUUID();
    const storagePath = buildStoragePath(input, fileId);

    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({ Bucket: getR2BucketName(), Key: storagePath, ContentType: input.contentType }),
      { expiresIn: 300 },
    );

    return NextResponse.json({ storagePath, uploadUrl, publicUrl: getMediaPublicUrl(storagePath) });
  } catch (error) {
    return respondWithError(error);
  }
}
