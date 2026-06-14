# Egyptian Medications — E-Learning Course Platform
# الأدوية في السوق المصري — منصة التعلم الإلكتروني

> **Complete e-learning curriculum covering medications available in the Egyptian pharmaceutical market.**
> Designed for pharmacy teams, medical representatives, and healthcare professionals.

> **منهج تعليمي إلكتروني شامل يغطي الأدوية المتاحة في السوق الدوائي المصري.**
> مصمم لفرق الصيدليات، المندوبين الطبيين، والعاملين في الرعاية الصحية.

---

## 📖 Read the lessons / اقرأ الدروس

**Start here:** **[READING-GUIDE.md](./READING-GUIDE.md)**

| How to read | File |
|---|---|
| **One file per course (easiest)** | `full-curriculum/COURSE-01-cardiovascular.md` … `COURSE-08-womens-health.md` |
| **Everything in one file** | [FULL-CURRICULUM-ALL-LESSONS.md](./FULL-CURRICULUM-ALL-LESSONS.md) (52 lessons, ~7,200 lines) |
| **Lesson by lesson** | `courses/XX-name/lessons/lesson-XX.md` (52 files) |

---

## Platform-ready structure / هيكل جاهز للمنصة

```
elearning-egypt-medications/
├── README.md                          ← You are here
├── READING-GUIDE.md                   ← How to read all lessons
├── FULL-CURRICULUM-ALL-LESSONS.md     ← All 52 lessons in ONE file
├── full-curriculum/                   ← 8 files (one per course, all lessons merged)
├── COURSE-CATALOG.md                  ← Full course listing
├── LMS-INTEGRATION-GUIDE.md           ← How to upload to your e-learning site
├── platform/
│   └── course-manifest.json           ← Machine-readable course index
├── courses/
│   ├── 01-cardiovascular/             ← 8 lessons + final exam
│   ├── 02-antimicrobials/
│   ├── 03-diabetes/
│   ├── 04-cns-analgesics/
│   ├── 05-gi-respiratory/
│   ├── 06-otc-selfcare/
│   ├── 07-pediatrics/
│   └── 08-womens-health/
├── drug-index/
│   └── EGYPT-DRUG-INDEX.md            ← Master A-Z drug reference (Egypt brands)
└── assessments/
    └── MASTER-QUIZ-BANK.md            ← All quizzes + final certification exam
```

---

## 8 courses — summary

| # | Course | Lessons | Hours | Certificate |
|---|---|---|---|---|
| 1 | Cardiovascular Medications in Egypt | 8 | 12h | ✅ |
| 2 | Antimicrobials & Antivirals in Egypt | 8 | 14h | ✅ |
| 3 | Diabetes Medications in Egypt | 6 | 10h | ✅ |
| 4 | CNS, Analgesics & Psychotropics in Egypt | 8 | 12h | ✅ |
| 5 | GI & Respiratory Medications in Egypt | 6 | 10h | ✅ |
| 6 | OTC & Self-Care Products in Egypt | 5 | 8h | ✅ |
| 7 | Pediatric Medications in Egypt | 6 | 10h | ✅ |
| 8 | Women's Health & Obstetric Medications | 5 | 8h | ✅ |

**Total: 52 lessons | 84 contact hours | ~120 hours with self-study**

**Master certificate:** Complete all 8 courses + pass final exam (≥75%) → *"Egyptian Market Medications Specialist"*

---

## Each lesson includes / كل درس يتضمن

- ✅ Measurable learning objectives (Bloom's taxonomy)
- ✅ Estimated duration (video script timing: ~15–25 min read)
- ✅ Mechanism of action (scientific)
- ✅ Egyptian brand names + local manufacturers table
- ✅ Dosing, contraindications, interactions
- ✅ Patient counseling script (Arabic + English)
- ✅ Pharmacy practice scenarios (Egypt context)
- ✅ Lesson quiz (10 questions, auto-gradable)
- ✅ Key takeaways box
- ✅ References

---

## Target learners / المتعلمون المستهدفون

| Audience | Recommended courses |
|---|---|
| Pharmacy fresh graduates | All 8 courses |
| Community pharmacy assistants | 1, 2, 3, 6, 7 |
| Hospital pharmacists | All 8 |
| Medical representatives | All 8 (product knowledge focus) |
| Pharmacy owners/managers | All 8 + assessments |
| Nursing staff | 6, 7, 8 (selected lessons) |

---

## Language / اللغة

- **Primary content:** Arabic (مصري/فصحى) for counseling scripts and scenarios
- **Scientific terms:** English (international standard) with Arabic translation
- **Drug names:** Generic (INN) + Egyptian trade names

---

## E-learning platform compatibility

| Platform | Import method |
|---|---|
| **Moodle** | Upload lessons as Pages; import quiz from GIFT format (see assessments/) |
| **Teachable / Thinkific** | Copy lesson MD → lecture sections; quiz as multiple choice |
| **Custom LMS** | Use `course-manifest.json` for API import |
| **SCORM** | Convert MD → HTML → SCORM wrapper (see LMS-INTEGRATION-GUIDE.md) |

See **[LMS-INTEGRATION-GUIDE.md](./LMS-INTEGRATION-GUIDE.md)** for step-by-step upload instructions.

---

## Content update policy

- Review **quarterly** for EDA circulars and withdrawn products
- Update prices **annually** (EGP subject to market change)
- Flag new launches in Egyptian market in drug-index changelog

Last updated: **June 2026**
