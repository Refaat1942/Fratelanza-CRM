# Pharmacy Team Training — PowerPoint Presentations
# تدريب فريق الصيدلية — عروض PowerPoint

Complete bilingual (English + Arabic) training materials for pharmacy staff.
**Not tied to any software or system** — general pharmacy professional training.

مواد تدريبية كاملة ثنائية اللغة (إنجليزي + عربي) لموظفي الصيدليات.
**غير مرتبطة بأي برنامج أو نظام** — تدريب مهني عام في الصيدلة.

---

## Presentations / العروض التقديمية

All files are in the `presentations/` folder. Open with Microsoft PowerPoint, Google Slides, or LibreOffice Impress.

| # | File | Topic | Slides | Duration |
|---|---|---|---|---|
| 1 | `01-introduction-to-pharmacy-practice.pptx` | Introduction to Pharmacy Practice / مقدمة في مهنة الصيدلة | ~18 | 45 min |
| 2 | `02-reading-prescriptions.pptx` | Reading & Validating Prescriptions / قراءة الروشتة والتحقق منها | ~16 | 45 min |
| 3 | `03-safe-medication-dispensing.pptx` | Safe Medication Dispensing / صرف الأدوية بأمان | ~17 | 45 min |
| 4 | `04-patient-counseling.pptx` | Patient Counseling / استشارة وإرشاد المريض | ~16 | 40 min |
| 5 | `05-drug-storage-and-expiry.pptx` | Drug Storage & Expiry / تخزين الأدوية وإدارة الصلاحية | ~16 | 40 min |
| 6 | `06-otc-medications.pptx` | OTC Medications & Self-Care / الأدوية بدون روشتة | ~16 | 40 min |
| 7 | `07-drug-interactions.pptx` | Drug Interactions / التفاعلات الدوائية | ~15 | 40 min |
| 8 | `08-customer-service.pptx` | Customer Service Excellence / التميز في خدمة العملاء | ~16 | 35 min |
| 9 | `09-hygiene-infection-control.pptx` | Hygiene & Infection Control / النظافة ومكافحة العدوى | ~15 | 35 min |
| 10 | `10-controlled-meds-and-legal.pptx` | Controlled Meds & Legal / الأدوية المراقبة والمسؤوليات القانونية | ~16 | 40 min |

**Total training time: ~6.5 hours** (can be split across 2-3 days)

---

## Recommended training schedule / جدول التدريب المقترح

### Day 1 — Foundations (2.5 hours)
- Module 1: Introduction to Pharmacy Practice
- Module 2: Reading Prescriptions
- Module 3: Safe Medication Dispensing

### Day 2 — Patient Care (2 hours)
- Module 4: Patient Counseling
- Module 6: OTC Medications
- Module 7: Drug Interactions

### Day 3 — Operations & Compliance (2 hours)
- Module 5: Drug Storage & Expiry
- Module 8: Customer Service
- Module 9: Hygiene & Infection Control
- Module 10: Controlled Medications & Legal

---

## Who should attend each module / من يحضر كل وحدة

| Module | Pharmacist | Assistant | Cashier | Manager |
|---|:---:|:---:|:---:|:---:|
| 1 — Introduction | ✅ | ✅ | ✅ | ✅ |
| 2 — Prescriptions | ✅ | ✅ | — | ✅ |
| 3 — Dispensing | ✅ | ✅ | — | ✅ |
| 4 — Counseling | ✅ | ✅ | — | ✅ |
| 5 — Storage | ✅ | ✅ | — | ✅ |
| 6 — OTC | ✅ | ✅ | ✅ | ✅ |
| 7 — Interactions | ✅ | — | — | ✅ |
| 8 — Customer Service | ✅ | ✅ | ✅ | ✅ |
| 9 — Hygiene | ✅ | ✅ | ✅ | ✅ |
| 10 — Legal | ✅ | — | — | ✅ |

---

## How to use / كيفية الاستخدام

1. **Download** the `.pptx` files from `presentations/`
2. **Open** in PowerPoint or Google Slides
3. **Present** to your team — each slide has English title + Arabic translation
4. **Customize** — add your pharmacy name/logo on the title slides
5. **Practice** — use the exercises at the end of each module

### To regenerate presentations

```bash
pip install python-pptx
python3 generate_presentations.py
```

Edit content in `deck_content_part1.py`, `deck_content_part2.py`, `deck_content_part3.py`.

---

## Tips for trainers / نصائح للمدربين

- Present in **Arabic** — the English text is for reference
- Use **real examples** from your pharmacy (drug names, scenarios)
- Do **role-play exercises** for customer service and counseling modules
- Print the bullet points as **handouts** for trainees
- Quiz staff after each module to confirm understanding
- Schedule **refresher sessions** every 6 months

---

## Customization / التخصيص

To add your pharmacy branding:
1. Open any `.pptx` in PowerPoint
2. Go to **View → Slide Master**
3. Add your logo and pharmacy name
4. Save as a template for all modules

To edit content:
1. Edit the Python content files (`deck_content_part*.py`)
2. Run `python3 generate_presentations.py`
3. New `.pptx` files are generated in `presentations/`
