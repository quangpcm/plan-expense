'use client';

import {
  formatAmountInputValue,
  parseAmountInputValue,
} from '@/shared/utils/currency';
import { Input } from '@/shared/components/ui/input';

type CurrencyFieldProps = {
  id?: string;
  className?: string;
  value: number;
  placeholder?: string;
  onChange: (value: number) => void;
};

export function CurrencyField({
  id,
  className,
  value,
  placeholder = '0',
  onChange,
}: CurrencyFieldProps) {
  return (
    <Input
      className={className}
      id={id}
      inputMode="numeric"
      onChange={(event) => onChange(parseAmountInputValue(event.target.value))}
      placeholder={placeholder}
      value={formatAmountInputValue(value)}
    />
  );
}
