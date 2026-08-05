import { ArrowRight, ClipboardList, Layers3, Smartphone } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

const foundationItems = [
  {
    icon: Layers3,
    title: 'Architecture-first setup',
    description:
      'Modules, shared foundation, and config are scaffolded to match the implementation plan.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first UI base',
    description:
      'The initial visual system is optimized for the fast, one-hand flows defined in the specs.',
  },
  {
    icon: ClipboardList,
    title: 'Phase-driven delivery',
    description:
      'The repo is prepared to move from Foundation into Authentication without rework.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_65%)]" />
        <div className="relative flex flex-col gap-6">
          <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Phase 0 Complete In Progress
          </span>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Plan Expense foundation is ready for implementation.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              This repository now carries the base architecture, tooling, and UI foundation for a
              mobile-first expense sharing app built on Next.js and Firebase.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>Start Phase 1</Button>
            <Button variant="secondary">
              Review Implementation Plan
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {foundationItems.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Icon className="size-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <SectionHeading
            eyebrow="Execution Source"
            title="Phase 0 outputs"
            description="These are the foundation pieces prepared before feature development starts."
          />
          <ul className="grid gap-3 text-sm leading-6 text-slate-700">
            <li>Next.js App Router scaffold with strict TypeScript and Tailwind setup</li>
            <li>Config layer for app settings, Firebase, and environment validation</li>
            <li>Shared utilities, error model, validation helpers, and UI primitives</li>
            <li>Module placeholders for auth, plan, member, expense, income, and settlement</li>
          </ul>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Next Step"
            title="Phase 1"
            description="Authentication, app shell, and Firebase bootstrap are the next implementation targets."
          />
          <div className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
            Build flows:
            <br />
            Register
            <br />
            Login
            <br />
            Forgot password
            <br />
            Authenticated shell
          </div>
        </Card>
      </section>
    </main>
  );
}

