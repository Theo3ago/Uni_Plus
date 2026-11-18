import { t } from "./strings";

export type PackId = "small" | "medium" | "premium";

export interface Pack {
  id: PackId;
  name: string;
  detail: string;
  /** CAD, taxes not handled (prototype). */
  price: number;
  swipes?: number;
  premium?: boolean;
  popular?: boolean;
}

export const PACKS: Pack[] = [
  { id: "small", ...t.packs.small, price: 1.99, swipes: 10 },
  { id: "medium", ...t.packs.medium, price: 3.99, swipes: 25, popular: true },
  { id: "premium", name: t.packs.premium.name, detail: t.packs.premium.detail, price: 4.99, premium: true },
];

export const getPack = (id: string | null) => PACKS.find((p) => p.id === id) ?? null;
