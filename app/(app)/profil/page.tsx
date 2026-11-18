import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { t } from "@/lib/strings";

export default function ProfilePage() {
  return (
    <>
      <PageHeader title={t.profile.title} />
      <EmptyState
        icon={UserRound}
        title={t.profile.emptyTitle}
        body={t.profile.emptyBody}
        action={
          <Button disabled title={t.common.comingSoon}>
            {t.profile.cta}
          </Button>
        }
      />
    </>
  );
}
