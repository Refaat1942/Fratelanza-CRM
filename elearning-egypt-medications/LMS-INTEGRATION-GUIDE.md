# LMS Integration Guide — Upload to Your E-Learning Site
# دليل ربط المنصة — رفع الدورات على موقع التعلم الإلكتروني

---

## Quick start (any platform)

### Step 1 — Create course shell
For each of the 8 courses in `COURSE-CATALOG.md`:
- **Course title:** Copy from catalog (Arabic + English)
- **Description:** Copy from `courses/XX-name/course-overview.md`
- **Duration:** As listed in catalog
- **Thumbnail:** Use therapeutic class icon (heart, pill, etc.)

### Step 2 — Upload lessons
Each lesson is a `.md` file in `courses/XX-name/lessons/`:
- Convert to HTML or paste into LMS rich text editor
- Set lesson duration from file header (`Duration: 20 min`)
- Add learning objectives to lesson intro field

### Step 3 — Import quizzes
From each lesson's `## Lesson Quiz` section:
- Create 10 multiple-choice questions per lesson
- Set pass mark: **70%**
- Enable 3 attempts maximum
- Show correct answers after submission

### Step 4 — Certificate
Issue certificate when:
- All 8 courses marked complete
- Final exam from `assessments/MASTER-QUIZ-BANK.md` passed at ≥75%

---

## Moodle-specific instructions

### Upload lessons
1. Create course → Add section per lesson
2. Add **Page** resource → paste lesson HTML
3. Or use **Book** module for multi-section lessons

### Import quizzes (GIFT format)
Create `lesson-01-quiz.gift` from lesson quiz:

```gift
::Q1.1.1:: ACE inhibitors work by inhibiting which enzyme? {
=Angiotensin-converting enzyme
~Angiotensin receptor
~Renin
~Beta-adrenergic receptor
}
```

Import: Question bank → Import → GIFT format

### Completion tracking
- Enable completion: View lesson + Pass quiz
- Course completion: All activities complete

---

## Teachable / Thinkific

| LMS field | Source |
|---|---|
| Section title | Lesson title from MD file |
| Lecture text | Lesson body (convert MD → HTML) |
| Quiz | 10 MCQ from lesson quiz section |
| Drip content | 1 lesson per day (optional) |
| Pricing | Set per course or bundle all 8 |

**MD to HTML conversion:**
```bash
pandoc lesson-01.md -o lesson-01.html
# Or use: https://markdowntohtml.com
```

---

## Custom LMS (API import)

Use `platform/course-manifest.json`:

```json
{
  "courses": [{
    "id": "EG-MED-01",
    "title_en": "Cardiovascular Medications in Egypt",
    "title_ar": "أدوية القلب والأوعية الدموية في مصر",
    "lessons": ["lesson-01", "lesson-02", ...],
    "duration_hours": 12,
    "quiz_pass_percent": 70
  }]
}
```

Map fields to your database: `courses`, `lessons`, `questions`, `options`.

---

## Video production (optional)

Each lesson is written as a **video script** (~1,500–2,500 words = 15–25 min narration).

**Suggested video format:**
1. Title slide (30 sec)
2. Learning objectives (1 min)
3. Mechanism animation or diagram (3–5 min)
4. Egyptian brands table walkthrough (5 min)
5. Counseling role-play in Arabic (3 min)
6. Case scenario (3 min)
7. Key takeaways (1 min)
8. Quiz prompt (30 sec)

**Tools:** OBS Studio (free), Canva for slides, ElevenLabs or human narrator for Arabic VO.

---

## Recommended e-learning site structure

```
Homepage
├── Course Catalog (8 courses)
├── Drug Index (searchable A-Z)
├── Certification Path
├── For Pharmacies (team enrollment)
└── Admin Dashboard
    ├── User progress
    ├── Quiz analytics
    └── Certificate issuance
```

---

## Pricing suggestion (for your site)

| Package | Content | Suggested EGP |
|---|---|---|
| Single course | 1 course + quiz | 299–499 |
| Professional bundle | All 8 courses | 1,999–2,999 |
| Pharmacy team (5 users) | All 8 + admin dashboard | 7,999 |
| Certificate exam only | Final exam retake | 199 |

---

## Technical checklist before launch

- [ ] All 52 lessons uploaded and proofread
- [ ] All quizzes tested (correct answer keys verified)
- [ ] Arabic RTL rendering works on mobile
- [ ] Drug index searchable
- [ ] Certificate PDF auto-generates with name + date
- [ ] Progress saves across sessions
- [ ] Disclaimer: "For professional education only, not medical advice"
- [ ] Privacy policy for trainee data
- [ ] Content attribution and references page

---

## Legal disclaimer (add to every course page)

> *This course is for professional education purposes only. It does not replace clinical judgment, physician consultation, or official EDA prescribing information. Drug availability and prices in the Egyptian market change regularly — verify with current EDA database and manufacturer SPCs.*

> *هذه الدورة للتعليم المهني فقط. لا تغني عن الحكم السريري أو استشارة الطبيب أو النشرة الرسمية لهيئة الدواء المصرية.*
