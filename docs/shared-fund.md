# Shared Fund & Financial Statistics — Calculation Specification

**Status:** Ready for Implementation
**Scope:** Finance · Statistic · Expense · Income · Settlement · Shared Fund
**Mục tiêu:** Sửa mô hình tính balance hiện tại để hỗ trợ đúng `Shared Fund`, phân biệt tiền quỹ với tiền cá nhân và đảm bảo Settlement không tạo nghĩa vụ thanh toán sai.

---

# 1. Context

Finance hiện có ba loại dữ liệu chính:

```text
Expense
Income
Settlement
```

`Expense` là source of truth của chi tiêu thực tế và Finance chịu ownership của Expense/Income/Settlement.

Statistic được tính runtime, không lưu kết quả balance vào database. Đây tiếp tục là nguyên tắc của thiết kế mới.

Công thức member balance hiện tại về cơ bản là:

```ts
paid = sum(expenses paid by member)

owed = sum(expense shares of member)

incomeContributed = sum(incomes contributed by member)

balance =
    paid
  + incomeContributed
  - owed

adjustedBalance =
    balance
  + settlementPaid
  - settlementReceived
```

Vấn đề nằm ở việc `Income` được credit cho member đóng tiền nhưng hệ thống không có account đối ứng đại diện cho số tiền đang nằm trong quỹ.

---

# 2. Root Cause

Root cause không phải đơn giản là Income thiếu `receivedByMemberId`.

Root cause thực sự:

> **Finance model chưa có khái niệm Shared Fund và chưa phân biệt Expense được thanh toán bằng tiền cá nhân với Expense được thanh toán bằng tiền quỹ.**

Không được giải quyết bằng:

```ts
Income.receivedByMemberId;
```

hoặc:

```ts
recipient = plan.ownerMemberId;
```

Bởi vì:

> Người đang giữ tiền quỹ không đồng nghĩa với người sở hữu số tiền đó.

Shared Fund là một **financial account của Plan**, không phải một `PlanMember`.

---

# 3. Shared Fund Concept

Mỗi Plan sử dụng Finance theo mô hình chia tiền có một Shared Fund logic.

Ví dụ Travel:

```text
TRAVEL PLAN
    │
    ├── Members
    │
    │    ├── QP
    │    ├── Minh
    │    ├── Hường
    │    └── LA
    │
    └── Shared Fund
```

Shared Fund đại diện cho:

> **Số tiền chung thực tế hiện đang có sẵn để Plan sử dụng.**

Shared Fund không phải:

- PlanMember.
- Owner.
- Người giữ tiền mặt.
- Một fake member.
- Một recipient của Income.

V1 không bắt buộc tạo một Firestore document riêng cho Shared Fund.

Fund balance có thể được derive hoàn toàn từ transaction data.

---

# 4. Income Semantic

Trong scope hiện tại:

> **Income = một member đóng tiền vào Shared Fund.**

Ví dụ:

```text
Minh nạp quỹ
2.000.000 ₫
```

Economic effect:

```text
Minh contribution   +2.000.000
Shared Fund cash    +2.000.000
```

`contributedByMemberId` tiếp tục trả lời:

> Member nào đã đưa tiền của mình vào quỹ?

Không cần:

```ts
receivedByMemberId;
```

---

# 5. Expense phải xác định Payment Source

Đây là thay đổi bắt buộc.

Mỗi Expense phải trả lời được hai câu hỏi độc lập:

```text
1. Ai phải chịu khoản chi?
   → participants / shares

2. Tiền dùng để thanh toán khoản chi đến từ đâu?
   → payment source
```

Không được suy luận payment source từ `paidByMemberId`.

Concept:

```ts
type ExpensePaymentSource = 'member' | 'fund';
```

Expense:

```ts
interface ExpenseDocument {
  // existing fields...

  amount: number;

  paymentSourceType: 'member' | 'fund';

  /**
   * Required when paymentSourceType === 'member'.
   * Null when paymentSourceType === 'fund'.
   */
  paidByMemberId: string | null;

  participants: ExpenseParticipant[];
}
```

Invariant:

```ts
if (paymentSourceType === 'member') {
  paidByMemberId !== null;
}

if (paymentSourceType === 'fund') {
  paidByMemberId === null;
}
```

---

# 6. Member-paid Expense

Ví dụ:

```text
Expense
Khách sạn
4.000.000 ₫

Payment source:
QP
```

QP thực sự bỏ 4 triệu tiền cá nhân.

Effect:

```text
Shared Fund:
không thay đổi

QP:
personalExpensePaid += 4.000.000
```

Participants vẫn chịu expense theo split.

Ví dụ:

```text
QP       1.000.000
Minh     1.000.000
Hường    1.000.000
LA       1.000.000
```

Member balance effect:

```text
QP:
+4.000.000 paid
-1.000.000 owed

Minh:
-1.000.000 owed

Hường:
-1.000.000 owed

LA:
-1.000.000 owed
```

Shared Fund không bị giảm.

---

# 7. Fund-paid Expense

Ví dụ:

```text
Shared Fund:
5.000.000 ₫

Expense:
Khách sạn
4.000.000 ₫

Payment source:
Shared Fund
```

Effect:

```text
Fund:
5.000.000
-4.000.000
-----------
1.000.000
```

Không member nào được credit `paid`.

Participants vẫn chịu expense bình thường.

Ví dụ:

```text
QP       -1.000.000
Minh     -1.000.000
Hường    -1.000.000
LA       -1.000.000
```

Fund giảm:

```text
-4.000.000
```

---

# 8. Fund Balance

## 8.1 V1 Formula

Fund balance phải được tính runtime:

```ts
fundBalance =
  totalIncome - totalExpensePaidFromFund - totalSettlementPaidFromFund;
```

Trong đó:

```ts
totalIncome =
  sum(
    active incomes.amount
  )
```

```ts
totalExpensePaidFromFund =
  sum(
    active expenses.amount
    where paymentSourceType === 'fund'
  )
```

```ts
totalSettlementPaidFromFund =
  sum(
    completed settlements.amount
    where fromType === 'fund'
  )
```

Không dùng:

```ts
totalIncome - totalExpense;
```

vì Expense trả bằng tiền cá nhân không làm giảm tiền mặt trong Fund.

---

# 9. Fund Balance không lưu làm Source of Truth

Không nên lưu:

```ts
plan.fundBalance;
```

như financial source of truth.

Fund balance phải derive từ transaction hiện tại.

Lý do:

```text
Income có thể edit
Income có thể delete/cancel

Expense có thể edit
Expense có thể delete/cancel

Expense có thể đổi:
member → fund
fund → member

Settlement có thể thay đổi status
```

Nếu lưu aggregate riêng sẽ phát sinh synchronization risk.

Statistic hiện được thiết kế theo hướng runtime calculation, vì vậy Shared Fund tiếp tục tuân theo nguyên tắc đó.

---

# 10. Member Balance Formula

Trước Settlement:

```ts
memberBaseBalance = personalExpensePaid + fundContribution - expenseOwed;
```

Trong đó:

```ts
personalExpensePaid =
  sum(
    active expenses.amount
    where paymentSourceType === 'member'
    && paidByMemberId === member.id
  )
```

```ts
fundContribution =
  sum(
    active incomes.amount
    where contributedByMemberId === member.id
  )
```

```ts
expenseOwed =
  sum(
    active expense participant shares
    belonging to member
  )
```

Sau confirmed/completed Settlement:

```ts
adjustedMemberBalance =
  memberBaseBalance + settlementPaidByMember - settlementReceivedByMember;
```

Lưu ý:

```text
Fund → Member settlement
```

chỉ làm:

```text
settlementReceivedByMember += amount
```

Không có member nào nhận `settlementPaid`.

Fund side được xử lý riêng trong `fundBalance`.

---

# 11. Ý nghĩa dấu của Member Balance

```text
balance > 0
→ Member cần được nhận lại tiền.

balance < 0
→ Member còn nghĩa vụ phải trả.

balance = 0
→ Member đã cân bằng.
```

Ví dụ:

```text
QP balance
+2.000.000
```

nghĩa là:

> Plan/group còn phải hoàn lại QP 2.000.000 ₫.

Không nhất thiết một member cụ thể đang nợ QP toàn bộ số tiền này.

Fund có thể thanh toán một phần hoặc toàn bộ.

---

# 12. Invariant mới

Sau khi Shared Fund được đưa vào model, invariant cũ:

```ts
sum(memberBalance) === 0;
```

**không còn đúng trong mọi thời điểm.**

Invariant mới:

```ts
sum(adjustedMemberBalance) === fundBalance;
```

Tương đương nếu Fund được biểu diễn như một account có dấu đối ứng:

```ts
sum(adjustedMemberBalance) - fundBalance === 0;
```

Ví dụ:

```text
Members contribution      +10.000.000
Member-paid Expense        +3.000.000
Expense owed               -9.000.000
--------------------------------------
Σ Member Balance           +4.000.000
```

Trong khi:

```text
Fund Income                +10.000.000
Fund-paid Expense           -6.000.000
--------------------------------------
Fund Balance                +4.000.000
```

Invariant:

```text
Σ Member Balance
=
Fund Balance
=
4.000.000
```

Đây là trạng thái hợp lệ.

Không có tiền ảo.

---

# 13. Settlement phải hiểu Shared Fund

Settlement hiện không thể chỉ xử lý:

```text
Member → Member
```

Sau thay đổi phải hỗ trợ:

```text
Member → Member
Fund   → Member
```

Không cần dùng:

```text
Member → Fund
```

cho contribution vì flow này đã được Income biểu diễn:

```text
Member → Fund
=
Income
```

---

# 14. Settlement Data Model

Concept:

```ts
type SettlementFromType = 'member' | 'fund';

interface SettlementDocument {
  id: string;

  fromType: SettlementFromType;

  /**
   * Required when fromType === 'member'.
   * Null when fromType === 'fund'.
   */
  fromMemberId: string | null;

  toMemberId: string;

  amount: number;

  status: 'pending' | 'completed' | 'cancelled';

  createdAt: Timestamp;
}
```

Invariant:

```ts
fromType === 'member'
→ fromMemberId required
```

```ts
fromType === 'fund'
→ fromMemberId === null
```

`toMemberId` vẫn required trong V1.

---

# 15. Settlement Suggestion Algorithm

Settlement phải xử lý Fund trước khi tạo nghĩa vụ member-to-member.

Flow:

```text
Calculate member balances
        ↓
Calculate fund balance
        ↓
Find creditors
(balance > 0)
        ↓
Fund available?
        ↓ YES
Allocate Fund → creditors
        ↓
Update projected balances
        ↓
Fund exhausted OR no creditors
        ↓
Run normal Member → Member settlement
        ↓
Generate suggestions
```

Pseudo-code:

```ts
let availableFund = fundBalance;

const projectedBalances = clone(memberBalances);

for (const creditor of creditors) {
  if (availableFund <= 0) break;

  const amount = Math.min(creditor.balance, availableFund);

  suggestions.push({
    fromType: 'fund',
    fromMemberId: null,
    toMemberId: creditor.memberId,
    amount,
  });

  creditor.balance -= amount;
  availableFund -= amount;
}

runMemberToMemberSettlement(projectedBalances);
```

---

# 16. Fund phải được ưu tiên trước Member Settlement

Ví dụ:

```text
Fund:
4.000.000

QP:
+6.000.000

Minh:
-1.000.000

Hường:
-500.000

LA:
-500.000
```

Invariant:

```text
Σ memberBalance
=
4.000.000
=
Fund
```

Settlement suggestion:

```text
1. Fund → QP
   4.000.000

2. Minh → QP
   1.000.000

3. Hường → QP
   500.000

4. LA → QP
   500.000
```

Không được đề xuất ngay:

```text
Minh/Hường/LA → QP
```

mà bỏ qua 4 triệu đang có sẵn trong Fund.

---

# 17. Vì sao Fund phải được dùng trước?

Nếu Fund còn:

```text
4.000.000
```

nhưng hệ thống vẫn yêu cầu member chuyển thêm tiền:

```text
Minh → QP
```

user sẽ gặp trạng thái:

```text
Quỹ vẫn giữ tiền

+

Members lại phải bỏ thêm tiền
```

Điều này tạo cash movement không cần thiết.

Do đó:

> **Settlement Suggestion MUST consume available Shared Fund before generating Member → Member settlements.**

---

# 18. Nhiều Creditor nhưng Fund không đủ

Ví dụ:

```text
Fund:
4.000.000

QP:
+5.000.000

Minh:
+2.000.000

Hường:
-2.000.000

LA:
-1.000.000
```

Fund không đủ trả toàn bộ creditor.

Settlement algorithm cần deterministic ordering.

V1 recommendation:

```text
Sort creditors by:
1. balance DESC
2. stable member id/order as tie-breaker
```

Ví dụ:

```text
Fund → QP
4.000.000
```

Projected:

```text
QP       +1.000.000
Minh     +2.000.000
Hường    -2.000.000
LA       -1.000.000
```

Sau đó member settlement có thể là:

```text
Hường → Minh
2.000.000

LA → QP
1.000.000
```

Ordering chỉ ảnh hưởng đường đi của tiền, không được ảnh hưởng final balance.

---

# 19. Confirm Fund Settlement

Suggestion:

```text
Fund → QP
4.000.000
```

chưa ảnh hưởng financial state nếu chỉ là preview.

Chỉ khi user confirm:

```text
status = completed
```

mới được tính vào:

```ts
totalSettlementPaidFromFund;
```

và:

```ts
settlementReceivedByMember;
```

Sau confirm:

```text
Fund:
-4.000.000

QP balance:
-4.000.000 so với trước settlement
```

Invariant vẫn giữ.

---

# 20. Không được double-count Fund Settlement

Fund → Member Settlement có hai effect đối ứng:

```text
Fund decreases

Member creditor balance decreases
```

Không được đồng thời:

```text
create Income
```

hoặc:

```text
create Expense
```

để biểu diễn cùng transaction.

Một transaction:

```text
Fund → QP 4.000.000
```

chỉ có một financial record:

```text
Settlement
fromType = fund
toMemberId = QP
amount = 4.000.000
```

---

# 21. Runtime Recalculation

Mọi Statistic phải được calculate từ current transaction state.

Nếu user edit:

```text
Income
2.000.000 → 3.000.000
```

Fund tăng runtime:

```text
+1.000.000
```

Nếu user edit:

```text
Fund Expense
1.000.000 → 1.500.000
```

Fund giảm runtime:

```text
-500.000
```

Nếu Expense đổi:

```text
member → fund
```

thì:

```text
member personal paid
↓ remove

fund expense
↑ add
```

Nếu đổi:

```text
fund → member
```

thì ngược lại.

Không thực hiện incremental mutation lên một stored `fundBalance`.

---

# 22. Validation khi Create/Edit Fund Expense

Không được chỉ kiểm tra current Fund balance.

Phải kiểm tra **projected Fund balance sau operation**.

## Create

```ts
projectedFundBalance = currentFundBalance - newExpense.amount;
```

Require:

```ts
projectedFundBalance >= 0;
```

## Edit Fund Expense

Ví dụ existing:

```text
Fund Expense:
1.000.000
```

Fund hiện tại runtime:

```text
500.000
```

Con số `500.000` đã bao gồm existing expense.

User sửa:

```text
1.000.000 → 1.300.000
```

Không được validate:

```text
500.000 >= 1.300.000 // WRONG
```

Phải restore existing impact trước:

```ts
availableBeforeEditedExpense = currentFundBalance + existingExpense.amount;
```

sau đó:

```ts
projectedFundBalance = availableBeforeEditedExpense - updatedExpense.amount;
```

Ví dụ:

```text
500.000
+1.000.000
-1.300.000
-----------
200.000
```

Valid.

---

# 23. Edit Payment Source Edge Cases

## Member → Fund

Existing:

```text
QP paid
2.000.000
```

Change:

```text
Shared Fund paid
2.000.000
```

Effects:

```text
QP personalExpensePaid
-2.000.000

Fund
-2.000.000
```

Must validate Fund availability.

---

## Fund → Member

Existing:

```text
Fund paid
2.000.000
```

Change:

```text
QP paid
2.000.000
```

Effects:

```text
Fund
+2.000.000

QP personalExpensePaid
+2.000.000
```

No insufficient-fund validation required.

---

# 24. Edit Income Edge Case

Giả sử:

```text
Income total:
10.000.000

Fund Expense:
9.000.000

Fund:
1.000.000
```

User sửa Income:

```text
10.000.000
→
8.000.000
```

Projected Fund:

```text
8.000.000 - 9.000.000
=
-1.000.000
```

Không được cho phép edit tạo Fund âm.

Service phải reject operation.

Ví dụ error:

```text
Không thể cập nhật khoản nạp quỹ.

Sau thay đổi, số dư quỹ sẽ thiếu 1.000.000 ₫.
```

Tương tự khi delete/cancel Income.

---

# 25. Delete Income Edge Case

Nếu:

```text
Income Minh:
3.000.000

Fund balance:
2.000.000
```

delete Income sẽ làm:

```text
projectedFundBalance:
-1.000.000
```

Operation phải bị block.

Không được để transaction history tạo trạng thái Fund âm.

---

# 26. Delete Fund Expense

Delete:

```text
Fund Expense:
2.000.000
```

Effect:

```text
Fund balance:
+2.000.000
```

Operation không gây insufficient-fund issue.

Statistic recalculates runtime.

---

# 27. Settlement và dữ liệu thay đổi sau Suggestion

Settlement suggestion chỉ là snapshot calculation.

Ví dụ:

```text
Fund = 4.000.000
```

UI đang hiển thị:

```text
Fund → QP
4.000.000
```

Trong lúc đó một transaction khác được tạo:

```text
Fund Expense
3.000.000
```

Fund thực tế còn:

```text
1.000.000
```

Không được confirm suggestion cũ 4 triệu.

SettlementService khi confirm phải **revalidate current financial state**.

Ít nhất phải verify:

```ts
currentFundBalance >= settlement.amount;
```

Đối với Fund settlement.

Nếu không:

```text
Settlement state stale
→ reject
→ request recalculation
```

---

# 28. Pending Settlement

`pending` settlement không được thay đổi Fund balance hoặc member adjusted balance nếu product semantic hiện tại coi settlement chỉ có hiệu lực khi hoàn tất.

Recommended:

```text
pending
→ informational / awaiting confirmation

completed
→ financial effect

cancelled
→ no financial effect
```

Statistic chỉ include:

```ts
status === 'completed';
```

---

# 29. Fund không được âm

V1 invariant:

```ts
fundBalance >= 0;
```

Fund đại diện cho cash thực đang tồn tại.

Nếu Fund không đủ:

```text
Expense phải chuyển sang member-paid
```

Không được dùng:

```text
Fund = -2.000.000
```

để biểu diễn:

> QP đang ứng 2 triệu.

Đó là member balance, không phải Fund cash.

---

# 30. Không tự động chọn Fund chỉ vì Fund đủ tiền

Ví dụ:

```text
Fund:
20.000.000
```

QP dùng thẻ cá nhân trả:

```text
Hotel:
5.000.000
```

Expense vẫn hợp lệ:

```text
paymentSourceType = member
paidByMemberId = QP
```

Fund:

```text
20.000.000
```

không thay đổi.

UI có thể suggest Fund nhưng không được suy luận rằng:

```text
Fund đủ tiền
→ Expense bắt buộc Fund-paid
```

Payment source phải phản ánh transaction thực tế.

---

# 31. Member Contribution lớn hơn nghĩa vụ của Member

Ví dụ:

```text
Minh contribution:
5.000.000

Minh expense owed:
2.000.000
```

Minh có thể có:

```text
balance:
+3.000.000
```

Đây không phải bug.

Nó nghĩa là Minh đã đưa vào nhóm nhiều hơn phần chi phí Minh phải chịu.

Nếu Fund còn tiền, Fund có thể hoàn lại Minh trong settlement.

---

# 32. Fund còn tiền nhưng không có Creditor

Với dữ liệu hợp lệ và invariant:

```ts
sum(memberBalance) === fundBalance;
```

nếu:

```text
fundBalance > 0
```

thì về tổng thể phải tồn tại positive member balance tương ứng, nếu toàn bộ Fund đến từ member contributions.

Nếu xảy ra:

```text
Fund > 0
No creditor
```

Statistic nên coi đây là dấu hiệu:

```text
financial invariant violation
```

hoặc có một loại Fund inflow khác chưa được model.

Không silently tạo settlement tùy ý.

---

# 33. External Fund Income — Future

Không implement trong V1 nếu chưa có requirement.

Future có thể có:

```text
Hotel refund
Bank interest
Cashback
External sponsorship
```

Các khoản này:

```text
increase Fund
```

nhưng không thuộc contribution của member nào.

Khi đó có thể mở rộng:

```ts
incomeType:
  | 'member_contribution'
  | 'fund_income';
```

`fund_income`:

```text
Fund +
Member contribution 0
```

Khi feature này xuất hiện, invariant:

```ts
sum(memberBalance) === fundBalance;
```

sẽ cần được mở rộng vì một phần Fund không thuộc member contribution.

Không implement trước khi business rule về ownership của external income được xác định.

---

# 34. Historical Data / Backward Compatibility

Existing Expense hiện có `paidByMemberId` nhưng chưa có:

```ts
paymentSourceType;
```

Không được tự động suy luận existing expense là Fund-paid chỉ vì Fund có tiền.

Safe migration rule:

```text
Existing Expense
with paidByMemberId
and missing paymentSourceType

→ treat as:
paymentSourceType = 'member'
```

Điều này giữ nguyên financial result trước migration.

Existing Income:

```text
contributedByMemberId
```

được interpret là:

```text
member_contribution → Shared Fund
```

Existing Settlement:

```text
fromMemberId
toMemberId
```

được interpret:

```text
fromType = 'member'
```

Không yêu cầu migration toàn bộ documents nếu code có backward-compatible resolver.

---

# 35. Statistic Result Model

Recommended conceptual output:

```ts
interface FinancialStatistic {
  totalExpense: number;

  totalIncome: number;

  fund: {
    balance: number;

    totalContribution: number;

    totalExpensePaidFromFund: number;

    totalSettlementPaidFromFund: number;
  };

  members: MemberFinancialStatistic[];

  settlementSuggestions: SettlementSuggestion[];

  invariant: {
    memberBalanceTotal: number;
    fundBalance: number;
    difference: number;
    valid: boolean;
  };
}
```

Member:

```ts
interface MemberFinancialStatistic {
  memberId: string;

  personalExpensePaid: number;

  expenseOwed: number;

  fundContribution: number;

  settlementPaid: number;

  settlementReceived: number;

  balanceBeforeSettlement: number;

  adjustedBalance: number;
}
```

---

# 36. Invariant Validation

StatisticService nên calculate:

```ts
difference = sum(adjustedMemberBalances) - fundBalance;
```

Expected:

```ts
difference === 0;
```

Vì hệ thống dùng integer currency amounts, không cần epsilon nếu tất cả split đã đảm bảo tổng chính xác.

SplitService hiện đã sử dụng largest-remainder để đảm bảo tổng participant shares khớp chính xác Expense amount.

Nếu:

```ts
difference !== 0;
```

không được tự động sửa bằng cách:

```ts
assign difference to owner
```

hoặc:

```ts
assign difference to fund
```

Phải coi đây là:

```text
financial invariant violation
```

và log đủ context để debug.

---

# 37. Critical Edge Case — Expense Participants

Payment source và participants hoàn toàn độc lập.

Ví dụ QP trả:

```text
1.000.000
```

nhưng QP không phải participant.

Valid:

```text
payment source:
QP

participants:
Minh
Hường
```

QP:

```text
+1.000.000
```

Minh/Hường:

```text
-500.000
-500.000
```

Tương tự Fund-paid Expense không yêu cầu tất cả members phải participate.

---

# 38. Critical Edge Case — Contributor không tham gia Expense

Minh có thể:

```text
contribute 5.000.000
```

nhưng không participate trong một số Expense.

Contribution không phải Expense share.

Không được tự động phân bổ Income theo participants.

---

# 39. Critical Edge Case — Removed Member

Nếu member đã:

```text
status = removed
```

nhưng có historical:

```text
Income
Expense
Settlement
```

Statistic vẫn phải giữ financial history của member đó nếu transaction vẫn active.

Không được xóa contribution/payment khỏi calculation chỉ vì member không còn active.

UI có thể label:

```text
Minh
Đã rời nhóm
```

nhưng financial obligation vẫn tồn tại cho đến khi được xử lý theo business rule riêng.

---

# 40. Critical Edge Case — Deleted Member Reference

Nếu historical transaction tham chiếu member không còn resolve được:

```text
paidByMemberId = missing
```

hoặc:

```text
contributedByMemberId = missing
```

không được silently chuyển transaction sang Owner hoặc Fund.

Statistic phải:

```text
preserve amount
flag unresolved member reference
```

và không tạo settlement suggestion không an toàn từ dữ liệu đó.

---

# 41. Critical Edge Case — Change Expense Amount + Split

Khi Expense amount thay đổi:

```text
4.000.000
→
5.000.000
```

phải update participant shares theo Expense business flow trước.

Statistic chỉ consume persisted shares.

StatisticService không được tự chia lại Expense.

Architecture hiện quy định SplitService chịu trách nhiệm split và Expense lưu amount đã chia; Statistic chỉ tính toán từ dữ liệu đó.

---

# 42. Critical Edge Case — Fund Expense bằng đúng Fund Balance

Valid:

```text
Fund:
2.000.000

Expense:
2.000.000
```

Result:

```text
Fund:
0
```

Không yêu cầu:

```text
fundBalance > expenseAmount
```

Validation phải là:

```ts
fundBalance >= expenseAmount;
```

---

# 43. Critical Edge Case — Zero Fund

Nếu:

```text
fundBalance = 0
```

Fund không được xuất hiện như payment source khả dụng cho Expense > 0.

Settlement Suggestion bỏ qua Fund allocation và chạy member-to-member settlement trực tiếp.

---

# 44. Critical Edge Case — Settlement vượt Creditor Balance

Không tạo:

```text
Fund → QP
5.000.000
```

nếu QP chỉ còn:

```text
+3.000.000
```

Rule:

```ts
fundSettlementAmount <= creditor.balance;
```

và:

```ts
fundSettlementAmount <= fundBalance;
```

Do đó:

```ts
amount = min(creditor.balance, availableFund);
```

---

# 45. Critical Edge Case — Existing Completed Settlement

Settlement Suggestion phải sử dụng:

```text
adjusted balances
```

sau các completed settlements.

Không được suggest lại nghĩa vụ đã được thanh toán.

Ví dụ:

```text
QP originally:
+5.000.000

Completed:
Fund → QP
3.000.000
```

Statistic phải thấy:

```text
QP:
+2.000.000
```

và:

```text
Fund:
-3.000.000
```

Suggestion tiếp theo chỉ xử lý 2 triệu còn lại.

---

# 46. Settlement Algorithm Final Invariant

Sau khi apply toàn bộ **suggested settlements** trên projected state:

```ts
projectedFundBalance === 0;
```

và:

```ts
every(projectedMemberBalances === 0);
```

nếu mục tiêu của action là **settle toàn bộ Plan tại thời điểm hiện tại**.

Trước khi settlement được confirm, đây chỉ là projected state.

Không mutate financial source records trong StatisticService.

---

# 47. StatisticService Responsibilities

`StatisticService` chịu trách nhiệm:

```text
Calculate total Expense

Calculate Fund balance

Calculate member:
- personal paid
- contribution
- owed
- completed settlements
- adjusted balance

Validate financial invariants

Generate inputs cho Settlement suggestion
```

Không:

```text
Write Firestore
Modify Expense
Modify Income
Confirm Settlement
Repair invalid data
```

Architecture hiện yêu cầu business logic nằm ở Service và Statistic được tính runtime.

---

# 48. ExpenseService Responsibilities

ExpenseService phải validate:

```text
payment source

paidByMemberId consistency

Fund availability khi:
- create Fund Expense
- increase Fund Expense
- member → fund
```

Nếu operation làm:

```text
projectedFundBalance < 0
```

reject.

---

# 49. IncomeService Responsibilities

IncomeService phải validate Fund solvency khi:

```text
decrease Income

delete Income

cancel Income
```

Nếu operation làm:

```text
projectedFundBalance < 0
```

reject.

Create/increase Income không gây insufficient-fund issue.

---

# 50. SettlementService Responsibilities

SettlementService phải:

```text
Generate Fund → Member suggestions first

Generate Member → Member suggestions second

Revalidate Fund before confirming Fund settlement

Persist completed settlement

Never mutate Income/Expense to represent settlement
```

Settlement hiện là một phần của Finance Core và đại diện cho đối soát balance giữa members; thiết kế mới mở rộng nó để Shared Fund có thể là nguồn thanh toán mà không biến Fund thành member.

---

# 51. Recommended Implementation Order

```text
1. Add paymentSourceType to Expense model.

2. Backward-compatible existing Expense:
   missing paymentSourceType → member.

3. Update Expense create/edit UI.

4. Implement calculateFundBalance().

5. Update member paid calculation:
   only member-paid Expenses count.

6. Keep Income contribution credit.

7. Implement invariant:
   Σ member adjusted balance = Fund balance.

8. Extend Settlement model:
   fromType = member | fund.

9. Update Settlement suggestion:
   Fund → creditor first.

10. Update Settlement confirmation.

11. Add projected Fund validation
    to Expense/Income mutations.

12. Add automated tests.
```

---

# 52. Required Automated Tests

At minimum:

```text
FUND-01
Income increases Fund.

FUND-02
Member-paid Expense does not decrease Fund.

FUND-03
Fund-paid Expense decreases Fund.

FUND-04
Cannot create Fund Expense > Fund balance.

FUND-05
Fund Expense == Fund balance is valid.

FUND-06
Editing Fund Expense recalculates projected balance correctly.

FUND-07
Changing member-paid → Fund-paid validates Fund.

FUND-08
Changing Fund-paid → member-paid restores Fund.

FUND-09
Cannot decrease Income if resulting Fund < 0.

FUND-10
Cannot delete Income if resulting Fund < 0.

BALANCE-01
Member-paid Expense credits payer.

BALANCE-02
Fund-paid Expense credits no member.

BALANCE-03
Income credits contributor.

BALANCE-04
Expense shares debit participants regardless of payment source.

BALANCE-05
Σ adjustedMemberBalance == Fund balance.

SETTLEMENT-01
Fund is allocated before Member → Member settlement.

SETTLEMENT-02
Fund can partially pay creditor.

SETTLEMENT-03
Fund can fully pay creditor.

SETTLEMENT-04
Fund can pay multiple creditors.

SETTLEMENT-05
Fund settlement never exceeds Fund balance.

SETTLEMENT-06
Fund settlement never exceeds creditor balance.

SETTLEMENT-07
Completed Fund settlement decreases Fund.

SETTLEMENT-08
Completed Fund settlement decreases creditor balance.

SETTLEMENT-09
Pending Fund settlement has no financial effect.

SETTLEMENT-10
Cancelled Fund settlement has no financial effect.

SETTLEMENT-11
Existing completed settlement is not suggested again.

SETTLEMENT-12
Stale Fund settlement is rejected at confirmation.

COMPAT-01
Legacy Expense without paymentSourceType behaves as member-paid.

COMPAT-02
Legacy Settlement behaves as fromType=member.

EDGE-01
Removed member financial history remains in calculation.

EDGE-02
Missing member reference produces invariant/data warning.

EDGE-03
Payer does not need to be participant.

EDGE-04
Contributor does not need to participate in Expense.

EDGE-05
Editing transaction triggers complete runtime recalculation.
```

---

# 53. Out of Scope — V1

Không implement trong scope này:

```text
Multiple Shared Funds

Fund per milestone

Fund per currency

Fund custodian/member ownership

Bank account reconciliation

Fund → external account transfer

External income ownership rules

Partial Expense payment:
Fund + Member cùng trả một Expense

Automatic cash/bank synchronization
```

Đặc biệt:

```text
Expense payment source
```

V1 chỉ có:

```text
100% Fund
```

hoặc:

```text
100% một Member
```

Không hỗ trợ:

```text
Expense 5.000.000

Fund   2.000.000
QP     3.000.000
```

Nếu sau này có requirement thực tế, mở rộng thành multiple payment allocations thay vì patch model hiện tại.

---

# 54. Architecture Invariants — MUST NOT BREAK

Implementation hoàn thành phải đảm bảo:

```text
1. Shared Fund không phải PlanMember.

2. Người giữ tiền quỹ không phải recipient mặc định của Income.

3. Income contribution làm tăng Fund và credit contributor.

4. Member-paid Expense không thay đổi Fund.

5. Fund-paid Expense làm giảm Fund.

6. Fund không được âm.

7. Expense payment source độc lập với participants.

8. Statistic được calculate runtime.

9. Không lưu fundBalance làm financial source of truth.

10. Σ adjustedMemberBalance = Fund balance.

11. Fund được sử dụng trước khi tạo Member → Member settlement suggestion.

12. Fund → Member phải được persist thành Settlement khi completed.

13. Completed Fund Settlement giảm cả Fund và creditor balance.

14. Không double-count Fund Settlement bằng Expense hoặc Income.

15. Existing data phải backward compatible.

16. StatisticService không tự repair financial data.

17. Edit/delete transaction phải validate projected Fund state.

18. Settlement confirmation phải revalidate state để chống stale suggestion.
```

---

# 55. Final Mental Model

Finance sau thay đổi phải được hiểu theo mô hình:

```text
                    MEMBER
                       │
                       │ Income / Contribution
                       ▼
                ┌─────────────┐
                │ SHARED FUND │
                └─────────────┘
                   │       │
        Fund-paid  │       │ Fund Settlement
          Expense  │       │
                   ▼       ▼
                EXPENSE   MEMBER


MEMBER
   │
   │ Member-paid Expense
   ▼
EXPENSE
```

Ba câu hỏi luôn phải được giữ độc lập:

```text
Expense participants
→ Ai chịu khoản chi?

Expense payment source
→ Tiền thực tế dùng để thanh toán đến từ đâu?

Income contributor
→ Ai đã đưa tiền cá nhân vào Shared Fund?
```

Settlement trả lời câu hỏi thứ tư:

```text
Sau tất cả giao dịch,
tiền đang có trong Fund và nghĩa vụ giữa các member
cần được cân bằng như thế nào?
```

Đây là semantic nền tảng mà implementation không được làm mất.
