import type { TodoDocument } from '@/modules/todo/types/todo';

export const priorityLabel: Record<TodoDocument['priority'], string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
};

export const statusLabel: Record<TodoDocument['status'], string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function toVendorHref(link: string) {
  return link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`;
}

// Strips presentation separators (spaces, dashes, parens, dots) that are meaningless in a tel URI
// while preserving a leading "+" for international numbers. Never mutates the displayed value —
// this only feeds the call action's href.
export function toTelHref(phoneNumber: string) {
  const hasLeadingPlus = phoneNumber.trim().startsWith('+');
  const digits = phoneNumber.replace(/\D/g, '');

  return `tel:${hasLeadingPlus ? '+' : ''}${digits}`;
}
