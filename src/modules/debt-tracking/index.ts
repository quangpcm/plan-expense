export { debtTrackingService } from './services';
export { useDebtTracking } from './hooks/use-debt-tracking';
export { DebtForm } from './components/debt-form';
export { DebtList } from './components/debt-list';
export { DebtDetail } from './components/debt-detail';
export { DebtTrackingTab } from './components/debt-tracking-tab';
export { RepaymentForm } from './components/repayment-form';
export type {
  CreateDebtInput,
  DebtDocument,
  DebtStatus,
  DebtTrackingSummary,
  RecordRepaymentInput,
  RepaymentDocument,
} from './types/debt-tracking';
