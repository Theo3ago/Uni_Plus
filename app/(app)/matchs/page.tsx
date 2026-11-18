import { Heart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { t } from "@/lib/strings";

export default function MatchesPage() {
  return (
    <>
      <PageHeader title={t.matches.title} />
      <EmptyState
        icon={Heart}
        title={t.matches.emptyTitle}
        body={t.matches.emptyBody}
        action={<ButtonLink href="/decouvrir">{t.matches.cta}</ButtonLink>}
      />
    </>
  );
}
