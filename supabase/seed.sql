-- ============================================================
-- seed.sql
-- Standard clauses and demo data.
-- Run this after all migrations.
-- ============================================================

-- -----------------------------------------------------------
-- Standard clauses
-- -----------------------------------------------------------
insert into public.clauses (standard, code, title_ar, title_en, text_ar, text_en) values
  ('ISO 9001:2015', '8.7',   'التحكم في المخرجات غير المطابقة',            'Control of nonconforming outputs',              'تعريف المخرجات غير المطابقة ومنع استخدامها أو تسليمها عن غير قصد.',                                        'Identify nonconforming outputs and prevent their unintended use or delivery.'),
  ('ISO 9001:2015', '10.2',  'عدم المطابقة والإجراء التصحيحي',              'Nonconformity and corrective action',            'الاستجابة لعدم المطابقة والتحقق من السبب وتنفيذ الإجراء ومراجعة فعاليته.',                                   'React to the nonconformity, determine causes, act, and review effectiveness.'),
  ('ISO 9001:2015', '8.4',   'الرقابة على المنتجات والخدمات الموردة خارجياً','Control of externally provided products',        'ضمان أن العمليات والمنتجات الموردة تطابق المتطلبات.',                                                          'Ensure externally provided processes and products conform to requirements.'),
  ('ISO 9001:2015', '7.1.5', 'موارد المراقبة والقياس',                      'Monitoring and measuring resources',              'ضمان معايرة أدوات القياس والحفاظ عليها.',                                                                       'Ensure measuring equipment is calibrated and maintained.'),
  ('ISO 9001:2015', '9.2',   'التدقيق الداخلي',                              'Internal audit',                                  'إجراء تدقيق داخلي على فترات مخططة.',                                                                           'Conduct internal audits at planned intervals.'),
  ('ISO 9001:2015', '7.5',   'المعلومات الموثقة',                            'Documented information',                          'التحكم في الوثائق والسجلات المطلوبة.',                                                                          'Control the documents and records required.'),
  ('ISO 15189:2022','7.5',   'الأعمال غير المطابقة',                         'Nonconforming work',                              'سياسة وإجراء عند عدم مطابقة أي جانب من عمل المختبر.',                                                         'Policy and procedure when any aspect of laboratory work is nonconforming.'),
  ('ISO 13485:2016','8.3',   'التحكم في المنتج غير المطابق',                 'Control of nonconforming product',                'ضمان تحديد المنتج غير المطابق ومنع استخدامه.',                                                                  'Ensure nonconforming product is identified and prevented from use.')
on conflict (standard, code) do nothing;

-- -----------------------------------------------------------
-- NOTES ON DEMO DATA
-- -----------------------------------------------------------
-- Demo NCRs cannot be inserted here because they require a real
-- auth.users entry for the `created_by` column.
--
-- To create demo data:
-- 1. Create a test user in Supabase Auth (Dashboard → Authentication → Users).
-- 2. Note their UUID.
-- 3. Run the INSERT statements below, replacing '<YOUR_USER_UUID>'
--    with the real UUID, or use the RPC functions from the React app.
--
-- Example (run in the Supabase SQL Editor after creating a user):
--
-- insert into public.ncrs (
--   ref, title, description, disposition, severity, status, department,
--   source, reporter_name, reported_at, due_date, clause_id, rca_method,
--   whys, root_cause, verification_note, created_by
-- ) values (
--   'NCR-2026-0001',
--   '{"ar":"عزم الربط أقل من المسموح على الخط 2","en":"Torque below tolerance on line 2"}',
--   '{"ar":"قيست البراغي أقل بـ 12% من المواصفة.","en":"Bolts measured 12% below spec."}',
--   'quarantine', 'major', 'closed', 'production', 'process',
--   'Ahmed', current_date - 40, current_date - 40 + 14,
--   (select id from public.clauses where code='7.1.5' and standard='ISO 9001:2015'),
--   'five_why', ARRAY['Wrench drift','No calibration schedule'],
--   '{"ar":"مفتاح العزم غير معاير.","en":"Torque wrench not calibrated."}',
--   '{"ar":"لا تكرار خلال 3 أسابيع.","en":"No recurrence in 3 weeks."}',
--   '<YOUR_USER_UUID>'
-- );
