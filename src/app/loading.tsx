export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-40 animate-pulse rounded-[32px] bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-44 animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-44 animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-44 animate-pulse rounded-[28px] bg-slate-200" />
      </div>
    </main>
  );
}

