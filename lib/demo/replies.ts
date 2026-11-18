/**
 * Canned replies used in demo mode so a conversation looks alive during the pitch.
 * The first message of a new match uses OPENERS; later messages cycle through REPLIES.
 */
export const DEMO_OPENERS = [
  "Salut ! Content·e qu’on ait matché. Tu cherches pour quand exactement ?",
  "Allô ! J’ai vu qu’on avait des horaires semblables, c’est rare !",
  "Hello ! Ton profil m’a fait rire. Tu cherches dans quel coin ?",
];

export const DEMO_REPLIES = [
  "Ah oui, ça me va totalement !",
  "Bonne question… Je dirais que je suis assez flexible là-dessus.",
  "Moi aussi ! On pourrait regarder des apparts ensemble cette semaine ?",
  "Pour le ménage, je propose une rotation chaque semaine. Ça te va ?",
  "Je suis surtout à la bibliothèque en semaine, donc l’appart reste calme.",
  "On peut faire un appel vidéo ce soir si tu veux, c’est plus simple pour se connaître.",
  "Parfait. Tu veux qu’on regarde la carte Uni+ pour voir le meilleur quartier ?",
  "Haha, exactement ! On a l’air compatibles.",
];

/** Delay before a simulated reply, in ms (looks natural, stays short for a live demo). */
export const DEMO_REPLY_DELAY_MS = { min: 1400, max: 2600 };
