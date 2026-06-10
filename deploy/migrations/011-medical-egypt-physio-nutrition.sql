-- Egypt patient fields + physiotherapy + clinical nutrition modules
-- Apply: ./deploy/migrate-tenants.sh deploy/migrations/011-medical-egypt-physio-nutrition.sql

ALTER TABLE patients ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS governorate_ar TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city_ar TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation_ar TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_provider_ar TEXT;

CREATE TABLE IF NOT EXISTS physio_assessments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  therapist_id INTEGER,
  assessment_date DATE NOT NULL,
  body_region TEXT,
  body_region_ar TEXT,
  pain_scale INTEGER,
  rom_notes TEXT,
  rom_notes_ar TEXT,
  diagnosis TEXT,
  diagnosis_ar TEXT,
  goals TEXT,
  goals_ar TEXT,
  contraindications TEXT,
  notes TEXT,
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS physio_exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  category TEXT,
  body_region TEXT,
  instructions TEXT,
  instructions_ar TEXT,
  duration_minutes INTEGER,
  active TEXT NOT NULL DEFAULT 'true',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS physio_treatment_plans (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  assessment_id INTEGER,
  therapist_id INTEGER,
  title TEXT NOT NULL,
  title_ar TEXT,
  sessions_planned INTEGER NOT NULL DEFAULT 10,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  frequency_per_week INTEGER DEFAULT 2,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS physio_sessions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  plan_id INTEGER,
  therapist_id INTEGER,
  session_date TIMESTAMPTZ NOT NULL,
  session_number INTEGER,
  body_region TEXT,
  pain_before INTEGER,
  pain_after INTEGER,
  modalities TEXT,
  modalities_ar TEXT,
  exercises_performed TEXT,
  exercises_performed_ar TEXT,
  home_program TEXT,
  home_program_ar TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  fee_egp REAL DEFAULT 0,
  notes TEXT,
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_food_catalog (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  category TEXT,
  serving_size TEXT,
  calories_kcal REAL,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  notes TEXT,
  active TEXT NOT NULL DEFAULT 'true',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_assessments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  dietitian_id INTEGER,
  assessment_date DATE NOT NULL,
  weight_kg REAL,
  height_cm REAL,
  bmi REAL,
  waist_cm REAL,
  activity_level TEXT,
  medical_conditions TEXT,
  medical_conditions_ar TEXT,
  allergies TEXT,
  dietary_restrictions TEXT,
  goals TEXT,
  goals_ar TEXT,
  notes TEXT,
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_meal_plans (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  assessment_id INTEGER,
  dietitian_id INTEGER,
  title TEXT NOT NULL,
  title_ar TEXT,
  daily_calories_target REAL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  notes_ar TEXT,
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_meal_plan_items (
  id SERIAL PRIMARY KEY,
  meal_plan_id INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  food_name_ar TEXT,
  portion TEXT,
  calories_kcal REAL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_consultations (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  meal_plan_id INTEGER,
  dietitian_id INTEGER,
  consultation_date TIMESTAMPTZ NOT NULL,
  weight_kg REAL,
  adherence_score INTEGER,
  summary TEXT,
  summary_ar TEXT,
  recommendations TEXT,
  recommendations_ar TEXT,
  fee_egp REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  branch_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
