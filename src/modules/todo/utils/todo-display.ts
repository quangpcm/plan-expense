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
