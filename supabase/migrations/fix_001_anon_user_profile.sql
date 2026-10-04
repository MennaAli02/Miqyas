-- ============================================================
-- fix_001_anon_user_profile.sql
-- Fix handle_new_user trigger to support anonymous users
-- (who have no email address).
-- Run in the Supabase SQL Editor.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  -- Anonymous users have no email — give them a placeholder name
  -- that satisfies the 2-100 char constraint on profiles.full_name
  if new.email is not null and new.email <> '' then
    display_name := coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    );
  else
    -- Anonymous or OAuth user with no email
    display_name := coalesce(
      new.raw_user_meta_data->>'full_name',
      'Anonymous'
    );
  end if;

  -- Ensure minimum length (constraint is 2–100 chars)
  if char_length(display_name) < 2 then
    display_name := 'User';
  end if;

  insert into public.profiles (id, full_name, role)
  values (new.id, display_name, 'reporter')
  on conflict (id) do nothing;   -- safe to re-run

  return new;
end $$;
