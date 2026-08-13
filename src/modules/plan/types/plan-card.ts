export type PlanCardMetricTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export type PlanCardMetric = {
  label: string;
  value: string;
  tone?: PlanCardMetricTone;
  detail?: string;
};

export type PlanCardProgress = {
  value: number;
  max: number;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
};

export type PlanCardFooterItem = {
  label: string;
  value: string;
};

export type PlanCardStatusTone = 'active' | 'inactive';

export type PlanCardViewModel = {
  title: string;
  coverImageUrl: string | null;
  roleLabel: string;
  statusLabel: string;
  statusTone: PlanCardStatusTone;
  primaryMetric: PlanCardMetric;
  secondaryMetric: PlanCardMetric;
  progress: PlanCardProgress | null;
  footerLeft: PlanCardFooterItem;
  footerRight: PlanCardFooterItem;
};
