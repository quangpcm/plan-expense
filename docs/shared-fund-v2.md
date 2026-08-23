# Finance Update Specification — Replace Fund Executor with Income Allocation

**Status:** Ready for Implementation
**Scope:** Finance · Income · Shared Fund · Statistic · Settlement · Migration from Executor Model
**Goal:** Bỏ hướng `executedByMemberId` cho Fund Settlement và chuyển sang mô hình mỗi `Income` có thể được **phân bổ cho một member cụ thể** thông qua `allocatedToMemberId`.

---

# 1. Context

Hệ thống hiện đã implement hướng:

```text
Economic Settlement
Fund → Member

+

executedByMemberId
→ ai thực hiện physical transfer
```

Ví dụ:

```text
Fund → Minh
578.000 ₫

executedByMemberId = QP
```

UI resolve thành:

```text
QP → Minh
578.000 ₫
Từ quỹ chung
```

Hướng này đúng về accounting nhưng tạo UX phức tạp:

- Shared Fund xuất hiện trong Settlement.
- User phải chọn executor.
- Member card có thể hiển thị economic balance khác với số tiền thực tế user cần chuyển/nhận.
- Settlement cuối cùng khó đọc hơn cách đối soát trực tiếp giữa members.

Business model mới được chốt:

> **Khi tạo Income, user có thể xác định khoản tiền này được dùng để hoàn cho member nào.**

Ví dụ:

```text
Hường nạp quỹ 2.838.250 ₫
→ Phân bổ cho QP
```

Income vẫn là:

```text
Hường → Shared Fund
```

nhưng economic allocation là:

```text
Shared Fund allocation → QP
```

Shared Fund vẫn là account độc lập, không thuộc QP.

---

# 2. Architecture Decision

Bỏ hướng:

```ts
Settlement.executedByMemberId;
```

khỏi calculation và UI flow.

Thay bằng:

```ts
Income.allocatedToMemberId;
```

Concept:

```ts
type IncomeDocument = {
  // existing fields...

  contributedByMemberId: string;

  /**
   * Member mà khoản contribution này được dùng để hoàn.
   *
   * null:
   * tiền vẫn nằm trong Shared Fund chưa phân bổ.
   */
  allocatedToMemberId: string | null;
};
```

Default khi tạo Income:

```ts
allocatedToMemberId = plan.ownerMemberId;
```

User có thể đổi sang member khác.

---

# 3. Semantic của `allocatedToMemberId`

Field này KHÔNG có nghĩa:

```text
Income belongs to member
```

KHÔNG có nghĩa:

```text
member đang giữ toàn bộ Shared Fund
```

KHÔNG có nghĩa:

```text
contributor chuyển tiền trực tiếp cho allocated member
```

Semantic đúng:

> Khoản tiền được member đóng vào Shared Fund và được chỉ định dùng để hoàn lại economic position của `allocatedToMemberId`.

Ví dụ:

```ts
{
  amount: 2_838_250,
  contributedByMemberId: 'huong',
  allocatedToMemberId: 'qp'
}
```

Nghĩa là:

```text
Hường đóng vào Shared Fund:
+2.838.250

QP được ghi nhận đã được quỹ hoàn:
2.838.250
```

---

# 4. Shared Fund vẫn tồn tại

Không được loại bỏ Shared Fund khỏi Finance engine.

Shared Fund tiếp tục cần để xử lý:

```text
Income chưa phân bổ

Expense được trả trực tiếp từ Fund

Fund balance
```

Shared Fund:

```text
không phải Member

không phải Owner

không có holder

không có executor
```

---

# 5. Income có hai trạng thái allocation

## Allocated Income

```ts
allocatedToMemberId !== null;
```

Ví dụ:

```text
Minh nạp:
2.394.250

Allocated to:
QP
```

Contribution effect:

```text
Minh:
+2.394.250
```

Allocation effect:

```text
QP:
-2.394.250
```

Khoản tiền này không còn được tính là **unallocated Fund**.

---

## Unallocated Income

```ts
allocatedToMemberId === null;
```

Ví dụ:

```text
QP nạp quỹ chung:
2.000.000

Chưa xác định dùng hoàn cho ai.
```

Effect:

```text
Contributor:
+2.000.000
```

Shared Fund:

```text
+2.000.000 unallocated
```

Không member nào bị debit allocation.

---

# 6. New Member Balance Formula

Trước Settlement:

```ts
memberBaseBalance =
  personalExpensePaid +
  incomeContributed -
  expenseOwed -
  incomeAllocatedToMember;
```

Sau completed Member Settlement:

```ts
adjustedMemberBalance = memberBaseBalance + settlementPaid - settlementReceived;
```

Trong đó:

```ts
personalExpensePaid =
  sum(
    active Expense.amount
    where paymentSourceType === 'member'
    && paidByMemberId === member.id
  );
```

```ts
incomeContributed =
  sum(
    active Income.amount
    where contributedByMemberId === member.id
  );
```

```ts
incomeAllocatedToMember =
  sum(
    active Income.amount
    where allocatedToMemberId === member.id
  );
```

```ts
expenseOwed =
  sum(
    active Expense participants[].amount
    where participant.memberId === member.id
  );
```

---

# 7. Case hiện tại — Expected Calculation

Input:

```text
QP
Personal paid      16.409.000
Income contributed          0
Expense owed        9.554.500

Minh
Personal paid      14.909.000
Income contributed  2.394.250
Expense owed       13.554.500

Hường
Personal paid       5.500.000
Income contributed  2.838.250
Expense owed        9.554.500

LA
Personal paid       9.400.000
Income contributed  2.200.000
Expense owed       13.554.500
```

All current Income:

```text
Minh   2.394.250 → allocatedTo QP
Hường  2.838.250 → allocatedTo QP
LA     2.200.000 → allocatedTo QP
```

Total allocated to QP:

```text
7.432.500
```

Expected balances:

```text
QP:

16.409.000
- 9.554.500
- 7.432.500
----------------
-578.000
```

```text
Minh:

14.909.000
+2.394.250
-13.554.500
----------------
+3.748.750
```

```text
Hường:

5.500.000
+2.838.250
-9.554.500
----------------
-1.216.250
```

```text
LA:

9.400.000
+2.200.000
-13.554.500
----------------
-1.954.500
```

Invariant:

```text
Σ Member Balance = 0
```

Expected Settlement:

```text
QP → Minh       578.000
Hường → Minh  1.216.250
LA → Minh      1.954.500
```

Shared Fund không cần xuất hiện trong Settlement UI cho toàn bộ số Income đã được allocated.

---

# 8. New Fund Balance Formula

Fund phải phân biệt:

```text
allocated contribution
```

và:

```text
unallocated contribution
```

Recommended:

```ts
totalIncome =
  sum(active Income.amount);
```

```ts
totalAllocatedIncome =
  sum(
    active Income.amount
    where allocatedToMemberId !== null
  );
```

```ts
totalUnallocatedIncome = totalIncome - totalAllocatedIncome;
```

Với Fund-paid Expense:

```ts
unallocatedFundBalance = totalUnallocatedIncome - totalExpensePaidFromFund;
```

Nếu còn các completed legacy Fund Settlements trong migration period:

```ts
unallocatedFundBalance =
  totalUnallocatedIncome - totalExpensePaidFromFund - legacyFundSettlementPaid;
```

Target architecture sau migration hoàn tất:

```ts
unallocatedFundBalance = totalUnallocatedIncome - totalExpensePaidFromFund;
```

---

# 9. Important Invariant

Nếu tất cả Income đều được allocated:

```ts
totalUnallocatedIncome === 0;
```

và không còn Fund-paid transaction chưa reconcile:

```text
Settlement chỉ cần Member ↔ Member.
```

Expected:

```ts
sum(memberBalances) === 0;
```

Nếu còn unallocated Fund:

```ts
sum(memberBalances) === unallocatedFundBalance;
```

Đây là invariant mới tổng quát.

---

# 10. Settlement Algorithm

Settlement không dùng Fund đối với phần Income đã allocated.

Algorithm:

```text
1. Calculate Member Balance
   including:
   - personal paid
   - contribution
   - allocated income
   - owed
   - completed member settlements

2. Calculate unallocatedFundBalance

3. Nếu unallocatedFundBalance = 0:
   → chạy Member ↔ Member settlement trực tiếp.

4. Nếu unallocatedFundBalance > 0:
   → xử lý riêng unallocated Fund trước
     hoặc yêu cầu allocation trước khi final settlement.

5. Sau khi Fund được allocation hết:
   → final settlement chỉ Member ↔ Member.
```

---

# 11. Recommended Settlement UX

Mục tiêu:

> Final Settlement không nên hiển thị Shared Fund nếu toàn bộ Income đã được allocated.

Ví dụ:

```text
CẦN ĐỐI SOÁT

QP → Minh
578.000 ₫

Hường → Minh
1.216.250 ₫

LA → Minh
1.954.500 ₫
```

Không còn:

```text
Fund → QP
Fund → Minh
```

Không còn:

```text
executedByMemberId
```

Không cần hỏi:

```text
Ai thực hiện giao dịch từ quỹ?
```

---

# 12. Khi còn Unallocated Fund

Nếu:

```text
unallocatedFundBalance > 0
```

Settlement UI phải báo rõ:

```text
Quỹ chưa phân bổ
2.000.000 ₫
```

Không nên generate final member-to-member settlement ngay nếu số tiền này có thể thay đổi kết quả.

Recommended UI:

```text
Còn 2.000.000 ₫ trong quỹ chưa xác định hoàn cho ai.

[Phân bổ quỹ]
```

Sau khi user allocation hết:

```text
unallocatedFundBalance = 0
```

recalculate Member Balance và Settlement.

---

# 13. Income Create/Edit UI

Income form bổ sung:

```text
Người nạp
[Hường]

Số tiền
[2.838.250]

Hoàn cho
[QP ▼]
```

Recommended label:

```text
Hoàn cho
```

hoặc:

```text
Phân bổ cho
```

Không nên dùng:

```text
Người nhận
```

nếu muốn tránh hiểu đây là direct payment.

Recommended helper text:

```text
Khoản tiền này sẽ được tính là phần hoàn lại cho thành viên được chọn.
```

---

# 14. Default Allocation

Theo requirement hiện tại:

```ts
allocatedToMemberId = plan.ownerMemberId;
```

Default chỉ là UX convenience.

User có thể đổi:

```text
QP
Minh
Hường
LA
Chưa phân bổ
```

Recommended options:

```text
Hoàn cho

● QP
○ Minh
○ Hường
○ LA
○ Chưa phân bổ
```

---

# 15. Default Owner không phải Business Invariant

Không được implement:

```ts
allocatedToMemberId always = owner;
```

Chỉ:

```text
Create Income form default selection = owner
```

Persist value theo lựa chọn thực tế của user.

Owner có thể không phải creditor.

---

# 16. Allocation không cần match Expense cụ thể

Không thêm:

```ts
allocatedToExpenseId;
```

Không bắt user chọn:

```text
Income này trả cho vé máy bay nào?
```

V1 chỉ cần:

```text
Income → allocated member
```

Settlement tính aggregate.

Ví dụ:

```text
QP trả:
- Vé máy bay
- Taxi
- Hotel

Income allocatedTo QP
```

không cần xác định Income bù Expense nào.

---

# 17. Multiple creditors

Example:

```text
QP trả vé đi
8.000.000

Minh trả vé về
6.000.000
```

Income có thể:

```text
Hường:
2.000.000 → QP
```

```text
LA:
2.000.000 → Minh
```

Không có assumption:

```text
Fund belongs to QP
```

Mỗi Income tự chứa allocation semantic.

---

# 18. Một Income chỉ allocation cho một member trong V1

V1 không implement:

```ts
allocations: [
  { memberId: 'qp', amount: 2_000_000 },
  { memberId: 'minh', amount: 1_000_000 },
];
```

Một Income:

```text
→ 1 allocatedToMemberId
```

Nếu cần chia:

```text
Income A → QP
Income B → Minh
```

Lý do:

- schema đơn giản
- UI đơn giản
- edit/delete dễ
- Statistic dễ audit
- tránh rounding/allocation complexity

---

# 19. Edit Income Allocation

User có thể đổi:

```text
allocatedTo:
QP
```

thành:

```text
Minh
```

Statistic phải runtime recalculate:

```text
QP:
+old allocation amount
```

```text
Minh:
-new allocation amount
```

Không mutate Expense.

Không mutate Settlement history.

---

# 20. Edit Income Amount

Example:

```text
Income:
3.000.000 → QP
```

edit:

```text
2.500.000 → QP
```

Effect:

Contributor:

```text
incomeContributed -500.000
```

QP:

```text
incomeAllocatedToMember -500.000
```

Net system remains balanced.

---

# 21. Delete Income

Deleting active allocated Income removes both effects:

```text
Contributor contribution decreases.
```

and:

```text
Allocated member reimbursement decreases.
```

Then Statistic + Settlement recalculate.

---

# 22. Allocation có thể overpay member

Không block Income chỉ vì:

```text
allocated amount > current creditor balance
```

Ví dụ lúc tạo:

```text
QP creditor:
5.000.000

Allocated:
5.000.000
```

sau đó Expense bị edit khiến QP creditor chỉ còn:

```text
3.000.000
```

QP balance tự trở thành:

```text
-2.000.000
```

Settlement sẽ yêu cầu QP trả lại 2 triệu.

Không auto-edit Income.

Không auto-reallocate Income.

Đây là expected ledger behavior.

---

# 23. Contributor có thể allocate cho chính mình

Valid:

```text
QP nạp:
2.000.000

allocatedTo:
QP
```

Effects:

```text
+2.000.000 contribution
-2.000.000 allocation
```

Net member balance effect:

```text
0
```

Điều này có thể đại diện cho việc QP bỏ tiền vào quỹ và đồng thời xác định quỹ hoàn lại chính mình.

Không cần special-case calculation.

---

# 24. Removed Member

Income historical allocation vẫn được giữ nếu:

```text
allocatedToMemberId
```

tham chiếu member `removed`.

Statistic vẫn include member đó.

Không remap allocation sang Owner.

---

# 25. Hard Delete Member

Member không được hard delete nếu được tham chiếu bởi:

```text
Income.contributedByMemberId
```

hoặc:

```text
Income.allocatedToMemberId
```

Update member-reference validation hiện tại.

DMS hiện đã chặn hard-delete member khi member còn xuất hiện trong financial records; rule này cần mở rộng thêm reference mới.

---

# 26. Remove Executor Model

Deprecate:

```ts
Settlement.executedByMemberId;
```

Remove khỏi:

```text
Settlement types
Settlement form
Settlement Service
Statistic calculation
Settlement UI
Settlement history
Firestore Rules
Tests
```

Nếu field đã tồn tại trên Firestore documents:

```text
ignore safely when reading legacy records
```

Không bắt buộc migration delete field hàng loạt.

---

# 27. Existing Fund Settlements

Nếu môi trường test/dev đã tạo:

```text
Fund → QP
completed
```

trước khi migrate sang allocation model, phải tránh double-count.

Không được vừa:

```text
Income allocatedTo QP
```

vừa giữ:

```text
completed Fund Settlement → QP
```

cho cùng economic amount.

Migration cần xác định strategy rõ.

Recommended cho current development data:

```text
Reset/cancel legacy Fund settlements
```

sau đó recalculate từ Income allocation.

Nếu production data đã tồn tại, cần migration riêng.

---

# 28. Migration Existing Income

Existing Income chưa có:

```ts
allocatedToMemberId;
```

Requirement hiện tại:

```text
default = plan.ownerMemberId
```

Có hai cách implement.

## Read fallback

```ts
const allocatedToMemberId =
  income.allocatedToMemberId === undefined
    ? plan.ownerMemberId
    : income.allocatedToMemberId;
```

Ưu điểm:

- backward compatible
- không bulk migration ngay

Nhược:

- semantic của old data implicit

## Recommended migration

Khi architecture ổn định:

```text
Existing Income
missing allocatedToMemberId
→ write ownerMemberId
```

nhưng không cần block first implementation.

---

# 29. Important distinction: `undefined` vs `null`

Must preserve:

```ts
undefined
→ legacy record
→ fallback owner
```

```ts
null
→ user explicitly selected "Chưa phân bổ"
```

Không normalize cả hai thành cùng một value khi đọc.

Example resolver:

```ts
function resolveAllocatedToMemberId(
  income: IncomeDocument,
  plan: PlanDocument,
): string | null {
  if (income.allocatedToMemberId === undefined) {
    return plan.ownerMemberId;
  }

  return income.allocatedToMemberId;
}
```

---

# 30. Updated Income Type

Recommended transitional TypeScript type:

```ts
type IncomeDocument = {
  // existing...

  contributedByMemberId: string;

  /**
   * undefined:
   * legacy document → resolve to ownerMemberId
   *
   * null:
   * explicitly unallocated Shared Fund
   *
   * string:
   * allocated reimbursement target
   */
  allocatedToMemberId?: string | null;
};
```

For all newly created documents:

```text
field MUST be persisted explicitly
```

Không tạo Income mới thiếu field.

---

# 31. Statistic Member Card

Giữ UI breakdown đã update:

```text
Đã đóng góp
17.303.250 ₫

Tự thanh toán
14.909.000 ₫

Nạp quỹ
2.394.250 ₫

Phải chịu
13.554.500 ₫
```

Balance cuối phải dùng allocation mới.

Case current:

```text
QP
-578.000 ₫ Cần trả
```

không còn:

```text
+6.854.500 Sẽ nhận
```

sau khi 7.432.500 Income đã allocated cho QP.

---

# 32. Optional UI detail cho allocated reimbursement

Không bắt buộc hiển thị trên Member Card chính.

Nếu cần drill-down:

```text
QP

Tự thanh toán       16.409.000
Nạp quỹ                       0
Đã Đã được hoàn từ quỹ  7.432.500
Phải chịu             9.554.500
-----------------------------
Cần trả                 578.000
```

Nhưng primary card có thể giữ compact.

---

# 33. Settlement UI sau update

Nếu:

```text
unallocatedFundBalance === 0
```

không render section:

```text
Hoàn từ quỹ
```

chỉ render:

```text
Chuyển giữa thành viên
```

Example:

```text
QP → Minh
578.000 ₫

Hường → Minh
1.216.250 ₫

LA → Minh
1.954.500 ₫
```

CTA:

```text
Xác nhận đã chuyển
```

Tất cả đều là Member Settlement thật.

---

# 34. Settlement Record sau update

Target V1:

```ts
type SettlementDocument = {
  fromMemberId: string;
  toMemberId: string;

  amount: number;

  status: 'completed' | 'cancelled';

  // existing audit fields...
};
```

Có thể giữ `fromType` transitional nếu code hiện đã migrate, nhưng target settlement không cần Fund party khi `unallocatedFundBalance = 0`.

Không tạo Fund Settlement cho allocated Income.

---

# 35. Unallocated Fund Settlement — recommendation

V1 recommended behavior:

Nếu:

```ts
unallocatedFundBalance > 0;
```

không generate Fund Settlement automatically.

Thay vào đó yêu cầu:

```text
Phân bổ tiền quỹ trước khi đối soát.
```

UI:

```text
QUỸ CHƯA PHÂN BỔ

2.000.000 ₫

Khoản tiền này chưa được xác định dùng để hoàn cho thành viên nào.

[Phân bổ]
```

Sau khi allocation xong:

```text
recalculate
```

rồi Member Settlement.

Điều này giúp Settlement UI cuối luôn Member ↔ Member.

---

# 36. Allocation flow cho Unallocated Income

Có thể edit trực tiếp từng Income:

```text
Income
2.000.000

Hoàn cho
[Minh]
```

Không cần tạo entity mới.

Nếu nhiều unallocated Income:

```text
Income A → QP
Income B → Minh
```

Sau mỗi update:

```text
Statistic realtime recalculate
Settlement suggestion recalculate
```

---

# 37. Validation

Create/update Income:

```text
allocatedToMemberId
```

nếu không null phải:

```text
exist trong same plan
```

Có thể là:

```text
active
```

khi tạo mới.

Historical removed member vẫn valid với existing Income.

Không cho chọn member removed trong create form.

---

# 38. Permission

Allocation field sử dụng cùng permission với create/edit Income.

Không tạo capability mới chỉ cho allocation.

Nếu user có quyền edit Income đó:

```text
có quyền đổi allocatedToMemberId
```

Theo kiến trúc permission hiện tại, Income write phải tiếp tục đi qua service + Firestore rules, không chỉ UI.

---

# 39. Firestore Rules

Update validation cho Income:

```text
allocatedToMemberId
```

phải là:

```text
null
```

hoặc member ID hợp lệ trong plan.

New Income phải có field explicit.

Legacy documents có thể thiếu field và vẫn read được.

---

# 40. Service Responsibilities

## IncomeService

Update:

```text
createIncome
updateIncome
deleteIncome
```

để handle allocation.

Không chứa settlement logic.

---

## StatisticService

Add:

```ts
calculateIncomeContributedByMember();
calculateIncomeAllocatedToMember();
calculateUnallocatedFundBalance();
```

Update:

```ts
calculateMemberBalance();
```

---

## SettlementService

Remove:

```text
executor resolution
Fund → Member suggestions for allocated Income
```

Input primary:

```text
member adjusted balances
```

Nếu:

```text
unallocatedFundBalance > 0
```

return settlement state:

```text
requiresFundAllocation
```

thay vì final suggestions.

---

# 41. Recommended Statistic Result

```ts
type FinancialStatistic = {
  members: MemberFinancialStatistic[];

  fund: {
    totalIncome: number;

    allocatedIncome: number;

    unallocatedIncome: number;

    expensePaidFromFund: number;

    unallocatedBalance: number;
  };

  settlement: {
    requiresFundAllocation: boolean;

    suggestions: MemberSettlementSuggestion[];
  };
};
```

Member:

```ts
type MemberFinancialStatistic = {
  memberId: string;

  personalExpensePaid: number;

  incomeContributed: number;

  incomeAllocatedToMember: number;

  expenseOwed: number;

  settlementPaid: number;

  settlementReceived: number;

  balance: number;
};
```

---

# 42. Edge Case — Income allocated to multiple expense payers over time

Valid.

Example:

```text
Income 1
Hường → Fund
allocatedTo QP
2.000.000

Income 2
Hường → Fund
allocatedTo Minh
1.000.000
```

Same contributor can have multiple Income records allocated differently.

No special logic required.

---

# 43. Edge Case — allocated member later becomes debtor

Valid.

Do not block.

Final balance can become negative.

Settlement fixes it.

---

# 44. Edge Case — allocated member has zero direct paid

Technically valid.

Example:

```text
Income allocatedTo Minh
```

dù Minh chưa direct-pay Expense.

Could represent manual business decision.

Do not enforce:

```text
allocated member must be creditor
```

UI may warn if useful, but Service should not hard-block unless business rule changes.

---

# 45. Edge Case — contributor == allocated member

Valid.

Net Income effect on same member = 0.

Still changes Fund categorization from unallocated to allocated.

---

# 46. Edge Case — all Income unallocated

Example:

```text
Fund = 8.000.000
```

No allocation.

Member balances sum:

```text
8.000.000
```

Settlement:

```text
requiresFundAllocation = true
```

Do not output misleading Member → Member final settlement.

---

# 47. Edge Case — partial allocation

```text
totalIncome = 10.000.000

allocated = 7.000.000

unallocated = 3.000.000
```

Member balances sum:

```text
3.000.000
```

Expected:

```text
unallocatedFundBalance = 3.000.000
```

Settlement finalization blocked until allocation/reconciliation of remaining Fund.

---

# 48. Edge Case — Fund-paid Expense

If:

```text
unallocated income = 5.000.000

Fund-paid Expense = 2.000.000
```

then:

```text
unallocatedFundBalance =
3.000.000
```

The Fund-paid Expense consumes only unallocated Fund.

Allocated Income is already economically assigned to members and must not be reused to pay Fund Expense.

This is a critical invariant.

---

# 49. Validation for Fund-paid Expense

Before create:

```ts
unallocatedFundBalance >= expense.amount;
```

Not:

```ts
totalIncome >= expense.amount;
```

Because allocated Income is not available for general Fund spending.

Example:

```text
Total Income        10.000.000
Allocated Income     9.000.000
Unallocated Fund     1.000.000
```

Fund-paid Expense:

```text
2.000.000
```

must be rejected.

---

# 50. Reallocation and Fund-paid Expense Edge Case

Suppose:

```text
Unallocated Fund:
3.000.000

Fund-paid Expense:
2.000.000

Available:
1.000.000
```

User attempts to change an Income:

```text
unallocated 2.000.000
→ allocatedTo QP
```

Projected unallocated Fund:

```text
1.000.000 - 2.000.000
= -1.000.000
```

Must reject because existing Fund-paid Expense would no longer be covered.

Therefore Income allocation edit must validate:

```ts
projectedUnallocatedFundBalance >= 0;
```

This is important.

---

# 51. Migration from Executor Implementation

Implementation order:

```text
1. Add allocatedToMemberId to Income.

2. Add backward-compatible resolver:
   undefined → ownerMemberId.

3. Update Income Create/Edit UI.

4. Update Statistic balance formula.

5. Add allocated/unallocated Fund calculation.

6. Update Fund-paid Expense validation
   to use unallocatedFundBalance.

7. Update current member cards.

8. Remove executor selection UI.

9. Remove executedByMemberId logic from SettlementService.

10. Stop creating new Fund → Member settlements
    for allocated Income.

11. Cancel/reset existing development Fund settlements
    to avoid double count.

12. Recalculate Settlement using Member balances only.

13. Add unallocated-Fund blocking state.

14. Update Firestore Rules.

15. Update unit/integration tests.
```

---

# 52. Required Tests

```text
ALLOC-01
New Income defaults allocatedToMemberId to ownerMemberId.

ALLOC-02
User can change allocation to another active member.

ALLOC-03
User can explicitly choose null/unallocated.

ALLOC-04
Allocated Income credits contributor.

ALLOC-05
Allocated Income debits allocated member.

ALLOC-06
Allocated Income produces net-zero effect across members.

ALLOC-07
Unallocated Income credits contributor only.

ALLOC-08
Sum member balances equals unallocatedFundBalance.

ALLOC-09
All allocated Income → sum member balances = 0.

ALLOC-10
Editing allocated member recalculates both members correctly.

ALLOC-11
Editing Income amount recalculates contribution and allocation.

ALLOC-12
Deleting allocated Income reverses both sides.

ALLOC-13
Contributor may equal allocated member.

ALLOC-14
Removed historical allocated member remains calculable.

FUND-ALLOC-01
Fund-paid Expense consumes only unallocated Fund.

FUND-ALLOC-02
Allocated Income cannot be reused for Fund-paid Expense.

FUND-ALLOC-03
Cannot allocate Income if projected unallocated Fund becomes negative.

FUND-ALLOC-04
Cannot reduce/delete unallocated Income if existing Fund Expense would make Fund negative.

SETTLEMENT-ALLOC-01
When unallocatedFundBalance = 0, Settlement contains only Member → Member.

SETTLEMENT-ALLOC-02
Current real case produces:
QP → Minh 578.000
Hường → Minh 1.216.250
LA → Minh 1.954.500.

SETTLEMENT-ALLOC-03
No Fund → Member suggestion is generated for allocated Income.

SETTLEMENT-ALLOC-04
When unallocatedFundBalance > 0, final settlement returns requiresFundAllocation.

SETTLEMENT-ALLOC-05
No executedByMemberId required.

COMPAT-ALLOC-01
Legacy Income missing allocatedToMemberId resolves to ownerMemberId.

COMPAT-ALLOC-02
Explicit null does NOT fallback to owner.

COMPAT-ALLOC-03
Legacy executedByMemberId does not affect new calculations.
```

---

# 53. Current Real Case — Regression Test

Expected Income:

```text
Minh
2.394.250
allocatedTo = QP

Hường
2.838.250
allocatedTo = QP

LA
2.200.000
allocatedTo = QP
```

Expected Statistic:

```text
QP
Tự thanh toán      16.409.000
Nạp quỹ                     0
Đã được hoàn từ quỹ    7.432.500
Phải chịu            9.554.500
Cần trả                578.000
```

```text
Minh
Tự thanh toán      14.909.000
Nạp quỹ             2.394.250
Phải chịu           13.554.500
Còn được nhận        3.748.750
```

```text
Hường
Tự thanh toán       5.500.000
Nạp quỹ             2.838.250
Phải chịu            9.554.500
Cần trả              1.216.250
```

```text
LA
Tự thanh toán       9.400.000
Nạp quỹ             2.200.000
Phải chịu           13.554.500
Cần trả              1.954.500
```

Expected Settlement:

```text
QP → Minh
578.000

Hường → Minh
1.216.250

LA → Minh
1.954.500
```

No Shared Fund row.

No executor dropdown.

---

# 54. MUST NOT DO

```text
Do not set Fund = Owner.

Do not treat allocatedToMemberId as Fund holder.

Do not treat allocatedToMemberId as direct payment recipient.

Do not map Income to Expense.

Do not auto-reallocate Income when Expense changes.

Do not keep executor calculation alongside allocation calculation.

Do not double-count completed legacy Fund Settlement.

Do not use total Fund balance when validating Fund Expense;
use unallocated Fund balance.

Do not collapse undefined and null for allocatedToMemberId.

Do not create final Member Settlement while unallocated Fund remains unresolved.
```

---

# 55. Final Mental Model

Each Income now answers two independent questions:

```text
Ai đã đưa tiền vào Plan?
→ contributedByMemberId
```

and:

```text
Khoản tiền này được dùng để hoàn cho ai?
→ allocatedToMemberId
```

Example:

```text
Hường
↓
nạp 2.838.250
↓
Shared Fund
↓
phân bổ hoàn cho QP
```

Shared Fund remains independent.

The final balance becomes:

```text
Member đã bỏ bao nhiêu
+
Member đã nạp bao nhiêu
-
Member phải chịu bao nhiêu
-
Member đã được allocation từ quỹ bao nhiêu
```

Then Settlement is simply:

```text
Member → Member
```

whenever:

```text
unallocatedFundBalance = 0
```

This is the target architecture for the next implementation.
