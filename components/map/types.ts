import type { LatLng } from "@/lib/geo";
import type { NearbyPlace } from "@/lib/maps/google";

export interface MapData {
  schools: { id: string; label: string; position: LatLng }[];
  center: LatLng;
  radius: number;
  lines: { id: string; to: LatLng; color: string }[];
  places: NearbyPlace[];
  listings: { id: string; position: LatLng; label: string }[];
}

export const COLORS = {
  navy: "#13294B",
  orange: "#E8772E",
  white: "#FFFFFF",
  ink2: "#3A4A66",
};

/** One colour per roommate's commute line. */
export const PERSON_COLORS = ["#E8772E", "#13294B", "#5B7DB1", "#6F9A80"];
