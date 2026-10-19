// Lightweight route-transition affordance — replaces the previous full-screen
// RouteLoadingScreen takeover (see docs/design-system/VisualRules.md "Skeleton
// over full-screen spinners"). Fixed so it never shifts layout or blocks the
// page content underneath, which is usually already painted from local cache
// by the time this would otherwise show.
export function RouteLoadingBar() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-index-toast)] h-[3px] overflow-hidden bg-[color-mix(in_srgb,var(--color-brand-primary)_16%,transparent)]"
    >
      <div className="h-full w-1/3 animate-loading-bar rounded-full bg-[var(--color-brand-primary)] motion-reduce:animate-none" />
      <span className="sr-only" role="status">
        Đang tải nội dung...
      </span>
    </div>
  );
}
