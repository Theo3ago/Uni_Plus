export interface LatLng {
  lat: number;
  lng: number;
}

const R = 6371000; // Earth radius, metres
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function centroid(points: LatLng[]): LatLng {
  const n = points.length;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / n,
    lng: points.reduce((s, p) => s + p.lng, 0) / n,
  };
}

/** Moves a point by metres east/north (good enough at city scale). */
export function offset(p: LatLng, eastM: number, northM: number): LatLng {
  return {
    lat: p.lat + northM / 111_320,
    lng: p.lng + eastM / (111_320 * Math.cos(rad(p.lat))),
  };
}

/**
 * Step 1: an n×n grid of candidate points covering the schools' bounding box,
 * padded so the best area can also sit slightly outside it. When every school is
 * the same, the grid is a ~5 km square around it.
 */
export function candidateGrid(points: LatLng[], n = 5): LatLng[] {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const c = centroid(points);
  const minSpanLat = 2500 / 111_320; // at least ±2.5 km
  const minSpanLng = 2500 / (111_320 * Math.cos(rad(c.lat)));
  const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.15, minSpanLat * 0.3);
  const padLng = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 0.15, minSpanLng * 0.3);
  const south = Math.min(Math.min(...lats) - padLat, c.lat - minSpanLat);
  const north = Math.max(Math.max(...lats) + padLat, c.lat + minSpanLat);
  const west = Math.min(Math.min(...lngs) - padLng, c.lng - minSpanLng);
  const east = Math.max(Math.max(...lngs) + padLng, c.lng + minSpanLng);
  const grid: LatLng[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      grid.push({ lat: south + ((north - south) * i) / (n - 1), lng: west + ((east - west) * j) / (n - 1) });
  return grid;
}

/** Straight-line estimates used when no routing service is available. */
export function estimateMinutes(a: LatLng, b: LatLng): { walk: number; transit: number } {
  const km = haversine(a, b) / 1000;
  return {
    walk: Math.max(1, Math.round(((km * 1.3) / 4.8) * 60)), // 30 % detour, 4.8 km/h
    transit: Math.max(5, Math.round(8 + ((km * 1.35) / 20) * 60)), // 8 min waiting + 20 km/h average
  };
}
