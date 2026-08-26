# Go Plan — Quy ước Dialog/BottomSheet thay Page

Đây là **quyết định đã chốt** về cách hiển thị form tạo/sửa và các popup trong app. Coi nội
dung này là source of truth khi implement feature mới — nếu một case cụ thể không rõ có thuộc
phạm vi rule này hay không, hỏi lại thay vì tự suy đoán.

> Tài liệu này giữ nguyên vai trò source of truth cho **quy ước product** (page vs. modal). Chi
> tiết kiến trúc overlay (focus lifecycle, size contract, nested chains, lý do BottomSheet bị
> deprecate...) nay ở `docs/design-system/OverlayRules.md` — đây là tài liệu canonical cho phần
> đó, xem thêm `docs/design-system/README.md` cho toàn bộ Design System governance.

---

# 1. Rule

> **Tạo/thêm/sửa Plan, Milestone, Todo, Vendor, Transaction (expense/income/debt) không bao giờ
> route qua một page riêng. Luôn hiển thị dưới dạng Dialog (desktop) / BottomSheet (mobile).**

Page trong app chỉ dành cho 3 nhóm:

- Danh sách Plan (`/plans`)
- Chi tiết Plan (`/plans/[planId]`, dùng `?tab=` để giữ trạng thái tab)
- Profile (`/profile`)

Các page khác đã có từ trước (login/register/forgot-password, invite link, `/plans/archived`,
`/settings`) không bị rule này chi phối — rule chỉ nói về **form tạo/sửa**, không bắt xoá mọi page
khác trong app.

Query param chỉ dùng khi cần thiết thật (deep-link, share, giữ trạng thái qua reload — ví dụ
`?tab=finance`), không nhúng dữ liệu nhạy cảm vào URL.

---

# 2. Component dùng để implement

Không tự viết tay cặp `Dialog` (`src/shared/components/ui/dialog.tsx`) +
`BottomSheet` (`src/shared/components/ui/bottom-sheet.tsx`) rồi bọc bằng `hidden md:flex` /
`md:hidden` — cách này lặp JSX nội dung 2 lần và dễ lệch giữa 2 bản.

## Form tạo/sửa → `ResponsiveModal`

`src/shared/components/ui/responsive-modal.tsx` — tự chọn Radix `Dialog` (desktop, từ
breakpoint `768px`) hoặc `vaul` `Drawer` (mobile) bằng `useMediaQuery`, chỉ render nội dung
**một lần duy nhất**.

```tsx
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';

<ResponsiveModal
  open={showForm}
  onOpenChange={(next) => {
    if (!next) closeForm();
  }}
  title="Thêm khoản chi"
  description="Không bắt buộc"
>
  <SomeForm onSuccess={closeForm} onCancel={closeForm} />
</ResponsiveModal>
```

Lưu ý: `ResponsiveModal` nhận `onOpenChange(open: boolean)`, không phải `onClose()` — nếu form
con dùng `onClose`/`onCancel`, bọc lại như ví dụ trên.

`ResponsiveModal` có prop `size?: 'sm' | 'md' | 'lg' | 'xl'` (desktop-only — mobile Drawer luôn
full-width, `size` không có tác dụng ở mobile). Bỏ qua `size` giữ nguyên hành vi cũ (không giới
hạn max-width trừ khi tự truyền `className`). Dùng `size` khi nội dung không cần chiếm gần hết
chiều rộng viewport trên desktop — xem `03.OverlayArchitecture.Amendment2.Report.md` để biết bảng
mapping `sm/md/lg/xl` → `max-w-md/xl/2xl/4xl` và ví dụ đã áp dụng (Wedding Guest quick-add/edit/
group-manager/export).

Form component bên trong (`MilestoneForm`, `TodoForm`, `TodoVendorForm`, `EditPlanForm`,
`ExpenseForm`, `IncomeForm`, `CreatePlanForm`, `TravelActivityForm`...) phải nhận
`onSuccess`/`onCancel` (hoặc `onClose`) qua props — **không tự điều hướng bằng `router.push`/
`router.replace`/`<Button href>` bên trong form**. Điều hướng sau khi thành công (nếu cần) do nơi
gọi `ResponsiveModal` quyết định.

## Xác nhận hành động phá hủy → `ConfirmDialog`

`src/shared/components/ui/confirm-dialog.tsx` — cùng cơ chế responsive (Radix `AlertDialog`
desktop / Drawer mobile), dùng cho xoá/đóng/archive/complete plan... Xem 5 chỗ đã dùng đúng trong
`src/app/(authenticated)/plans/[planId]/page.tsx` (xoá plan, đóng plan, hoàn thành plan, lưu trữ
plan, rời/xoá plan).

---

# 3. Nơi tham khảo (đã áp dụng đúng)

Tất cả trong `src/app/(authenticated)/plans/[planId]/page.tsx`:

- Form Milestone, Todo, Vendor, Edit-plan, Expense, Income, Travel activity, Plan settings, Plan
  lock (passcode) — mỗi cái 1 `ResponsiveModal`.
- Todo detail (`TodoDetailView`), Expense detail (`ExpenseDetailCard`), Income detail
  (`IncomeDetailCard`) — cũng 1 `ResponsiveModal` mỗi loại, không phải page riêng.
- Tạo Plan: `src/app/(authenticated)/plans/page.tsx` — `CreatePlanCard`/nút "+" mở
  `ResponsiveModal` bọc `CreatePlanForm`, không còn route `/plans/new`.
- Profile popup: `src/modules/user/components/display-name-sheet.tsx`,
  `src/modules/user/components/passcode-sheet.tsx` — dùng `ResponsiveModal`.

---

# 4. Khi nào KHÔNG áp dụng rule này

- Menu/popover đơn giản không phải form (ví dụ menu 3-chấm của Header) — có thể tự chọn cách hiển
  thị khác, không bắt buộc `ResponsiveModal`.
- Drilldown/xem dữ liệu thuần túy không có hành động tạo/sửa (ví dụ bảng chi tiêu của 1 thành
  viên) — có thể dùng `BottomSheet` đơn giản, **nhưng chỉ khi trường hợp đó không thể đồng thời
  tồn tại với, chứa, hoặc bị chứa trong một `ResponsiveModal` khác** (xem rule mới ngay dưới đây).
- Nếu không chắc 1 case có thuộc "form tạo/sửa" hay không, hỏi lại trước khi chọn cách implement.

## 4.1 Rule bắt buộc: BottomSheet không được đứng trong một chuỗi overlay có ResponsiveModal

Root cause (Overlay Architecture Amendment #2, Bug 2 — xem
`03.OverlayArchitecture.Amendment2.PreCode.md` và `.Report.md`): `BottomSheet` là component tự
viết tay, không đăng ký với Radix's `DismissableLayerContext` như `ResponsiveModal` (Dialog/Drawer)
làm. Khi bất kỳ `ResponsiveModal` nào đang mở, Radix/vaul set
`document.body.style.pointerEvents = 'none'` toàn cục để chỉ layer cao nhất được tương tác —
`BottomSheet` không có cơ chế được "miễn trừ" khỏi việc này, nên toàn bộ nội dung của nó (kể cả
nút đóng riêng) trở nên hoàn toàn không thể bấm được ngay khi có một `ResponsiveModal` khác cùng
tồn tại, bất kể `BottomSheet` mở trước hay sau. Đây là lỗi thật đã xác nhận bằng đo lường trực
tiếp (`pointer-events` tính toán, không phải suy đoán), không phải lỗi z-index đơn thuần.

> **Một `BottomSheet` chỉ được giữ lại cho menu/drilldown đọc-thuần-túy khi nó KHÔNG THỂ đồng thời
> tồn tại với, mở ra, hoặc bị mở ra từ bên trong một `ResponsiveModal`. Nếu có thể — dù chỉ một
> đường dẫn thực tế duy nhất — nó phải dùng `ResponsiveModal` để mọi layer overlay cùng tham gia
> chung một hệ thống điều phối (Radix `DismissableLayerContext` / vaul).**

Không giải quyết bằng cách tăng z-index hay override `pointer-events` thủ công — đó là vá triệu
chứng, không sửa nguyên nhân (component không tham gia hệ thống điều phối chung).

Ví dụ đã áp dụng: 2 drilldown thống kê trong
`src/app/(authenticated)/plans/[planId]/page.tsx` (`statisticMemberDrilldown`,
`statisticMilestoneMemberDrilldown`) từng là `BottomSheet` KEEP theo rule cũ (drilldown đọc-thuần-
túy), nhưng vì mỗi dòng trong đó có thể mở tiếp `ResponsiveModal` "Chi tiết khoản chi" — nên đã
migrate sang `ResponsiveModal` (Amendment #2). Các `BottomSheet` KEEP khác (menu 3-chấm ở Header,
drilldown milestone-expense của `PlanningTab`, menu "⋮" của `member-actions-menu.tsx`) **không**
đổi — chúng không bao giờ mở một `ResponsiveModal` từ bên trong, nên rule mới không áp dụng.
