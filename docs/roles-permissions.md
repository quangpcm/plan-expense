Được. Dưới đây là bản spec tôi đề xuất dùng làm **tài liệu đầu vào trực tiếp cho AI implement**. Tôi giữ scope đúng những gì chúng ta vừa chốt và bám theo hệ thống hiện tại: `owner | editor | viewer`, capability-based permission, enforce ở cả `permission.service.ts` và `firestore.rules`.  Đồng thời thiết kế vẫn phù hợp với Modular Plan Architecture, nơi permission/capability đi theo module thay vì PlanType. 

# Roles & Permissions V2 — Module Access

**Version:** 2.0
**Status:** Proposed — Ready for Implementation Planning
**Scope:** Plan Member Roles · Module Visibility · Editor Access Level · Capability Resolution · Firestore Rules

---

## 1. Mục tiêu

Nâng cấp permission hiện tại của Go Plan theo nguyên tắc:

> **Role quyết định mức trust tổng thể. Module Access quyết định phạm vi cộng tác. Capability là implementation detail.**

Hệ thống cần:

* Dễ hiểu với người dùng.
* Không tạo permission matrix với hàng chục checkbox.
* Owner luôn có toàn quyền.
* Viewer có thể bị giới hạn module được xem.
* Editor mặc định quản lý dữ liệu do chính mình tạo.
* Owner có thể nâng quyền Editor theo từng module.
* Editor chỉ được sửa/xóa dữ liệu người khác khi Owner cấp rõ ràng `manage_all`.
* Permission tiếp tục được enforce ở Application + Firestore Rules.
* Không tạo role theo PlanType hoặc module.

Không tạo các role như:

```text
Finance Editor
Wedding Editor
Travel Editor
Admin
Contributor
Manager
```

V1 vẫn giữ:

```ts
type PlanRole =
  | 'owner'
  | 'editor'
  | 'viewer';
```

---

# 2. Permission Model

Permission được tổ chức thành 3 tầng:

```text
ROLE
  ↓
MODULE ACCESS
  ↓
CAPABILITIES
```

Trong đó:

```text
Role
→ UX-level preset / trust level

Module Access
→ Owner customization theo member

Capability
→ Internal authorization primitive
```

Ví dụ:

```text
Editor

Finance = manage_all
Planning = manage_own
Travel Itinerary = view
Wedding Guests = view

        ↓

resolvePlanCapabilities()

        ↓

finance.createExpense
finance.editOwnExpense
finance.editAllExpense
...
```

User không cần nhìn thấy capability.

---

# 3. Owner

Owner luôn có toàn quyền trên Plan.

```text
All enabled modules
→ Full access

Plan Settings
→ Full access

Members
→ Full access

Permissions
→ Full access

Ownership
→ Full access
```

Owner không cần cấu hình `moduleAccess`.

Owner permission không được downgrade bằng module permission.

Concept:

```ts
if (member.role === 'owner') {
  return ALL_CAPABILITIES;
}
```

Các hành động Owner-only gồm tối thiểu:

```text
Delete Plan
Archive/Close Plan
Transfer Ownership
Manage Members
Change Member Roles
Change Member Permissions
```

Các sensitive administrative actions hiện đang Owner-only tiếp tục giữ nguyên trừ khi có specification riêng trong tương lai.

---

# 4. Viewer

## 4.1 Default

Viewer:

> **Chỉ xem. Không được tạo, sửa hoặc xóa nội dung.**

Mặc định Viewer được xem các module đang enabled của Plan.

Ví dụ Wedding:

```text
✓ Tổng quan
✓ Công việc
✓ Tài chính
✓ Khách mời
✓ Thành viên
```

---

## 4.2 Module Visibility

Owner có thể giới hạn module Viewer được truy cập.

Ví dụ:

```text
Nguyễn Văn A
Viewer

QUYỀN TRUY CẬP

✓ Tổng quan
✓ Công việc
✕ Tài chính
✓ Lịch trình
✕ Thành viên
```

Module bị disable cho Viewer:

```text
Không xuất hiện Navigation
Không truy cập được Route
Không query/read data của module
Không xuất hiện Overview Widget
Không leak aggregate/summary của module
```

Ví dụ:

```text
finance = hidden
```

thì không chỉ ẩn tab `Tài chính`.

Overview cũng không được render:

```text
Financial Summary
Total Expense
Total Income
Recent Transactions
Settlement Summary
```

---

# 5. Editor

## 5.1 Default Principle

Editor mặc định tuân theo:

> **“Tôi quản lý những gì tôi tạo.”**

Đối với resource có ownership rõ ràng:

```text
Editor tạo resource
→ có thể sửa
→ có thể xóa

Resource do member khác tạo
→ chỉ xem
```

Ví dụ:

```text
Expense do Editor A tạo
→ A edit/delete

Expense do Editor B tạo
→ A view only
```

---

# 6. Module Access Level

Module permission sử dụng access level thay vì hàng loạt boolean.

Concept:

```ts
type ModuleAccessLevel =
  | 'hidden'
  | 'view'
  | 'manage_own'
  | 'manage_all';
```

Semantic:

| Level        | View | Create | Edit/Delete own | Edit/Delete others |
| ------------ | ---: | -----: | --------------: | -----------------: |
| `hidden`     |    ❌ |      ❌ |               ❌ |                  ❌ |
| `view`       |    ✅ |      ❌ |               ❌ |                  ❌ |
| `manage_own` |    ✅ |      ✅ |               ✅ |                  ❌ |
| `manage_all` |    ✅ |      ✅ |               ✅ |                  ✅ |

Critical rule:

> `manage_all` là level duy nhất cho phép Editor sửa/xóa resource do member khác tạo.

---

# 7. Editor Default Module Access

Default Editor nên resolve về:

```text
Module hỗ trợ collaborative ownership
→ manage_own

Module mang tính shared/admin
→ view hoặc access mặc định do module định nghĩa
```

Không nhất thiết tất cả module có cùng access-level semantics.

Module phải khai báo access level nào nó hỗ trợ.

---

# 8. Resource Classification

## 8.1 Ownership Resources

Resource có ownership rõ ràng, thường có:

```ts
createdByUserId
```

hoặc equivalent identity.

Ví dụ:

```text
Expense
Income
Todo
Milestone (amended — xem mục 13)
```

Có thể hỗ trợ:

```text
view
manage_own
manage_all
```

**TravelActivity** kỹ thuật cũng có `createdByUserId`/`createdByMemberId`
nhưng đã quyết định (mục 27.1, 14.1) **không** expose `manage_own` — xếp
chung nhóm với Wedding Guest ở mục 9, chỉ hỗ trợ `view`/`manage_all`. Lý do:
code hiện tại chưa có ownership-check cho activity, và default cần giữ
nguyên hành vi hiện tại (editor sửa được activity của bất kỳ ai) — thêm
`manage_own` sẽ tốn effort build mới mà chưa có nhu cầu thực tế.

### `manage_own`

Cho phép:

```text
Create
Edit own
Delete own
```

### `manage_all`

Cho phép thêm:

```text
Edit records created by others
Delete records created by others
```

---

# 9. Shared/Admin Resources

Không phải resource nào cũng nên có `manage_own`.

Ví dụ:

```text
Wedding Guest
Travel Activity  (quyết định — xem ghi chú mục 8.1)
Members
Settlement
Plan Settings
```

Milestone từng nằm ở nhóm này (V2 gốc) nhưng đã được amend sang ownership
resource — xem mục 13.

Khái niệm:

> “Chỉ quản lý record do tôi tạo”

không nhất thiết có semantic phù hợp.

Những resource này có thể chỉ hỗ trợ:

```text
view
manage_all
```

hoặc Owner-only tùy domain.

Không generic hóa `manage_own` vào resource nếu business semantic không phù hợp.

---

# 10. Module Permission UX

UI không expose capability.

Không:

```text
☑ createExpense
☑ editOwnExpense
☑ deleteOwnExpense
☑ editAllExpense
☑ deleteAllExpense
☑ createIncome
...
```

Thay vào đó:

```text
TÀI CHÍNH

○ Chỉ xem
● Quản lý nội dung của mình
○ Quản lý toàn bộ
```

Planning:

```text
CÔNG VIỆC

○ Chỉ xem
● Quản lý nội dung của mình
○ Quản lý toàn bộ
```

Travel — chỉ 2 option, không có "Quản lý nội dung của mình" (quyết định mục
8.1/14.1 — TravelActivity không expose `manage_own`):

```text
LỊCH TRÌNH

○ Chỉ xem
● Quản lý toàn bộ
```

---

# 11. Editor Example

Member:

```text
Minh
Editor
```

Owner config:

```text
Công việc
→ manage_own

Tài chính
→ manage_all

Lịch trình
→ view

Khách mời
→ view
```

Expected:

### Planning

```text
Create supported collaborative content
Edit/Delete own content
Cannot Edit/Delete other member content
```

### Finance

```text
Create Expense/Income

Edit/Delete own Expense/Income

Edit/Delete Expense/Income
created by other members
```

### Travel Itinerary

```text
View only

Cannot create
Cannot edit
Cannot delete
```

### Wedding Guests

```text
View only
```

---

# 12. Finance

Current `canEditAllExpenses` trở thành legacy behavior của V1.

Hiện tại nó chỉ mở:

```text
finance.editAllExpense
finance.deleteAllExpense
```

và không áp dụng tương tự cho Income. 

V2 nên thay semantics này bằng:

```text
finance = manage_all
```

`manage_all` Finance nên bao gồm:

```text
Expense
+
Income
```

Editor có thể sửa/xóa Expense và Income của người khác.

Không nên có UX:

> “Quản lý toàn bộ Tài chính”

nhưng Income của người khác lại không sửa được.

Settlement **không tự động** được đưa vào `manage_all`.

Settlement tiếp tục được xem là sensitive/administrative operation và giữ rule hiện tại cho đến khi có specification riêng.

---

# 13. Planning

> **Amended (2026-08-23):** quyết định gốc bên dưới coi Milestone là shared
> resource (chỉ `view`/`manage_all`, không có `manage_own`). Quyết định này
> đã bị đảo ngược theo yêu cầu mở rộng "Công việc" — Milestone giờ có cùng
> own/all semantic như Todo. Giữ lại nội dung gốc bên dưới (gạch dưới bằng
> ~~) để tránh mất lịch sử quyết định; nội dung hiệu lực nằm ở khối "Quyết
> định hiện tại" phía sau.

Planning chứa:

```text
Milestone
Todo
```

"Công việc" trong Permission UI (mục 24) = toàn bộ Planning module (Milestone
+ Todo) — chỉ 1 dropdown, nhưng capability bên dưới vẫn granular theo từng
resource để enforce đúng.

### Todo

Phù hợp:

```text
manage_own
manage_all
```

### Milestone — Quyết định hiện tại

Milestone giờ cũng là ownership resource, cùng semantic với Todo:

```text
Planning = manage_own
→ "Tôi quản lý những gì tôi tạo"

Todo:    Create, Edit/Delete own
Milestone: Create, Edit/Delete own
```

```text
Planning = manage_all
→ Editor sửa/xoá được cả Milestone và Todo do người khác tạo

Todo:    Manage all
Milestone: Manage all
```

Reorder milestone (sắp xếp lại toàn bộ danh sách) không scope theo 1 record
sở hữu riêng lẻ, nên vẫn yêu cầu `manage_all` (giống bulk reorder của Todo)
— không có "reorder own".

Capability keys:

```ts
planning.createMilestone
planning.editOwnMilestone
planning.deleteOwnMilestone
planning.editAllMilestone
planning.deleteAllMilestone

planning.createTodo
planning.editOwnTodo
planning.deleteOwnTodo
planning.editAllTodo
planning.deleteAllTodo
```

Business rule vẫn giữ nguyên bất kể capability: có quyền xoá Milestone không
đồng nghĩa được bypass rule dữ liệu (vd. không hard-delete milestone còn
Expense liên quan — `docs/4.DMS.md` §7.5).

### Milestone — Quyết định gốc (superseded)

~~Milestone là cấu trúc chung của Plan.~~

~~Không nên mặc định coi: "Milestone do A tạo → chỉ A quản lý". Vì vậy
implementation phải xác định Milestone là shared resource, chỉ hỗ trợ
`view`/`manage_all`, không có `manage_own`.~~

Điều này từng giữ UX module-level đơn giản nhưng resolver vẫn hiểu semantic
của từng resource — nguyên tắc "UI 1 dropdown, capability granular" đó vẫn
đúng và được giữ lại ở quyết định hiện tại phía trên.

---

# 14. Wedding Guests

Wedding Guest là shared domain data.

Không sử dụng ownership semantic:

```text
guest.createdBy === member
```

để quyết định ai được sửa Guest.

Recommended levels:

```text
hidden
view
manage_all
```

`manage_own` không được expose nếu không có business requirement rõ ràng.

---

# 14.1 Travel Itinerary (quyết định — cùng pattern với mục 14)

Dù `TravelActivity` có `createdByUserId`/`createdByMemberId`, đã quyết định
**không** dùng ownership semantic để phân quyền, vì code hiện tại
(`travel-activity.service.ts`) chưa từng tách own/all và chưa có nhu cầu
thực tế để build thêm:

```text
guest.createdBy === member   // KHÔNG áp dụng, tương tự Wedding Guest
```

Levels:

```text
hidden
view
manage_all
```

`manage_own` không được expose. Editor default = `manage_all` (giữ nguyên
hành vi hiện tại — xem mục 27.1).

---

# 15. Members

Members không sử dụng `manage_own`.

V2 giữ:

```text
Owner
→ manage_all

Editor
→ view

Viewer
→ view / hidden
```

Editor không được cấp `members.manage` thông qua một `manage_all` generic nếu chưa có specification delegation riêng.

Member/Role/Permission management vẫn là Owner-only.

---

# 16. Overview

Overview là module đặc biệt.

Không nên coi Overview như domain permission độc lập hoàn toàn.

Nội dung Overview phải được filter dựa trên module permission.

Concept:

```text
Widget module enabled
AND
Current member can view module
→ Render widget
```

Ví dụ:

```text
Viewer:

Planning = view
Finance = hidden
Wedding Guests = view
```

Overview:

```text
✓ Upcoming Milestones
✓ Upcoming Todos

✕ Financial Summary
✕ Recent Transactions

✓ Wedding Guest Summary
```

Điều này phù hợp với widget-driven Overview của Modular Architecture V1.1. 

---

# 17. Navigation

Navigation resolution trở thành:

```text
Plan
 ↓
PlanTypeConfig
 ↓
Enabled Modules
 ↓
Member Module Access
 ↓
Visible Navigation
```

Concept:

```ts
visible =
  module.enabled &&
  resolveModuleAccess(member, module.id) !== 'hidden';
```

Không chỉ hide UI.

Route guard và data access phải enforce tương ứng.

---

# 18. Data Model

Không lưu từng capability dưới dạng boolean.

Không:

```ts
permissions: {
  canCreateExpense: true,
  canEditExpense: true,
  canDeleteExpense: false,
  canCreateTodo: true,
  ...
}
```

Recommended:

```ts
type PlanMemberPermissions = {
  moduleAccess?: Partial<
    Record<PlanModuleId, ModuleAccessLevel>
  >;
};
```

Example:

```ts
{
  role: 'editor',

  permissions: {
    moduleAccess: {
      planning: 'manage_own',
      finance: 'manage_all',
      weddingGuests: 'view',
      travelItinerary: 'manage_own'
    }
  }
}
```

---

# 19. Role Presets

Không cần lưu đầy đủ default permission vào từng member.

Resolver có default preset.

Concept:

```text
Role Defaults
+
Explicit Module Overrides
=
Resolved Module Access
```

Ví dụ Editor:

```text
Default:
finance → manage_own
travelItinerary → manage_own
planning → manage_own
...
```

Member chỉ cần lưu những override khác default nếu implementation thấy phù hợp.

Viewer:

```text
Default:
enabled modules → view
```

Owner:

```text
Always:
enabled modules → manage_all
```

---

# 20. Capability Resolution

Capability tiếp tục là authorization primitive nội bộ.

Example:

```text
role = editor
finance = manage_own
```

resolve:

```text
finance.view
finance.createExpense
finance.createIncome

finance.editOwnExpense
finance.deleteOwnExpense

finance.editOwnIncome
finance.deleteOwnIncome
```

Không resolve:

```text
finance.editAllExpense
finance.deleteAllExpense
finance.editAllIncome
finance.deleteAllIncome
```

---

With:

```text
finance = manage_all
```

resolve thêm:

```text
finance.editAllExpense
finance.deleteAllExpense

finance.editAllIncome
finance.deleteAllIncome
```

---

# 21. Security Enforcement

Giữ architecture hiện tại:

```text
UI
 ↓
Service
 ↓
Repository
 ↓
Firestore Rules
```

Permission phải enforce ở tối thiểu:

```text
Application permission resolver/service
+
Firestore Security Rules
```

Đây là requirement quan trọng vì hệ thống hiện đã enforce song song ở hai nơi.

Lưu ý: yêu cầu "không được chỉ hide button/hide navigation" ở trên áp dụng
cho **write** (create/update/delete) — write vẫn phải bị chặn ở Service +
Firestore Rules như hiện tại, không được chỉ disable nút trên UI. Với
**read**, xem quyết định descope ở mục 22 ngay dưới.

Không được implement V2 cho write chỉ bằng:

```text
hide button
hide navigation
```

---

# 22. Read Security (đã descope — quyết định trước Go Live)

Bản đề xuất ban đầu của mục này yêu cầu `hidden` phải là **data access
restriction** ở tầng Firestore Rules, không chỉ navigation restriction —
tức nếu `finance = hidden`, Firestore phải tự chặn read Finance collection
kể cả khi bị bypass UI.

**Quyết định cuối (đã chốt với product owner): KHÔNG làm phần này.**

`hidden` chỉ cần là **UI/navigation restriction**:

```text
finance = hidden
→ ẩn tab/route/overview widget
→ app không gọi query đọc collection đó khi render UI
→ KHÔNG cần thêm rule chặn read ở Firestore
```

Lý do descope: giảm effort trước mốc Go Live đã lùi lại cho V2 — phần rules
read-security theo module là phần việc nặng nhất trong toàn bộ implementation
(phải viết + test rule cho từng collection: Finance, Wedding Guests, Members,
Debt) trong khi rủi ro thực tế thấp (app không có public client tự do gọi
Firestore ngoài luồng chính thức).

Rủi ro được chấp nhận: nếu ai đó bypass UI và gọi trực tiếp Firestore SDK với
đúng session hợp lệ, họ vẫn đọc được data của module đang `hidden` (miễn là
họ vẫn là member `active` của plan — không phải người ngoài). Đây không phải
lỗ hổng cho người ngoài plan, chỉ là member trong plan xem được module họ
"không nên thấy" trên UI. Nếu sau này cần defense-in-depth thật (ví dụ dữ
liệu debt/finance có yêu cầu compliance), làm như một cải tiến riêng, không
phải điều kiện chặn Go Live.

**Write vẫn enforce đầy đủ ở Firestore Rules như bình thường** — descope này
chỉ áp dụng cho read của module `hidden`, không ảnh hưởng đến rule cho
`manage_own`/`manage_all` (mục 6, 20-21).

---

# 23. Permission Invariants

Các invariant bắt buộc:

**P1**

> Owner luôn có full access.

**P2**

> Owner permission không bị downgrade bởi `moduleAccess`.

**P3**

> Viewer không bao giờ có write capability.

**P4**

> `hidden` nghĩa là không view UI (không hiện tab/route/overview widget, app
> không gọi query đọc data của module đó). Không yêu cầu Firestore Rules
> chặn read — đã descope theo quyết định ở mục 22.

**P4.1**

> `manage_own`/`manage_all` write vẫn phải enforce đầy đủ ở Firestore Rules
> (không descope) — chỉ read của module `hidden` là được descope.

**P5**

> `manage_own` không cho phép sửa/xóa resource người khác.

**P6**

> Chỉ `manage_all` mới cho phép Editor sửa/xóa resource người khác trong module tương ứng.

**P7**

> `manage_all` của một module không biến Editor thành Owner.

**P8**

> `manage_all` không tự động cấp Plan administration/member administration.

**P9**

> Module permission không phụ thuộc PlanType.

**P10**

> Disabled Plan Module không được trở nên accessible chỉ vì member có permission override.

---

# 24. Permission UI

Edit Member nên có cấu trúc:

```text
MINH
Editor

Quyền truy cập
─────────────────────────

Công việc
[ Quản lý nội dung của mình ▼ ]

Tài chính
[ Quản lý toàn bộ ▼ ]

Lịch trình
[ Chỉ xem ▼ ]

Khách mời
[ Chỉ xem ▼ ]

Thành viên
[ Chỉ xem ▼ ]
```

Không dùng giant permission matrix.

Dropdown chỉ hiển thị level module hỗ trợ.

Viewer có thể đơn giản hơn:

```text
MINH
Viewer

Có thể xem

☑ Công việc
☐ Tài chính
☑ Lịch trình
☐ Thành viên
```

Lưu ý: bỏ dòng "Tổng quan" khỏi checkbox list — theo mục 16, Overview
**không phải** 1 permission lưu riêng, nó tự động hiện/ẩn widget dựa theo
quyền của module gốc (Công việc/Tài chính/...). Không cần checkbox hay
`ModuleAccessLevel` riêng cho `overview` trong Permission UI.

Owner:

```text
OWNER

Toàn quyền
```

Không cần permission controls.

---

# 25. Migration từ V1

Current:

```ts
permissions: {
  canEditAllExpenses: boolean;
}
```

V2 cần backward compatibility.

Suggested migration semantic:

```text
Editor
canEditAllExpenses = true

↓

finance = manage_all
```

Tuy nhiên cần lưu ý:

V1 `canEditAllExpenses=true` chỉ mở Expense. 

V2:

```text
finance.manage_all
```

đề xuất mở cả:

```text
Expense + Income
```

Do đó đây là **behavior expansion**, không phải mapping 1:1.

Implementation AI phải xử lý/migration có chủ đích, không silently đổi behavior production nếu chưa review data hiện có.

---

# 26. Module Registry Extension

Module definition nên có metadata permission.

Conceptual:

```ts
interface PlanModuleDefinition {
  id: PlanModuleId;

  // existing config...

  permissions?: {
    supportedAccessLevels: ModuleAccessLevel[];
  };
}
```

Example:

```ts
finance: {
  supportedAccessLevels: [
    'hidden',
    'view',
    'manage_own',
    'manage_all',
  ],
}
```

Wedding Guests:

```ts
weddingGuests: {
  supportedAccessLevels: [
    'hidden',
    'view',
    'manage_all',
  ],
}
```

Travel Itinerary — cùng pattern Wedding Guests, không có `manage_own` (mục
14.1):

```ts
travelItinerary: {
  supportedAccessLevels: [
    'hidden',
    'view',
    'manage_all',
  ],
}
```

Members:

```ts
members: {
  supportedAccessLevels: [
    'hidden',
    'view',
  ],
}
```

Debt Tracking — đặc thù nghiệp vụ Debt Plan, không có `manage_own`/
`manage_all` cho non-owner (xem mục 27.1):

```ts
debtTracking: {
  supportedAccessLevels: [
    'hidden',
    'view',
  ],
}
```

Không hard-code permission option theo:

```ts
if (plan.type === 'wedding')
```

---

# 27. Implementation Principle

AI implement phải giữ separation:

```text
ModuleAccessLevel
→ UX/config abstraction

PlanCapability
→ authorization abstraction

Firestore Rule
→ final security enforcement
```

Không thay toàn bộ capability system bằng `ModuleAccessLevel`.

`ModuleAccessLevel` **resolve thành capability**.

Điều này tận dụng kiến trúc hiện tại thay vì rewrite permission engine.

---

# 27.1 Resolved Default Access Matrix (chốt trước khi implement)

Các mục 7, 11, 14 nêu nguyên tắc chung nhưng để ngỏ default cụ thể cho
`travelItinerary` và `weddingGuests`. Đối chiếu với code hiện tại
(`travel-activity.service.ts`, `wedding-guest.service.ts`) cho thấy 2 module
này **đã** hoạt động như `manage_all` cho Editor từ trước — áp nguyên tắc
chung ("ownership resource → manage_own mặc định") một cách máy móc sẽ tạo
regression âm thầm. Quyết định cuối, dùng làm input duy nhất cho Phase 1:

| Module | Owner | Editor (default) | Viewer (default) | Ghi chú |
|---|---|---|---|---|
| overview | manage_all | view | view | luôn theo module gốc, không override riêng |
| planning (Todo) | manage_all | **manage_own** | view | net-new cho Editor — hiện tại editor không có quyền gì ở Todo, không có regression |
| planning (Milestone) | manage_all | **manage_own** | view | Amended 2026-08-23 (mục 13): Milestone không còn là shared resource — cùng own/all semantic với Todo. Reorder milestone vẫn cần manage_all |
| finance (Expense + Income) | manage_all | **manage_own** | view | thay thế `canEditAllExpenses`; giữ hành vi tương đương V1 làm default, owner nâng lên `manage_all` nếu cần — không tự mở rộng sang Income mặc định |
| settlement | manage_all | (không tách theo access level, giữ nguyên rule Owner-only hiện tại) | view | ngoài scope V2, xem mục 12 |
| weddingGuests | manage_all | **manage_all** ⚠️ | view | quyết định giữ nguyên hành vi hiện tại — KHÔNG default xuống `view` như gợi ý chung ở mục 7, vì editor hiện tại đã sửa/xoá được guest của người khác; hạ default sẽ là regression |
| travelItinerary | manage_all | **manage_all — không có `manage_own`** ⚠️ | view | quyết định giữ nguyên hành vi hiện tại (editor sửa được activity của bất kỳ ai, `travel-activity.service.ts:22-89` không check ownership) VÀ không expose `manage_own` như 1 option chọn được — cùng pattern `weddingGuests` (mục 14.1), tránh phải build ownership-check mới cho TravelActivity |
| members | manage_all | view | view/hidden | không dùng `manage_own`, giữ Owner-only cho `members.manage` (mục 15) |
| debtTracking | manage_all | **view — không có access level configurable** ⚠️ | view | đặc thù nghiệp vụ của Debt Plan: chỉ Owner được tạo/sửa khoản thu-chi debt, Editor và Viewer đều chỉ xem — không áp dụng `manage_own`/`manage_all` cho module này dù resource có `createdByUserId`. Không hiển thị dropdown access-level cho debtTracking trong Permission UI (mục 24), chỉ hiển thị "Chỉ xem" cố định hoặc ẩn hẳn control này với Owner |

Các dòng có ⚠️ là nơi default/behavior **khác** với nguyên tắc chung nêu ở
mục 7 — lý do lệch được ghi rõ ở cột Ghi chú để tránh AI implement áp sai
theo suy diễn chung.

## Quyết định sequencing

Go Live được **lùi lại** để triển khai V2 trước khi ra mắt, thay vì ship V1
rồi fast-follow.

**Xác nhận: Firestore hiện hoàn toàn chưa có plan/member data (kể cả
test/QA).** Do đó Phase 7 (Migration) được đơn giản hoá — không cần script
migrate dữ liệu thật, không cần lo mất quyền của member đang tồn tại. Chỉ
cần: resolver có default preset theo role (mục 19) và coi
`permissions.moduleAccess` là optional/nullable — member cũ (nếu có tạo
trong quá trình dev/test trước khi Phase 1-7 xong) tự động resolve theo
default, không cần backfill field. Mục 25 (Migration semantic
`canEditAllExpenses=true → finance=manage_all`) vẫn giữ làm tài liệu tham
khảo cho tương lai nhưng không phải việc phải làm ngay trong V2 lần này.

Phase 4 (Firestore rules) cũng đã giảm scope — chỉ còn write enforcement,
không làm read-security theo module (xem mục 22). TravelActivity không cần
build ownership-check mới (mục 14.1) — giảm thêm effort Phase 3.

Rủi ro thời gian lớn nhất giờ nằm ở **Phase 5-6** (Navigation/Overview +
Member Management UI), nơi cần đổi UI từ single checkbox
`canEditAllExpenses` thành dropdown module-level cho từng module.

---

# 28. Suggested Implementation Phases

### Phase 1 — Permission Contracts

Thêm:

```text
ModuleAccessLevel
PlanMemberPermissions.moduleAccess
Module permission metadata
```

Mở rộng capability cho những phần còn thiếu, đặc biệt:

```text
finance.editAllIncome
finance.deleteAllIncome
```

---

### Phase 2 — Resolver

Refactor:

```text
resolveModuleAccess()

resolvePlanCapabilities()

hasPlanCapability()
```

Test:

```text
Owner
Viewer
Editor manage_own
Editor manage_all
hidden
```

---

### Phase 3 — Service Enforcement

Review toàn bộ write services:

```text
Planning
Finance
Wedding Guests
Travel Itinerary
Debt
Members
```

Đảm bảo ownership check đúng `manage_own`.

---

### Phase 4 — Firestore Rules

Mirror resolver semantics cho **write** (`view` → không write, `manage_own`
→ write own only, `manage_all` → write bất kỳ):

```text
view
manage_own
manage_all
```

Không cần bổ sung read restrictions cho `hidden` — đã descope, xem mục 22.
Read của module `hidden` chỉ cần chặn ở UI (không render, không gọi query),
không sửa Firestore Rules cho phần đọc.

---

### Phase 5 — Navigation + Overview

Implement:

```text
module enabled
+
member access
```

cho navigation.

Overview widget filter theo module visibility.

---

### Phase 6 — Member Management UI

Thay `canEditAllExpenses` UI bằng module-level permission editor.

Không expose raw capabilities.

---

### Phase 7 — Migration / Compatibility (đã đơn giản hoá)

Xác nhận: chưa có plan/member data thật trong Firestore (xem mục 27.1) →
không cần migration script. Chỉ cần:

```text
resolver coi permissions.moduleAccess là optional
member thiếu field → dùng role default (mục 19)
```

Field `permissions.canEditAllExpenses` có thể xoá khỏi type/schema thay vì
giữ song song — không có dữ liệu cũ nào phụ thuộc field này.

---

# 29. Critical Tests

Implementation chưa hoàn thành nếu chưa pass tối thiểu:

```text
Viewer + finance hidden
→ không thấy Finance tab
→ không thấy Finance Overview widget
→ direct route không truy cập được
(Firestore Finance read bị deny — SKIP, đã descope theo mục 22)
```

```text
Editor + finance manage_own

Expense A created by Editor
→ edit/delete PASS

Expense B created by another member
→ edit/delete DENY
```

```text
Editor + finance manage_all

Expense B
→ edit/delete PASS

Income B
→ edit/delete PASS
```

```text
Editor + planning manage_own

Own Todo
→ edit/delete PASS

Other Todo
→ edit/delete DENY

Own Milestone
→ create + edit/delete PASS

Other Milestone
→ edit/delete DENY

Reorder milestones
→ DENY (bulk op requires manage_all — mục 13)
```

```text
Editor + finance manage_all

Manage Members
→ DENY

Change Permissions
→ DENY

Delete Plan
→ DENY
```

```text
Owner
→ everything PASS
```

---

# 30. Out of Scope V2

Không implement:

```text
Custom Role Builder

User-created roles

Per-record ACL

Per-field permission

Permission groups

Temporary permission

Permission expiration

Approval workflow

Hierarchical roles

PlanType-specific roles

Finance Editor / Wedding Editor / Travel Editor
```

Nếu tương lai xuất hiện nhu cầu thực tế mới review.

---

# 31. Final Decision

Go Plan Roles & Permissions V2 sử dụng:

```text
                    PLAN MEMBER
                         │
                         ▼
                ┌─────────────────┐
                │      ROLE       │
                │                 │
                │ Owner           │
                │ Editor          │
                │ Viewer          │
                └────────┬────────┘
                         │
                         ▼
               MODULE ACCESS LEVEL
                         │
          ┌──────────────┼───────────────┐
          │              │               │
        View         Manage Own      Manage All
          │              │               │
          └──────────────┼───────────────┘
                         ▼
                  CAPABILITY SET
                         │
                         ▼
                SERVICE ENFORCEMENT
                         │
                         ▼
                 FIRESTORE RULES
```

Ba nguyên tắc UX cuối cùng:

> **Owner — Tôi quản lý toàn bộ Plan.**

> **Editor — Tôi mặc định quản lý những gì tôi tạo; Owner có thể giao cho tôi quản lý toàn bộ một module.**

> **Viewer — Tôi chỉ xem những module Owner cho phép tôi xem.**

Và rule quan trọng nhất đối với Editor:

> **Editor chỉ được sửa/xóa dữ liệu của người khác khi Owner đã cấp rõ ràng `manage_all` cho module chứa dữ liệu đó.**

Tài liệu này đủ làm **architecture/input spec cho AI bắt đầu phân tích codebase và lập implementation plan**, nhưng trước khi cho AI code trực tiếp, tôi khuyến nghị bước kế tiếp là chuyển nó thành **implementation specification theo file/function cụ thể** (`PlanCapability` nào thêm, `PlanMemberDocument` thay đổi ra sao, resolver algorithm, migration strategy và Firestore rule mapping). Đây sẽ là lớp specs cuối cùng giúp tránh AI tự suy diễn khi code.
