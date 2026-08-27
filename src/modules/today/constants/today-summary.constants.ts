export const MAX_ATTENTION_ITEMS = 5;
export const MAX_TODAY_ITEMS = 10;
export const MAX_UPCOMING_ITEMS = 5;

export const TODAY_SUMMARY_TTL_MS = 10 * 60 * 1000;

// "Sắp tới" forward window — simple bounded lookahead, not a scoring engine.
export const UPCOMING_WINDOW_DAYS = 7;
