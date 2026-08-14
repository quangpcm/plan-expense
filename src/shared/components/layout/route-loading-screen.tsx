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
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-white px-6 py-10 shadow-[0_18px_44px_rgba(20,36,64,0.05)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-3rem] left-[-1rem] size-32 rounded-full bg-[rgba(79,156,249,0.10)] blur-3xl animate-float-slow" />
        <div className="absolute right-[-2rem] bottom-[-2rem] size-36 rounded-full bg-[rgba(124,92,245,0.08)] blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex size-18 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4F9CF9_0%,#7C5CF5_100%)] shadow-[0_14px_30px_rgba(79,156,249,0.22)]">
            <div className="absolute inset-1 rounded-full border border-white/25" />
            <div className="size-7 rounded-full border-2 border-white/85 border-t-transparent animate-spin" />
          </div>
        </div>

        {eyebrow ? (
          <span className="mb-3 inline-flex rounded-full border border-[rgba(140,156,183,0.24)] bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-subtle)] shadow-sm backdrop-blur">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111827]">{title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}
