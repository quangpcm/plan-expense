# Go Plan — Quy ước Dialog/BottomSheet thay Page

Đây là **quyết định đã chốt** về cách hiển thị form tạo/sửa và các popup trong app. Coi nội
dung này là source of truth khi implement feature mới — nếu một case cụ thể không rõ có thuộc
phạm vi rule này hay không, hỏi lại thay vì tự suy đoán.

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
  viên) — có thể dùng `BottomSheet` đơn giản nếu không cần khác biệt desktop/mobile.
- Nếu không chắc 1 case có thuộc "form tạo/sửa" hay không, hỏi lại trước khi chọn cách implement.
