'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { AuthShell } from '@/modules/auth/components/auth-shell';
import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { registerSchema, type RegisterSchema } from '@/modules/auth/schemas/register.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { appRoutes } from '@/shared/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount } = useAuthActions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<RegisterSchema>({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsed = registerSchema.parse(values);
      await registerAccount(parsed);
      startTransition(() => {
        router.replace(appRoutes.plans);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể tạo tài khoản. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Bắt đầu với một tài khoản đơn giản để vào ngay các kế hoạch và theo dõi chi tiêu."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link className="font-semibold text-sky-700" href={appRoutes.login}>
            Đăng nhập
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="displayName">
            Tên hiển thị
          </label>
          <Input id="displayName" placeholder="Tên của bạn" {...register('displayName')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <Input id="email" placeholder="ban@example.com" {...register('email')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Mật khẩu
          </label>
          <Input id="password" type="password" placeholder="Tối thiểu 6 ký tự" {...register('password')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
            Xác nhận mật khẩu
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            {...register('confirmPassword')}
          />
        </div>
        {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          <UserPlus className="size-4" />
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>
      </form>
    </AuthShell>
  );
}
