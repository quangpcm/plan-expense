type RouteLoadingScreenProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function RouteLoadingScreen({
  eyebrow,
  title = 'Đang tải nội dung...',
  description = 'Chỉ mất một chút thời gian.',
}: RouteLoadingScreenProps) {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[32px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-6 py-10 shadow-[var(--shadow-overlay)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-3rem] left-[-1rem] size-32 rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary)_14%,transparent)] blur-3xl animate-float-slow" />
        <div className="absolute right-[-2rem] bottom-[-2rem] size-36 rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex size-18 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-primary)_0%,var(--color-brand-primary-hover)_100%)] shadow-[0_14px_30px_color-mix(in_srgb,var(--color-brand-primary)_24%,transparent)]">
            <div className="absolute inset-1 rounded-full border border-white/25" />
            <div className="size-7 rounded-full border-2 border-white/85 border-t-transparent animate-spin" />
          </div>
        </div>

        {eyebrow ? (
          <span className="mb-3 inline-flex rounded-full border border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-default)_86%,transparent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] shadow-sm backdrop-blur">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">{title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
