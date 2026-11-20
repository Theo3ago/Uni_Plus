"use client";

/**
 * Launch countdown: sign-in and sign-up open at LAUNCH_AT (America/Toronto).
 * Before that, an access code unlocks them on this device.
 *
 * Only the SHA-256 hash of the code is shipped, never the code itself. This is a
 * soft gate for a class launch, not real security: everything runs in the browser.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { DEMO_MODE } from "./config";

/** Monday 23 November 2026, 11:35 Toronto time (EST, UTC−5). */
export const LAUNCH_AT = new Date("2026-11-23T11:35:00-05:00").getTime();

const CODE_SHA256 = "da27a3eee1dbc583e733d9fe6036aaf913da7f900240110e750fcb3c7e65db4b";
// Not "uniplus:"-prefixed, so signing out (which clears that prefix) keeps the device unlocked.
const BYPASS_KEY = "uniplus-launch-unlocked";

// ── Clock: corrected with the server's time so changing the device clock doesn't skip the wait.
let offsetMs = 0;
let offsetLoaded = false;
async function loadServerOffset() {
  if (offsetLoaded) return;
  offsetLoaded = true;
  try {
    const t0 = Date.now();
    const res = await fetch(`/?t=${t0}`, { method: "HEAD", cache: "no-store" });
    const server = Date.parse(res.headers.get("date") ?? "");
    if (!Number.isNaN(server)) offsetMs = server - (t0 + Date.now()) / 2;
  } catch {
    /* offline: trust the device clock */
  }
}
const now = () => Date.now() + offsetMs;

// ── Bypass flag (reactive across components).
const listeners = new Set<() => void>();
function readBypass(): boolean {
  try {
    return window.localStorage.getItem(BYPASS_KEY) === CODE_SHA256;
  } catch {
    return memoryBypass;
  }
}
let memoryBypass = false;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns true and unlocks this device if the code is right. */
export async function tryAccessCode(code: string): Promise<boolean> {
  const ok = (await sha256(code.replace(/\s/g, ""))) === CODE_SHA256;
  if (ok) {
    memoryBypass = true;
    try {
      window.localStorage.setItem(BYPASS_KEY, CODE_SHA256);
    } catch {
      /* private mode: unlocked for this visit only */
    }
    listeners.forEach((fn) => fn());
  }
  return ok;
}

export interface LaunchState {
  /** False until the browser has checked the time (render a placeholder meanwhile). */
  ready: boolean;
  locked: boolean;
  remainingMs: number;
}

/** Live countdown state. Demo mode is never locked. */
export function useLaunch(): LaunchState {
  const bypass = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    readBypass,
    () => false,
  );
  const [state, setState] = useState<{ ready: boolean; remainingMs: number }>({ ready: false, remainingMs: 0 });

  useEffect(() => {
    let alive = true;
    const tick = () => alive && setState({ ready: true, remainingMs: Math.max(0, LAUNCH_AT - now()) });
    void loadServerOffset().then(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (DEMO_MODE) return { ready: true, locked: false, remainingMs: 0 };
  return { ready: state.ready, locked: state.remainingMs > 0 && !bypass, remainingMs: state.remainingMs };
}

/** Splits milliseconds into days, hours, minutes and seconds. */
export function splitDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
