import { collection, doc, query } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { QueryConstraint } from 'firebase/firestore';

export type PlanOwnedCollectionPath =
  | 'members'
  | 'invitations'
  | 'milestones'
  | 'todos'
  | 'expenses'
  | 'incomes'
  | 'settlements'
  | 'weddingGuests'
  | 'weddingGuestGroups'
  | 'guestInvitations'
  | 'travelActivities'
  | 'debtTransactions';

export function getPlanCollectionPath(planId: string, collectionPath: PlanOwnedCollectionPath): string {
  return `plans/${planId}/${collectionPath}`;
}

export function getPlanRootPath(planId: string): string {
  return `plans/${planId}`;
}

export function getPlanRootRef(db: Firestore, planId: string) {
  return doc(db, 'plans', planId);
}

export function getPlanCollectionRef(db: Firestore, planId: string, collectionPath: PlanOwnedCollectionPath) {
  return collection(db, 'plans', planId, collectionPath);
}

export function getPlanDocumentRef(
  db: Firestore,
  planId: string,
  collectionPath: PlanOwnedCollectionPath,
  documentId: string,
) {
  return doc(db, 'plans', planId, collectionPath, documentId);
}

export function queryByPlanCollection(
  db: Firestore,
  planId: string,
  collectionPath: PlanOwnedCollectionPath,
  ...constraints: QueryConstraint[]
) {
  return query(getPlanCollectionRef(db, planId, collectionPath), ...constraints);
}
