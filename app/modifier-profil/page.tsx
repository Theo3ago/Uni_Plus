"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileWizard } from "@/components/profile/ProfileWizard";
import { useMyProfile } from "@/lib/data/profiles";

export default function EditProfilePage() {
  return (
    <main className="flex flex-1 flex-col">
      <AuthGate>
        <Edit />
      </AuthGate>
    </main>
  );
}

function Edit() {
  const [me] = useMyProfile();
  return me ? <ProfileWizard mode="edit" initial={me} /> : null;
}
