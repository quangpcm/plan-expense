# Task — Add optional phone number to Todo Vendor

We need to extend the existing **Todo Vendor** feature in Go Plan with an optional phone number.

This is a focused product enhancement. Do not redesign or broadly refactor Todo, Planning, Vendor, Design System, permissions, or Firestore architecture.

---

# 1. Product decision — LOCKED

Phone number belongs to:

```ts
TodoVendor
```

It does **NOT** belong directly to:

```ts
TodoDocument
```

Reason:

* `Todo` represents work/action that needs to be completed.
* `TodoVendor` represents a service provider/vendor associated with that work.
* A vendor is a contactable entity, so phone number has clear domain meaning there.
* Adding `phoneNumber` directly to Todo would make the semantic ambiguous: whose number is it?

Do NOT add:

```ts
TodoDocument.phoneNumber
```

Do NOT create a generic `contact` object in this task.

Do NOT introduce a separate Vendor collection/entity.

Keep the current embedded `TodoVendor[]` model.

---

# 2. Required data model change

Current conceptual model:

```ts
type TodoVendor = {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  price: number;
  attachments: MediaAttachment[];
};
```

Change it to:

```ts
type TodoVendor = {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  phoneNumber: string | null;
  price: number;
  attachments: MediaAttachment[];
};
```

`phoneNumber` is OPTIONAL.

Canonical persisted representation:

```ts
phoneNumber: string | null
```

Prefer `null` for “not provided” when creating/updating normalized vendor data, unless the current repository has a clearly established compatibility convention that should be preserved.

---

# 3. Backward compatibility — REQUIRED

Existing Todo documents in Firestore were created before `TodoVendor.phoneNumber` existed.

Therefore old vendor objects may look like:

```ts
{
  id,
  name,
  description,
  link,
  price,
  attachments
}
```

with no `phoneNumber` property.

The implementation MUST continue to read and render these documents safely.

Treat:

```ts
undefined
```

from legacy data as equivalent to:

```ts
null
```

Do NOT require a Firestore migration just to introduce this field.

Do NOT break parsing/deserialization of existing Todos.

Audit all schemas/parsers/mappers/default-value builders before deciding what changes are required.

---

# 4. First step — repository audit

Before changing code, inspect the actual repository and identify all places involved in Todo Vendor lifecycle.

Search for at least:

```text
TodoVendor
vendors
selectedTodoVendorId
vendor.name
vendor.description
vendor.link
vendor.price
attachments
Todo form
Todo detail
Todo edit
vendor add/edit form
todo service
todo repository
Zod schemas / validators
Firestore converters/mappers
Firestore security rules
tests / fixtures / mocks
```

Also inspect the relevant Design System V2 components currently used by these screens.

Do not assume filenames.

Before implementation, output a concise impact manifest:

```text
TODO VENDOR PHONE NUMBER

Data model changed: YES — TodoVendor only
TodoDocument top-level schema changed: NO
Firestore collection structure changed: NO
Repository architecture changed: NO
Permissions changed: NO
Financial calculation changed: NO
Planning semantics changed: NO

Expected affected files:
- ...

Potential compatibility risks:
- ...
```

Then proceed with implementation.

Do not stop for confirmation unless you discover a genuine architectural conflict that cannot be safely resolved.

---

# 5. Input / business rules

Phone number is optional.

Expected behavior:

```text
empty input
→ null

non-empty input
→ trimmed string
```

Do not aggressively transform the user-entered phone number before persistence.

For example, preserve reasonable display formatting such as:

```text
0905 123 456
+84 905 123 456
0905-123-456
```

Do NOT convert the persisted value into a numeric type.

Do NOT parse it as an integer.

Do NOT assume Vietnamese numbers always begin with `0`.

Do NOT introduce country-code selection or international phone libraries in this task.

Do NOT add a new dependency only for phone formatting/validation.

---

# 6. Validation

Use the application's existing validation architecture.

Audit existing Todo/TodoVendor validation first.

Phone number should be validated conservatively.

The goal is to reject obviously invalid input without rejecting legitimate international or formatted phone numbers.

Prefer existing shared phone validation if the project already has one.

If there is no established phone validator:

* optional / nullable;
* trim whitespace;
* enforce a reasonable max length to protect bad input;
* allow common phone characters such as:

  * digits
  * spaces
  * `+`
  * `-`
  * `(`
  * `)`
  * optionally `.`
* do not implement country-specific telecom validation.

Do not create an overly strict Vietnamese-only regex.

Error copy should follow existing form conventions and Vietnamese product copy.

---

# 7. `tel:` action

Create or reuse a small utility that turns the persisted/display value into a safe `tel:` href.

Conceptually:

```ts
toTelHref("0905 123 456")
// "tel:0905123456"
```

and:

```ts
toTelHref("+84 905 123 456")
// "tel:+84905123456"
```

The utility should remove presentation separators that are not useful in the URI while preserving a leading `+`.

Do not modify the displayed value.

Desired separation:

```text
Stored value
→ user-friendly original string

Displayed value
→ stored string

Call href
→ normalized tel URI
```

Do not put this normalization logic into a generic Design System Button/Input component.

Place it in the appropriate product/shared utility layer based on existing repository conventions.

Add unit tests for representative cases.

---

# 8. Vendor create/edit UI

Locate the existing UI used to add/edit a Todo Vendor.

Add an optional field:

```text
Số điện thoại
```

Recommended placeholder:

```text
VD: 0905 123 456
```

Do not mark it required.

Place it with other vendor contact information.

Preferred information grouping:

```text
Tên nhà cung cấp
Mô tả
Số điện thoại
Liên kết
Giá dự kiến / Giá
Attachments
```

However, preserve the current form architecture and hierarchy if the actual UI has a better established ordering.

Do not redesign the whole vendor form merely to add this field.

Use the existing Design System V2 Input/Form primitives and semantic tokens.

Do not introduce raw one-off input styling.

---

# 9. Vendor display UI

Audit every place where `TodoVendor` information is shown.

Where enough space exists, phone number should appear as vendor contact information.

Conceptual display:

```text
Studio ABC
0905 123 456     [Gọi]
facebook.com/abc
12.000.000 ₫
```

Do NOT force this exact layout if it conflicts with current component anatomy.

Priorities:

1. Vendor name
2. Selected/current vendor state if applicable
3. Phone/contact information
4. Existing description/link/price according to current hierarchy

If `phoneNumber == null` or empty:

```text
render nothing
```

Do not show:

```text
Chưa có số điện thoại
-
N/A
```

unless the current product pattern explicitly uses missing-value placeholders.

---

# 10. Phone interaction

When a phone number exists, provide an obvious call action.

Mobile / supported device:

```html
<a href="tel:...">
  Gọi
</a>
```

Use existing Button / text action / icon action patterns from Design System V2.

Do not build a new shared component just for this feature unless repository evidence proves one already belongs in the shared layer.

The phone number itself may also be clickable if that matches the current interaction pattern.

Accessibility:

* action must have a clear accessible name;
* do not rely on phone icon alone without an accessible label;
* keyboard interaction must work;
* preserve adequate touch target.

Example accessible intent:

```text
Gọi 0905 123 456
```

---

# 11. Copy phone number

Where the current UI has room for secondary actions or an overflow menu, support:

```text
Sao chép số điện thoại
```

Use the existing clipboard/toast infrastructure if one exists.

Success feedback:

```text
Đã sao chép số điện thoại
```

Do NOT create a new global toast system.

If the current Vendor UI has no appropriate secondary-action affordance, prioritize the `Gọi` action and do not distort the layout merely to expose Copy permanently.

Desktop UX should still make Copy reasonably available if the existing action architecture supports it.

---

# 12. Responsive behavior

Verify at least:

```text
Mobile
Tablet
Desktop
```

Do not assume every breakpoint needs a different composition.

Phone number must not:

* overflow vendor cards/rows;
* force price or vendor status off-screen;
* create multiple equal-primary actions;
* make compact Todo lists excessively tall.

For dense/summary Todo views, it is acceptable to keep phone number inside the detailed Vendor surface rather than displaying it everywhere.

Do not mechanically add phone number to every Todo row.

Use product hierarchy.

---

# 13. Todo selected vendor

Audit UI related to:

```ts
selectedTodoVendorId
```

If the selected vendor is surfaced prominently in Todo detail/summary and contact information is useful there, expose its phone number appropriately.

However:

* do not duplicate the phone number excessively;
* do not change selected vendor business semantics;
* do not change effective Todo budget calculation.

Existing invariant remains:

```text
selected vendor price
→ effective budget

otherwise
→ todo budget
```

Phone number has zero effect on budget or financial calculations.

---

# 14. Service layer

Follow the existing architecture:

```text
UI
→ Hook
→ Service
→ Repository
→ Firestore
```

Business normalization/validation belongs in the correct existing Service/validation layer.

Repository remains persistence CRUD/mapping only.

Do not move business logic into React components.

Audit all create/update paths.

Ensure phone number survives:

```text
create Todo with vendor
add vendor
edit vendor
edit Todo
duplicate/copy Todo if supported
other vendor mutation flows
```

Do not assume there is only one save path.

---

# 15. Firestore

The field remains embedded inside:

```text
TodoDocument.vendors[]
```

No new collection.

No new document.

No index should be required.

Do not create a migration unless repository evidence proves current deserialization makes one unavoidable.

Review Firestore Security Rules because nested object field validation may use an explicit allowed-key schema.

If rules currently validate exact TodoVendor keys, update them so:

* legacy vendor objects without `phoneNumber` remain valid where appropriate;
* new `phoneNumber`, when present, must be a string or accepted nullable representation according to existing Firestore rule conventions;
* malformed types are rejected;
* permissions remain unchanged.

Do NOT loosen unrelated Todo write rules.

Do NOT change role/permission behavior.

---

# 16. Type/schema propagation

Audit and update all relevant representations rather than only the main TypeScript type.

Examples may include:

```text
TodoVendor type
Todo form type
Todo create/update input
Zod schema
Firestore converter
service DTO
form default values
fixtures
mock vendors
test factories
serialization helpers
clone helpers
vendor editor local state
```

Use repository evidence; do not create layers that do not currently exist.

---

# 17. Design System guardrails

The project already has Design System V2.

This feature must consume existing canonical primitives/patterns.

Do NOT:

* introduce a new raw color;
* introduce a new arbitrary radius/shadow;
* create another Button implementation;
* create another Input implementation;
* create a new Card variant solely for phone number;
* put Todo/Vendor semantics inside generic Design System components;
* add `phoneNumber` behavior to DataRow/Input/Button globally.

Product/domain layer owns:

```text
phone value
tel href
copy behavior
visibility
vendor semantics
```

Generic components only render the resolved content/actions.

Preserve the rule:

> Extract stable anatomy, not business concepts.

---

# 18. Explicit non-scope

Do NOT implement any of the following:

```text
TodoDocument.phoneNumber
generic Todo contact
Contact entity
Address book
Vendor master database
Vendor collection
country selector
phone OTP
WhatsApp/Zalo integration
SMS integration
automatic country detection
automatic +84 conversion
phone uniqueness
vendor deduplication
search vendor by phone
new permissions
new roles
new PlanType branching
financial logic changes
Todo architecture refactor
Vendor architecture refactor
```

If you notice these opportunities, mention them only in the final report as optional future work if materially relevant.

Do not implement them.

---

# 19. Tests

Add/update tests according to the repository's existing test framework.

At minimum verify:

### Domain / schema

```text
vendor with phone number → accepted
vendor without phoneNumber legacy field → accepted
phoneNumber null → accepted
invalid non-string phoneNumber → rejected where validation applies
empty form phone → normalized correctly
```

### tel helper

Representative cases:

```text
0905 123 456
→ tel:0905123456

0905-123-456
→ tel:0905123456

+84 905 123 456
→ tel:+84905123456
```

Also test unexpected-but-valid formatting according to the actual implementation contract.

### UI

Where practical:

```text
phone field renders in vendor form
existing phone populates during edit
saving phone calls existing mutation correctly
vendor without phone does not render phone action
vendor with phone renders call action
call action has correct href
```

### Regression

Existing tests for:

```text
Todo create/edit
Todo vendor
selectedTodoVendorId
Todo budget
attachments
permissions
```

must continue to pass.

---

# 20. Documentation

Update the canonical DMS/domain documentation if that documentation lives in the repository.

`TodoVendor` should become:

```ts
type TodoVendor = {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  phoneNumber: string | null;
  price: number;
  attachments: MediaAttachment[];
};
```

Document briefly:

```text
phoneNumber:
- optional vendor contact number
- stored as display-friendly string
- may be absent in legacy records
- used for call/copy actions
```

Do not change Todo semantics.

---

# 21. Browser verification

After implementation, verify the real application rather than relying only on unit tests.

Check at least:

```text
1. Create/edit Todo
2. Add vendor without phone
3. Add vendor with phone
4. Edit existing vendor and add phone
5. Remove phone and save
6. Reload persisted Todo
7. Selected vendor display
8. Call action href
9. Copy action if implemented
10. Legacy Todo/vendor without phone
```

Verify relevant mobile and desktop layouts.

Check console for errors/warnings.

---

# 22. Completion report

At the end return:

```text
TODO VENDOR PHONE NUMBER — IMPLEMENTATION REPORT

Status:
PASS / PARTIAL / BLOCKED

Files changed:
- ...

Data model:
- ...

UI:
- ...

Business/service logic:
- ...

Firestore / rules:
- ...

Backward compatibility:
- ...

Tests:
- command
- result

Browser verification:
- Mobile:
- Desktop:

Regression:
- ...

Deferred / intentionally not implemented:
- Todo.phoneNumber
- generic contact model
- ...
```

Also include the exact final `TodoVendor` type.

---

# 23. Acceptance criteria

This task is complete only if all applicable points pass:

* `TodoVendor` supports optional `phoneNumber`.
* `TodoDocument` itself does NOT gain a phone number field.
* Existing Todo/vendor documents without the field still work.
* Vendor create/edit UI supports entering/removing phone.
* Persisted phone survives reload.
* Phone is displayed only when present.
* User can initiate a call through a correct `tel:` URI.
* Copy action is supported where it fits existing interaction architecture.
* No financial calculation changes.
* No permission changes.
* No new Vendor entity/collection.
* No unnecessary dependency.
* Design System V2 conventions are preserved.
* Relevant tests pass.
* Real UI is browser-verified.
* Canonical domain documentation is updated.

````

## Key implementation principle

Implement this as:

```text
Todo
└── Vendor
    ├── identity / description
    ├── contact
    │   ├── phoneNumber
    │   └── link
    ├── price
    └── attachments
````

not:

```text
Todo
├── phoneNumber   ← DO NOT ADD
└── Vendor
```

Phone number is vendor contact metadata, not Todo metadata.
