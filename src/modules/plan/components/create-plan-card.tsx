import { Plus } from 'lucide-react';

type CreatePlanCardProps = {
  onClick: () => void;
};

export function CreatePlanCard({ onClick }: CreatePlanCardProps) {
  return (
    <button
      className="flex flex-col items-center gap-2 rounded-[28px] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-8 text-center transition hover:border-[var(--color-primary)]"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-primary)]">
        <Plus className="size-6" />
      </span>
      <span className="text-base font-semibold text-[var(--color-foreground)]">Tạo kế hoạch mới</span>
      <span className="text-sm text-[var(--color-muted)]">Bắt đầu quản lý tài chính thông minh</span>
    </button>
  );
}
