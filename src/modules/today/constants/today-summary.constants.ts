export const MAX_ATTENTION_ITEMS = 5;
export const MAX_TODAY_ITEMS = 10;
export const MAX_UPCOMING_ITEMS = 5;

// Phase 4 — fetch bound per plan for completed-today Todos, deliberately more generous than
// MAX_TODAY_ITEMS: this feeds a COUNT (completedTodayCount), not just a capped display list, so
// under-fetching would silently under-report progress, not just hide overflow items the way the
// other MAX_* display caps do. The *display* cap (top 3 for Recently Completed) is separate — see
// today-progress.ts.
export const MAX_COMPLETED_TODAY_QUERY_LIMIT = 25;

export const TODAY_SUMMARY_TTL_MS = 10 * 60 * 1000;

// "Sắp tới" forward window — simple bounded lookahead, not a scoring engine.
export const UPCOMING_WINDOW_DAYS = 7;
