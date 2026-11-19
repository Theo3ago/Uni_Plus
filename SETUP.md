# Putting Uni+ online for your class

This guide takes Uni+ from your laptop to a real website your classmates can use on their own phones:
real accounts, their own photos, real matches between classmates, live chat, video calls,
the neighbourhood map, roommate agreements and shared expenses.

**Time needed:** about 45 minutes. **Cost:** $0 (all free tiers).

> **Tip: keep two versions.** At the end you'll also make a *demo* copy (fake profiles, works offline-ish,
> never breaks). Use the **demo** for your live pitch and the **real** one for classmates. See step 9.

---

## What you need

| Account | Why | Link |
|---|---|---|
| GitHub | Stores the code so Vercel can deploy it | https://github.com/signup |
| Supabase | Accounts, database, photos, live chat | https://supabase.com |
| Vercel | Hosts the website | https://vercel.com/signup (sign up **with GitHub**) |
| Google Cloud *(optional)* | Real travel times + nearby groceries on the map | https://console.cloud.google.com |

Sign up for Vercel with your GitHub account. It makes step 6 one click.

---

## Step 1: Put the code on GitHub

1. On https://github.com/new create a repository named `uni-plus`.
   - Choose **Private** (Vercel can still deploy it).
   - Do **not** tick "Add a README" (the project already has one).
2. In the VS Code terminal, inside the `Uni_plus` folder, run (replace `YOUR-USERNAME`):

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/uni-plus.git
   git push -u origin main
   ```

   If it asks you to sign in, follow the browser prompt.
3. Refresh the GitHub page: you should see the files (`app/`, `lib/`, `README.md`, …).

> `.env.local` (your secret keys) is **never** uploaded; it's excluded by `.gitignore`.

---

## Step 2: Create the Supabase project

1. On https://supabase.com/dashboard click **New project**.
   - **Name:** `uni-plus`
   - **Database password:** click *Generate* and save it somewhere (you won't need it day-to-day).
   - **Region:** *Canada (Central)* (closest to Waterloo).
   - Plan: **Free**.
2. Wait ~2 minutes until the project is ready.

### 2a. Create the tables (one copy-paste)

1. Left menu → **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) in VS Code, select everything (Cmd+A), copy, and paste it into Supabase.
3. Click **Run**. You should see *Success. No rows returned*.
4. Check: **Table Editor** lists `profiles`, `swipes`, `matches`, `messages`, `households`, `agreements`, `expenses`…
   and **Storage** has a bucket called `photos`.

> Run this file **once** on a fresh project. Running it a second time shows "already exists" errors. That's harmless,
> but if anything looks wrong, the quickest fix is to create a new Supabase project and run it once.

### 2b. Turn on email + password, without confirmation emails

Supabase's built-in email sender only allows **2 emails per hour for the whole project**, so a class can't all
sign up with emailed links. The fix: classmates create an account with **email + password**, and Supabase doesn't
send any email.

1. Left menu → **Authentication** → **Sign In / Providers** (called *Providers* in some versions).
2. Make sure **Email** is enabled.
3. Turn **off** "**Confirm email**". Click **Save**.

> Want confirmation emails anyway? Keep it on and connect a real email service under
> **Authentication → Emails → SMTP Settings** (Resend, Brevo, …). With custom SMTP the limit starts at 30/hour
> and can be raised under **Authentication → Rate Limits**.

### 2c. Copy your two keys

1. Left menu → **Project Settings** (gear) → **API** (or **API Keys** / **Data API**, depending on the version).
2. Copy:
   - **Project URL**: looks like `https://abcdefghijk.supabase.co`
   - **anon public** key (or the **publishable** key, `sb_publishable_…`). Either works.
   - ⚠️ Never use the `service_role` / *secret* key in the app.

---

## Step 3 (optional but recommended): Test on your laptop first

1. In the `Uni_plus` folder, create a file named `.env.local`:

   ```bash
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-the-anon-or-publishable-key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
   ```

2. Run `npm run dev` and open http://localhost:3000.
3. To test matching **you need two accounts at the same time**: use a normal Chrome window for account A and
   an **Incognito** window (or Safari) for account B.
   - Both: « Commencer » → **Créer mon compte** → fill in the profile (upload a real photo) → Découvrir.
   - A likes B, then B likes A → « C'est un match ! » appears for the second person.
   - Chat between the two windows: messages appear live.
4. In Supabase → **Table Editor → profiles**, you'll see both profiles; **Storage → photos** has the uploaded pictures.

---

## Step 4: Put it online with Vercel

1. On https://vercel.com/new click **Import** next to your `uni-plus` GitHub repository.
2. Framework: **Next.js** (detected automatically). Leave the build settings as they are.
3. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_DEMO_MODE` | `false` |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/publishable key |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | *(leave empty for now, see step 7)* |

4. Click **Deploy** and wait ~1–2 minutes.
5. You get a URL like `https://uni-plus-abc123.vercel.app`. You can rename it under
   **Settings → Domains** (for example `uniplus-kw.vercel.app`).

> Any time you change an environment variable on Vercel, go to **Deployments → ⋯ → Redeploy**:
> `NEXT_PUBLIC_…` values are baked in when the site is built.

---

## Step 5: Tell Supabase your website address

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL:** `https://YOUR-APP.vercel.app`
3. **Redirect URLs** → *Add URL* (both):
   - `https://YOUR-APP.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
4. **Save.** (This is only used by the « Lien par courriel » option, but it avoids broken links.)

---

## Step 6: Test everything with two phones (before sharing!)

Use your phone and a friend's (or phone + laptop). Tick each line:

- [ ] Open the Vercel URL → « Commencer » → **Créer mon compte** works on both.
- [ ] Onboarding: **upload photos from the camera roll**, all 9 steps, « Terminer ».
- [ ] Profil tab shows your photos; « Modifier le profil » saves changes.
- [ ] Découvrir shows the other person with a compatibility %; tap the card to see the full profile.
- [ ] Both swipe right on each other → « C'est un match ! ».
- [ ] Messages: chat both ways; messages arrive without refreshing; « Lu » appears.
- [ ] Video button → « Autoriser la caméra et le micro » → « Rejoindre l'appel » on both phones (see the Jitsi note below).
- [ ] Map button in the chat → « Le meilleur quartier » shows a zone and travel times.
- [ ] « S'engager » on one phone → « Accepter » on the other (appears within a few seconds).
- [ ] Fill the agreement, sign on **both** phones → « Signée » → **Télécharger en PDF** opens a PDF.
- [ ] Dépenses: add an expense on one phone, it shows on the other within ~10 s.
- [ ] Swipe 12 times → paywall → fake checkout (banner « MODE DÉMO ») → swipes credited.

**Video calls (meet.jit.si):** the first person in a call must log in to Jitsi (Google/GitHub button inside the call)
before it starts; the other then joins without an account. Embedded calls may stop after ~5 minutes. « Nouvel onglet »
opens the same call directly on meet.jit.si without that limit.

---

## Step 7 (optional): Real travel times on the map

Without a key the map still works (grey OpenStreetMap map, midpoint between schools, estimated times).
With a key you get real bus/ION + walking times, the Google map and nearby groceries/bus stops.

1. https://console.cloud.google.com → create a project → attach a billing account (Google requires it even for the free
   monthly usage) → **Billing → Budgets & alerts**: set a budget of $1 so you're warned of any charge.
2. **APIs & Services → Library**, enable: **Maps JavaScript API**, **Places API (New)**, **Routes API**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Click the key → restrict it (important, anyone can see a website key):
   - **Websites:** `https://YOUR-APP.vercel.app/*` and `http://localhost:3000/*`
   - **API restrictions:** only the 3 APIs above.
5. Vercel → **Settings → Environment Variables** → set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → **Redeploy**.
6. Open the map: the note under « Zone recommandée » should now say « Temps de trajet réels (Google Maps…) ».

---

## Step 8: Share it with your classmates

Send them the link (or show a QR code of it on a slide). What to tell them:

> 1. Open **https://YOUR-APP.vercel.app** on your phone (Safari on iPhone, Chrome on Android).
> 2. *(Optional)* Add it to your home screen: Share → « Sur l'écran d'accueil » (iPhone) or ⋮ → « Ajouter à l'écran d'accueil » (Android).
> 3. « Commencer » → **Créer mon compte** (email + a password of 8+ characters).
> 4. Fill in your profile and **upload 1–4 of your own photos**.
> 5. Swipe! You match when **both** people swipe right on each other.
> 6. Chat, try the video call, the « meilleur quartier » map, and « S'engager » with a match.

Good to know:
- Classmates only see **other classmates** who finished their profile (the 20 fake demo profiles only exist in demo mode).
  With a small class the deck runs out quickly; that's normal.
- Each person gets 12 free swipes per day (the fake checkout adds more; no real payment, ever).
- The same account works on several devices: just sign in again with the same email and password.

---

## Step 9: Keep a demo copy for your pitch (recommended)

So the live presentation never depends on classmates' data or the internet behaving:

1. Vercel → **Add New → Project** → import the **same** GitHub repo again.
2. Name it e.g. `uni-plus-demo`.
3. Environment variable: only `NEXT_PUBLIC_DEMO_MODE` = `true`. Deploy.
4. You now have `uni-plus-demo.vercel.app` (fake profiles, simulated replies, one-tap « Remplir avec un profil exemple »)
   and the real `uni-plus.vercel.app` for classmates. Both update automatically whenever you `git push`.

---

## Privacy, limits and clean-up

- **Photos are public links.** Anyone with a photo's exact URL can view it. Remind classmates to upload normal profile pictures only.
- **Free-plan limits** (plenty for a class): ~500 MB database, 1 GB photo storage. A free Supabase project **pauses after
  about a week without any activity**; if that happens, open the Supabase dashboard and click **Restore project** before the pitch.
- **Delete someone's account:** Supabase → **Authentication → Users** → ⋯ → **Delete user** (their profile, swipes,
  matches and messages are removed with it). Their photos stay in **Storage → photos → (their user id)**; delete that folder too.
- **After the project:** delete the Vercel project(s) and the Supabase project to remove all data.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| The site still shows « MODE DÉMO » and fake profiles | `NEXT_PUBLIC_DEMO_MODE` isn't `false`, or a Supabase variable is missing/misspelled. Fix it on Vercel, then **Redeploy**. |
| « Courriel ou mot de passe incorrect » right after signing up | « Confirm email » is still on (step 2b). Turn it off, then sign up with a new email. |
| « Trop de tentatives » | Supabase rate limit: wait a minute. |
| Photo upload fails at the end of onboarding | The SQL in step 2a didn't fully run (no `photos` bucket). Re-check **Storage**. |
| Matches/messages don't appear | Both people must swipe right. Then open **Matchs** or **Messages** (they refresh when opened). |
| Messages need a refresh to appear | Realtime isn't on for `messages`: Supabase → **Database → Publications → supabase_realtime** → enable `messages`. |
| Camera doesn't work in the video call | The site must be opened over **https** (the Vercel URL is). Allow camera/microphone in the browser settings. |
| Map says « Estimation » even with a Google key | The key isn't allowed on this domain or an API isn't enabled (step 7). The app falls back automatically. |
| Everything was fine, now nothing loads | The free Supabase project was paused: dashboard → **Restore project**. |
