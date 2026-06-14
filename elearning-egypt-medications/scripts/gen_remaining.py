#!/usr/bin/env python3
"""Generate all remaining lesson files (courses 02-08)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lesson_builder import build_lesson, write_lesson

BASE = "/workspace/elearning-egypt-medications/courses"

# Helper for standard sections
def L(id, title_en, title_ar, objectives, body, takeaways, quiz, refs, next_link=None, course_next=None, prereq="See course overview"):
    return dict(lesson_id=id, title_en=title_en, title_ar=title_ar, objectives=objectives,
                body=body, takeaways=takeaways, quiz=quiz, refs=refs, next=next_link,
                course_next=course_next, prereq=prereq)

LESSONS = []

# ========== COURSE 02 remaining ==========
LESSONS.append(("02-antimicrobials", "lesson-03-macrolides-quinolones.md", L(
"EG-MED-02-L03",
"Lesson 2.3: Macrolides, Fluoroquinolones & Tetracyclines — Egyptian Market",
"الدرس 2.3: الماكروليدات والفلوروكينولونات والتتراسيكلين — السوق المصري",
["Explain **macrolide, fluoroquinolone, tetracycline** mechanisms",
 "Identify **Egyptian brands** — Zithromax, Ciprobay, Vibramycin, local generics",
 "Apply **AWaRe Watch** restrictions for fluoroquinolones",
 "Counsel on **QT prolongation, tendon rupture, photosensitivity** in Arabic",
 "Select appropriate agent for **atypical pneumonia, UTI, acne**"],
"""## 1. Macrolides

### Mechanism
Bind 50S ribosomal subunit → inhibit protein synthesis → bacteriostatic (bactericidal at high conc.)

| Generic | Brand (Egypt) | Manufacturer | Dosing | Approx. EGP |
|---|---|---|---|---|
| Azithromycin | Zithromax, Azithrocin | Pfizer / Pharco, Memphis | 500mg OD × 3 days | 80–200 |
| Clarithromycin | Klacid, Clabact | Abbott / generic | 500mg BD × 7 days | 150–350 |
| Erythromycin | Erythrocin | Limited | 250–500mg QDS | 40–100 |

**Indications:** Atypical pneumonia (Mycoplasma, Chlamydia), strep pharyngitis (penicillin allergy), H. pylori triple therapy.

**Interactions:** ↑ statin levels (myopathy); ↑ warfarin; ↑ QT with antiarrhythmics.

## 2. Fluoroquinolones (WHO AWaRe WATCH)

| Generic | Brand (Egypt) | Dosing | Key risks |
|---|---|---|---|
| Ciprofloxacin | Ciprobay, Ciprodar | 500mg BD × 3–7d (UTI) | Tendon rupture, QT, resistance |
| Levofloxacin | Tavanic, Levoxin | 500mg OD | Same; respiratory indications |
| Moxifloxacin | Avalox | 400mg OD | QT prolongation |

**Egyptian resistance:** High E. coli FQ resistance — avoid empiric cipro for uncomplicated UTI when alternatives exist.

**Contraindications:** Children <18 (cartilage), pregnancy, history of tendon disorder with FQ.

## 3. Tetracyclines

| Generic | Brand (Egypt) | Notes |
|---|---|---|
| Doxycycline | Vibramycin, Doxymycin | 100mg BD — acne, atypicals, malaria prophylaxis |
| Tetracycline | Generic | Cheaper; more GI upset |

**Counseling:** Avoid dairy/antacids/iron 2h before/after; photosensitivity — use sunscreen; contraindicated pregnancy/children <8 (teeth staining).

**Counseling script (Arabic):**
> "سيبروباي فعال بس بنستخدمه بحذر بسبب مقاومة البكتيريا في مصر. لو حسيت بألم في الوتر أو أوتار الركبة، وقف الدواء فوراً. الدوكسيسيكلين ممنوع في الحمل ويسبب حساسية للشمس — استخدم واقي شمس."

## 4. Pharmacy scenario
### Scenario 2.3 — Ciprofloxacin for uncomplicated UTI
> *Young woman, uncomplicated cystitis. Prescription: Ciprobay 500mg BD × 7 days. No prior cultures.*

**Response:** Flag for prescriber if possible — nitrofurantoin or cephalexin preferred per stewardship (E. coli FQ resistance). Counsel hydration; complete course if dispensed. Avoid antacids. Warn tendon pain.

""",
["Zithromax (azithromycin) — 3-day course popular in Egypt for RTI",
 "Ciprobay (ciprofloxacin) — AWaRe Watch; high UTI resistance in Egypt",
 "Avoid FQ in children, pregnancy, and when alternatives exist",
 "Doxycycline — photosensitivity and teeth staining counseling essential",
 "Macrolide + statin interaction — common Egyptian DDI",
 "Klacid used in H. pylori regimens with PPI and amoxicillin"],
[("Macrolides inhibit:", ["Cell wall synthesis", "50S ribosomal protein synthesis", "DNA gyrase", "Folate pathway"], 1),
 ("Egyptian azithromycin brand:", ["Ciprobay", "Zithromax", "Flagyl", "Ceporex"], 1),
 ("Fluoroquinolones WHO AWaRe category:", ["Access", "Watch", "Reserve", "OTC"], 1),
 ("FQ contraindicated in:", ["Elderly only", "Children <18 (cartilage toxicity)", "Hypertension", "Diabetes only"], 1),
 ("Doxycycline counseling includes:", ["Take with dairy always", "Photosensitivity risk", "Safe in pregnancy", "No food restrictions"], 1),
 ("Egyptian E. coli UTI — avoid empiric:", ["Cephalexin", "Nitrofurantoin", "Ciprofloxacin when resistance high", "Amoxicillin always"], 2),
 ("Clarithromycin brand:", ["Klacid", "Augmentin", "Velosef", "Marevan"], 0),
 ("Tetracycline contraindicated:", ["In acne", "Pregnancy and children <8", "In malaria prophylaxis", "With sunscreen"], 1),
 ("FQ serious adverse effect:", ["Dry cough", "Tendon rupture", "Hyperkalemia", "Bradycardia"], 1),
 ("Azithromycin typical duration:", ["14 days BD", "3 days OD", "1 dose monthly", "7 days QDS"], 1)],
["WHO AWaRe — fluoroquinolones Watch group.", "Egyptian AMR surveillance — E. coli FQ resistance.",
 "Pfizer Egypt — Zithromax prescribing information.", "FDA FQ black box — tendon and neuropathy."],
"*Next: [Lesson 2.4](./lesson-04-aminoglycosides-antiparasitics.md)*", prereq="Lessons 2.1–2.2")))

# Continue with more lessons - I'll add all in this file
# Due to size, write function to batch append

def gen_course02_rest():
    lessons = []
    lessons.append(("02-antimicrobials", "lesson-04-aminoglycosides-antiparasitics.md", L(
    "EG-MED-02-L04", "Lesson 2.4: Aminoglycosides, Metronidazole & Antiparasitics",
    "الدرس 2.4: الأمينوغليكوزيدات والميترونيدازول ومضادات الطفيليات",
    ["Describe **aminoglycoside** pharmacology and TDM", "Identify **Flagyl, Antinal** Egyptian brands",
     "Counsel on **metronidazole alcohol interaction** in Arabic", "Explain **antiparasitic** agents — albendazole, praziquantel",
     "Address **nifuroxazide OTC misuse** in Egypt"],
    """## 1. Aminoglycosides
| Drug | Brand | Use | Monitoring |
|---|---|---|---|
| Gentamicin | Gentamycin | Serious Gram- infections IV/IM | Trough levels, renal, vestibular |
| Amikacin | Amikin | Resistant Gram- | Same |
| Neomycin | Topical/oral limited | Bowel prep, topical | Systemic toxicity |

**Toxicity:** Nephrotoxic, ototoxic — once daily dosing preferred; avoid with other nephrotoxins.

## 2. Metronidazole — Egyptian market
| Brand | Manufacturer | Formulations | Indications |
|---|---|---|---|
| Flagyl | Sanofi / EIPICO generic | 250, 500mg tabs; susp | Anaerobes, C. diff, Giardia, Trichomonas |
| Metronidazole | Pharco, Memphis | Generic | Same |

**Dosing:** 400–500mg TDS × 7–10 days (anaerobic infections); single 2g dose (Trichomonas).
**Contraindications:** First trimester (relative); active CNS disease.
**Interaction:** **DISULFIRAM reaction with alcohol** — counsel strictly.

## 3. Antiparasitics
| Drug | Brand (Egypt) | Indication |
|---|---|---|
| Albendazole | Zentel, Andazol | Helminths, neurocysticercosis |
| Mebendazole | Vermox | Pinworm, roundworm |
| Praziquantel | Biltricide | Schistosomiasis (endemic Egypt) |
| Tinidazole | Fasigyn | Giardia, amoebiasis |

## 4. Antinal & nifuroxazide (Egypt OTC issue)
| Product | Active | Issue |
|---|---|---|
| Antinal | Nifuroxazide | Often used OTC for pediatric diarrhea — not substitute for ORS; AMR concerns |
| Normix | Rifaximin | Traveler's diarrhea, HE |

**Counseling script (Arabic):**
> "فلاجيل ممنوع تاخد معه أي كحول حتى بعد انتهاء الدوا بيومين — ممكن يسبب غثيان شديد. لو عندك طفل بإسهال، محلول الجفاف (ORS) أهم من المضاد. استشر الدكتور قبل أنتينال للأطفال."

## 5. Scenario
> *Patient on Flagyl for dental abscess. Asks if beer is OK after dinner.*

**Response:** Strict no alcohol during and 48h after course — disulfiram-like reaction. Complete course. Report numbness/tingling extremities.
""",
    ["Gentamicin requires renal monitoring — hospital use mainly",
     "Flagyl (metronidazole) — NO alcohol during + 48h after",
     "Schistosomiasis: praziquantel — endemic disease in Egypt",
     "Antinal/nifuroxazide OTC misuse — ORS first for pediatric diarrhea",
     "Albendazole (Zentel) — common helminth therapy",
     "Aminoglycoside ototoxicity — irreversible — TDM essential"],
    [("Metronidazole + alcohol causes:", ["Enhanced sedation only", "Disulfiram-like reaction", "Hypertension", "No interaction"], 1),
     ("Egyptian metronidazole brand:", ["Ciprobay", "Flagyl", "Zithromax", "Ceporex"], 1),
     ("Schistosomiasis treatment:", ["Amoxicillin", "Praziquantel", "Fluconazole", "Acyclovir"], 1),
     ("Aminoglycoside major toxicity:", ["Hepatotoxicity", "Nephro/ototoxicity", "Cough", "Hyperkalemia"], 1),
     ("Pediatric diarrhea first-line:", ["Antinal OTC always", "ORS and zinc", "Ciprofloxacin", "Metronidazole routine"], 1),
     ("Albendazole brand:", ["Zentel", "Plavix", "Lasix", "Marevan"], 0),
     ("Flagyl covers:", ["Viruses", "Anaerobic bacteria and protozoa", "Fungi only", "Helminths only"], 1),
     ("Nifuroxazide concern:", ["Vitamin deficiency", "OTC misuse/AMR concerns", "Hypertension", "Diabetes"], 1),
     ("Gentamicin monitoring:", ["INR", "Serum trough levels", "TSH", "HbA1c"], 1),
     ("Mebendazole used for:", ["Hypertension", "Intestinal worms", "TB", "Herpes"], 1)],
    ["Sanofi — Flagyl SPC.", "WHO — schistosomiasis treatment guidelines.",
     "Egyptian Pediatric Society — acute diarrhea management.", "EDA — OTC antidiarrheal regulations."],
    "*Next: [Lesson 2.5](./lesson-05-tuberculosis.md)*", prereq="Lessons 2.1–2.3")))
    return lessons

def gen_all():
    all_lessons = LESSONS + gen_course02_rest()
    # Add remaining courses via compact definitions
    all_lessons.extend(gen_course02_58())
    all_lessons.extend(gen_course03())
    all_lessons.extend(gen_course04())
    all_lessons.extend(gen_course05())
    all_lessons.extend(gen_course06())
    all_lessons.extend(gen_course07())
    all_lessons.extend(gen_course08())
    for course, fname, meta in all_lessons:
        path = os.path.join(BASE, course, "lessons", fname)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(build_lesson(meta))
    print(f"Generated {len(all_lessons)} lessons")

# Placeholder functions - will be filled
def gen_course02_58(): return []
def gen_course03(): return []
def gen_course04(): return []
def gen_course05(): return []
def gen_course06(): return []
def gen_course07(): return []
def gen_course08(): return []

if __name__ == "__main__":
    gen_all()
