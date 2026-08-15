import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/config/firebase-admin.config';
import { getR2BucketName, getR2Client } from '@/config/r2.config';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AppError } from '@/shared/errors/app-error';

export const runtime = 'nodejs';

const requestSchema = z.object({
  planId: z.string().min(1),
  storagePaths: z.array(z.string().min(1)).min(1),
});

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

function respondWithError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }

  console.error('POST /api/storage/delete failed', error);

  return NextResponse.json(
    { error: { code: 'STORAGE_DELETE_FAILED', message: 'Failed to delete storage objects.' } },
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
      throw new AppError('Invalid delete request.', 'STORAGE_INVALID_REQUEST', 400);
    }

    const { planId, storagePaths } = parsed.data;

    const member = await resolveActiveMember(planId, decodedToken.uid);
    const permissions = resolvePlanPermissions(member);

    if (!permissions.canManagePlan) {
      throw new AppError('Only the plan owner can delete storage objects.', 'STORAGE_PERMISSION_DENIED', 403);
    }

    const allowedPrefix = `plans/${planId}/`;
    const keysToDelete = storagePaths.filter((path) => path.startsWith(allowedPrefix));

    if (keysToDelete.length === 0) {
      return NextResponse.json({ deleted: [] });
    }

    await getR2Client().send(
      new DeleteObjectsCommand({
        Bucket: getR2BucketName(),
        Delete: { Objects: keysToDelete.map((Key) => ({ Key })) },
      }),
    );

    return NextResponse.json({ deleted: keysToDelete });
  } catch (error) {
    return respondWithError(error);
  }
}
