-- ============================================================
-- 002_functions.sql
-- Helper functions and all business logic RPC functions.
-- ============================================================

-- -----------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------

-- Get the calling user's role from profiles
create or replace function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Get the calling user's display name from profiles
create or replace function public.my_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select full_name from public.profiles where id = auth.uid();
$$;

-- True when a jsonb bilingual field has no meaningful content
create or replace function public.bi_empty(v jsonb)
returns boolean
language sql
immutable
as $$
  select v is null
      or (trim(coalesce(v->>'ar','')) = '' and trim(coalesce(v->>'en','')) = '');
$$;

-- Store a plain string as a bilingual jsonb object under the given language
create or replace function public.bi_set(existing jsonb, val text, lang text default 'ar')
returns jsonb
language sql
immutable
as $$
  select coalesce(existing, '{}'::jsonb) || jsonb_build_object(lang, val);
$$;

-- Convert an ncrs row to the camelCase JSON shape the React pages expect
create or replace function public.ncr_to_json(n public.ncrs)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',               n.id,
    'ref',              n.ref,
    'title',            n.title,
    'description',      n.description,
    'requirement',      n.requirement,
    'containment',      n.containment,
    'disposition',      n.disposition,
    'routingNote',      n.routing_note,
    'ownerName',        n.owner_name,
    'dueDate',          n.due_date,
    'status',           n.status,
    'severity',         n.severity,
    'department',       n.department,
    'location',         n.location,
    'source',           n.source,
    'reporterName',     n.reporter_name,
    'reportedAt',       n.reported_at,
    'clauseId',         n.clause_id,
    'rcaMethod',        n.rca_method,
    'whys',             n.whys,
    'rootCause',        n.root_cause,
    'contributors',     n.contributors,
    'verificationNote', n.verification_note,
    'closedAt',         n.closed_at,
    'version',          n.version
  );
$$;

-- Convert a capas row to the camelCase JSON shape
create or replace function public.capa_to_json(c public.capas)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id',        c.id,
    'ncrId',     c.ncr_id,
    'type',      c.type,
    'action',    c.action,
    'ownerName', c.owner_name,
    'dueDate',   c.due_date,
    'status',    c.status
  );
$$;

-- Convert a clauses row to the camelCase JSON shape
create or replace function public.clause_to_json(cl public.clauses)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id',       cl.id,
    'standard', cl.standard,
    'code',     cl.code,
    'titleAr',  cl.title_ar,
    'titleEn',  cl.title_en,
    'textAr',   cl.text_ar,
    'textEn',   cl.text_en
  );
$$;

-- SLA days by severity
create or replace function public.sla_days(sev public.severity)
returns int
language sql
immutable
as $$
  select case sev when 'critical' then 7 when 'major' then 14 else 30 end;
$$;

-- -----------------------------------------------------------
-- get_bootstrap()
-- Loads everything needed by Overview, Register, Actions,
-- Trends and Clauses pages.
-- -----------------------------------------------------------
create or replace function public.get_bootstrap()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid   uuid := auth.uid();
  role  public.app_role;
  ym    text := to_char(now(), 'YYYY-MM');
  ncrs  jsonb;
  capas jsonb;
  cls   jsonb;
  stats jsonb;
begin
  if uid is null then
    raise exception 'Login required' using errcode = '42501';
  end if;
  role := public.my_role();

  -- Load NCRs (scoped by role)
  select jsonb_agg(public.ncr_to_json(n) order by n.id desc)
    into ncrs
    from public.ncrs n
   where n.archived_at is null
     and (role in ('officer','manager') or n.created_by = uid);

  ncrs := coalesce(ncrs, '[]'::jsonb);

  -- Load all CAPAs visible to the user
  select jsonb_agg(public.capa_to_json(c) order by c.id)
    into capas
    from public.capas c
    join public.ncrs n on n.id = c.ncr_id
   where n.archived_at is null
     and (role in ('officer','manager') or n.created_by = uid);

  capas := coalesce(capas, '[]'::jsonb);

  -- Load clauses (everyone can read)
  select jsonb_agg(public.clause_to_json(cl) order by cl.id)
    into cls
    from public.clauses cl;

  cls := coalesce(cls, '[]'::jsonb);

  -- Build stats from the loaded NCRs
  -- (computed in SQL for accuracy; mirrors the frontend logic)
  select jsonb_build_object(
    'open',         count(*) filter (where status not in ('closed','rejected')),
    'overdue',      count(*) filter (where status not in ('closed','rejected') and due_date < current_date),
    'critical',     count(*) filter (where status not in ('closed','rejected') and severity = 'critical'),
    'closedMonth',  count(*) filter (where status = 'closed' and to_char(coalesce(closed_at::date, reported_at),'YYYY-MM') = ym),
    'capaOpen',     (select count(*) from public.capas pc
                       join public.ncrs pn on pn.id = pc.ncr_id
                      where pn.archived_at is null
                        and (role in ('officer','manager') or pn.created_by = uid)
                        and pc.status in ('open','in_progress')),
    'byStatus',     (select jsonb_object_agg(status::text, cnt) from (
                       select status::text, count(*) as cnt from public.ncrs
                        where archived_at is null
                          and (role in ('officer','manager') or created_by = uid)
                        group by status
                     ) x),
    'byDept',       (select jsonb_object_agg(department, cnt) from (
                       select department, count(*) as cnt from public.ncrs
                        where archived_at is null
                          and (role in ('officer','manager') or created_by = uid)
                        group by department
                     ) x),
    'bySeverity',   (select jsonb_object_agg(severity::text, cnt) from (
                       select severity::text, count(*) as cnt from public.ncrs
                        where archived_at is null
                          and (role in ('officer','manager') or created_by = uid)
                        group by severity
                     ) x),
    'bySource',     (select jsonb_object_agg(source, cnt) from (
                       select source, count(*) as cnt from public.ncrs
                        where archived_at is null
                          and (role in ('officer','manager') or created_by = uid)
                        group by source
                     ) x),
    'byMonth',      (select jsonb_object_agg(ym2, cnt) from (
                       select to_char(reported_at,'YYYY-MM') as ym2, count(*) as cnt
                        from public.ncrs
                        where archived_at is null
                          and (role in ('officer','manager') or created_by = uid)
                        group by ym2
                     ) x),
    'clauseHits',   (select jsonb_object_agg(clause_id::text, cnt) from (
                       select clause_id, count(*) as cnt
                        from public.ncrs
                        where archived_at is null and clause_id is not null
                          and (role in ('officer','manager') or created_by = uid)
                        group by clause_id
                     ) x),
    'effectiveness', (
      select case when total > 0 then round(100.0 * verified / total) else 0 end
      from (
        select count(*) filter (where c.status = 'verified') as verified,
               count(*) filter (where c.status in ('done','verified')) as total
          from public.capas c
          join public.ncrs n on n.id = c.ncr_id
         where n.archived_at is null
           and (role in ('officer','manager') or n.created_by = uid)
      ) sub
    )
  )
    into stats
    from public.ncrs
   where archived_at is null
     and (role in ('officer','manager') or created_by = uid);

  return jsonb_build_object(
    'stats',   coalesce(stats, '{}'::jsonb),
    'ncrs',    ncrs,
    'capas',   capas,
    'clauses', cls
  );
end $$;

revoke execute on function public.get_bootstrap() from public, anon;
grant  execute on function public.get_bootstrap() to authenticated;

-- -----------------------------------------------------------
-- create_ncr(payload)
-- Creates a new NCR report.
-- -----------------------------------------------------------
create or replace function public.create_ncr(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid    uuid := auth.uid();
  role   public.app_role;
  lang   text := coalesce(payload->>'lang', 'ar');
  sv     public.severity := coalesce((payload->>'severity')::public.severity, 'minor');
  dep    text := coalesce(payload->>'department', 'quality');
  rep_at date := coalesce((payload->>'reportedAt')::date, current_date);
  due    date;
  n      public.ncrs;
  nid    bigint;
  nref   text;
  owner_map jsonb := '{
    "quality":      {"ar":"مشرف الجودة","en":"Quality Supervisor"},
    "production":   {"ar":"مشرف الإنتاج","en":"Production Supervisor"},
    "laboratory":   {"ar":"مشرف المختبر","en":"Lab Supervisor"},
    "clinical":     {"ar":"مشرف السريري","en":"Clinical Supervisor"},
    "procurement":  {"ar":"مشرف المشتريات","en":"Procurement Supervisor"},
    "maintenance":  {"ar":"مشرف الصيانة","en":"Maintenance Supervisor"},
    "warehouse":    {"ar":"مشرف المستودع","en":"Warehouse Supervisor"}
  }';
  routing_map jsonb := '{
    "critical": {"ar":"أحل للمدير الأعلى فوراً.","en":"Escalate to senior manager immediately."},
    "major":    {"ar":"وجّه لمدير الجودة خلال 3 أيام عمل.","en":"Route to the Quality Manager within 3 working days."},
    "minor":    {"ar":"عالج على مستوى الفريق خلال شهر.","en":"Address at team level within one month."}
  }';
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();

  -- Validate required fields
  if trim(coalesce(payload->>'reporterName','')) = '' then
    raise exception 'reporterName is required' using errcode = 'PT422';
  end if;
  if trim(coalesce(payload->>'title','')) = '' then
    raise exception 'title is required' using errcode = 'PT422';
  end if;
  if trim(coalesce(payload->>'description','')) = '' then
    raise exception 'description is required' using errcode = 'PT422';
  end if;
  if rep_at > current_date then
    raise exception 'reportedAt cannot be in the future' using errcode = 'PT422';
  end if;

  due := rep_at + public.sla_days(sv);

  -- Generate a sequence-based ref
  select nextval('ncr_ref_seq') into nid;
  nref := 'NCR-' || to_char(rep_at, 'YYYY') || '-' || lpad(nid::text, 4, '0');

  insert into public.ncrs (
    ref, title, description, requirement, containment, disposition,
    routing_note, owner_name, due_date, status, severity, department,
    location, source, reporter_name, reported_at, clause_id,
    rca_method, whys, root_cause, contributors, verification_note,
    created_by
  ) values (
    nref,
    public.bi_set(null, payload->>'title', lang),
    public.bi_set(null, payload->>'description', lang),
    case when trim(coalesce(payload->>'requirement','')) <> '' then public.bi_set(null, payload->>'requirement', lang) end,
    case when trim(coalesce(payload->>'containment','')) <> '' then public.bi_set(null, payload->>'containment', lang) end,
    coalesce(payload->>'disposition', 'quarantine'),
    routing_map->sv::text,
    owner_map->dep,
    due,
    'reported',
    sv,
    dep,
    coalesce(payload->>'location', ''),
    coalesce(payload->>'source', 'process'),
    payload->>'reporterName',
    rep_at,
    (payload->>'clauseId')::bigint,
    coalesce(payload->>'rcaMethod', 'five_why'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(payload->'whys') x), '{}'),
    case when trim(coalesce(payload->>'rootCause','')) <> '' then public.bi_set(null, payload->>'rootCause', lang) end,
    null,
    null,
    uid
  )
  returning id into n.id;

  -- Insert first timeline event
  select * into n from public.ncrs where id = n.id;

  insert into public.events (ncr_id, at, actor, note)
  values (n.id, current_date, payload->>'reporterName',
    jsonb_build_object('ar','تم تسجيل عدم المطابقة','en','Non-conformance reported'));

  -- Optional: create initial CAPA if provided
  if trim(coalesce(payload->>'capaAction','')) <> '' then
    insert into public.capas (ncr_id, type, action, owner_name, due_date, status)
    values (
      n.id,
      coalesce(payload->>'capaType', 'corrective'),
      public.bi_set(null, payload->>'capaAction', lang),
      coalesce(payload->>'capaOwner', ''),
      coalesce((payload->>'capaDue')::date, due),
      'open'
    );
  end if;

  return public.ncr_to_json(n);
end $$;

-- We need a sequence for NCR refs (not auto-identity so we can read it before insert)
create sequence if not exists public.ncr_ref_seq start 1;

revoke execute on function public.create_ncr(jsonb) from public, anon;
grant  execute on function public.create_ncr(jsonb) to authenticated;

-- -----------------------------------------------------------
-- get_ncr(p_id)
-- Returns one report with clause, evidence, capas, events.
-- -----------------------------------------------------------
create or replace function public.get_ncr(p_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
  n    public.ncrs;
  cls  public.clauses;
  evs  jsonb;
  caps jsonb;
  evid jsonb;
  sugg jsonb := '{
    "critical": {"ar":"معالجة فورية — وقف العمليات إن لزم وإخطار الإدارة العليا.","en":"Immediate action — stop operations if needed and notify senior management."},
    "major":    {"ar":"حقق خلال 3 أيام عمل، حدد السبب الجذري وخطة الإجراء.","en":"Investigate within 3 working days, identify root cause and action plan."},
    "minor":    {"ar":"جدول للمعالجة خلال دورة المراجعة الدورية القادمة.","en":"Schedule for correction in the next regular review cycle."}
  }';
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();

  select * into n from public.ncrs
   where id = p_id and archived_at is null
     and (role in ('officer','manager') or created_by = uid);

  if not found then
    raise exception 'Case not found' using errcode = 'PT404';
  end if;

  if n.clause_id is not null then
    select * into cls from public.clauses where id = n.clause_id;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object('id',e.id,'ncrId',e.ncr_id,'at',e.at,'actor',e.actor,'note',e.note)
    order by e.id
  ), '[]'::jsonb)
    into evs
    from public.events e
   where e.ncr_id = n.id;

  select coalesce(jsonb_agg(public.capa_to_json(c) order by c.id), '[]'::jsonb)
    into caps
    from public.capas c
   where c.ncr_id = n.id;

  select coalesce(jsonb_agg(
    jsonb_build_object('id',ev.id,'ncrId',ev.ncr_id,'kind',ev.kind,'name',ev.name,'path',ev.path,'caption',ev.name)
    order by ev.id
  ), '[]'::jsonb)
    into evid
    from public.evidence ev
   where ev.ncr_id = n.id;

  return jsonb_build_object(
    'ncr',        public.ncr_to_json(n),
    'clause',     case when cls.id is not null then public.clause_to_json(cls) else null end,
    'evidence',   evid,
    'capas',      caps,
    'events',     evs,
    'suggestion', sugg->n.severity::text
  );
end $$;

revoke execute on function public.get_ncr(bigint) from public, anon;
grant  execute on function public.get_ncr(bigint) to authenticated;

-- -----------------------------------------------------------
-- update_analysis(p_id, payload)
-- Saves root-cause analysis and verification note.
-- -----------------------------------------------------------
create or replace function public.update_analysis(p_id bigint, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
  n    public.ncrs;
  lang text := coalesce(payload->>'lang', 'ar');
  ver  int  := (payload->>'expectedVersion')::int;
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();
  if role not in ('officer','manager') then
    raise exception 'You are not allowed to edit analysis' using errcode = '42501';
  end if;

  select * into n from public.ncrs where id = p_id and archived_at is null for update;
  if not found then raise exception 'Case not found' using errcode = 'PT404'; end if;
  if n.status in ('closed','rejected') then
    raise exception 'This case is read-only' using errcode = 'PT409';
  end if;
  if ver is not null and n.version <> ver then
    raise exception 'The case was changed by someone else. Reload and try again.' using errcode = 'PT409';
  end if;

  update public.ncrs set
    rca_method        = coalesce(payload->>'rcaMethod', rca_method),
    whys              = coalesce((select array_agg(x) from jsonb_array_elements_text(payload->'whys') x), whys),
    root_cause        = case when payload ? 'rootCause'        then public.bi_set(root_cause,        payload->>'rootCause',        lang) else root_cause        end,
    contributors      = case when payload ? 'contributors'     then public.bi_set(contributors,      payload->>'contributors',      lang) else contributors      end,
    verification_note = case when payload ? 'verificationNote' then public.bi_set(verification_note, payload->>'verificationNote', lang) else verification_note end,
    version = version + 1
  where id = p_id
  returning * into n;

  insert into public.events (ncr_id, at, actor, note)
  values (n.id, current_date, coalesce(public.my_name(), '—'),
    jsonb_build_object('ar','تحديث تحليل السبب الجذري','en','Root cause analysis updated'));

  return public.ncr_to_json(n);
end $$;

revoke execute on function public.update_analysis(bigint, jsonb) from public, anon;
grant  execute on function public.update_analysis(bigint, jsonb) to authenticated;

-- -----------------------------------------------------------
-- advance_ncr(p_id, p_to, p_note)
-- Moves a report to the next workflow step.
-- -----------------------------------------------------------
create or replace function public.advance_ncr(p_id bigint, p_to ncr_status, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
  n    public.ncrs;
  ok   boolean;
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();
  if role not in ('officer','manager') then
    raise exception 'You are not allowed to move this case' using errcode = '42501';
  end if;

  select * into n from public.ncrs where id = p_id and archived_at is null for update;
  if not found then raise exception 'Case not found' using errcode = 'PT404'; end if;

  -- Whitelist transitions
  ok := case n.status
    when 'reported'      then p_to in ('triage','rejected')
    when 'triage'        then p_to in ('investigation','rejected')
    when 'investigation' then p_to = 'capa'
    when 'capa'          then p_to = 'verification'
    when 'verification'  then p_to in ('closed','capa')
    when 'rejected'      then p_to = 'reported'
    else false end;
  if not ok then
    raise exception 'This step is not allowed' using errcode = 'PT409';
  end if;

  -- Role gates: close, reject or reopen needs manager
  if (p_to in ('closed','rejected') or n.status = 'rejected') and role <> 'manager' then
    raise exception 'Only a manager can do this' using errcode = '42501';
  end if;

  -- Business rules
  if p_to = 'capa' and n.status = 'investigation' and public.bi_empty(n.root_cause) then
    raise exception 'Add a root cause first' using errcode = 'PT422';
  end if;
  if p_to = 'verification' then
    if not exists (select 1 from public.capas where ncr_id = n.id) then
      raise exception 'Add at least one corrective action first' using errcode = 'PT422';
    end if;
    if exists (select 1 from public.capas where ncr_id = n.id and status = 'open') then
      raise exception 'Start all actions first' using errcode = 'PT422';
    end if;
  end if;
  if p_to = 'closed' then
    if public.bi_empty(n.verification_note) then
      raise exception 'Add an effectiveness note first' using errcode = 'PT422';
    end if;
    if exists (select 1 from public.capas where ncr_id = n.id and status not in ('done','verified')) then
      raise exception 'All actions must be completed first' using errcode = 'PT422';
    end if;
  end if;

  update public.ncrs set
    status    = p_to,
    closed_at = case when p_to = 'closed' then now() else closed_at end,
    version   = version + 1
  where id = p_id
  returning * into n;

  insert into public.events (ncr_id, at, actor, note)
  values (n.id, current_date, coalesce(public.my_name(), '—'),
    jsonb_build_object(
      'ar', coalesce(p_note, 'انتقال: ' || n.status::text || ' → ' || p_to::text),
      'en', coalesce(p_note, 'Moved: ' || n.status::text || ' → ' || p_to::text)
    ));

  return public.ncr_to_json(n);
end $$;

revoke execute on function public.advance_ncr(bigint, ncr_status, text) from public, anon;
grant  execute on function public.advance_ncr(bigint, ncr_status, text) to authenticated;

-- -----------------------------------------------------------
-- add_capa(p_ncr_id, payload)
-- Adds a corrective / preventive action to a report.
-- -----------------------------------------------------------
create or replace function public.add_capa(p_ncr_id bigint, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
  n    public.ncrs;
  c    public.capas;
  lang text := coalesce(payload->>'lang', 'ar');
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();
  if role not in ('officer','manager') then
    raise exception 'You are not allowed to add actions' using errcode = '42501';
  end if;

  select * into n from public.ncrs where id = p_ncr_id and archived_at is null;
  if not found then raise exception 'Case not found' using errcode = 'PT404'; end if;
  if n.status in ('closed','rejected') then
    raise exception 'Cannot add actions to a closed or rejected case' using errcode = 'PT409';
  end if;

  if trim(coalesce(payload->>'action','')) = '' then
    raise exception 'action is required' using errcode = 'PT422';
  end if;

  insert into public.capas (ncr_id, type, action, owner_name, due_date, status)
  values (
    n.id,
    coalesce(payload->>'type', 'corrective'),
    public.bi_set(null, payload->>'action', lang),
    coalesce(payload->>'ownerName', ''),
    coalesce((payload->>'dueDate')::date, n.due_date),
    'open'
  )
  returning * into c;

  insert into public.events (ncr_id, at, actor, note)
  values (n.id, current_date, coalesce(public.my_name(), '—'),
    jsonb_build_object('ar','إضافة إجراء','en','Action added'));

  return public.capa_to_json(c);
end $$;

revoke execute on function public.add_capa(bigint, jsonb) from public, anon;
grant  execute on function public.add_capa(bigint, jsonb) to authenticated;

-- -----------------------------------------------------------
-- set_capa_status(p_id, p_status)
-- Updates an action's status.
-- -----------------------------------------------------------
create or replace function public.set_capa_status(p_id bigint, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
  c    public.capas;
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();
  if role not in ('officer','manager') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_status not in ('open','in_progress','done','verified') then
    raise exception 'Invalid status' using errcode = 'PT422';
  end if;
  if p_status = 'verified' and role <> 'manager' then
    raise exception 'Only a manager can mark an action as verified' using errcode = '42501';
  end if;

  update public.capas set status = p_status where id = p_id
  returning * into c;
  if not found then raise exception 'Action not found' using errcode = 'PT404'; end if;

  return public.capa_to_json(c);
end $$;

revoke execute on function public.set_capa_status(bigint, text) from public, anon;
grant  execute on function public.set_capa_status(bigint, text) to authenticated;

-- -----------------------------------------------------------
-- add_evidence(p_ncr_id, p_path, p_name)
-- Registers a file that was already uploaded to Storage.
-- -----------------------------------------------------------
create or replace function public.add_evidence(p_ncr_id bigint, p_path text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
  n    public.ncrs;
  ev   public.evidence;
  kind text;
  ext  text;
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();

  select * into n from public.ncrs where id = p_ncr_id and archived_at is null
    and (role in ('officer','manager') or created_by = uid);
  if not found then raise exception 'Case not found' using errcode = 'PT404'; end if;
  if n.status in ('closed','rejected') then
    raise exception 'Cannot attach evidence to a closed or rejected case' using errcode = 'PT409';
  end if;

  -- Max 20 files per report
  if (select count(*) from public.evidence where ncr_id = p_ncr_id) >= 20 then
    raise exception 'Maximum 20 files per case' using errcode = 'PT422';
  end if;

  -- Derive kind from extension
  ext := lower(reverse(split_part(reverse(p_name), '.', 1)));
  kind := case
    when ext in ('jpg','jpeg','png','webp','gif') then 'image'
    when ext in ('mp4','mov','avi','webm') then 'video'
    else 'file' end;

  insert into public.evidence (ncr_id, kind, name, path, created_by)
  values (p_ncr_id, kind, p_name, p_path, uid)
  returning * into ev;

  insert into public.events (ncr_id, at, actor, note)
  values (p_ncr_id, current_date, coalesce(public.my_name(), '—'),
    jsonb_build_object('ar','إرفاق دليل','en','Evidence attached'));

  return jsonb_build_object('id',ev.id,'kind',ev.kind,'name',ev.name,'path',ev.path,'caption',ev.name);
end $$;

revoke execute on function public.add_evidence(bigint, text, text) from public, anon;
grant  execute on function public.add_evidence(bigint, text, text) to authenticated;

-- -----------------------------------------------------------
-- archive_ncr(p_id)
-- Soft-deletes a report (Manager only).
-- -----------------------------------------------------------
create or replace function public.archive_ncr(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid  uuid := auth.uid();
  role public.app_role;
begin
  if uid is null then raise exception 'Login required' using errcode = '42501'; end if;
  role := public.my_role();
  if role <> 'manager' then
    raise exception 'Only a manager can archive cases' using errcode = '42501';
  end if;

  update public.ncrs set archived_at = now() where id = p_id and archived_at is null;
  if not found then raise exception 'Case not found' using errcode = 'PT404'; end if;

  return '{"ok":true}'::jsonb;
end $$;

revoke execute on function public.archive_ncr(bigint) from public, anon;
grant  execute on function public.archive_ncr(bigint) to authenticated;
