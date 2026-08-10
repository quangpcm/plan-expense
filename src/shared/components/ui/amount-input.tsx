'use client';

import { formatAmountInputValue, parseAmountInputValue } from '@/shared/utils/currency';

type AmountInputProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
};

export function AmountInput({ id, value, onChange, placeholder = '0' }: AmountInputProps) {
  const displayValue = formatAmountInputValue(value);
  const inputWidth = Math.max(displayValue.length, placeholder.length, 1) + 1;

  return (
    <div className="flex items-baseline justify-center gap-1 border-b-2 border-[#c2c6d8] pb-1 focus-within:border-[#0050cb]">
      <input
        className="border-0 bg-transparent text-right text-4xl font-bold text-[#0050cb] outline-none placeholder:text-[#c2c6d8]"
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange(parseAmountInputValue(event.target.value))}
        placeholder={placeholder}
        style={{ width: `${inputWidth}ch` }}
        value={displayValue}
      />
      <span className="text-2xl font-semibold text-[#727687]">đ</span>
    </div>
  );
}
