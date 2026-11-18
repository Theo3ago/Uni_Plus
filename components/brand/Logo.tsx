import type { SVGProps } from "react";

/** House outline with an orange plus. */
export function LogoMark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 200 200" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M28 96 L100 34 L172 96"
        fill="none"
        stroke="#13294B"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 92 V166 H150 V92"
        fill="none"
        stroke="#13294B"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M100 102 V148 M77 125 H123" fill="none" stroke="#E8772E" strokeWidth="16" strokeLinecap="round" />
    </svg>
  );
}

/** "Uni" in navy + "+" in orange, Space Grotesk 700. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight text-navy ${className}`}>
      Uni<span className="text-orange">+</span>
    </span>
  );
}

const SIZES = {
  sm: { mark: "h-7 w-7", text: "text-xl" },
  md: { mark: "h-9 w-9", text: "text-2xl" },
  lg: { mark: "h-20 w-20", text: "text-5xl" },
} as const;

/** Main logo: mark + wordmark. */
export function Logo({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Uni+">
      <LogoMark className={s.mark} />
      <Wordmark className={`${s.text} leading-none`} />
    </span>
  );
}

/** App icon: navy rounded square, white "U", orange "+". */
export function AppIcon({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Uni+">
      <rect width="100" height="100" rx="23" fill="#13294B" />
      <text
        x="44"
        y="71"
        textAnchor="middle"
        fontFamily="var(--font-space-grotesk), 'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="60"
        fill="#FFFFFF"
      >
        U
      </text>
      <text
        x="76"
        y="50"
        textAnchor="middle"
        fontFamily="var(--font-space-grotesk), 'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="34"
        fill="#E8772E"
      >
        +
      </text>
    </svg>
  );
}
