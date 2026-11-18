"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FieldGroup, inputClass, RangeSlider, Segmented, TextField } from "@/components/ui/Form";
import { BUDGET_RANGE, DEMO_MODE } from "@/lib/config";
import { saveMyProfile } from "@/lib/data/profiles";
import { sampleMe } from "@/lib/demo/sampleMe";
import { formatDate, formatMoney, formatTime, todayIso } from "@/lib/format";
import { SCHOOL_IDS, SCHOOLS } from "@/lib/schools";
import { removeStored, useStored } from "@/lib/storage";
import { t } from "@/lib/strings";
import type { Profile, SchoolId, StudyYear } from "@/lib/types";
import { PhotoPicker } from "./PhotoPicker";

const o = t.onboarding;
const L = t.labels;

export type Draft = Omit<Profile, "school"> & { school: SchoolId | null };

export const BIO_MAX = 300;
const MAX_INTERESTS = 10;

export function emptyDraft(): Draft {
  return {
    id: "me",
    firstName: "",
    age: 0,
    program: "",
    year: 1,
    school: null,
    bio: "",
    photos: [],
    interests: [],
    study: { noise: "quiet", place: "library", chronotype: "morning", examMode: "steady" },
    lifestyle: { bedtime: "23:00", cleanliness: 3, guests: "sometimes", smoking: "no", pets: "ok" },
    budget: { min: 600, max: 1000 },
    moveIn: "",
  };
}

const STEPS = ["photos", "basics", "school", "bio", "interests", "study", "lifestyle", "budget", "moveIn"] as const;
type StepKey = (typeof STEPS)[number];

/** Returns an error message, or null when the step is complete. */
function validate(step: StepKey, d: Draft): string | null {
  switch (step) {
    case "photos":
      return d.photos.length >= 1 ? null : o.photos.required;
    case "basics":
      return d.firstName.trim() && d.program.trim() && d.age >= 16 && d.age <= 60 ? null : o.basics.required;
    case "school":
      return d.school ? null : o.school.required;
    case "interests":
      return d.interests.length >= 3 ? null : o.interests.required;
    case "moveIn":
      return d.moveIn && d.moveIn >= todayIso() ? null : o.moveIn.required;
    default:
      return null;
  }
}

/** Bedtimes from 21 h to 3 h, every 30 minutes. */
const BEDTIMES = Array.from({ length: 13 }, (_, i) => {
  const mins = (21 * 60 + i * 30) % (24 * 60);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

/** Next three common move-in dates (1 Jan, 1 May, 1 Sep). */
function upcomingTermStarts(): string[] {
  const today = todayIso();
  const year = Number(today.slice(0, 4));
  const out: string[] = [];
  for (let y = year; out.length < 3; y++) {
    for (const m of ["01", "05", "09"]) {
      const d = `${y}-${m}-01`;
      if (d >= today && out.length < 3) out.push(d);
    }
  }
  return out;
}

export function ProfileWizard({ mode, initial }: { mode: "create" | "edit"; initial?: Profile }) {
  const router = useRouter();

  // Create mode keeps a draft in storage so a refresh never loses progress.
  const [storedDraft, setStoredDraft] = useStored<Draft | null>("onboarding-draft", null);
  const [storedStep, setStoredStep] = useStored<number>("onboarding-step", 0);
  const [localDraft, setLocalDraft] = useState<Draft>(() => (initial ? { ...initial } : emptyDraft()));
  const [localStep, setLocalStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const draft = mode === "create" ? (storedDraft ?? emptyDraft()) : localDraft;
  const stepIndex = Math.min(mode === "create" ? storedStep : localStep, STEPS.length - 1);
  const setDraft = (next: Draft) => (mode === "create" ? setStoredDraft(next) : setLocalDraft(next));
  const setStep = (i: number) => (mode === "create" ? setStoredStep(i) : setLocalStep(i));
  const update = (patch: Partial<Draft>) => {
    setError(null); // the user is fixing things: drop the stale message
    setDraft({ ...draft, ...patch });
  };

  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setError(null);
  }, [stepIndex]);

  async function finish(d: Draft) {
    const firstInvalid = STEPS.findIndex((s) => validate(s, d));
    if (firstInvalid !== -1) {
      setDirection(firstInvalid > stepIndex ? 1 : -1);
      setStep(firstInvalid);
      setTimeout(() => setError(validate(STEPS[firstInvalid], d)), 0);
      return;
    }
    setSaving(true);
    try {
      await saveMyProfile({ ...d, school: d.school!, firstName: d.firstName.trim(), program: d.program.trim() });
      if (mode === "create") {
        removeStored("onboarding-draft");
        removeStored("onboarding-step");
        router.replace("/decouvrir");
      } else {
        router.replace("/profil");
      }
    } catch {
      setError(o.saveError);
      setSaving(false);
    }
  }

  function next() {
    const err = validate(step, draft);
    if (err) {
      setError(err);
      return;
    }
    if (isLast) return void finish(draft);
    setDirection(1);
    setStep(stepIndex + 1);
  }

  function back() {
    if (stepIndex === 0) {
      router.push(mode === "create" ? "/" : "/profil");
      return;
    }
    setDirection(-1);
    setStep(stepIndex - 1);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header: back, progress, (edit) save */}
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
            {mode === "edit" ? `${o.editTitle} · ` : ""}
            {o.stepOf(stepIndex + 1, STEPS.length)}
          </p>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => void finish(draft)}
              disabled={saving}
              className="-mr-2 flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-navy hover:bg-navy-50"
            >
              {t.common.save}
            </button>
          ) : (
            <span className="w-11" aria-hidden />
          )}
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-label={o.stepOf(stepIndex + 1, STEPS.length)}
        >
          <motion.div
            className="h-full rounded-full bg-orange"
            initial={false}
            animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />
        </div>
      </header>

      {/* Step content */}
      <div className="relative flex-1 overflow-x-hidden px-5 pb-6 pt-4">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <StepBody step={step} draft={draft} update={update} />

            {DEMO_MODE && mode === "create" && step === "photos" ? (
              <div className="mt-8 rounded-[20px] border border-line bg-card p-4">
                <Button variant="secondary" className="w-full" onClick={() => void finish(sampleMe())}>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {o.demoFill}
                </Button>
                <p className="mt-2 text-center text-[13px] text-ink-2">{o.demoFillHint}</p>
              </div>
            ) : null}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-20 border-t border-line/60 bg-bg/95 px-5 pb-safe pt-3 backdrop-blur">
        <p role="alert" className="min-h-5 pb-2 text-center text-sm font-medium text-navy">
          {error}
        </p>
        <Button className="mb-4 h-14 w-full text-base" onClick={next} disabled={saving}>
          {saving ? o.saving : isLast ? o.finish : t.common.continue}
          {!saving && isLast ? <Check className="h-5 w-5" aria-hidden /> : null}
        </Button>
      </footer>
    </div>
  );
}

function StepTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[28px] leading-tight text-navy">{title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

function StepBody({ step, draft, update }: { step: StepKey; draft: Draft; update: (p: Partial<Draft>) => void }) {
  switch (step) {
    case "photos":
      return (
        <>
          <StepTitle title={o.photos.title} body={o.photos.body} />
          <PhotoPicker photos={draft.photos} onChange={(photos) => update({ photos })} />
        </>
      );

    case "basics":
      return (
        <>
          <StepTitle title={o.basics.title} body={o.basics.body} />
          <div className="space-y-5">
            <TextField
              label={o.basics.firstName}
              value={draft.firstName}
              maxLength={30}
              autoComplete="given-name"
              onChange={(e) => update({ firstName: e.target.value })}
            />
            <TextField
              label={o.basics.age}
              type="number"
              inputMode="numeric"
              min={16}
              max={60}
              value={draft.age || ""}
              onChange={(e) => update({ age: Number(e.target.value) || 0 })}
            />
            <TextField
              label={o.basics.program}
              placeholder={o.basics.programPlaceholder}
              value={draft.program}
              maxLength={60}
              onChange={(e) => update({ program: e.target.value })}
            />
            <Segmented<StudyYear>
              label={o.basics.year}
              value={draft.year}
              columns={2}
              onChange={(year) => update({ year })}
              options={([1, 2, 3, 4, 5] as StudyYear[]).map((y) => ({ value: y, label: L.year[y] }))}
            />
          </div>
        </>
      );

    case "school":
      return (
        <>
          <StepTitle title={o.school.title} body={o.school.body} />
          <fieldset>
            <legend className="sr-only">{o.school.title}</legend>
            <div className="space-y-3">
              {SCHOOL_IDS.map((id) => {
                const s = SCHOOLS[id];
                const selected = draft.school === id;
                return (
                  <label key={id} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="school"
                      className="peer sr-only"
                      checked={selected}
                      onChange={() => update({ school: id })}
                    />
                    <span className="flex min-h-16 items-center gap-4 rounded-[20px] border border-line bg-card p-4 shadow-soft transition-colors peer-checked:border-navy peer-checked:ring-1 peer-checked:ring-navy peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange">
                      <span className="flex-1">
                        <span className="block font-medium text-navy">{s.name}</span>
                        <span className="mt-0.5 block text-[13px] text-ink-2">{s.address}</span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected ? "border-navy bg-navy" : "border-line"
                        }`}
                        aria-hidden
                      >
                        {selected ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      );

    case "bio":
      return (
        <>
          <StepTitle title={o.bio.title} body={o.bio.body} />
          <BioField value={draft.bio} onChange={(bio) => update({ bio })} />
        </>
      );

    case "interests":
      return (
        <>
          <StepTitle title={o.interests.title} body={o.interests.body} />
          <InterestsField value={draft.interests} onChange={(interests) => update({ interests })} />
        </>
      );

    case "study":
      return (
        <>
          <StepTitle title={o.study.title} body={o.study.body} />
          <div className="space-y-6">
            <Segmented
              label={o.study.noise}
              value={draft.study.noise}
              onChange={(noise) => update({ study: { ...draft.study, noise } })}
              options={[
                { value: "quiet", label: L.noise.quiet },
                { value: "music", label: L.noise.music },
              ]}
            />
            <Segmented
              label={o.study.place}
              value={draft.study.place}
              onChange={(place) => update({ study: { ...draft.study, place } })}
              options={[
                { value: "home", label: L.place.home },
                { value: "library", label: L.place.library },
              ]}
            />
            <Segmented
              label={o.study.chronotype}
              value={draft.study.chronotype}
              onChange={(chronotype) => update({ study: { ...draft.study, chronotype } })}
              options={[
                { value: "morning", label: L.chronotype.morning },
                { value: "night", label: L.chronotype.night },
              ]}
            />
            <Segmented
              label={o.study.examMode}
              value={draft.study.examMode}
              onChange={(examMode) => update({ study: { ...draft.study, examMode } })}
              options={[
                { value: "steady", label: L.examMode.steady },
                { value: "hermit", label: L.examMode.hermit },
                { value: "group", label: L.examMode.group },
                { value: "stressed", label: L.examMode.stressed },
              ]}
            />
          </div>
        </>
      );

    case "lifestyle":
      return (
        <>
          <StepTitle title={o.lifestyle.title} body={o.lifestyle.body} />
          <div className="space-y-6">
            <BedtimeField
              value={draft.lifestyle.bedtime}
              onChange={(bedtime) => update({ lifestyle: { ...draft.lifestyle, bedtime } })}
            />
            <Segmented<1 | 2 | 3 | 4 | 5>
              label={`${o.lifestyle.cleanliness} : ${L.cleanliness[draft.lifestyle.cleanliness]}`}
              hint={o.lifestyle.cleanlinessHint}
              value={draft.lifestyle.cleanliness}
              columns={5}
              onChange={(cleanliness) => update({ lifestyle: { ...draft.lifestyle, cleanliness } })}
              options={([1, 2, 3, 4, 5] as const).map((n) => ({ value: n, label: String(n) }))}
            />
            <Segmented
              label={o.lifestyle.guests}
              value={draft.lifestyle.guests}
              columns={3}
              onChange={(guests) => update({ lifestyle: { ...draft.lifestyle, guests } })}
              options={[
                { value: "rarely", label: L.guests.rarely },
                { value: "sometimes", label: L.guests.sometimes },
                { value: "often", label: L.guests.often },
              ]}
            />
            <Segmented
              label={o.lifestyle.smoking}
              value={draft.lifestyle.smoking}
              columns={3}
              onChange={(smoking) => update({ lifestyle: { ...draft.lifestyle, smoking } })}
              options={[
                { value: "no", label: L.smoking.no },
                { value: "outside", label: L.smoking.outside },
                { value: "yes", label: L.smoking.yes },
              ]}
            />
            <Segmented
              label={o.lifestyle.pets}
              value={draft.lifestyle.pets}
              onChange={(pets) => update({ lifestyle: { ...draft.lifestyle, pets } })}
              options={[
                { value: "none", label: L.pets.none },
                { value: "has", label: L.pets.has },
                { value: "ok", label: L.pets.ok },
                { value: "allergic", label: L.pets.allergic },
              ]}
            />
          </div>
        </>
      );

    case "budget":
      return (
        <>
          <StepTitle title={o.budget.title} body={o.budget.body} />
          <div className="rounded-[24px] bg-card p-6 shadow-soft">
            <p className="text-center font-display text-[32px] font-bold text-navy" aria-live="polite">
              {formatMoney(draft.budget.min)} – {formatMoney(draft.budget.max)}
            </p>
            <p className="mb-6 text-center text-sm text-ink-2">{o.budget.perMonth}</p>
            <RangeSlider
              min={BUDGET_RANGE.min}
              max={BUDGET_RANGE.max}
              step={BUDGET_RANGE.step}
              value={[draft.budget.min, draft.budget.max]}
              onChange={([min, max]) => update({ budget: { min, max } })}
              labels={[o.budget.min, o.budget.max]}
              format={formatMoney}
            />
            <div className="mt-2 flex justify-between text-[13px] text-ink-2">
              <span>{formatMoney(BUDGET_RANGE.min)}</span>
              <span>{formatMoney(BUDGET_RANGE.max)}</span>
            </div>
          </div>
        </>
      );

    case "moveIn":
      return (
        <>
          <StepTitle title={o.moveIn.title} body={o.moveIn.body} />
          <div className="space-y-6">
            <FieldGroup label={o.moveIn.quick}>
              <div className="flex flex-wrap gap-2">
                {upcomingTermStarts().map((d) => (
                  <Chip key={d} selected={draft.moveIn === d} onClick={() => update({ moveIn: d })}>
                    {formatDate(d)}
                  </Chip>
                ))}
              </div>
            </FieldGroup>
            <TextField
              label={o.moveIn.label}
              type="date"
              min={todayIso()}
              value={draft.moveIn}
              onChange={(e) => update({ moveIn: e.target.value })}
            />
          </div>
        </>
      );
  }
}

function BioField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-navy">
        {o.bio.label}
      </label>
      <textarea
        id={id}
        rows={6}
        maxLength={BIO_MAX}
        value={value}
        placeholder={o.bio.placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, BIO_MAX))}
        className={`${inputClass} resize-none py-3 leading-relaxed`}
      />
      <p className={`mt-1.5 text-right text-[13px] ${value.length >= BIO_MAX ? "text-navy font-medium" : "text-ink-2"}`}>
        {o.bio.counter(value.length, BIO_MAX)}
      </p>
    </div>
  );
}

function BedtimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-navy">
        {o.lifestyle.bedtime}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {BEDTIMES.map((b) => (
          <option key={b} value={b}>
            {formatTime(b)}
          </option>
        ))}
      </select>
    </div>
  );
}

function InterestsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const inputId = useId();
  const suggested: readonly string[] = t.interests;
  const customSelected = value.filter((v) => !suggested.includes(v));

  function toggle(x: string) {
    setMsg(null);
    if (value.includes(x)) onChange(value.filter((v) => v !== x));
    else if (value.length >= MAX_INTERESTS) setMsg(o.interests.max);
    else onChange([...value, x]);
  }

  function addCustom() {
    const x = custom.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!x) return;
    const label = x.charAt(0).toUpperCase() + x.slice(1);
    if (!value.some((v) => v.toLowerCase() === label.toLowerCase())) toggle(label);
    setCustom("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {suggested.map((x) => (
          <Chip key={x} selected={value.includes(x)} onClick={() => toggle(x)}>
            {x}
          </Chip>
        ))}
        {customSelected.map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => toggle(x)}
            aria-label={o.interests.remove(x)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-navy bg-navy px-4 text-sm font-medium text-white"
          >
            {x}
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-navy">
          {o.interests.custom}
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            value={custom}
            maxLength={24}
            placeholder={o.interests.customPlaceholder}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            className={inputClass}
          />
          <Button variant="dark" onClick={addCustom} aria-label={o.interests.add} className="w-12 shrink-0 px-0!">
            <Plus className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-2" aria-live="polite">
        {msg ?? `${value.length} / ${MAX_INTERESTS}`}
      </p>
    </div>
  );
}
