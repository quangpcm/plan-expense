'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownWideNarrow, Check, ListFilter } from 'lucide-react';

import { cn } from '@/shared/utils/cn';
import type { TodoDueSortOrder, TodoStatusFilter } from '@/modules/todo/utils/todo-order';

type TodoListControlsProps = {
  statusFilter: TodoStatusFilter;
  onStatusFilterChange: (value: TodoStatusFilter) => void;
  sortOrder: TodoDueSortOrder;
  onSortOrderChange: (value: TodoDueSortOrder) => void;
};

const SORT_OPTIONS: Array<{ value: TodoDueSortOrder; label: string }> = [
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'newest', label: 'Mới nhất' },
];

export function TodoListControls({
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: TodoListControlsProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSortOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isSortOpen]);

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={statusFilter === 'done' ? 'Đang lọc: Hoàn thành. Bấm để xem việc chưa hoàn thành' : 'Đang lọc: Chưa hoàn thành. Bấm để xem việc đã hoàn thành'}
        aria-pressed={statusFilter === 'done'}
        className={cn(
          'flex size-9 items-center justify-center rounded-full border transition',
          statusFilter === 'done'
            ? 'border-[#0050cb] bg-[#0050cb]/10 text-[#0050cb]'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
        )}
        onClick={() => onStatusFilterChange(statusFilter === 'pending' ? 'done' : 'pending')}
        type="button"
      >
        <ListFilter className="size-4" />
      </button>

      <div className="relative" ref={containerRef}>
        <button
          aria-expanded={isSortOpen}
          aria-haspopup="listbox"
          aria-label={`Sắp xếp theo hạn: ${SORT_OPTIONS.find((option) => option.value === sortOrder)?.label}`}
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300"
          onClick={() => setIsSortOpen((current) => !current)}
          type="button"
        >
          <ArrowDownWideNarrow className="size-4" />
        </button>

        {isSortOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
            <ul className="py-1" role="listbox">
              {SORT_OPTIONS.map((option) => {
                const isSelected = option.value === sortOrder;

                return (
                  <li key={option.value}>
                    <button
                      className={cn(
                        'flex min-h-10 w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-slate-50',
                        isSelected ? 'text-[#0050cb]' : 'text-slate-700',
                      )}
                      aria-selected={isSelected}
                      onClick={() => {
                        onSortOrderChange(option.value);
                        setIsSortOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <span>{option.label}</span>
                      {isSelected ? <Check className="size-4" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
