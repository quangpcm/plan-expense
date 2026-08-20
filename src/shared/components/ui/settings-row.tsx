import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';

type SettingsRowProps = {
  label: string;
  value?: ReactNode;
  description?: string;
  badge?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function SettingsRow({ label, value, description, badge, href, onClick, className }: SettingsRowProps) {
  const isInteractive = Boolean(href || onClick);

  const content = (
    <>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-950">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {value !== undefined ? <span className="text-sm text-slate-500">{value}</span> : null}
        {badge && badge > 0 ? (
          <Badge className="min-w-6 justify-center px-2 py-0.5" variant="neutral">
            {badge}
          </Badge>
        ) : null}
        {isInteractive ? <ChevronRight className="size-4 text-slate-400" /> : null}
      </div>
    </>
  );

  const rowClassName = cn('flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left', className);

  if (href) {
    return (
      <Link className={rowClassName} href={href}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button className={rowClassName} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
