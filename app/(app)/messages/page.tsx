"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { syncMessages, useAllMessages } from "@/lib/data/messages";
import { useMyProfile } from "@/lib/data/profiles";
import { syncFromServer, useMatches } from "@/lib/data/swipes";
import { formatClock, formatDayLabel } from "@/lib/format";
import { t } from "@/lib/strings";

export default function MessagesPage() {
  const [me] = useMyProfile();
  const [matches] = useMatches();
  const [store] = useAllMessages();

  // Supabase: refresh matches, then their messages. (No-ops in demo mode.)
  useEffect(() => {
    void syncFromServer()
      .then(() => syncMessages(matches.map((m) => m.id)))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per visit
  }, []);

  const conversations = useMemo(() => {
    return matches
      .map((match) => {
        const thread = store[match.id] ?? [];
        const last = thread.at(-1);
        const unread = me ? thread.filter((m) => m.senderId !== me.id && !m.readAt).length : 0;
        return { match, last, unread, sortKey: last?.createdAt ?? match.createdAt };
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [matches, store, me]);

  if (!me) return null;

  return (
    <>
      <PageHeader title={t.messages.title} />
      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={t.messages.emptyTitle}
          body={t.messages.emptyBody}
          action={<ButtonLink href="/decouvrir">{t.matches.cta}</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-line/70 px-2 py-2">
          {conversations.map(({ match, last, unread }) => {
            const p = match.profile;
            const time = last
              ? formatDayLabel(last.createdAt, formatClock(last.createdAt), t.chat.yesterday)
              : null;
            return (
              <li key={match.id}>
                <Link
                  href={`/messages/${match.id}`}
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl px-2 py-3 hover:bg-navy-50"
                >
                  <span className="relative h-14 w-14 shrink-0">
                    <span className="block h-full w-full overflow-hidden rounded-full bg-navy-50">
                      {p.photos[0] ? (
                        <img
                          src={p.photos[0]}
                          alt={t.card.photoAlt(p.firstName, 1, p.photos.length)}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    {!last ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-bg bg-orange"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-display text-[17px] font-bold text-navy">{p.firstName}</span>
                      {time ? <span className="shrink-0 text-[12px] text-ink-2">{time}</span> : null}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${unread ? "font-medium text-navy" : "text-ink-2"}`}>
                        {last
                          ? `${last.senderId === me.id ? t.messages.you : ""}${last.body}`
                          : t.messages.newMatch}
                      </span>
                      {unread ? (
                        <span
                          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange px-1.5 text-[11px] font-medium text-navy"
                          aria-label={t.messages.unread(unread)}
                        >
                          {unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
