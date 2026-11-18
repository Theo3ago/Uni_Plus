"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FullScreenSpinner } from "@/components/auth/AuthGate";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";
import { DEMO_MODE } from "@/lib/config";
import { sendMagicLink } from "@/lib/data/auth";
import { t } from "@/lib/strings";

const a = t.auth;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  // No sign-in in demo mode.
  useEffect(() => {
    if (DEMO_MODE) router.replace("/bienvenue");
  }, [router]);
  if (DEMO_MODE) return <FullScreenSpinner />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setError(a.invalidEmail);
    setError(null);
    setStatus("sending");
    try {
      await sendMagicLink(value);
      setStatus("sent");
    } catch {
      setError(a.error);
      setStatus("idle");
    }
  }

  return (
    <main className="flex flex-1 flex-col px-5 pb-10 pt-3">
      <Link
        href="/"
        aria-label={t.common.back}
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
      >
        <ArrowLeft className="h-6 w-6" aria-hidden />
      </Link>
      <div className="mt-6">
        <Logo />
      </div>

      {status === "sent" ? (
        <section className="mt-10 rounded-[24px] bg-card p-6 text-center shadow-soft">
          <MailCheck className="mx-auto h-10 w-10 text-navy" strokeWidth={1.5} aria-hidden />
          <h1 className="mt-4 text-2xl text-navy">{a.sentTitle}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a.sentBody(email.trim())}</p>
          <Button variant="ghost" className="mt-4" onClick={() => setStatus("idle")}>
            {a.useOther}
          </Button>
        </section>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
          <div>
            <h1 className="text-[28px] text-navy">{a.title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a.intro}</p>
          </div>
          <TextField
            label={a.emailLabel}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={a.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p role="alert" className="min-h-5 text-sm font-medium text-navy">
            {error}
          </p>
          <Button type="submit" className="h-14 w-full text-base" disabled={status === "sending"}>
            {status === "sending" ? a.sending : a.send}
          </Button>
        </form>
      )}
    </main>
  );
}
