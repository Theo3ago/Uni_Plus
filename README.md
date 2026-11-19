# Uni+

> « Ne vivez plus jamais avec le mauvais coloc. »

Uni+ is a "Tinder for roommates" prototype for post-secondary students in Kitchener-Waterloo
(UWaterloo, Laurier, Conestoga Doon, Conestoga Waterloo). Built for the French-class pitch
*Dans l'œil du dragon*. The interface is in Canadian French.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Google Maps · Jitsi Meet · framer-motion · lucide-react.

---

## 1. Run it locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # optional: demo mode works with an empty file
npm run dev
```

Open http://localhost:3000. On a laptop the app is shown as a centred phone-width column;
use your browser's device toolbar at 390 px to see the phone layout.

## 2. Demo mode (default)

`NEXT_PUBLIC_DEMO_MODE=true` (or simply leaving it unset) runs the whole app with **no backend**:

- 20 fictional, illustrated profiles across the 4 schools (`lib/demo/profiles.ts`)
- everything you do is saved in the browser's `localStorage`
- no requests are made to Supabase

To use the real backend, set `NEXT_PUBLIC_DEMO_MODE=false` **and** fill in the Supabase keys.
If the Supabase keys are missing, demo mode stays on automatically so the presentation can't break.

### Demo tips for the presentation

- **Onboarding shortcut:** on the first onboarding screen, « Remplir avec un profil exemple » creates a complete profile in one tap.
- **Start over:** Profil → « Réinitialiser la démo » wipes everything stored in the browser and returns to onboarding.
- Onboarding progress is saved after every change, so refreshing the page never loses answers.
- Photos are compressed in the browser (max 900 px, JPEG) before being saved, so 4 photos fit easily in `localStorage`.

- **Matches:** 11 of the 20 demo profiles have already "liked" you, so a right swipe on them shows « C'est un match ! ». Profiles are sorted by compatibility, so the best matches come first.
- **Laptop controls:** ← passes, → likes (or click ✕ / ✓). Click a card to see the full profile.
- **Swipe limit:** 12 free swipes per day, reset at midnight (America/Toronto). When they run out, the paywall opens.
- **Fake checkout:** the test card `4242 4242 4242 4242` is prefilled. It is a simulation only: no payment provider, no network request, and the card values are never stored, sent or logged (see the header comment in `app/paiement/page.tsx`). Only the resulting swipe credits are saved.
- When the deck is empty, « Revoir les profils passés » brings back the profiles you passed on.

- **Chat:** a new match sends a first message about 2.5 s after « C'est un match ! ». When you write, they "read" it (✓✓ Lu), type, then reply within ~2–3 s. Replies react to keywords (budget, date, quartier, vidéo, ménage, s'engager…) using that profile's real data; otherwise they cycle through friendly canned answers (`lib/demo/replies.ts`).
- **Unread badges** appear on the Messages tab and in the conversation list.

### Video calls (Jitsi Meet)

The video button in a chat opens `/appel/<match-id>`: a pre-call screen asks for camera and microphone permission,
then embeds the Jitsi room in the app. The room name is derived from the match ID (in demo mode it is mixed with a
random per-device value so strangers using the demo never land in the same public room).

**For the live demo with a second device:** the pre-call screen shows a **QR code** and a « Copier le lien » button.
Scan it with a second phone (or open the link on another computer) to join the same room.

Things to know about the free public server `meet.jit.si`:

- **The first participant must log in** (Google, GitHub…) for the meeting to start. Others then join without an account.
  Do this once before the pitch, ideally from the second device via the QR link, so the room is already running.
- Jitsi no longer supports embedding meet.jit.si in other sites, and **embedded calls may be cut after about 5 minutes**.
  The « Nouvel onglet » link at the top of the call opens the same room directly on meet.jit.si, without that limit.
- For production, set `NEXT_PUBLIC_JITSI_DOMAIN` to your own Jitsi server, or use Jitsi as a Service (JaaS, domain `8x8.vc`, free tier).
- Camera access requires https (Vercel is https; `localhost` also works).

### Map: « Le meilleur quartier pour vous » (`/quartier`)

Open it from a chat (map button in the header) or from a match's profile (« Meilleur quartier »).
Pick 1 to 3 matches (2–4 roommates including you).

1. A 5 × 5 grid of candidate points is placed around the roommates' schools (`lib/geo.ts`).
2. Google computes each roommate's travel time from every candidate to their school, by transit (weekday 8:30)
   and on foot (`lib/maps/google.ts`). It uses the new **Routes API** (`RouteMatrix`) and falls back to the
   legacy **Distance Matrix** service if that is what your key has enabled.
3. The winner minimises `total time + 1.5 × (longest − shortest)`, the fairness penalty (`lib/neighbourhood.ts`).

**Without a key, or if Google fails**, the app uses the midpoint (centroid) of the schools with straight-line
estimates (clearly labelled « Estimation »), and draws the map with OpenStreetMap tiles via Leaflet instead of
Google Maps. Nothing shows an error. Nearby groceries and bus stops need the Google **Places API (New)**; without a
key that section shows a short note instead. The listings are always fictional and labelled « Exemple ».

### Commitment, roommate agreement and shared expenses

- **« S'engager »:** a banner under the chat header. One roommate sends the request and the other must accept.
  In demo mode the match accepts after ~2.5 s. If *you* suggest it in the chat (« on se lance comme colocs ? »,
  « on s'engage ? »), the match replies and sends you a request to accept instead.
- **Entente de colocation** (`/entente/<id>`): 11 short steps that save automatically: rent split (equal or custom %),
  utilities and internet, weekly chore rotation table, quiet hours, guests, cleanliness, groceries, pets/smoking,
  conflict-resolution steps, move-in date and lease length, then review and sign. Defaults come from both
  profiles (for example, quiet hours start at the earliest bedtime, and pets are set to « Non » if someone is allergic).
- **Signing:** each roommate types their full name (first and last) and ticks the consent box. A timestamp is saved.
  In demo mode the match signs ~2.5 s after you. Editing a signed agreement clears the signatures (with a warning).
- **Final document** (`/entente/<id>/document`): clean printable view with the Uni+ logo, « Imprimer », and
  « Télécharger en PDF » (generated in the browser with jsPDF, as real selectable text). Every page states that the
  agreement is **not a legal lease**.
- **Dépenses partagées** (`/depenses/<id>`): add an expense (who paid, split between whom). Uni+ shows who owes whom
  using the fewest transfers, and « Marquer comme réglé » records the reimbursement.
- Committed pairs appear under « Mes colocations » at the top of the Matchs tab.

## Google Maps API key (optional)

The app works without a key (see above). With one, you get real travel times, the Google basemap and nearby places.

1. Go to https://console.cloud.google.com, create a project, and attach a billing account
   (Google requires one even though there is a free monthly usage tier; set a budget alert under **Billing → Budgets & alerts**).
2. **APIs & Services → Library**, enable:
   - **Maps JavaScript API**
   - **Places API (New)**
   - **Routes API**
   - *(optional)* **Distance Matrix API**: only needed if Routes API is unavailable on your project.
3. **APIs & Services → Credentials → Create credentials → API key.**
4. Click the key → **Edit** and restrict it (important: a browser key is visible to anyone who opens the site):
   - **Application restrictions → Websites**, add:
     - `https://<your-app>.vercel.app/*`
     - `https://<your-app>-*.vercel.app/*` (Vercel preview deployments, optional)
     - `http://localhost:3000/*` (local development)
   - **API restrictions → Restrict key**, tick only the APIs from step 2.
5. Put the key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (`.env.local` locally, and Vercel → Settings → Environment Variables), then redeploy.

If the key is invalid or not allowed on the current domain, Google reports an auth failure and the app switches
automatically to the key-less map and estimates.

### Compatibility score

`lib/compat.ts` uses a simple weighted formula (each factor 0–1):

| Factor | Weight |
|---|---|
| Budget overlap | 25 % |
| Sleep schedule (bedtime gap + early bird / night owl) | 20 % |
| Cleanliness | 15 % |
| Study habits (noise, place, exam season) | 15 % |
| Shared interests (3 shared = full marks) | 15 % |
| Guests frequency | 10 % |

Deal-breakers (smoker vs non-smoker, pet vs allergy) multiply the score by 0.8 each.
The strongest factors become the "top 3 reasons" shown on the full profile.

## 3. Editing text

Every UI string lives in [`lib/strings.ts`](lib/strings.ts). Colours, fonts, radii and shadows live in
[`app/globals.css`](app/globals.css) (`@theme` block).

## 4. Supabase setup (only for non-demo mode)

1. Create a project at https://supabase.com.
2. **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql), **Run**.
   This creates the tables, Row Level Security policies, the mutual-like → match trigger,
   Realtime on `messages`, and the public `photos` storage bucket.
3. **Project Settings → API**: copy the *Project URL* and *anon public* key into
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Authentication → URL Configuration**: set *Site URL* to your Vercel URL and add
   both `https://<your-app>.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`
   to *Redirect URLs* (the email magic link lands there).
5. **Authentication → Providers → Email**: keep *Email* enabled (magic link is the default).
   Supabase's built-in email sender is rate-limited (a few emails per hour); for real use, add
   your own SMTP under **Authentication → Emails → SMTP Settings**.

Sign-in flow: `/connexion` sends the magic link → `/auth/callback` finishes sign-in →
`/bienvenue` (onboarding) if the user has no profile yet, otherwise `/decouvrir`.
Profile photos are uploaded to the `photos` bucket under `<user-id>/…` when the profile is saved.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On https://vercel.com → **Add New → Project** → import the repository (framework: Next.js, defaults are fine).
3. **Settings → Environment Variables**: add the variables from `.env.example`
   (at minimum `NEXT_PUBLIC_DEMO_MODE=true`).
4. Deploy. After changing an environment variable, redeploy so it takes effect
   (`NEXT_PUBLIC_*` values are baked in at build time).

---

*Sections on the Google Maps key, video calls and the remaining features are added as each build step lands.*
