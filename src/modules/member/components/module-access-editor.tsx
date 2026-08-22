'use client';

import { EDITOR_DEFAULT_MODULE_ACCESS } from '@/modules/member/services/permission.service';
import type { PlanRole } from '@/modules/member/types/member';
import { planModuleRegistry } from '@/modules/plan/constants/plan-module-registry';
import type { ConfigurableModuleId, ModuleAccessLevel, PlanModuleId } from '@/modules/plan/types/plan-modular';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';

const CONFIGURABLE_MODULE_IDS: ConfigurableModuleId[] = [
  'planning',
  'finance',
  'weddingGuests',
  'travelItinerary',
  'members',
  'debtTracking',
];

const ACCESS_LEVEL_LABEL: Record<ModuleAccessLevel, string> = {
  hidden: 'Ẩn',
  view: 'Chỉ xem',
  manage_own: 'Quản lý nội dung của mình',
  manage_all: 'Quản lý toàn bộ',
};

type ModuleAccessEditorProps = {
  role: Exclude<PlanRole, 'owner'>;
  enabledModuleIds: PlanModuleId[];
  value: Partial<Record<ConfigurableModuleId, ModuleAccessLevel>>;
  onChange: (moduleId: ConfigurableModuleId, level: ModuleAccessLevel) => void;
};

// Roles & Permissions V2 (docs/roles-permissions.md #24) — Editor thấy
// dropdown access level theo từng module; Viewer chỉ thấy checkbox
// hiện/ẩn module (P3: viewer không bao giờ có write capability).
export function ModuleAccessEditor({ role, enabledModuleIds, value, onChange }: ModuleAccessEditorProps) {
  const modules = CONFIGURABLE_MODULE_IDS.filter((moduleId) => enabledModuleIds.includes(moduleId));

  if (modules.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-sm font-medium text-slate-700">Quyền truy cập</p>
      {modules.map((moduleId) => {
        const definition = planModuleRegistry[moduleId];
        const supportedLevels = definition.supportedAccessLevels ?? ['hidden', 'view'];

        if (role === 'viewer') {
          const currentLevel = value[moduleId] ?? 'view';
          const canView = currentLevel !== 'hidden';

          return (
            <label
              className="flex items-center justify-between gap-2 text-sm text-slate-700"
              key={moduleId}
            >
              <span>{definition.defaultLabel}</span>
              <input
                checked={canView}
                onChange={(event) => onChange(moduleId, event.target.checked ? 'view' : 'hidden')}
                type="checkbox"
              />
            </label>
          );
        }

        const currentLevel = value[moduleId] ?? EDITOR_DEFAULT_MODULE_ACCESS[moduleId];

        return (
          <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto]" key={moduleId}>
            <span className="text-sm text-slate-700">{definition.defaultLabel}</span>
            <DropdownSelect
              onValueChange={(next) => onChange(moduleId, next as ModuleAccessLevel)}
              options={supportedLevels.map((level) => ({ value: level, label: ACCESS_LEVEL_LABEL[level] }))}
              value={currentLevel}
            />
          </div>
        );
      })}
    </div>
  );
}
