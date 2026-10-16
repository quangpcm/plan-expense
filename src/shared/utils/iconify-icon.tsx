import type { ComponentType } from 'react';
import { Icon as IconifyIcon, addCollection } from '@iconify/react/offline';
import flatColorIcons from '@iconify-json/flat-color-icons/icons.json';
import emojione from '@iconify-json/emojione/icons.json';

// Tải icon data cục bộ lúc build thay vì gọi API Iconify ở runtime. Chỉ đăng
// ký 2 bộ sưu tập — `flat-color-icons` (nhẹ, ~170KB, ưu tiên dùng trước) và
// `emojione` (nặng hơn, ~3MB, chỉ dùng cho các icon mà flat-color-icons không
// có, ví dụ đồ ăn/y tế/máy bay/quà) — side effect này chỉ chạy 1 lần dù nhiều
// module cùng import file này (ES module singleton).
addCollection(flatColorIcons);
addCollection(emojione);

export type IconComponent = ComponentType<{ className?: string }>;

// Icon Iconify dùng định danh "prefix:name" (chuẩn của chính Iconify) — dấu
// hai chấm là quy ước phân biệt an toàn với tên component Lucide (PascalCase,
// không có dấu hai chấm), không cần đoán theo tên.
export function isIconifyIconName(icon: string): boolean {
  return icon.includes(':');
}

const iconifyIconComponentCache = new Map<string, IconComponent>();

export function getIconifyIconComponent(iconName: string): IconComponent {
  const cached = iconifyIconComponentCache.get(iconName);
  if (cached) {
    return cached;
  }

  function IconifyRenderedIcon({ className }: { className?: string }) {
    return <IconifyIcon className={className} icon={iconName} />;
  }
  IconifyRenderedIcon.displayName = `IconifyIcon(${iconName})`;

  iconifyIconComponentCache.set(iconName, IconifyRenderedIcon);
  return IconifyRenderedIcon;
}
