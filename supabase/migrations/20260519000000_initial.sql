-- The Ledger MVP — initial schema
-- One schema, RLS on everything, auth.uid() scopes rows to the user.
--
-- Run via: supabase db push  (or paste into the SQL editor in the dashboard)

-- ─── profiles ─────────────────────────────────────────────────
-- Mirrors auth.users with the app-level fields. A trigger creates a row
-- automatically when a user signs up.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text default 'Chloe',
  email text,
  city text default 'Hong Kong',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── trips ────────────────────────────────────────────────────
-- Client-generated id (t001, t002...) so offline-drafted trips can
-- commit later without a server round-trip on insert.
create table public.trips (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  where_text text not null default '',
  start_date date,
  end_date date,
  note text default '',
  companions jsonb not null default '[]'::jsonb,
  vibes jsonb not null default '[]'::jsonb,
  items jsonb not null default '{}'::jsonb,   -- { itemId: { status, day } }
  address text,                                -- per-trip inbox e.g. chloe.rome.x7k@in.theledger.co
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trips_user_idx on public.trips(user_id);
create index trips_address_idx on public.trips(address);

-- ─── forwarded_items ──────────────────────────────────────────
-- Parser output. id is the sha1 hash of (kind+title+when+where) so
-- re-forwarding the same confirmation is idempotent.
create table public.forwarded_items (
  id text not null,
  trip_id text not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text,
  title text,
  when_at timestamptz,
  end_at timestamptz,
  where_text text,
  party integer,
  details text,
  confidence numeric,
  raw_excerpt text,
  received_at timestamptz not null default now(),
  primary key (trip_id, id)
);
create index forwarded_items_user_idx on public.forwarded_items(user_id);
create index forwarded_items_when_idx on public.forwarded_items(when_at);

-- ─── inbox_routes ─────────────────────────────────────────────
-- address → (user, trip). Read by the edge function on inbound email.
-- Frontend writes this on trip commit.
create table public.inbox_routes (
  address text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index inbox_routes_user_idx on public.inbox_routes(user_id);

-- ─── user_wants ───────────────────────────────────────────────
-- Upvotes on placeholder features. Composite PK so toggling is a single
-- upsert/delete.
create table public.user_wants (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, feature_id)
);

-- ─── feedback_notes ───────────────────────────────────────────
-- 'A note back to the makers' — real send, not a fake confirmation.
create table public.feedback_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  working text default '',
  not_working text default '',
  other text default '',
  wants jsonb not null default '[]'::jsonb,
  sent_at timestamptz not null default now()
);
create index feedback_notes_user_idx on public.feedback_notes(user_id);
create index feedback_notes_sent_idx on public.feedback_notes(sent_at desc);

-- ─── RLS ──────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.trips           enable row level security;
alter table public.forwarded_items enable row level security;
alter table public.inbox_routes    enable row level security;
alter table public.user_wants      enable row level security;
alter table public.feedback_notes  enable row level security;

create policy "profiles · own"      on public.profiles        for all using (id = auth.uid())      with check (id = auth.uid());
create policy "trips · own"         on public.trips           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "items · own"         on public.forwarded_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "routes · own"        on public.inbox_routes    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "wants · own"         on public.user_wants      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "feedback · own"      on public.feedback_notes  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── updated_at maintenance ───────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_updated_at before update on public.trips
  for each row execute function public.touch_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
