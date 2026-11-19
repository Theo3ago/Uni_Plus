/**
 * « Le meilleur quartier pour vous »
 *
 *  1. Generate a grid of candidate points around the roommates' schools.
 *  2. Get every roommate's travel time (transit and walking) from each candidate to
 *     their school, via a routing provider (Google Maps).
 *  3. Pick the candidate that minimises   total time + FAIRNESS × (longest − shortest)
 *     so nobody ends up with a much longer commute than the others.
 *
 *  If the provider fails (or there is no API key), fall back to the geographic
 *  midpoint (centroid) of the schools with straight-line time estimates.
 */
import { candidateGrid, centroid, estimateMinutes, haversine, type LatLng } from "./geo";
import { SCHOOLS } from "./schools";
import type { SchoolId } from "./types";

export const FAIRNESS = 1.5;
export const ZONE_RADIUS_M = 700;

/** Zone size grows with the spread of the schools (600 m – 1.5 km). */
function zoneRadius(center: LatLng, people: Person[]): number {
  const far = Math.max(...people.map((p) => haversine(center, SCHOOLS[p.school])));
  return Math.round(Math.min(1500, Math.max(600, far * 0.12)));
}

export interface Person {
  id: string;
  name: string;
  school: SchoolId;
}

export interface Commute {
  personId: string;
  transit: number | null; // minutes
  walk: number | null;
  best: number; // min of the two
}

export interface AreaResult {
  center: LatLng;
  radius: number;
  commutes: Commute[];
  total: number;
  gap: number;
  method: "google" | "estimate";
  reason?: "nokey" | "failed";
  candidates: number;
}

/** minutes[origin][destination], null when no route. */
export type Matrix = (number | null)[][];

export interface RoutingProvider {
  matrix(origins: LatLng[], destinations: LatLng[], mode: "transit" | "walk"): Promise<Matrix>;
}

const NO_ROUTE = 240; // a missing route counts as 4 h, so such points are never chosen

function cost(times: number[]) {
  const total = times.reduce((s, t) => s + t, 0);
  const gap = Math.max(...times) - Math.min(...times);
  return { total, gap, score: total + FAIRNESS * gap };
}

export function fallbackArea(people: Person[], reason: AreaResult["reason"]): AreaResult {
  const center = centroid(people.map((p) => SCHOOLS[p.school]));
  const commutes = people.map<Commute>((p) => {
    const e = estimateMinutes(center, SCHOOLS[p.school]);
    return { personId: p.id, transit: e.transit, walk: e.walk, best: Math.min(e.transit, e.walk) };
  });
  const { total, gap } = cost(commutes.map((c) => c.best));
  return { center, radius: zoneRadius(center, people), commutes, total, gap, method: "estimate", reason, candidates: 1 };
}

export async function bestArea(people: Person[], provider: RoutingProvider | null): Promise<AreaResult> {
  if (!provider) return fallbackArea(people, "nokey");

  const schoolIds = [...new Set(people.map((p) => p.school))];
  const destinations = schoolIds.map((id) => SCHOOLS[id]);
  const candidates = candidateGrid(destinations);

  try {
    const [transit, walk] = await Promise.all([
      provider.matrix(candidates, destinations, "transit"),
      provider.matrix(candidates, destinations, "walk"),
    ]);

    let best: { i: number; total: number; gap: number; score: number } | null = null;
    candidates.forEach((_, i) => {
      const times = people.map((p) => {
        const j = schoolIds.indexOf(p.school);
        const t = Math.min(transit[i]?.[j] ?? NO_ROUTE, walk[i]?.[j] ?? NO_ROUTE);
        return t;
      });
      const c = cost(times);
      if (!best || c.score < best.score) best = { i, ...c };
    });
    const winner = best as { i: number; total: number; gap: number } | null;
    if (!winner || winner.total >= NO_ROUTE * people.length) return fallbackArea(people, "failed");

    const commutes = people.map<Commute>((p) => {
      const j = schoolIds.indexOf(p.school);
      const tr = transit[winner.i]?.[j] ?? null;
      const wk = walk[winner.i]?.[j] ?? null;
      return { personId: p.id, transit: tr, walk: wk, best: Math.min(tr ?? NO_ROUTE, wk ?? NO_ROUTE) };
    });
    return {
      center: candidates[winner.i],
      radius: zoneRadius(candidates[winner.i], people),
      commutes,
      total: winner.total,
      gap: winner.gap,
      method: "google",
      candidates: candidates.length,
    };
  } catch {
    return fallbackArea(people, "failed");
  }
}
