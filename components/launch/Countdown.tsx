"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";
import { splitDuration, tryAccessCode } from "@/lib/launch";
import { t } from "@/lib/strings";

const L = t.launch;
const pad = (n: number) => String(n).padStart(2, "0");

/** Locked state of the splash screen: live countdown + access code. */
export function Countdown({ remainingMs }: { remainingMs: number }) {
  const { d, h, m, s } = splitDuration(remainingMs);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await tryAccessCode(code);
    setBusy(false);
    if (!ok) {
      setError(L.wrongCode);
      setCode("");
    }
  }

  const cells: [number, string][] = [
    [d, L.units.d],
    [h, L.units.h],
    [m, L.units.m],
    [s, L.units.s],
  ];

  return (
    <div className="flex flex-col gap-3">
      <div role="timer" aria-live="off" className="rounded-[24px] bg-navy px-4 pb-4 pt-3.5 text-white shadow-lift">
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-white/80">
          <Lock className="h-4 w-4" aria-hidden />
          {L.opensIn}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {cells.map(([value, unit]) => (
            <div key={unit} className="rounded-2xl bg-white/10 py-2 text-center">
              <div className="font-display text-[28px] leading-none tabular-nums">{pad(value)}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-white/70">{unit}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[13px] text-orange">{L.when}</p>
      </div>

      {open ? (
        <form onSubmit={submit} className="space-y-3 rounded-[24px] bg-card p-4 shadow-soft" noValidate>
          <TextField
            label={L.codeLabel}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
          />
          <p role="alert" className="min-h-5 text-sm font-medium text-navy">
            {error}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              {L.cancel}
            </Button>
            <Button type="submit" variant="dark" className="flex-1" disabled={busy || !code.trim()}>
              {busy ? L.checking : L.unlock}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="ghost" className="h-12 w-full" onClick={() => setOpen(true)}>
          {L.haveCode}
        </Button>
      )}
    </div>
  );
}
