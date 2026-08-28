Đúng. **Layout giờ đã ổn**, nhưng iconography đang là điểm làm UI mất hierarchy. Vấn đề không phải icon xấu mà là **một icon đang bị dùng cho quá nhiều ý nghĩa**, đặc biệt hình `clock/circle`.

Trong screenshot hiện tại, mắt thấy gần như:

`⊙ Cần chú ý` → `○ Todo` → `☀ Hôm nay` → `☀ Empty state` → `◷ Sắp tới` → `◷ Item` → `◷ Item` → `◷ Item`

Kết quả là icon không còn giúp user scan.

## Tôi đề xuất một rule rất rõ: icon phải biểu diễn **WHAT**, màu/state biểu diễn **WHEN/STATUS**

Đừng dùng icon clock để nói rằng item "sắp tới". `Ngày mai` bên phải đã nói WHEN rồi.

### 1. Section icon = trạng thái thời gian

Chỉ section heading mới dùng icon mang ý nghĩa grouping:

| Section   | Icon concept                    | Ý nghĩa   |
| --------- | ------------------------------- | --------- |
| Cần chú ý | `CircleAlert` / `TriangleAlert` | cần xử lý |
| Hôm nay   | `Sun` hoặc `CalendarDays`       | today     |
| Sắp tới   | `Clock3` / `CalendarClock`      | upcoming  |

Ví dụ:

```text
ⓘ  Cần chú ý

☀  Hôm nay

◷  Sắp tới
```

Đây là nơi clock icon hợp lý.

---

### 2. Item icon = loại dữ liệu

Đây mới là thay đổi quan trọng.

Todo:

```text
☐  Tìm xe về Huế                    Trễ 1 ngày
```

Travel activity:

```text
✈  Bay đến Đà Nẵng                       08:30
```

Stay:

```text
▣  Nhận phòng khách sạn                  14:00
```

Các activity dùng category icon tương ứng.

Như vậy user nhìn icon là biết ngay:

> Đây là task hay activity?

Chứ không phải:

> Nó xảy ra khi nào?

WHEN đã có ở cột phải.

---

# 4. Attention Todo cũng phải giữ cùng Todo icon

Đừng biến Todo thành warning icon chỉ vì nó overdue.

Ví dụ:

```text
⚠  Cần chú ý

☐  Tìm xe về Huế                    Trễ 1 ngày
    [Plan] QP · Công việc
```

Semantics lúc này rất sạch:

* ⚠ = section reason.
* ☐ = Todo.
* `Trễ 1 ngày` đỏ = status.

Ba element, ba nhiệm vụ khác nhau.

---

# 5. Empty Today đang lặp Sun

Hiện:

> ☀ **Hôm nay**
>
> ☀ **Không có việc nào đến hạn hôm nay**

Không cần.

Tôi sẽ dùng một icon mang nghĩa trạng thái empty/clear:

```text
☀  Hôm nay

✓  Không có việc nào đến hạn hôm nay
   Ưu tiên xử lý 1 việc cần chú ý ở phía trên.
```

Nhưng như trao đổi trước, vì đang có overdue, tôi **không muốn green success check**.

Có thể đơn giản hơn nữa:

```text
☀  Hôm nay

   Không có việc nào đến hạn hôm nay
   Ưu tiên xử lý 1 việc cần chú ý ở phía trên.
```

**Không icon trong empty row cũng hoàn toàn ổn.**

Tôi thích phương án này nhất.

---

### Một nguyên tắc tốt cho Today

Mỗi row mobile lý tưởng chỉ có:

**1 primary icon bên trái + tối đa 1 metadata icon + 1 temporal/status treatment bên phải.**

Không hơn.

---

# 7. Active Plan banner là ngoại lệ

Ở:

> ✈ Test Travel | Ngày 2/3

Plane icon rất tốt vì nó communicate **Travel Plan**.

Giữ.

Nếu Wedding:

> ♡ Wedding Plan

Saving:

> ◎ Saving Plan

Nó đang biểu diễn entity/type, nên đúng semantics.