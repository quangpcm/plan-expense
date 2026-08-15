import type { PlanMemberDocument } from '@/modules/member/types/member';

function toMillis(timestamp: PlanMemberDocument['createdAt']) {
  return timestamp?.toMillis?.() ?? 0;
}

function byCreatedAtAsc(a: PlanMemberDocument, b: PlanMemberDocument) {
  return toMillis(a.createdAt) - toMillis(b.createdAt);
}

export function sortMembersForDisplay(members: PlanMemberDocument[]): PlanMemberDocument[] {
  const owner = members.filter((member) => member.role === 'owner');
  const registeredMembers = members
    .filter((member) => member.role !== 'owner' && member.memberType === 'registered')
    .sort(byCreatedAtAsc);
  const guests = members
    .filter((member) => member.role !== 'owner' && member.memberType === 'guest')
    .sort(byCreatedAtAsc);

  return [...owner, ...registeredMembers, ...guests];
}
