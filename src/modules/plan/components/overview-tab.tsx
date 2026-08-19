'use client';

import { OverviewRenderer } from '@/modules/plan/components/overview-renderer';
import type { OverviewRendererProps } from '@/modules/plan/components/overview-renderer';

type OverviewTabProps = OverviewRendererProps;

export function OverviewTab(props: OverviewTabProps) {
  return <OverviewRenderer {...props} />;
}
