/**
 * Simulated replies for demo mode, so a conversation looks alive during the pitch.
 * A few keyword rules make answers feel relevant; otherwise replies cycle through a list.
 */
import { formatBudget, formatMonth } from "../format";
import { SCHOOLS } from "../schools";
import type { Profile } from "../types";

export const DEMO_OPENERS = [
  "Salut ! Super qu’on ait matché. Tu cherches pour quand exactement ?",
  "Allô ! J’ai vu qu’on avait des horaires semblables, c’est rare !",
  "Hello ! Ton profil m’a fait sourire. Tu cherches dans quel coin de KW ?",
];

export const DEMO_REPLIES = [
  "Ah oui, ça me va totalement !",
  "Bonne question… Je dirais que je suis assez flexible là-dessus.",
  "Moi aussi ! On pourrait visiter des apparts ensemble cette semaine ?",
  "Pour le ménage, je propose une rotation chaque semaine. Ça te va ?",
  "En semaine je suis surtout en cours, donc l’appart reste calme.",
  "Parfait. Tu veux qu’on regarde la carte Uni+ pour trouver le meilleur quartier ?",
  "Haha, exactement ! On a l’air compatibles.",
];

/** Delay before a simulated reply, in ms (natural, but short for a live demo). */
export const DEMO_REPLY_DELAY_MS = { min: 1600, max: 2800 };
/** Delay before a new match sends its first message. */
export const DEMO_OPENER_DELAY_MS = 2500;

const RULES: { test: RegExp; reply: (p: Profile) => string }[] = [
  {
    test: /vid[ée]o|appel|facetime|call/i,
    reply: () => "Oui, bonne idée ! Appuie sur le bouton vidéo en haut, je te rejoins.",
  },
  {
    test: /budget|loyer|prix|\$|\bcher\b/i,
    reply: (p) => `Mon budget, c’est ${formatBudget(p.budget.min, p.budget.max)} par mois. Et toi ?`,
  },
  {
    test: /quand|\bdate|emm[ée]nag|septembre|janvier|\bmai\b/i,
    reply: (p) => `J’aimerais emménager en ${formatMonth(p.moveIn)}. Ça marche pour toi ?`,
  },
  {
    test: /quartier|(^|\s)où(\s|\?|$)|\bcarte\b|uptown|campus|\bbus\b|\bion\b/i,
    reply: (p) =>
      `Je suis à ${SCHOOLS[p.school].short}, donc idéalement pas trop loin. Tu as vu la carte « Le meilleur quartier » ?`,
  },
  {
    test: /m[ée]nage|propre|t[âa]ches|vaisselle/i,
    reply: (p) =>
      `Je dirais ${p.lifestyle.cleanliness}/5 pour la propreté. Un tableau des tâches, ça me va très bien !`,
  },
  {
    test: /s[’']engager|coloc ensemble|on se lance|entente/i,
    reply: () => "Oui ! Je pense qu’on ferait de bons colocs. On s’engage ?",
  },
  {
    test: /^(salut|bonjour|allo|allô|hello|hey|coucou)\b/i,
    reply: (p) => `Salut ! Moi c’est ${p.firstName}. Ça fait plaisir de te parler !`,
  },
];

/** Pick a reply to `text` from `profile`. `n` = how many replies they already sent. */
export function demoReply(profile: Profile, text: string, n: number): string {
  const rule = RULES.find((r) => r.test.test(text.trim()));
  return rule ? rule.reply(profile) : DEMO_REPLIES[n % DEMO_REPLIES.length];
}

export function demoOpener(profile: Profile): string {
  let h = 0;
  for (const ch of profile.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DEMO_OPENERS[h % DEMO_OPENERS.length];
}
