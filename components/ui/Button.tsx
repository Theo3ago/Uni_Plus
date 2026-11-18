import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Variants:
 * - primary: orange with navy text (navy on orange = 4.9:1, passes WCAG AA; white on orange would not).
 * - dark: navy with white text.
 * - secondary: white card with a border.
 * - ghost: text only.
 */
type Variant = "primary" | "dark" | "secondary" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-medium transition-[transform,background-color,opacity] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-orange text-navy hover:bg-[#DD6C22]",
  dark: "bg-navy text-white hover:bg-[#0E2140]",
  secondary: "bg-card text-navy border border-line hover:bg-navy-50",
  ghost: "text-navy hover:bg-navy-50",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
