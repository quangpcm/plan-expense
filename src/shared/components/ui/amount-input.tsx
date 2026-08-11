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
      <div className="flex items-baseline justify-center gap-1 border-b-2 border-[var(--color-border-strong)] pb-1 focus-within:border-[var(--color-primary)]">
        <input
          className="border-0 bg-transparent text-right text-4xl font-bold text-[var(--color-primary)] outline-none placeholder:text-[var(--color-border-strong)]"
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
        <span className="text-2xl font-semibold text-[var(--color-muted)]">đ</span>
      </div>
      {showSuggestions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              className="rounded-full bg-[var(--color-secondary)] px-3 py-1 text-sm font-medium text-[var(--color-secondary-foreground)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-info)]"
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
