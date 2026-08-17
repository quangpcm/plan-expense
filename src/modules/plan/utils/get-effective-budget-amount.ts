export function getEffectiveBudgetAmount(planBudgetAmount: number | null, estimatedAmount: number | null | undefined) {
  return Math.max(planBudgetAmount ?? 0, estimatedAmount ?? 0);
}

export function isEffectiveBudgetEstimated(planBudgetAmount: number | null, estimatedAmount: number | null | undefined) {
  return (estimatedAmount ?? 0) > (planBudgetAmount ?? 0);
}
