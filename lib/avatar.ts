/**
 * Illustrated avatars for the fictional demo profiles.
 * Flat shapes only (no gradients, no faces of real people), returned as SVG data URLs
 * so they work offline and need no image hosting.
 */

const BACKGROUNDS = ["#DCE4F2", "#FBE4D3", "#E3EFE7", "#ECE6F4", "#F4EEDD", "#DDEFF2"];
const SKIN = ["#F3D6C1", "#E6BC9C", "#C99470", "#A0704F", "#704A33"];
const HAIR = ["#2B1E16", "#4A3426", "#8A5A3B", "#C99A5B", "#1B1B1F", "#A8463A"];
const SHIRT = ["#13294B", "#E8772E", "#5B7DB1", "#6F9A80", "#3A4A66", "#C9963A"];

export type HairStyle = "short" | "long" | "bun" | "curly" | "buzz";
const HAIR_STYLES: HairStyle[] = ["short", "long", "bun", "curly", "buzz"];

export interface AvatarLook {
  bg: number;
  skin: number;
  hair: number;
  shirt: number;
  style: HairStyle;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic look from a seed (e.g. the profile id). */
export function lookFromSeed(seed: string): AvatarLook {
  const h = hash(seed);
  return {
    bg: h % BACKGROUNDS.length,
    skin: (h >>> 3) % SKIN.length,
    hair: (h >>> 7) % HAIR.length,
    shirt: (h >>> 11) % SHIRT.length,
    style: HAIR_STYLES[(h >>> 15) % HAIR_STYLES.length],
  };
}

function hairBack(style: HairStyle, color: string): string {
  if (style === "long") return `<rect x="86" y="112" width="128" height="170" rx="62" fill="${color}"/>`;
  return "";
}

function hairFront(style: HairStyle, color: string): string {
  switch (style) {
    case "buzz":
      return `<path d="M100 158 C100 120 122 106 150 106 C178 106 200 120 200 158 C188 140 170 134 150 134 C130 134 112 140 100 158 Z" fill="${color}" opacity="0.85"/>`;
    case "bun":
      return (
        `<circle cx="150" cy="92" r="26" fill="${color}"/>` +
        `<path d="M97 162 C95 118 120 102 150 102 C180 102 205 118 203 162 C190 138 172 128 150 128 C128 128 110 138 97 162 Z" fill="${color}"/>`
      );
    case "curly": {
      const pts = [
        [104, 150], [108, 126], [122, 108], [142, 100], [162, 100], [182, 108], [196, 126], [200, 150],
      ];
      return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="${color}"/>`).join("");
    }
    case "long":
    case "short":
    default:
      return `<path d="M96 166 C92 116 120 98 150 98 C182 98 208 116 204 166 C196 140 176 126 150 126 C126 126 106 140 96 166 Z" fill="${color}"/>`;
  }
}

/**
 * variant 0: portrait · 1: alternate background with a large flat circle · 2: close-up.
 * Gives each demo profile a small "photo carousel".
 */
export function avatarSvg(look: AvatarLook, variant = 0): string {
  const bgIndex = (look.bg + variant * 2) % BACKGROUNDS.length;
  const bg = BACKGROUNDS[bgIndex];
  const skin = SKIN[look.skin];
  const hair = HAIR[look.hair];
  const shirt = SHIRT[look.shirt];

  const deco =
    variant === 1
      ? `<circle cx="236" cy="84" r="90" fill="#FFFFFF" opacity="0.55"/><circle cx="52" cy="330" r="46" fill="#FFFFFF" opacity="0.4"/>`
      : variant === 2
        ? `<rect x="24" y="24" width="252" height="352" rx="28" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.6"/>`
        : "";

  const figure =
    `<g transform="translate(0 14)">${hairBack(look.style, hair)}</g>` +
    `<rect x="128" y="196" width="44" height="84" rx="18" fill="${skin}"/>` +
    `<path d="M44 400 C44 306 88 264 150 264 C212 264 256 306 256 400 Z" fill="${shirt}"/>` +
    `<path d="M128 264 L150 294 L172 264 Z" fill="${skin}"/>` +
    `<g transform="translate(0 14)"><ellipse cx="150" cy="160" rx="52" ry="58" fill="${skin}"/>` +
    hairFront(look.style, hair) +
    `</g>`;

  const transform = variant === 2 ? ` transform="translate(-60 -40) scale(1.4)"` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">` +
    `<rect width="300" height="400" fill="${bg}"/>` +
    deco +
    `<g${transform}>${figure}</g>` +
    `</svg>`
  );
}

export const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** A set of 1–3 illustrated "photos" for a seeded profile. */
export function demoPhotos(seed: string, count = 3): string[] {
  const look = lookFromSeed(seed);
  return Array.from({ length: count }, (_, i) => svgToDataUrl(avatarSvg(look, i)));
}
