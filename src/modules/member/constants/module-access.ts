import type { ConfigurableModuleId, ModuleAccessLevel } from '@/modules/plan/types/plan-modular';

export const CONFIGURABLE_MODULE_IDS: ConfigurableModuleId[] = [
  'planning',
  'finance',
  'weddingGuests',
  'travelItinerary',
  'members',
  'debtTracking',
];

export const ACCESS_LEVEL_LABEL: Record<ModuleAccessLevel, string> = {
  hidden: 'Ẩn',
  view: 'Chỉ xem',
  manage_own: 'Quản lý nội dung của mình',
  manage_all: 'Quản lý toàn bộ',
};

// Module "Thành viên" không hỗ trợ manage_own/manage_all cho non-owner
// (permission.service.ts MODULE_SUPPORTED_LEVELS.members), nên "hidden" ở
// đây mang nghĩa "không truy cập module này" thay vì "ẩn nội dung của người khác".
export function getAccessLevelLabel(moduleId: ConfigurableModuleId, level: ModuleAccessLevel): string {
  if (moduleId === 'members' && level === 'hidden') {
    return 'Không truy cập';
  }

  return ACCESS_LEVEL_LABEL[level];
}
