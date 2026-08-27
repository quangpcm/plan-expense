Tôi nghĩ nên triển khai thành **5 phase**, và quan trọng là **không làm animation trước khi content model ổn định**. Với những gì đã confirm, Today V2 thực chất có ba lớp: **Briefing → Action → Context/Progress**.

## Kiến trúc nội dung đích

Tôi sẽ chốt màn hình cuối theo thứ tự:

```text
Hôm nay
Thứ Năm, 27 tháng 8

[ DAILY BRIEF ]
Một ngày khá bận.
Bạn có 1 việc cần chú ý và 7 việc hôm nay.

[ ƯU TIÊN TIẾP THEO ]
No name
Tìm căn hộ · Trễ 1 ngày
                         Mở công việc →

Cần chú ý (1)
[ Card ][ Card ][ Card ] →

Hôm nay (7)
[ Card ][ Card ][ Card ] →

[ TIẾN ĐỘ HÔM NAY ]
3/7 việc đã hoàn thành
████████░░░ 43%

[ ĐANG DIỄN RA ]                 conditional
Đà Nẵng 2026
Ngày 2/4 · Tiếp theo 14:30

Sắp tới (5)
[ Card ][ Card ][ Card ] →

[ VỪA HOÀN THÀNH ]               conditional
✓ Xác nhận nhà hàng
✓ Đặt xe sân bay
```

Tôi cố tình **không đặt tất cả insight ở đầu trang**. Nếu Brief + Priority + Progress + Active Plan đều nằm trước Todo thì user lại phải scroll mới thấy việc hôm nay.

---

# Phase 1 — Daily Brief + Brief Matrix

**Ưu tiên cao nhất.**

Đây là thứ biến Today từ task aggregation thành một màn hình có "tiếng nói".

### Không dùng AI/LLM để generate câu

Tôi khuyến nghị strongly dùng **deterministic matrix**.

Ta có thể derive một `TodayBriefState` kiểu:

```ts
{
  attentionCount,
  todayCount,
  upcomingCount,
  completedTodayCount,
  activeContextCount
}
```

Sau đó resolve thành message.

### Matrix nên dựa vào workload

Tôi không muốn tạo matrix tổ hợp hàng chục trường hợp. Chỉ cần xác định **dominant state** theo priority.

| Priority | Condition               | Headline                            | Supporting text                                          |
| -------- | ----------------------- | ----------------------------------- | -------------------------------------------------------- |
| 1        | attention >= 3          | `Có vài việc cần bạn ưu tiên.`      | `{n} việc đang tồn đọng trước hôm nay.`                  |
| 2        | attention > 0           | `Có một chút việc cần xử lý trước.` | `{n} việc cần chú ý và {today} việc trong hôm nay.`      |
| 3        | today >= 8              | `Hôm nay khá bận.`                  | `Bạn có {n} việc trong {planCount} kế hoạch.`            |
| 4        | today >= 4              | `Hôm nay có khá nhiều việc.`        | `{n} việc đang chờ bạn xử lý.`                           |
| 5        | today 1–3               | `Một ngày khá nhẹ nhàng.`           | `Bạn có {n} việc cần xử lý hôm nay.`                     |
| 6        | today = 0, upcoming > 0 | `Hôm nay khá thoải mái.`            | `Không có việc cần xử lý. {n} việc đang chờ phía trước.` |
| 7        | nothing                 | `Mọi thứ đang ổn.`                  | `Hôm nay chưa có việc nào cần bạn xử lý.`                |

Sau này có thể bổ sung context:

> **Ngày thứ 2 của chuyến đi.**
> Bạn có 3 hoạt động hôm nay, tiếp theo lúc 14:30.

Nhưng Phase 1 chưa cần.

### Phase 1 scope

* `DailyBrief`
* resolver/matrix
* unit tests cho matrix
* responsive
* không Firestore schema mới nếu summary hiện có đủ data.

**STOP → screenshot review.**

---

# Phase 2 — Priority / “Ưu tiên tiếp theo”

Đây là feature có action value cao nhất.

Cần define ranking rõ ràng trước khi code.

Tôi đề xuất:

```text
1. Overdue + priority high
2. Overdue lâu nhất
3. Due today + priority high
4. Todo hôm nay gần deadline nhất (nếu có time)
5. Travel Activity tiếp theo theo thời gian
6. Todo hôm nay bình thường
```

Nhưng có một nuance quan trọng:

Nếu có Travel Activity lúc **14:00** và Todo overdue 1 ngày, lúc 13:45 có thể Activity quan trọng hơn.

Vì vậy eventually ranking nên có **time-sensitive override**:

```text
Activity bắt đầu trong <= 60 phút
          ↓
được ưu tiên rất cao
```

Ví dụ:

```text
ƯU TIÊN TIẾP THEO

✈ Check-in sân bay
  Đà Nẵng 2026

Bắt đầu sau 35 phút

                       Mở lịch trình →
```

Đây mới thực sự giống assistant.

Phase này cần:

* deterministic ranking;
* hero card;
* Todo/Activity navigation;
* không AI ranking;
* không user-configurable priority engine.

**STOP → screenshot + test ranking.**

---

# Phase 3 — Daily Progress + Recently Completed

Tôi ghép hai feature này thành một phase vì chúng dùng chung concept:

> **Today không chỉ cho biết còn gì — mà còn phản hồi những gì user đã làm.**

### Progress

```text
TIẾN ĐỘ HÔM NAY

3/7 việc hoàn thành                         43%
████████████░░░░░░░░░
```

Nhưng denominator cần suy nghĩ kỹ.

Nếu sáng có 7 việc, user hoàn thành 3, query hiện tại loại completed khỏi `todayItems`, thì không thể tính:

> 3 / 4

Ta cần biết:

```text
completed today
+
remaining today
```

để ra:

> 3 / 7

Đây có thể đòi hỏi summary/read-model mở rộng.

### Recently Completed

Chỉ 2–3 item:

```text
VỪA HOÀN THÀNH

✓ Gọi xác nhận nhà hàng
  QP 💍 LA · 35 phút trước

✓ Thanh toán tiền xe
  Đà Nẵng 2026 · 2 giờ trước
```

Nếu không có completed today → **không render section**.

### Có thể tạo micro-celebration

Nếu:

```text
completed = total && total > 0
```

thì:

> **Xong hết rồi 🎉**
> Bạn đã hoàn thành cả 7 việc hôm nay.

Không confetti full-screen.

Đây là reward vừa đủ.

**STOP → review data correctness + UI.**

---

# Phase 4 — Active Context / `Đang diễn ra`

Đây là phase khó nhất về product semantics, nên tôi để sau.

Bởi `Đang diễn ra` không thể áp dụng một rule cho mọi Plan.

Travel:

```text
ĐANG DIỄN RA

Đà Nẵng 2026
Ngày 2 / 4

Tiếp theo
14:30 · Check-in khách sạn
```

Wedding:

```text
SẮP ĐẾN

QP 💍 LA
Còn 12 ngày đến ngày cưới

5/8 việc quan trọng đã hoàn thành
```

Event:

```text
ĐANG DIỄN RA

Sinh nhật...
Bắt đầu lúc 18:30
```

Saving/Debt lại không nên cố nhét vào cùng metaphor.

Vì vậy tôi sẽ thiết kế concept là:

### `TodayContext`

chứ **không phải `ActivePlan`**.

Một Plan chỉ tạo context card nếu nó thực sự có temporal relevance với hôm nay.

Có thể có nhiều context nhưng UI chỉ nên show 1–2 context quan trọng nhất.

Đây là feature khiến Go Plan thể hiện rõ lợi thế multi-plan.

**STOP → review riêng Travel/Wedding/general Plan.**

---

# Phase 5 — Motion & Final Composition

Đến đây content architecture mới ổn định.

Lúc này mới thêm animation.

### Initial load

Tôi đề xuất sequence:

```text
PageHeader          0ms
DailyBrief         40ms
Priority           80ms
Attention         120ms
Today             160ms
Progress          200ms
Active Context    240ms
Upcoming          280ms
Recently Done     320ms
```

Nhưng đây là **delay cap**, không phải mỗi card lại delay thêm 50ms.

Nếu có 20 cards tuyệt đối không stagger 20 lần.

### Motion

Mỗi major block:

```text
opacity: 0 → 1
translateY: 6px → 0
180–240ms
```

### Mobile `Xem thêm`

```text
height/content reveal
+
opacity
~200ms
```

### Desktop cards

Hover:

```text
translateY(-1px)
border emphasis
subtle elevation
```

### Progress

Bar fill once:

```text
0 → 43%
~400–500ms
```

### Accessibility

Bắt buộc honor:

```css
prefers-reduced-motion
```

Reduced motion → bỏ translate/stagger, gần như instant/fade tối thiểu.

---

# Thứ tự triển khai tôi khuyến nghị

Tóm lại:

| Phase | Feature                       | Value | Complexity |
| ----- | ----------------------------- | ----: | ---------: |
| **1** | Daily Brief + Matrix          | ★★★★★ |         ★★ |
| **2** | Priority Next                 | ★★★★★ |        ★★★ |
| **3** | Progress + Recently Completed |  ★★★★ |        ★★★ |
| **4** | Active Context                | ★★★★★ |       ★★★★ |
| **5** | Motion + final polish         |   ★★★ |         ★★ |

Tôi **không gộp Phase 1–4 thành một prompt lớn**. Chúng ta vừa trải qua khá nhiều vấn đề legacy rules/data với Today; mỗi phase nên có một điểm STOP rõ ràng để tránh AI tự mở rộng architecture ngoài ý muốn.

## Một lưu ý quan trọng về Daily Brief

Tôi còn muốn đi xa hơn matrix chỉ dựa vào số lượng.

Về lâu dài resolver có thể là:

```text
TODAY STATE
     │
     ├── Attention?
     │      └── overdue-focused brief
     │
     ├── Active temporal context?
     │      └── trip/event-focused brief
     │
     ├── Heavy workload?
     │      └── workload-focused brief
     │
     ├── Progress high?
     │      └── progress-focused brief
     │
     └── Quiet day
            └── calm brief
```

Tức là **không random câu dẫn**. Today tự xác định:

> “Điều đáng nói nhất về ngày hôm nay là gì?”

rồi chọn copy tương ứng.

Đây là một foundation rất tốt để sau này Go Plan có assistant/AI thật mà không phải đập bỏ UI hiện tại.

Với trạng thái dự án hiện giờ, tôi sẽ **đợi Claude hoàn thành horizontal cards/mobile progressive disclosure trước**, review và đóng layout foundation; sau đó bắt đầu ngay **Phase 1 — Daily Brief + Matrix**. Không nên code V2 content song song khi layout V1 còn đang thay đổi.
