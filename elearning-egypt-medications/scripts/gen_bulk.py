#!/usr/bin/env python3
"""Generate all remaining lesson files for courses 02-08."""
import os

BASE = "/workspace/elearning-egypt-medications/courses"

TEMPLATE = """# {title_en}
# {title_ar}

| | |
|---|---|
| **Duration** | 90 minutes |
| **Lesson ID** | {lid} |
| **Prerequisites** | {prereq} |

---

## Learning objectives

After completing this lesson, you will be able to:

{objectives}

---

{body}

---

## Key takeaways

> 📌 **Key Takeaways — {lid}**
{takeaways}

---

## Lesson Quiz (10 questions)

{quiz}

---

## References

{refs}
{next}
"""

def obj(items):
    return "\n".join(f"{i}. {x}" for i,x in enumerate(items,1))

def tk(items):
    return "\n".join(f"> - {x}" for x in items)

def qz(questions):
    s = ""
    for i,(q,opts,ans) in enumerate(questions,1):
        s += f"**Q{i}.** {q}\n"
        for j,o in enumerate(opts):
            s += f"- {chr(97+j)}) {o}{' ✓' if j==ans else ''}\n"
        s += "\n"
    return s

def write(course, fname, data):
    p = os.path.join(BASE, course, "lessons", fname)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p,"w",encoding="utf-8") as f:
        f.write(TEMPLATE.format(**data).strip()+"\n")

# All lessons as list of (course, filename, data_dict)
ALL = []

def add(course, fname, lid, title_en, title_ar, objectives, body, takeaways, quiz, refs, next_link="", prereq="See course overview"):
    ALL.append((course, fname, dict(lid=lid, title_en=title_en, title_ar=title_ar,
        objectives=obj(objectives), body=body, takeaways=tk(takeaways), quiz=qz(quiz),
        refs="\n".join(f"{i}. {r}" for i,r in enumerate(refs,1)), next=next_link, prereq=prereq)))

# COURSE 02 L06-L08
add("02-antimicrobials","lesson-06-antifungals.md","EG-MED-02-L06",
"Lesson 2.6: Antifungals — Egyptian Market","الدرس 2.6: مضادات الفطريات — السوق المصري",
["Explain **azole and polyene** antifungal mechanisms","Identify **Diflucan, Nizoral** Egyptian brands and generics",
 "Counsel on **drug interactions** (fluconazole + statins, warfarin)","Manage **topical vs systemic** antifungal selection",
 "Advise on **candidiasis, dermatophytes, onychomycosis** in Arabic"],
"""## 1. Systemic antifungals

| Generic | Brand (Egypt) | Manufacturer | Spectrum | Dosing |
|---|---|---|---|---|
| **Fluconazole** | Diflucan, Flucoral | Pfizer / Pharco, Memphis | Candida, cryptococcus | 150mg single (vaginal) or 200–400mg OD |
| **Itraconazole** | Sporanox | Janssen / generic | Dermatophytes, aspergillus | 200mg OD-BD |
| **Ketoconazole** | Nizoral (oral limited) | Janssen | Candida, dermatophytes | 200mg OD (hepatotoxic — oral declining) |
| **Voriconazole** | Vfend | Pfizer (hospital) | Invasive aspergillus | IV/oral specialist |
| **Amphotericin B** | Fungizone | Hospital | Severe systemic | IV — nephrotoxic |

**Fluconazole interactions:** ↑ statin levels; ↑ warfarin INR; QT prolongation with amiodarone.

## 2. Topical antifungals — Egyptian market

| Generic | Brand | Form | Use |
|---|---|---|---|
| Clotrimazole | Canesten, Clotrim | Cream, pessary | Candida, tinea |
| Miconazole | Daktarin | Cream, powder | Skin, oral thrush gel |
| Terbinafine | Lamisil | Cream, tabs | Dermatophytes, onychomycosis |
| Nystatin | Nystatin oral susp | Suspension | Oral candidiasis |
| Econazole | Ecoderm | Cream | Tinea, candida |

## 3. Counseling

**Counseling script (Arabic):**
> "كريم الفطريات يتدهن مرتين يومياً لمدة 2–4 أسابيع حتى بعد اختفاء الأعراض بأسبوع. ديفلوكان للفطريات المهبلية قرص واحد فقط. لو عندك أدوية للقلب أو الضغط، قول للدكتور قبل ديفلوكان."

## 4. Scenario
> *Patient self-treating recurrent vaginal candidiasis with weekly Diflucan 150mg OTC request.*

**Response:** Recurrent candidiasis (>4/year) needs physician workup (diabetes, immunosuppression). Not appropriate for repeated self-treatment. Counsel proper topical alternative if mild.
""",
["Diflucan (fluconazole) — single-dose 150mg standard for uncomplicated vaginal candidiasis",
 "Topical Canesten/Daktarin — first-line for skin tinea in Egypt",
 "Fluconazole ↑ warfarin INR — common Egyptian interaction",
 "Oral ketoconazole declining due to hepatotoxicity",
 "Terbinafine (Lamisil) — preferred for onychomycosis",
 "Pharco/Memphis fluconazole generics affordable"],
[("Fluconazole single dose for vaginal candidiasis:",["50mg","150mg","500mg daily forever"],1),
 ("Egyptian fluconazole brand:",["Diflucan","Plavix","Augmentin","Lasix"],0),
 ("Topical clotrimazole brand:",["Canesten","Marevan","Concor","Liptior"],0),
 ("Fluconazole interaction:",["Decreases warfarin effect","Increases warfarin INR"],1),
 ("Onychomycosis oral agent:",["Paracetamol","Terbinafine"],1),
 ("Amphotericin B toxicity:",["Nephrotoxicity","Dry cough"],0),
 ("Oral candidiasis:",["Nystatin suspension","Aspirin"],0),
 ("Azole mechanism:",["Inhibits ergosterol synthesis"],0),
 ("Tinea treatment duration:",["1 day only","2-4 weeks topical"],1),
 ("Recurrent candidiasis:",["Self-treat forever","Needs physician workup"],1)],
["Pfizer — Diflucan SPC.","IDSA candidiasis guidelines.","Egyptian Dermatology Society — tinea management.","Pharco — Flucoral product information."],
"\n*Next: [Lesson 2.7](./lesson-07-antivirals.md)*","Lessons 2.1–2.5")

add("02-antimicrobials","lesson-07-antivirals.md","EG-MED-02-L07",
"Lesson 2.7: Antivirals & COVID-19 Therapeutics — Egypt","الدرس 2.7: مضادات الفيروسات وعلاج كوفيد-19 — مصر",
["Describe **antiviral mechanisms** — neuraminidase, polymerase, protease inhibitors",
 "Identify **Tamiflu, Zovirax, COVID therapeutics** availability in Egypt",
 "Counsel on **early initiation** for influenza antivirals","Explain **HIV antiretroviral** awareness for pharmacists",
 "Manage **herpes simplex/zoster** treatment with Egyptian brands"],
"""## 1. Influenza antivirals

| Drug | Brand | Dosing | Window |
|---|---|---|---|
| Oseltamivir | Tamiflu | 75mg BD × 5 days | Within 48h of symptom onset |
| Zanamivir | Relenza (limited) | Inhaled | Within 48h |

**Egypt availability:** Tamiflu stocked seasonally; prescription required.

## 2. Herpes antivirals

| Drug | Brand (Egypt) | Indication | Dosing |
|---|---|---|---|
| Acyclovir | Zovirax, Acyclovir | HSV, VZV | 200–800mg 5×/day or 800mg TDS (zoster) |
| Valacyclovir | Valtrex | HSV, VZV | 1g TDS (zoster) × 7 days |
| Valacyclovir | Valtrex generic | Same | Pharco/Memphis generics available |

## 3. COVID-19 therapeutics (Egypt context)

| Agent | Status Egypt | Notes |
|---|---|---|
| Remdesivir | Hospital use | IV — severe COVID |
| Paxlovid (nirmatrelvir/ritonavir) | Limited/private | Within 5 days; many DDIs |
| Molnupiravir | Variable availability | Oral alternative |
| Dexamethasone | Widely available | Severe hypoxic COVID |

**Paxlovid interactions:** Contraindicated with many CV drugs (some statins, amiodarone). Pharmacist DDI check essential.

## 4. HIV (awareness)

| Class | Examples | Note |
|---|---|---|
| NRTIs | Tenofovir, lamivudine | Fixed combos common |
| NNRTIs | Efavirenz | CNS side effects |
| Integrase inhibitors | Dolutegravir | Preferred regimens |

Egypt MOH provides ARVs through designated centers — pharmacy awareness for interactions.

**Counseling script (Arabic):**
> "تاميفلو لازم يبدأ في أول 48 ساعة من أعراض الإنفلونزا عشان يكون فعال. زوفيراكس للهربس لازم يتاخد في مواعيده بالظبط. لو عندك كوفيد ودكتور كتب علاج، اسأل الصيدلي عن تعارض الأدوية."

## 5. Scenario
> *Elderly diabetic on atorvastatin 40mg prescribed Paxlovid for COVID.*

**Response:** Hold atorvastatin during Paxlovid course; check all medications for ritonavir interactions; counsel completion of 5-day course.
""",
["Tamiflu — start within 48h of influenza symptoms",
 "Zovirax/Valtrex — acyclovir/valacyclovir for HSV and shingles",
 "Paxlovid — significant drug interactions; pharmacist review critical",
 "Remdesivir — hospital IV for severe COVID in Egypt",
 "HIV ARVs — MOH designated dispensing centers",
 "Dexamethasone — mortality benefit in severe hypoxic COVID"],
[("Oseltamivir brand:",["Tamiflu","Zithromax","Flagyl","Ceporex"],0),
 ("Tamiflu must start within:",["48 hours of symptoms","2 weeks","1 month"],1),
 ("Acyclovir brand:",["Zovirax","Plavix","Norvasc","Concor"],0),
 ("Paxlovid contains ritonavir which:",["Has no drug interactions","Inhibits CYP3A4 causing many DDIs"],1),
 ("Shingles treatment often uses:",["Valacyclovir 1g TDS","Paracetamol only"],0),
 ("Remdesivir route:",["Oral OTC","Intravenous"],1),
 ("COVID steroid with mortality benefit:",["Dexamethasone in severe disease"],0),
 ("Herpes antiviral mechanism:",["Inhibits viral DNA polymerase"],0),
 ("HIV ARVs in Egypt dispensed:",["Any pharmacy OTC","Designated MOH centers mainly"],1),
 ("Influenza antivirals ineffective after:",["48-72h from symptom onset typically"],0)],
["WHO — influenza antiviral guidelines.","NIH COVID-19 treatment guidelines.",
 "Pfizer — Paxlovid drug interaction list.","Egypt MOH — COVID therapeutic protocols."],
"\n*Next: [Lesson 2.8](./lesson-08-resistance-stewardship.md)*","Lessons 2.1–2.6")

add("02-antimicrobials","lesson-08-resistance-stewardship.md","EG-MED-02-L08",
"Lesson 2.8: Resistance Patterns & Pharmacy Stewardship — Egypt","الدرس 2.8: أنماط المقاومة والاستخدام الرشيد — مصر",
["Summarize **Egyptian AMR surveillance** data by pathogen","Apply **pharmacy stewardship interventions** in daily practice",
 "Design **patient counseling** to reduce inappropriate antibiotic demand","Identify **reporting pathways** for suspicious resistance",
 "Integrate **Course 2 knowledge** across all antimicrobial classes"],
"""## 1. Egyptian resistance summary

| Pathogen/setting | Key resistance patterns |
|---|---|
| Community UTI (E. coli) | ESBL 30–50% hospital; FQ resistance >50% many centers |
| Healthcare-associated | MRSA, VRE, carbapenem-resistant Enterobacteriaceae emerging |
| Respiratory (outpatient) | S. pneumoniae penicillin/macrolide variable |
| GI | C. difficile post-antibiotic increasing awareness |
| TB | MDR-TB ~3%; XDR-TB in specialized centers |

## 2. Stewardship interventions checklist

| Action | Example |
|---|---|
| Validate Rx | Duration, indication, dose appropriate? |
| Substitute wisely | Generic Access antibiotic when equivalent |
| Refuse inappropriate OTC | No antibiotic without Rx |
| Counsel completion | Full course even if feeling better |
| DDI screening | Macrolide + statin; MTZ + warfarin; FQ + QT drugs |
| Refer | Non-resolving infection >48–72h on appropriate ABX |

## 3. Integrated case — Egyptian polypharmacy infection
> *72-year-old on Marevan, Liptior, Concor. Prescribed Klacid + Ciprobay for CAP. INR 5.2.*

**Analysis:**
- Dual antibiotics questionable for CAP — stewardship + interaction risk
- Clarithromycin + ciprofloxacin — QT risk
- Clarithromycin ↑ statin + warfarin levels
- Urgent INR management; physician contact

**Counseling script (Arabic):**
> "المقاومة معناها إن البكتيريا بتتعلم تقاوم الدوا. كل ما نستخدم المضادات غلط، المشكلة بتكبر. الصيدلي دوره يتأكد إن الروشتة مناسبة ويشرحلك تاخد الدوا صح."

## 4. Course 2 drug quick reference

| Class | Key Egyptian brands |
|---|---|
| Penicillins | Augmentin, Amoxil, Ceporex |
| Macrolides | Zithromax, Klacid |
| FQ | Ciprobay (Watch) |
| Metronidazole | Flagyl |
| TB | RHZE FDC |
| Antifungal | Diflucan, Canesten |
| Antiviral | Tamiflu, Zovirax |
""",
["Egyptian E. coli — high FQ and ESBL resistance",
 "Pharmacy frontline: refuse antibiotic OTC dispensing",
 "Macrolide + warfarin + statin — dangerous triple in elderly",
 "AWaRe guides empiric antibiotic selection",
 "MDR-TB and CRE — refer to specialist centers",
 "Course 2 complete — proceed to Diabetes course"],
[("Egyptian E. coli FQ resistance:",["Very low","Often >50% in surveys"],1),
 ("Pharmacy should refuse:",["Antibiotics without prescription"],0),
 ("AWaRe Access example:",["Amoxicillin-clavulanate"],0),
 ("MRSA is:",["Methicillin-resistant Staph aureus"],0),
 ("Stewardship reduces:",["Antimicrobial resistance"],0),
 ("MDR-TB rate Egypt ~:",["3% new cases"],0),
 ("C. difficile follows:",["Antibiotic use"],0),
 ("Klacid increases:",["Warfarin effect"],0),
 ("Course 2 next topic:",["Diabetes medications"],0),
 ("Complete antibiotic course to:",["Prevent resistance and relapse"],0)],
["Egyptian MOH National AMR Action Plan.","WHO GLASS surveillance.",
 "CDC antibiotic stewardship core elements.","WHO AWaRe database."],
"\n*Course complete. Proceed to [Course 3 — Diabetes](../../03-diabetes/course-overview.md)*","Lessons 2.1–2.7")

# ========== COURSE 03 DIABETES ==========
add("03-diabetes","lesson-01-epidemiology-targets.md","EG-MED-03-L01",
"Lesson 3.1: Diabetes Epidemiology in Egypt & Treatment Targets","الدرس 3.1: وبائيات السكري في مصر وأهداف العلاج",
["State **Egypt diabetes prevalence** and risk factors","Apply **ADA/EASD and Egyptian guidelines** HbA1c targets",
 "Describe **ASCVD risk** in Egyptian diabetic population","Identify **screening recommendations** for pharmacy referral",
 "Counsel on **lifestyle-first approach** in Arabic"],
"""## 1. Epidemiology

| Metric | Egypt data |
|---|---|
| Adult diabetes prevalence | **15.6%** (IDF Diabetes Atlas 2021) |
| Undiagnosed | ~50% estimated |
| Prediabetes | Rising with obesity epidemic |
| Risk factors | Obesity, urbanization, sedentary lifestyle, high carb diet |

## 2. Treatment targets

| Patient | HbA1c target | BP | LDL |
|---|---|---|---|
| Most adults | <7% (53 mmol/mol) | <130/80 | <70 mg/dL high risk |
| Elderly/frail | <8% individualized | <140/90 | Individualized |
| Pregnancy (pre-existing) | <6.5% preconception | — | — |

## 3. Stepwise therapy (Type 2)

```
Lifestyle → Metformin first line → Add SGLT2i/GLP-1 if ASCVD/HF/CKD
→ Sulfonylurea/DPP-4i → Insulin
```

**Counseling script (Arabic):**
> "السكري في مصر شائع جداً — واحد من كل 7 بالغين. الهدف إن السكر التراكمي يبقى تحت 7% لو أمكن. المشي والدايت أهم من أي دواء. قيس السكر في البيت وسجل الأرقام."

## 4. Scenario
> *Patient HbA1c 8.5% on metformin 1g BD only. BMI 32. Asks pharmacy for 'stronger sugar pill'.*

**Response:** Not at target — needs physician review for add-on (SGLT2i preferred if ASCVD risk). Counsel diet/exercise. Do not recommend sulfonylurea without Rx.
""",
["Egypt diabetes prevalence 15.6% — IDF data","HbA1c target <7% most adults",
 "Metformin remains first-line unless contraindicated","SGLT2i/GLP-1 preferred with ASCVD/HF/CKD",
 "Lifestyle modification is foundation","Pharmacy BP/glucose screening opportunity"],
[("Egypt adult diabetes prevalence:",["5%","15.6%","40%","60%"],1),
 ("Most adults HbA1c target:",["<10%","<7%","<5%","<12%"],1),
 ("First-line T2DM drug:",["Insulin","Metformin","Glibenclamide only"],1),
 ("IDF stands for:",["International Diabetes Federation"],0),
 ("Undiagnosed diabetes Egypt:",["~50% estimated"],0),
 ("BP target diabetes:",["<130/80"],0),
 ("SGLT2i benefit beyond glucose:",["Cardiovascular and renal protection"],0),
 ("Pharmacy role:",["Screening and referral"],0),
 ("Lifestyle:",["Foundation of diabetes care"],0),
 ("Prediabetes risk factor:",["Obesity and inactivity"],0)],
["IDF Diabetes Atlas — Egypt.","ADA Standards of Care 2024.",
 "Egyptian Diabetes Association guidelines.","WHO STEPS Egypt chronic disease survey."],
"\n*Next: [Lesson 3.2](./lesson-02-metformin.md)*")

add("03-diabetes","lesson-02-metformin.md","EG-MED-03-L02",
"Lesson 3.2: Metformin — Brands, Formulations & Renal Dosing","الدرس 3.2: ميتفورمين — العلامات والتركيبات والجرعات الكلوية",
["Explain **metformin mechanism** (AMPK, hepatic glucose output)","Identify **Glucophage, Cidophage, Formit** Egyptian brands",
 "Apply **eGFR-based dose adjustment** and contraindications","Counsel on **GI side effects** and extended-release formulations",
 "Manage **contrast media / surgery** hold instructions in Arabic"],
"""## 1. Mechanism & evidence

Metformin ↓ hepatic gluconeogenesis, ↑ insulin sensitivity. UKPDS — metformin reduced CV events in obese T2DM.

## 2. Egyptian market

| Brand | Manufacturer | Formulations | Approx. EGP/month |
|---|---|---|---|
| Glucophage | Merck / generics | 500, 850, 1000mg tabs; XR | 40–120 |
| Cidophage | EIPICO | 500, 850mg | 30–80 |
| Formit | Pharco | 500, 850mg | 25–70 |
| Gliformin | Memphis | 500, 850mg | 30–75 |

## 3. Renal dosing

| eGFR | Action |
|---|---|
| >45 | Full dose |
| 30–45 | Max 1000mg/day; monitor |
| <30 | **Contraindicated** — lactic acidosis risk |

**Contraindications:** eGFR <30, acute metabolic acidosis, severe hepatic impairment, contrast (temporary hold).

**Counseling script (Arabic):**
> "الميتفورمين يتاخد مع الأكل عشان يقلل عوارض المعدة. ابدأ بجرعة صغيرة وزود تدريجياً. لو عندك أشعة بصبغة، قول للدكتور — ممكن يوقف الدوا يومين."

## 4. Scenario
> *Patient eGFR 28 on metformin 850mg TDS. Refill request.*

**Response:** Contraindicated at eGFR <30 — refer to physician urgently for regimen change. Do not refill without physician adjustment.
""",
["Glucophage/Cidophage — dominant metformin brands Egypt","Contraindicated eGFR <30",
 "Start low go slow — GI tolerance","Hold before iodinated contrast per protocol",
 "XR formulation reduces GI side effects","UKPDS — CV benefit in obese T2DM"],
[("Metformin contraindicated eGFR:",["<30"],0),("Egyptian metformin EIPICO:",["Cidophage"],0),
 ("Take with:",["Food to reduce GI upset"],0),("Serious rare risk:",["Lactic acidosis"],0),
 ("UKPDS showed:",["CV benefit in obese T2DM"],0),("Glucophage manufacturer origin:",["Merck/original brand"],0),
 ("Max dose typical:",["2000-2550mg/day"],0),("Contrast media:",["May need temporary hold"],0),
 ("XR benefit:",["Less GI upset"],0),("First-line T2DM:",["Metformin unless contraindicated"],0),
 ("Pharco brand:",["Formit"],0)],
["UKPDS Group. (1998). Lancet.","Merck — Glucophage SPC.",
 "ADA metformin renal dosing guidance.","EIPICO — Cidophage PI."],
"\n*Next: [Lesson 3.3](./lesson-03-sulfonylureas.md)*","Lesson 3.1")

add("03-diabetes","lesson-03-sulfonylureas.md","EG-MED-03-L03",
"Lesson 3.3: Sulfonylureas — Diamicron, Glibenclamide & Hypoglycemia","الدرس 3.3: السلفونيل يوريا — دياميكرون وعلاج نقص السكر",
["Explain **sulfonylurea mechanism** (K-ATP channel)","Identify **Diamicron, Amaryl, Glibenclamide** Egyptian brands",
 "Manage **hypoglycemia** — rule of 15","Compare **gliclazide vs glibenclamide** safety in elderly",
 "Counsel on **meal timing and alcohol** in Arabic"],
"""## 1. Mechanism

Sulfonylureas close K-ATP channels → insulin secretion independent of glucose → hypoglycemia risk.

| Drug | Brand (Egypt) | Duration | Notes |
|---|---|---|---|
| Gliclazide MR | Diamicron MR | 30–120mg OD | Lower hypoglycemia vs glibenclamide |
| Glimepiride | Amaryl | 1–4mg OD | Once daily |
| Glibenclamide | Glibenclamide | 2.5–5mg BD | **High hypoglycemia** — avoid elderly |
| Glipizide | Minidiab | 5–10mg | Short acting |

## 2. Hypoglycemia management — Rule of 15

```
BG <70 mg/dL → 15g fast carb (juice, honey, 3 glucose tabs)
→ Wait 15 min → Recheck → Repeat if still low
→ Eat meal once stable
Severe: glucagon IM or emergency services
```

**Counseling script (Arabic):**
> "السلفونيل يوريا بينزل السكر بقوة — لازم تاكل بانتظام وماتفوتش وجبة. لو حسيت عرق بارد، رعشة، جوع شديد — قيس السكر فوراً وكل عسل أو عصير. الكحول خطر مع الدوا ده."

## 3. Scenario
> *Elderly patient on glibenclamide 5mg BD found confused at pharmacy. Pale, sweating.*

**Response:** Treat as hypoglycemia — give 15g glucose immediately, call emergency if not improving. Counsel physician to switch from glibenclamide to gliclazide MR.
""",
["Diamicron MR (gliclazide) — preferred SU in Egypt elderly","Glibenclamide — high hypoglycemia risk",
 "Rule of 15 for hypoglycemia management","Take before meals — never skip meals",
 "Amaryl (glimepiride) — once daily option","Alcohol potentiates hypoglycemia"],
[("Sulfonylurea mechanism:",["Stimulates insulin secretion via K-ATP"],0),
 ("Safer SU in elderly:",["Gliclazide MR over glibenclamide"],0),
 ("Diamicron contains:",["Gliclazide"],0),
 ("Hypoglycemia first step:",["15g fast carbohydrate"],0),
 ("Glibenclamide risk:",["High hypoglycemia especially elderly"],0),
 ("Amaryl generic:",["Glimepiride"],0),
 ("Alcohol with SU:",["Increases hypoglycemia risk"],0),
 ("Rule of 15 wait:",["15 minutes before recheck"],0),
 ("SU take timing:",["Before meals"],0),
 ("Severe hypoglycemia:",["Glucagon or emergency services"],0)],
["ADA hypoglycemia management.","Servier — Diamicron SPC.",
 "Egyptian Diabetes Association — oral agent selection.","UK Hypoglycemia guidelines."],
"\n*Next: [Lesson 3.4](./lesson-04-dpp4-sglt2-glp1.md)*","Lessons 3.1–3.2")

add("03-diabetes","lesson-04-dpp4-sglt2-glp1.md","EG-MED-03-L04",
"Lesson 3.4: DPP-4i, SGLT2i & GLP-1 Agonists — Egyptian Market","الدرس 3.4: مثبطات DPP-4 وSGLT2 وناهضات GLP-1",
["Compare **DPP-4i, SGLT2i, GLP-1** mechanisms and benefits","Identify **Januvia, Forxiga, Jardiance, Ozempic** Egypt availability",
 "Counsel on **SGLT2i genital infections and volume depletion**","Explain **GLP-1 weight loss benefits** and injection technique",
 "Apply **cardiorenal indications** independent of glucose lowering"],
"""## 1. Drug class comparison

| Class | Examples (Egypt) | Key benefit | Main risk |
|---|---|---|---|
| DPP-4i | Januvia (sitagliptin), Galvus (vildagliptin) | Weight neutral; oral | Pancreatitis (rare) |
| SGLT2i | Forxiga (dapagliflozin), Jardiance (empagliflozin) | HF, CKD, CV benefit | Genital mycotic infections, DKA |
| GLP-1 RA | Ozempic (semaglutide), Victoza (liraglutide) | Weight loss, CV benefit | GI upset, injections |

## 2. Egyptian market pricing (approx.)

| Drug | EGP/month | Availability |
|---|---|---|
| Sitagliptin generic | 200–400 | Wide |
| Dapagliflozin | 400–800 | Growing |
| Empagliflozin | 500–900 | Insurance/private |
| Semaglutide | 1500–3000 | Limited cost — adherence challenge |

**Counseling script (Arabic):**
> "فورسيجا وجارديانس بيحميوا القلب والكلى مش بس السكر. اشرب مية كفاية ونظف المنطقة الحساسة عشان تتجنب الالتهابات الفطرية. أوزمبيك حقن مرة أسبوع — ممكن يقلل وزنك ويحسسك بغثيان في الأول."

## 3. Scenario
> *T2DM patient with heart failure EF 35%. On metformin only. Physician adds Forxiga.*

**Response:** Excellent GDMT choice — explain HF benefit beyond glucose. Counsel hydration, perineal hygiene, sick-day rules. Do not stop if glucose normalizes.
""",
["SGLT2i — HF and CKD benefit regardless of diabetes status",
 "Forxiga/Jardiance increasingly prescribed in Egypt","Ozempic — cost barrier but powerful weight/CV effects",
 "DPP-4i — well tolerated add-on oral","Genital candidiasis counseling essential for SGLT2i",
 "DAPA-HF/EMPEROR — evidence for SGLT2i in HF"],
[("SGLT2i mechanism:",["Inhibits SGLT2 in proximal tubule"],0),
 ("Forxiga contains:",["Dapagliflozin"],0),
 ("SGLT2i HF benefit:",["Proven in HFrEF regardless of diabetes"],0),
 ("GLP-1 example:",["Semaglutide (Ozempic)"],0),
 ("SGLT2i side effect:",["Genital mycotic infections"],0),
 ("DPP-4i example:",["Sitagliptin (Januvia)"],0),
 ("Ozempic frequency:",["Once weekly injection"],0),
 ("SGLT2i volume risk:",["Dehydration/hypotension"],0),
 ("Jardiance contains:",["Empagliflozin"],0),
 ("Cardiorenal protection class:",["SGLT2 inhibitors"],0)],
["McMurray JJV DAPA-HF. NEJM 2019.","Zinman B EMPEROR-Reduced. NEJM 2020.",
 "ADA Standards of Care 2024.","AstraZeneca Forxiga Egypt PI."],
"\n*Next: [Lesson 3.5](./lesson-05-insulin.md)*","Lessons 3.1–3.3")

add("03-diabetes","lesson-05-insulin.md","EG-MED-03-L05",
"Lesson 3.5: Insulin — Types & Egyptian Brands","الدرس 3.5: الأنسولين — الأنواع والعلامات المصرية",
["Classify **insulin by onset/duration** — rapid, basal, premixed","Identify **Lantus, Humalog, Mixtard** and Egyptian biosimilars",
 "Counsel on **storage (2-8°C), injection technique, rotation**","Manage **hypoglycemia and sick-day rules**",
 "Explain **pen vs vial** devices available in Egypt"],
"""## 1. Insulin types

| Type | Onset | Duration | Egyptian brands |
|---|---|---|---|
| Rapid | 15 min | 3–5h | Humalog, NovoRapid, APIDRA |
| Short | 30 min | 6–8h | Actrapid |
| Intermediate | 1–2h | 12–18h | Insulatard |
| Basal analog | 1–2h | ~24h | Lantus, Levemir, Tresiba |
| Premixed | Variable | 12–24h | Mixtard 30, NovoMix 30, Humalog Mix |

## 2. Egyptian market

| Brand | Type | Manufacturer | Approx. EGP/month |
|---|---|---|---|
| Lantus | Glargine U100 | Sanofi | 400–800 |
| Humalog | Lispro | Lilly | 500–900 |
| Mixtard 30 | 30/70 | Novo Nordisk | 200–400 |
| Basaglar | Glargine biosimilar | Lilly | 350–700 |
| Local biosimilars | Glargine/aspart | Egyptian/import | 200–500 |

**Storage:** 2–8°C refrigerator; in-use room temp <30°C × 28–42 days. Never freeze.

**Counseling script (Arabic):**
> "الأنسولين مايتجمّدش أبداً. خزنه في الثلاجة — مش الفريزر. غيّر مكان الحقن كل مرة. لو السكر نزل تحت 70، خد عسل أو عصير فوراً. لما تكون مريض، قيس السكر أكتر وكلم الدكتور."

## 3. Scenario
> *Patient storing insulin in freezer compartment by mistake. Insulin frozen.*

**Response:** Discard frozen insulin — potency destroyed. Provide new supply. Counsel proper refrigerator storage (not freezer door).
""",
["Lantus/Humalog — main branded insulins Egypt","Never freeze insulin",
 "Injection site rotation prevents lipodystrophy","Sick-day rules — never stop insulin when ill",
 "Biosimilars reducing cost in Egyptian market","Premixed insulin common for simplicity"],
[("Basal insulin example:",["Glargine (Lantus)"],0),("Rapid analog:",["Lispro (Humalog)"],0),
 ("Storage temperature:",["2-8°C refrigerator"],0),("Frozen insulin:",["Discard — inactive"],0),
 ("Hypoglycemia treatment:",["15g fast glucose"],0),("Site rotation prevents:",["Lipodystrophy"],0),
 ("Premix example:",["Mixtard 30"],0),("Never stop insulin when sick:",["May need MORE insulin"],0),
 ("In-use room temp:",["Up to 28-42 days"],0),("Biosimilar example:",["Basaglar"],0)],
["ADA insulin therapy guidelines.","Sanofi Lantus PI.",
 "Novo Nordisk Egypt product guide.","ISPAD insulin storage guidelines."],
"\n*Next: [Lesson 3.6](./lesson-06-devices-monitoring.md)*","Lessons 3.1–3.4")

add("03-diabetes","lesson-06-devices-monitoring.md","EG-MED-03-L06",
"Lesson 3.6: Diabetes Devices, Monitoring & Counseling — Egypt","الدرس 3.6: أجهزة السكري والمتابعة والإرشاد",
["Compare **SMBG meters** available in Egypt","Explain **HbA1c, CGM** access and indications",
 "Counsel on **lancet technique, test strip storage**","Advise on **foot care and annual screening**",
 "Integrate **Course 3** medication counseling"],
"""## 1. Blood glucose monitoring

| Device type | Examples Egypt | Notes |
|---|---|---|
| Glucometers | Accu-Chek, OneTouch, Contour | Strips 1–3 EGP each |
| CGM | FreeStyle Libre (limited) | Sensor ~800–1200 EGP/month |
| HbA1c | Lab test every 3 months | Target <7% most adults |

## 2. Monitoring schedule

| Therapy | SMBG frequency |
|---|---|
| Lifestyle/metformin only | Fasting few times/week |
| Sulfonylurea/insulin | Pre-meal + bedtime; PRN hypoglycemia |
| Intensive insulin | 4+ times daily |

## 3. Foot care & complications screening

Annual: eye exam, foot exam, urine albumin, lipids, renal function.

**Counseling script (Arabic):**
> "افحص رجليك كل يوم — أي جرح صغير ممكن يكبر مع السكري. قيس السكر وسجل الأرقام في دفتر. التحليل التراكمي كل 3 شهور يقولنا التحكم عامل إزاي."

## 4. Course 3 integration scenario
> *Newly diagnosed T2DM. Physician starts metformin + Diamicron MR. Patient asks pharmacy for complete counseling.*

**Response:** Metformin with food; Diamicron before breakfast; hypoglycemia signs; SMBG log; lifestyle; foot care; HbA1c follow-up 3 months.
""",
["Glucometer strips — ongoing cost counseling needed","HbA1c every 3 months — gold standard control",
 "Foot daily self-exam — critical in Egypt barefoot culture","CGM limited by cost in Egypt",
 "Integrated counseling: meds + monitoring + lifestyle","Course 3 complete — proceed to CNS"],
[("HbA1c monitoring frequency:",["Every 3 months"],0),("Most adult target:",["<7%"],0),
 ("SU requires:",["More frequent SMBG"],0),("Foot exam:",["Daily self-check"],0),
 ("CGM limitation Egypt:",["Cost"],0),("Strip storage:",["Dry, capped vial"],0),
 ("Metformin counseling:",["Take with food"],0),("Annual screening includes:",["Eye and kidney"],0),
 ("Hypoglycemia sign:",["Sweating, confusion"],0),("Course 3 next:",["CNS/Analgesics"],0),
 ("Lifestyle:",["Foundation of care"],0)],
["ADA Standards of Care 2024.","International Diabetes Federation — SMBG.",
 "Egyptian Diabetes Association patient education.","NICE Type 2 diabetes monitoring."],
"\n*Course complete. Proceed to [Course 4](../../04-cns-analgesics/course-overview.md)*","Lessons 3.1–3.5")

# Write all lessons
for course, fname, data in ALL:
    write(course, fname, data)

print(f"Generated {len(ALL)} lessons from gen_bulk.py")
