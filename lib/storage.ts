"use client";

/**
 * Safe, reactive localStorage wrapper.
 * - Never throws (private mode, quota, disabled storage → falls back to memory).
 * - `useStored` re-renders every component that reads a key when it changes,
 *   including across browser tabs.
 */
import { useCallback, useSyncExternalStore } from "react";

const PREFIX = "uniplus:";
const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();
const parsedCache = new Map<string, { raw: string | null; value: unknown }>();

function rawGet(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function rawSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Quota exceeded or storage unavailable: keep it in memory for this session.
    if (value === null) memory.delete(key);
    else memory.set(key, value);
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = rawGet(key);
  const cached = parsedCache.get(key);
  if (cached && cached.raw === raw) return (cached.value ?? fallback) as T;
  let value: unknown = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = fallback;
    }
  }
  parsedCache.set(key, { raw, value });
  return value as T;
}

export function writeStored<T>(key: string, value: T) {
  rawSet(key, JSON.stringify(value));
  emit(key);
}

export function removeStored(key: string) {
  rawSet(key, null);
  emit(key);
}

/** Remove every Uni+ key (used by "reset demo"). */
export function clearAllStored() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  memory.clear();
  parsedCache.clear();
  listeners.forEach((_, key) => emit(key));
}

function subscribe(key: string, fn: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFIX + key) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.get(key)?.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * React hook: [value, setValue]. Renders `fallback` on the server and during
 * hydration, then the stored value.
 */
export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (fn) => subscribe(key, fn),
    () => readStored(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, fallback);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStored(key, resolved);
    },
    // fallback is intentionally excluded: callers often pass inline literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}

/** True once the component is running in the browser (after hydration). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
