import type { ReactNode } from "react";
import { DEMO_MODE } from "@/lib/config";
import { t } from "@/lib/strings";

export function DemoBadge() {
  if (!DEMO_MODE) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-2">
      {t.app.demoBadge}
    </span>
  );
}

/** Sticky top bar for tab screens. */
export function PageHeader({ title, left, right }: { title?: ReactNode; left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-line/60 bg-bg/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        {left}
        {typeof title === "string" ? <h1 className="truncate text-2xl text-navy">{title}</h1> : title}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
