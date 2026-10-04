-- ============================================================
-- 003_rls_policies.sql
-- Enable Row Level Security on every public table and define
-- who can read what. All writes go through functions only.
-- ============================================================

-- -----------------------------------------------------------
-- profiles
-- -----------------------------------------------------------
alter table public.profiles enable row level security;

-- Users can read their own profile; officers and managers can read all
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.my_role() in ('officer','manager'));

-- No direct insert/update/delete — the trigger handles creation;
-- role changes go through a dedicated function (see below).
revoke insert, update, delete on public.profiles from anon, authenticated;

-- -----------------------------------------------------------
-- clauses — everyone logged in can read
-- -----------------------------------------------------------
alter table public.clauses enable row level security;

create policy "clauses_select" on public.clauses
  for select to authenticated
  using (true);

revoke insert, update, delete on public.clauses from anon, authenticated;

-- -----------------------------------------------------------
-- ncrs
-- -----------------------------------------------------------
alter table public.ncrs enable row level security;

-- Reporters see their own; officers and managers see all (non-archived)
create policy "ncrs_select" on public.ncrs
  for select to authenticated
  using (
    archived_at is null
    and (created_by = auth.uid() or public.my_role() in ('officer','manager'))
  );

revoke insert, update, delete on public.ncrs from anon, authenticated;

-- -----------------------------------------------------------
-- capas
-- -----------------------------------------------------------
alter table public.capas enable row level security;

create policy "capas_select" on public.capas
  for select to authenticated
  using (
    exists (
      select 1 from public.ncrs n
       where n.id = capas.ncr_id
         and n.archived_at is null
         and (n.created_by = auth.uid() or public.my_role() in ('officer','manager'))
    )
  );

revoke insert, update, delete on public.capas from anon, authenticated;

-- -----------------------------------------------------------
-- events
-- -----------------------------------------------------------
alter table public.events enable row level security;

create policy "events_select" on public.events
  for select to authenticated
  using (
    exists (
      select 1 from public.ncrs n
       where n.id = events.ncr_id
         and n.archived_at is null
         and (n.created_by = auth.uid() or public.my_role() in ('officer','manager'))
    )
  );

revoke insert, update, delete on public.events from anon, authenticated;

-- -----------------------------------------------------------
-- evidence
-- -----------------------------------------------------------
alter table public.evidence enable row level security;

create policy "evidence_select" on public.evidence
  for select to authenticated
  using (
    exists (
      select 1 from public.ncrs n
       where n.id = evidence.ncr_id
         and n.archived_at is null
         and (n.created_by = auth.uid() or public.my_role() in ('officer','manager'))
    )
  );

revoke insert, update, delete on public.evidence from anon, authenticated;

-- -----------------------------------------------------------
-- Role management function (Manager only)
-- -----------------------------------------------------------
create or replace function public.set_user_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Login required' using errcode = '42501'; end if;
  if public.my_role() <> 'manager' then
    raise exception 'Only a manager can change roles' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role' using errcode = 'PT422';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then raise exception 'User not found' using errcode = 'PT404'; end if;
end $$;

revoke execute on function public.set_user_role(uuid, public.app_role) from public, anon;
grant  execute on function public.set_user_role(uuid, public.app_role) to authenticated;
