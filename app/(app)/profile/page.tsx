import { ProtectedLayout } from '@/components/app/ProtectedLayout';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export default function ProfilePage() {
  return (
    <ProtectedLayout>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-emerald-950">
          Mon profil
        </h1>
        <ProfileSettings />
      </main>
    </ProtectedLayout>
  );
}
