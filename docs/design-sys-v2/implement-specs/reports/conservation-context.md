# Design System V2 — Conversation Context Snapshot

**Mục đích của file này:** tóm tắt toàn bộ ngữ cảnh của quá trình triển khai Design System V2
tính đến thời điểm hiện tại, để có thể mở một thread chat mới và tiếp tục công việc mà không mất
ngữ cảnh chính. File này KHÔNG thay thế các báo cáo chi tiết trong `reports/` — nó là bản đồ định
hướng, còn chi tiết đầy đủ (evidence, code snippet, lý do quyết định) vẫn nằm trong từng report.

**Cập nhật lần cuối:** 2026-08-25, ngay sau khi Pilot #1 (Wedding Overview) đạt FINAL PASS.

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
docs/design-sys-v2/implement-specs/implement/01..08.*.md      ← spec chi tiết từng Wave
docs/design-sys-v2/implement-specs/reports/*.Report.md        ← báo cáo đã hoàn thành từng Wave
```

Kiến trúc phân lớp (chỉ được phụ thuộc một chiều, từ trên xuống):

```
Foundation → Core Primitives → Overlay Architecture → Structural Components
→ Core Patterns → Product Composition
```

## 2. Quy trình làm việc (rất kỷ luật, đã lặp lại xuyên suốt mọi Wave)

Đây là quy trình do user thiết lập và luôn tuân thủ nghiêm ngặt:

1. Đọc spec của Wave hiện tại.
2. Viết **Pre-Code Manifest / Pre-Code package** (chỉ nghiên cứu, KHÔNG code) — user review, có
   thể approve thẳng hoặc approve kèm "implementation overrides".
3. Implement **đúng phạm vi Wave hiện tại**, không đụng gì ngoài phạm vi.
4. Chạy: `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build`.
   - **Lưu ý quan trọng:** `npm run typecheck` (webpack compile mode) KHÔNG bắt hết lỗi TypeScript
     thật (ví dụ vi phạm `exactOptionalPropertyTypes`). Chỉ `npm run build` (chạy `tsc` đầy đủ) mới
     là type-check có thẩm quyền cuối cùng. Bài học rút ra từ Wave 4.
   - Với thay đổi CSS/token: không tin tưởng build/test xanh — luôn kiểm tra trực tiếp CSS đã
     compile ra (Wave 1 từng có lỗi `var()` tự tham chiếu vòng lặp, xoá mất giá trị gốc mà build/
     test không báo lỗi gì).
5. Viết **Required Implementation Report** theo format chuẩn, lưu vào `reports/`.
6. **STOP** — không tự ý mở Wave/Pilot tiếp theo, chờ user review.

Nguyên tắc lớn xuyên suốt: **"Don't invent, defer instead"** — không tự bịa ra giá trị token/biến
thể/size khi chưa có bằng chứng cụ thể (ví dụ: không thêm `--shadow-raised` khi không có nguồn;
không thêm `Button size="lg"/"icon"` khi chưa có consumer thật cần; không áp `radius-ds-xl` khi
chưa có bằng chứng browser).

## 3. Trạng thái hiện tại (ledger chính thức)

```
01 Foundation              ✓ FINAL PASS
02 Core Primitives         ✓ FINAL PASS
03 Overlay Architecture    ✓ FINAL PASS
04 Structural Components   ✓ FINAL PASS
05 Core Patterns           ✓ FINAL PASS

06 Wedding Overview (Pilot #1)
   Implementation          ✓ PASS
   Automated regression    ✓ PASS
   Browser verification    ✓ PASS
   Final Pilot status      ✓ FINAL PASS
   Rollout Recommendation  APPROVE ROLLOUT (chỉ cho Pilot #1, không phải toàn app)

06 Dashboard (Pilot #2)                    ❌ CHƯA MỞ — bước tiếp theo
   STOP/GO system review (ADR §28)          ❌ CHƯA LÀM — sau Pilot #2
06 Wedding Guest (Pilot #3)                ❌ CHƯA MỞ — sau STOP/GO review
```

## 4. Tóm tắt từng Wave đã hoàn thành

### Wave 1 — Foundation (`reports/01.Foundation.Report.md`)
- Kết quả: APPROVE WITH REQUIRED FIXES → sau khi fix thì FINAL PASS.
- Fix bắt buộc: xoá `--shadow-raised` (giá trị tự bịa, không có nguồn); remap `.text-caption` từ
  11px (tự bịa) về đúng 12px đã duyệt.
- Nguyên tắc "exact-alias" được thiết lập tại đây: chỉ đổi tên biến CSS thô sang tên semantic mới
  khi tên mới là alias **giống hệt byte-for-byte** (ví dụ `--color-muted` → `--color-text-secondary`,
  KHÔNG phải `--color-text-muted`). Không bao giờ ép một mapping không chính xác — màu Tailwind thô
  `slate-*` không có tương đương Foundation, nên giữ nguyên xuyên suốt toàn bộ dự án.
- Lỗi tự phát hiện: comment CSS chứa chuỗi `*/` làm hỏng khối comment → gây lỗi webpack/postcss.
- Lỗi tự phát hiện: `--color-border-strong: var(--color-border-strong);` tự tham chiếu vòng lặp,
  âm thầm xoá mất giá trị gốc `#cbd5e1` mà build/test không báo lỗi — chỉ phát hiện khi diff trực
  tiếp CSS đã compile. Từ đây trở thành thực hành chuẩn cho mọi Wave sau.

### Wave 2 — Core Primitives (`reports/02.CorePrimitives.Report.md`)
- Kết quả: APPROVE WITH REQUIRED FIXES → FINAL PASS.
- Fix bắt buộc: xoá `Button size="icon"` (chưa có consumer nào cần); dán nhãn rõ ràng
  `hover:bg-red-700` là "Foundation semantic gap" thay vì trình bày như một quyết định đã chốt.

### Wave 3 — Overlay Architecture (`reports/03.OverlayArchitecture.Report.md`)
- Kết quả: APPROVE WITH ONE REQUIRED FIX → FINAL PASS.
- Fix bắt buộc: không được tin vào giả định "Cancel xuất hiện trước Confirm trong DOM nên tự nhận
  focus" — phải verify trực tiếp trong source code thật của cả Radix (desktop) VÀ vaul (mobile)
  riêng biệt, không suy diễn từ cái này sang cái kia.
- Phát hiện kỹ thuật quan trọng:
  - Radix `AlertDialogContent`'s `cancelRef` chỉ kích hoạt qua chính subcomponent
    `AlertDialog.Cancel` thật, không phải Button style thường.
  - vaul (Drawer) mặc định `autoFocus: false`, cần wiring `onOpenAutoFocus` tường minh.
- Cấm dùng `setTimeout`/`useEffect` để hack focus thủ công — phải dùng đúng extension point mà
  chính primitive đó hỗ trợ.

### Wave 4 — Structural Components (`reports/04.StructuralComponents.Report.md`)
- Kết quả: APPROVE WITH REQUIRED FIXES → FINAL PASS.
- Fix bắt buộc: revert radius/shadow mặc định của `Card` về legacy (đánh dấu
  `TEMPORARY LEGACY COMPATIBILITY` trong code, KHÔNG tạo prop variant "legacy" mới) — vì `Card` có
  58 consumer chưa được review từng cái, đổi mặc định sẽ cascade thay đổi visual toàn app trước khi
  review xong. **Quyết định này hiện vẫn đang có hiệu lực** — `src/shared/components/ui/card.tsx`
  vẫn giữ recipe legacy (`--radius-card` 24px + shadow gốc), từng consumer phải tự migrate riêng
  khi review tới lượt nó (đây chính là cách Pilot #1 xử lý Card — xem mục 6).
- Thêm contract test (`renderToStaticMarkup` từ `react-dom/server`, chạy dưới `vitest`
  `environment: node`) cho toàn bộ 7 component Phase 4, không thêm dependency test mới.
- Lỗi tự phát hiện: `npm run typecheck` không bắt được lỗi `exactOptionalPropertyTypes` khi
  `Section` forward optional prop xuống `SectionHeading`; chỉ `npm run build` bắt được → xác lập
  nguyên tắc `build` là type-check có thẩm quyền cuối cùng.

### Wave 5 — Core Patterns (`reports/05.CorePatterns.Report.md`)
- Kết quả: FINAL PASS.
- Các rủi ro được đặc biệt lưu ý khi mở Wave này: `EntityList` (data/query-engine risk),
  `FilterBar` (DSL risk), `PageHeader` (permission-leakage risk).

## 5. Wave 6 — Pilot Migration — Pilot #1: Wedding Overview (ĐÃ XONG, FINAL PASS)

Đây là phần vừa hoàn thành trong conversation này. Chi tiết đầy đủ:
`reports/06.PilotMigration.WeddingOverview.PreCode.md` (nghiên cứu trước khi code) và
`reports/06.PilotMigration.WeddingOverview.Report.md` (báo cáo implementation + browser
verification cuối cùng).

### 5.1 Phạm vi & lý do chọn
- Pilot #1 = Wedding Overview, bị khoá cứng theo Audit Decision Record §26 (không được chọn pilot
  khác).
- Đúng 1 file duy nhất trong toàn bộ diff:
  `src/modules/plan/constants/overview-widget-registry.wedding.tsx`
  (111 insertions / 92 deletions — sau khi tính cả 1 bugfix phát hiện lúc browser-verify).
- Kiến trúc config → registry → composition của Plan Overview widget (được bảo vệ theo Audit
  Decision Record §22) **không được thay đổi** — tuyệt đối không được quay lại kiểu
  `if (planType === 'wedding')` branching.

### 5.2 Pre-Code approved WITH 3 IMPLEMENTATION OVERRIDES
1. **EmptyState semantics**: không ép mọi trạng thái positive/zero về `EmptyState`. Cụ thể:
   - "Mọi việc đang trong tầm kiểm soát" (all-clear) — giữ custom, KHÔNG migrate.
   - "Không có công việc nào sắp đến hạn" — giữ custom, KHÔNG migrate.
   - "Không có mốc nào đang diễn ra hoặc sắp diễn ra" — migrate sang `EmptyState`.
   - "Chưa có khách mời nào được thêm vào kế hoạch." — migrate sang `EmptyState`.
2. **Card migration**: KHÔNG đụng `src/shared/components/ui/card.tsx` (giữ nguyên legacy theo
   Wave 4). Mỗi trong 6 instance `<Card>` trong file Pilot được phân loại riêng lẻ
   ("standard contained surface") và override className cục bộ:
   `rounded-[var(--radius-ds-lg)] shadow-none`.
3. **Browser verification**: là gate bắt buộc cho FINAL PASS nhưng KHÔNG chặn việc bắt đầu code;
   không được thêm dependency mới vào product khi làm việc này.

### 5.3 Component disposition đã áp dụng (bảng đầy đủ ở report §7)
- `SectionHeading` trực tiếp (×4) → thay bằng `Section` (đã compose sẵn `SectionHeading`).
- `Card` (×6 instance) → per-consumer classify như override #2.
- `ViewAllAction` → `<Button variant="ghost">` với className override strip về hình dạng text-link
  gốc (padding/min-height/pill-shape bị override hết).
- `Badge`, `Skeleton` (chỉ đổi radius token) → giữ nguyên (KEEP).
- Empty/Error states → theo override #1; guest fetch error → `ErrorState`.
- Guest big-number stat → `Metric` (`label="Lời mời"`, `value={total}`,
  `supporting="{attendeeCount} người dự kiến"`).
- "Upcoming todo" row (trong "Sắp tới") → compose thành `DataRow`.
- `AttentionItemRow` → **GIỮ CUSTOM**, đã đánh giá kỹ (report §8): desktop (`lg:`) của nó biến
  thành card riêng với shadow/hover-lift, không khớp mô hình row của `DataRow` — compose vào sẽ
  phải override gần hết, không đơn giản hoá được gì.
- `WeddingMilestoneCard` → vẫn COMPOSE (không đổi disposition), Card riêng cũng bị reclassify như
  các Card khác.
- RSVP breakdown, 3 progress bar tự chế (milestone %, RSVP multi-segment, budget %), top-category
  rows → DEFER, chỉ đổi token màu (theo exact-alias), không ép structural component.

### 5.4 Foundation token alias đã áp dụng (đều là exact-alias, không tự bịa)
```
--color-success        → --color-status-success
--color-warning        → --color-status-warning
--color-danger         → --color-status-danger
--color-muted          → --color-text-secondary   (LƯU Ý: không phải --color-text-muted)
--color-warning-soft   → --color-status-warning-surface
--color-accent-soft    → --color-brand-subtle
--color-accent         → --color-brand-accent
--color-primary        → --color-brand-primary
```
Màu Tailwind thô `slate-*`/`rose-*`/`amber-*`/`sky-*` giữ nguyên toàn bộ (không có alias chính xác
— đây là gap đã biết trước, không phải do Pilot này gây ra).

### 5.5 Hai Design System findings đã ghi nhận, CHƯA xử lý (cố tình, chờ thêm bằng chứng)
1. **Core Primitives chưa có "text link" footprint chuẩn** — `Button` chỉ có 2 size (`sm`, `md`),
   cả hai đều giả định có button chrome thật. Dùng cho `ViewAllAction` phải override
   `h-auto min-h-0 gap-0 rounded-none p-0` — không phải drop-in sạch. Phân loại: PRIMITIVE ISSUE.
   Khuyến nghị: nếu pattern này lặp lại ở Pilot #2/#3 thì mới đủ bằng chứng để thêm variant
   `Button` "link" hoặc primitive `LinkButton`/`TextAction` riêng — KHÔNG bịa ra chỉ dựa trên 1
   Pilot.
2. **Chưa có Progress/ProgressBar primitive chuẩn** — 3 progress bar tự chế trong file này (%
   milestone, RSVP multi-segment, % budget) giữ nguyên, chỉ đổi màu fill theo token. Phân loại:
   STRUCTURAL ISSUE (candidate). Cùng khuyến nghị: chờ bằng chứng từ Pilot #2/#3.

**QUAN TRỌNG:** user đã yêu cầu rõ ràng KHÔNG được tự ý fix 2 finding này khi làm browser
verification — chúng vẫn đang ở trạng thái "ghi nhận, chưa hành động" tính đến hiện tại.

### 5.6 Browser Verification (vừa hoàn thành trong conversation này)

**Phương pháp:** dựng harness Playwright tạm thời, cô lập hoàn toàn khỏi product:
- Cài `playwright-core@1.62.1` trong thư mục scratchpad ngoài project (KHÔNG thêm vào
  `package.json` của product), tái sử dụng Chromium binary đã cache sẵn.
- Tạo route tạm `src/app/pilot-verify-temp/page.tsx` (ngoài route group `(authenticated)` để né
  `AuthGuard`), mount `OverviewRenderer` thật (không sửa) với mock props qua 13 scenario (nội dung
  bình thường, content stress, empty, over-budget, plan-ended, loading, action-error, và 5 biến
  thể ma trận quyền Owner/Editor/Viewer).
- **Cả route tạm và Playwright tooling đã được XOÁ SẠCH** trước khi kết thúc — `git status` chỉ
  còn đúng 2 file: `overview-widget-registry.wedding.tsx` + report markdown.
- Lý do dùng harness cô lập thay vì test trực tiếp trên app thật: app kết nối Firebase project
  thật (không có emulator), nên không được phép tạo tài khoản/dữ liệu test thật trên hạ tầng dùng
  chung.

**Kết quả (đã ghi đầy đủ vào report, mục "Browser Verification"):**
```
375px    PASS
768px    PASS
1024px   PASS
1440px   PASS

Keyboard/focus             PASS
Todo modal integration     PASS (giới hạn phạm vi đã công khai)
Permission matrix          PASS
Empty/error/loading        PASS (giới hạn phạm vi đã công khai)
Long-content stress        PASS (sau khi fix)
Financial semantic color   PASS

Code changes required: YES — đã áp dụng và re-verify
```

**1 lỗi phát hiện và đã fix:** `WeddingMilestoneCard`'s title không truncate khi tên mốc dài (content
stress scenario) — text tràn ra khỏi mép phải Card, không có dấu "...". Nguyên nhân: class
`truncate` (đã có sẵn từ trước, không phải do Pilot này thêm) không có tác dụng vì **cả 2** phần tử
tổ tiên đều thiếu `min-w-0`:
- flex item bọc label + title (bên trong `WeddingMilestoneCard`)
- chính `<Card>` — vì nó cũng là **CSS Grid item** (`grid gap-3 lg:grid-cols-2` ở
  `WeddingMilestoneSnapshotWidget`). Grid item mặc định `min-width: auto` (kích thước theo
  min-content), giống hệt flex item, dễ bị quên vì người ta hay nhớ thêm `min-w-0` cho flex mà
  quên grid.

Đây là **lỗi có sẵn từ trước** (pre-existing), không phải regression do Pilot gây ra — đã xác nhận
qua `git diff` (2 dòng tổ tiên đó là context line không đổi trước khi fix). Đã fix cả 2 chỗ, rồi
chạy lại toàn bộ: typecheck → tests → full build → browser re-verify — sạch, không phát sinh
regression nào khác.

**Hai giới hạn phạm vi đã công khai (không phải lỗi, là giới hạn cấu trúc của phương pháp harness
cô lập):**
1. `WeddingGuestSummaryWidget` tự gọi hook Firestore riêng (`useGuestInvitations`,
   `useWeddingGuestGroups`), bỏ qua mock props hoàn toàn — nên trạng thái "có nội dung" và "lỗi"
   của widget này KHÔNG được xác nhận bằng hình ảnh thật qua harness (chỉ luôn thấy `EmptyState`
   vì query không authenticated trả về rỗng thành công, không lỗi). Đã xác nhận bằng code review:
   `RSVP_TONE`/label luôn đi kèm text tiếng Việt rõ ràng ("Đã xác nhận"/"Chờ phản hồi"/"Không tham
   dự"), không chỉ dựa vào màu.
2. Việc click vào 1 dòng todo có thực sự mở `TodoDetailView` bên trong `ResponsiveModal` của Shell
   thật hay không — KHÔNG kiểm được qua harness cô lập (harness chỉ mount `OverviewRenderer` riêng
   lẻ, không có toàn bộ Shell `plans/[planId]/page.tsx`). Đã xác nhận được: callback `onViewTodo`
   bắn đúng argument khi click/Enter/Space. Modal thật là hạ tầng Overlay Architecture (Wave 3) đã
   FINAL PASS từ trước và không bị đụng trong diff này.

Khuyến nghị: đóng 2 gap này một cách tiện thể (opportunistically) trong lúc browser-verify Pilot
#2/#3, vì lúc đó nhiều khả năng sẽ cần seed plan thật + full-Shell context.

### 5.7 Rollout Recommendation cuối cùng
**`APPROVE ROLLOUT`** — chỉ cho Pilot #1 (Wedding Overview), KHÔNG phải quyết định rollout toàn
app. Theo Audit Decision Record §26 / 06.PilotMigration.md, việc approve này chỉ mở khoá bước tiếp
theo: Pilot #2 (Dashboard), sau đó STOP/GO system review (Audit Decision Record §28), rồi mới tới
Pilot #3 (Wedding Guest).

## 6. Việc chưa làm / bước tiếp theo (locked next steps)

1. **Pilot #2 — Dashboard**: CHƯA MỞ. Theo quy trình chuẩn: phải làm Pre-Code package trước
   (research only), user review/approve (có thể kèm overrides), rồi mới implement.
2. **STOP/GO system review** (Audit Decision Record §28): xảy ra SAU Pilot #2, TRƯỚC Pilot #3.
3. **Pilot #3 — Wedding Guest**: CHƯA MỞ, chờ STOP/GO review.
4. Hai Design System findings (Button text-link gap, Progress gap) vẫn đang chờ — chỉ hành động
   khi có đủ bằng chứng từ Pilot #2/#3, không tự ý patch sớm.
5. Hai coverage gap từ Pilot #1 (guest widget content/error visual, todo-modal end-to-end) — nên
   đóng tiện thể trong lúc verify Pilot #2/#3.
6. Test riêng cho `overview-widget-registry.wedding.tsx` vẫn còn thiếu (đã ghi nhận là "deferred,
   not silently dropped" trong report §26) — vì `WeddingGuestSummaryWidget` gọi hook thật bên
   trong, cần mock hook mới viết được contract test theo pattern Wave 4/5.

## 7. Quy ước code quan trọng cần nhớ khi tiếp tục

- **Dialog/BottomSheet thay Page**: mọi form tạo/sửa Plan, Milestone, Todo, Vendor, Transaction
  (expense/income/debt) LUÔN hiển thị qua `ResponsiveModal` (Dialog desktop / BottomSheet mobile),
  KHÔNG route qua page riêng. Chi tiết: `docs/ui-modal-conventions.md`. Nếu không chắc 1 case có
  thuộc rule này không → hỏi lại trước khi code (theo `AGENTS.md`).
- Next.js App Router: thư mục có tiền tố `_` (`_foldername`) bị loại khỏi routing (private folder)
  — từng gây lỗi 404 trong quá trình dựng harness verify.
- `AGENTS.md` yêu cầu đọc docs trong `node_modules/next/dist/docs/` trước khi code vì đây là bản
  Next.js có breaking changes so với kiến thức training — luôn kiểm tra deprecation notice.

## 8. Cách dùng file này khi mở thread mới

Dán/tham chiếu file này ngay đầu conversation mới, kèm theo yêu cầu cụ thể (ví dụ: "bắt đầu
Pre-Code package cho Pilot #2 — Dashboard"). Nếu cần chi tiết sâu hơn về bất kỳ Wave nào, đọc trực
tiếp report tương ứng trong `docs/design-sys-v2/implement-specs/reports/` — file này chỉ là bản đồ
định hướng, không phải nguồn sự thật đầy đủ.
