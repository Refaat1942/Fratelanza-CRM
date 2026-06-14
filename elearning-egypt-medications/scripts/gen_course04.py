#!/usr/bin/env python3
"""Generate courses 04-08 lessons."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
exec(open(os.path.join(os.path.dirname(__file__), "gen_bulk.py")).read().split("for course, fname, data in ALL:")[0])

# COURSE 04 CNS
add("04-cns-analgesics","lesson-01-pain-ladder.md","EG-MED-04-L01",
"Lesson 4.1: Pain Physiology & WHO Analgesic Ladder","الدرس 4.1: فسيولوجيا الألم وسلم المسكنات WHO",
["Describe **nociceptive vs neuropathic** pain pathways","Apply **WHO analgesic ladder** steps 1–3",
 "Identify when to **refer** vs OTC treat","Counsel on **pain diary** and expectations in Arabic",
 "Recognize **red flag pain** requiring urgent referral"],
"""## 1. Pain physiology

Nociceptive: tissue damage → inflammatory mediators. Neuropathic: nerve injury → burning, shooting, allodynia.

## 2. WHO analgesic ladder

| Step | Pain | Drugs (Egypt) |
|---|---|---|
| 1 | Mild | Paracetamol, NSAIDs |
| 2 | Moderate | + weak opioids (tramadol, codeine) |
| 3 | Severe | Strong opioids (morphine — hospital) |
| Adjuvant | Neuropathic | Amitriptyline, gabapentin, pregabalin |

**Counseling script (Arabic):**
> "الألم الخفيف نبدأ بمسكن بسيط زي الباراسيتامول. لو مازال، الدكتور يزود حسب سلم WHO. الألم العصبي محتاج أدوية مختلفة — مش بس مسكنات عادية."

## 3. Red flags
Fever + back pain, thunderclap headache, chest pain, sudden severe abdominal pain → urgent referral.
""",
["WHO ladder: paracetamol/NSAID → weak opioid → strong opioid","Neuropathic pain needs adjuvants not step 1 alone",
 "Red flag pain — refer urgently","Pain diary helps physician titration",
 "Egypt OTC access affects step 1-2","Tramadol step 2 — controlled in Egypt"],
[("WHO step 1:",["Paracetamol/NSAIDs"],0),("Neuropathic pain:",["Burning/shooting quality"],0),
 ("Step 2 adds:",["Weak opioid like tramadol"],0),("Red flag:",["Thunderclap headache urgent"],0),
 ("Adjuvant for neuropathic:",["Gabapentin/amitriptyline"],0),("Nociceptive from:",["Tissue damage"],0),
 ("Severe cancer pain:",["Step 3 strong opioids"],0),("Pain diary purpose:",["Track response"],0),
 ("OTC step 1 Egypt:",["Paracetamol, ibuprofen"],0),("Referral needed:",["Red flag symptoms"],0)],
["WHO Cancer Pain Guidelines.","IASP pain definitions.",
 "Egyptian MOH pain management protocol.","NICE neuropathic pain guideline."],
"\n*Next: [Lesson 4.2](./lesson-02-paracetamol-nsaids.md)*")

add("04-cns-analgesics","lesson-02-paracetamol-nsaids.md","EG-MED-04-L02",
"Lesson 4.2: Paracetamol & NSAIDs — Cetal, Brufen, Voltaren","الدرس 4.2: الباراسيتامول ومضادات الالتهاب — سيتال و بروفين",
["Compare **paracetamol vs NSAID** mechanisms and risks","Identify **Cetal, Panadol, Brufen, Voltaren** Egyptian brands",
 "Counsel on **GI, renal, CV risks** of NSAIDs","Apply **max paracetamol 4g/day** rule",
 "Manage **NSAID + antihypertensive** interaction counseling"],
"""## 1. Paracetamol

| Brand (Egypt) | Manufacturer | Strengths | Max dose |
|---|---|---|---|
| Cetal | EIPICO | 500mg | 4g/day adult |
| Panadol | GSK | 500mg | 4g/day |
| Paramol | Pharco | 500mg | 4g/day |

Mechanism: Central COX inhibition. Hepatotoxicity in overdose (>10g or lower with alcohol).

## 2. NSAIDs

| Generic | Brand (Egypt) | Form | Risks |
|---|---|---|---|
| Ibuprofen | Brufen, Advil | Tabs, gel | GI bleed, renal, ↑BP |
| Diclofenac | Voltaren, Cataflam | Tabs, gel, supp | Higher CV risk oral |
| Naproxen | Naproxen | Tabs | Longer acting |
| Ketoprofen | Ketofan | Gel common | Topical safer |
| Aceclofenac | Airtal | Tabs | Popular in Egypt |

**NSAID contraindications:** Active GI ulcer, severe renal impairment, third trimester pregnancy, aspirin asthma.

**Counseling script (Arabic):**
> "الباراسيتامول آمن على المعدة لو مشيت بالجرعة — متعديش 8 أقراص في اليوم. البروفين والفولتارين ياخدوا مع أكل عشان المعدة. لو عندك ضغط أو كلى، اسأل الدكتور قبل ما تاخد مسكنات الالتهاب."

## 3. Scenario
> *Patient on Tareg + Lasix requests Voltaren 50mg TDS for back pain.*

**Response:** NSAID will worsen BP and renal function — suggest paracetamol, topical diclofenac, physiotherapy referral. Physician consult for alternatives.
""",
["Cetal/Panadol — paracetamol max 4g/day","Brufen/Voltaren — take with food",
 "NSAIDs raise BP — critical Egyptian interaction","Topical NSAIDs lower systemic risk",
 "Diclofenac — higher CV risk than naproxen","Avoid NSAIDs third trimester"],
[("Paracetamol max daily:",["4g"],0),("Egyptian paracetamol:",["Cetal"],0),
 ("Ibuprofen brand:",["Brufen"],0),("NSAID GI advice:",["Take with food"],0),
 ("NSAID + ACE-I risk:",["Renal dysfunction and hyperkalemia"],0),
 ("Diclofenac brand:",["Voltaren"],0),("Paracetamol overdose:",["Hepatotoxicity"],0),
 ("Topical NSAID advantage:",["Less systemic effects"],0),("Third trimester NSAID:",["Contraindicated"],0),
 ("NSAID raises:",["Blood pressure"],0)],
["BNF NSAID guidance.","EIPICO Cetal PI.",
 "ESC NSAID CV risk statement.","FDA paracetamol dosing guidance."],
"\n*Next: [Lesson 4.3](./lesson-03-opioids-tramadol.md)*","Lesson 4.1")

add("04-cns-analgesics","lesson-03-opioids-tramadol.md","EG-MED-04-L03",
"Lesson 4.3: Weak & Strong Opioids — Tramadol Controls in Egypt","الدرس 4.3: الأفيونيات وترامادول — الضوابط المصرية",
["Explain **opioid receptor** pharmacology","Describe **tramadol scheduling** and EDA controls Egypt",
 "Counsel on **dependence, constipation, respiratory depression**","Identify **Tramal, Contramal** brands",
 "Address **tramadol abuse epidemic** in Egyptian context"],
"""## 1. Opioid pharmacology

Mu-receptor agonism → analgesia, euphoria, respiratory depression, dependence.

| Drug | Brand (Egypt) | Schedule | Notes |
|---|---|---|---|
| Tramadol | Tramal, Contramal | **Controlled Rx** | SNRI + weak mu agonist |
| Codeine | Codeine comp | Controlled | Often with paracetamol |
| Morphine | MST, Sevredol | Strict controlled | Cancer/severe pain |
| Pethidine | Meperidine | Hospital | Short use |
| Fentanyl | Durogesic patch | Strict | Cancer pain |

## 2. Tramadol in Egypt — abuse epidemic

Tramadol widely misused recreationally (2010s epidemic). EDA tightened controls: prescription tracking, limited dispensing quantities, pharmacist verification.

**Side effects:** Nausea, constipation, seizures (high dose), serotonin syndrome with SSRIs.

**Counseling script (Arabic):**
> "ترامادول دواء مسكن قوي ومحتاج روشتة ومتابعة. ميسببش إدمان لو اتاخد صح، بس التعاطي الخاطئ خطر. اشرب مية كتير وكل ألياف عشان الإمساك. متاخدش أكتر من المكتوب."

## 3. Scenario
> *Young man requests Tramal without prescription — says used before for gym injury.*

**Response:** Refuse — controlled substance requires Rx. Assess for misuse signs. Counsel physician visit. Report suspicious patterns per pharmacy regulations.
""",
["Tramadol controlled in Egypt — Rx mandatory","Tramal/Contramal main brands",
 "Tramadol abuse epidemic — pharmacist gatekeeper role","Constipation prophylaxis counseling",
 "Tramadol + SSRI → serotonin syndrome risk","Never dispense opioids without valid Rx"],
[("Tramadol schedule Egypt:",["Controlled prescription"],0),("Tramadol brand:",["Tramal"],0),
 ("Major opioid risk:",["Respiratory depression"],0),("Tramadol also:",["Inhibits serotonin/norepinephrine reuptake"],0),
 ("Common opioid SE:",["Constipation"],0),("Abuse epidemic drug:",["Tramadol"],0),
 ("SSRI + tramadol:",["Serotonin syndrome risk"],0),("Dispense without Rx:",["Illegal"],0),
 ("Strong opioid cancer:",["Morphine"],0),("Seizure risk:",["High dose tramadol"],0)],
["EDA controlled substances regulations.","WHO tramadol critical review.",
 "Egyptian Narcotics Control authority guidelines.","Grond S tramadol pharmacology review."],
"\n*Next: [Lesson 4.4](./lesson-04-antidepressants.md)*","Lessons 4.1–4.2")

add("04-cns-analgesics","lesson-04-antidepressants.md","EG-MED-04-L04",
"Lesson 4.4: Antidepressants — SSRIs & SNRIs Egyptian Market","الدرس 4.4: مضادات الاكتئاب — SSRIs وSNRIs",
["Explain **SSRI/SNRI mechanisms** and delayed onset","Identify **Cipralex, Seroxat, Cymbalta** Egyptian brands",
 "Counsel on **activation, sexual dysfunction, discontinuation**","Manage **SSRI + tramadol** interaction",
 "Support **adherence** — 2–4 week onset in Arabic"],
"""## 1. SSRIs

| Generic | Brand (Egypt) | Dosing | Notes |
|---|---|---|---|
| Escitalopram | Cipralex | 10–20mg OD | First-line anxiety/depression |
| Sertraline | Lustral | 50–200mg OD | Fewer drug interactions |
| Fluoxetine | Prozac | 20mg OD | Long half-life |
| Paroxetine | Seroxat | 20mg OD | Anticholinergic; avoid in pregnancy |
| Citalopram | Cipram | 20–40mg OD | QT at high dose |

## 2. SNRIs

| Generic | Brand | Dosing |
|---|---|---|
| Venlafaxine | Efexor | 75–225mg |
| Duloxetine | Cymbalta | 60mg OD — pain + depression |

**Onset:** 2–4 weeks for full effect. Do not stop abruptly.

**Counseling script (Arabic):**
> "مضاد الاكتئاب محتاج 2 إلى 4 أسابيع عشان تحس بفرق. متوقفوش فجأة — ممكن يسبب دوخة وعصبية. لو حسيت بتزيد أفكار سيئة، كلم الدكتور فوراً في أول أسبوعين."

## 3. Scenario
> *Patient on Seroxat 3 days stops because 'not working.' Feels dizzy and electric shocks.*

**Response:** Discontinuation syndrome — counsel gradual taper with physician. Explain delayed therapeutic onset. Emergency if suicidal ideation worsens.
""",
["Cipralex (escitalopram) — widely prescribed Egypt","2-4 weeks onset counseling essential",
 "Never abrupt SSRI stop — taper","SSRI + tramadol serotonin syndrome",
 "Seroxat (paroxetine) — avoid pregnancy","SNRI duloxetine — pain and depression"],
[("SSRI onset:",["2-4 weeks"],0),("Cipralex contains:",["Escitalopram"],0),
 ("Seroxat contains:",["Paroxetine"],0),("Abrupt stop causes:",["Discontinuation syndrome"],0),
 ("SNRI example:",["Venlafaxine (Efexor)"],0),("SSRI + tramadol:",["Serotonin syndrome risk"],0),
 ("First-line SSRI often:",["Escitalopram or sertraline"],0),("Cymbalta contains:",["Duloxetine"],0),
 ("Activation early:",["Possible increased anxiety initially"],0),("Pregnancy avoid:",["Paroxetine"],0)],
["NICE depression guidelines.","Lundbeck Cipralex PI.",
 "BNF SSRI discontinuation.","FDA SSRI suicidality warning."],
"\n*Next: [Lesson 4.5](./lesson-05-anxiolytics-hypnotics.md)*","Lessons 4.1–4.4")

add("04-cns-analgesics","lesson-05-anxiolytics-hypnotics.md","EG-MED-04-L05",
"Lesson 4.5: Anxiolytics & Hypnotics — Controlled Substance Rules Egypt","الدرس 4.5: مهدئات القلق والمنومات — الضوابط المصرية",
["Compare **benzodiazepine vs Z-drug** mechanisms","Identify **Lexotanil, Xanax, Stilnox** availability",
 "Apply **EDA controlled substance** dispensing rules","Counsel on **dependence and tapering** in Arabic",
 "Recognize **elderly fall risk** with sedatives"],
"""## 1. Benzodiazepines

| Drug | Brand (Egypt) | Half-life | Risk |
|---|---|---|---|
| Diazepam | Valium | Long | Accumulation elderly |
| Lorazepam | Tavor | Intermediate | Less active metabolites |
| Alprazolam | Xanax | Short | High dependence |
| Bromazepam | Lexotanil | Intermediate | Common Egypt Rx |
| Clonazepam | Rivotril | Long | Epilepsy, panic |

## 2. Z-drugs

| Drug | Brand | Notes |
|---|---|---|
| Zolpidem | Stilnox | Short acting hypnotic |
| Zopiclone | Imovane | Metallic taste |

**EDA controls:** Benzodiazepines require prescription; limited quantities; register in controlled drug book.

**Counseling script (Arabic):**
> "المنومات والمهدئات تسبب اعتماد لو استخدمت فترة طويلة. خدها قبل النوم بـ30 دقيقة ومتسوقش. متاخدش كحول معاها أبداً. الأفضل أقصر مدة ممكن."

## 3. Scenario
> *Elderly patient on Lexotanil 3mg TDS × 2 years requests early refill — third this month.*

**Response:** Assess dependence; counsel physician review for taper. Fall risk in elderly. Do not early refill without prescriber authorization.
""",
["Benzodiazepines — controlled Rx Egypt","Lexotanil (bromazepam) commonly prescribed",
 "Z-drugs — Stilnox for insomnia short-term","Alcohol + benzo → respiratory depression",
 "Elderly — fall and cognitive risk","Maximum 2-4 weeks hypnotic use per guidelines"],
[("Benzodiazepine mechanism:",["Enhances GABA-A"],0),("Lexotanil contains:",["Bromazepam"],0),
 ("Stilnox contains:",["Zolpidem"],0),("Long-term benzo risk:",["Dependence"],0),
 ("Elderly risk:",["Falls and confusion"],0),("Alcohol with benzo:",["Dangerous sedation"],0),
 ("EDA requirement:",["Prescription and register"],0),("Xanax contains:",["Alprazolam"],0),
 ("Hypnotic duration limit:",["Short-term 2-4 weeks"],0),("Taper needed:",["After prolonged use"],0)],
["BNF hypnotics guidance.","EDA narcotics and controlled drugs law.",
 "Beers Criteria elderly sedatives.","WHO sedative appropriate use."],
"\n*Next: [Lesson 4.6](./lesson-06-antiepileptics.md)*","Lessons 4.1–4.5")

add("04-cns-analgesics","lesson-06-antiepileptics.md","EG-MED-04-L06",
"Lesson 4.6: Antiepileptics — Tegretol, Depakine, Levetiracetam","الدرس 4.6: مضادات الصرع",
["Classify **antiepileptic drugs** by mechanism","Identify **Tegretol, Depakine, Keppra** Egyptian brands",
 "Counsel on **adherence — never miss doses**","Manage **teratogenicity counseling** (valproate)",
 "Screen **drug interactions** — carbamazepine enzyme induction"],
"""## 1. Major AEDs — Egypt

| Drug | Brand | Mechanism | Key caution |
|---|---|---|---|
| Carbamazepine | Tegretol | Na channel | Hyponatremia, rash, enzyme inducer |
| Valproate | Depakine | Multiple | **Teratogenic** — avoid women of childbearing age |
| Levetiracetam | Keppra | SV2A | Mood changes; safer in pregnancy |
| Lamotrigine | Lamictal | Na channel | Rash (slow titration) |
| Phenytoin | Epilantin | Na channel | Zero-order kinetics |
| Topiramate | Topamax | Multiple | Cognitive, weight loss |

**Counseling script (Arabic):**
> "مضاد الصرع لازم يتاخد بنظام — أي جرعة فائتة ممكن تسبب نوبة. متوقفش الدوا فجأة. ديباكين ممنوع في الحمل — لو عندكِ إمكانية حمل قولي للدكتور."

## 2. Scenario
> *Woman with epilepsy on Depakine discovers pregnancy 6 weeks. Panicked at pharmacy.*

**Response:** Urgent neurology/obstetrics referral — valproate highly teratogenic. Do not stop abruptly (seizure risk). Specialist will switch to safer AED.
""",
["Tegretol — enzyme inducer affects many drugs","Depakine — contraindicated pregnancy",
 "Keppra — increasingly first-line","Never stop AED abruptly",
 "Adherence critical for seizure control","Lamictal slow titration prevents rash"],
[("Carbamazepine brand:",["Tegretol"],0),("Valproate brand:",["Depakine"],0),
 ("Valproate pregnancy:",["Highly teratogenic — avoid"],0),("Keppra generic:",["Levetiracetam"],0),
 ("Missed AED doses:",["Seizure risk"],0),("CBZ induces:",["CYP enzymes"],0),
 ("Lamictal titration:",["Slow to prevent rash"],0),("Abrupt AED stop:",["Status epilepticus risk"],0),
 ("Phenytoin kinetics:",["Zero-order"],0),("Safer pregnancy AED:",["Levetiracetam often preferred"],0)],
["ILAE epilepsy guidelines.","NICE epilepsy management.",
 "MHRA valproate pregnancy prevention.","Sanofi Depakine PI."],
"\n*Next: [Lesson 4.7](./lesson-07-antipsychotics-adhd.md)*","Lessons 4.1–4.6")

add("04-cns-analgesics","lesson-07-antipsychotics-adhd.md","EG-MED-04-L07",
"Lesson 4.7: Antipsychotics & ADHD Medications — Egypt","الدرس 4.7: مضادات الذهان وأدوية فرط الحركة",
["Distinguish **typical vs atypical antipsychotics**","Identify **Risperdal, Zyprexa, Olanzapine** brands",
 "Counsel on **metabolic monitoring** — weight, glucose","Explain **methylphenidate controls** in Egypt",
 "Manage **extrapyramidal side effect** recognition"],
"""## 1. Antipsychotics

| Drug | Brand (Egypt) | Key effects |
|---|---|---|
| Risperidone | Risperdal | EPS, prolactin elevation |
| Olanzapine | Zyprexa | Weight gain, metabolic |
| Quetiapine | Seroquel | Sedation, metabolic |
| Aripiprazole | Abilify | Partial agonist; less metabolic |
| Haloperidol | Haldol | EPS high — depot available |
| Clozapine | Leponex | Agranulocytosis — specialized |

## 2. ADHD medications

| Drug | Brand | Control |
|---|---|---|
| Methylphenidate | Ritalin, Concerta | **Controlled** |
| Atomoxetine | Strattera | Non-stimulant |

**Counseling script (Arabic):**
> "أدوية الذهان متوقفهاش فجأة. لو لاحظت رعشة أو تصلب، كلم الدكتور. ريتالين للتركيز — يتاخد صبح مش بالليل عشان النوم."

## 3. Scenario
> *Patient on Zyprexa gains 8kg in 3 months. Blood glucose rising.*

**Response:** Metabolic side effect expected — refer for glucose monitoring, lifestyle, possible switch to aripiprazole per psychiatrist.
""",
["Atypical antipsychotics — metabolic monitoring essential","Risperdal/Zyprexa common in Egypt",
 "Ritalin controlled — morning dosing","Never abrupt antipsychotic stop",
 "Clozapine — WBC monitoring mandatory","Abilify — metabolic-friendlier option"],
[("Olanzapine brand:",["Zyprexa"],0),("Major metabolic risk:",["Weight gain and diabetes"],0),
 ("Methylphenidate brand:",["Ritalin"],0),("ADHD stimulant timing:",["Morning"],0),
 ("Risperidone brand:",["Risperdal"],0),("Clozapine monitoring:",["WBC count"],0),
 ("EPS with:",["Haloperidol typical"],0),("Antipsychotic stop:",["Gradual taper"],0),
 ("Atomoxetine:",["Non-stimulant ADHD"],0),("Aripiprazole brand:",["Abilify"],0)],
["NICE psychosis guidelines.","NICE ADHD guidelines.",
 "APA antipsychotic metabolic monitoring.","EDA controlled substances list."],
"\n*Next: [Lesson 4.8](./lesson-08-substance-abuse.md)*","Lessons 4.1–4.7")

add("04-cns-analgesics","lesson-08-substance-abuse.md","EG-MED-04-L08",
"Lesson 4.8: Substance Abuse Awareness — Tramadol Epidemic Egypt","الدرس 4.8: التوعية من تعاطي المخدرات — وباء الترامادول",
["Describe **substance abuse scope** in Egypt","Identify **tramadol, benzodiazepine, pregabalin** misuse",
 "Apply **pharmacist refusal and referral** protocols","Counsel families on **warning signs** in Arabic",
 "Integrate **Course 4** controlled drug responsibilities"],
"""## 1. Egypt substance abuse context

| Substance | Issue |
|---|---|
| Tramadol | Epidemic levels 2010s; regulatory crackdown |
| Benzodiazepines | Diversion and dependence |
| Pregabalin (Lyrica) | Emerging recreational misuse |
| Herbal khat/captagon | Regional trafficking awareness |

## 2. Pharmacist role

- Verify prescriptions for controlled drugs
- Refuse early refills and doctor shopping
- Document suspicious requests
- Refer to addiction services (NCI, psychiatric hospitals)
- Patient education on proper use

**Counseling script (Arabic):**
> "التعاطي الخاطئ للأدوية زي الترامادول والمهدئات بيدمر الصحة والحياة. الصيدلي ملزم قانوناً مايصرفش بدون روشتة صحيحة. لو حد عندك بيتعاطى، ساعده يروح لمركز علاج الإدمان."

## 3. Integration scenario
> *Multiple young men from same area requesting Tramal with similar prescriptions from one clinic.*

**Response:** Report pattern to EDA/narcotics control per regulations. Do not dispense if prescriptions appear fraudulent. Protect community.
""",
["Tramadol epidemic shaped Egyptian controlled drug policy","Pharmacist legally must refuse improper dispensing",
 "Pregabalin emerging misuse concern","Early refill requests — red flag",
 "Referral to NCI addiction services","Course 4 integrates pain + psych + control"],
[("Tramadol Egypt:",["Major abuse epidemic historically"],0),
 ("Pharmacist must:",["Refuse invalid controlled Rx"],0),
 ("Pregabalin brand:",["Lyrica"],0),
 ("Doctor shopping:",["Red flag for misuse"],0),
 ("Benzodiazepine risk:",["Dependence and diversion"],0),
 ("Referral service:",["Addiction treatment centers"],0),
 ("Controlled drug register:",["Required by law"],0),
 ("Family counseling:",["Recognize warning signs"],0),
 ("Course 4 next:",["GI/Respiratory"],0),
 ("Lyrica misuse:",["Emerging concern"],0)],
["EDA narcotics control regulations.","UNODC Egypt drug report.",
 "WHO substance abuse guidelines.","Egyptian National Council for Addiction Treatment."],
"\n*Course complete. Proceed to [Course 5](../../05-gi-respiratory/course-overview.md)*","Lessons 4.1–4.7")

for course, fname, data in ALL:
    write(course, fname, data)
print(f"Course 04: {len(ALL)} lessons")
