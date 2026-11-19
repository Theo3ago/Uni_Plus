"use client";

import { FileSignature, Handshake, Hourglass, Wallet } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import {
  acceptCommit,
  cancelCommit,
  householdForMatch,
  isActive,
  requestCommit,
  useHouseholdPolling,
  useHouseholds,
} from "@/lib/data/households";
import type { Match } from "@/lib/data/swipes";
import { isFullySigned } from "@/lib/agreement";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

const c = t.commit;

/** Commitment state for one match, shown under the chat header. */
export function CommitBanner({ match, me }: { match: Match; me: Profile }) {
  const [store] = useHouseholds();
  const h = householdForMatch(store, match.id);
  useHouseholdPolling([match.id]); // real mode: see requests / acceptance from the other phone
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = match.profile.firstName;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  let content: React.ReactNode;
  if (!h) {
    content = (
      <>
        <Handshake className="h-5 w-5 shrink-0 text-navy" aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-medium text-navy">{c.prompt}</p>
        <Button className="min-h-10 shrink-0 px-4 text-sm" onClick={() => setConfirmOpen(true)}>
          {c.cta}
        </Button>
      </>
    );
  } else if (!isActive(h) && h.requestedBy === me.id) {
    content = (
      <>
        <Hourglass className="h-5 w-5 shrink-0 text-navy" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-navy" aria-live="polite">
          {c.waiting(name)}
        </p>
        <Button variant="ghost" className="min-h-10 shrink-0 px-3 text-sm" disabled={busy} onClick={() => void run(() => cancelCommit(h))}>
          {t.common.cancel}
        </Button>
      </>
    );
  } else if (!isActive(h)) {
    if (dismissed) return null;
    content = (
      <>
        <Handshake className="h-5 w-5 shrink-0 text-navy" aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-medium text-navy" aria-live="polite">
          {c.incoming(name)}
        </p>
        <div className="flex w-full shrink-0 justify-end gap-1">
          <Button variant="ghost" className="min-h-10 px-3 text-sm" onClick={() => setDismissed(true)}>
            {c.later}
          </Button>
          <Button className="min-h-10 px-4 text-sm" disabled={busy} onClick={() => void run(() => acceptCommit(h, me.id))}>
            {c.accept}
          </Button>
        </div>
      </>
    );
  } else {
    const signed = Boolean(h.agreement) && isFullySigned(h.signatures, h.members);
    content = (
      <>
        <Handshake className="h-5 w-5 shrink-0 text-orange" aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-medium text-navy">
          {c.active}
          <span className="block text-[12px] font-normal text-ink-2">{signed ? c.signed : c.draft}</span>
        </p>
        <div className="flex shrink-0 gap-1.5">
          <ButtonLink
            href={signed ? `/entente/${h.id}/document` : `/entente/${h.id}`}
            variant="dark"
            className="min-h-10 px-3 text-sm"
          >
            <FileSignature className="h-4 w-4" aria-hidden />
            {c.agreement}
          </ButtonLink>
          <ButtonLink href={`/depenses/${h.id}`} variant="secondary" className="min-h-10 px-3 text-sm">
            <Wallet className="h-4 w-4" aria-hidden />
            <span className="sr-only">{c.expenses}</span>
          </ButtonLink>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/60 px-4 py-2 ${
          h && !isActive(h) && h.requestedBy !== me.id ? "bg-orange-50" : "bg-card"
        }`}
      >
        {content}
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title={c.confirmTitle(name)}>
        <div className="space-y-5 px-5 pb-6 pt-4">
          <p className="text-[15px] leading-relaxed text-ink-2">{c.confirmBody}</p>
          <Button
            className="h-14 w-full text-base"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await requestCommit(match, me);
                setConfirmOpen(false);
              })
            }
          >
            <Handshake className="h-5 w-5" aria-hidden />
            {c.send}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
