"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import {
  BedDouble,
  Bus,
  ChevronDown,
  Footprints,
  Info,
  MapPin,
  ShoppingBasket,
  TrainFront,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FullScreenSpinner } from "@/components/auth/AuthGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { AreaMap } from "@/components/map/AreaMap";
import { PERSON_COLORS, type MapData } from "@/components/map/types";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { EmptyState, Skeleton, Spinner } from "@/components/ui/States";
import { useMyProfile } from "@/lib/data/profiles";
import { useMatches } from "@/lib/data/swipes";
import { formatMoney } from "@/lib/format";
import { haversine } from "@/lib/geo";
import { mockListings } from "@/lib/listings";
import { googleNearby, googleRoutingProvider, googleUnavailable, type NearbyPlace } from "@/lib/maps/google";
import { bestArea, type AreaResult } from "@/lib/neighbourhood";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

const a = t.area;
const MAX_OTHERS = 3;

export default function AreaPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Area />
    </Suspense>
  );
}

function Area() {
  const params = useSearchParams();
  const [me] = useMyProfile();
  const [matches] = useMatches();

  // Selected roommates: read once from ?avec=id1,id2, then kept in state. The URL is
  // updated with history.replaceState (no router navigation → no Suspense remount).
  const [picked, setPicked] = useState<string[]>(() => (params.get("avec") ?? "").split(",").filter(Boolean));
  const selectedIds = useMemo(() => {
    const valid = picked.filter((id) => matches.some((m) => m.id === id)).slice(0, MAX_OTHERS);
    return valid.length ? valid : matches.slice(0, 1).map((m) => m.id);
  }, [picked, matches]);

  const others = useMemo(
    () => selectedIds.map((id) => matches.find((m) => m.id === id)!.profile),
    [selectedIds, matches],
  );
  const people: Profile[] = useMemo(() => (me ? [me, ...others] : []), [me, others]);

  // Each result is tagged with the roommate set it was computed for; a stale one is ignored.
  const [computed, setComputed] = useState<{ key: string; result: AreaResult } | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[] | "loading" | "error" | "nokey">("loading");
  const peopleKey = people.map((p) => `${p.id}:${p.school}`).join("|");
  const result = computed?.key === peopleKey ? computed.result : null;

  // Steps 1–3: grid → travel times → best fair point (or centroid fallback).
  useEffect(() => {
    if (people.length < 2) return;
    let alive = true;
    setPlaces("loading");
    (async () => {
      const provider = googleUnavailable() ? null : await googleRoutingProvider();
      const r = await bestArea(
        people.map((p) => ({ id: p.id, name: p.firstName, school: p.school })),
        provider,
      );
      if (!alive) return;
      setComputed({ key: peopleKey, result: r });

      // Nearby groceries + bus stops (Google Places API, New). Without a key: a short note.
      if (googleUnavailable()) return void setPlaces("nokey");
      const found = await googleNearby(r.center).catch(() => null);
      if (alive) setPlaces(found ?? (googleUnavailable() ? "nokey" : "error"));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when the roommates change
  }, [peopleKey]);

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : selectedIds.length >= MAX_OTHERS
        ? selectedIds
        : [...selectedIds, id];
    if (!next.length) return; // keep at least one roommate
    setPicked(next);
    window.history.replaceState(null, "", `/quartier?avec=${next.join(",")}`);
  }

  const listings = useMemo(() => (result ? mockListings(result.center, people) : []), [result, people]);

  const mapData: MapData | null = useMemo(() => {
    if (!result) return null;
    const schoolIds = [...new Set(people.map((p) => p.school))];
    return {
      center: result.center,
      radius: result.radius,
      schools: schoolIds.map((id) => ({ id, label: SCHOOLS[id].short, position: SCHOOLS[id] })),
      lines: people.map((p, i) => ({ id: p.id, to: SCHOOLS[p.school], color: PERSON_COLORS[i % PERSON_COLORS.length] })),
      places: Array.isArray(places) ? places : [],
      listings: listings.map((l) => ({ id: l.id, position: l.location, label: `${a.example} · ${l.title}` })),
    };
  }, [result, people, places, listings]);

  if (!me) return null;

  if (!matches.length) {
    return (
      <>
        <PageHeader title={a.short} />
        <EmptyState
          icon={MapPin}
          title={a.title}
          body={a.needMatch}
          action={<ButtonLink href="/decouvrir">{t.matches.cta}</ButtonLink>}
        />
      </>
    );
  }

  // Label for the zone: near a school if within 1.2 km, otherwise "between the schools".
  const nearest = result
    ? Object.values(SCHOOLS)
        .map((s) => ({ s, d: haversine(result.center, s) }))
        .sort((x, y) => x.d - y.d)[0]
    : null;
  const zoneLabel = nearest && nearest.d < 1200 ? a.nearSchool(nearest.s.short) : a.between;

  return (
    <>
      <PageHeader title={a.short} />
      <div className="space-y-5 px-4 pb-10 pt-4">
        <section>
          <h1 className="text-[26px] leading-tight text-navy">{a.title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a.intro}</p>
        </section>

        {/* Roommate picker */}
        <section aria-labelledby="roommates-h">
          <h2 id="roommates-h" className="mb-2 flex items-center gap-2 text-sm font-medium text-navy">
            <Users className="h-4 w-4" aria-hidden />
            {a.roommates} ({people.length}/4)
          </h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <PersonChip profile={me} label={a.you} color={PERSON_COLORS[0]} selected disabled />
            {matches.map((m) => {
              const idx = selectedIds.indexOf(m.id);
              return (
                <PersonChip
                  key={m.id}
                  profile={m.profile}
                  label={m.profile.firstName}
                  color={idx >= 0 ? PERSON_COLORS[(idx + 1) % PERSON_COLORS.length] : undefined}
                  selected={idx >= 0}
                  disabled={idx < 0 && selectedIds.length >= MAX_OTHERS}
                  onClick={() => toggle(m.id)}
                />
              );
            })}
          </div>
          <p className="mt-1 text-[13px] text-ink-2">
            {selectedIds.length >= MAX_OTHERS ? a.tooMany : a.selectHint}
          </p>
        </section>

        {/* Map */}
        <section className="overflow-hidden rounded-[24px] bg-card shadow-soft">
          {/* `isolate` keeps Leaflet's internal z-indexes below the header and sheets. */}
          <div className="relative isolate h-[320px] w-full bg-navy-50">
            {mapData ? (
              <AreaMap data={mapData} label={a.mapLabel} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3" aria-live="polite">
                <Spinner className="h-7 w-7" label={a.computing} />
                <p className="text-sm text-ink-2">{a.computing}</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[12px] text-ink-2">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-white bg-navy shadow" aria-hidden />
              {a.legendSchool}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-orange bg-orange/30" aria-hidden />
              {a.legendZone}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6F9A80]" aria-hidden />
              {a.groceries}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#5B7DB1]" aria-hidden />
              {a.busStops}
            </span>
          </div>
        </section>

        {/* Result */}
        {!result ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <section className="rounded-[24px] bg-card p-5 shadow-soft" aria-live="polite">
            <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">{a.recommended}</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy">{zoneLabel}</p>
            <p className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {result.method === "google" ? a.method.google : a.method.estimate}
                {result.reason ? ` ${a.method.estimateWhy[result.reason]}` : ""}
              </span>
            </p>

            <ul className="mt-4 divide-y divide-line">
              {people.map((p, i) => {
                const c = result.commutes.find((x) => x.personId === p.id);
                if (!c) return null;
                const est = result.method === "estimate";
                return (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <span className="relative h-11 w-11 shrink-0">
                      <span className="block h-full w-full overflow-hidden rounded-full bg-navy-50">
                        {p.photos[0] ? <img src={p.photos[0]} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card"
                        style={{ background: PERSON_COLORS[i % PERSON_COLORS.length] }}
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-navy">{i === 0 ? a.you : p.firstName}</span>
                      <span className="block truncate text-[13px] text-ink-2">{SCHOOLS[p.school].short}</span>
                    </span>
                    <span className="shrink-0 space-y-0.5 text-right text-[13px] text-ink-2">
                      <span className="flex items-center justify-end gap-1.5">
                        <TrainFront className="h-3.5 w-3.5" aria-label={a.transit} />
                        {c.transit != null ? a.min(c.transit) : "—"}
                      </span>
                      <span className="flex items-center justify-end gap-1.5">
                        <Footprints className="h-3.5 w-3.5" aria-label={a.walk} />
                        {c.walk != null ? a.min(c.walk) : "—"}
                      </span>
                    </span>
                    <span className="w-16 shrink-0 text-right">
                      <span className="block font-display text-xl font-bold text-navy">{a.min(c.best)}</span>
                      {est ? <span className="block text-[11px] text-ink-2">{a.estimated}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-navy-50 p-3">
                <p className="text-[12px] text-ink-2">{a.totalLabel}</p>
                <p className="font-display text-lg font-bold text-navy">{a.min(result.total)}</p>
              </div>
              <div className="rounded-2xl bg-navy-50 p-3">
                <p className="text-[12px] text-ink-2">{a.gapLabel}</p>
                <p className="font-display text-lg font-bold text-navy">{a.min(result.gap)}</p>
              </div>
            </div>

            <details className="group mt-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-navy">
                {a.howTitle}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink-2">
                {a.how.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </details>
          </section>
        )}

        {/* Nearby */}
        {result ? <Nearby center={result.center} places={places} /> : null}

        {/* Listings */}
        {result ? (
          <section aria-labelledby="listings-h">
            <div className="mb-3">
              <h2 id="listings-h" className="text-xl text-navy">
                {a.listingsTitle}
              </h2>
              <p className="text-[13px] text-ink-2">{a.listingsNote}</p>
            </div>
            <ul className="space-y-3">
              {listings.map((l) => {
                const over = l.shares.find((s) => s.overBudget);
                return (
                  <li key={l.id} className="rounded-[20px] bg-card p-5 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Tag tone="accent">{a.example}</Tag>
                        </div>
                        <h3 className="mt-2 text-lg leading-tight text-navy">{l.title}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" aria-hidden />
                            {a.bedrooms(l.bedrooms)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                            {a.fromZone(l.distance)}
                          </span>
                        </p>
                        <p className="mt-1 text-[13px] text-ink-2">{l.features.join(" · ")}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[12px] text-ink-2">{a.totalRent}</p>
                        <p className="font-display text-xl font-bold text-navy">{formatMoney(l.totalRent)}</p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-line pt-3">
                      <p className="mb-1.5 text-[12px] text-ink-2">{a.perPerson}</p>
                      <ul className="flex flex-wrap gap-2">
                        {l.shares.map((s, i) => (
                          <li
                            key={s.profileId}
                            className={`rounded-full px-3 py-1 text-[13px] font-medium ${
                              s.overBudget ? "bg-orange-50 text-navy ring-1 ring-orange" : "bg-navy-50 text-navy"
                            }`}
                          >
                            {i === 0 ? a.you : s.name} · {formatMoney(s.amount)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[13px] font-medium text-navy">
                        {over ? a.overBudget(over.profileId === me.id ? a.you.toLowerCase() : over.name) : a.fitsAll}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

function PersonChip({
  profile,
  label,
  color,
  selected,
  disabled,
  onClick,
}: {
  profile: Profile;
  label: string;
  color?: string;
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-sm font-medium transition-colors disabled:opacity-50 ${
        selected ? "border-navy bg-navy text-white" : "border-line bg-card text-navy hover:bg-navy-50"
      } ${onClick ? "" : "cursor-default disabled:opacity-100"}`}
    >
      <span className="relative h-9 w-9 shrink-0">
        <span className="block h-full w-full overflow-hidden rounded-full bg-navy-50">
          {profile.photos[0] ? <img src={profile.photos[0]} alt="" className="h-full w-full object-cover" /> : null}
        </span>
        {color ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
            style={{ background: color }}
            aria-hidden
          />
        ) : null}
      </span>
      {label}
    </button>
  );
}

function Nearby({
  center,
  places,
}: {
  center: { lat: number; lng: number };
  places: NearbyPlace[] | "loading" | "error" | "nokey";
}) {
  return (
    <section className="rounded-[24px] bg-card p-5 shadow-soft" aria-labelledby="nearby-h" aria-busy={places === "loading"}>
      <h2 id="nearby-h" className="text-xl text-navy">
        {a.nearbyTitle}
      </h2>
      {places === "loading" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
          <Spinner className="h-4 w-4" label={a.nearbyLoading} />
          {a.nearbyLoading}
        </p>
      ) : places === "error" || places === "nokey" ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          {places === "nokey" ? a.nearbyNoKey : a.nearbyUnavailable}
        </p>
      ) : (
        <div className="mt-3 grid gap-4">
          {(["grocery", "bus"] as const).map((kind) => {
            const list = places
              .filter((p) => p.kind === kind)
              .map((p) => ({ ...p, d: haversine(center, p.location) }))
              .sort((x, y) => x.d - y.d)
              .filter((p, i, arr) => arr.findIndex((q) => q.name === p.name) === i)
              .slice(0, 4);
            const Icon = kind === "grocery" ? ShoppingBasket : Bus;
            return (
              <div key={kind}>
                <h3 className="mb-1 flex items-center gap-2 font-sans text-sm font-medium text-navy">
                  <Icon className="h-4 w-4" aria-hidden />
                  {kind === "grocery" ? a.groceries : a.busStops}
                </h3>
                {list.length ? (
                  <ul className="divide-y divide-line">
                    {list.map((p) => (
                      <li key={`${p.name}-${p.d}`} className="flex justify-between gap-3 py-2 text-[14px]">
                        <span className="truncate text-navy">{p.name}</span>
                        <span className="shrink-0 text-ink-2">{a.distance(p.d)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-1 text-[13px] text-ink-2">{a.nearbyNone}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
