"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/maps/google";
import { COLORS, type MapData } from "./types";

/** Minimal, desaturated style that matches the Uni+ theme. */
const STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F3F5F9" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3A4A66" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#E3E7EF" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#DCE2EC" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#D6E4F2" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#E7EFE9" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#C9D2E0" }] },
];

const svgIcon = (svg: string, size: number): google.maps.Icon => ({
  url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  scaledSize: new google.maps.Size(size, size),
  anchor: new google.maps.Point(size / 2, size / 2),
});

export default function GoogleAreaMap({
  data,
  label,
  onFail,
}: {
  data: MapData;
  label: string;
  onFail: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlays = useRef<{ setMap(m: google.maps.Map | null): void }[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !el.current) return;
        mapRef.current ??= new google.maps.Map(el.current, {
          styles: STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
        });
        draw();
      })
      .catch(() => !cancelled && onFail());
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function draw() {
    const map = mapRef.current;
    if (!map) return;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    const add = <T extends { setMap(m: google.maps.Map | null): void }>(o: T) => {
      overlays.current.push(o);
      return o;
    };

    add(
      new google.maps.Circle({
        map,
        center: data.center,
        radius: data.radius,
        strokeColor: COLORS.orange,
        strokeWeight: 2,
        fillColor: COLORS.orange,
        fillOpacity: 0.18,
      }),
    );

    data.lines.forEach((line) =>
      add(
        new google.maps.Polyline({
          map,
          path: [data.center, line.to],
          strokeOpacity: 0,
          icons: [
            {
              icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, strokeColor: line.color, strokeWeight: 4, scale: 3 },
              offset: "0",
              repeat: "14px",
            },
          ],
        }),
      ),
    );

    data.places.forEach((p) =>
      add(
        new google.maps.Marker({
          map,
          position: p.location,
          title: p.name,
          icon: svgIcon(
            `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="5" fill="${p.kind === "grocery" ? "#6F9A80" : "#5B7DB1"}" stroke="#fff" stroke-width="2"/></svg>`,
            14,
          ),
        }),
      ),
    );

    data.listings.forEach((l) =>
      add(
        new google.maps.Marker({
          map,
          position: l.position,
          title: l.label,
          icon: svgIcon(
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#fff" stroke="${COLORS.orange}" stroke-width="2.5"/></svg>`,
            16,
          ),
        }),
      ),
    );

    add(
      new google.maps.Marker({
        map,
        position: data.center,
        icon: svgIcon(
          `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8" fill="${COLORS.orange}" stroke="#fff" stroke-width="3"/></svg>`,
          22,
        ),
        zIndex: 5,
      }),
    );

    data.schools.forEach((s) =>
      add(
        new google.maps.Marker({
          map,
          position: s.position,
          title: s.label,
          zIndex: 10,
          icon: svgIcon(
            `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" fill="${COLORS.navy}" stroke="#fff" stroke-width="3"/><g transform="translate(10 10)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6 7 3 0 6l7 3 7-3Z"/><path d="M3 7.5v3c2 2 6 2 8 0v-3"/></g></svg>`,
            34,
          ),
        }),
      ),
    );

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(data.center);
    data.schools.forEach((s) => bounds.extend(s.position));
    map.fitBounds(bounds, 48);
    google.maps.event.addListenerOnce(map, "idle", () => {
      if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
    });
  }

  return <div ref={el} role="region" aria-label={label} className="h-full w-full" />;
}
