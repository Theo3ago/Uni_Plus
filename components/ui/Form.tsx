"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClass =
  "block min-h-12 w-full rounded-2xl border border-line bg-card px-4 text-[16px] text-navy placeholder:text-ink-2/60 focus:border-navy focus:outline-none";

/** Label + control + optional hint. 16px inputs avoid iOS zoom-on-focus. */
export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-navy">
        {label}
      </label>
      <input id={id} className={inputClass} {...props} />
      {hint ? <p className="mt-1.5 text-[13px] text-ink-2">{hint}</p> : null}
    </div>
  );
}

/** Group heading for a set of controls. */
export function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-navy">{label}</legend>
      {hint ? <p className="-mt-1 mb-2 text-[13px] text-ink-2">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

/**
 * Single-choice control built on native radio inputs (keyboard + screen reader support for free).
 * `columns` controls the grid; options wrap nicely on a 390px screen.
 */
export function Segmented<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  columns = 2,
}: {
  label: string;
  hint?: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4 | 5;
}) {
  const name = useId();
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[columns];
  return (
    <FieldGroup label={label} hint={hint}>
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => (
          <label key={String(o.value)} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              className="peer sr-only"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="flex min-h-12 items-center justify-center rounded-2xl border border-line bg-card px-2 py-2 text-center text-sm font-medium leading-tight text-navy transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange hover:bg-navy-50 peer-checked:hover:bg-navy">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </FieldGroup>
  );
}

/** Two-thumb range slider (two native range inputs stacked on one track). */
export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  labels,
  format,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  labels: [string, string];
  format: (n: number) => string;
}) {
  const [lo, hi] = value;
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  return (
    <div className="range-dual relative h-11">
      {/* Inset by half a thumb (15px) so the fill lines up with the thumb centres. */}
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" aria-hidden />
      <div className="absolute inset-x-[15px] top-1/2 h-1.5 -translate-y-1/2" aria-hidden>
        <div
          className="absolute inset-y-0 rounded-full bg-orange"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={lo}
        aria-label={labels[0]}
        aria-valuetext={format(lo)}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
        style={{ zIndex: lo > max - step * 4 ? 3 : 2 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        aria-label={labels[1]}
        aria-valuetext={format(hi)}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
        style={{ zIndex: 2 }}
      />
    </div>
  );
}
