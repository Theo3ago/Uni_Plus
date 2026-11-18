import type { SchoolId } from "./types";

export interface School {
  id: SchoolId;
  /** Full French name shown in pickers. */
  name: string;
  /** Short label shown on cards. */
  short: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * The 4 post-secondary campuses of the Kitchener-Waterloo region.
 *
 * Coordinates were verified on 2026-11-18 by geocoding each official street
 * address with OpenStreetMap Nominatim (the Laurier point also agrees with the
 * Sygic listing for 75 University Ave W). Points sit on the main academic
 * buildings, not on a parking lot or the edge of the campus polygon.
 */
export const SCHOOLS: Record<SchoolId, School> = {
  uw: {
    id: "uw",
    name: "Université de Waterloo",
    short: "UWaterloo",
    address: "200 University Ave W, Waterloo, ON N2L 3G1",
    lat: 43.4723,
    lng: -80.5449,
  },
  wlu: {
    id: "wlu",
    name: "Université Wilfrid-Laurier (campus de Waterloo)",
    short: "Laurier",
    address: "75 University Ave W, Waterloo, ON N2L 3C5",
    lat: 43.4728,
    lng: -80.5281,
  },
  "conestoga-doon": {
    id: "conestoga-doon",
    name: "Collège Conestoga, campus Doon (Kitchener)",
    short: "Conestoga Doon",
    address: "299 Doon Valley Dr, Kitchener, ON N2G 4M4",
    lat: 43.3895,
    lng: -80.4081,
  },
  "conestoga-waterloo": {
    id: "conestoga-waterloo",
    name: "Collège Conestoga, campus Waterloo",
    short: "Conestoga Waterloo",
    address: "108 University Ave E, Waterloo, ON N2J 2W2",
    lat: 43.4802,
    lng: -80.5179,
  },
};

export const SCHOOL_IDS = Object.keys(SCHOOLS) as SchoolId[];
