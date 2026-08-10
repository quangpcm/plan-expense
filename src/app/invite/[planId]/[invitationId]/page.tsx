'use client';

import { useParams, useRouter } from 'next/navigation';
import { startTransition, useEffect, useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { AuthShell } from '@/modules/auth/components/auth-shell';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { invitationService } from '@/modules/invitation/services';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';
import { planTypeIcons } from '@/modules/plan/constants/plan.constants';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { appRoutes } from '@/shared/constants';

const ROLE_LABEL = {
  editor: 'Biên tập (thêm/sửa khoản chi)',
  viewer: 'Chỉ xem',
} as const;

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams<{ planId: string; invitationId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const invitationId = Array.isArray(params.invitationId) ? params.invitationId[0] : params.invitationId;
  const { status, user } = useAuthSession();
  const [invitation, setInvitation] = useState<InvitationDocument | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!planId || !invitationId) {
      return;
    }

    invitationService
      .getInvitation(planId, invitationId)
      .then((result) => {
        setInvitation(result);
        setIsExpired(Boolean(result && result.expiresAt.toMillis() < Date.now()));
      })
      .catch(() => setLoadError('Hiện chưa thể tải lời mời này.'))
      .finally(() => setIsLoading(false));
  }, [planId, invitationId]);

  async function handleAccept() {
    if (!user || !planId || !invitationId) {
      return;
    }

    setIsAccepting(true);
    setAcceptError(null);

    try {
      await invitationService.acceptInvitation(planId, invitationId, user);
      startTransition(() => {
        router.replace(`/plans/${planId}`);
      });
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : 'Hiện chưa thể tham gia kế hoạch này.');
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading || status === 'idle' || status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <Skeleton className="h-64 rounded-[32px]" />
      </main>
    );
  }

  if (loadError || !invitation) {
    return (
      <AuthShell
        description="Đường link này không còn hợp lệ. Hãy liên hệ người đã gửi lời mời để xin link mới."
        footer={null}
        title="Không tìm thấy lời mời"
      >
        <div />
      </AuthShell>
    );
  }

  if (invitation.status !== 'pending' || isExpired) {
    const statusText = isExpired
      ? 'đã hết hạn'
      : invitation.status === 'accepted'
        ? 'đã được chấp nhận trước đó'
        : invitation.status === 'revoked'
          ? 'đã bị hủy'
          : 'không còn hợp lệ';

    return (
      <AuthShell
        description={`Lời mời tham gia "${invitation.planName}" ${statusText}. Hãy liên hệ chủ kế hoạch để xin lời mời mới.`}
        footer={null}
        title="Lời mời không còn hợp lệ"
      >
        <div />
      </AuthShell>
    );
  }

  const PlanIcon = planTypeIcons[invitation.planType];
  const emailMismatch = Boolean(
    invitation.email && user && invitation.email !== user.email?.toLowerCase(),
  );
  const returnPath = `/invite/${planId}/${invitationId}`;

  return (
    <AuthShell
      description={
        invitation.email
          ? `Chỉ tài khoản ${invitation.email} mới có thể chấp nhận lời mời này.`
          : 'Ai có link này đều có thể tham gia với vai trò được mời.'
      }
      footer={null}
      title="Bạn được mời tham gia kế hoạch"
    >
      <div className="flex items-center gap-3 rounded-[24px] bg-slate-50 p-4">
        <PlanIcon className="size-6 text-slate-600" />
        <div>
          <p className="font-semibold text-slate-950">{invitation.planName}</p>
          <p className="text-sm text-slate-600">Vai trò: {ROLE_LABEL[invitation.role]}</p>
        </div>
      </div>

      {status === 'unauthenticated' ? (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            className="w-full"
            href={`${appRoutes.login}?next=${encodeURIComponent(returnPath)}`}
          >
            Đăng nhập để tiếp tục
          </Button>
          <Button
            className="w-full"
            href={`${appRoutes.register}?next=${encodeURIComponent(returnPath)}`}
            variant="secondary"
          >
            Đăng ký để tiếp tục
          </Button>
        </div>
      ) : emailMismatch ? (
        <div className="mt-4">
          <AuthFormMessage
            message={`Lời mời này chỉ dành cho ${invitation.email}. Bạn đang đăng nhập bằng ${user?.email || 'một tài khoản khác'}.`}
            type="error"
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {acceptError ? <AuthFormMessage message={acceptError} type="error" /> : null}
          <Button className="w-full" disabled={isAccepting} onClick={handleAccept}>
            {isAccepting ? (
              'Đang tham gia...'
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Tham gia kế hoạch
              </>
            )}
          </Button>
        </div>
      )}

      {status === 'unauthenticated' ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <UserPlus className="size-3.5" />
          Đăng nhập/đăng ký xong sẽ tự quay lại trang này.
        </p>
      ) : null}
    </AuthShell>
  );
}
