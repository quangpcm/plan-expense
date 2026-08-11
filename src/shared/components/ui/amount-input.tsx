'use client';

import { useState } from 'react';

import { formatAmountInputValue, parseAmountInputValue } from '@/shared/utils/currency';

type AmountInputProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
};

const RAW_DIGIT_MULTIPLIERS = [1_000, 10_000, 100_000];
const ROUNDED_AMOUNT_MULTIPLIERS = [10, 100, 1_000];
const ROUNDED_AMOUNT_THRESHOLD = 1_000;
const SUGGESTION_MAX = 1_000_000_000;

export function AmountInput({ id, value, onChange, placeholder = '0' }: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestionsHidden, setSuggestionsHidden] = useState(false);
  const displayValue = formatAmountInputValue(value);
  const inputWidth = Math.max(displayValue.length, placeholder.length, 1) + 1;
  const multipliers = value < ROUNDED_AMOUNT_THRESHOLD ? RAW_DIGIT_MULTIPLIERS : ROUNDED_AMOUNT_MULTIPLIERS;
  const suggestions =
    value > 0
      ? multipliers.map((multiplier) => value * multiplier).filter((suggestion) => suggestion <= SUGGESTION_MAX)
      : [];
  const showSuggestions = isFocused && !suggestionsHidden && suggestions.length > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline justify-center gap-1 border-b-2 border-[#c2c6d8] pb-1 focus-within:border-[#0050cb]">
        <input
          className="border-0 bg-transparent text-right text-4xl font-bold text-[#0050cb] outline-none placeholder:text-[#c2c6d8]"
          id={id}
          inputMode="numeric"
          onBlur={() => setIsFocused(false)}
          onChange={(event) => {
            setSuggestionsHidden(false);
            onChange(parseAmountInputValue(event.target.value));
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          style={{ width: `${inputWidth}ch` }}
          value={displayValue}
        />
        <span className="text-2xl font-semibold text-[#727687]">đ</span>
      </div>
      {showSuggestions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              key={suggestion}
              onClick={() => {
                setSuggestionsHidden(true);
                onChange(suggestion);
              }}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              {formatAmountInputValue(suggestion)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
