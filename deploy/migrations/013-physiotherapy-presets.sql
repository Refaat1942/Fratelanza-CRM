-- Migration 013: Physiotherapy specialization presets
-- Seeds the physiotherapy diagnoses + clinical features into an EXISTING tenant.
--
-- Why this migration exists:
--   Provisioning only seeds diagnoses_master / medical_features_master when those
--   tables are EMPTY (see fratelanza-admin/src/provision.ts). A tenant that was
--   already provisioned for another specialization will NOT pick up physiotherapy
--   data by re-provisioning. This migration inserts it idempotently instead.
--
-- Safe to re-run (every INSERT is guarded by WHERE NOT EXISTS).
-- New tenants provisioned as "physiotherapy" get this data automatically via provision.ts.
--
-- Apply per tenant:
--   docker compose exec -T db psql -U fratelanza -d <tenant_db> < deploy/migrations/013-physiotherapy-presets.sql

BEGIN;

-- ---------- Diagnoses (idempotent by code) ----------
INSERT INTO diagnoses_master (code, name, name_ar, specialization, active)
SELECT v.code, v.name, v.name_ar, 'physiotherapy', 1
FROM (VALUES
  ('PHY-001', 'Mechanical low back pain',             'ألم أسفل الظهر الميكانيكي'),
  ('PHY-002', 'Cervical spondylosis',                 'خشونة الفقرات العنقية'),
  ('PHY-003', 'Frozen shoulder (adhesive capsulitis)','الكتف المتجمد'),
  ('PHY-004', 'Knee osteoarthritis',                  'خشونة الركبة'),
  ('PHY-005', 'Post-operative rehabilitation (ACL)',  'تأهيل بعد جراحة الرباط الصليبي'),
  ('PHY-006', 'Stroke rehabilitation (hemiplegia)',   'تأهيل بعد السكتة الدماغية (شلل نصفي)'),
  ('PHY-007', 'Sciatica / radiculopathy',             'عرق النسا / اعتلال جذور عصبية'),
  ('PHY-008', 'Sports injury — muscle strain',        'إصابة رياضية — شد عضلي'),
  ('PHY-009', 'Postural dysfunction',                 'اختلال وضعية الجسم'),
  ('PHY-010', 'Bell''s palsy (facial rehabilitation)','شلل الوجه النصفي (تأهيل)'),
  ('PHY-011', 'Cerebral palsy — pediatric',           'الشلل الدماغي — أطفال'),
  ('PHY-012', 'Balance & gait disorder',              'اضطراب التوازن والمشي')
) AS v(code, name, name_ar)
WHERE NOT EXISTS (
  SELECT 1 FROM diagnoses_master d WHERE d.code = v.code
);

-- ---------- Clinical features (idempotent by category + name + specialization) ----------
INSERT INTO medical_features_master (category, name, name_ar, specialization, active)
SELECT v.category, v.name, v.name_ar, 'physiotherapy', 1
FROM (VALUES
  ('assessment', 'Range of motion (ROM) assessment',   'تقييم مدى الحركة'),
  ('assessment', 'Manual muscle testing (MMT)',         'اختبار قوة العضلات اليدوي'),
  ('assessment', 'Pain scale (VAS)',                    'مقياس الألم'),
  ('assessment', 'Posture & gait analysis',             'تحليل الوضعية والمشي'),
  ('assessment', 'Functional independence (ADL) score', 'تقييم الأنشطة اليومية'),
  ('assessment', 'Balance assessment',                  'تقييم التوازن'),
  ('modality',   'Ultrasound therapy',                  'علاج بالموجات فوق الصوتية'),
  ('modality',   'TENS / electrical stimulation',       'تنبيه كهربائي للأعصاب'),
  ('modality',   'Infrared / heat therapy',             'علاج بالأشعة تحت الحمراء / الحرارة'),
  ('modality',   'Cryotherapy / cold pack',             'علاج بالتبريد / كمادات باردة'),
  ('modality',   'Laser therapy',                       'علاج بالليزر'),
  ('modality',   'Shockwave therapy',                   'علاج بالموجات التصادمية'),
  ('modality',   'Traction (cervical / lumbar)',        'شد فقري (عنقي / قطني)'),
  ('exercise',   'Therapeutic exercise program',        'برنامج تمارين علاجية'),
  ('exercise',   'Stretching program',                  'برنامج تمارين إطالة'),
  ('exercise',   'Strengthening / resistance training', 'تمارين تقوية ومقاومة'),
  ('exercise',   'Gait training',                       'تدريب المشي'),
  ('exercise',   'Balance & proprioception training',   'تدريب التوازن والإحساس العميق'),
  ('manual',     'Manual therapy / mobilization',       'العلاج اليدوي / تحريك المفاصل'),
  ('manual',     'Soft tissue massage',                 'تدليك الأنسجة الرخوة'),
  ('manual',     'Myofascial release',                  'تحرير اللفافة العضلية')
) AS v(category, name, name_ar)
WHERE NOT EXISTS (
  SELECT 1 FROM medical_features_master m
  WHERE m.name = v.name AND m.specialization = 'physiotherapy'
);

COMMIT;
