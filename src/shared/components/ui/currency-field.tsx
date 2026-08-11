'use client';

import { formatAmountInputValue, parseAmountInputValue } from '@/shared/utils/currency';
import { Input } from '@/shared/components/ui/input';

type CurrencyFieldProps = {
  id?: string;
  value: number;
  placeholder?: string;
  onChange: (value: number) => void;
};

export function CurrencyField({ id, value, placeholder = '0', onChange }: CurrencyFieldProps) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      onChange={(event) => onChange(parseAmountInputValue(event.target.value))}
      placeholder={placeholder}
      value={formatAmountInputValue(value)}
    />
  );
}
