'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { AuthShell } from '@/modules/auth/components/auth-shell';
import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from '@/modules/auth/schemas/forgot-password.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { appRoutes } from '@/shared/constants';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuthActions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<ForgotPasswordSchema>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsed = forgotPasswordSchema.parse(values);
      await sendPasswordReset(parsed);
      setSuccessMessage('Đã gửi email đặt lại mật khẩu.');
      reset();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể gửi email đặt lại mật khẩu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Chúng tôi sẽ gửi cho bạn một liên kết để lấy lại quyền truy cập tài khoản."
      footer={
        <>
          Đã nhớ mật khẩu?{' '}
          <Link className="font-semibold text-[var(--color-text-link)]" href={appRoutes.login}>
            Quay lại đăng nhập
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-primary)]" htmlFor="email">
            Email
          </label>
          <Input id="email" placeholder="ban@example.com" {...register('email')} />
        </div>
        {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
        {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          <Mail className="size-4" />
          {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
        </Button>
      </form>
    </AuthShell>
  );
}
