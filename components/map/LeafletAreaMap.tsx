"use client";

/**
 * Key-less map (Leaflet + standard OpenStreetMap tiles, greyed out with a CSS filter
 * so they match the minimal Uni+ look — see `.uniplus-osm` in globals.css).
 * Used in demo mode without a Google key, or when Google fails.
 */
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef } from "react";
import { COLORS, type MapData } from "./types";

export default function LeafletAreaMap({ data, label }: { data: MapData; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      draw();
      setTimeout(() => map.invalidateSize(), 50); // container may have just been laid out
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function draw() {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    const data = dataRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    L.circle([data.center.lat, data.center.lng], {
      radius: data.radius,
      color: COLORS.orange,
      weight: 2,
      fillColor: COLORS.orange,
      fillOpacity: 0.18,
    }).addTo(layer);

    data.lines.forEach((line) =>
      L.polyline(
        [
          [data.center.lat, data.center.lng],
          [line.to.lat, line.to.lng],
        ],
        { color: line.color, weight: 4, opacity: 0.85, dashArray: "8 8" },
      ).addTo(layer),
    );

    data.places.forEach((p) =>
      L.circleMarker([p.location.lat, p.location.lng], {
        radius: 5,
        color: COLORS.white,
        weight: 2,
        fillColor: p.kind === "grocery" ? "#6F9A80" : "#5B7DB1",
        fillOpacity: 1,
      })
        .bindTooltip(p.name)
        .addTo(layer),
    );

    data.listings.forEach((l) =>
      L.circleMarker([l.position.lat, l.position.lng], {
        radius: 6,
        color: COLORS.orange,
        weight: 2,
        fillColor: COLORS.white,
        fillOpacity: 1,
      })
        .bindTooltip(l.label)
        .addTo(layer),
    );

    L.circleMarker([data.center.lat, data.center.lng], {
      radius: 8,
      color: COLORS.white,
      weight: 3,
      fillColor: COLORS.orange,
      fillOpacity: 1,
    }).addTo(layer);

    data.schools.forEach((s) =>
      L.marker([s.position.lat, s.position.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:30px;height:30px;border-radius:9999px;background:${COLORS.navy};border:3px solid #fff;box-shadow:0 2px 8px rgba(19,41,75,.3);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        title: s.label,
        alt: s.label,
      })
        .bindTooltip(s.label, { direction: "top", offset: [0, -14] })
        .addTo(layer),
    );

    const bounds = L.latLngBounds([
      [data.center.lat, data.center.lng],
      ...data.schools.map((s) => [s.position.lat, s.position.lng] as [number, number]),
    ]);
    map.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
  }

  // Redraw when data changes (e.g. nearby places arrive).
  useEffect(() => {
    draw();
  }, [data]);

  return <div ref={el} role="region" aria-label={label} className="uniplus-osm h-full w-full" />;
}
