import {
  BadgeDollarSign,
  BedDouble,
  Bolt,
  Boxes,
  CakeSlice,
  Camera,
  Car,
  CircleEllipsis,
  ConciergeBell,
  Fuel,
  Gift,
  HandCoins,
  Handshake,
  HeartHandshake,
  House,
  Landmark,
  Laptop,
  MailOpen,
  MapPin,
  Megaphone,
  MicVocal,
  MonitorCog,
  PackageOpen,
  Paintbrush,
  PartyPopper,
  PiggyBank,
  Receipt,
  ReceiptText,
  RotateCcw,
  Shirt,
  ShoppingBag,
  Sparkles,
  SprayCan,
  Tag,
  Target,
  Ticket,
  Tickets,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  Wifi,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const categoryIcons: Record<string, LucideIcon> = {
  BadgeDollarSign,
  BedDouble,
  Bolt,
  Boxes,
  CakeSlice,
  Camera,
  Car,
  CircleEllipsis,
  ConciergeBell,
  Fuel,
  Gift,
  HandCoins,
  Handshake,
  HeartHandshake,
  House,
  Landmark,
  Laptop,
  MailOpen,
  MapPin,
  Megaphone,
  MicVocal,
  MonitorCog,
  PackageOpen,
  Paintbrush,
  PartyPopper,
  PiggyBank,
  Receipt,
  ReceiptText,
  RotateCcw,
  Shirt,
  ShoppingBag,
  Sparkles,
  SprayCan,
  Target,
  Ticket,
  Tickets,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  Wifi,
  Wrench,
};

export function getCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) {
    return Tag;
  }

  return categoryIcons[icon] ?? Tag;
}

export type CategoryIconTone = {
  iconColor: string;
  iconBgColor: string;
};

const DEFAULT_ICON_TONE: CategoryIconTone = { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' };

// Curated by hand (not hashed) so the same icon always gets the same, deliberately
// chosen color everywhere it appears — avoids the "several icons collide on one
// color" problem a hash-based tone picker would cause once there are more icons
// than colors.
const ICON_TONES: Record<string, CategoryIconTone> = {
  BadgeDollarSign: { iconColor: 'text-green-600', iconBgColor: 'bg-green-100' },
  BedDouble: { iconColor: 'text-indigo-600', iconBgColor: 'bg-indigo-100' },
  Bolt: { iconColor: 'text-yellow-600', iconBgColor: 'bg-yellow-100' },
  Boxes: { iconColor: 'text-amber-600', iconBgColor: 'bg-amber-100' },
  CakeSlice: { iconColor: 'text-amber-600', iconBgColor: 'bg-amber-100' },
  Camera: { iconColor: 'text-indigo-600', iconBgColor: 'bg-indigo-100' },
  Car: { iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
  CircleEllipsis: { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' },
  ConciergeBell: { iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
  Fuel: { iconColor: 'text-amber-600', iconBgColor: 'bg-amber-100' },
  Gift: { iconColor: 'text-rose-600', iconBgColor: 'bg-rose-100' },
  HandCoins: { iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
  Handshake: { iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
  HeartHandshake: { iconColor: 'text-rose-600', iconBgColor: 'bg-rose-100' },
  House: { iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
  Landmark: { iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
  Laptop: { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' },
  MailOpen: { iconColor: 'text-rose-600', iconBgColor: 'bg-rose-100' },
  MapPin: { iconColor: 'text-rose-600', iconBgColor: 'bg-rose-100' },
  Megaphone: { iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
  MicVocal: { iconColor: 'text-violet-600', iconBgColor: 'bg-violet-100' },
  MonitorCog: { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' },
  PackageOpen: { iconColor: 'text-lime-600', iconBgColor: 'bg-lime-100' },
  Paintbrush: { iconColor: 'text-pink-600', iconBgColor: 'bg-pink-100' },
  PartyPopper: { iconColor: 'text-pink-600', iconBgColor: 'bg-pink-100' },
  PiggyBank: { iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
  Receipt: { iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
  ReceiptText: { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' },
  RotateCcw: { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' },
  Shirt: { iconColor: 'text-cyan-600', iconBgColor: 'bg-cyan-100' },
  ShoppingBag: { iconColor: 'text-fuchsia-600', iconBgColor: 'bg-fuchsia-100' },
  Sparkles: { iconColor: 'text-purple-600', iconBgColor: 'bg-purple-100' },
  SprayCan: { iconColor: 'text-cyan-600', iconBgColor: 'bg-cyan-100' },
  Target: { iconColor: 'text-red-600', iconBgColor: 'bg-red-100' },
  Ticket: { iconColor: 'text-violet-600', iconBgColor: 'bg-violet-100' },
  Tickets: { iconColor: 'text-violet-600', iconBgColor: 'bg-violet-100' },
  TrendingUp: { iconColor: 'text-green-600', iconBgColor: 'bg-green-100' },
  Users: { iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
  Utensils: { iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
  WalletCards: { iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
  Wifi: { iconColor: 'text-sky-600', iconBgColor: 'bg-sky-100' },
  Wrench: { iconColor: 'text-zinc-600', iconBgColor: 'bg-zinc-100' },
};

export function getCategoryIconTone(icon: string | null | undefined): CategoryIconTone {
  if (!icon) {
    return DEFAULT_ICON_TONE;
  }

  return ICON_TONES[icon] ?? DEFAULT_ICON_TONE;
}
