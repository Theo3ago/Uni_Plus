/**
 * Every user-facing string in Uni+ (Canadian French).
 * Edit here to change wording anywhere in the app.
 */
import type {
  Chronotype,
  ExamMode,
  GuestsFrequency,
  Noise,
  Pets,
  Smoking,
  StudyPlace,
  StudyYear,
} from "./types";

export const t = {
  app: {
    name: "Uni+",
    tagline: "Le colocataire idéal, pour les étudiants de Kitchener-Waterloo.",
    slogan: "Ne vivez plus jamais avec le mauvais coloc.",
    demoBadge: "Mode démo",
  },

  common: {
    loading: "Chargement…",
    back: "Retour",
    next: "Suivant",
    continue: "Continuer",
    save: "Enregistrer",
    cancel: "Annuler",
    close: "Fermer",
    retry: "Réessayer",
    comingSoon: "Bientôt disponible",
    years: "ans",
  },

  splash: {
    start: "Commencer",
    haveAccount: "J’ai déjà un compte",
    schoolsLine: "UWaterloo · Laurier · Conestoga",
  },

  tabs: {
    discover: "Découvrir",
    matches: "Matchs",
    messages: "Messages",
    profile: "Profil",
    label: "Navigation principale",
  },

  discover: {
    title: "Découvrir",
    emptyTitle: "Plus personne pour l’instant",
    emptyBody: "Revenez plus tard ou élargissez vos filtres.",
    budget: "Budget",
    moveIn: "Emménagement",
    compatibility: "compatible",
  },

  matches: {
    title: "Matchs",
    emptyTitle: "Aucun match pour l’instant",
    emptyBody: "Glissez vers la droite sur les profils qui vous plaisent. Quand c’est réciproque, ils apparaissent ici.",
    cta: "Découvrir des profils",
  },

  messages: {
    title: "Messages",
    emptyTitle: "Aucune conversation",
    emptyBody: "Dès que vous avez un match, vous pouvez lui écrire ici.",
  },

  profile: {
    title: "Profil",
    emptyTitle: "Créez votre profil",
    emptyBody: "Quelques questions rapides pour trouver des colocs qui vous ressemblent.",
    cta: "Créer mon profil",
  },

  card: {
    prevPhoto: "Photo précédente",
    nextPhoto: "Photo suivante",
    photoAlt: (name: string, i: number, n: number) => `Photo ${i} sur ${n} de ${name}`,
    photoOf: (i: number, n: number) => `Photo ${i} sur ${n}`,
  },

  labels: {
    year: {
      1: "1re année",
      2: "2e année",
      3: "3e année",
      4: "4e année",
      5: "Cycles supérieurs",
    } satisfies Record<StudyYear, string>,
    noise: { quiet: "Silence", music: "Avec musique" } satisfies Record<Noise, string>,
    place: { home: "À la maison", library: "À la bibliothèque" } satisfies Record<StudyPlace, string>,
    chronotype: { morning: "Lève-tôt", night: "Oiseau de nuit" } satisfies Record<Chronotype, string>,
    examMode: {
      hermit: "Ermite en période d’examens",
      group: "Étude en groupe",
      steady: "Rythme habituel",
      stressed: "Stress maximal",
    } satisfies Record<ExamMode, string>,
    guests: {
      rarely: "Rarement",
      sometimes: "Parfois",
      often: "Souvent",
    } satisfies Record<GuestsFrequency, string>,
    smoking: {
      no: "Non-fumeur",
      outside: "Fume à l’extérieur",
      yes: "Fumeur",
    } satisfies Record<Smoking, string>,
    pets: {
      none: "Pas d’animal",
      has: "A un animal",
      ok: "Animaux bienvenus",
      allergic: "Allergique aux animaux",
    } satisfies Record<Pets, string>,
    cleanliness: ["", "Décontracté", "Plutôt relax", "Équilibré", "Soigné", "Impeccable"],
  },

  /** Suggested interest chips (users can add their own). */
  interests: [
    "Randonnée",
    "Cuisine",
    "Pâtisserie",
    "Jeux vidéo",
    "Jeux de société",
    "Musique",
    "Guitare",
    "Cinéma",
    "Séries",
    "Lecture",
    "Gym",
    "Course à pied",
    "Yoga",
    "Escalade",
    "Vélo",
    "Hockey",
    "Soccer",
    "Basketball",
    "Natation",
    "Photographie",
    "Voyage",
    "Art",
    "Danse",
    "Théâtre",
    "Café",
    "Plein air",
    "Bénévolat",
    "Technologie",
    "Mode",
    "Anime",
    "Podcasts",
    "Plantes",
  ],
} as const;

export type Strings = typeof t;
