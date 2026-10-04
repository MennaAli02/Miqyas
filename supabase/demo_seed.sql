-- ============================================================
-- demo_seed.sql
-- Insert realistic demo NCRs, CAPAs and events for presentation.
-- Run this ONCE in the Supabase SQL Editor after migrations are done.
--
-- It automatically picks the first user in auth.users (the anonymous
-- user the app created on first load) as the owner of all records.
-- ============================================================

do $$
declare
  uid      uuid;
  clause_7_1_5 bigint;
  clause_10_2  bigint;
  clause_8_4   bigint;
  clause_8_7   bigint;
  clause_7_5   bigint;
  clause_9_2   bigint;

  ncr1 bigint; ncr2 bigint; ncr3 bigint; ncr4 bigint;
  today date := current_date;
begin

  -- Pick the first (anonymous) user created by the app
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise exception 'No user found. Open the app first so an anonymous session is created, then run this script.';
  end if;

  -- Get clause IDs
  select id into clause_7_1_5 from public.clauses where code = '7.1.5' and standard = 'ISO 9001:2015';
  select id into clause_10_2  from public.clauses where code = '10.2'  and standard = 'ISO 9001:2015';
  select id into clause_8_4   from public.clauses where code = '8.4'   and standard = 'ISO 9001:2015';
  select id into clause_8_7   from public.clauses where code = '8.7'   and standard = 'ISO 9001:2015';
  select id into clause_7_5   from public.clauses where code = '7.5'   and standard = 'ISO 9001:2015';
  select id into clause_9_2   from public.clauses where code = '9.2'   and standard = 'ISO 9001:2015';

  -- -------------------------------------------------------
  -- NCR 1: CLOSED — Torque below tolerance (Production)
  -- -------------------------------------------------------
  insert into public.ncrs (
    ref, title, description, requirement, containment, disposition,
    severity, status, department, source, location,
    routing_note, owner_name,
    reporter_name, reported_at, due_date, closed_at,
    clause_id, rca_method, whys,
    root_cause, verification_note,
    created_by, version
  ) values (
    'NCR-2026-0001',
    '{"ar":"عزم الربط أقل من المسموح على الخط 2","en":"Torque below tolerance on line 2"}',
    '{"ar":"قيست البراغي أقل بـ 12% من المواصفة.","en":"Bolts measured 12% below spec."}',
    '{"ar":"عزم الربط 45–50 نيوتن متر","en":"Torque 45–50 Nm"}',
    '{"ar":"عزل الدفعة وإعادة الفحص.","en":"Batch isolated and re-inspected."}',
    'quarantine',
    'major', 'closed', 'production', 'process', 'Line 2',
    '{"ar":"إحالة إلى مدير الجودة لبدء التحقيق خلال 3 أيام عمل.","en":"Route to the Quality Manager to start investigation within 3 working days."}',
    '{"ar":"مشرف الإنتاج","en":"Production Supervisor"}',
    'Ahmed Al-Rashidi', today - 40, today - 40 + 14, now() - interval '25 days',
    clause_7_1_5, 'five_why', ARRAY['مفتاح العزم انجرف','لا يوجد جدول معايرة','لم يُحدَّد مسؤول للصيانة'],
    '{"ar":"مفتاح العزم غير معاير — انزياح تدريجي بدون فحص دوري.","en":"Torque wrench not calibrated — gradual drift with no periodic check."}',
    '{"ar":"لا تكرار خلال 3 أسابيع بعد المعايرة الكاملة لجميع الأدوات.","en":"No recurrence in 3 weeks after full recalibration of all tools."}',
    uid, 3
  ) returning id into ncr1;

  -- Events for NCR1
  insert into public.events (ncr_id, at, actor, note) values
    (ncr1, today - 40, 'Ahmed Al-Rashidi', '{"ar":"تم تسجيل عدم المطابقة","en":"Non-conformance reported"}'),
    (ncr1, today - 39, 'Sara Al-Otaibi',   '{"ar":"انتقال: reported → triage","en":"Moved: reported → triage"}'),
    (ncr1, today - 38, 'Sara Al-Otaibi',   '{"ar":"انتقال: triage → investigation","en":"Moved: triage → investigation"}'),
    (ncr1, today - 35, 'Sara Al-Otaibi',   '{"ar":"تحديث تحليل السبب الجذري","en":"Root cause analysis updated"}'),
    (ncr1, today - 33, 'Sara Al-Otaibi',   '{"ar":"انتقال: investigation → capa","en":"Moved: investigation → capa"}'),
    (ncr1, today - 30, 'Sara Al-Otaibi',   '{"ar":"إضافة إجراء","en":"Action added"}'),
    (ncr1, today - 28, 'Sara Al-Otaibi',   '{"ar":"انتقال: capa → verification","en":"Moved: capa → verification"}'),
    (ncr1, today - 25, 'Omar Al-Zahrani',  '{"ar":"انتقال: verification → closed — تم التحقق من الفعالية","en":"Moved: verification → closed — Effectiveness verified"}');

  -- CAPAs for NCR1
  insert into public.capas (ncr_id, type, action, owner_name, due_date, status) values
    (ncr1, 'corrective',
     '{"ar":"إعادة معايرة جميع مفاتيح العزم في الخط 2","en":"Recalibrate all torque wrenches on line 2"}',
     'Ahmed Al-Rashidi', today - 30, 'verified'),
    (ncr1, 'preventive',
     '{"ar":"إضافة جدول معايرة شهري وتحديد مسؤول الصيانة","en":"Add monthly calibration schedule and assign maintenance owner"}',
     'Sara Al-Otaibi', today - 20, 'verified');

  -- -------------------------------------------------------
  -- NCR 2: INVESTIGATION — Supplier delivered wrong material
  -- -------------------------------------------------------
  insert into public.ncrs (
    ref, title, description, containment, disposition,
    severity, status, department, source, location,
    routing_note, owner_name,
    reporter_name, reported_at, due_date,
    clause_id, rca_method, whys,
    created_by, version
  ) values (
    'NCR-2026-0002',
    '{"ar":"مورد سلّم درجة مادة خاطئة","en":"Supplier delivered wrong material grade"}',
    '{"ar":"الدفعة 4471 وصلت بدرجة B بدل A.","en":"Batch 4471 arrived as grade B instead of A."}',
    '{"ar":"الدفعة في الحجر — تم إخطار المورد","en":"Batch quarantined — supplier notified"}',
    'quarantine',
    'critical', 'investigation', 'procurement', 'supplier', 'Receiving Dock',
    '{"ar":"تصعيد فوري إلى الإدارة العليا وإشعار مدير الجودة خلال 24 ساعة.","en":"Escalate to top management and notify the Quality Manager within 24 hours."}',
    '{"ar":"مدير المشتريات","en":"Procurement Manager"}',
    'Khalid Bin Nasser', today - 12, today - 12 + 7,
    clause_8_4, 'fishbone', ARRAY['خطأ في تحديد المواصفة بأمر الشراء','المورد لم يراجع مستندات الجودة'],
    uid, 2
  ) returning id into ncr2;

  insert into public.events (ncr_id, at, actor, note) values
    (ncr2, today - 12, 'Khalid Bin Nasser', '{"ar":"تم تسجيل عدم المطابقة","en":"Non-conformance reported"}'),
    (ncr2, today - 11, 'Sara Al-Otaibi',    '{"ar":"انتقال: reported → triage","en":"Moved: reported → triage"}'),
    (ncr2, today - 10, 'Sara Al-Otaibi',    '{"ar":"انتقال: triage → investigation","en":"Moved: triage → investigation"}'),
    (ncr2, today - 8,  'Sara Al-Otaibi',    '{"ar":"إرفاق دليل","en":"Evidence attached"}');

  -- -------------------------------------------------------
  -- NCR 3: CAPA — Missing signature on calibration record
  -- -------------------------------------------------------
  insert into public.ncrs (
    ref, title, description, disposition,
    severity, status, department, source,
    routing_note, owner_name,
    reporter_name, reported_at, due_date,
    clause_id, rca_method, whys, root_cause,
    created_by, version
  ) values (
    'NCR-2026-0003',
    '{"ar":"توقيع ناقص في سجل المعايرة","en":"Missing signature on calibration record"}',
    '{"ar":"اكتُشف أثناء التدقيق الداخلي للمختبر — 3 سجلات بدون توقيع الفاحص الثاني.","en":"Found during lab internal audit — 3 records missing second reviewer signature."}',
    'na',
    'minor', 'capa', 'laboratory', 'internal_audit',
    '{"ar":"معالجة ضمن القسم المعني ومراجعتها في اجتماع الجودة الدوري.","en":"Handle within the department and review at the periodic quality meeting."}',
    '{"ar":"رئيس المختبر","en":"Lab Head"}',
    'Mona Al-Ghamdi', today - 5, today - 5 + 30,
    clause_7_5, 'five_why', ARRAY['النموذج لا يشترط التوقيع الثاني','لا توجد خطوة مراجعة رسمية','لم يُدرَّب الفريق على الإجراء المحدَّث'],
    '{"ar":"لا توجد خطوة مراجعة للسجل في الإجراء الحالي.","en":"No record review step exists in the current procedure."}',
    uid, 3
  ) returning id into ncr3;

  insert into public.events (ncr_id, at, actor, note) values
    (ncr3, today - 5, 'Mona Al-Ghamdi',  '{"ar":"تم تسجيل عدم المطابقة","en":"Non-conformance reported"}'),
    (ncr3, today - 4, 'Sara Al-Otaibi',  '{"ar":"انتقال: reported → triage","en":"Moved: reported → triage"}'),
    (ncr3, today - 3, 'Sara Al-Otaibi',  '{"ar":"انتقال: triage → investigation","en":"Moved: triage → investigation"}'),
    (ncr3, today - 2, 'Sara Al-Otaibi',  '{"ar":"تحديث تحليل السبب الجذري","en":"Root cause analysis updated"}'),
    (ncr3, today - 1, 'Sara Al-Otaibi',  '{"ar":"انتقال: investigation → capa","en":"Moved: investigation → capa"}'),
    (ncr3, today,     'Sara Al-Otaibi',  '{"ar":"إضافة إجراء","en":"Action added"}');

  insert into public.capas (ncr_id, type, action, owner_name, due_date, status) values
    (ncr3, 'corrective',
     '{"ar":"تحديث نموذج سجل المعايرة ليشترط توقيع مراجع ثانٍ","en":"Update calibration record form to require second reviewer signature"}',
     'Mona Al-Ghamdi', today + 10, 'in_progress'),
    (ncr3, 'preventive',
     '{"ar":"إضافة تدريب على الإجراء المحدَّث لجميع أفراد المختبر","en":"Add training on updated procedure for all lab staff"}',
     'Mona Al-Ghamdi', today + 20, 'open');

  -- -------------------------------------------------------
  -- NCR 4: REPORTED — Customer complaint closed late
  -- -------------------------------------------------------
  insert into public.ncrs (
    ref, title, description, disposition,
    severity, status, department, source,
    routing_note, owner_name,
    reporter_name, reported_at, due_date,
    clause_id, rca_method,
    created_by, version
  ) values (
    'NCR-2026-0004',
    '{"ar":"تأخر إغلاق شكوى عميل","en":"Customer complaint closed late"}',
    '{"ar":"تجاوز إغلاق الشكوى رقم C-2026-089 المدة المتفق عليها (5 أيام عمل) بمقدار 8 أيام.","en":"Complaint C-2026-089 closure exceeded the agreed SLA (5 working days) by 8 days."}',
    'na',
    'major', 'reported', 'quality', 'customer',
    '{"ar":"إحالة إلى مدير الجودة لبدء التحقيق خلال 3 أيام عمل.","en":"Route to the Quality Manager to start investigation within 3 working days."}',
    '{"ar":"مشرف الجودة","en":"Quality Supervisor"}',
    'Reem Al-Shehri', today, today + 14,
    clause_10_2, 'five_why',
    uid, 1
  ) returning id into ncr4;

  insert into public.events (ncr_id, at, actor, note) values
    (ncr4, today, 'Reem Al-Shehri', '{"ar":"تم تسجيل عدم المطابقة","en":"Non-conformance reported"}');

  -- -------------------------------------------------------
  -- NCR 5: TRIAGE — Expired reagent used in lab test
  -- -------------------------------------------------------
  insert into public.ncrs (
    ref, title, description, containment, disposition,
    severity, status, department, source, location,
    routing_note, owner_name,
    reporter_name, reported_at, due_date,
    clause_id, rca_method,
    created_by, version
  ) values (
    'NCR-2026-0005',
    '{"ar":"استخدام كاشف منتهي الصلاحية في فحص مختبري","en":"Expired reagent used in lab test"}',
    '{"ar":"تبيّن أن كاشف الجلوكوز المستخدم في 12 فحصاً الصباحية منتهي الصلاحية منذ 3 أيام.","en":"Glucose reagent used in 12 morning tests found expired by 3 days."}',
    '{"ar":"إيقاف الفحوصات المتأثرة وإعادة سحب العينات","en":"Affected tests halted and samples recollected"}',
    'quarantine',
    'critical', 'triage', 'laboratory', 'incident', 'Lab Section B',
    '{"ar":"تصعيد فوري إلى الإدارة العليا وإشعار مدير الجودة خلال 24 ساعة.","en":"Escalate to top management and notify the Quality Manager within 24 hours."}',
    '{"ar":"رئيس المختبر","en":"Lab Head"}',
    'Faisal Al-Dosari', today - 2, today - 2 + 7,
    clause_7_5, 'fishbone',
    uid, 2
  );

  insert into public.events (ncr_id, at, actor, note) values
    ((select id from public.ncrs where ref = 'NCR-2026-0005'),
     today - 2, 'Faisal Al-Dosari', '{"ar":"تم تسجيل عدم المطابقة","en":"Non-conformance reported"}'),
    ((select id from public.ncrs where ref = 'NCR-2026-0005'),
     today - 1, 'Sara Al-Otaibi', '{"ar":"انتقال: reported → triage","en":"Moved: reported → triage"}');

  -- Reset the ref sequence to start after our seeded data
  perform setval('public.ncr_ref_seq', 6);

  raise notice 'Demo data inserted successfully for user: %', uid;
end $$;
