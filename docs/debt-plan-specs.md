# Go Plan — Debt V2 Architecture Decisions

Đây là các quyết định nghiệp vụ và kiến trúc **đã chốt** cho `PlanType = debt`.

Hãy coi nội dung này là **source of truth mới nhất** khi cập nhật spec và implementation plan.

Có một thay đổi quan trọng so với proposal `Debt → Repayment` trước đó:

> **Không model Repayment như child của một Debt cụ thể.**

Debt V2 sử dụng **ledger / transaction model**.

---

# 1. Product Goal của Debt Plan

Debt Plan là một plan cá nhân dùng để quản lý công nợ giữa owner và các đối tượng khác.

Hỗ trợ cả hai chiều:

```text
Người khác nợ tôi
Tôi nợ người khác
```

Mục tiêu chính:

* Ghi nhận các lần cho vay / đi vay.
* Ghi nhận các lần trả nợ.
* Xem lịch sử giao dịch theo từng đối tượng.
* Biết hiện tại từng người còn nợ mình bao nhiêu.
* Biết hiện tại mình còn nợ từng người bao nhiêu.
* Tổng hợp toàn Plan:

  * Tổng phải thu.
  * Tổng phải trả.
  * Chênh lệch ròng.
* Có thể lưu ngày vay, hạn trả, ghi chú và attachment.

Debt Plan không phải loan/contract management system.

MVP ưu tiên:

> **Simple personal debt tracking.**

---

# 2. DebtTracking là Source of Truth

Với Debt Native:

```text
DebtTracking
    ↓
DebtTransaction[]
    ↓
Derived balances / statistics
```

`debtTracking` là domain nghiệp vụ chính.

Không sử dụng:

```text
Finance
Expense
Income
Settlement
```

làm source of truth cho Debt Native.

---

# 3. Finance trong Debt Native

Chốt:

> **Debt Native không enable Finance module.**

Configuration mong muốn:

```ts
debt: {
  modules: [
    'overview',
    'debtTracking',
    'members',
  ]
}
```

Không enable:

```ts
'finance'
```

Không enable `planning` trong Debt MVP nếu không có requirement khác.

Navigation sản phẩm có thể hiển thị:

```text
Tổng quan
Khoản nợ
Đối tượng
```

Không hiển thị:

```text
Tài chính
Công việc
```

---

# 4. Không map Debt sang Expense / Income

Không tạo mapping:

```text
Cho A vay
→ Expense

A trả tôi
→ Income
```

Tương tự:

```text
Tôi vay A
→ Income

Tôi trả A
→ Expense
```

Không làm như vậy.

Các transaction này thuộc Debt domain.

Ví dụ:

```text
11/02
Tôi cho A vay 10.000.000
```

chỉ tạo một:

```text
DebtTransaction
```

Không tạo Expense.

```text
13/02
A trả tôi 7.000.000
```

cũng chỉ tạo một:

```text
DebtTransaction
```

Không tạo Income.

Nếu tương lai cần cash-flow report, xây projection/read-model từ DebtTransaction.

Không duplicate dữ liệu sang Finance.

---

# 5. Thay đổi quan trọng: Không dùng `Debt → Repayment`

Proposal cũ:

```text
Debt
└── Repayment
```

và:

```text
/plans/{planId}/debts/{debtId}/repayments/{repaymentId}
```

**Không còn được sử dụng cho Debt V2.**

Lý do:

Ví dụ thực tế:

```text
Anh A

11/02  mượn tôi 10.000.000
12/02  mượn tôi  5.000.000
13/02  trả tôi    7.000.000
```

Nếu mỗi lần vay là một Debt riêng:

```text
Debt #1 = 10m
Debt #2 = 5m
```

thì không thể mặc định biết:

```text
Repayment 7m
```

đang trả:

* Debt #1;
* Debt #2;
* hay chia cho cả hai.

User trong use case hiện tại không cần quản lý allocation này.

Điều user cần biết đơn giản là:

```text
10m
+ 5m
- 7m
────
Còn nợ 8m
```

Vì vậy:

> **Repayment phải là một transaction độc lập trong debt ledger, không bắt buộc thuộc một loan/debt record cụ thể.**

---

# 6. Domain Model mới: DebtTransaction

Entity nghiệp vụ trung tâm là:

```ts
type DebtTransactionType =
  | 'loan'
  | 'repayment'
```

Direction:

```ts
type DebtDirection =
  | 'receivable'
  | 'payable'
```

Model đề xuất:

```ts
type DebtTransaction = {
  id: string
  planId: string

  counterpartyMemberId: string

  direction: DebtDirection
  type: DebtTransactionType

  amount: number

  occurredAt: Timestamp

  dueDate: Timestamp | null

  note: string | null
  attachments: Attachment[]

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

`dueDate` chỉ có semantic nghiệp vụ đối với:

```text
type = loan
```

Repayment thông thường:

```ts
dueDate = null
```

Implementation/schema có thể enforce bằng validation.

---

# 7. Ý nghĩa của `direction`

`direction` đại diện cho **loại công nợ**, không phải hướng cash flow của transaction.

## receivable

```ts
direction = 'receivable'
```

nghĩa là:

> Người khác nợ tôi.

Trong ledger này:

```text
loan
→ tăng khoản phải thu

repayment
→ giảm khoản phải thu
```

Ví dụ:

```text
Tôi cho Minh vay 10m
direction = receivable
type = loan
amount = 10m
```

Minh trả tôi 3m:

```text
direction = receivable
type = repayment
amount = 3m
```

Outstanding:

```text
10m - 3m = 7m
```

---

## payable

```ts
direction = 'payable'
```

nghĩa là:

> Tôi nợ người khác.

Trong ledger này:

```text
loan
→ tăng khoản phải trả

repayment
→ giảm khoản phải trả
```

Ví dụ:

```text
Tôi vay Minh 10m
direction = payable
type = loan
amount = 10m
```

Tôi trả Minh 3m:

```text
direction = payable
type = repayment
amount = 3m
```

Outstanding:

```text
10m - 3m = 7m
```

---

# 8. Firestore Structure

Debt Native sử dụng flat transaction collection:

```text
/plans/{planId}/debtTransactions/{transactionId}
```

Không sử dụng:

```text
/plans/{planId}/debts/{debtId}/repayments/{repaymentId}
```

Source of truth:

```text
Plan
└── debtTransactions
    ├── Transaction
    ├── Transaction
    ├── Transaction
    └── ...
```

Counterparty vẫn nằm trong:

```text
/plans/{planId}/members/{memberId}
```

Transaction tham chiếu:

```ts
counterpartyMemberId
```

---

# 9. Ví dụ dữ liệu

Case:

```text
Anh A

11/02  A mượn tôi 10m
12/02  A mượn tôi 5m
13/02  A trả tôi 7m
```

Data:

```text
Transaction #1
counterparty = A
direction    = receivable
type         = loan
amount       = 10m
occurredAt   = 11/02

Transaction #2
counterparty = A
direction    = receivable
type         = loan
amount       = 5m
occurredAt   = 12/02

Transaction #3
counterparty = A
direction    = receivable
type         = repayment
amount       = 7m
occurredAt   = 13/02
```

Derived:

```text
Total loan       = 15m
Total repayment  =  7m
Outstanding      =  8m
```

Không cần xác định 7m đang trả cho transaction #1 hay #2.

---

# 10. Một Counterparty có nhiều transaction

`PlanMember` không chứa debt balance làm source of truth.

Không làm:

```ts
member.debtAmount
member.repaidAmount
member.remainingAmount
```

Source of truth phải là:

```text
DebtTransaction[]
```

Member chỉ đại diện cho counterparty.

Ví dụ:

```text
Anh A
│
├── 11/02  Loan       +10m
├── 12/02  Loan        +5m
├── 13/02  Repayment   -7m
├── 20/02  Loan        +2m
└── 25/02  Repayment   -1m
```

Balance được derive từ transaction history.

---

# 11. Counterparty là PlanMember Guest

Chốt cho Debt V2 MVP:

```ts
PlanMember {
  memberType: 'guest'
}
```

Counterparty phải tồn tại trong member list.

Transaction chỉ lưu:

```ts
counterpartyMemberId
```

Không lưu `counterpartyName` như source of truth.

Guest:

* không login;
* không invite;
* không permission;
* không share Plan;
* không Editor;
* không Viewer;
* chưa support claim account trong MVP.

Debt Plan là personal plan.

---

# 12. UX thêm Counterparty

User không bắt buộc phải vào Members trước.

Trong Create Debt Transaction:

```text
Người
[ Anh A ▼ ]

[ + Thêm đối tượng mới ]
```

Nếu chọn:

```text
+ Thêm đối tượng mới
```

thì tạo:

```text
PlanMember
memberType = guest
```

ngay trong flow.

Sau đó sử dụng member mới làm:

```ts
counterpartyMemberId
```

---

# 13. Hai chiều trong cùng một Plan

Debt V2 support cả:

```text
receivable
payable
```

ngay phase đầu.

Ví dụ cùng Anh A:

```text
11/02  A mượn tôi       10m
12/02  A mượn tôi        5m
13/02  A trả tôi          7m

20/02  Tôi mượn A         3m
25/02  Tôi trả A           1m
```

Derived:

```text
A → Tôi
Phải thu còn lại = 8m

Tôi → A
Phải trả còn lại = 2m
```

Không tự động gộp thành:

```text
A nợ tôi 6m
```

---

# 14. Không Auto-Net

Chốt:

> Không net/gộp các obligation khác direction.

Ví dụ:

```text
Phải thu từ A: 8m
Phải trả A:    2m
```

Hai ledger vẫn độc lập.

UI được phép hiển thị:

```text
Net với A: +6m
```

nhưng chỉ là statistic.

Không sửa underlying transaction.

Không tạo transaction 6m thay thế.

---

# 15. Calculation Rules

Theo counterparty:

```ts
receivableLoan =
  sum(
    direction === 'receivable'
    && type === 'loan'
  )

receivableRepayment =
  sum(
    direction === 'receivable'
    && type === 'repayment'
  )

receivableOutstanding =
  receivableLoan - receivableRepayment
```

Tương tự:

```ts
payableLoan =
  sum(
    direction === 'payable'
    && type === 'loan'
  )

payableRepayment =
  sum(
    direction === 'payable'
    && type === 'repayment'
  )

payableOutstanding =
  payableLoan - payableRepayment
```

Net:

```ts
netPosition =
  receivableOutstanding
  - payableOutstanding
```

---

# 16. Plan Overview

Overview toàn Plan derive trực tiếp từ `DebtTransaction[]`.

Các metric:

```text
Total Receivable Loan
Total Receivable Repaid
Total Receivable Outstanding

Total Payable Loan
Total Payable Repaid
Total Payable Outstanding
```

Primary UI:

```text
Tổng phải thu
Tổng phải trả
Chênh lệch ròng
```

Ví dụ:

```text
Tổng phải thu       25.000.000
Tổng phải trả        8.000.000
──────────────────────────────
Chênh lệch          +17.000.000
```

`netPosition` chỉ là derived statistic.

---

# 17. Counterparty Summary

Theo từng người:

```text
Anh A

Phải thu
8.000.000

Phải trả
2.000.000

Net
+6.000.000
```

Khi mở detail:

```text
Anh A

Người khác nợ tôi
──────────────────
11/02  Mượn      +10m
12/02  Mượn       +5m
13/02  Đã trả     -7m

Còn phải thu       8m


Tôi nợ người khác
──────────────────
20/02  Tôi vay     +3m
25/02  Tôi trả     -1m

Còn phải trả       2m
```

Member summary chỉ là read-model.

Không persist làm Debt source of truth.

---

# 18. Create Transaction UX

Không cần expose technical concept `DebtTransaction`.

Primary CTA có thể là:

```text
+ Ghi nhận khoản nợ
```

Flow khi tạo khoản vay:

```text
Ai nợ ai?

[ Người khác nợ tôi ]
[ Tôi nợ người khác ]

Người
[ Anh A ▼ ]

Số tiền
[ 10.000.000 ]

Ngày
[ Hôm nay ]

Hạn trả
[ Không bắt buộc ]

Ghi chú
[ Không bắt buộc ]

Attachment
[ Không bắt buộc ]

[ Lưu ]
```

Internally:

```ts
type = 'loan'
```

---

# 19. Record Repayment UX

Không yêu cầu user chọn Debt/Loan cụ thể.

Ví dụ từ detail Anh A:

```text
Anh A
Còn nợ tôi 8.000.000

[ + Ghi nhận đã trả ]
```

Form:

```text
Số tiền
[ 3.000.000 ]

Ngày trả
[ Hôm nay ]

Ghi chú
[ Optional ]

Attachment
[ Optional ]

[ Lưu ]
```

Internally:

```ts
counterpartyMemberId = A
direction = receivable
type = repayment
```

Không có:

```ts
debtId
loanTransactionId
```

trong MVP.

---

# 20. Repayment Validation

Không cho repayment làm outstanding âm trong cùng ledger ở MVP.

Ví dụ:

```text
A còn nợ tôi 8m
```

User nhập:

```text
A trả tôi 10m
```

→ validation error.

Rule:

```ts
repaymentAmount <= currentOutstanding
```

Tương tự với `payable`.

Nếu tương lai cần support trả dư / advance / credit balance thì thiết kế riêng.

Không support trong MVP.

---

# 21. Due Date — Important Limitation

`dueDate` gắn với `loan` transaction.

Ví dụ:

```text
11/02 Loan 10m
due 01/03

12/02 Loan 5m
due 15/03

13/02 Repayment 7m
```

Vì repayment không allocate vào một loan cụ thể, hệ thống **không được tự khẳng định**:

```text
Loan #1 còn 3m
Loan #2 còn 5m
```

trừ khi có allocation rule rõ ràng.

MVP không support repayment allocation.

Do đó:

* tổng outstanding theo counterparty/direction là chính xác;
* lịch sử due date của từng lần loan vẫn được giữ;
* nhưng outstanding per individual loan không được suy diễn nếu repayment chưa allocate.

Không dùng FIFO ngầm mà không có spec.

---

# 22. Overdue trong MVP

Do không có repayment allocation, cần cẩn thận với khái niệm overdue.

Không được đơn giản tính:

```text
loan.dueDate < today
→ toàn bộ loan amount overdue
```

nếu counterparty đã có repayment chung nhưng chưa biết repayment áp dụng vào loan nào.

Phase đầu nên ưu tiên hiển thị:

```text
Có khoản vay đã đến/quá hạn
```

hoặc:

```text
Có giao dịch đến hạn cần kiểm tra
```

thay vì khẳng định một `overdueAmount` cụ thể theo loan.

Nếu cần tính overdue amount chính xác sau này, phải bổ sung repayment allocation strategy.

---

# 23. Future Repayment Allocation

Không implement trong MVP.

Schema/domain tương lai có thể bổ sung:

```ts
type RepaymentAllocation = {
  repaymentTransactionId: string
  loanTransactionId: string
  amount: number
}
```

Hoặc:

```text
repayment
└── allocations[]
```

Có thể support:

* manual allocation;
* FIFO suggestion;
* oldest-due-first;
* auto allocation.

Nhưng đây là extension.

Không thiết kế UX MVP phụ thuộc vào nó.

---

# 24. Hidden Milestone

Với:

```ts
debtModel = 'native_debt'
```

không tạo hidden milestone.

Hidden milestone hiện tại chỉ phục vụ Finance-derived Debt implementation.

Debt Native không sử dụng Finance.

Với legacy:

```ts
debtModel = 'finance_aggregate'
```

giữ nguyên behavior hiện tại.

Không cần xóa/migrate hidden milestone của plan cũ.

---

# 25. Debt Model Version / Compatibility

Đồng ý sử dụng compatibility marker:

```ts
type DebtModel =
  | 'finance_aggregate'
  | 'native_debt'
```

Trong Plan:

```ts
debtModel?: DebtModel
```

Backward compatibility:

```text
Plan debt cũ không có debtModel
→ hiểu là finance_aggregate
```

Plan debt mới:

```text
type = debt
debtModel = native_debt
```

`debtModel` là migration/compatibility field.

Không xem đây là long-term product capability.

Long-term target:

```text
PlanType debt
→ native_debt
```

---

# 26. Legacy và Native phải tách biệt

Legacy:

```text
Plan
type = debt
debtModel = finance_aggregate

Finance
├── Expense
└── Income
     ↓
Debt Aggregate
```

Native:

```text
Plan
type = debt
debtModel = native_debt

DebtTransaction[]
      ↓
Debt Ledger
      ↓
Overview / Counterparty Summary
```

Không trộn hai engine.

Native không đọc Expense/Income.

Legacy không đọc DebtTransaction.

---

# 27. Create Debt Plan mới

Sau khi Debt V2 release:

```ts
createPlan({
  type: 'debt',
  debtModel: 'native_debt',
})
```

Không:

* tạo hidden milestone;
* seed Finance;
* tạo Expense/Income setup;
* enable Finance navigation;
* enable Planning nếu không cần.

---

# 28. Module Architecture

Target:

```text
Plan Core
   ↓
PlanType Configuration
   ↓

Debt Native
│
├── Overview
│
├── DebtTracking
│   │
│   ├── DebtTransaction
│   │   ├── Loan
│   │   └── Repayment
│   │
│   ├── Balance Calculator
│   ├── Counterparty Summary
│   └── Plan Debt Summary
│
└── Members
    └── Guest Counterparties
```

`DebtTracking` không phụ thuộc Finance module.

---

# 29. Suggested Code Boundary

Có thể tổ chức:

```text
modules/debt-tracking/
├── components/
├── hooks/
├── services/
├── repositories/
├── schemas/
├── types/
├── calculators/
└── utils/
```

Pure calculation nên tách riêng:

```text
calculateCounterpartyDebt()
calculatePlanDebtSummary()
calculateOutstanding()
calculateNetPosition()
validateRepayment()
```

Các calculator:

* không đọc Firestore;
* không phụ thuộc React;
* không phụ thuộc Finance;
* input là DebtTransaction[];
* output là derived read-model.

---

# 30. Realtime

Debt Native vẫn tuân theo architecture chung của Go Plan:

```text
Firestore
    ↓ realtime
DebtTransaction[]
    ↓
Client-side calculation
    ↓
UI
```

Không cần Firebase Cloud Functions.

Không cần persist aggregate ở MVP.

Overview/statistics có thể tính trực tiếp trên client từ transaction data.

---

# 31. MVP không support

Không implement:

* Interest.
* Interest rate.
* Compound interest.
* Late fee.
* Installments.
* Payment schedule.
* Repayment allocation.
* Automatic FIFO.
* Automatic netting.
* Multiple lenders.
* Multiple borrowers cho một transaction.
* Shared Debt Plan.
* Invite.
* Editor/Viewer.
* Finance synchronization.
* Cash-flow projection.
* Multi-currency.
* Reminder automation.
* Contract management.

Các nội dung trên là future scope.

---

# 32. Final Domain Decision

Không sử dụng:

```text
Debt
└── Repayment
```

làm core model.

Sử dụng:

```text
DebtTracking
│
├── Counterparty
│   └── PlanMember guest
│
└── DebtTransaction[]
    ├── loan
    ├── loan
    ├── repayment
    ├── loan
    └── repayment
```

Ví dụ:

```text
Anh A

11/02  A mượn tôi      +10.000.000
12/02  A mượn tôi       +5.000.000
13/02  A trả tôi         -7.000.000
───────────────────────────────────
Còn phải thu             8.000.000
```

Đây là mental model chính của Debt V2.

---

# 33. Implementation instruction

Trước khi code, hãy:

1. Update Debt V2 specs theo domain mới.
2. Đánh dấu implementation hiện tại là legacy `finance_aggregate`.
3. Không reuse Finance domain cho Native Debt.
4. Introduce `debtModel`.
5. Introduce `DebtTransaction`.
6. Implement guest counterparty flow.
7. Implement pure ledger calculations.
8. Implement realtime repository/hook.
9. Implement Debt Overview.
10. Implement Counterparty Detail/Ledger.
11. Implement create Loan transaction.
12. Implement create Repayment transaction.
13. Sau đó mới xử lý edit/delete/filter và polish UI.

Không migrate legacy Debt trong phase này.

Không implement `Debt → Repayment`.

Không tự thêm repayment allocation/FIFO nếu spec chưa được mở rộng.

Nếu implementation hiện tại conflict với các quyết định trên, ưu tiên **spec này cho `native_debt`**, đồng thời giữ behavior cũ riêng cho `finance_aggregate`.
