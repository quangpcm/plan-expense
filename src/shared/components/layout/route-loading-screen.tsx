type RouteLoadingScreenProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function RouteLoadingScreen({
  eyebrow = 'Plan Expense',
  title = 'Đang chuyển trang',
  description = 'Chúng mình đang chuẩn bị màn tiếp theo để bạn tiếp tục thao tác mượt mà hơn.',
}: RouteLoadingScreenProps) {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fbff_45%,#f2f6fc_100%)] px-6 py-10 shadow-[0_18px_44px_rgba(20,36,64,0.08)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-4rem] left-[-2rem] size-40 rounded-full bg-[rgba(82,175,244,0.22)] blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 right-[-3rem] size-48 rounded-full bg-[rgba(191,112,236,0.18)] blur-3xl animate-float-delayed" />
        <div className="absolute bottom-[-3rem] left-1/4 size-44 rounded-full bg-[rgba(53,207,170,0.16)] blur-3xl animate-float-slower" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex size-18 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5dc4ff_0%,#4c7dff_52%,#bf70ec_100%)] shadow-[0_16px_34px_rgba(76,125,255,0.28)]">
            <div className="absolute inset-1 rounded-full border border-white/30" />
            <div className="size-7 rounded-full border-2 border-white/85 border-t-transparent animate-spin" />
          </div>
        </div>

        <span className="mb-3 inline-flex rounded-full border border-[rgba(140,156,183,0.24)] bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-subtle)] shadow-sm backdrop-blur">
          {eyebrow}
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">{title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">{description}</p>

        <div className="mt-8 flex items-center gap-3">
          <span className="size-2.5 rounded-full bg-[#52aff4] animate-pulse" />
          <span className="size-2.5 rounded-full bg-[#bf70ec] animate-pulse [animation-delay:180ms]" />
          <span className="size-2.5 rounded-full bg-[#35cfaa] animate-pulse [animation-delay:360ms]" />
        </div>

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(36,59,107,0.08)]">
          <div className="h-full w-2/5 rounded-full bg-[linear-gradient(90deg,#52aff4_0%,#4c7dff_45%,#bf70ec_100%)] animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
