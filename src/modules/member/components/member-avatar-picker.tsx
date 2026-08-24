'use client';

import { useMemo, useState } from 'react';
import { Check, ImageIcon, Smile, Sparkles, X } from 'lucide-react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { avatarIconMap, avatarIconOptions, parseAvatarValue } from '@/shared/utils/avatar';
import { cn } from '@/shared/utils/cn';

type MemberAvatarPickerProps = {
  memberName: string;
  open: boolean;
  isSaving?: boolean;
  value: string | null;
  onClose: () => void;
  onSave: (avatarValue: string | null) => Promise<void>;
};

export function MemberAvatarPicker({
  memberName,
  open,
  isSaving = false,
  value,
  onClose,
  onSave,
}: MemberAvatarPickerProps) {
  const parsedAvatar = useMemo(() => parseAvatarValue(value), [value]);
  const [emojiValue, setEmojiValue] = useState(parsedAvatar.kind === 'emoji' ? parsedAvatar.value : '');
  const [urlValue, setUrlValue] = useState(parsedAvatar.kind === 'url' ? parsedAvatar.value : '');
  const [selectedIcon, setSelectedIcon] = useState(parsedAvatar.kind === 'icon' ? parsedAvatar.value : null);
  const [mode, setMode] = useState<'icon' | 'emoji' | 'url'>(
    parsedAvatar.kind === 'url' ? 'url' : parsedAvatar.kind === 'emoji' ? 'emoji' : 'icon',
  );

  async function handleSave() {
    const nextAvatar =
      mode === 'emoji'
        ? (emojiValue.trim() ? `emoji:${emojiValue.trim()}` : null)
        : mode === 'url'
          ? (urlValue.trim() ? `url:${urlValue.trim()}` : null)
          : (selectedIcon ? `icon:${selectedIcon}` : null);

    await onSave(nextAvatar);
    onClose();
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-[24px] bg-slate-50 p-4">
        <Avatar
          className="size-16 text-xl"
          initials={memberName.slice(0, 2).toUpperCase()}
          src={
            mode === 'emoji'
              ? (emojiValue.trim() ? `emoji:${emojiValue.trim()}` : null)
              : mode === 'url'
                ? (urlValue.trim() ? `url:${urlValue.trim()}` : null)
                : (selectedIcon ? `icon:${selectedIcon}` : null)
          }
        />
        <div className="space-y-1">
          <p className="font-semibold text-slate-950">{memberName}</p>
          <p className="text-sm text-slate-600">Chọn icon, emoji hoặc dán URL ảnh đại diện.</p>
        </div>
      </div>

      <div className="inline-flex rounded-full bg-slate-100 p-1">
        {[
          { id: 'icon', label: 'Icon', icon: Sparkles },
          { id: 'emoji', label: 'Emoji', icon: Smile },
          { id: 'url', label: 'URL ảnh', icon: ImageIcon },
        ].map((item) => {
          const TabIcon = item.icon;

          return (
            <button
              key={item.id}
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                mode === item.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600',
              )}
              onClick={() => setMode(item.id as 'icon' | 'emoji' | 'url')}
              type="button"
            >
              <TabIcon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === 'icon' ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {avatarIconOptions.map((option) => {
            const Icon = avatarIconMap[option.value];
            const isSelected = selectedIcon === option.value;

            return (
              <button
                key={option.value}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-[24px] border p-3 transition',
                  isSelected ? 'border-[#0050cb] bg-[#0050cb]/6' : 'border-slate-200 bg-white hover:border-slate-300',
                )}
                onClick={() => setSelectedIcon(option.value)}
                type="button"
              >
                <Avatar className="size-12" src={`icon:${option.value}`} />
                <span className="text-xs font-medium text-slate-700">{option.label}</span>
                {isSelected ? <Check className="absolute top-3 right-3 size-4 text-[#0050cb]" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === 'emoji' ? (
        <div className="space-y-3">
          <Input
            maxLength={8}
            onChange={(event) => setEmojiValue(event.target.value)}
            placeholder="Nhập hoặc dán emoji, ví dụ 👰 ✈️ 🎉"
            value={emojiValue}
          />
          <p className="text-sm text-slate-500">Bạn có thể dùng emoji keyboard của hệ điều hành rồi dán trực tiếp vào ô này.</p>
        </div>
      ) : null}

      {mode === 'url' ? (
        <div className="space-y-3">
          <Input
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder="https://example.com/avatar.jpg"
            value={urlValue}
          />
          <p className="text-sm text-slate-500">Nếu là link ảnh hợp lệ, avatar sẽ hiển thị bằng ảnh thay vì icon hoặc emoji.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          disabled={isSaving}
          onClick={async () => {
            await onSave(null);
            onClose();
          }}
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
          Xóa avatar
        </Button>
        <Button disabled={isSaving} onClick={handleSave} type="button">
          {isSaving ? 'Đang lưu...' : 'Lưu avatar'}
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      className="max-w-2xl"
      description="Avatar có thể là ảnh URL, icon hoặc emoji."
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      title={`Chọn avatar cho ${memberName}`}
    >
      {content}
    </ResponsiveModal>
  );
}
