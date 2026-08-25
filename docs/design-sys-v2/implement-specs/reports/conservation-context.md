# Design System V2 — Conversation Context Snapshot

**Mục đích của file này:** tóm tắt toàn bộ ngữ cảnh của quá trình triển khai Design System V2
tính đến thời điểm hiện tại, để có thể mở một thread chat mới và tiếp tục công việc mà không mất
ngữ cảnh chính. File này KHÔNG thay thế các báo cáo chi tiết trong `reports/` — nó là bản đồ định
hướng, còn chi tiết đầy đủ (evidence, code snippet, lý do quyết định) vẫn nằm trong từng report.

**Cập nhật lần cuối:** 2026-08-25, ngay sau khi **Wave 0 (Rollout — Plan Detail Shell overlay
cleanup) đạt APPROVE**. Đây là bản cập nhật lớn so với bản trước (bản trước dừng ở "Pilot #1 FINAL
PASS, Pilot #2 chưa mở").

---

## 1. Dự án này là gì

Ứng dụng: **Go Plan** (`plan-expense`) — Next.js 16 (App Router, webpack build), React 19,
TypeScript (`exactOptionalPropertyTypes: true`), Tailwind CSS v4 (CSS-first config qua `@theme`
trong `src/styles/globals.css`, không có `tailwind.config.js`).

Công việc đang làm: triển khai **Design System V2** theo một kế hoạch nhiều "Wave", được mô tả
đầy đủ trong:

```
docs/design-sys-v2/implement-specs/1.AuditSpecification.md
docs/design-sys-v2/implement-specs/2.CodebaseAuditReport.md
docs/design-sys-v2/implement-specs/3.AuditDecisionRecord.md   ← nguồn quyết định gốc, có đánh số §
docs/design-sys-v2/implement-specs/4.ImplementationMasterPlan.md
docs/design-sys-v2/implement-specs/implement/01..08.*.md      ← spec chi tiết từng Wave/Pilot/Rollout
docs/design-sys-v2/implement-specs/reports/*.Report.md        ← báo cáo đã hoàn thành từng Wave/Pilot
docs/ui-modal-conventions.md                                  ← quy ước Dialog/BottomSheet (source of truth)
```

Kiến trúc phân lớp (chỉ được phụ thuộc một chiều, từ trên xuống):

```
Foundation → Core Primitives → Overlay Architecture → Structural Components
→ Core Patterns → Product Composition (Pilot Migration) → Rollout
```

## 2. Toàn bộ dự án đã trải qua HAI quy trình làm việc khác nhau, theo hai giai đoạn

### 2.1 Giai đoạn Foundation → Pilot (Wave 1 đến hết Pilot #3) — quy trình NẶNG

```
1. Đọc spec Wave/Pilot hiện tại.
2. Viết Pre-Code Manifest (chỉ nghiên cứu, KHÔNG code) → user review, approve thẳng hoặc kèm
   "implementation overrides".
3. Implement đúng phạm vi đã duyệt.
4. npm run typecheck → lint → test → build (npm run build/tsc đầy đủ mới là type-check có thẩm
   quyền cuối cùng — typecheck webpack-mode không bắt hết lỗi exactOptionalPropertyTypes).
5. Browser verification qua harness Playwright cô lập (xem mục 2.3).
6. Viết Report đầy đủ theo format chuẩn → reports/.
7. STOP — không tự mở Wave/Pilot tiếp theo, chờ user review/lock.
```

### 2.2 Giai đoạn Rollout (từ sau khi Pilot #3 khoá FINAL PASS) — quy trình NHẸ, ĐANG ÁP DỤNG

User đã **chủ động yêu cầu bỏ mô hình nặng ở trên** sau khi 3 Pilot chứng minh Design System đã đủ
trưởng thành (không cần Pilot #4). Quy trình mới, đang là quy trình hiện hành:

```
Wave mở (user cấp phạm vi + autonomy, KHÔNG cần Pre-Code riêng để duyệt)
  ↓
Bounded inventory ngắn (đếm thật số lượng/ file, KHÔNG suy đoán từ tên module)
  ↓
Implementation
  ↓
Automated regression: typecheck → lint → test → build
  ↓
Targeted P0/P1 verification (chỉ risk thật liên quan tới đúng phần đã sửa; KHÔNG làm ma trận
  screenshot toàn diện, KHÔNG đo spacing, KHÔNG audit pixel-perfect, KHÔNG test responsive không
  liên quan)
  ↓
Report ngắn gọn (không phải Pre-Code + Report riêng như trước) → reports/
  ↓
STOP sau mỗi Wave — chờ user duyệt trước khi mở Wave tiếp theo
```

**5 điều kiện STOP bắt buộc** (không đổi giữa 2 giai đoạn, luôn có hiệu lực dù đang ở quy trình
nhẹ):
```
- Phát hiện rủi ro business invariant
- Cần thay đổi permission hoặc data model
- Cần thay đổi API công khai của Design System (prop mới, component mới, đổi contract)
- Cần một abstraction/token family mới trong Design System
- Phát hiện kiến trúc bất ngờ (domain leakage, God component, prop explosion)
```

### 2.3 Phương pháp browser verification (dùng xuyên suốt cả 2 giai đoạn, khi cần)

- Cài `playwright-core@1.62.1` **trong thư mục scratchpad ngoài project** (KHÔNG thêm vào
  `package.json` của product), tái sử dụng Chromium binary đã cache sẵn tại
  `~/Library/Caches/ms-playwright/chromium-1234`.
- Route tạm thời `src/app/*-verify-temp/page.tsx`, đặt **ngoài** route group `(authenticated)` để
  né `AuthGuard`.
- Mock data dựng tay trực tiếp trong route tạm — **tuyệt đối không ghi dữ liệu test vào Firestore
  project thật** (không có emulator).
- Tương tác bàn phím thật (Tab/Enter/Escape, `.focus()` + `Enter` khi cần), không chỉ dựa vào
  `.click()`.
- Với vấn đề liên quan tới focus/timing: verify cả trên `next dev` LẪN production build
  (`npm run build && npm run start -p 3010`) — timing có thể khác nhau giữa 2 mode.
- **Dọn sạch hoàn toàn** route tạm + `.next` cache trước khi coi Wave/Pilot là xong.
- `next-env.d.ts` và `tsconfig.tsbuildinfo` là build artifact tự sinh khi chạy `build`/`typecheck`
  — luôn `git checkout --` lại 2 file này sau mỗi lần verify, không để lẫn vào diff.

**Giới hạn đã biết của phương pháp này:** `renderToStaticMarkup` (unit test stack duy nhất của dự
án — không có jsdom/@testing-library) KHÔNG thể assert nội dung render qua Portal
(`Dialog.Portal`/`Drawer.Portal`/`AlertDialog.Portal` bị loại hoàn toàn khỏi SSR string output) —
test cho `ResponsiveModal`/`ConfirmDialog` chỉ còn "render-without-throwing", bằng chứng thật nằm ở
phần Browser Verification trong report tương ứng.

## 3. Trạng thái hiện tại (ledger chính thức)

```
01 Foundation                          ✓ FINAL PASS
02 Core Primitives                     ✓ FINAL PASS
03 Overlay Architecture                ✓ FINAL PASS (+ Focus Return Fix, FINAL PASS)
04 Structural Components               ✓ FINAL PASS
05 Core Patterns                       ✓ FINAL PASS

Pilot #1 — Wedding Overview            ✓ FINAL PASS / APPROVE ROLLOUT
Pilot #2 — Dashboard                   ✓ FINAL PASS / APPROVE ROLLOUT
STOP/GO System Review (ADR §28)        ✓ CONDITIONAL GO → sau khi fix focus-return → GO
Pilot #3 — Wedding Guest               ✓ FINAL PASS / APPROVE ROLLOUT

>>> Pilot Phase: COMPLETE. Không cần Pilot #4. <<<

07 Rollout Execution Plan              ✓ APPROVED — thứ tự Wave đã khoá (xem mục 6)
Rollout Wave 0 — Plan Detail Shell     ✓ APPROVE (vừa xong, ngay trước khi viết file này)
Rollout Wave 1 — R1 low-risk modules   ❌ CHƯA MỞ — bước tiếp theo
```

## 4. Tóm tắt các Wave nền tảng (01–05) — đã xong từ lâu, chỉ cần biết để tránh phá vỡ quyết định cũ

### Wave 1 — Foundation
- Nguyên tắc **exact-alias**: chỉ đổi tên biến CSS thô sang token semantic khi giá trị **giống hệt
  byte-for-byte** (vd `--color-muted` → `--color-text-secondary`, KHÔNG phải
  `--color-text-muted`). Không bao giờ ép mapping không chính xác. Màu Tailwind thô `slate-*` không
  có tương đương Foundation → giữ nguyên xuyên suốt toàn dự án, đây là gap đã biết, không phải lỗi.
- Xoá `--shadow-raised` (tự bịa, không nguồn). Remap `.text-caption` 11px (tự bịa) → 12px đúng.

### Wave 2 — Core Primitives
- Xoá `Button size="icon"` (chưa có consumer thật lúc đó — **tình trạng này đã thay đổi, xem mục
  6.3**).
- Button hiện có `sm`/`md` (+ `destructive` variant được thêm sau, harvest từ ConfirmDialog).

### Wave 3 — Overlay Architecture
- `ResponsiveModal` (Dialog desktop / Drawer mobile qua `useMediaQuery('(min-width: 768px)')`) và
  `ConfirmDialog` (AlertDialog desktop / Drawer mobile) là 2 primitive overlay chuẩn.
- **Bug nghiêm trọng phát hiện SAU Wave 3, fix ở giai đoạn riêng (xem mục 5.3):** focus không quay
  lại đúng trigger khi đóng overlay.

### Wave 4 — Structural Components
- `Card` **giữ nguyên legacy recipe** (`--radius-card` 24px + shadow gốc), đánh dấu
  `TEMPORARY LEGACY COMPATIBILITY` trong code — quyết định này **vẫn đang có hiệu lực**, không đổi
  default vì có quá nhiều consumer (58+) chưa được review từng cái. Mỗi consumer tự migrate/
  override className cục bộ khi tới lượt review (đã áp dụng ở cả 3 Pilot).
- `npm run build` (chạy `tsc` đầy đủ) là type-check có thẩm quyền cuối cùng, `npm run typecheck`
  (webpack mode) không bắt hết `exactOptionalPropertyTypes`.

### Wave 5 — Core Patterns
- `EntityList`, `FilterBar`, `PageHeader` là 3 component rủi ro cao nhất phase này (data/query
  risk, DSL risk, permission-leakage risk) — đã qua FINAL PASS.

## 5. Ba Pilot đã hoàn thành — evidence chính, không lặp lại chi tiết đầy đủ (xem report gốc)

### 5.1 Pilot #1 — Wedding Overview (report: `06.PilotMigration.WeddingOverview.Report.md`)
- Đúng 1 file: `overview-widget-registry.wedding.tsx`.
- `AttentionItemRow` **GIỮ CUSTOM** — đã đánh giá kỹ, compose vào `DataRow` sẽ phải override gần
  hết, không đơn giản hoá được gì. Đây là ví dụ REJECT đầu tiên.
- 1 lỗi pre-existing phát hiện & fix lúc browser-verify: thiếu `min-w-0` ở **cả 2** tổ tiên (flex
  item VÀ Grid item — dễ quên vì hay chỉ nhớ flex) khiến `truncate` không có tác dụng.
- 2 finding DS được ghi nhận, KHÔNG hành động ngay: thiếu "text-link" footprint chuẩn cho
  `ViewAllAction` (→ về sau thành TextAction), thiếu `Progress` primitive.

### 5.2 Pilot #2 — Dashboard (report: `06.PilotMigration.Dashboard.Report.md`)
- Files: `plans/page.tsx`, `plan-card.tsx`, `create-plan-form.tsx`, `todo-attention-section.tsx`,
  `todo-notification-screen.tsx`, `todo/utils/todo-urgency.ts` (mới).
- **`PlanCard → Metric` bị REJECT** — lý do cụ thể: label/supporting color role bị đảo ngược so với
  Metric's contract. Đây là bằng chứng thứ 2 cho nguyên tắc "đừng ép adoption".
- "Todo urgency-tone duplication" — đã RESOLVED trong chính Pilot này (không phải finding còn mở).

### 5.3 STOP/GO System Review (ADR §28) — report: `07.StopGoSystemReview.md`
- Disposition ban đầu: **CONDITIONAL GO**, 1 blocker bắt buộc fix trước khi mở Pilot #3:
  **ResponsiveModal/ConfirmDialog không trả focus đúng trigger khi đóng**.
- **Root cause thật** (report riêng: `03.OverlayArchitecture.FocusReturnFix.Report.md`): Radix's
  `DialogContentModal`/`AlertDialogContent` có sẵn `onCloseAutoFocus` override gọi
  `context.triggerRef.current?.focus()` — nhưng `triggerRef` chỉ được set qua subcomponent
  `Dialog.Trigger`/`AlertDialog.Trigger`, mà `ResponsiveModal`/`ConfirmDialog` không dùng (chúng là
  fully-controlled, mở từ element bất kỳ bên ngoài) → `triggerRef` luôn `null` → focus rơi im lặng
  về `<body>`.
- **Fix đã áp dụng** (đang có hiệu lực trong code hiện tại): dùng pattern "adjusting state during
  render" của React chính thức (`useState` so sánh `open` trước/sau, KHÔNG ghi `ref` lúc render vì
  React Compiler's lint `react-hooks/refs` cấm) để tự capture `document.activeElement` lúc mở, rồi
  trả về qua đúng extension point `onCloseAutoFocus` mà Radix/vaul hỗ trợ sẵn — không hack
  `setTimeout`/`useEffect`.
- Sau khi fix + verify ma trận đầy đủ (component × desktop/mobile × dev/prod × Escape/close-button)
  → **GO chính thức**, mở khoá Pilot #3.
- Finding không-chặn khác được ghi nhận ở review này: `Button size="icon"` đã đủ bằng chứng (lúc đó
  2 data point: Dashboard bell + ...), Plan-Type Expression token, TextAction, NotificationBadge,
  bottom-panel abstraction — tất cả **defer**, không tự bịa.

### 5.4 Pilot #3 — Wedding Guest (report: `06.PilotMigration.WeddingGuest.Report.md`)
- Files: `wedding-guest-panel.tsx`, `wedding-guest-export-dialog.tsx`,
  `wedding-guest-filter-bar.tsx`, `wedding-guest-stat-tiles.tsx` — CHỈ 4 file presentation, không
  đụng service/repository/hook/type/schema.
- Migrate 4 `BottomSheet` + 1 `Dialog` (export) + 3 `window.confirm` → `ResponsiveModal`/
  `ConfirmDialog`, dùng pattern **request/perform split** (vd `requestDeleteGuest`/
  `performDeleteGuest`) — đây là pattern chuẩn được tái sử dụng lại ở Rollout Wave 0.
- **`WeddingGuestList → DataRow` bị REJECT** — theo đúng hướng dẫn tài liệu của chính `DataRow`: đã
  có action button riêng ở trailing, ép interactivity vào sẽ xung đột.
- `WeddingGuestStatTiles → Metric`/`MetricGroup` **ĐƯỢC CHẤP NHẬN** (khác PlanCard) vì tile này
  không có dòng "supporting" thứ 3 gây đảo ngược role như PlanCard.
- Business invariant đã verify bằng hành vi thật (không chỉ code review): guest count ≠ attendee
  count, tiền mừng ≠ vàng mừng (không bao giờ gộp), permission gating, Cancel = zero mutation /
  Confirm = đúng 1 lần.
- Import Dialog (`wedding-guest-import-dialog.tsx`) **DEFER có chủ đích** — `ResponsiveModal` chưa
  có size contract cho bảng preview rộng 3 bước — đây KHÔNG phải sót, đã track trong registry
  Rollout (mục 6).

### 5.5 Nguyên tắc rút ra sau 3 Pilot (user tự phát biểu, đã trở thành nguyên tắc chính thức)
> **Migration success ≠ số lượng V2 component được sử dụng.**
`PlanCard → Metric` bị reject. `WeddingGuestList → DataRow` bị reject. Import Dialog được defer.
Overlay migration (BottomSheet/Dialog/window.confirm → ResponsiveModal/ConfirmDialog) được chứng
minh **3 lần độc lập, zero regression** — đây là pattern rủi ro thấp nhất, nên dẫn đầu Rollout chứ
không theo sau.

## 6. Rollout Execution Plan (report: `07.RolloutExecutionPlan.md`) — ĐÃ ĐƯỢC USER APPROVE, thứ tự Wave đã KHOÁ

Đây là tài liệu tổng hợp bằng chứng của cả 3 Pilot + `07.RolloutStrategy.md` gốc thành một chuỗi
Wave thực tế cho toàn app (không phải "đọc spec rồi mass-migrate"). **Thứ tự Wave dưới đây đã được
user khoá, không tự đổi thứ tự nếu không có lý do mới xuất hiện lúc mở Wave đó.**

```
Wave 0  Plan Detail Shell overlay cleanup      R2   ✓ APPROVE (vừa xong)
Wave 1  storage/user/auth/invitation           R1   ← BƯỚC TIẾP THEO
Wave 2  expense/milestone/planning/income      R2   (có thể tách 2 sub-wave nếu inventory lớn hơn dự kiến)
Wave 3  travel-activity                        R2   (tách riêng — có guardrail semantic chronological/category riêng)
Wave 4  member                                 R3   (permission-heavy, 1 wave riêng)
Wave 5  debt-tracking                          R3   (tách riêng khỏi member dù cùng tier)
Wave 6  statistic                              R4   (Card + raw-color nặng nhất app, presentation-only bắt buộc)
Wave 7  settlement                             R4   (tách riêng khỏi statistic dù cùng tier)
```

Nguyên tắc chi phối thứ tự này (từ `07.RolloutStrategy.md`, đã verify khớp với evidence 3 Pilot):
- Risk thấp trước, R3/R4 mỗi cái 1 wave riêng (không gộp 2 domain rủi ro cao vào 1 wave dù kỹ thuật
  giống nhau — vd member + debt-tracking không gộp).
- Không gộp module không liên quan chỉ để tăng throughput.
- **KHÔNG có wave "token/radius cleanup" riêng** — `07.RolloutStrategy.md` §68 cấm big-bang cleanup;
  dọn token/radius luôn nằm trong wave của chính surface đó khi đụng tới, đúng cách Dashboard/
  Wedding Guest/Wave 0 đã làm.

### 6.1 Legacy registry hiện tại (cập nhật sau Wave 0)

| Legacy | Thay bằng | Consumer còn lại | Trạng thái |
|---|---|---|---|
| `BottomSheet` | `ResponsiveModal` | 8 file / 6 module (debt-tracking×3, member×2, expense×1, planning×1, storage×1) — **không tính 3 BottomSheet trong Plan Detail Shell, đã reclassify KEEP** | ACTIVE, chờ Wave 1-5 |
| `Dialog` | `ResponsiveModal` | 1 file (`wedding-guest-import-dialog.tsx`) | BLOCKED — chờ `ResponsiveModal` có size contract cho nội dung rộng |
| `window.confirm` | `ConfirmDialog` | **0** trong `plans/[planId]/page.tsx` (Wave 0 đã xử lý hết 6/6) | Cần recheck các module khác lúc Wave 1-7 tới lượt |
| Raw Card 24/28px radius | `--radius-ds-lg` theo phân loại per-consumer | ~45 file ngoài Pilot | ACTIVE, dọn trong wave của từng surface, không mass-replace |

### 6.2 Rollout Wave 0 — Plan Detail Shell overlay cleanup (report: `07.RolloutWave0.PlanDetailShell.Report.md`) — VỪA XONG

- File duy nhất sửa: `src/app/(authenticated)/plans/[planId]/page.tsx`.
- **Bounded inventory thực tế khác với ước tính trong Execution Plan**: ước tính ban đầu "1
  BottomSheet + 1 window.confirm", thực tế đếm ra **6 window.confirm** và **3 BottomSheet**. Đây
  không phải STOP condition, chỉ là correction bình thường của bounded inventory (đúng tinh thần
  `07.RolloutStrategy.md` §9: "không lập kế hoạch rollout chỉ dựa vào tên module").
- Đối chiếu với `docs/ui-modal-conventions.md` §4 → cả 3 `BottomSheet` đều thuộc diện **exempt rõ
  ràng** (menu 3-chấm của Header; 2 drilldown xem-thuần-tuý của thống kê) → **KEEP**, không migrate.
- 6 `window.confirm` (xoá travel activity / milestone / vendor / todo / expense / income) → migrate
  hết sang `ConfirmDialog`, dùng đúng pattern request/perform đã chứng minh ở Pilot #3.
- Business/permission/data: **KHÔNG đổi** — cùng service call, cùng argument, cùng guard `if
  (!user) return` (đã cố tình giữ nguyên vị trí guard này ở đầu `requestDeleteX`, y hệt handler cũ,
  sau khi tự phát hiện thiếu ở lượt viết code đầu tiên — xem mục 6.2.1 bên dưới).
- Thêm 1 state loading mới (`isDeletingTravelActivity`) vì luồng cũ chưa từng có — cần để bảo vệ
  double-submit khi chuyển từ `window.confirm` (blocking) sang `ConfirmDialog` (non-blocking).
- **Không dựng harness Playwright mới cho Wave này** — lý do đã ghi rõ trong report §7: pattern
  request/perform + `ConfirmDialog` đã được verify bằng browser thật 3 lần (Dashboard, Wedding
  Guest, Focus Fix riêng), `ConfirmDialog` chính nó không bị sửa trong Wave này, và trang này phụ
  thuộc ~13 hook Firestore sống nên dựng mock harness đầy đủ sẽ không tương xứng với rủi ro thực tế
  của 1 thay đổi wiring thuần tuý không đổi business logic. Thay vào đó: review từng cặp
  `requestDeleteX`/`performDeleteX` đối chiếu 1-1 với handler cũ + `tsc`/build xanh.
- typecheck/lint/test(170/170)/build: tất cả xanh. `next-env.d.ts`/`tsconfig.tsbuildinfo` đã revert.
- **Disposition: APPROVE.**

#### 6.2.1 Lỗi tự phát hiện & tự sửa trong Wave 0 (đáng nhớ cho các Wave sau)
Ở lượt viết code đầu tiên, 6 hàm `requestDeleteX` mới **không** có guard `if (!user) return`  ở đầu
— trong khi cả 6 handler gốc đều check `!user` **trước khi** hiện `window.confirm`. Nếu giữ nguyên
thiếu sót này, hành vi sẽ khác bản gốc: dialog sẽ mở ngay cả khi `user` null (dù `performDeleteX`
vẫn chặn hành động thật ở bước sau). Tự phát hiện qua so sánh diff 1-1, đã fix trước khi coi Wave
là xong. **Bài học cho Wave 1-7:** khi port 1 handler có early-return guard, phải giữ đúng guard đó
ở `requestX`, không chỉ ở `performX`.

### 6.3 Deferred Design System amendments — có điều kiện kích hoạt, KHÔNG PHẢI 1 wave riêng

```
Button size="icon"    — đủ bằng chứng (3 data point: Dashboard bell, Wedding Guest xoá khách/nhóm).
                         Sẽ adopt ở Wave 1 hoặc Wave 2, tuỳ wave nào gặp consumer icon-only tiếp
                         theo trước. ĐÂY LÀ THAY ĐỔI API CÔNG KHAI CỦA Button → nếu Wave 1/2 gặp
                         case này, PHẢI STOP và báo cáo contract đề xuất trước khi sửa Button,
                         theo đúng rule §5 mà user đã ra khi mở Wave 0.
Progress primitive     — 3 data point (Wedding Overview × 2 progress bar, Dashboard PlanCard).
                         Xem lại nếu Wave 5 (debt-tracking) hoặc Wave 6 (statistic) tạo ra data
                         point thứ 4.
Plan-Type Expression   — defer tới Wave 6 (statistic) hoặc 1 surface Wedding/Travel/Debt khác cho
  tokens                 thêm bằng chứng ngoài Dashboard.
TextAction              — 2 data point (Wedding Overview, Wedding Guest). Xem lại nếu R1/R2 nào đó
                         tạo ra data point thứ 3.
NotificationBadge       — 1 data point (Dashboard bell). Defer tới khi có data point thứ 2.
Bottom-panel abstraction — 1 data point (TodoNotificationScreen, chưa migrate). Defer tới khi có
                         data point thứ 2.
```

**Nguyên tắc "Don't invent, defer instead" vẫn có hiệu lực xuyên suốt**, kể cả ở giai đoạn Rollout
nhẹ: không tự bịa token/prop/component mới khi chưa đủ bằng chứng — kể cả khi tốc độ làm việc đã
nhanh hơn nhiều so với giai đoạn Pilot.

## 7. Quy ước code quan trọng cần nhớ khi tiếp tục

- **Dialog/BottomSheet thay Page**: form tạo/sửa Plan, Milestone, Todo, Vendor, Transaction
  (expense/income/debt) LUÔN hiển thị qua `ResponsiveModal`, KHÔNG route qua page riêng. Chi tiết:
  `docs/ui-modal-conventions.md`.
- **`docs/ui-modal-conventions.md` §4 — 2 exemption quan trọng, hay bị quên khi audit BottomSheet**:
  (1) menu/popover đơn giản không phải form (vd menu 3-chấm) không bắt buộc `ResponsiveModal`; (2)
  drilldown/xem dữ liệu thuần tuý không có hành động tạo/sửa có thể giữ `BottomSheet` đơn giản. Khi
  làm bounded inventory cho Wave 1-7, LUÔN đối chiếu 2 exemption này trước khi liệt kê 1
  `BottomSheet` là "cần migrate" — Wave 0 đã học bài học này (3/3 `BottomSheet` trong Plan Detail
  Shell hoá ra đều exempt).
- **Pattern request/perform cho destructive action**: đã chứng minh ổn định qua Pilot #3 + Wave 0 —
  tách `requestDeleteX(item)` (chỉ set state pending + set error null, giữ nguyên early-return guard
  của handler gốc nếu có) và `async performDeleteX()` (đọc từ state pending, gọi service, chỉ clear
  state pending khi thành công). Dùng lại nguyên xi cho Wave 1-7 khi gặp `window.confirm`.
- Next.js App Router: thư mục tiền tố `_` (`_foldername`) bị loại khỏi routing (private folder) —
  từng gây 404 lúc dựng harness verify.
- `AGENTS.md` yêu cầu đọc docs trong `node_modules/next/dist/docs/` trước khi code vì bản Next.js
  này có breaking changes so với kiến thức training.
- `next-env.d.ts`, `tsconfig.tsbuildinfo` là build artifact — luôn `git checkout --` lại sau khi
  chạy `build`/`typecheck`, không để lẫn vào diff cần review.
- KHÔNG bao giờ ghi dữ liệu test vào Firestore project thật (không có emulator) — mọi browser
  verification dùng route tạm + mock data, dọn sạch trước khi coi task xong.
- KHÔNG sửa Service/Repository/Firestore/data-model/permission-semantics/business-calculation làm
  một phần của Design System migration — nếu phát hiện cần sửa, đó là STOP condition.

## 8. Việc chưa làm / bước tiếp theo (locked next steps)

1. **Rollout Wave 1 — R1 low-risk modules (storage, user, auth, invitation)**: CHƯA MỞ. Đây là
   bước tiếp theo theo đúng thứ tự đã khoá ở mục 6. Theo quy trình NHẸ hiện hành (mục 2.2): mở Wave
   → bounded inventory thật (đếm file/BottomSheet/Dialog/window.confirm thật, đối chiếu
   `ui-modal-conventions.md` §4 trước khi liệt kê migrate candidate) → implement → automated
   regression → targeted P0/P1 verification → report ngắn → STOP chờ duyệt.
2. Nếu Wave 1 gặp consumer icon-only-button đầu tiên: đây là lúc `Button size="icon"` đủ điều kiện
   được đề xuất chính thức — nhưng phải STOP và báo cáo contract đề xuất trước, KHÔNG tự sửa
   `Button` luôn (theo rule user đã ra khi mở Wave 0, vẫn còn hiệu lực cho mọi Wave sau).
3. 5 Design System gap còn lại (Progress, Plan-Type tokens, TextAction, NotificationBadge,
   bottom-panel) — chỉ hành động khi đủ điều kiện kích hoạt ở mục 6.3, không tự bịa sớm.
4. `wedding-guest-import-dialog.tsx` vẫn BLOCKED chờ `ResponsiveModal` có size contract cho nội
   dung rộng — không phải việc của Wave 1, chỉ nhắc để không quên khi có lúc cần mở lại.
5. 2 coverage gap nhỏ còn lại từ Pilot #1 (`WeddingGuestSummaryWidget` content/error chưa verify
   bằng ảnh thật qua harness cô lập vì tự gọi hook riêng; todo-modal end-to-end trong Shell thật
   chưa verify qua harness cô lập của riêng OverviewRenderer) — có thể đóng tiện thể nếu Wave nào
   đó cần seed plan thật + full-Shell context, không phải việc bắt buộc riêng.

## 9. Cách dùng file này khi mở thread mới

Dán/tham chiếu file này ngay đầu conversation mới, kèm theo yêu cầu cụ thể (ví dụ: "bắt đầu Rollout
Wave 1 — storage/user/auth/invitation"). Nếu cần chi tiết sâu hơn về bất kỳ Wave/Pilot nào, đọc trực
tiếp report tương ứng trong `docs/design-sys-v2/implement-specs/reports/` — file này chỉ là bản đồ
định hướng, không phải nguồn sự thật đầy đủ. Report mới nhất, liên quan trực tiếp nhất tới việc tiếp
theo: `reports/07.RolloutWave0.PlanDetailShell.Report.md` và `reports/07.RolloutExecutionPlan.md`.
