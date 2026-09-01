'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Check, Copy, UserPlus2, UserRoundPlus } from 'lucide-react';
import { ZodError } from 'zod';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { invitationService } from '@/modules/invitation/services';
import { createInvitationSchema, type CreateInvitationSchema } from '@/modules/invitation/schemas/create-invitation.schema';
import { memberService } from '@/modules/member/services';
import { PLAN_ROLE_LABEL } from '@/modules/member/constants/role-labels';
import { addGuestSchema, type AddGuestSchema } from '@/modules/member/schemas/add-guest.schema';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Collapsible } from '@/shared/components/ui/collapsible';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';

type MemberManagementPanelProps = {
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
};

export function MemberManagementPanel({
  plan,
  currentMember,
}: MemberManagementPanelProps) {
  const { user } = useAuthSession();
  const [guestMessage, setGuestMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
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
  const guestRole = guestForm.watch('role');
  const inviteRole = inviteForm.watch('role');

  const submitGuest = guestForm.handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setGuestError(null);
    setGuestMessage(null);
    setIsGuestSubmitting(true);

    try {
      const parsed = addGuestSchema.parse(values);
      await memberService.addGuest(plan.id, parsed, user, currentMember);
      guestForm.reset({ nickname: '', role: 'editor' });
      setGuestMessage('Đã thêm thành viên vào kế hoạch.');
    } catch (error) {
      if (error instanceof ZodError) {
        setGuestError(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin thành viên.');
      } else if (error instanceof Error) {
        setGuestError(error.message);
      } else {
        setGuestError('Hiện chưa thể thêm thành viên.');
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
    setInviteLink(null);
    setIsLinkCopied(false);
    setIsInviteSubmitting(true);

    try {
      const parsed = createInvitationSchema.parse(values);
      const result = await invitationService.createInvitation(
        plan,
        { email: parsed.email || null, role: parsed.role },
        user,
        currentMember,
      );
      inviteForm.reset({ email: '', role: 'viewer' });
      setInviteLink(`${window.location.origin}/invite/${plan.id}/${result.invitationId}`);
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

  async function handleCopyLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setIsLinkCopied(true);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <Collapsible
          title="Thêm thành viên"
          description="Tạo thành viên chưa có tài khoản."
          icon={<UserRoundPlus className="size-5" />}
        >
          <form className="space-y-4" onSubmit={submitGuest}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="guest-nickname">
                Tên hiển thị
              </label>
              <Input id="guest-nickname" placeholder="Ví dụ: Nhà Trai, Mẹ, Anh Minh" {...guestForm.register('nickname')} />
            </div>
            <input type="hidden" {...guestForm.register('role')} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Vai trò</label>
              <DropdownSelect
                onValueChange={(value) => guestForm.setValue('role', value as AddGuestSchema['role'], { shouldDirty: true, shouldValidate: true })}
                options={[
                  { value: 'editor', label: PLAN_ROLE_LABEL.editor },
                  { value: 'viewer', label: PLAN_ROLE_LABEL.viewer },
                ]}
                value={guestRole}
              />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Thành viên có thể được chọn trong các khoản thu, chi và chia sẻ chi phí.
            </p>
            {guestError ? <AuthFormMessage message={guestError} type="error" /> : null}
            {guestMessage ? <AuthFormMessage message={guestMessage} type="success" /> : null}
            <Button className="w-full" disabled={isGuestSubmitting} type="submit">
              <UserRoundPlus className="size-4" />
              {isGuestSubmitting ? 'Đang thêm thành viên...' : 'Thêm thành viên'}
            </Button>
          </form>
        </Collapsible>
      </Card>

      <Card>
        <Collapsible
          title="Mời thành viên"
          description="Mời người khác tham gia bằng email hoặc liên kết."
          icon={<UserPlus2 className="size-5" />}
        >
          <form className="space-y-4" onSubmit={submitInvitation}>
            <Input placeholder="member@example.com (tùy chọn)" {...inviteForm.register('email')} />
            <input type="hidden" {...inviteForm.register('role')} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Vai trò</label>
              <DropdownSelect
                onValueChange={(value) => inviteForm.setValue('role', value as CreateInvitationSchema['role'], { shouldDirty: true, shouldValidate: true })}
                options={[
                  { value: 'viewer', label: PLAN_ROLE_LABEL.viewer },
                  { value: 'editor', label: PLAN_ROLE_LABEL.editor },
                ]}
                value={inviteRole}
              />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Nếu không nhập email, liên kết mời có thể được chia sẻ với bất kỳ ai.
            </p>
            {inviteError ? <AuthFormMessage message={inviteError} type="error" /> : null}
            {inviteLink ? (
              <div className="space-y-2">
                <AuthFormMessage message="Đã tạo lời mời. Gửi link này cho người bạn muốn mời." type="success" />
                <div className="flex gap-2">
                  <Input className="flex-1" readOnly value={inviteLink} />
                  <Button onClick={handleCopyLink} type="button" variant="secondary">
                    {isLinkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            ) : null}
            <Button className="w-full" disabled={isInviteSubmitting} type="submit" variant="secondary">
              <UserPlus2 className="size-4" />
              {isInviteSubmitting ? 'Đang tạo lời mời...' : 'Tạo lời mời'}
            </Button>
          </form>
        </Collapsible>
      </Card>
    </div>
  );
}
