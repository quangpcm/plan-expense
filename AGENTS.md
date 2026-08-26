<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Coding conventions

- **Design System governance**: before implementing or modifying product UI, read
  `docs/design-system/README.md` — it is the single canonical source of truth (component usage,
  overlay rules, visual rules, product/domain boundaries, feature workflow, stop conditions,
  exceptions). This file does not duplicate that content; follow the linked docs instead of
  guessing:
  1. Read `docs/design-system/README.md`.
  2. Follow `docs/design-system/FeatureImplementationRules.md`.
  3. Reuse canonical components (`docs/design-system/ComponentUsage.md`) before creating UI
     primitives.
  4. Preserve business/permission/data semantics (`docs/design-system/ProductSemantics.md`).
  5. Follow `docs/design-system/OverlayRules.md` for all modal/dialog/sheet behavior.
  6. Do not add shared component APIs/tokens without consumer evidence — see the evidence gate
     in `FeatureImplementationRules.md`.
  Stop and ask before: changing a business invariant, permission semantics, or financial
  calculations; adding a shared Design System public API/token without evidence; or resolving an
  ambiguous domain rule without product guidance (full list in `FeatureImplementationRules.md`).

- **Dialog/BottomSheet thay Page**: form tạo/sửa Plan, Milestone, Todo, Vendor, Transaction
  (expense/income/debt) luôn hiển thị qua `ResponsiveModal` (Dialog desktop / BottomSheet
  mobile), không route qua page riêng. Chi tiết + component dùng: xem
  `docs/ui-modal-conventions.md` (product rule) và `docs/design-system/OverlayRules.md`
  (canonical architecture detail). Nếu không rõ 1 case có thuộc phạm vi rule này hay không, hỏi
  lại trước khi implement.
