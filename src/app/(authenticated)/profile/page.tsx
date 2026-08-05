'use client';

import { useState } from 'react';

import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function ProfilePage() {
  const { user } = useAuthSession();
  const { logout } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await logout();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar className="size-14 text-base" initials={(user?.displayName || 'PE').slice(0, 2).toUpperCase()} />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-950">{user?.displayName || 'User'}</h1>
            <p className="text-sm text-slate-600">{user?.email || 'No email found'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeading
          eyebrow="Profile"
          title="Account basics are connected."
          description="This page confirms the authenticated shell and user sync are working end to end."
        />
        <Button className="w-full sm:w-auto" disabled={isSubmitting} onClick={handleLogout}>
          {isSubmitting ? 'Logging out...' : 'Logout'}
        </Button>
      </Card>
    </main>
  );
}

