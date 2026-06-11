/** Medical vertical presets — used when provisioning a tenant from the admin panel. */
export const SPECIALIZATION_KEYS = [
  "general",
  "gynecology",
  "osteology",
  "dental",
  "pediatrics",
  "cardiology",
  "dermatology",
] as const;

export type SpecializationKey = (typeof SPECIALIZATION_KEYS)[number];

export const SPECIALIZATION_LABELS: Record<SpecializationKey, { en: string; ar: string }> = {
  general: { en: "General Practice", ar: "طب عام" },
  gynecology: { en: "Gynecology & Obstetrics", ar: "نساء وتوليد" },
  osteology: { en: "Orthopedics / Osteology", ar: "عظام" },
  dental: { en: "Dental", ar: "أسنان" },
  pediatrics: { en: "Pediatrics", ar: "أطفال" },
  cardiology: { en: "Cardiology", ar: "قلب" },
  dermatology: { en: "Dermatology", ar: "جلدية" },
};

export type DiagnosisPreset = { code: string; name: string; nameAr: string };
export type MedicalFeaturePreset = { category: string; name: string; nameAr: string };

export type SpecializationPreset = {
  diagnoses: DiagnosisPreset[];
  features: MedicalFeaturePreset[];
};

const COMMON_FEATURES: MedicalFeaturePreset[] = [
  { category: "vitals", name: "Blood pressure", nameAr: "ضغط الدم" },
  { category: "vitals", name: "Heart rate", nameAr: "نبض القلب" },
  { category: "vitals", name: "Temperature", nameAr: "درجة الحرارة" },
  { category: "vitals", name: "Weight", nameAr: "الوزن" },
  { category: "vitals", name: "Height", nameAr: "الطول" },
  { category: "lab", name: "CBC", nameAr: "صورة دم كاملة" },
  { category: "lab", name: "Blood glucose", nameAr: "سكر الدم" },
  { category: "lab", name: "Lipid profile", nameAr: "دهون الدم" },
];

export const SPECIALIZATION_PRESETS: Record<SpecializationKey, SpecializationPreset> = {
  general: {
    diagnoses: [
      { code: "GEN-001", name: "Upper respiratory infection", nameAr: "التهاب الجهاز التنفسي العلوي" },
      { code: "GEN-002", name: "Hypertension", nameAr: "ارتفاع ضغط الدم" },
      { code: "GEN-003", name: "Type 2 diabetes mellitus", nameAr: "السكري النوع الثاني" },
      { code: "GEN-004", name: "Gastroenteritis", nameAr: "التهاب المعدة والأمعاء" },
      { code: "GEN-005", name: "Migraine", nameAr: "الصداع النصفي" },
      { code: "GEN-006", name: "Anemia", nameAr: "فقر الدم" },
      { code: "GEN-007", name: "Urinary tract infection", nameAr: "التهاب المسالك البولية" },
    ],
    features: [...COMMON_FEATURES],
  },
  gynecology: {
    diagnoses: [
      { code: "GYN-001", name: "Pregnancy — routine antenatal care", nameAr: "حمل — متابعة روتينية" },
      { code: "GYN-002", name: "Polycystic ovary syndrome (PCOS)", nameAr: "متلازمة تكيس المبايض" },
      { code: "GYN-003", name: "Dysmenorrhea", nameAr: "عسر الطمث" },
      { code: "GYN-004", name: "Menorrhagia", nameAr: "غزارة الطمث" },
      { code: "GYN-005", name: "Pelvic inflammatory disease", nameAr: "التهاب الحوض" },
      { code: "GYN-006", name: "Uterine fibroids", nameAr: "أورام ليفية رحمية" },
      { code: "GYN-007", name: "Cervicitis", nameAr: "التهاب عنق الرحم" },
      { code: "GYN-008", name: "Infertility workup", nameAr: "فحص العقم" },
    ],
    features: [
      ...COMMON_FEATURES,
      { category: "exam", name: "Pelvic examination", nameAr: "فحص حوض" },
      { category: "exam", name: "Breast examination", nameAr: "فحص الثدي" },
      { category: "imaging", name: "Pelvic ultrasound", nameAr: "سونار حوض" },
      { category: "imaging", name: "Obstetric ultrasound", nameAr: "سونار حمل" },
      { category: "lab", name: "Pap smear", nameAr: "مسحة عنق الرحم" },
      { category: "lab", name: "Beta-hCG", nameAr: "هرمون الحمل" },
      { category: "procedure", name: "IUD insertion", nameAr: "تركيب لولب" },
      { category: "procedure", name: "Colposcopy", nameAr: "منظار عنق الرحم" },
    ],
  },
  osteology: {
    diagnoses: [
      { code: "ORT-001", name: "Knee osteoarthritis", nameAr: "خشونة الركبة" },
      { code: "ORT-002", name: "Lumbar disc herniation", nameAr: "انزلاق غضروفي قطني" },
      { code: "ORT-003", name: "Rotator cuff tear", nameAr: "تمزق الكفة المدورة" },
      { code: "ORT-004", name: "Ankle sprain", nameAr: "التواء الكاحل" },
      { code: "ORT-005", name: "Fracture — closed", nameAr: "كسر مغلق" },
      { code: "ORT-006", name: "Carpal tunnel syndrome", nameAr: "متلازمة النفق الرسغي" },
      { code: "ORT-007", name: "Plantar fasciitis", nameAr: "التهاب اللفافة الأخمصية" },
      { code: "ORT-008", name: "Tennis elbow", nameAr: "مرفق التنس" },
    ],
    features: [
      ...COMMON_FEATURES,
      { category: "exam", name: "Range of motion assessment", nameAr: "تقييم مدى الحركة" },
      { category: "exam", name: "Neurological exam — limb", nameAr: "فحص عصبي للطرف" },
      { category: "imaging", name: "X-ray", nameAr: "أشعة سينية" },
      { category: "imaging", name: "MRI", nameAr: "رنين مغناطيسي" },
      { category: "imaging", name: "CT scan", nameAr: "أشعة مقطعية" },
      { category: "procedure", name: "Joint injection", nameAr: "حقن مفصل" },
      { category: "procedure", name: "Cast / splint application", nameAr: "جبيرة / جبس" },
      { category: "procedure", name: "Physical therapy referral", nameAr: "إحالة علاج طبيعي" },
    ],
  },
  dental: {
    diagnoses: [
      { code: "DEN-001", name: "Dental caries", nameAr: "تسوس الأسنان" },
      { code: "DEN-002", name: "Gingivitis", nameAr: "التهاب اللثة" },
      { code: "DEN-003", name: "Periodontitis", nameAr: "التهاب دواعم السن" },
      { code: "DEN-004", name: "Pulpitis", nameAr: "التهاب لب السن" },
      { code: "DEN-005", name: "Periapical abscess", nameAr: "خراج ذروي" },
      { code: "DEN-006", name: "Impacted wisdom tooth", nameAr: "ضرس عقل مطمور" },
      { code: "DEN-007", name: "Malocclusion", nameAr: "سوء إطباق" },
    ],
    features: [
      ...COMMON_FEATURES,
      { category: "exam", name: "Intraoral examination", nameAr: "فحص داخل الفم" },
      { category: "exam", name: "Periodontal charting", nameAr: "رسم اللثة" },
      { category: "imaging", name: "Periapical X-ray", nameAr: "أشعة ذروية" },
      { category: "imaging", name: "Panoramic X-ray", nameAr: "أشعة بانوراما" },
      { category: "procedure", name: "Scaling & polishing", nameAr: "تنظيف وتلميع" },
      { category: "procedure", name: "Root canal treatment", nameAr: "علاج عصب" },
      { category: "procedure", name: "Extraction", nameAr: "خلع" },
      { category: "procedure", name: "Composite filling", nameAr: "حشو تجميلي" },
    ],
  },
  pediatrics: {
    diagnoses: [
      { code: "PED-001", name: "Acute otitis media", nameAr: "التهاب الأذن الوسطى" },
      { code: "PED-002", name: "Bronchiolitis", nameAr: "التهاب الشعب الهوائية الدقيقة" },
      { code: "PED-003", name: "Febrile seizure", nameAr: "تشنج حموي" },
      { code: "PED-004", name: "Atopic dermatitis", nameAr: "التهاب الجلد التأتبي" },
      { code: "PED-005", name: "Failure to thrive", nameAr: "قصور النمو" },
      { code: "PED-006", name: "Asthma — pediatric", nameAr: "ربو أطفال" },
    ],
    features: [
      ...COMMON_FEATURES,
      { category: "exam", name: "Growth chart percentile", nameAr: "منحنى النمو" },
      { category: "exam", name: "Developmental screening", nameAr: "فحص النمو والتطور" },
      { category: "vaccine", name: "Routine immunization", nameAr: "تطعيم روتيني" },
      { category: "lab", name: "Stool analysis", nameAr: "تحليل براز" },
    ],
  },
  cardiology: {
    diagnoses: [
      { code: "CAR-001", name: "Atrial fibrillation", nameAr: "رجفان أذيني" },
      { code: "CAR-002", name: "Heart failure", nameAr: "قصور القلب" },
      { code: "CAR-003", name: "Stable angina", nameAr: "ذبحة صدرية مستقرة" },
      { code: "CAR-004", name: "Hypertensive heart disease", nameAr: "مرض قلبي ارتفاع ضغط" },
      { code: "CAR-005", name: "Valvular heart disease", nameAr: "مرض صمامات القلب" },
    ],
    features: [
      ...COMMON_FEATURES,
      { category: "exam", name: "ECG", nameAr: "تخطيط قلب" },
      { category: "exam", name: "Echocardiography", nameAr: "إيكو قلب" },
      { category: "imaging", name: "Stress test", nameAr: "اختبار جهد" },
      { category: "lab", name: "Troponin", nameAr: "تروبونين" },
      { category: "lab", name: "BNP", nameAr: "ببتيد natriuretic" },
    ],
  },
  dermatology: {
    diagnoses: [
      { code: "DER-001", name: "Acne vulgaris", nameAr: "حب الشباب" },
      { code: "DER-002", name: "Psoriasis", nameAr: "صدفية" },
      { code: "DER-003", name: "Eczema / atopic dermatitis", nameAr: "إكزيما" },
      { code: "DER-004", name: "Fungal skin infection", nameAr: "فطريات جلدية" },
      { code: "DER-005", name: "Urticaria", nameAr: "شرى" },
      { code: "DER-006", name: "Melasma", nameAr: "كلف" },
    ],
    features: [
      ...COMMON_FEATURES,
      { category: "exam", name: "Dermoscopy", nameAr: "فحص جلدي بالمنظار" },
      { category: "exam", name: "Skin biopsy", nameAr: "خزعة جلد" },
      { category: "procedure", name: "Cryotherapy", nameAr: "علاج بالتجميد" },
      { category: "procedure", name: "Chemical peel", nameAr: "تقشير كيميائي" },
    ],
  },
};

export function isSpecializationKey(v: string): v is SpecializationKey {
  return (SPECIALIZATION_KEYS as readonly string[]).includes(v);
}
