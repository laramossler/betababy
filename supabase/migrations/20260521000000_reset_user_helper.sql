-- Helper: nuke all app data for a given user, keeping the auth row.
-- Useful when you just tested as Chloe and want a clean slate before
-- handing her the link for real.
--
-- Usage:
--   select public.reset_user('chloe-7f3k9p3q9w@theledger.app');

create or replace function public.reset_user(user_email text)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  trip_count int;
  item_count int;
begin
  select id into target_id from auth.users where email = user_email;
  if target_id is null then
    raise exception 'no user with email %', user_email;
  end if;

  delete from public.forwarded_items where user_id = target_id;
  get diagnostics item_count = row_count;

  delete from public.trips where user_id = target_id;
  get diagnostics trip_count = row_count;

  delete from public.user_wants     where user_id = target_id;
  delete from public.feedback_notes where user_id = target_id;
  delete from public.inbox_routes   where user_id = target_id;

  -- Profile row stays so the auto-create trigger doesn't fight us;
  -- just reset the editable fields.
  update public.profiles
     set name = 'Chloe', city = 'Hong Kong'
   where id = target_id;

  return json_build_object(
    'user_id', target_id,
    'trips_deleted', trip_count,
    'items_deleted', item_count
  );
end;
$$;
