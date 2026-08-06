'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus2, UserRoundPlus } from 'lucide-react';
import { ZodError } from 'zod';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { invitationService } from '@/modules/invitation/services';
import { createInvitationSchema, type CreateInvitationSchema } from '@/modules/invitation/schemas/create-invitation.schema';
import { memberService } from '@/modules/member/services';
import { addGuestSchema, type AddGuestSchema } from '@/modules/member/schemas/add-guest.schema';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Collapsible } from '@/shared/components/ui/collapsible';
import { Input } from '@/shared/components/ui/input';

type MemberManagementPanelProps = {
  planId: string;
  currentMember: PlanMemberDocument | null;
};

export function MemberManagementPanel({
  planId,
  currentMember,
}: MemberManagementPanelProps) {
  const { user } = useAuthSession();
  const [guestMessage, setGuestMessage] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);
  const guestForm = useForm<AddGuestSchema>({
    defaultValues: {
      nickname: '',
      role: 'editor',
    },
  });
  const inviteForm = useForm<CreateInvitationSchema>({
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  });

  const submitGuest = guestForm.handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setGuestError(null);
    setGuestMessage(null);
    setIsGuestSubmitting(true);

    try {
      const parsed = addGuestSchema.parse(values);
      await memberService.addGuest(planId, parsed, user, currentMember);
      guestForm.reset({ nickname: '', role: 'editor' });
      setGuestMessage('Đã thêm khách vào kế hoạch.');
    } catch (error) {
      if (error instanceof ZodError) {
        setGuestError(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin khách.');
      } else if (error instanceof Error) {
        setGuestError(error.message);
      } else {
        setGuestError('Hiện chưa thể thêm khách.');
      }
    } finally {
      setIsGuestSubmitting(false);
    }
  });

  const submitInvitation = inviteForm.handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setInviteError(null);
    setInviteMessage(null);
    setIsInviteSubmitting(true);

    try {
      const parsed = createInvitationSchema.parse(values);
      await invitationService.createInvitation(planId, parsed, user, currentMember);
      inviteForm.reset({ email: '', role: 'viewer' });
      setInviteMessage('Đã tạo lời mời.');
    } catch (error) {
      if (error instanceof ZodError) {
        setInviteError(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin lời mời.');
      } else if (error instanceof Error) {
        setInviteError(error.message);
      } else {
        setInviteError('Hiện chưa thể tạo lời mời.');
      }
    } finally {
      setIsInviteSubmitting(false);
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <Collapsible
          title="Thêm khách"
          description="Khách chỉ cần biệt danh và chỉ tồn tại trong kế hoạch này."
          icon={<UserRoundPlus className="size-5" />}
        >
          <form className="space-y-4" onSubmit={submitGuest}>
            <Input placeholder="Biệt danh của khách" {...guestForm.register('nickname')} />
            <select
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              {...guestForm.register('role')}
            >
              <option value="editor">Biên tập</option>
              <option value="viewer">Chỉ xem</option>
            </select>
            {guestError ? <AuthFormMessage message={guestError} type="error" /> : null}
            {guestMessage ? <AuthFormMessage message={guestMessage} type="success" /> : null}
            <Button className="w-full" disabled={isGuestSubmitting} type="submit">
              <UserRoundPlus className="size-4" />
              {isGuestSubmitting ? 'Đang thêm khách...' : 'Thêm khách'}
            </Button>
          </form>
        </Collapsible>
      </Card>

      <Card>
        <Collapsible
          title="Mời bằng email"
          description="Tạo bản ghi lời mời đang chờ cho người dùng đã đăng ký."
          icon={<UserPlus2 className="size-5" />}
        >
          <form className="space-y-4" onSubmit={submitInvitation}>
            <Input placeholder="member@example.com" {...inviteForm.register('email')} />
            <select
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              {...inviteForm.register('role')}
            >
              <option value="viewer">Chỉ xem</option>
              <option value="editor">Biên tập</option>
            </select>
            {inviteError ? <AuthFormMessage message={inviteError} type="error" /> : null}
            {inviteMessage ? <AuthFormMessage message={inviteMessage} type="success" /> : null}
            <Button className="w-full" disabled={isInviteSubmitting} type="submit" variant="secondary">
              <UserPlus2 className="size-4" />
              {isInviteSubmitting ? 'Đang tạo lời mời...' : 'Mời qua email'}
            </Button>
          </form>
        </Collapsible>
      </Card>
    </div>
  );
}
