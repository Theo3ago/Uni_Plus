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
