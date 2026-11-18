"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { ArrowLeft, Camera, Check, Copy, ExternalLink, Info, PhoneOff, Video } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/States";
import { JITSI_DOMAIN } from "@/lib/config";
import { useMyProfile } from "@/lib/data/profiles";
import { syncFromServer, useMatches, type Match } from "@/lib/data/swipes";
import { embedUrl, roomLink, roomNameFor } from "@/lib/jitsi";
import { t } from "@/lib/strings";

const c = t.call;

export default function CallPage() {
  return (
    <main className="flex h-dvh flex-col">
      <AuthGate>
        <Call />
      </AuthGate>
    </main>
  );
}

type Permission = "idle" | "checking" | "granted" | "denied" | "nodevice" | "insecure" | "unsupported";

/** Ask for camera + mic once (then release them) so Jitsi starts without surprise prompts. */
async function requestMedia(): Promise<Permission> {
  if (typeof window !== "undefined" && !window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return "granted";
  } catch (e) {
    const name = (e as DOMException)?.name;
    if (name === "NotFoundError" || name === "OverconstrainedError") return "nodevice";
    return "denied";
  }
}

function Call() {
  const { id } = useParams<{ id: string }>();
  const [me] = useMyProfile();
  const [matches] = useMatches();
  const match = matches.find((m) => m.id === id);
  const [inCall, setInCall] = useState(false);
  useEffect(() => {
    void syncFromServer().catch(() => undefined); // Supabase: direct link → load matches
  }, []);

  if (!me) return null;
  if (!match) {
    return (
      <EmptyState icon={Video} title={t.chat.notFound} action={<ButtonLink href="/messages">{t.chat.back}</ButtonLink>} />
    );
  }
  const room = roomNameFor(match.id);
  return inCall ? (
    <InCall match={match} room={room} displayName={me.firstName} onLeave={() => setInCall(false)} />
  ) : (
    <PreCall match={match} room={room} onJoin={() => setInCall(true)} />
  );
}

function PreCall({ match, room, onJoin }: { match: Match; room: string; onJoin: () => void }) {
  const [perm, setPerm] = useState<Permission>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = roomLink(room);
  const p = match.profile;

  useEffect(() => {
    // Generated locally (no network): an SVG QR code of the room link.
    QRCode.toString(link, { type: "svg", margin: 1, color: { dark: "#13294B", light: "#FFFFFF" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  async function allow() {
    setPerm("checking");
    setPerm(await requestMedia());
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link is still visible to copy by hand */
    }
  }

  const message =
    perm === "denied"
      ? c.denied
      : perm === "nodevice"
        ? c.noDevice
        : perm === "insecure"
          ? c.insecure
          : perm === "unsupported"
            ? c.unsupported
            : null;

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10">
      <div className="flex min-h-16 items-center">
        <Link
          href={`/messages/${match.id}`}
          aria-label={t.common.back}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="relative">
          <span className="block h-24 w-24 overflow-hidden rounded-full bg-navy-50 shadow-soft">
            {p.photos[0] ? <img src={p.photos[0]} alt="" className="h-full w-full object-cover" /> : null}
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-bg bg-orange text-navy">
            <Video className="h-4 w-4" aria-hidden />
          </span>
        </span>
        <h1 className="mt-5 text-[26px] leading-tight text-navy">{c.title(p.firstName)}</h1>
        <p className="mt-2 max-w-[32ch] text-[15px] leading-relaxed text-ink-2">{c.intro}</p>
      </div>

      <div className="mt-6 space-y-3">
        {perm === "granted" ? (
          <p className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-card text-sm font-medium text-navy shadow-soft">
            <Check className="h-4 w-4 text-orange" strokeWidth={3} aria-hidden />
            {c.granted}
          </p>
        ) : (
          <Button variant="dark" className="h-12 w-full" onClick={() => void allow()} disabled={perm === "checking"}>
            {perm === "checking" ? <Spinner className="h-4 w-4" label={c.checking} /> : <Camera className="h-5 w-5" aria-hidden />}
            {perm === "checking" ? c.checking : c.allow}
          </Button>
        )}
        {message ? (
          <p role="alert" className="rounded-2xl bg-orange-50 p-3 text-sm leading-relaxed text-navy">
            {message}
          </p>
        ) : null}
        <Button className="h-14 w-full text-base" onClick={onJoin}>
          <Video className="h-5 w-5" aria-hidden />
          {message ? c.joinAnyway : c.join}
        </Button>
      </div>

      <section className="mt-8 rounded-[20px] bg-card p-5 shadow-soft">
        <h2 className="text-lg text-navy">{c.secondDevice}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">{c.secondDeviceBody}</p>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-1"
            role="img"
            aria-label={`QR : ${link}`}
            dangerouslySetInnerHTML={qr ? { __html: qr } : undefined}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[12px] uppercase tracking-wide text-ink-2">{c.room}</p>
            <p className="break-all font-mono text-[13px] text-navy">{room}</p>
            <Button variant="secondary" className="w-full" onClick={() => void copy()}>
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? c.copied : c.copyLink}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InCall({
  match,
  room,
  displayName,
  onLeave,
}: {
  match: Match;
  room: string;
  displayName: string;
  onLeave: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const isPublicJitsi = JITSI_DOMAIN === "meet.jit.si";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-navy">
      <div className="flex min-h-14 items-center justify-between gap-2 px-3 text-white">
        <p className="truncate font-display text-lg font-bold">{t.call.title(match.profile.firstName)}</p>
        <a
          href={roomLink(room)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={c.openTabLabel}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-white hover:bg-white/10"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {c.openTab}
        </a>
      </div>

      <div className="relative min-h-0 flex-1">
        {!loaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <Spinner className="h-8 w-8" label={c.loading} />
            <p className="text-sm">{c.loading}</p>
          </div>
        ) : null}
        <iframe
          title={c.title(match.profile.firstName)}
          src={embedUrl(room, displayName)}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="absolute inset-0 h-full w-full border-0"
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="space-y-2 px-4 pb-safe pt-3">
        {isPublicJitsi ? (
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-white/80">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {c.embedNote}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onLeave}
          className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-medium text-navy"
        >
          <PhoneOff className="h-5 w-5" aria-hidden />
          {c.leave}
        </button>
      </div>
    </div>
  );
}
