import Link from 'next/link';
import { Plus } from 'lucide-react';

export function CreatePlanCard() {
  return (
    <Link
      className="flex flex-col items-center gap-2 rounded-[28px] border-2 border-dashed border-[#c2c6d8] bg-white px-5 py-8 text-center transition hover:border-[#0050cb]"
      href="/plans/new"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-[#0050cb]/10 text-[#0050cb]">
        <Plus className="size-6" />
      </span>
      <span className="text-base font-semibold text-[#191c1e]">Tạo kế hoạch mới</span>
      <span className="text-sm text-[#727687]">Bắt đầu quản lý tài chính thông minh</span>
    </Link>
  );
}
