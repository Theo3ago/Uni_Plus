"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, CircleCheck, FileText, Hourglass, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { ChoreTable } from "@/components/household/ChoreTable";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldGroup, inputClass, Segmented, TextField } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import {
  isFullySigned,
  monthlyShares,
  percentSum,
  validFullName,
  type Agreement,
  type Member,
} from "@/lib/agreement";
import {
  agreementOf,
  clearSignatures,
  isActive,
  signAgreement,
  updateAgreement,
  useHouseholds,
  type Household,
} from "@/lib/data/households";
import { useMyProfile } from "@/lib/data/profiles";
import { formatDate, formatMoney, formatTime, todayIso } from "@/lib/format";
import { t } from "@/lib/strings";

const A = t.agreement;
const STEPS = [
  "rent",
  "utilities",
  "chores",
  "quiet",
  "guests",
  "cleanliness",
  "groceries",
  "petsSmoking",
  "conflict",
  "lease",
  "sign",
] as const;
type Step = (typeof STEPS)[number];

/** Every 30 minutes, for quiet-hours selects. */
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export default function AgreementPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AuthGate>
        <Builder />
      </AuthGate>
    </main>
  );
}

function Builder() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [me] = useMyProfile();
  const [store] = useHouseholds();
  const h = store[id];
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setError(null);
  }, [step]);

  if (!me) return null;
  if (!h || !isActive(h)) {
    return (
      <EmptyState
        icon={FileText}
        title={!h ? t.household.notFound : t.household.notActive}
        action={<ButtonLink href="/messages">{t.chat.back}</ButtonLink>}
      />
    );
  }

  const agreement = agreementOf(h);
  const set = (patch: Partial<Agreement>) => {
    setError(null);
    updateAgreement(h.id, { ...agreement, ...patch });
  };
  const key: Step = STEPS[step];
  const isSign = key === "sign";
  const backHref = `/messages/${h.matchId}`;

  // Already signed by someone: editing must clear signatures first.
  const anySigned = Object.keys(h.signatures).length > 0;
  if (anySigned && !isSign) {
    return <SignedGate h={h} onEdit={() => void clearSignatures(h.id)} backHref={backHref} />;
  }

  function next() {
    if (key === "rent" && agreement.rent.mode === "custom" && percentSum(agreement, h.members) !== 100) {
      setError(A.rent.sumError(percentSum(agreement, h.members)));
      return;
    }
    if (key === "chores" && agreement.chores.length === 0) {
      setError(A.chores.min);
      return;
    }
    setDir(1);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    if (step === 0) return router.push(backHref);
    setDir(-1);
    setStep((s) => s - 1);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 bg-bg/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex min-h-11 items-center justify-between gap-2">
          <button
            type="button"
            onClick={back}
            aria-label={t.common.back}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </button>
          <p className="text-sm font-medium text-ink-2" aria-live="polite">
            {A.stepOf(step + 1, STEPS.length)}
          </p>
          <Link
            href={`/entente/${h.id}/document`}
            aria-label={A.sign.preview}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
          >
            <FileText className="h-5 w-5" aria-hidden />
          </Link>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={A.stepOf(step + 1, STEPS.length)}
        >
          <motion.div
            className="h-full rounded-full bg-orange"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="relative flex-1 overflow-x-hidden px-5 pb-6 pt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={key}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.2 }}
          >
            {isSign ? (
              <SignStep h={h} agreement={agreement} myId={me.id} />
            ) : (
              <StepBody step={key} a={agreement} set={set} members={h.members} h={h} />
            )}
            {!isSign ? <p className="mt-6 text-center text-[12px] text-ink-2">{A.saved}</p> : null}
          </motion.section>
        </AnimatePresence>
      </div>

      {!isSign ? (
        <footer className="sticky bottom-0 z-20 border-t border-line/60 bg-bg/95 px-5 pb-safe pt-3 backdrop-blur">
          <p role="alert" className="min-h-5 pb-2 text-center text-sm font-medium text-navy">
            {error}
          </p>
          <Button className="mb-4 h-14 w-full text-base" onClick={next}>
            {step === STEPS.length - 2 ? A.toReview : A.next}
          </Button>
        </footer>
      ) : null}
    </div>
  );
}

// ── Small controls ───────────────────────────────────────────────────────────

function Title({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[28px] leading-tight text-navy">{title}</h1>
      {body ? <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p> : null}
    </div>
  );
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-navy">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={25}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={`${inputClass} pr-10`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-2">$</span>
      </div>
    </div>
  );
}

function TimeSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex-1">
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-ink-2">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {TIMES.map((x) => (
          <option key={x} value={x}>
            {formatTime(x)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-card px-4 py-3">
      <span className="text-[15px] text-navy">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 cursor-pointer accent-[#13294B]"
      />
    </label>
  );
}

function EditableList({
  items,
  onChange,
  addLabel,
  placeholder,
  numbered,
  min = 1,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  addLabel: string;
  placeholder?: string;
  numbered?: boolean;
  min?: number;
}) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-start gap-2 rounded-2xl border border-line bg-card py-1 pl-4 pr-1">
            {numbered ? (
              <span className="mt-2.5 shrink-0 text-[13px] font-medium text-ink-2">{A.conflict.step(i + 1)}</span>
            ) : null}
            {numbered ? (
              <textarea
                value={item}
                rows={2}
                aria-label={A.conflict.step(i + 1)}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
                className="min-h-11 flex-1 resize-none bg-transparent py-2 text-[15px] leading-snug text-navy focus:outline-none"
              />
            ) : (
              <span className="flex min-h-11 flex-1 items-center text-[15px] text-navy">{item}</span>
            )}
            <button
              type="button"
              onClick={() => items.length > min && onChange(items.filter((_, j) => j !== i))}
              disabled={items.length <= min}
              aria-label={A.chores.remove(item)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-navy-50 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <div>
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-navy">
          {addLabel}
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            value={draft}
            maxLength={120}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className={inputClass}
          />
          <Button variant="dark" onClick={add} aria-label={addLabel} className="w-12 shrink-0 px-0!">
            <Plus className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ m, size = "h-8 w-8" }: { m: Member; size?: string }) {
  return (
    <span className={`${size} block shrink-0 overflow-hidden rounded-full bg-navy-50`}>
      {m.photo ? <img src={m.photo} alt="" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

// ── Steps ───────────────────────────────────────────────────────────────────

function StepBody({
  step,
  a,
  set,
  members,
  h,
}: {
  step: Exclude<Step, "sign">;
  a: Agreement;
  set: (p: Partial<Agreement>) => void;
  members: Member[];
  h: Household;
}): ReactNode {
  const shares = monthlyShares(a, members);
  switch (step) {
    case "rent":
      return (
        <>
          <Title title={A.rent.title} body={A.rent.body} />
          <div className="space-y-5">
            <MoneyField label={A.rent.total} value={a.rent.total} onChange={(total) => set({ rent: { ...a.rent, total } })} />
            <Segmented
              label={A.rent.mode}
              value={a.rent.mode}
              onChange={(mode) => set({ rent: { ...a.rent, mode } })}
              options={[
                { value: "equal", label: A.rent.equal },
                { value: "custom", label: A.rent.custom },
              ]}
            />
            {a.rent.mode === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                {members.map((m) => (
                  <TextField
                    key={m.id}
                    label={A.rent.percentOf(m.firstName)}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={a.rent.percents[m.id] ?? 0}
                    onChange={(e) =>
                      set({
                        rent: {
                          ...a.rent,
                          percents: { ...a.rent.percents, [m.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) },
                        },
                      })
                    }
                  />
                ))}
              </div>
            ) : null}
            <SharesCard shares={shares} kind="rent" />
          </div>
        </>
      );

    case "utilities":
      return (
        <>
          <Title title={A.utilities.title} body={A.utilities.body} />
          <div className="space-y-5">
            <MoneyField
              label={A.utilities.utilities}
              value={a.utilities.monthly}
              onChange={(monthly) => set({ utilities: { ...a.utilities, monthly } })}
            />
            <MoneyField
              label={A.utilities.internet}
              value={a.utilities.internet}
              onChange={(internet) => set({ utilities: { ...a.utilities, internet } })}
            />
            <Segmented
              label={A.utilities.mode}
              value={a.utilities.mode}
              onChange={(mode) => set({ utilities: { ...a.utilities, mode } })}
              options={[
                { value: "equal", label: A.utilities.equal },
                { value: "rent", label: A.utilities.likeRent },
              ]}
            />
            <SharesCard shares={shares} kind="total" />
          </div>
        </>
      );

    case "chores":
      return (
        <>
          <Title title={A.chores.title} body={A.chores.body} />
          <EditableList
            items={a.chores}
            onChange={(chores) => set({ chores })}
            addLabel={A.chores.add}
            placeholder={A.chores.addPlaceholder}
          />
          <h2 className="mb-3 mt-7 text-lg text-navy">{A.chores.table}</h2>
          <ChoreTable chores={a.chores} members={members} />
        </>
      );

    case "quiet":
      return (
        <>
          <Title title={A.quiet.title} body={A.quiet.body} />
          <div className="space-y-6">
            <FieldGroup label={A.quiet.weekdays}>
              <div className="flex gap-3">
                <TimeSelect label={A.quiet.from} value={a.quiet.weekdayFrom} onChange={(v) => set({ quiet: { ...a.quiet, weekdayFrom: v } })} />
                <TimeSelect label={A.quiet.to} value={a.quiet.weekdayTo} onChange={(v) => set({ quiet: { ...a.quiet, weekdayTo: v } })} />
              </div>
            </FieldGroup>
            <FieldGroup label={A.quiet.weekends}>
              <div className="flex gap-3">
                <TimeSelect label={A.quiet.from} value={a.quiet.weekendFrom} onChange={(v) => set({ quiet: { ...a.quiet, weekendFrom: v } })} />
                <TimeSelect label={A.quiet.to} value={a.quiet.weekendTo} onChange={(v) => set({ quiet: { ...a.quiet, weekendTo: v } })} />
              </div>
            </FieldGroup>
            <Toggle
              label={A.quiet.examNote}
              checked={a.quiet.examExtended}
              onChange={(examExtended) => set({ quiet: { ...a.quiet, examExtended } })}
            />
          </div>
        </>
      );

    case "guests":
      return (
        <>
          <Title title={A.guests.title} body={A.guests.body} />
          <div className="space-y-4">
            <Toggle label={A.guests.notice} checked={a.guests.notice} onChange={(notice) => set({ guests: { ...a.guests, notice } })} />
            <Segmented<number>
              label={A.guests.overnight}
              value={a.guests.overnightPerWeek}
              columns={5}
              onChange={(overnightPerWeek) => set({ guests: { ...a.guests, overnightPerWeek } })}
              options={[0, 1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
            />
            <Toggle
              label={A.guests.partner}
              checked={a.guests.partnerRule}
              onChange={(partnerRule) => set({ guests: { ...a.guests, partnerRule } })}
            />
          </div>
        </>
      );

    case "cleanliness":
      return (
        <>
          <Title title={A.cleanliness.title} body={A.cleanliness.body} />
          <div className="space-y-5">
            <Segmented<1 | 2 | 3 | 4 | 5>
              label={`${A.cleanliness.level} : ${t.labels.cleanliness[a.cleanliness.level]}`}
              value={a.cleanliness.level}
              columns={5}
              onChange={(level) => set({ cleanliness: { ...a.cleanliness, level } })}
              options={([1, 2, 3, 4, 5] as const).map((n) => ({ value: n, label: String(n) }))}
            />
            <div className="space-y-2">
              {A.cleanliness.rules.map((rule) => (
                <Toggle
                  key={rule}
                  label={rule}
                  checked={a.cleanliness.rules.includes(rule)}
                  onChange={(on) =>
                    set({
                      cleanliness: {
                        ...a.cleanliness,
                        rules: on ? [...a.cleanliness.rules, rule] : a.cleanliness.rules.filter((r) => r !== rule),
                      },
                    })
                  }
                />
              ))}
            </div>
          </div>
        </>
      );

    case "groceries":
      return (
        <>
          <Title title={A.groceries.title} body={A.groceries.body} />
          <div className="space-y-5">
            <Segmented
              label={A.groceries.mode}
              value={a.groceries.mode}
              columns={3}
              onChange={(mode) => set({ groceries: { ...a.groceries, mode } })}
              options={[
                { value: "shared", label: A.groceries.shared },
                { value: "mixed", label: A.groceries.mixed },
                { value: "separate", label: A.groceries.separate },
              ]}
            />
            {a.groceries.mode === "mixed" ? <p className="text-sm text-ink-2">{A.groceries.mixedHint}</p> : null}
            {a.groceries.mode === "shared" ? (
              <MoneyField
                label={A.groceries.budget}
                value={a.groceries.budget}
                onChange={(budget) => set({ groceries: { ...a.groceries, budget } })}
              />
            ) : null}
          </div>
        </>
      );

    case "petsSmoking": {
      const allergic = h.profiles.find((p) => p.lifestyle.pets === "allergic");
      return (
        <>
          <Title title={A.petsSmoking.title} />
          <div className="space-y-6">
            <Segmented
              label={A.petsSmoking.pets}
              value={a.pets}
              columns={3}
              onChange={(pets) => set({ pets })}
              options={[
                { value: "no", label: A.petsSmoking.petsNo },
                { value: "ask", label: A.petsSmoking.petsAsk },
                { value: "yes", label: A.petsSmoking.petsYes },
              ]}
            />
            {allergic ? (
              <p className="-mt-3 rounded-2xl bg-orange-50 p-3 text-sm text-navy">
                {A.petsSmoking.allergyNote(allergic.firstName)}
              </p>
            ) : null}
            <Segmented
              label={A.petsSmoking.smoking}
              value={a.smoking}
              columns={3}
              onChange={(smoking) => set({ smoking })}
              options={[
                { value: "no", label: A.petsSmoking.smokeNo },
                { value: "outside", label: A.petsSmoking.smokeOutside },
                { value: "yes", label: A.petsSmoking.smokeYes },
              ]}
            />
          </div>
        </>
      );
    }

    case "conflict":
      return (
        <>
          <Title title={A.conflict.title} body={A.conflict.body} />
          <EditableList
            items={a.conflictSteps}
            onChange={(conflictSteps) => set({ conflictSteps })}
            addLabel={A.conflict.add}
            numbered
          />
        </>
      );

    case "lease":
      return (
        <>
          <Title title={A.lease.title} body={A.lease.body} />
          <div className="space-y-5">
            <TextField
              label={A.lease.moveIn}
              type="date"
              min={todayIso()}
              value={a.lease.moveIn}
              onChange={(e) => set({ lease: { ...a.lease, moveIn: e.target.value } })}
            />
            <Segmented<number>
              label={A.lease.length}
              value={a.lease.months}
              columns={4}
              onChange={(months) => set({ lease: { ...a.lease, months } })}
              options={[4, 8, 12, 24].map((n) => ({ value: n, label: A.lease.months(n) }))}
            />
            <NotesField value={a.notes} onChange={(notes) => set({ notes })} />
          </div>
        </>
      );
  }
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-navy">
        {A.lease.notes}
      </label>
      <textarea
        id={id}
        rows={4}
        maxLength={600}
        value={value}
        placeholder={A.lease.notesPlaceholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-none py-3 leading-relaxed`}
      />
    </div>
  );
}

function SharesCard({ shares, kind }: { shares: ReturnType<typeof monthlyShares>; kind: "rent" | "total" }) {
  return (
    <div className="rounded-[20px] bg-card p-4 shadow-soft">
      <p className="mb-2 text-[13px] text-ink-2">{kind === "rent" ? A.rent.perPerson : t.agreement.doc.monthlyPerPerson}</p>
      <ul className="divide-y divide-line">
        {shares.map((s) => (
          <li key={s.member.id} className="flex items-center gap-3 py-2">
            <Avatar m={s.member} />
            <span className="flex-1 text-[15px] text-navy">{s.member.firstName}</span>
            <span className="text-[13px] text-ink-2">{Math.round(s.percent)} %</span>
            <span className="w-20 text-right font-display font-bold text-navy">
              {formatMoney(kind === "rent" ? s.rent : s.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Sign ─────────────────────────────────────────────────────────────────────

function SignStep({ h, agreement, myId }: { h: Household; agreement: Agreement; myId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = h.signatures[myId];
  const allSigned = isFullySigned(h.signatures, h.members);
  const shares = monthlyShares(agreement, h.members);

  useEffect(() => {
    if (allSigned) {
      const timer = setTimeout(() => router.push(`/entente/${h.id}/document`), 1600);
      return () => clearTimeout(timer);
    }
  }, [allSigned, h.id, router]);

  async function sign() {
    if (!validFullName(name)) return setError(A.sign.nameError);
    if (!consent) return setError(A.sign.consentError);
    setError(null);
    setBusy(true);
    try {
      await signAgreement(h.id, myId, name);
    } finally {
      setBusy(false);
    }
  }

  const dateTime = (iso: string) =>
    `${formatDate(iso.slice(0, 10))} à ${formatTime(new Date(iso).toTimeString().slice(0, 5))}`;

  return (
    <>
      <Title title={A.sign.title} body={A.sign.body} />

      <div className="space-y-4">
        <section className="rounded-[20px] bg-card p-5 shadow-soft">
          <ul className="space-y-2 text-[15px] text-navy">
            <li className="flex justify-between gap-3">
              <span className="text-ink-2">{A.rent.total}</span>
              <span className="font-medium">{formatMoney(agreement.rent.total)}</span>
            </li>
            {shares.map((s) => (
              <li key={s.member.id} className="flex justify-between gap-3">
                <span className="text-ink-2">{s.member.firstName}</span>
                <span className="font-medium">{formatMoney(s.total)} / mois</span>
              </li>
            ))}
            <li className="flex justify-between gap-3">
              <span className="text-ink-2">{A.quiet.title}</span>
              <span className="font-medium">
                {formatTime(agreement.quiet.weekdayFrom)} – {formatTime(agreement.quiet.weekdayTo)}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-ink-2">{A.lease.title}</span>
              <span className="font-medium">{A.lease.months(agreement.lease.months)}</span>
            </li>
          </ul>
          <ButtonLink href={`/entente/${h.id}/document`} variant="secondary" className="mt-4 w-full">
            <FileText className="h-4 w-4" aria-hidden />
            {A.sign.preview}
          </ButtonLink>
        </section>

        <section className="rounded-[20px] bg-card p-5 shadow-soft" aria-live="polite">
          <ul className="space-y-3">
            {h.members.map((m) => {
              const sig = h.signatures[m.id];
              return (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar m={m} size="h-10 w-10" />
                  <span className="min-w-0 flex-1 text-sm">
                    {sig ? (
                      <>
                        <span className="block font-display text-lg italic text-navy">{sig.name}</span>
                        <span className="block text-[12px] text-ink-2">{A.sign.signedBy(sig.name, dateTime(sig.signedAt))}</span>
                      </>
                    ) : (
                      <span className="text-ink-2">{A.sign.waiting(m.firstName)}</span>
                    )}
                  </span>
                  {sig ? (
                    <CircleCheck className="h-6 w-6 shrink-0 text-orange" aria-hidden />
                  ) : (
                    <Hourglass className="h-5 w-5 shrink-0 text-ink-2" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {allSigned ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-orange-50 p-4 font-medium text-navy">
            <Check className="h-5 w-5" aria-hidden />
            {A.sign.allSigned}
          </p>
        ) : !mine ? (
          <section className="space-y-4">
            <TextField
              label={A.sign.fullName}
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
            />
            {name.trim() ? (
              <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-3 font-display text-2xl italic text-navy" aria-hidden>
                {name}
              </p>
            ) : null}
            <Toggle label={A.sign.consent} checked={consent} onChange={(v) => { setConsent(v); setError(null); }} />
            <p role="alert" className="min-h-5 text-center text-sm font-medium text-navy">
              {error}
            </p>
            <Button className="h-14 w-full text-base" disabled={busy} onClick={() => void sign()}>
              <Pencil className="h-5 w-5" aria-hidden />
              {A.sign.button}
            </Button>
          </section>
        ) : null}

        <p className="text-[12px] leading-relaxed text-ink-2">{A.notLegal}</p>
      </div>
    </>
  );
}

function SignedGate({ h, onEdit, backHref }: { h: Household; onEdit: () => void; backHref: string }) {
  const signed = isFullySigned(h.signatures, h.members);
  return (
    <div className="flex flex-1 flex-col px-5 pb-10">
      <div className="flex min-h-16 items-center">
        <Link
          href={backHref}
          aria-label={t.common.back}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-navy" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 text-2xl text-navy">{signed ? t.commit.signed : A.title}</h1>
        <div className="mt-8 flex w-full flex-col gap-3">
          <ButtonLink href={`/entente/${h.id}/document`} className="h-14 w-full text-base">
            {A.sign.preview}
          </ButtonLink>
          <Button
            variant="secondary"
            className="h-12 w-full"
            onClick={() => window.confirm(A.sign.editConfirm) && onEdit()}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {A.sign.edit}
          </Button>
        </div>
      </div>
    </div>
  );
}
