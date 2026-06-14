#!/usr/bin/env python3
"""Generate all remaining course overviews and lesson files."""
import json, os

BASE = "/workspace/elearning-egypt-medications/courses"

def write(path, content):
    full = os.path.join(BASE, path) if not path.startswith("/") else path
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# Course overviews
OVERVIEWS = {
"02-antimicrobials/course-overview.md": """# Course 2 Overview: Antimicrobials & Antivirals in Egypt
# نظرة عامة — المضادات الحيوية ومضادات الفيروسات في مصر

| Field | Value |
|---|---|
| **Course ID** | EG-MED-02 |
| **Total lessons** | 8 |
| **Duration** | 14 hours |
| **Pass mark** | 70% per lesson quiz |
| **Prerequisites** | Course 1 recommended |

## Course description

Evidence-based training on antibacterial, antifungal, antiparasitic, and antiviral medications in the Egyptian market. Covers AWaRe classification, EDA regulations, resistance patterns, stewardship, Egyptian brand identification, and pharmacy counseling in Arabic.

## Learning outcomes

1. Apply **antimicrobial stewardship** principles per WHO AWaRe and Egyptian MOH guidelines
2. Identify **40+ antimicrobial brands** from Pharco, EIPICO, Memphis, Glaxo, Sanofi Egypt
3. Select appropriate empiric therapy for common Egyptian infections
4. Counsel on **adherence, resistance prevention**, and adverse effects in Arabic
5. Recognize **controlled antimicrobials** and OTC misuse (nifuroxazide, antinal)

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-stewardship.md | Stewardship & EDA regulations |
| 2 | lesson-02-penicillins-cephalosporins.md | Penicillins & cephalosporins |
| 3 | lesson-03-macrolides-quinolones.md | Macrolides, FQs & tetracyclines |
| 4 | lesson-04-aminoglycosides-antiparasitics.md | Aminoglycosides & antiparasitics |
| 5 | lesson-05-tuberculosis.md | Antituberculosis medications |
| 6 | lesson-06-antifungals.md | Antifungal agents |
| 7 | lesson-07-antivirals.md | Antivirals & COVID therapeutics |
| 8 | lesson-08-resistance-stewardship.md | Resistance & pharmacy stewardship |
""",
"03-diabetes/course-overview.md": """# Course 3 Overview: Diabetes Medications in Egypt
# نظرة عامة — أدوية السكري في مصر

| Field | Value |
|---|---|
| **Course ID** | EG-MED-03 |
| **Total lessons** | 6 |
| **Duration** | 10 hours |
| **Pass mark** | 70% |

## Course description

Comprehensive diabetes pharmacotherapy for the Egyptian market — 15.6% adult prevalence (IDF). Covers metformin, sulfonylureas, DPP-4i, SGLT2i, GLP-1 agonists, insulin, devices, and Arabic counseling.

## Learning outcomes

1. State **Egyptian diabetes targets** (HbA1c <7% most adults)
2. Master **metformin** brands and renal dose adjustment
3. Manage **hypoglycemia** from sulfonylureas (Diamicron, Glibenclamide)
4. Counsel on **SGLT2i/GLP-1** — Forxiga, Jardiance, Ozempic availability
5. Identify **insulin brands** — Lantus, Humalog, Egyptian biosimilars

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-epidemiology-targets.md | Epidemiology & targets |
| 2 | lesson-02-metformin.md | Metformin |
| 3 | lesson-03-sulfonylureas.md | Sulfonylureas |
| 4 | lesson-04-dpp4-sglt2-glp1.md | DPP-4i, SGLT2i, GLP-1 |
| 5 | lesson-05-insulin.md | Insulin types & brands |
| 6 | lesson-06-devices-monitoring.md | Devices & monitoring |
""",
"04-cns-analgesics/course-overview.md": """# Course 4 Overview: CNS, Analgesics & Psychotropics in Egypt
# نظرة عامة — الجهاز العصبي والمسكنات والأدوية النفسية

| Field | Value |
|---|---|
| **Course ID** | EG-MED-04 |
| **Total lessons** | 8 |
| **Duration** | 12 hours |
| **Pass mark** | 70% |

## Course description

Pain management, psychotropics, antiepileptics, and substance abuse awareness for Egyptian pharmacy practice. Includes tramadol control regulations and Egyptian brand identification.

## Learning outcomes

1. Apply **WHO analgesic ladder** with Egyptian OTC/Rx brands
2. Counsel **NSAID GI/renal risks** — Brufen, Voltaren, Cetal
3. Understand **tramadol scheduling** and abuse epidemic in Egypt
4. Identify **SSRI/SNRI** brands — Cipralex, Seroxat, Egyptian generics
5. Manage **antiepileptic** counseling — Tegretol, Depakine, Keppra

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-pain-ladder.md | Pain physiology & WHO ladder |
| 2 | lesson-02-paracetamol-nsaids.md | Paracetamol & NSAIDs |
| 3 | lesson-03-opioids-tramadol.md | Opioids & tramadol controls |
| 4 | lesson-04-antidepressants.md | Antidepressants |
| 5 | lesson-05-anxiolytics-hypnotics.md | Anxiolytics & hypnotics |
| 6 | lesson-06-antiepileptics.md | Antiepileptics |
| 7 | lesson-07-antipsychotics-adhd.md | Antipsychotics & ADHD |
| 8 | lesson-08-substance-abuse.md | Substance abuse awareness |
""",
"05-gi-respiratory/course-overview.md": """# Course 5 Overview: GI & Respiratory Medications in Egypt
# نظرة عامة — أدوية الجهاز الهضمي والتنفسي

| Field | Value |
|---|---|
| **Course ID** | EG-MED-05 |
| **Total lessons** | 6 |
| **Duration** | 10 hours |
| **Pass mark** | 70% |

## Course description

GI acid suppression, antiemetics, IBS, respiratory inhalers, and cold/flu products in the Egyptian market.

## Learning outcomes

1. Compare **PPI vs H2** — Nexium, Controloc, Antodine
2. Counsel **inhaler technique** — Ventolin, Seretide, Symbicort
3. Manage **IBS and antiemetics** with Egyptian brands
4. Advise on **hepatoprotectants** — evidence and counseling
5. Guide **OTC cold/flu** selection — Telfast, Otrivin, Egyptian products

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-ppi-h2.md | PPIs & H2 blockers |
| 2 | lesson-02-antiemetics-ibs.md | Antiemetics & IBS |
| 3 | lesson-03-antidiarrheals-probiotics.md | Antidiarrheals & probiotics |
| 4 | lesson-04-hepatoprotectants.md | Hepatoprotectants |
| 5 | lesson-05-bronchodilators-inhalers.md | Bronchodilators & inhalers |
| 6 | lesson-06-antihistamines-cold-flu.md | Antihistamines & cold/flu |
""",
"06-otc-selfcare/course-overview.md": """# Course 6 Overview: OTC & Self-Care in Egypt
# نظرة عامة — الأدوية بدون روشتة والرعاية الذاتية

| Field | Value |
|---|---|
| **Course ID** | EG-MED-06 |
| **Total lessons** | 5 |
| **Duration** | 8 hours |
| **Pass mark** | 70% |

## Course description

Egyptian OTC regulatory framework, vitamins, topical products, herbal/traditional medicines, and self-care counseling scenarios.

## Learning outcomes

1. Explain **EDA OTC classification** and pharmacist responsibilities
2. Recommend **vitamins/minerals** — Centrum, Vidrop, Egyptian brands
3. Counsel on **topical OTC** — skin, eye, ear products
4. Assess **herbal product** regulatory status and safety
5. Apply **self-care triage** — when to refer to physician

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-otc-regulations.md | EDA OTC framework |
| 2 | lesson-02-vitamins-minerals.md | Vitamins & minerals |
| 3 | lesson-03-topical-products.md | Topical OTC products |
| 4 | lesson-04-herbal-traditional.md | Herbal & traditional |
| 5 | lesson-05-selfcare-scenarios.md | Self-care scenarios |
""",
"07-pediatrics/course-overview.md": """# Course 7 Overview: Pediatric Medications in Egypt
# نظرة عامة — أدوية الأطفال في مصر

| Field | Value |
|---|---|
| **Course ID** | EG-MED-07 |
| **Total lessons** | 6 |
| **Duration** | 10 hours |
| **Pass mark** | 70% |

## Course description

Pediatric dosing, formulations, antibiotics, antipyretics, respiratory, GI, vitamins, and Egypt vaccination schedule for pharmacy professionals.

## Learning outcomes

1. Calculate **weight-based dosing** and select appropriate formulations
2. Identify **pediatric antibiotic** suspensions — Augmentin, Velosef syrup
3. Advise on **cough/cold avoidance** in children <6 years
4. Counsel on **ORS, colic, iron** products
5. Support **Egyptian vaccination schedule** counseling

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-dosing-formulations.md | Dosing & formulations |
| 2 | lesson-02-antibiotics-antipyretics.md | Antibiotics & antipyretics |
| 3 | lesson-03-respiratory-cough-cold.md | Respiratory & cough/cold |
| 4 | lesson-04-pediatric-gi.md | Pediatric GI |
| 5 | lesson-05-vitamins-iron.md | Vitamins & iron |
| 6 | lesson-06-vaccination.md | Vaccination schedule |
""",
"08-womens-health/course-overview.md": """# Course 8 Overview: Women's Health & Obstetric Medications
# نظرة عامة — صحة المرأة وأدوية الحمل

| Field | Value |
|---|---|
| **Course ID** | EG-MED-08 |
| **Total lessons** | 5 |
| **Duration** | 8 hours |
| **Pass mark** | 70% |

## Course description

Contraception, pregnancy-safe medications, lactation compatibility, menopause/HRT, and fertility/prenatal vitamins in the Egyptian market.

## Learning outcomes

1. List **contraceptive options** available in Egypt — pills, IUD, emergency
2. Apply **pregnancy risk categories** to common prescriptions
3. Counsel on **lactation-safe** alternatives
4. Identify **HRT products** in Egyptian market
5. Recommend **prenatal vitamins** and fertility treatments

## Lesson index

| # | File | Topic |
|---|---|---|
| 1 | lesson-01-contraceptives.md | Contraceptives |
| 2 | lesson-02-pregnancy-safe-meds.md | Pregnancy-safe medications |
| 3 | lesson-03-lactation.md | Lactation compatibility |
| 4 | lesson-04-menopause-hrt.md | Menopause & HRT |
| 5 | lesson-05-fertility-prenatal.md | Fertility & prenatal vitamins |
""",
}

for path, content in OVERVIEWS.items():
    write(path, content)

print(f"Wrote {len(OVERVIEWS)} course overviews")
