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
import { passwordAuth, sendMagicLink } from "@/lib/data/auth";
import { getMyProfile } from "@/lib/data/profiles";
import { t } from "@/lib/strings";

const a = t.auth;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(e: unknown, tab: "password" | "link"): string {
  const err = e as { code?: string; message?: string; status?: number };
  const msg = (err?.message ?? "").toLowerCase();
  if (err?.code === "user_already_exists" || msg.includes("already registered")) return a.alreadyRegistered;
  if (err?.code === "invalid_credentials" || msg.includes("invalid login")) return a.badCredentials;
  if (err?.status === 429 || msg.includes("rate limit") || msg.includes("security purposes")) return a.rateLimited;
  if (msg.includes("password")) return a.passwordShort;
  return tab === "link" ? a.error : a.genericError;
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"password" | "link">("password");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "sent" | "confirm">("idle");
  const [error, setError] = useState<string | null>(null);

  // No sign-in in demo mode.
  useEffect(() => {
    if (DEMO_MODE) router.replace("/bienvenue");
  }, [router]);
  if (DEMO_MODE) return <FullScreenSpinner />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError(a.invalidEmail);
    if (tab === "password" && password.length < 8) return setError(a.passwordShort);
    setError(null);
    setStatus("busy");
    try {
      if (tab === "link") {
        await sendMagicLink(value);
        setStatus("sent");
        return;
      }
      const result = await passwordAuth(mode, value, password);
      if (result === "confirm-email") {
        setStatus("confirm");
        setMode("signin");
        return;
      }
      const profile = await getMyProfile().catch(() => null);
      router.replace(profile ? "/decouvrir" : "/bienvenue");
    } catch (err) {
      setError(errorMessage(err, tab));
      setStatus("idle");
    }
  }

  const tabClass = (on: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
      on ? "bg-card text-navy shadow-soft" : "text-ink-2 hover:text-navy"
    }`;

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
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <h1 className="text-[28px] text-navy">{a.title}</h1>

          <div className="flex gap-1 rounded-2xl bg-navy-50 p-1" role="tablist" aria-label={a.title}>
            <button type="button" role="tab" aria-selected={tab === "password"} className={tabClass(tab === "password")} onClick={() => { setTab("password"); setError(null); }}>
              {a.tabPassword}
            </button>
            <button type="button" role="tab" aria-selected={tab === "link"} className={tabClass(tab === "link")} onClick={() => { setTab("link"); setError(null); }}>
              {a.tabLink}
            </button>
          </div>

          <p className="text-[15px] leading-relaxed text-ink-2">{tab === "password" ? a.passwordIntro : a.intro}</p>

          {status === "confirm" ? (
            <p role="status" className="rounded-2xl bg-orange-50 p-3 text-sm leading-relaxed text-navy">
              {a.confirmEmail}
            </p>
          ) : null}

          <TextField
            label={a.emailLabel}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={a.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {tab === "password" ? (
            <TextField
              label={a.passwordLabel}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              hint={mode === "signup" ? a.passwordHint : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          ) : null}

          <p role="alert" className="min-h-5 text-sm font-medium text-navy">
            {error}
          </p>
          <Button type="submit" className="h-14 w-full text-base" disabled={status === "busy"}>
            {status === "busy" ? a.sending : tab === "link" ? a.send : mode === "signup" ? a.signUp : a.signIn}
          </Button>
          {tab === "password" ? (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
              }}
            >
              {mode === "signup" ? a.switchToSignIn : a.switchToSignUp}
            </Button>
          ) : null}
        </form>
      )}
    </main>
  );
}
