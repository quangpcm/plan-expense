'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lock } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { userService } from '@/modules/user/services';
import { PinCodeInput } from '@/shared/components/ui/pin-code-input';

type PlanUnlockGateProps = {
  secretNumberHash: string;
  onUnlock: () => void;
};

export function PlanUnlockGate({ secretNumberHash, onUnlock }: PlanUnlockGateProps) {
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function handleComplete(pin: string) {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const isCorrect = await userService.verifyPasscode(secretNumberHash, pin);

      if (isCorrect) {
        onUnlock();
        return;
      }

      setErrorMessage('Sai mã, vui lòng thử lại.');
      setValue('');
      setAttempt((current) => current + 1);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)]">
        <Lock className="size-6" />
      </div>

      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-foreground)]">Kế hoạch này đã được khóa</h1>
        <p className="text-sm leading-6 text-[var(--color-muted)]">Nhập mã bảo mật của bạn để tiếp tục.</p>
      </div>

      <PinCodeInput
        autoFocus
        disabled={isVerifying}
        error={Boolean(errorMessage)}
        key={attempt}
        onChange={setValue}
        onComplete={handleComplete}
        value={value}
      />

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <Link className="text-sm font-medium text-[var(--color-primary)]" href="/plans">
        ← Quay lại danh sách kế hoạch
      </Link>
    </main>
  );
}
