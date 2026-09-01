'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useState } from 'react';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { AuthShell } from '@/modules/auth/components/auth-shell';
import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { loginSchema, type LoginSchema } from '@/modules/auth/schemas/login.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { appRoutes } from '@/shared/constants';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuthActions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, handleSubmit } = useForm<LoginSchema>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const navigateAfterAuth = () => {
    const next = searchParams.get('next') || appRoutes.plans;
    startTransition(() => {
      router.replace(next);
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsed = loginSchema.parse(values);
      await login(parsed);
      setSuccessMessage('Đăng nhập thành công.');
      navigateAfterAuth();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      await loginWithGoogle();
      navigateAfterAuth();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể tiếp tục với Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      title="Chào mừng bạn quay lại"
      description="Đăng nhập để tiếp tục quản lý kế hoạch, thành viên và các khoản chi chung."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link className="font-semibold text-[var(--color-text-link)]" href={appRoutes.register}>
            Tạo tài khoản
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-primary)]" htmlFor="password">
            Mật khẩu
          </label>
          <Input id="password" type="password" placeholder="Tối thiểu 6 ký tự" {...register('password')} />
        </div>
        {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
        {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}
        <div className="space-y-3">
          <Button className="w-full" disabled={isSubmitting} type="submit">
            <LogIn className="size-4" />
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <Button
            className="w-full"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            type="button"
            variant="secondary"
          >
            {isGoogleLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
          </Button>
        </div>
      </form>
      <div className="flex justify-end">
        <Link className="text-sm font-medium text-[var(--color-text-link)]" href={appRoutes.forgotPassword}>
          Quên mật khẩu?
        </Link>
      </div>
    </AuthShell>
  );
}
