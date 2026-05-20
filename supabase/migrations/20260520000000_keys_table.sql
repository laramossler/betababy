-- ─── keys: URL-as-credential mapping ─────────────────────────
-- Each row maps an opaque URL key to a Supabase auth user. The
-- exchange-key edge function reads this with the service role to mint
-- a session for the client (no email step, no password).
--
-- Lara provisions keys; users never see them. She hands out URLs like
--   https://theledger.app/?k=chloe-7f3k9p
-- The client strips the key from the URL and stores it locally so
-- subsequent visits + token refreshes never need the URL again.

create table public.keys (
  key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Service role only. RLS enabled with no policies = anon + authenticated
-- clients can read/write nothing. Only edge functions using the service
-- role can touch it.
alter table public.keys enable row level security;

-- Helper: provision a key for an existing user (lookup by email).
-- Run with service role (Supabase SQL editor uses it by default).
--
-- Usage:
--   select public.provision_key('chloe@theledger.app', 'chloe-7f3k9p', 'Chloe Lam');
--
create or replace function public.provision_key(
  user_email text,
  new_key text,
  new_label text default null
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = user_email;
  if target_id is null then
    raise exception 'no auth user with email %', user_email;
  end if;
  insert into public.keys (key, user_id, label)
  values (new_key, target_id, new_label)
  on conflict (key) do update set user_id = excluded.user_id, label = coalesce(excluded.label, public.keys.label);
  return json_build_object('user_id', target_id, 'key', new_key);
end;
$$;
