"use client";

import { useEffect } from "react";
/**
 * Households (« foyers »): created when one roommate taps « S'engager » and the other accepts.
 * A household holds the roommate agreement, signatures and shared expenses.
 *
 * - Demo mode: stored locally; the other person accepts / signs automatically after a short delay.
 * - Supabase: tables households, household_members, agreements, expenses (see supabase/schema.sql).
 * The UI always reads the local cache, so both modes render identically.
 */
import { defaultAgreement, demoFullName, type Agreement, type Member, type Signature } from "../agreement";
import { DEMO_MODE } from "../config";
import { readStored, useStored, writeStored } from "../storage";
import { t } from "../strings";
import { getSupabase } from "../supabase/client";
import type { Profile } from "../types";
import { deliverDemoMessage } from "./messages";
import type { Match } from "./swipes";

export interface Expense {
  id: string;
  description: string;
  amountCents: number;
  paidBy: string;
  splitAmong: string[];
  createdAt: string;
  settlement?: boolean;
}

export interface Household {
  id: string;
  matchId: string;
  members: Member[];
  /** Full profiles, used for agreement defaults. */
  profiles: Profile[];
  requestedBy: string;
  requestedAt: string;
  /** memberId → acceptedAt */
  accepted: Record<string, string>;
  agreement: Agreement | null;
  signatures: Record<string, Signature>;
  expenses: Expense[];
}

const KEY = "households";
type Store = Record<string, Household>;

export const useHouseholds = () => useStored<Store>(KEY, {});

export function isActive(h: Household): boolean {
  return h.members.every((m) => h.accepted[m.id]);
}

export function householdForMatch(store: Store, matchId: string): Household | undefined {
  return Object.values(store).find((h) => h.matchId === matchId);
}

function save(h: Household) {
  writeStored(KEY, { ...readStored<Store>(KEY, {}), [h.id]: h });
}
function patch(id: string, fn: (h: Household) => Household) {
  const h = readStored<Store>(KEY, {})[id];
  if (h) save(fn(h));
}
const get = (id: string) => readStored<Store>(KEY, {})[id];

const now = () => new Date().toISOString();
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`);
const toMember = (p: Profile): Member => ({ id: p.id, firstName: p.firstName, photo: p.photos[0] });
const DEMO_DELAY = 2500;

// ── Commitment ──────────────────────────────────────────────────────────────

/** "S'engager": creates the household with a pending invitation for the other roommate. */
export async function requestCommit(match: Match, me: Profile, requestedBy = me.id): Promise<Household> {
  const existing = householdForMatch(readStored<Store>(KEY, {}), match.id);
  if (existing) return existing;
  const profiles = [me, match.profile];
  let id = `hh-${match.id}`;

  if (!DEMO_MODE) {
    const sb = getSupabase()!;
    const { data, error } = await sb
      .from("households")
      .insert({ match_id: match.id, created_by: me.id })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
    const { error: e2 } = await sb.from("household_members").insert([
      { household_id: id, user_id: me.id, accepted_at: now() },
      { household_id: id, user_id: match.profile.id, accepted_at: null },
    ]);
    if (e2) throw e2;
  }

  const h: Household = {
    id,
    matchId: match.id,
    members: profiles.map(toMember),
    profiles,
    requestedBy,
    requestedAt: now(),
    accepted: { [requestedBy]: now() },
    agreement: null,
    signatures: {},
    expenses: [],
  };
  save(h);

  // Demo: the other person accepts and says so in the chat.
  if (DEMO_MODE && requestedBy === me.id) {
    setTimeout(() => {
      if (!get(id)) return; // cancelled meanwhile
      acceptCommitLocal(id, match.profile.id);
      deliverDemoMessage(match, t.commit.acceptedMessage);
    }, DEMO_DELAY);
  }
  return h;
}

/** Demo: the other person proposes to commit (triggered by their chat reply). */
export function demoIncomingCommit(match: Match) {
  const me = readStored<Profile | null>("me", null);
  if (!DEMO_MODE || !me) return;
  if (householdForMatch(readStored<Store>(KEY, {}), match.id)) return;
  void requestCommit(match, me, match.profile.id);
}

function acceptCommitLocal(id: string, memberId: string) {
  patch(id, (h) => ({ ...h, accepted: { ...h.accepted, [memberId]: now() } }));
}

export async function acceptCommit(h: Household, myId: string): Promise<void> {
  acceptCommitLocal(h.id, myId);
  if (DEMO_MODE) return;
  await getSupabase()!
    .from("household_members")
    .update({ accepted_at: now() })
    .eq("household_id", h.id)
    .eq("user_id", myId);
}

export async function cancelCommit(h: Household): Promise<void> {
  const all = { ...readStored<Store>(KEY, {}) };
  delete all[h.id];
  writeStored(KEY, all);
  if (!DEMO_MODE) await getSupabase()!.from("households").delete().eq("id", h.id);
}

// ── Agreement ───────────────────────────────────────────────────────────────

export function agreementOf(h: Household): Agreement {
  return h.agreement ?? defaultAgreement(h.profiles);
}

async function pushAgreement(id: string) {
  if (DEMO_MODE) return;
  const h = get(id);
  if (!h) return;
  await getSupabase()!
    .from("agreements")
    .upsert({ household_id: id, data: h.agreement ?? {}, signatures: h.signatures, updated_at: now() });
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
/** Autosave (debounced to Supabase). */
export function updateAgreement(id: string, agreement: Agreement) {
  patch(id, (h) => ({ ...h, agreement }));
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushAgreement(id).catch(() => undefined), 800);
}

export async function clearSignatures(id: string) {
  patch(id, (h) => ({ ...h, signatures: {} }));
  await pushAgreement(id).catch(() => undefined);
}

export async function signAgreement(id: string, memberId: string, name: string): Promise<void> {
  const mine: Signature = { name: name.trim(), signedAt: now() };
  let remote: Record<string, Signature> = {};
  if (!DEMO_MODE) {
    // Merge with signatures already saved by the other roommates (each phone has its own cache).
    const { data } = await getSupabase()!.from("agreements").select("signatures").eq("household_id", id).maybeSingle();
    remote = (data?.signatures as Record<string, Signature>) ?? {};
  }
  patch(id, (h) => ({
    ...h,
    agreement: agreementOf(h),
    signatures: { ...remote, ...h.signatures, [memberId]: mine },
  }));
  await pushAgreement(id);

  // Demo: the other roommates sign a moment later.
  if (DEMO_MODE) {
    setTimeout(() => {
      patch(id, (h) => {
        const signatures = { ...h.signatures };
        for (const m of h.members)
          if (!signatures[m.id]) signatures[m.id] = { name: demoFullName(m), signedAt: now() };
        return { ...h, signatures };
      });
    }, DEMO_DELAY);
  }
}

// ── Expenses ────────────────────────────────────────────────────────────────

export async function addExpense(id: string, e: Omit<Expense, "id" | "createdAt">): Promise<void> {
  const expense: Expense = { ...e, id: newId(), createdAt: now() };
  patch(id, (h) => ({ ...h, expenses: [expense, ...h.expenses] }));
  if (DEMO_MODE) return;
  const { error } = await getSupabase()!.from("expenses").insert({
    id: expense.id,
    household_id: id,
    paid_by: e.paidBy,
    description: e.description,
    amount_cents: e.amountCents,
    split_among: e.splitAmong,
    is_settlement: Boolean(e.settlement),
  });
  if (error) {
    patch(id, (h) => ({ ...h, expenses: h.expenses.filter((x) => x.id !== expense.id) }));
    throw error;
  }
}

export async function removeExpense(id: string, expenseId: string): Promise<void> {
  patch(id, (h) => ({ ...h, expenses: h.expenses.filter((x) => x.id !== expenseId) }));
  if (!DEMO_MODE) await getSupabase()!.from("expenses").delete().eq("id", expenseId);
}

// ── Supabase sync ───────────────────────────────────────────────────────────

/**
 * Supabase only: keep a household fresh while a screen is open (the other roommate
 * accepts, signs or adds expenses from their own phone). No-op in demo mode.
 */
export function useHouseholdPolling(matchIds: string[], intervalMs = 6000) {
  const key = matchIds.join(",");
  useEffect(() => {
    if (DEMO_MODE || !key) return;
    let alive = true;
    const tick = async () => {
      const me = readStored<Profile | null>("me", null);
      const matches = readStored<Match[]>("matches", []).filter((m) => key.split(",").includes(m.id));
      if (alive && me && matches.length) await syncHouseholds(matches, me).catch(() => undefined);
    };
    void tick();
    const timer = setInterval(() => void tick(), intervalMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [key, intervalMs]);
}

/** Supabase only: refresh households for these matches into the local cache. */
export async function syncHouseholds(matches: Match[], me: Profile): Promise<void> {
  if (DEMO_MODE || !matches.length) return;
  const sb = getSupabase()!;
  const { data: rows } = await sb
    .from("households")
    .select("id, match_id, created_by, created_at, household_members(user_id, accepted_at), agreements(data, signatures), expenses(*)")
    .in(
      "match_id",
      matches.map((m) => m.id),
    );
  if (!rows) return;
  const store: Store = { ...readStored<Store>(KEY, {}) };
  for (const r of rows as unknown as SupabaseHousehold[]) {
    const match = matches.find((m) => m.id === r.match_id);
    if (!match) continue;
    const profiles = [me, match.profile];
    const ag = Array.isArray(r.agreements) ? r.agreements[0] : r.agreements;
    store[r.id] = {
      id: r.id,
      matchId: r.match_id,
      members: profiles.map(toMember),
      profiles,
      requestedBy: r.created_by,
      requestedAt: r.created_at,
      accepted: Object.fromEntries(
        r.household_members.filter((m) => m.accepted_at).map((m) => [m.user_id, m.accepted_at!]),
      ),
      agreement: ag?.data && Object.keys(ag.data).length ? (ag.data as Agreement) : null,
      signatures: (ag?.signatures as Record<string, Signature>) ?? {},
      expenses: (r.expenses ?? [])
        .map((e) => ({
          id: e.id,
          description: e.description,
          amountCents: e.amount_cents,
          paidBy: e.paid_by,
          splitAmong: e.split_among?.length ? e.split_among : profiles.map((p) => p.id),
          createdAt: e.created_at,
          settlement: e.is_settlement,
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  }
  writeStored(KEY, store);
}

interface SupabaseHousehold {
  id: string;
  match_id: string;
  created_by: string;
  created_at: string;
  household_members: { user_id: string; accepted_at: string | null }[];
  agreements: { data: unknown; signatures: unknown } | { data: unknown; signatures: unknown }[] | null;
  expenses:
    | {
        id: string;
        description: string;
        amount_cents: number;
        paid_by: string;
        split_among: string[] | null;
        created_at: string;
        is_settlement: boolean;
      }[]
    | null;
}
