<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Coding conventions

- **Dialog/BottomSheet thay Page**: form tạo/sửa Plan, Milestone, Todo, Vendor, Transaction
  (expense/income/debt) luôn hiển thị qua `ResponsiveModal` (Dialog desktop / BottomSheet
  mobile), không route qua page riêng. Chi tiết + component dùng: xem
  `docs/ui-modal-conventions.md`. Nếu không rõ 1 case có thuộc phạm vi rule này hay không, hỏi
  lại trước khi implement.
