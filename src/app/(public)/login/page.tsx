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
      setSuccessMessage('Signed in successfully.');
      navigateAfterAuth();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Please review your input.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to sign in right now.');
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
        setErrorMessage('Unable to continue with Google right now.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to continue managing your plans, members, and shared expenses."
      footer={
        <>
          New here?{' '}
          <Link className="font-semibold text-sky-700" href={appRoutes.register}>
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <Input id="email" placeholder="you@example.com" {...register('email')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" placeholder="At least 6 characters" {...register('password')} />
        </div>
        {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
        {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}
        <div className="space-y-3">
          <Button className="w-full" disabled={isSubmitting} type="submit">
            <LogIn className="size-4" />
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
          <Button
            className="w-full"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            type="button"
            variant="secondary"
          >
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>
        </div>
      </form>
      <div className="flex justify-end">
        <Link className="text-sm font-medium text-sky-700" href={appRoutes.forgotPassword}>
          Forgot password?
        </Link>
      </div>
    </AuthShell>
  );
}

