"use client";

/**
 * Google Maps JavaScript API helpers.
 * Every function fails soft (throws/rejects) so callers can fall back to the
 * key-less map and the centroid estimate — the demo must never show an error.
 */
import { GOOGLE_MAPS_API_KEY, HAS_MAPS_KEY } from "../config";
import type { LatLng } from "../geo";
import type { Matrix, RoutingProvider } from "../neighbourhood";

declare global {
  interface Window {
    __uniplusMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

let loading: Promise<typeof google> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

/** Called by Google when the key is invalid or not allowed on this domain. */
export function onGoogleAuthFailure(fn: () => void) {
  authListeners.add(fn);
  return () => {
    authListeners.delete(fn);
  };
}

export const googleUnavailable = () => !HAS_MAPS_KEY || authFailed;

export function loadGoogleMaps(timeoutMs = 10_000): Promise<typeof google> {
  if (googleUnavailable()) return Promise.reject(new Error("no-key"));
  if (typeof window !== "undefined" && typeof window.google?.maps?.importLibrary === "function")
    return Promise.resolve(window.google);
  loading ??= new Promise<typeof google>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    window.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((fn) => fn());
    };
    window.__uniplusMapsReady = () => {
      clearTimeout(timer);
      resolve(window.google);
    };
    const s = document.createElement("script");
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
      `&v=weekly&loading=async&language=fr&region=CA&callback=__uniplusMapsReady`;
    s.async = true;
    s.onerror = () => {
      clearTimeout(timer);
      reject(new Error("script"));
    };
    document.head.appendChild(s);
  }).catch((e) => {
    loading = null; // allow a retry later
    throw e;
  });
  return loading;
}

/** Next weekday at 8:30 (local time) — a realistic "going to class" departure for transit. */
export function nextWeekdayMorning(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(8, 30, 0, 0);
  return d;
}

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

/** New Routes API (RouteMatrix class). */
async function routeMatrix(origins: LatLng[], destinations: LatLng[], mode: "transit" | "walk"): Promise<Matrix> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RouteMatrix typings lag behind the API
  const routes = (await google.maps.importLibrary("routes")) as any;
  if (!routes.RouteMatrix) throw new Error("no RouteMatrix");
  const { matrix } = await routes.RouteMatrix.computeRouteMatrix({
    origins,
    destinations,
    travelMode: mode === "transit" ? "TRANSIT" : "WALKING",
    ...(mode === "transit" ? { departureTime: nextWeekdayMorning() } : {}),
    fields: ["durationMillis", "condition"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return matrix.rows.map((row: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row.items.map((item: any) =>
      item?.durationMillis != null && item.condition !== "ROUTE_NOT_FOUND"
        ? Math.round(item.durationMillis / 60000)
        : null,
    ),
  );
}

/** Legacy Distance Matrix service (still works on keys that have it enabled). */
async function legacyMatrix(origins: LatLng[], destinations: LatLng[], mode: "transit" | "walk"): Promise<Matrix> {
  const svc = new google.maps.DistanceMatrixService();
  const res = await svc.getDistanceMatrix({
    origins,
    destinations,
    travelMode: mode === "transit" ? google.maps.TravelMode.TRANSIT : google.maps.TravelMode.WALKING,
    ...(mode === "transit" ? { transitOptions: { departureTime: nextWeekdayMorning() } } : {}),
  });
  return res.rows.map((row) =>
    row.elements.map((el) => (el.status === "OK" ? Math.round(el.duration.value / 60) : null)),
  );
}

/** Routing provider for `bestArea`: tries the new API, then the legacy one. */
export async function googleRoutingProvider(): Promise<RoutingProvider | null> {
  try {
    await loadGoogleMaps();
  } catch {
    return null;
  }
  return {
    async matrix(origins, destinations, mode) {
      try {
        return await withTimeout(routeMatrix(origins, destinations, mode), 12_000);
      } catch {
        return await withTimeout(legacyMatrix(origins, destinations, mode), 12_000);
      }
    },
  };
}

export interface NearbyPlace {
  name: string;
  location: LatLng;
  kind: "grocery" | "bus";
}

/** Places API (New): nearby groceries and transit stops. */
export async function googleNearby(center: LatLng): Promise<NearbyPlace[]> {
  await loadGoogleMaps();
  const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
  const search = async (types: string[], kind: NearbyPlace["kind"], radius: number) => {
    const { places } = await Place.searchNearby({
      fields: ["displayName", "location"],
      locationRestriction: { center, radius },
      includedPrimaryTypes: types,
      maxResultCount: 6,
      rankPreference: google.maps.places.SearchNearbyRankPreference.DISTANCE,
      language: "fr",
    });
    return places
      .filter((p) => p.location && p.displayName)
      .map<NearbyPlace>((p) => ({ name: p.displayName!, location: p.location!.toJSON(), kind }));
  };
  const [groceries, stops] = await Promise.all([
    search(["supermarket", "grocery_store"], "grocery", 1200),
    search(["bus_stop", "transit_station", "light_rail_station"], "bus", 700),
  ]);
  return [...groceries, ...stops];
}
