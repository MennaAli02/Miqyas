-- ============================================================
-- 001_types_and_tables.sql
-- Creates all custom types, tables, constraints and the
-- append-only trigger for the events timeline.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Custom types (enums)
-- -----------------------------------------------------------
create type public.app_role   as enum ('reporter', 'officer', 'manager');
create type public.ncr_status as enum ('reported','triage','investigation','capa','verification','closed','rejected');
create type public.severity   as enum ('minor', 'major', 'critical');

-- -----------------------------------------------------------
-- 2. profiles — one row per Supabase Auth user
-- -----------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 100),
  role        public.app_role not null default 'reporter',
  department  text,
  created_at  timestamptz not null default now()
);

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'reporter'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------
-- 3. clauses — standard quality clauses (ISO 9001, etc.)
-- -----------------------------------------------------------
create table public.clauses (
  id       bigint generated always as identity primary key,
  standard text not null default 'ISO 9001:2015',
  code     text not null,
  title_ar text not null default '',
  title_en text not null default '',
  text_ar  text not null default '',
  text_en  text not null default '',
  unique (standard, code)
);

-- -----------------------------------------------------------
-- 4. ncrs — non-conformance reports
-- -----------------------------------------------------------
create table public.ncrs (
  id                bigint generated always as identity primary key,
  ref               text unique,

  -- Bilingual text fields stored as jsonb {"ar":"...","en":"..."}
  title             jsonb not null check (jsonb_typeof(title) = 'object'),
  description       jsonb not null check (jsonb_typeof(description) = 'object'),
  requirement       jsonb,
  containment       jsonb,
  routing_note      jsonb,
  owner_name        jsonb,
  root_cause        jsonb,
  contributors      jsonb,
  verification_note jsonb,

  -- Enums and constrained fields
  disposition       text not null default 'quarantine'
                    check (disposition in ('quarantine','rework','scrap','use_as_is','return','na')),
  severity          public.severity not null default 'minor',
  status            public.ncr_status not null default 'reported',
  department        text not null
                    check (department in ('quality','production','laboratory','clinical','procurement','maintenance','warehouse')),
  source            text not null
                    check (source in ('process','internal_audit','customer','supplier','incident','management')),
  location          text check (char_length(location) <= 200),
  rca_method        text not null default 'five_why'
                    check (rca_method in ('five_why','fishbone')),
  whys              text[] not null default '{}'
                    check (cardinality(whys) <= 10),

  -- People / dates
  reporter_name     text not null check (char_length(reporter_name) between 2 and 100),
  reported_at       date not null default current_date,
  due_date          date not null,
  closed_at         timestamptz,
  archived_at       timestamptz,

  -- Relations
  clause_id         bigint references public.clauses(id),
  created_by        uuid not null references auth.users(id),

  -- Concurrency control
  version           int not null default 1,

  check (due_date >= reported_at)
);

create index ncrs_status_idx   on public.ncrs (status) where archived_at is null;
create index ncrs_dept_idx     on public.ncrs (department) where archived_at is null;
create index ncrs_created_idx  on public.ncrs (created_by);

-- -----------------------------------------------------------
-- 5. capas — corrective and preventive actions
-- -----------------------------------------------------------
create table public.capas (
  id         bigint generated always as identity primary key,
  ncr_id     bigint not null references public.ncrs(id) on delete cascade,
  type       text not null default 'corrective'
             check (type in ('corrective','preventive')),
  action     jsonb not null check (jsonb_typeof(action) = 'object'),
  owner_name text not null default '',
  due_date   date,
  status     text not null default 'open'
             check (status in ('open','in_progress','done','verified')),
  created_at timestamptz not null default now()
);

create index capas_ncr_idx on public.capas (ncr_id);

-- -----------------------------------------------------------
-- 6. events — append-only timeline
-- -----------------------------------------------------------
create table public.events (
  id         bigint generated always as identity primary key,
  ncr_id     bigint not null references public.ncrs(id) on delete cascade,
  at         date not null default current_date,
  actor      text not null default '',
  note       jsonb not null
);

create index events_ncr_idx on public.events (ncr_id, id);

-- Block any update or delete on the events table
create or replace function public.block_event_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Timeline entries cannot be changed or deleted' using errcode = '42501';
end $$;

create trigger events_append_only
  before update or delete on public.events
  for each row execute function public.block_event_changes();

-- -----------------------------------------------------------
-- 7. evidence — file records (actual files in Storage)
-- -----------------------------------------------------------
create table public.evidence (
  id         bigint generated always as identity primary key,
  ncr_id     bigint not null references public.ncrs(id) on delete cascade,
  kind       text not null default 'file'
             check (kind in ('image','video','file')),
  name       text not null,
  path       text not null,           -- Storage path: <ncrId>/<uuid>-<filename>
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index evidence_ncr_idx on public.evidence (ncr_id);
