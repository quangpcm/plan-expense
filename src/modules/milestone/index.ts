export { milestoneService } from './services';
export { useMilestones } from './hooks/use-milestones';
export { MilestoneDetailCard } from './components/milestone-detail-card';
export { MilestoneForm } from './components/milestone-form';
export { MilestoneList } from './components/milestone-list';
export type {
  CreateMilestoneInput,
  MilestoneDocument,
  MilestoneStatus,
  ReorderMilestoneInput,
  UpdateMilestoneInput,
} from './types/milestone';
export { createMilestoneSchema, type CreateMilestoneSchema } from './schemas/create-milestone.schema';
export { updateMilestoneSchema, type UpdateMilestoneSchema } from './schemas/update-milestone.schema';
