'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { userService } from '@/modules/user/services';
import { Button } from '@/shared/components/ui/button';
import { PinCodeInput } from '@/shared/components/ui/pin-code-input';

type PasscodeFormProps = {
  userId: string;
  onClose?: () => void;
  onSuccess?: () => void;
};

type Step = 'enter' | 'confirm';

export function PasscodeForm({ userId, onClose, onSuccess }: PasscodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleEnterComplete(pin: string) {
    setFirstPin(pin);
    setCurrentValue('');
    setErrorMessage(null);
    setStep('confirm');
  }

  async function handleConfirmComplete(pin: string) {
    if (pin !== firstPin) {
      setErrorMessage('Mã xác nhận không khớp, vui lòng nhập lại.');
      setFirstPin('');
      setCurrentValue('');
      setStep('enter');
      return;
    }

    setIsSubmitting(true);

    try {
      await userService.setPasscode(userId, pin);
      onSuccess?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Hiện chưa thể đặt mã bảo mật.');
      setFirstPin('');
      setCurrentValue('');
      setStep('enter');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-sm font-medium text-[var(--color-muted)]">
        {step === 'enter' ? 'Nhập mã mới' : 'Nhập lại để xác nhận'}
      </p>

      <PinCodeInput
        autoFocus
        disabled={isSubmitting}
        key={step}
        onChange={setCurrentValue}
        onComplete={step === 'enter' ? handleEnterComplete : handleConfirmComplete}
        value={currentValue}
      />

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      {onClose ? (
        <div className="flex justify-end">
          <Button onClick={onClose} type="button" variant="ghost">
            Đóng
          </Button>
        </div>
      ) : null}
    </div>
  );
}
