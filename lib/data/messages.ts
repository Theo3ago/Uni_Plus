"use client";

/**
 * 1-to-1 messages.
 * - Demo mode: stored locally; the other person "reads" your message, types, then replies.
 * - Supabase: rows in `messages`, live updates through Realtime (INSERT + UPDATE for read receipts).
 * The UI always reads the local cache (`useMessages`), so both modes render the same way.
 */
import { useSyncExternalStore } from "react";
import { DEMO_MODE } from "../config";
import { DEMO_OPENER_DELAY_MS, DEMO_REPLY_DELAY_MS, demoOpener, demoReply, wantsToCommit } from "../demo/replies";
import { demoIncomingCommit } from "./households";
import { readStored, useStored, writeStored } from "../storage";
import { getSupabase } from "../supabase/client";
import type { Match } from "./swipes";

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

const KEY = "messages";
type Store = Record<string, Message[]>;

export const useAllMessages = () => useStored<Store>(KEY, {});

function setThread(matchId: string, fn: (list: Message[]) => Message[]) {
  const all = readStored<Store>(KEY, {});
  writeStored(KEY, { ...all, [matchId]: fn(all[matchId] ?? []) });
}

function upsertLocal(m: Message) {
  setThread(m.matchId, (list) => {
    const i = list.findIndex((x) => x.id === m.id);
    if (i === -1) return [...list, m].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const copy = list.slice();
    copy[i] = m;
    return copy;
  });
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

// ── Typing indicator (in memory only) ────────────────────────────────────────
const typing = new Set<string>();
const typingListeners = new Set<() => void>();
function setTyping(matchId: string, on: boolean) {
  if (on) typing.add(matchId);
  else typing.delete(matchId);
  typingListeners.forEach((fn) => fn());
}
export function useTyping(matchId: string): boolean {
  return useSyncExternalStore(
    (fn) => {
      typingListeners.add(fn);
      return () => typingListeners.delete(fn);
    },
    () => typing.has(matchId),
    () => false,
  );
}

// ── API ─────────────────────────────────────────────────────────────────────

export async function sendMessage(match: Match, myId: string, body: string): Promise<void> {
  const text = body.trim().slice(0, 2000);
  if (!text) return;
  const msg: Message = {
    id: newId(),
    matchId: match.id,
    senderId: myId,
    body: text,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  upsertLocal(msg); // optimistic

  if (DEMO_MODE) {
    simulateReply(match, msg);
    return;
  }
  const { error } = await getSupabase()!
    .from("messages")
    .insert({ id: msg.id, match_id: match.id, sender_id: myId, body: text });
  if (error) {
    setThread(match.id, (list) => list.filter((m) => m.id !== msg.id));
    throw error;
  }
}

/** Marks the other person's messages as read (when I open the chat). */
export async function markThreadRead(matchId: string, myId: string): Promise<void> {
  const list = readStored<Store>(KEY, {})[matchId] ?? [];
  if (!list.some((m) => m.senderId !== myId && !m.readAt)) return;
  const now = new Date().toISOString();
  setThread(matchId, (l) => l.map((m) => (m.senderId !== myId && !m.readAt ? { ...m, readAt: now } : m)));
  if (DEMO_MODE) return;
  await getSupabase()!
    .from("messages")
    .update({ read_at: now })
    .eq("match_id", matchId)
    .neq("sender_id", myId)
    .is("read_at", null);
}

export function unreadCount(store: Store, myId: string): number {
  return Object.values(store).reduce((n, list) => n + list.filter((m) => m.senderId !== myId && !m.readAt).length, 0);
}

// ── Supabase sync + realtime ─────────────────────────────────────────────────
interface Row {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}
const fromRow = (r: Row): Message => ({
  id: r.id,
  matchId: r.match_id,
  senderId: r.sender_id,
  body: r.body,
  createdAt: r.created_at,
  readAt: r.read_at,
});

/** Supabase only: load recent messages for these matches into the local cache. */
export async function syncMessages(matchIds: string[]): Promise<void> {
  if (DEMO_MODE || !matchIds.length) return;
  const { data } = await getSupabase()!
    .from("messages")
    .select("*")
    .in("match_id", matchIds)
    .order("created_at", { ascending: true })
    .limit(1000);
  if (!data) return;
  const grouped: Store = {};
  for (const r of data as Row[]) (grouped[r.match_id] ??= []).push(fromRow(r));
  writeStored(KEY, { ...readStored<Store>(KEY, {}), ...grouped });
}

/** Supabase only: live updates for one conversation. Returns an unsubscribe function. */
export function subscribeToThread(matchId: string): () => void {
  if (DEMO_MODE) return () => {};
  const sb = getSupabase()!;
  const channel = sb
    .channel(`messages:${matchId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => {
        if (payload.new && "id" in payload.new) upsertLocal(fromRow(payload.new as Row));
      },
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

// ── Demo simulation ──────────────────────────────────────────────────────────
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function theirMessage(match: Match, body: string): Message {
  return {
    id: newId(),
    matchId: match.id,
    senderId: match.profile.id,
    body,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
}

function simulateReply(match: Match, mine: Message) {
  // 1) They read it.
  setTimeout(() => {
    setThread(match.id, (l) =>
      l.map((m) => (m.senderId === mine.senderId && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)),
    );
    setTyping(match.id, true);
  }, 700);
  // 2) They answer.
  setTimeout(
    () => {
      const theirs = (readStored<Store>(KEY, {})[match.id] ?? []).filter((m) => m.senderId === match.profile.id);
      setTyping(match.id, false);
      upsertLocal(theirMessage(match, demoReply(match.profile, mine.body, theirs.length)));
      if (wantsToCommit(mine.body)) demoIncomingCommit(match);
    },
    700 + rand(DEMO_REPLY_DELAY_MS.min, DEMO_REPLY_DELAY_MS.max),
  );
}

/** Demo only: deliver a message from the other person right away. */
export function deliverDemoMessage(match: Match, body: string) {
  if (DEMO_MODE) upsertLocal(theirMessage(match, body));
}

/** Demo only: a new match says hello first, a moment after the match. */
export function scheduleDemoOpener(match: Match) {
  if (!DEMO_MODE) return;
  setTimeout(() => {
    const list = readStored<Store>(KEY, {})[match.id] ?? [];
    if (!list.length) upsertLocal(theirMessage(match, demoOpener(match.profile)));
  }, DEMO_OPENER_DELAY_MS);
}
