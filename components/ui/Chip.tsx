import type { ReactNode } from "react";

/** Static tag (read-only). */
export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  const cls =
    tone === "accent" ? "bg-orange-50 text-navy border-[#F6D3BA]" : "bg-navy-50 text-navy border-transparent";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

/** Selectable chip (toggle button, min 44px tall for touch). */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
        selected ? "border-navy bg-navy text-white" : "border-line bg-card text-navy hover:bg-navy-50"
      }`}
    >
      {children}
    </button>
  );
}
