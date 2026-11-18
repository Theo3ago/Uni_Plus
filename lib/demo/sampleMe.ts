import { demoPhotos } from "../avatar";
import type { Profile } from "../types";

/** One-tap profile for live demos ("Remplir avec un profil exemple"). Fictional. */
export function sampleMe(): Profile {
  return {
    id: "me",
    firstName: "Alex",
    age: 20,
    program: "Sciences de l’environnement",
    year: 2,
    school: "uw",
    bio: "Étudiant·e en 2e année, calme en semaine et partant·e pour un souper partagé le dimanche. Je cherche un appart lumineux près de l’ION.",
    photos: demoPhotos("sample-alex", 2),
    interests: ["Randonnée", "Cuisine", "Café", "Jeux de société", "Vélo"],
    study: { noise: "quiet", place: "library", chronotype: "morning", examMode: "steady" },
    lifestyle: { bedtime: "23:00", cleanliness: 4, guests: "sometimes", smoking: "no", pets: "ok" },
    budget: { min: 700, max: 1050 },
    moveIn: "2027-09-01",
  };
}
