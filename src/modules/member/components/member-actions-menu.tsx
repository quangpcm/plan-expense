'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';

export type MemberActionMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onSelect: () => void;
};

type MemberActionsMenuProps = {
  items: MemberActionMenuItem[];
  disabled?: boolean;
  ariaLabel?: string;
};

function MenuItemButton({ item, onSelect }: { item: MemberActionMenuItem; onSelect: () => void }) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100',
        item.destructive ? 'text-red-600' : 'text-slate-700',
      )}
      key={item.key}
      onClick={() => {
        onSelect();
        item.onSelect();
      }}
      type="button"
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </button>
  );
}

export function MemberActionsMenu({ items, disabled = false, ariaLabel = 'Thêm tùy chọn' }: MemberActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative shrink-0">
      <button
        aria-label={ariaLabel}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {isOpen ? (
        <>
          <div className="hidden md:block">
            <button
              aria-label="Đóng menu"
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              type="button"
            />
            <Card className="absolute top-12 right-0 z-50 w-64 gap-1 p-2 shadow-[0_16px_60px_rgba(15,23,42,0.16)]">
              {items.map((item) => (
                <MenuItemButton item={item} key={item.key} onSelect={() => setIsOpen(false)} />
              ))}
            </Card>
          </div>
          <div className="md:hidden">
            <BottomSheet onClose={() => setIsOpen(false)} open={isOpen} title="Tùy chọn thành viên">
              <div className="grid gap-1">
                {items.map((item) => (
                  <MenuItemButton item={item} key={item.key} onSelect={() => setIsOpen(false)} />
                ))}
              </div>
            </BottomSheet>
          </div>
        </>
      ) : null}
    </div>
  );
}
