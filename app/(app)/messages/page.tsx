import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { t } from "@/lib/strings";

export default function MessagesPage() {
  return (
    <>
      <PageHeader title={t.messages.title} />
      <EmptyState icon={MessageCircle} title={t.messages.emptyTitle} body={t.messages.emptyBody} />
    </>
  );
}
