'use client';

import { useRef, useState } from 'react';
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
  // Desktop dropdown position, computed from the trigger's real screen position on open (see
  // below for why this can't stay `absolute top-12 right-0` anymore). `openUpward` handles the
  // case where the trigger sits near the bottom of the viewport — a `fixed` element can't be
  // scrolled into view the way the old `absolute` one could, so if it would render past
  // `window.innerHeight` it opens above the trigger instead.
  const [desktopMenuPosition, setDesktopMenuPosition] = useState({ top: 0, bottom: 0, right: 0, openUpward: false });
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  if (items.length === 0) {
    return null;
  }

  function toggleOpen() {
    setIsOpen((value) => {
      const next = !value;

      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const right = window.innerWidth - rect.right;
        // Rough per-item height (matches MenuItemButton's own py-2.5 sizing) plus the Card's own
        // p-2 padding and gap-1 between items — just enough to decide which side has room, not a
        // pixel-exact layout measurement.
        const estimatedMenuHeight = items.length * 44 + (items.length - 1) * 4 + 16;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < estimatedMenuHeight + 8;

        setDesktopMenuPosition(
          openUpward
            ? // Opens upward: bottom edge 4px above the trigger's top edge.
              { top: 0, bottom: window.innerHeight - rect.top + 4, right, openUpward: true }
            : // Reproduces the original `absolute top-12 right-0` offset (48px below the
              // trigger's own top edge) in viewport coordinates.
              { top: rect.top + 48, bottom: 0, right, openUpward: false },
        );
      }

      return next;
    });
  }

  return (
    <div className="relative shrink-0">
      <button
        aria-label={ariaLabel}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={toggleOpen}
        ref={triggerRef}
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
            {/*
              This row can sit inside a `Collapsible`'s expand/collapse animation wrapper, which
              clips overflow to the row's own natural content height. An `absolute`-positioned
              dropdown is clipped by that ancestor the moment it extends past that box (confirmed
              via real layout measurement — the dropdown rendered ~85px below the clip boundary,
              fully invisible/unclickable). `fixed` positioning escapes that ancestor's clipping
              entirely (same reason the mobile BottomSheet below was never affected), so the
              dropdown is computed in viewport coordinates instead of being anchored via Tailwind's
              `top-12 right-0` (which only means something for `absolute`).
            */}
            <Card
              className="fixed z-50 w-64 gap-1 p-2 shadow-[0_16px_60px_rgba(15,23,42,0.16)]"
              style={
                desktopMenuPosition.openUpward
                  ? { bottom: desktopMenuPosition.bottom, right: desktopMenuPosition.right }
                  : { top: desktopMenuPosition.top, right: desktopMenuPosition.right }
              }
            >
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
