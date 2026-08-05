import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export function FirebaseSetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <SectionHeading
          eyebrow="Firebase Setup Needed"
          title="Authentication is scaffolded but not configured yet."
          description="Add your Firebase Web App configuration to .env.local and enable the providers you want to use."
        />
        <div className="rounded-[24px] bg-slate-100 p-4 text-sm leading-7 text-slate-700">
          Required values:
          <br />
          NEXT_PUBLIC_FIREBASE_API_KEY
          <br />
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
          <br />
          NEXT_PUBLIC_FIREBASE_PROJECT_ID
          <br />
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
          <br />
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
          <br />
          NEXT_PUBLIC_FIREBASE_APP_ID
        </div>
      </Card>
    </main>
  );
}

