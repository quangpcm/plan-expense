import {
  Briefcase,
  Camera,
  Coffee,
  Gem,
  Heart,
  Home,
  Leaf,
  Music4,
  PartyPopper,
  Plane,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

export const avatarIconMap = {
  plane: Plane,
  heart: Heart,
  gem: Gem,
  home: Home,
  briefcase: Briefcase,
  party: PartyPopper,
  camera: Camera,
  leaf: Leaf,
  coffee: Coffee,
  utensils: Utensils,
  music: Music4,
  sparkles: Sparkles,
} satisfies Record<string, LucideIcon>;

export type AvatarIconKey = keyof typeof avatarIconMap;

export const avatarIconOptions: Array<{ value: AvatarIconKey; label: string }> = [
  { value: 'plane', label: 'Du lịch' },
  { value: 'heart', label: 'Tình yêu' },
  { value: 'gem', label: 'Sự kiện' },
  { value: 'home', label: 'Gia đình' },
  { value: 'briefcase', label: 'Công việc' },
  { value: 'party', label: 'Tiệc' },
  { value: 'camera', label: 'Kỷ niệm' },
  { value: 'leaf', label: 'Thiên nhiên' },
  { value: 'coffee', label: 'Cafe' },
  { value: 'utensils', label: 'Ăn uống' },
  { value: 'music', label: 'Âm nhạc' },
  { value: 'sparkles', label: 'Đặc biệt' },
];

type AvatarDescriptor =
  | { kind: 'empty' }
  | { kind: 'url'; value: string }
  | { kind: 'icon'; value: AvatarIconKey }
  | { kind: 'emoji'; value: string };

const avatarToneClasses = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
];

function isUrlAvatar(value: string) {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(value);
}

function hashValue(value: string) {
  return value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getAvatarToneClass(seed: string | null | undefined) {
  if (!seed) {
    return 'bg-slate-950 text-white';
  }

  return avatarToneClasses[hashValue(seed) % avatarToneClasses.length];
}

export function parseAvatarValue(value: string | null | undefined): AvatarDescriptor {
  if (!value?.trim()) {
    return { kind: 'empty' };
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('url:')) {
    return { kind: 'url', value: trimmed.slice(4) };
  }

  if (trimmed.startsWith('icon:')) {
    const iconKey = trimmed.slice(5) as AvatarIconKey;
    return iconKey in avatarIconMap ? { kind: 'icon', value: iconKey } : { kind: 'empty' };
  }

  if (trimmed.startsWith('emoji:')) {
    return { kind: 'emoji', value: trimmed.slice(6) };
  }

  if (isUrlAvatar(trimmed)) {
    return { kind: 'url', value: trimmed };
  }

  return { kind: 'emoji', value: trimmed };
}
