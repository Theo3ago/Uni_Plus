import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-card shadow-soft">
        <Icon className="h-7 w-7 text-navy" strokeWidth={1.75} aria-hidden />
      </div>
      <h2 className="text-xl text-navy">{title}</h2>
      {body ? <p className="mt-2 max-w-72 text-[15px] leading-relaxed text-ink-2">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line/70 ${className}`} aria-hidden />;
}

export function Spinner({ className = "h-6 w-6", label }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#E3E7EF" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="#E8772E" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label ?? "Chargement…"}</span>
    </span>
  );
}
