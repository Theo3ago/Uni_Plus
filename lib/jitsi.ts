"use client";

import { DEMO_MODE, JITSI_DOMAIN } from "./config";
import { readStored, writeStored } from "./storage";

function hash36(s: string): string {
  // Two 32-bit FNV-1a passes → ~13 base-36 characters.
  let a = 2166136261;
  let b = 2166136261 ^ 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    a = Math.imul(a ^ s.charCodeAt(i), 16777619);
    b = Math.imul(b ^ s.charCodeAt(s.length - 1 - i), 16777619);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

/**
 * Jitsi room name derived from the match ID.
 * Supabase match IDs are random UUIDs, so they are already private. Demo match IDs are
 * predictable ("match-demo-maya"), so demo rooms also mix in a random per-device salt —
 * otherwise every demo user in the world would share the same public room.
 */
export function roomNameFor(matchId: string): string {
  if (!DEMO_MODE) return `UniPlus-${matchId.replace(/-/g, "")}`;
  let salt = readStored<string>("device-salt", "");
  if (!salt) {
    salt = crypto.getRandomValues(new Uint32Array(2)).join("");
    writeStored("device-salt", salt);
  }
  return `UniPlus-${hash36(`${matchId}:${salt}`)}`;
}

/** Plain room link (for a second device / new tab). */
export const roomLink = (room: string) => `https://${JITSI_DOMAIN}/${encodeURIComponent(room)}`;

/** Embed URL: skips the pre-join screen, sets the display name, no "open the app" prompt on mobile. */
export function embedUrl(room: string, displayName: string): string {
  const params = [
    "config.prejoinConfig.enabled=false",
    "config.disableDeepLinking=true",
    "config.startWithAudioMuted=false",
    "config.startWithVideoMuted=false",
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}`,
    `config.defaultLanguage=${encodeURIComponent('"fr"')}`,
  ];
  return `${roomLink(room)}#${params.join("&")}`;
}
