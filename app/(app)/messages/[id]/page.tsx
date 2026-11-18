"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { ArrowLeft, ArrowUp, Check, CheckCheck, MessageCircle, Video } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ProfileSheet } from "@/components/discover/ProfileSheet";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { computeCompatibility } from "@/lib/compat";
import {
  markThreadRead,
  sendMessage,
  subscribeToThread,
  syncMessages,
  useAllMessages,
  useTyping,
  type Message,
} from "@/lib/data/messages";
import { useMyProfile } from "@/lib/data/profiles";
import { syncFromServer, useMatches } from "@/lib/data/swipes";
import { formatClock, formatDayLabel, sameDay } from "@/lib/format";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

const c = t.chat;

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const [me] = useMyProfile();
  const [matches] = useMatches();
  const [store] = useAllMessages();
  const match = matches.find((m) => m.id === id);
  const thread = store[id] ?? [];
  const typing = useTyping(id);
  const [profileOpen, setProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Supabase: load history + live updates. (No-ops in demo mode.)
  useEffect(() => {
    void syncFromServer()
      .then(() => syncMessages([id]))
      .catch(() => undefined);
    return subscribeToThread(id);
  }, [id]);

  // Mark their messages as read while the chat is open.
  useEffect(() => {
    if (me) void markThreadRead(id, me.id).catch(() => undefined);
  }, [id, me, thread.length]);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: thread.length ? "smooth" : "auto" });
  }, [thread.length, typing]);

  if (!me) return null;
  if (!match) {
    return (
      <EmptyState
        icon={MessageCircle}
        title={c.notFound}
        action={<ButtonLink href="/messages">{c.back}</ButtonLink>}
      />
    );
  }

  const other = match.profile;
  async function send(text: string) {
    setError(null);
    try {
      await sendMessage(match!, me!.id, text);
    } catch {
      setError(c.sendError);
    }
  }

  const lastMine = [...thread].reverse().find((m) => m.senderId === me.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <header className="z-20 flex min-h-16 items-center gap-2 border-b border-line/60 bg-bg/95 px-2 backdrop-blur">
        <Link
          href="/messages"
          aria-label={c.back}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 text-left hover:bg-navy-50"
          aria-label={`${c.viewProfile} : ${other.firstName}`}
        >
          <Avatar profile={other} size="h-10 w-10" />
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold leading-tight text-navy">
              {other.firstName}
            </span>
            <span className="block truncate text-[13px] text-ink-2">
              {typing ? c.typing(other.firstName) : SCHOOLS[other.school].short}
            </span>
          </span>
        </button>
        <Link
          href={`/appel/${match.id}`}
          aria-label={c.video}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-navy shadow-soft"
        >
          <Video className="h-5 w-5" aria-hidden />
        </Link>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
        {thread.length === 0 ? (
          <div className="flex flex-col items-center px-4 pt-10 text-center">
            <Avatar profile={other} size="h-24 w-24" />
            <h2 className="mt-4 text-xl text-navy">{c.emptyTitle(other.firstName)}</h2>
            <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-ink-2">{c.emptyBody}</p>
          </div>
        ) : (
          <ol className="space-y-1">
            {thread.map((m, i) => {
              const prev = thread[i - 1];
              const next = thread[i + 1];
              const mine = m.senderId === me.id;
              const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
              const endOfGroup =
                !next ||
                next.senderId !== m.senderId ||
                Date.parse(next.createdAt) - Date.parse(m.createdAt) > 5 * 60_000;
              return (
                <Fragment key={m.id}>
                  {newDay ? (
                    <li className="py-3 text-center text-[12px] font-medium uppercase tracking-wide text-ink-2">
                      {formatDayLabel(m.createdAt, c.today, c.yesterday)}
                    </li>
                  ) : null}
                  <Bubble
                    message={m}
                    mine={mine}
                    showMeta={endOfGroup}
                    status={m.id === lastMine?.id ? (m.readAt ? "read" : "sent") : null}
                  />
                </Fragment>
              );
            })}
          </ol>
        )}
        {typing ? (
          <div className="mt-2 flex" aria-label={c.typing(other.firstName)}>
            <span className="flex gap-1 rounded-[20px] rounded-bl-md bg-card px-4 py-3 shadow-soft">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-bounce rounded-full bg-ink-2/60"
                  style={{ animationDelay: `${d * 150}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-line/60 bg-bg px-3 pb-safe pt-2">
        {thread.length === 0 ? (
          <div className="-mx-3 mb-2 flex gap-2 overflow-x-auto px-3 pb-1">
            {c.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="min-h-11 shrink-0 rounded-full border border-line bg-card px-4 text-sm font-medium text-navy hover:bg-navy-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="pb-2 text-center text-sm font-medium text-navy">
            {error}
          </p>
        ) : null}
        <Composer onSend={(text) => void send(text)} />
      </div>

      <ProfileSheet
        profile={profileOpen ? other : null}
        compat={computeCompatibility(me, other)}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}

function Avatar({ profile, size }: { profile: Profile; size: string }) {
  return (
    <span className={`${size} block shrink-0 overflow-hidden rounded-full bg-navy-50`}>
      {profile.photos[0] ? <img src={profile.photos[0]} alt="" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

function Bubble({
  message,
  mine,
  showMeta,
  status,
}: {
  message: Message;
  mine: boolean;
  showMeta: boolean;
  status: "sent" | "read" | null;
}) {
  return (
    <li className={`flex flex-col ${mine ? "items-end" : "items-start"} ${showMeta ? "pb-2" : ""}`}>
      <p
        className={`max-w-[80%] whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-snug ${
          mine
            ? "rounded-[20px] rounded-br-md bg-navy text-white"
            : "rounded-[20px] rounded-bl-md bg-card text-navy shadow-soft"
        }`}
      >
        {message.body}
      </p>
      {showMeta ? (
        <p className="mt-1 flex items-center gap-1 px-1 text-[12px] text-ink-2">
          <time dateTime={message.createdAt}>{formatClock(message.createdAt)}</time>
          {mine && status ? (
            <>
              <span aria-hidden>·</span>
              {status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-orange" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )}
              {status === "read" ? c.read : c.sent}
            </>
          ) : null}
        </p>
      ) : null}
    </li>
  );
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to ~4 lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  function submit() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    ref.current?.focus();
  }

  return (
    <form
      className="flex items-end gap-2 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="chat-input" className="sr-only">
        {c.inputLabel}
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={text}
        maxLength={2000}
        placeholder={c.placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="block max-h-[120px] min-h-11 flex-1 resize-none rounded-[22px] border border-line bg-card px-4 py-2.5 text-[16px] leading-snug text-navy placeholder:text-ink-2/60 focus:border-navy focus:outline-none"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        aria-label={c.send}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-navy transition-opacity disabled:opacity-40"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </button>
    </form>
  );
}
