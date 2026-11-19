"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { ArrowLeft, ArrowRight, CircleCheck, Plus, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FieldGroup, inputClass, Segmented } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import type { Member } from "@/lib/agreement";
import { addExpense, isActive, removeExpense, useHouseholdPolling, useHouseholds, type Household } from "@/lib/data/households";
import { useMyProfile } from "@/lib/data/profiles";
import { balances, settleUp, totalSpent } from "@/lib/expenses";
import { formatPrice, formatShortDate } from "@/lib/format";
import { t } from "@/lib/strings";

const E = t.expenses;
const money = (cents: number) => formatPrice(cents / 100);

export default function ExpensesPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AuthGate>
        <Expenses />
      </AuthGate>
    </main>
  );
}

function Avatar({ m, size = "h-8 w-8" }: { m?: Member; size?: string }) {
  return (
    <span className={`${size} block shrink-0 overflow-hidden rounded-full bg-navy-50`}>
      {m?.photo ? <img src={m.photo} alt="" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

function Expenses() {
  const { id } = useParams<{ id: string }>();
  const [me] = useMyProfile();
  const [store] = useHouseholds();
  const h = store[id];
  useHouseholdPolling(h ? [h.matchId] : [], 10000);

  if (!me) return null;
  if (!h || !isActive(h)) {
    return (
      <EmptyState
        icon={Wallet}
        title={!h ? t.household.notFound : t.household.notActive}
        action={<ButtonLink href="/messages">{t.chat.back}</ButtonLink>}
      />
    );
  }
  return <ExpensesView h={h} myId={me.id} />;
}

function ExpensesView({ h, myId }: { h: Household; myId: string }) {
  const name = (id: string) => (id === myId ? t.area.you : (h.members.find((m) => m.id === id)?.firstName ?? "?"));
  const member = (id: string) => h.members.find((m) => m.id === id);
  const memberIds = h.members.map((m) => m.id);
  const transfers = useMemo(() => settleUp(balances(h.expenses, memberIds)), [h.expenses, memberIds]);

  return (
    <div className="flex flex-1 flex-col pb-10">
      <div className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-line/60 bg-bg/95 px-3 backdrop-blur">
        <Link
          href={`/messages/${h.matchId}`}
          aria-label={t.common.back}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </Link>
        <h1 className="truncate text-xl text-navy">{E.title}</h1>
      </div>

      <div className="space-y-5 px-4 pt-4">
        <p className="text-[15px] leading-relaxed text-ink-2">{E.body}</p>

        {/* Who owes whom */}
        <section className="rounded-[24px] bg-card p-5 shadow-soft" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg text-navy">{E.balancesTitle}</h2>
            <p className="text-[13px] text-ink-2">
              {E.total} : <span className="font-medium text-navy">{money(totalSpent(h.expenses))}</span>
            </p>
          </div>
          {transfers.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-[15px] font-medium text-navy">
              <CircleCheck className="h-5 w-5 text-orange" aria-hidden />
              {E.settled}
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {transfers.map((tr) => (
                <li key={`${tr.from}-${tr.to}`} className="rounded-2xl bg-navy-50 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar m={member(tr.from)} />
                    <ArrowRight className="h-4 w-4 text-ink-2" aria-hidden />
                    <Avatar m={member(tr.to)} />
                    <span className="min-w-0 flex-1 text-sm text-navy">{E.owes(name(tr.from), name(tr.to))}</span>
                    <span className="font-display text-lg font-bold text-navy">{money(tr.amountCents)}</span>
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-2 min-h-10 w-full text-sm"
                    onClick={() =>
                      void addExpense(h.id, {
                        description: E.settlement,
                        amountCents: tr.amountCents,
                        paidBy: tr.from,
                        splitAmong: [tr.to],
                        settlement: true,
                      })
                    }
                  >
                    {E.settle}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <AddExpense h={h} myId={myId} name={name} />

        {/* History */}
        <section>
          <h2 className="mb-2 text-lg text-navy">{E.historyTitle}</h2>
          {h.expenses.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-sm text-ink-2 shadow-soft">{E.empty}</p>
          ) : (
            <ul className="divide-y divide-line rounded-[20px] bg-card px-4 shadow-soft">
              {h.expenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <Avatar m={member(e.paidBy)} size="h-9 w-9" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px] ${e.settlement ? "text-ink-2" : "font-medium text-navy"}`}>
                      {e.description}
                    </span>
                    <span className="block text-[12px] text-ink-2">
                      {E.paidByLine(name(e.paidBy), formatShortDate(e.createdAt))}
                      {e.settlement ? ` → ${name(e.splitAmong[0])}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-display font-bold text-navy">{money(e.amountCents)}</span>
                  <button
                    type="button"
                    onClick={() => void removeExpense(h.id, e.id)}
                    aria-label={E.remove(e.description)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-navy-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AddExpense({ h, myId, name }: { h: Household; myId: string; name: (id: string) => string }) {
  const descId = useId();
  const amountId = useId();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(myId);
  const [split, setSplit] = useState<string[]>(h.members.map((m) => m.id));
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!description.trim()) return setError(E.errors.description);
    if (!Number.isFinite(cents) || cents <= 0) return setError(E.errors.amount);
    if (!split.length) return setError(E.errors.split);
    setError(null);
    await addExpense(h.id, { description: description.trim(), amountCents: cents, paidBy, splitAmong: split });
    setDescription("");
    setAmount("");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[24px] bg-card p-5 shadow-soft" noValidate>
      <h2 className="text-lg text-navy">{E.add}</h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {E.suggestions.map((s) => (
          <Chip key={s} selected={description === s} onClick={() => setDescription(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <div>
          <label htmlFor={descId} className="mb-2 block text-sm font-medium text-navy">
            {E.description}
          </label>
          <input
            id={descId}
            value={description}
            maxLength={60}
            placeholder={E.descriptionPlaceholder}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={amountId} className="mb-2 block text-sm font-medium text-navy">
            {E.amount}
          </label>
          <input
            id={amountId}
            inputMode="decimal"
            value={amount}
            placeholder="0,00"
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className={`${inputClass} tabular-nums`}
          />
        </div>
      </div>
      <Segmented
        label={E.paidBy}
        value={paidBy}
        columns={h.members.length > 2 ? 4 : 2}
        onChange={setPaidBy}
        options={h.members.map((m) => ({ value: m.id, label: name(m.id) }))}
      />
      <FieldGroup label={E.splitAmong}>
        <div className="flex flex-wrap gap-2">
          {h.members.map((m) => (
            <Chip
              key={m.id}
              selected={split.includes(m.id)}
              onClick={() => setSplit((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))}
            >
              {name(m.id)}
            </Chip>
          ))}
        </div>
      </FieldGroup>
      <p role="alert" className="min-h-5 text-center text-sm font-medium text-navy">
        {error}
      </p>
      <Button type="submit" variant="dark" className="h-12 w-full">
        <Plus className="h-5 w-5" aria-hidden />
        {E.save}
      </Button>
    </form>
  );
}
