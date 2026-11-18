export type SchoolId = "uw" | "wlu" | "conestoga-doon" | "conestoga-waterloo";

/** 1–4 = undergraduate / college year, 5 = graduate studies. */
export type StudyYear = 1 | 2 | 3 | 4 | 5;

export type Noise = "quiet" | "music";
export type StudyPlace = "home" | "library";
export type Chronotype = "morning" | "night";
export type ExamMode = "hermit" | "group" | "steady" | "stressed";

export type GuestsFrequency = "rarely" | "sometimes" | "often";
export type Smoking = "no" | "outside" | "yes";
export type Pets = "none" | "has" | "ok" | "allergic";

export interface StudyHabits {
  noise: Noise;
  place: StudyPlace;
  chronotype: Chronotype;
  examMode: ExamMode;
}

export interface Lifestyle {
  /** Usual bedtime, "HH:MM" 24h (e.g. "23:30", "01:00"). */
  bedtime: string;
  /** 1 = relaxed, 5 = spotless. */
  cleanliness: 1 | 2 | 3 | 4 | 5;
  guests: GuestsFrequency;
  smoking: Smoking;
  pets: Pets;
}

export interface Budget {
  /** Monthly rent per person, CAD. */
  min: number;
  max: number;
}

export interface Profile {
  id: string;
  firstName: string;
  age: number;
  program: string;
  year: StudyYear;
  school: SchoolId;
  /** Max 300 characters. */
  bio: string;
  /** 1–4 image URLs (Supabase Storage URLs, or data: URLs in demo mode). */
  photos: string[];
  interests: string[];
  study: StudyHabits;
  lifestyle: Lifestyle;
  budget: Budget;
  /** ISO date "YYYY-MM-DD". */
  moveIn: string;
}

/** Extra fields that only exist on seeded demo profiles. */
export interface DemoProfile extends Profile {
  demo: {
    /** If true, this person has already "liked" the user: a right swipe creates a match. */
    likesYou: boolean;
  };
}
