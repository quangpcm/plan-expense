'use client';

import { FirestoreMemberRepository } from '@/modules/member/repositories/firestore-member.repository';
import { MemberService } from '@/modules/member/services/member.service';

const memberRepository = new FirestoreMemberRepository();

export const memberService = new MemberService(memberRepository);

