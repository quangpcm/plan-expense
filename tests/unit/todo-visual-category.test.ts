import { describe, expect, it } from 'vitest';

import { inferTodoVisualCategory } from '@/modules/today/utils/todo-visual-category';

describe('inferTodoVisualCategory', () => {
  it('lets action-intent rules win before noun rules', () => {
    expect(inferTodoVisualCategory('thanh toán tiền xe')).toBe('payment');
    expect(inferTodoVisualCategory('thuê xe về Huế')).toBe('transport');
  });

  it('matches Vietnamese titles after accent normalization', () => {
    expect(inferTodoVisualCategory('gọi nhà xe')).toBe('call');
    expect(inferTodoVisualCategory('đặt phòng khách sạn')).toBe('booking');
    expect(inferTodoVisualCategory('chốt danh sách khách mời')).toBe('people');
    expect(inferTodoVisualCategory('tìm căn hộ')).toBe('location');
  });

  it('falls back to general for unknown titles', () => {
    expect(inferTodoVisualCategory('xem lại việc cần làm')).toBe('general');
  });
});
