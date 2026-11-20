-- ════════════════════════════════════════════════════════════════════════════
-- Uni+ — Supabase schema
-- Run once in Supabase → SQL Editor → New query → Run.
-- Not needed in demo mode.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null,
  age         int  not null check (age between 16 and 99),
  program     text not null,
  year        int  not null check (year between 1 and 5),
  school      text not null check (school in ('uw', 'wlu', 'conestoga-doon', 'conestoga-waterloo')),
  bio         varchar(300) not null default '',
  photos      text[] not null default '{}' check (cardinality(photos) <= 4),
  interests   text[] not null default '{}',
  study       jsonb not null,     -- { noise, place, chronotype, examMode }
  lifestyle   jsonb not null,     -- { bedtime, cleanliness, guests, smoking, pets }
  budget_min  int  not null check (budget_min >= 0),
  budget_max  int  not null check (budget_max >= budget_min),
  move_in     date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Swipes ──────────────────────────────────────────────────────────────────
create table if not exists public.swipes (
  swiper_id  uuid not null references public.profiles (id) on delete cascade,
  target_id  uuid not null references public.profiles (id) on delete cascade,
  liked      boolean not null,
  created_at timestamptz not null default now(),
  primary key (swiper_id, target_id),
  check (swiper_id <> target_id)
);

-- ── Matches (1-to-1, created automatically on a mutual like) ───────────────
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles (id) on delete cascade,
  user_b     uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create or replace function public.is_match_member(m uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches where id = m and auth.uid() in (user_a, user_b));
$$;

create or replace function public.handle_mutual_like()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.liked and exists (
    select 1 from swipes where swiper_id = new.target_id and target_id = new.swiper_id and liked
  ) then
    insert into matches (user_a, user_b)
    values (least(new.swiper_id, new.target_id), greatest(new.swiper_id, new.target_id))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_swipe_mutual on public.swipes;
create trigger on_swipe_mutual after insert or update on public.swipes
  for each row execute function public.handle_mutual_like();

-- ── Messages ────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists messages_match_idx on public.messages (match_id, created_at);

-- ── Swipe credits (fake checkout — never stores any card data) ─────────────
create table if not exists public.swipe_credits (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  extra_swipes  int not null default 0 check (extra_swipes >= 0),
  premium_until timestamptz
);

-- ── Households: a committed pair or group (2–4 roommates) ──────────────────
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  accepted_at  timestamptz,           -- null = invitation to « S'engager » pending
  primary key (household_id, user_id)
);

create or replace function public.is_household_member(h uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = h and user_id = auth.uid());
$$;

-- Roommate agreement (« Entente de colocation »): one per household.
create table if not exists public.agreements (
  household_id uuid primary key references public.households (id) on delete cascade,
  data         jsonb not null default '{}',   -- rent split, chores, quiet hours, …
  signatures   jsonb not null default '{}',   -- { "<user_id>": { "name": "...", "signedAt": "..." } }
  updated_at   timestamptz not null default now()
);

-- Shared expenses (bill splitting).
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  paid_by      uuid not null references public.profiles (id) on delete cascade,
  description  text not null,
  amount_cents int  not null check (amount_cents > 0),
  split_among  uuid[] not null default '{}',   -- empty = everyone in the household
  is_settlement boolean not null default false, -- « Marquer comme réglé » reimbursements
  created_at   timestamptz not null default now()
);
-- If you created the table with an earlier version of this file:
alter table public.expenses add column if not exists split_among uuid[] not null default '{}';
alter table public.expenses add column if not exists is_settlement boolean not null default false;

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.swipes            enable row level security;
alter table public.matches           enable row level security;
alter table public.messages          enable row level security;
alter table public.swipe_credits     enable row level security;
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.agreements        enable row level security;
alter table public.expenses          enable row level security;

create policy "profiles: read when signed in" on public.profiles for select to authenticated using (true);
create policy "profiles: insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles: update own" on public.profiles for update to authenticated using (id = auth.uid());

create policy "swipes: read own" on public.swipes for select to authenticated using (swiper_id = auth.uid());
create policy "swipes: write own" on public.swipes for insert to authenticated with check (swiper_id = auth.uid());
create policy "swipes: change own" on public.swipes for update to authenticated using (swiper_id = auth.uid());

create policy "matches: members read" on public.matches for select to authenticated
  using (auth.uid() in (user_a, user_b));

create policy "messages: members read" on public.messages for select to authenticated
  using (public.is_match_member(match_id));
create policy "messages: members send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_match_member(match_id));
create policy "messages: members mark read" on public.messages for update to authenticated
  using (public.is_match_member(match_id));

create policy "credits: own" on public.swipe_credits for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "households: members read" on public.households for select to authenticated
  using (public.is_household_member(id) or created_by = auth.uid());
create policy "households: create" on public.households for insert to authenticated
  with check (created_by = auth.uid());
create policy "households: creator cancels" on public.households for delete to authenticated
  using (created_by = auth.uid());

create policy "members: read" on public.household_members for select to authenticated
  using (public.is_household_member(household_id));
create policy "members: creator invites" on public.household_members for insert to authenticated
  with check (exists (select 1 from households h where h.id = household_id and h.created_by = auth.uid()));
create policy "members: accept own" on public.household_members for update to authenticated
  using (user_id = auth.uid());

create policy "agreements: members" on public.agreements for all to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "expenses: members" on public.expenses for all to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- ── Realtime for chat ───────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;

-- ── Storage: profile photos ─────────────────────────────────────────────────
-- Public bucket; each user writes only inside a folder named after their user id.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;

create policy "photos: public read" on storage.objects for select using (bucket_id = 'photos');
create policy "photos: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Table permissions for signed-in users ───────────────────────────────────
-- Newer Supabase projects no longer grant these automatically. Row Level
-- Security (above) still decides which rows each user can see or change.
-- Safe to run again on its own.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
