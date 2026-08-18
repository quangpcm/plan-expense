# CSV Import/Export cho Wedding Guest

## Context

Wedding Guest Management hiện quản lý khách mời hoàn toàn thủ công qua UI (tạo/sửa từng Guest, từng Invitation). Người dùng thực tế soạn danh sách khách trên Google Sheet trước, nên cần import CSV để không phải nhập tay lại toàn bộ, và export CSV để tải dữ liệu ra chỉnh sửa/lưu trữ ngoài app. Đây là tính năng đã được thiết kế kỹ qua trao đổi trước (xem lịch sử hội thoại) — chốt ở mức nghiệp vụ: 2 nút Import/Export cạnh "Thêm khách", chỉ hiển thị trên desktop, export theo nhóm hoặc toàn bộ, import có bước preview cho phép user quyết định Tạo mới/Đồng bộ/Bỏ qua theo từng Guest và từng Invitation trước khi commit.

Module đích: `src/modules/wedding-guest/`. Không có precedent CSV/file-download nào trong repo — đây là tính năng mới hoàn toàn, cần thêm 1 dependency (`papaparse`) và tự thiết kế luồng, nhưng tái sử dụng tối đa utils/service/repository pattern đã có.

## Mô hình nghiệp vụ đã chốt (tóm tắt để bám sát khi code)

- Export: mỗi dòng CSV = 1 `GuestInvitation` (không phải 1 Guest) — 1 guest ở 3 nhóm ra 3 dòng. Cột dùng **label tiếng Việt**, không dùng id.
- Cột: `Tên Nhóm Khách | Phía | Quan Hệ | Khách của | Tên khách mời | Trạng thái Xác Nhận | Số người dự kiến | Tiền mừng | Vàng mừng | Giá quy đổi vàng | Ghi chú`. Trong đó "Giá quy đổi vàng" ánh xạ tới field `goldGiftNote` (ghi chú giá vàng, KHÔNG phải tỷ giá quy đổi), "Ghi chú" ánh xạ `note`.
- Import: gộp các dòng cùng "định danh" (`normalizedName + sideId + relationshipId + invitedById`) thành 1 Guest unit + N invitation rows (1 dòng/nhóm).
- Nhóm khách trong CSV nếu chưa tồn tại → tự động tạo mới nhóm.
- Quyết định 2 cấp, lồng nhau:
  - **Cấp Guest** (định danh): `new` (không khớp ai) → Tạo mới/Bỏ qua (all-or-nothing); `high` (khớp tuyệt đối normalizedName+side+relationship+invitedBy) → tự động dùng guest đã có, không cần hỏi; `name_only` (trùng tên, khác thuộc tính khác) → bắt buộc chọn 1 trong 3: Cùng 1 khách (đồng bộ định danh) / Khác khách (tạo mới) / Bỏ qua.
  - **Cấp Invitation** (theo từng nhóm, chỉ áp dụng khi guest đã resolve về 1 guestId có sẵn): invitation chưa có ở nhóm đó → mặc định tick "Thêm vào nhóm"; invitation đã có và dữ liệu khác → hiện diff, bắt buộc chọn Đồng bộ/Bỏ qua (không có default); invitation đã có và dữ liệu **giống hệt** → hiển thị rõ "Không đổi" (theo yêu cầu minh bạch dữ liệu tiền/vàng), không cần thao tác nhưng vẫn hiện dòng.
  - "Đồng bộ" ở cấp Guest = ghi đè toàn bộ thông tin định danh (side/relationship/invitedBy) — ảnh hưởng plan-wide, không chỉ nhóm trong CSV.
- Dòng CSV lỗi (thiếu tên, label không nhận diện được, số không parse được, trùng guest+nhóm ngay trong file) → nhóm riêng "Không hợp lệ", loại khỏi commit.
- Số tiền/vàng: chấp nhận cả số thuần và có dấu chấm/phẩy phân cách hàng nghìn.

## Thiết kế kỹ thuật

### 1. Reverse-label lookup (constants)

`src/modules/wedding-guest/constants/wedding-guest-presets.ts` hiện có `getWeddingGuestSideLabel`/`getWeddingGuestRelationshipLabel`/`getWeddingGuestInvitedByLabel`/`getGuestRsvpLabel` (id → label). Thêm chiều ngược lại `getWeddingGuestSideIdByLabel`/`getWeddingGuestRelationshipIdByLabel`/`getWeddingGuestInvitedByIdByLabel`/`getGuestRsvpIdByLabel(label): id | null`, so khớp qua `normalizeVietnameseName` (từ `utils/normalize-name.ts`) để khoan dung hoa/thường và dấu.

### 2. Export (thuần client-side, không cần service/repository mới)

File mới `src/modules/wedding-guest/utils/wedding-guest-csv-export.ts`:
- `buildWeddingGuestCsv(guests, groups, invitations, options?: { groupId?: string }): string`
- Join `invitations` (lọc theo `groupId` nếu có) → `guests` (by `guestId`) → `groups` (by `groupId`), map qua các label-getter hiện có, dùng `Papa.unparse` để escape đúng (tên/ghi chú tiếng Việt có thể chứa dấu phẩy).
- Thêm BOM (`﻿`) trước khi tạo `Blob` để Excel mở đúng UTF-8.

Component mới `src/modules/wedding-guest/components/wedding-guest-export-dialog.tsx`: trigger button + `Dialog` (theo đúng convention overlay trong `member-avatar-picker.tsx`: `fixed inset-0 bg-slate-950/40` + backdrop-click-to-close + `Dialog` ở giữa) chứa 1 select "Tất cả nhóm" hoặc chọn 1 nhóm cụ thể từ `groups`, nút "Tải xuống" tạo Blob + link `download` ẩn rồi click.

### 3. Import — parsing & matching (pure utils, dễ test)

File mới `src/modules/wedding-guest/types/wedding-guest-import.ts`: định nghĩa `ImportInvitationRowStatus = 'create' | 'sync_available' | 'unchanged' | 'invalid'`, `ImportGuestMatchStatus = 'new' | 'high' | 'name_only'`, `ImportGuestUnit`, `ImportInvitationRow` (xem cấu trúc đã bàn ở phần brainstorm: mỗi `ImportGuestUnit` gồm identity + `matchStatus` + `candidateMatches: WeddingGuestDocument[]` + `guestDecision` + mảng `invitations: ImportInvitationRow[]`, mỗi row có `groupNameRaw`, `resolvedGroupId | null`, `isNewGroup`, parsed fields, `existingInvitation | null`, `status`, `diff`, `validationError?`, `selectedAction?`).

File mới `src/modules/wedding-guest/utils/wedding-guest-csv-import.ts`:
- `parseWeddingGuestCsv(rawText: string): { rows: RawImportRow[]; errors: RowParseError[] }` — dùng `Papa.parse(rawText, { header: true, skipEmptyLines: true })`, map header theo tên cột (không theo thứ tự) qua bảng alias cố định, validate + convert từng ô (label→id qua §1, số qua parser chấp nhận `.`/`,`, RSVP rỗng→`pending` mặc định, số người rỗng→`1`).
- `buildImportPreview(rawRows, existingGuests, existingGroups, existingInvitations): ImportGuestUnit[]` — gộp rows theo identity key, với mỗi unit gọi `findDuplicateGuestMatches` (đã có ở `utils/guest-duplicate.ts`) để set `matchStatus`/`candidateMatches`; với mỗi invitation row, so khớp group theo `normalizeVietnameseName(name)` với `existingGroups`, và so khớp invitation có sẵn qua `(resolvedGuestId, resolvedGroupId)` trong `existingInvitations` để tính `status` (`create`/`sync_available`/`unchanged`) bằng cách diff field-by-field.
- Số tiền/vàng parser dùng chung 1 hàm nhỏ: strip mọi ký tự `.`/`,` rồi `parseInt`, invalid nếu phần còn lại không phải toàn chữ số.

### 4. Import — Preview UI

`src/modules/wedding-guest/components/wedding-guest-import-dialog.tsx` — wizard 3 bước trong 1 `Dialog` lớn (desktop-only, theo overlay convention §2):
1. **Upload**: input file ẩn `accept=".csv"` (theo pattern hidden-input của `src/modules/storage/components/attachment-picker.tsx`), đọc bằng `FileReader.readAsText`.
2. **Preview**: `wedding-guest-import-preview-table.tsx` — bảng lồng Guest → Invitation rows đúng theo mock đã thống nhất; mỗi Guest có badge trạng thái (tái dùng style badge từ `guest-duplicate.ts`/`GuestDuplicateSuggestList` nếu phù hợp), phần `name_only` hiện 3 lựa chọn (radio), phần invitation hiện checkbox/toggle Đồng bộ-Bỏ qua khi `sync_available`, dòng "Không đổi" hiển thị mờ nhưng vẫn có mặt. Có nút bulk "Chọn tất cả mới"/"Đồng bộ tất cả thay đổi". Nút "Xác nhận import" disable nếu còn `ImportGuestUnit` `name_only` chưa chọn action.
3. **Kết quả**: tóm tắt số tạo mới / đồng bộ / bỏ qua / lỗi sau khi commit xong.

### 5. Import — Commit (service + repository mới)

Cần thêm bulk-write vì hiện repository chỉ có CRUD từng cái:
- `repositories/wedding-guest.repository.ts` + Firestore impl: thêm `bulkCreateGuestsWithInvitations(inputs: CreateWeddingGuestPersistenceInput[])` — dùng lại đúng pattern chunked `writeBatch` với `CHUNK_SIZE = 450` đã có trong `deleteGuest`/`deleteGroup`, nhưng chunk theo **tổng số write op** (mỗi input = 2 ops: guest doc + invitation doc), không theo số input.
- `repositories/guest-invitation.repository.ts` + Firestore impl: thêm `bulkUpsertInvitations(...)` cho case "thêm invitation cho guest đã có" (set mới, dùng id `${guestId}_${groupId}` để nhất quán) và case "đồng bộ" (update).
- Service mới `services/wedding-guest-import.service.ts` (`WeddingGuestImportService`), khởi tạo cùng chỗ với các service khác trong `services/index.ts`. Method `commitImport(plan, planId, resolvedUnits, currentMember)`:
  1. Gọi `assertEditablePlan`/`assertManageWeddingGuestPermission` một lần (giống các service khác).
  2. Tạo các nhóm mới còn thiếu trước (loop nhỏ, gọi tuần tự `weddingGuestGroupService.createGroup` — số lượng nhóm mới thường rất ít, không cần bulk) để lấy `groupId` thật trước khi build write-plan cuối.
  3. Với mỗi `ImportGuestUnit` theo `guestDecision`: `create_new`/`name_only+"khác khách"` → gom vào batch cho `bulkCreateGuestsWithInvitations`; `use_existing_sync` → gọi `updateGuest` (đồng bộ định danh) rồi gom các invitation rows đã chọn action vào `bulkUpsertInvitations`; `use_existing_no_sync`/`high` → chỉ gom các invitation rows đã chọn action; `skip` → bỏ qua toàn bộ.
  4. Trả về summary `{ createdGuestCount, createdInvitationCount, syncedInvitationCount, syncedGuestCount, skippedCount }` để hiển thị bước 3.

### 6. Wiring vào UI

`src/modules/wedding-guest/components/wedding-guest-panel.tsx`: thêm 2 `Button` (`Import`, `Export`) cạnh nút "Thêm khách" hiện có ở dòng ~544-551, cùng class `hidden shrink-0 lg:inline-flex` (không cần `useMediaQuery`, dùng đúng convention CSS-only hiện tại), điều kiện hiện thị theo `canManage` (KHÔNG phụ thuộc `activeGroupId` như nút "Thêm khách", vì import/export áp dụng toàn plan hoặc theo nhóm được chọn trong dialog riêng). Dùng `next/dynamic(() => import('...'), { ssr: false })` để lazy-load 2 dialog + `papaparse` chỉ khi user thực sự mở, tránh phình bundle chính.

### Dependency mới

Thêm `papaparse` (+ `@types/papaparse` nếu cần) vào `package.json`.

### Giới hạn/known trade-off (không block MVP)

- Không dùng `runTransaction`, chỉ `writeBatch` — nhất quán với phần còn lại của module, nhưng nghĩa là race-condition giữa lúc preview và lúc confirm (VD người khác vừa tạo guest trùng) không được khóa tuyệt đối; chấp nhận vì đây vốn đã là đặc điểm chung của cả module, không phải rủi ro mới.
- Không thêm toast/notification framework mới — dùng lại inline `AuthFormMessage` pattern đã có trong `wedding-guest-panel.tsx` cho lỗi, và bước 3 (kết quả) của wizard đóng vai trò thông báo thành công.

## Files cần tạo

- `src/modules/wedding-guest/constants/wedding-guest-presets.ts` (sửa — thêm reverse lookup)
- `src/modules/wedding-guest/types/wedding-guest-import.ts` (mới)
- `src/modules/wedding-guest/utils/wedding-guest-csv-export.ts` (mới)
- `src/modules/wedding-guest/utils/wedding-guest-csv-import.ts` (mới)
- `src/modules/wedding-guest/components/wedding-guest-export-dialog.tsx` (mới)
- `src/modules/wedding-guest/components/wedding-guest-import-dialog.tsx` (mới)
- `src/modules/wedding-guest/components/wedding-guest-import-preview-table.tsx` (mới)
- `src/modules/wedding-guest/repositories/wedding-guest.repository.ts` + `firestore-wedding-guest.repository.ts` (sửa — thêm bulk method)
- `src/modules/wedding-guest/repositories/guest-invitation.repository.ts` + `firestore-guest-invitation.repository.ts` (sửa — thêm bulk method)
- `src/modules/wedding-guest/services/wedding-guest-import.service.ts` (mới) + `services/index.ts` (sửa — wiring)
- `src/modules/wedding-guest/components/wedding-guest-panel.tsx` (sửa — thêm 2 nút)
- `src/modules/wedding-guest/index.ts` (sửa — export mới nếu cần dùng ngoài module)
- `package.json` (thêm `papaparse`)

## Kiểm thử

- Unit test (vitest, theo convention phẳng `tests/unit/*.test.ts`): `tests/unit/wedding-guest-csv-export.test.ts` (đúng cột, đúng label, đúng số dòng theo invitation), `tests/unit/wedding-guest-csv-import.test.ts` (gộp nhiều dòng cùng guest, phát hiện `high`/`name_only`/`new`, phát hiện nhóm mới, phát hiện dòng lỗi, parser số tiền chấp nhận cả 2 format).
- Chạy `npm run typecheck` và `npm run lint`.
- Manual QA trên desktop viewport: export toàn bộ → mở lại bằng chính import → toàn bộ hiện "Không đổi"; sửa 1 dòng CSV (đổi RSVP) → import lại → đúng 1 dòng "có thay đổi" cần chọn Đồng bộ; thêm 1 dòng guest hoàn toàn mới với nhóm chưa tồn tại → thấy nhóm mới được tạo + guest mới sau khi confirm; thử trên mobile viewport (< lg) → 2 nút Import/Export không hiển thị.
