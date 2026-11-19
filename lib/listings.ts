/**
 * Mock apartment listings near the recommended zone — clearly labelled as examples.
 * Rent is split between roommates in proportion to each person's budget
 * (midpoint of their range), so whoever can pay more pays a bit more.
 */
import { haversine, offset, type LatLng } from "./geo";
import type { Profile } from "./types";

export interface Listing {
  id: string;
  title: string;
  bedrooms: number;
  totalRent: number;
  location: LatLng;
  distance: number; // metres from the zone centre
  features: string[];
  shares: { profileId: string; name: string; amount: number; overBudget: boolean }[];
}

const TEMPLATES = [
  { title: "Appartement lumineux", factor: 1.0, features: ["Laveuse-sécheuse", "Balcon"], dx: 250, dy: 180 },
  { title: "Maison de ville rénovée", factor: 1.12, features: ["Stationnement", "Cour arrière"], dx: -420, dy: 300 },
  { title: "Condo près de l’ION", factor: 1.2, features: ["Gym", "Meublé"], dx: 120, dy: -380 },
  { title: "Duplex étudiant", factor: 0.88, features: ["Chauffage inclus", "Sous-sol"], dx: -300, dy: -220 },
];

const round25 = (n: number) => Math.round(n / 25) * 25;

export function mockListings(center: LatLng, people: Profile[]): Listing[] {
  const n = people.length;
  const mids = people.map((p) => (p.budget.min + p.budget.max) / 2);
  const avgMid = mids.reduce((s, m) => s + m, 0) / n;
  const weightSum = mids.reduce((s, m) => s + m, 0);

  return TEMPLATES.map((tpl, i) => {
    const totalRent = round25(avgMid * n * tpl.factor);
    const location = offset(center, tpl.dx, tpl.dy);
    // Proportional split, then fix rounding so shares add up exactly.
    const raw = people.map((p, k) => round25((totalRent * mids[k]) / weightSum));
    raw[0] += totalRent - raw.reduce((s, a) => s + a, 0);
    return {
      id: `listing-${i}`,
      title: tpl.title,
      bedrooms: n,
      totalRent,
      location,
      distance: haversine(center, location),
      features: tpl.features,
      shares: people.map((p, k) => ({
        profileId: p.id,
        name: p.firstName,
        amount: raw[k],
        overBudget: raw[k] > p.budget.max,
      })),
    };
  }).sort((a, b) => a.totalRent - b.totalRent);
}
