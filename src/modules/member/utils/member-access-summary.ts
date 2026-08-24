import { CONFIGURABLE_MODULE_IDS } from '@/modules/member/constants/module-access';
import { resolveModuleAccess } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanModuleId } from '@/modules/plan/types/plan-modular';

// Điểm 8 feedback: dòng phụ ở collapsed state member list, phân biệt
// "Truy cập N khu vực" (viewer) với "Quản lý N khu vực" (editor).
export function summarizeMemberAccess(member: PlanMemberDocument, enabledModuleIds: PlanModuleId[]): string {
  const modules = CONFIGURABLE_MODULE_IDS.filter((moduleId) => enabledModuleIds.includes(moduleId));

  if (member.role === 'viewer') {
    const count = modules.filter((moduleId) => resolveModuleAccess(member, moduleId) !== 'hidden').length;
    return `Truy cập ${count} khu vực`;
  }

  const count = modules.filter((moduleId) => {
    const level = resolveModuleAccess(member, moduleId);
    return level === 'manage_own' || level === 'manage_all';
  }).length;

  return `Quản lý ${count} khu vực`;
}
