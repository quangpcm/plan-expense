# Wedding Guest Management — Chốt mô hình nghiệp vụ V2

## 1. Mục tiêu

`Wedding Guest Management` là tính năng dành riêng cho:

```text
PlanType = wedding
```

Tính năng phục vụ việc:

- Quản lý danh sách khách mời.
- Phân loại khách theo phía, quan hệ và khách của ai.
- Quản lý khách theo từng nhóm/tiệc.
- Theo dõi RSVP.
- Theo dõi số người dự kiến tham dự.
- Ghi nhận tiền và vàng mừng theo từng tiệc.
- Tìm kiếm và lọc khách.
- Hạn chế tạo trùng Guest.
- Tổng hợp số lượng khách, số người tham dự và quà mừng.

Wedding Guest hoàn toàn độc lập với `PlanMember`.

---

# 2. Mô hình nghiệp vụ tổng thể

Hệ thống được tổ chức thành 3 entity chính:

```text
WeddingGuest
Thông tin người / đầu mối khách mời
        │
        │  1
        │
        │  N
        ▼
GuestInvitation
Thông tin tham dự của Guest tại từng Group
        │
        │  N
        │
        │  1
        ▼
WeddingGuestGroup
Nhóm / tiệc
```

Nguyên tắc:

> **WeddingGuest xác định “người này là ai”.**

> **GuestInvitation xác định “người này tham gia tiệc này như thế nào”.**

> **WeddingGuestGroup xác định “đây là tiệc/nhóm nào”.**

Một Guest chỉ được tạo một lần trong Wedding Plan nhưng có thể có nhiều `GuestInvitation`.

---

# 3. Wedding Guest Group

`WeddingGuestGroup` đại diện cho một dịp, lễ hoặc tiệc mà khách có thể được mời tham dự.

Ví dụ:

```text
Đám hỏi
Tiệc nhà gái
Tiệc nhà trai
Tiệc báo hỷ
Tiệc bạn bè
```

Không sử dụng danh sách Group cố định.

User được phép:

- Tạo Group.
- Sửa Group.
- Xóa Group.

Một Wedding Plan có thể có nhiều Group.

Một Guest có thể được mời vào nhiều Group.

Ví dụ:

```text
Nguyễn Văn Minh
│
├── Đám hỏi
├── Tiệc nhà gái
└── Tiệc nhà trai
```

RSVP, số người tham dự và quà mừng được quản lý độc lập ở từng Group thông qua `GuestInvitation`.

---

# 4. Wedding Guest

`WeddingGuest` đại diện cho một người hoặc một đầu mối khách mời.

Ví dụ:

```text
Nguyễn Văn Minh
Nhà gái · Bạn bè · Khách của cô dâu
```

Guest chứa các thông tin chính:

```text
Tên
Phía
Quan hệ
Khách của
```

Các thông tin này thuộc về Guest, **không thuộc từng Group**.

User được phép chỉnh sửa nếu nhập sai.

Ví dụ:

```text
Phía:
Nhà trai
```

có thể sửa thành:

```text
Phía:
Nhà gái
```

Việc chỉnh sửa Guest áp dụng cho Guest đó trên toàn bộ Wedding Plan và không tạo Guest mới.

---

# 5. Scope của Wedding Guest

Wedding Guest chỉ tồn tại trong **Wedding Plan hiện tại**.

Không tồn tại Guest dùng chung giữa nhiều Wedding Plan.

Ví dụ:

```text
Wedding Plan A
└── Nguyễn Văn Minh

Wedding Plan B
└── Nguyễn Văn Minh
```

Hai Guest trên là hai entity hoàn toàn độc lập.

Hệ thống không:

- Search Guest từ Wedding Plan khác.
- Suggest Guest từ Wedding Plan khác.
- Chia sẻ Guest giữa các Wedding Plan.
- Kiểm tra duplicate với Wedding Plan khác do user sở hữu.
- Kiểm tra Wedding Plan khác user tham gia.
- Kiểm tra Wedding Plan khác user được invite vào.

Scope duy nhất:

```text
Current Wedding Plan
└── Wedding Guests
```

---

# 6. Phía

`side` xác định Guest thuộc phía nào.

MVP sử dụng:

```text
Nhà gái
Nhà trai
Chung
```

Ví dụ:

```text
Nguyễn Văn Minh
Phía: Nhà gái
```

`side` là thuộc tính chung của Guest và không thay đổi theo Group.

User được phép chỉnh sửa nếu nhập sai.

Được define bằng constant trong source code kèm id mỗi side. Trên firebase chỉ lưu theo id.

---

# 7. Quan hệ

`relationship` xác định mối quan hệ của Guest.

Preset MVP:

```text
Họ hàng
Bạn bè
Đồng nghiệp
Hàng xóm
Đối tác / Khách hàng
Khác
```

Ví dụ:

```text
Nguyễn Văn Minh
Phía: Nhà gái
Quan hệ: Bạn bè
```

`relationship` là thuộc tính chung của Guest và không thay đổi theo Group.

Thông tin này được phép chỉnh sửa.

Được define bằng constant trong source code kèm id mỗi relationship. Trên firebase chỉ lưu theo id.

---

# 8. Khách của

`invitedBy` xác định Guest thuộc danh sách khách của ai.

Vì feature chỉ dành cho `wedding`, MVP sử dụng cố định 5 preset:

```text
Cô dâu
Chú rể
Bố mẹ cô dâu
Bố mẹ chú rể
Chung
```

MVP chưa hỗ trợ custom `invitedBy`.

Ví dụ:

```text
Nguyễn Văn Minh

Phía: Nhà gái
Quan hệ: Bạn bè
Khách của: Cô dâu
```

hoặc:

```text
Cô Hương

Phía: Nhà gái
Quan hệ: Bạn bè
Khách của: Bố mẹ cô dâu
```

`invitedBy` là thuộc tính chung của Guest và không thay đổi theo Group.

User được phép chỉnh sửa nếu nhập sai.

Được define bằng constant trong source code kèm id mỗi side. Trên firebase chỉ lưu theo id.

---

# 9. Guest Invitation

`GuestInvitation` đại diện cho việc một Guest được mời vào một Group cụ thể.

Ví dụ:

```text
Guest
Nguyễn Văn Minh

Group
Đám hỏi
```

Một Guest có thể có nhiều GuestInvitation.

Ví dụ:

```text
Nguyễn Văn Minh
│
├── Đám hỏi
│   ├── RSVP: Tham dự
│   ├── Số người: 1
│   └── Tiền mừng: 1.000.000 đ
│
└── Tiệc nhà trai
    ├── RSVP: Tham dự
    ├── Số người: 3
    ├── Tiền mừng: 2.000.000 đ
    └── Vàng: 5 phân
```

Các thông tin sau thuộc `GuestInvitation`:

```text
Group
RSVP
Số người tham dự
Tiền mừng
Vàng mừng
Ghi chú
```

---

# 10. Unique Guest Invitation

Một Guest chỉ được có tối đa **một GuestInvitation trong cùng một Group**.

Business rule:

```text
guestId + groupId = unique
```

Ví dụ:

```text
Nguyễn Văn Minh
+ Tiệc nhà trai
```

chỉ có một GuestInvitation.

Nếu Guest đã thuộc Group hiện tại, hệ thống không cho tạo GuestInvitation thứ hai.

UI hiển thị:

```text
Nguyễn Văn Minh
Nhà trai · Bạn bè · Khách của chú rể

Đã có trong Tiệc nhà trai

[Xem / Chỉnh sửa]
```

---

# 11. RSVP

RSVP thuộc `GuestInvitation`, không thuộc `WeddingGuest`.

Có 3 trạng thái:

```text
Chưa xác nhận
Tham dự
Không tham dự
```

Default:

```text
Chưa xác nhận
```

Ví dụ:

```text
Nguyễn Văn Minh

Đám hỏi
Không tham dự

Tiệc nhà trai
Tham dự
```

Một Guest có thể có RSVP khác nhau ở từng Group.

---

# 12. Số người tham dự

Số người tham dự thuộc `GuestInvitation`.

Default:

```text
1
```

Một Guest là một đầu mối nhưng có thể đại diện cho nhiều người tham dự.

Ví dụ:

```text
Nguyễn Văn Minh

Đám hỏi
1 người

Tiệc nhà trai
3 người
```

Điều này cho phép cùng một Guest:

- Đi một mình ở Đám hỏi.
- Đi cùng gia đình ở Tiệc cưới.

MVP chỉ quản lý:

```text
Tên đầu mối + Số người
```

Không tạo sub-guests.

Ví dụ chỉ cần:

```text
Nguyễn Văn Minh
Số người: 4
```

Không cần:

```text
Nguyễn Văn Minh
├── Vợ
├── Con 1
└── Con 2
```

---

# 13. Phân biệt Guest và số người tham dự

Hệ thống phải phân biệt:

**Số Guest**

và:

**Số người tham dự**

Ví dụ:

```text
Khách mời
180

Người dự kiến
265
```

Trong đó:

```text
180
= số đầu mối Guest
```

```text
265
= tổng số người dự kiến tham dự
```

Thông tin này sẽ là cơ sở cho tính năng quản lý bàn sau MVP.

---

# 14. Tiền mừng

Tiền mừng thuộc từng `GuestInvitation`.

Đơn vị chính:

```text
VND
```

Ví dụ:

```text
Tiền mừng
1.000.000 đ
```

Cùng một Guest có thể có tiền mừng khác nhau ở từng Group.

Ví dụ:

```text
Đám hỏi
500.000 đ

Tiệc nhà trai
2.000.000 đ
```

---

# 15. Vàng mừng

Vàng được quản lý độc lập với tiền mặt.

Đơn vị lưu trữ nhỏ nhất:

```text
phân
```

Quy ước:

```text
10 phân = 1 chỉ
10 chỉ = 1 lượng
```

Ví dụ dữ liệu:

```text
5 phân
15 phân
20 phân
```

UI có thể format:

```text
5 phân
1 chỉ 5 phân
2 chỉ
```

Một GuestInvitation có thể có:

```text
Chỉ tiền
Chỉ vàng
Cả tiền và vàng
Không có quà mừng
```

Ví dụ:

```text
Tiền mừng
1.000.000 đ

Vàng
5 phân
```

---

# 16. Ghi chú giá vàng

Cho phép lưu ghi chú về giá vàng tại thời điểm nhận.

Ví dụ:

```text
Ghi chú
Giá vàng thời điểm nhận khoảng 15.200.000đ/chỉ
```

Thông tin này chỉ có mục đích tham khảo.

Không sử dụng để:

- Quy đổi vàng sang VND.
- Cộng vàng vào tổng tiền.
- Tính báo cáo tài chính.
- Tạo Income.
- Tính giá trị tài sản.

Báo cáo luôn tách riêng:

```text
Tổng tiền mừng
186.500.000 đ

Tổng vàng
7 chỉ 5 phân
```

---

# 17. Wedding Guest độc lập với Plan Member

`WeddingGuest` và `PlanMember` là hai domain hoàn toàn khác nhau.

### Plan Member

Người tham gia quản lý Wedding Plan:

```text
Owner
Editor
Viewer
```

### Wedding Guest

Người được mời tham dự lễ/tiệc.

Không có quan hệ bắt buộc giữa:

```text
WeddingGuest
```

và:

```text
User / PlanMember
```

MVP không cần liên kết hai identity này.

---

# 18. Tiền/vàng mừng độc lập với Expense/Income

Wedding Guest Management không tự động tạo Financial Record.

Flow:

```text
Wedding Guest
↓
Guest Invitation
↓
Ghi nhận tiền / vàng
↓
Wedding Guest Report
↓
Tổng kết tiền mừng
↓
Owner chủ động tạo Income nếu cần
```

Ví dụ:

```text
Tiệc nhà gái

Tiền
85.500.000 đ

Vàng
3 chỉ
```

```text
Tiệc nhà trai

Tiền
121.000.000 đ

Vàng
6 chỉ 5 phân
```

Tổng:

```text
Tiền mừng
206.500.000 đ

Vàng
9 chỉ 5 phân
```

Owner có thể tự tạo:

```text
Income
Tiền mừng cưới
206.500.000 đ
```

Hệ thống không tự động đồng bộ để:

- Tránh duplicate.
- Giữ Wedding Guest và Financial module độc lập.
- Cho Owner chủ động quyết định khoản nào được ghi nhận vào Income.

---

# 19. Search Guest

Cho phép tìm kiếm Guest theo tên trong **Wedding Plan hiện tại**.

Không search sang Wedding Plan khác.

Search nên hỗ trợ không dấu và không phân biệt hoa thường.

Ví dụ Guest:

```text
Nguyễn Hữu Tâm
```

có thể tìm bằng:

```text
Tâm
tam
huu tam
Hữu Tâm
nguyen huu tam
```

---

# 20. Normalized Guest Name

Để phục vụ search và duplicate detection, hệ thống duy trì tên đã normalize.

Ví dụ:

```text
name:
Nguyễn Văn Minh

normalizedName:
nguyen van minh
```

Normalization tối thiểu:

- Lowercase.
- Trim khoảng trắng đầu/cuối.
- Gom nhiều khoảng trắng liên tiếp.
- Loại bỏ dấu tiếng Việt.

`name` gốc vẫn được giữ để hiển thị UI.

---

# 21. Duplicate Guest Prevention

Mục tiêu là hạn chế tối đa trường hợp:

> Cùng một người nhưng được tạo thành nhiều WeddingGuest.

Duplicate detection chỉ thực hiện trong:

```text
Current Wedding Plan
```

Không liên quan đến bất kỳ Wedding Plan nào khác.

Khi tạo hoặc chỉnh sửa WeddingGuest, hệ thống tìm các Guest có khả năng trùng dựa trên:

```text
normalizedName
side
relationship
invitedBy
```

Trong đó:

> `normalizedName` là tín hiệu tìm kiếm chính.

Các thông tin:

```text
side
relationship
invitedBy
```

giúp user xác định đây có thực sự là cùng một người hay không.

---

# 22. Suggest Guest khi tạo mới

Ngay khi user nhập tên Guest, hệ thống tìm Guest có tên tương tự trong Wedding Plan hiện tại.

Ví dụ:

```text
Tên khách

[ Nguyễn Văn Mi... ]
```

Suggest:

```text
KHÁCH ĐÃ CÓ

Nguyễn Văn Minh
Nhà gái · Bạn bè · Khách của cô dâu

Nguyễn Văn Minh
Nhà trai · Đồng nghiệp · Khách của chú rể
```

User có thể:

```text
Chọn Guest đã có
```

hoặc:

```text
Vẫn tạo Guest mới
```

Hệ thống không được tự động merge chỉ vì trùng tên.

---

# 23. Mức độ duplicate

Có thể phân biệt hai trường hợp.

### Có khả năng trùng cao

Tên và các thuộc tính gần như giống nhau:

```text
Nguyễn Văn Minh
Nhà gái · Bạn bè · Khách của cô dâu
```

UI có thể cảnh báo:

```text
Khách này có thể đã tồn tại
```

### Chỉ trùng tên

Ví dụ:

```text
Nguyễn Văn Minh
Nhà trai · Đồng nghiệp · Khách của chú rể
```

UI hiển thị nhẹ hơn:

```text
Có khách cùng tên
```

Trùng tên không đồng nghĩa với duplicate.

Quyết định cuối cùng thuộc về user.

---

# 24. Chọn Guest đã tồn tại

Khi user đang thêm khách vào một Group và chọn Guest từ suggest list:

```text
Không tạo WeddingGuest mới
```

Thay vào đó:

```text
Tạo GuestInvitation mới
```

cho Guest đó trong Group hiện tại.

Ví dụ:

```text
Current Group:
Tiệc nhà trai
```

User tìm:

```text
Nguyễn Văn Minh
```

Guest đã tồn tại và hiện có:

```text
Đám hỏi
Tham dự · 1 người

Tiệc nhà gái
Chưa xác nhận
```

UI có thể preview:

```text
Nguyễn Văn Minh
Nhà gái · Bạn bè · Khách của cô dâu

Đã có trong 2 nhóm

• Đám hỏi — Tham dự
• Tiệc nhà gái — Chưa xác nhận

[Thêm vào Tiệc nhà trai]
```

User chọn:

```text
Thêm vào Tiệc nhà trai
```

→ tạo GuestInvitation cho Group hiện tại.

Không cần điều hướng sang Guest Detail.

---

# 25. Guest đã thuộc Group hiện tại

Nếu Guest đã có GuestInvitation trong Group hiện tại:

```text
Nguyễn Văn Minh

Đã có trong Tiệc nhà trai
```

Không hiển thị action:

```text
Thêm
```

mà hiển thị:

```text
Xem / Chỉnh sửa
```

Hệ thống không cho phép duplicate:

```text
guestId + groupId
```

---

# 26. Duplicate Detection khi Edit

Duplicate detection không chỉ áp dụng khi Create.

Khi chỉnh sửa:

```text
name
side
relationship
invitedBy
```

hệ thống cũng kiểm tra các Guest khác trong Wedding Plan hiện tại.

Ví dụ Guest A được sửa thành:

```text
Nguyễn Văn Minh
Nhà gái
Bạn bè
Cô dâu
```

nhưng Guest B đã có thông tin tương tự.

UI cảnh báo:

```text
Thông tin này có thể trùng với một khách đã có.
```

Cho phép:

```text
Xem khách đã có
```

hoặc:

```text
Vẫn lưu
```

MVP không tự động merge Guest.

---

# 27. Filter Guest

Guest List hỗ trợ filter theo:

### Group

```text
Đám hỏi
Tiệc nhà gái
Tiệc nhà trai
...
```

### Phía

```text
Nhà gái
Nhà trai
Chung
```

### Khách của

```text
Cô dâu
Chú rể
Bố mẹ cô dâu
Bố mẹ chú rể
Chung
```

### Quan hệ

```text
Họ hàng
Bạn bè
Đồng nghiệp
Hàng xóm
Đối tác / Khách công việc
Khác
```

### RSVP

```text
Chưa xác nhận
Tham dự
Không tham dự
```

RSVP là thông tin theo Group.

Do đó khi filter theo Group, UI có thể hiển thị chính xác RSVP, số người và quà mừng của Guest tại Group đó.

---

# 28. Guest List UI

Guest List ưu tiên hiển thị thông tin ngắn gọn để dễ scan.

Ví dụ:

```text
Nguyễn Văn Minh                     Tham dự
Nhà gái · Bạn bè · Cô dâu

3 người                          2.000.000 đ
```

Hoặc:

```text
Cô Hương                    Chưa xác nhận
Nhà gái · Bạn bè · Bố mẹ cô dâu

1 người                         5 phân vàng
```

Không cần hiển thị toàn bộ thông tin Guest trên list.

Chi tiết được xem/chỉnh sửa trong Guest Detail.

---

# 29. Thống kê khách mời

Hệ thống có thể tổng hợp theo toàn bộ Wedding Plan hoặc từng Group.

Ví dụ:

```text
KHÁCH MỜI

180 khách
265 người dự kiến
```

RSVP:

```text
Tham dự             145
Chưa xác nhận         25
Không tham dự         10
```

Có thể breakdown theo:

```text
Group
Phía
Khách của
Quan hệ
RSVP
```

---

# 30. Thống kê quà mừng

Tiền và vàng luôn được thống kê riêng.

Ví dụ theo Group:

```text
TIỆC NHÀ GÁI

Tiền mừng
85.500.000 đ

Vàng
3 chỉ
```

```text
TIỆC NHÀ TRAI

Tiền mừng
121.000.000 đ

Vàng
6 chỉ 5 phân
```

Tổng Wedding Plan:

```text
TỔNG QUÀ MỪNG

Tiền
206.500.000 đ

Vàng
9 chỉ 5 phân
```

Không quy đổi vàng sang VND.

---

# 31. Quản lý bàn — Post-MVP

Quản lý bàn chưa nằm trong MVP.

Data `attendeeCount` hiện tại phải đủ để sau này tính nhu cầu bàn theo từng Group.

Ví dụ:

```text
Tiệc nhà gái

Người dự kiến
327

Số người / bàn
10

Số bàn cần
33

Bàn dự phòng
2

Tổng đề xuất
35 bàn
```

Tính năng quản lý bàn sẽ được thiết kế riêng sau MVP.

---

# 32. CSV Import — Post-MVP

CSV Import chưa nằm trong MVP nhưng data model hiện tại phải hỗ trợ việc bổ sung tính năng này sau này.

Format dự kiến có thể gồm:

```text
Group
Phía
Khách của
Quan hệ
RSVP
Tên
```

Ví dụ:

| Group         | Phía    | Khách của | Quan hệ | RSVP          | Tên             |
| ------------- | ------- | --------- | ------- | ------------- | --------------- |
| Đám hỏi       | Nhà gái | Cô dâu    | Bạn bè  | Tham dự       | Nguyễn Văn Minh |
| Tiệc nhà gái  | Nhà gái | Cô dâu    | Bạn bè  | Tham dự       | Nguyễn Văn Minh |
| Tiệc nhà trai | Nhà gái | Cô dâu    | Bạn bè  | Chưa xác nhận | Nguyễn Văn Minh |

Ba dòng trên phải có khả năng được hiểu thành:

```text
WeddingGuest

Nguyễn Văn Minh
Nhà gái · Bạn bè · Cô dâu

└── GuestInvitations
    ├── Đám hỏi
    │   └── Tham dự
    │
    ├── Tiệc nhà gái
    │   └── Tham dự
    │
    └── Tiệc nhà trai
        └── Chưa xác nhận
```

Không mặc định coi mỗi CSV row là một WeddingGuest mới.

---

# 33. Duplicate Handling khi CSV Import — Post-MVP

CSV Import sau này phải sử dụng cùng nguyên tắc duplicate detection của Guest Management.

Không auto-merge chỉ dựa trên tên.

Import flow nên có bước kiểm tra trước khi commit:

```text
Kiểm tra dữ liệu

135 khách mới
42 khách khớp với khách đã có
8 khách có khả năng trùng
3 dòng không hợp lệ
```

Các trường hợp không chắc chắn cần user xác nhận trước khi import.

Đây là Post-MVP requirement, chưa cần implement ở giai đoạn hiện tại.

---

# 34. Phạm vi MVP

Wedding Guest Management MVP gồm:

```text
✓ Wedding Guest CRUD

✓ Wedding Guest Group CRUD

✓ Guest Invitation CRUD

✓ Phía

✓ Quan hệ

✓ Khách của

✓ RSVP

✓ Số người tham dự

✓ Tiền mừng

✓ Vàng mừng

✓ Ghi chú

✓ Search Guest

✓ Filter Guest

✓ Duplicate Guest Suggestion

✓ Duplicate Warning khi Create/Edit

✓ Preview Guest đã tồn tại

✓ Thống kê khách mời

✓ Thống kê tiền/vàng mừng
```

Chưa thuộc MVP:

```text
✕ Quản lý bàn

✕ Sơ đồ bàn

✕ Sub-guests

✕ Số điện thoại

✕ Custom "Khách của"

✕ Quy đổi vàng → VND

✕ Tự động tạo Income

✕ Guest dùng chung giữa nhiều Wedding Plan

✕ CSV Import

✕ Auto Merge Guest
```

---

# 35. Các business rule chính

**Rule 1 — Guest Scope**

> WeddingGuest chỉ tồn tại trong Wedding Plan hiện tại.

**Rule 2 — Guest Identity**

> `name`, `side`, `relationship`, `invitedBy` mô tả Guest và không thay đổi theo Group.

**Rule 3 — Invitation**

> RSVP, số người, tiền/vàng mừng và ghi chú thuộc từng GuestInvitation.

**Rule 4 — Multiple Groups**

> Một Guest có thể tham gia nhiều Group.

**Rule 5 — Unique Invitation**

> Một Guest chỉ có tối đa một GuestInvitation trong cùng một Group.

```text
guestId + groupId = unique
```

**Rule 6 — Duplicate Guest**

> Trùng tên không đồng nghĩa cùng một Guest.

Hệ thống chỉ suggest/warning, không auto-merge.

**Rule 7 — Duplicate Scope**

> Duplicate detection chỉ thực hiện trong Wedding Plan hiện tại.

**Rule 8 — Guest vs Member**

> WeddingGuest hoàn toàn độc lập với User/PlanMember.

**Rule 9 — Gift**

> Tiền và vàng mừng được quản lý độc lập.

**Rule 10 — Gold**

> Vàng lưu theo đơn vị nhỏ nhất là `phân` và không tự động quy đổi sang VND.

**Rule 11 — Finance**

> Quà mừng không tự động tạo Expense/Income.

**Rule 12 — Headcount**

> Guest count và attendee count là hai số liệu khác nhau.

---

# 36. Mô hình nghiệp vụ V2 đã chốt

```text
Wedding Plan
│
├── WeddingGuest
│   ├── name
│   ├── normalizedName
│   ├── side
│   ├── relationship
│   └── invitedBy
│
├── WeddingGuestGroup
│   └── name
│
└── GuestInvitation
    ├── guest
    ├── group
    ├── RSVP
    ├── attendeeCount
    ├── moneyGift
    ├── goldGift
    └── note
```

Quan hệ:

```text
WeddingGuest
     │
     │ 1
     │
     │ N
GuestInvitation
     │
     │ N
     │
     │ 1
WeddingGuestGroup
```

Đây là mô hình nghiệp vụ V2 được chốt làm nền tảng cho bước tiếp theo:

**Feature Requirement → User Flow → UI/UX Specification → Data Model Specification → Implementation.**
