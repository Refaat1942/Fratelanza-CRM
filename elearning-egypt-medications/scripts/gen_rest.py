#!/usr/bin/env python3
"""Generate remaining lessons for courses 04-08."""
import os
BASE = "/workspace/elearning-egypt-medications/courses"

def mk(course, fname, lid, te, ta, ob, body, tkw, quiz, refs, nxt="", pre="See course overview"):
    objs = "\n".join(f"{i}. {x}" for i,x in enumerate(ob,1))
    takes = "\n".join(f"> - {x}" for x in tkw)
    qz = ""
    for i,(q,o,a) in enumerate(quiz,1):
        qz += f"**Q{i}.** {q}\n" + "".join(f"- {chr(97+j)}) {x}{' ✓' if j==a else ''}\n" for j,x in enumerate(o)) + "\n"
    refs_s = "\n".join(f"{i}. {r}" for i,r in enumerate(refs,1))
    p = os.path.join(BASE, course, "lessons", fname)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p,"w",encoding="utf-8") as f:
        f.write(f"""# {te}
# {ta}

| | |
|---|---|
| **Duration** | 90 minutes |
| **Lesson ID** | {lid} |
| **Prerequisites** | {pre} |

---

## Learning objectives

After completing this lesson, you will be able to:

{objs}

---

{body}

---

## Key takeaways

> 📌 **Key Takeaways — {lid}**
{takes}

---

## Lesson Quiz (10 questions)

{qz}---

## References

{refs_s}
{nxt}
""".strip()+"\n")

LESSONS = []

def L(course, fname, lid, te, ta, ob, body, tkw, quiz, refs, nxt="", pre="See course overview"):
    LESSONS.append((course, fname, lid, te, ta, ob, body, tkw, quiz, refs, nxt, pre))

# ===== COURSE 04 L02-L08 =====
L("04-cns-analgesics","lesson-02-paracetamol-nsaids.md","EG-MED-04-L02",
"Lesson 4.2: Paracetamol & NSAIDs — Cetal, Brufen, Voltaren","الدرس 4.2: الباراسيتامول ومضادات الالتهاب",
["Compare **paracetamol vs NSAID** mechanisms","Identify **Cetal, Brufen, Voltaren** brands",
 "Counsel **GI, renal, CV risks**","Apply **4g/day paracetamol limit**","Manage **NSAID + antihypertensive** interactions"],
"""## 1. Paracetamol — Egyptian market
| Brand | Manufacturer | Strength | Max dose |
|---|---|---|---|
| Cetal | EIPICO | 500mg | 4g/day |
| Panadol | GSK | 500mg | 4g/day |
| Paramol | Pharco | 500mg | 4g/day |

Hepatotoxicity in overdose. Safe in pregnancy (therapeutic doses).

## 2. NSAIDs
| Generic | Brand | Form | Key risk |
|---|---|---|---|
| Ibuprofen | Brufen | Tabs, gel | GI, renal, ↑BP |
| Diclofenac | Voltaren, Cataflam | Tabs, gel | CV risk oral |
| Naproxen | Naproxen | Tabs | Longer acting |
| Ketoprofen | Ketofan | Gel | Topical safer |

**Contraindications:** Active ulcer, severe CKD, 3rd trimester, aspirin asthma.

**Counseling (Arabic):** \"الباراسيتامول متعديش 8 أقراص في اليوم. البروفين والفولتارين مع الأكل. لو عندك ضغط أو كلى، اسأل الدكتور.\"

## 3. Scenario
> Patient on Tareg requests Voltaren for back pain. Counsel NSAID worsens BP/renal function; suggest paracetamol, topical gel, physician review.""",
["Cetal max 4g/day — hepatotoxicity overdose","Brufen/Voltaren with food",
 "NSAIDs raise BP — Egyptian HTN interaction","Topical diclofenac lower systemic risk",
 "Avoid NSAIDs 3rd trimester","Diclofenac higher CV risk than naproxen"],
[("Paracetamol max:",["4g/day"],0),("Cetal maker:",["EIPICO"],0),("Brufen is:",["Ibuprofen"],0),
 ("NSAID with food:",["Reduces GI upset"],0),("NSAID + ACE-I:",["Renal risk"],0),("Voltaren contains:",["Diclofenac"],0),
 ("Overdose risk:",["Hepatotoxicity"],0),("Topical NSAID:",["Less systemic effects"],0),("3rd trimester:",["Avoid NSAIDs"],0),("NSAID effect on BP:",["Increases"],0)],
["BNF NSAID section.","EIPICO Cetal PI.","ESC NSAID CV statement.","FDA acetaminophen guidance."],
"\n*Next: [Lesson 4.3](./lesson-03-opioids-tramadol.md)*","Lesson 4.1")

L("04-cns-analgesics","lesson-03-opioids-tramadol.md","EG-MED-04-L03",
"Lesson 4.3: Opioids & Tramadol Controls in Egypt","الدرس 4.3: الأفيونيات وترامادول",
["Explain **opioid pharmacology**","Describe **tramadol EDA controls**",
 "Counsel **dependence and constipation**","Identify **Tramal, Contramal**","Address **tramadol abuse epidemic**"],
"""## 1. Opioids Egypt
| Drug | Brand | Control |
|---|---|---|
| Tramadol | Tramal, Contramal | Controlled Rx |
| Codeine | Codeine compound | Controlled |
| Morphine | MST | Strict controlled |

## 2. Tramadol abuse epidemic
EDA tightened controls after widespread misuse. Pharmacist must verify Rx, limit quantities, refuse doctor shopping.

**Side effects:** Nausea, constipation, seizures (OD), serotonin syndrome with SSRIs.

**Counseling (Arabic):** \"ترامادول محتاج روشتة ومتابعة. ميسببش إدمان لو اتاخد صح. اشرب مية وكل ألياف للإمساك.\"

## 3. Scenario
> Tramal request without Rx — refuse, counsel physician visit, watch for misuse patterns.""",
["Tramadol controlled — Rx mandatory","Tramal main brand Egypt",
 "Abuse epidemic shaped regulations","Constipation counseling essential",
 "Tramadol + SSRI serotonin syndrome","Never dispense without valid Rx"],
[("Tramadol Egypt:",["Controlled prescription"],0),("Brand:",["Tramal"],0),("Major risk:",["Respiratory depression"],0),
 ("Tramadol mechanism:",["Weak mu agonist + SNRI activity"],0),("Common SE:",["Constipation"],0),("Abuse concern:",["Tramadol epidemic"],0),
 ("SSRI interaction:",["Serotonin syndrome"],0),("No Rx:",["Must refuse"],0),("Strong cancer opioid:",["Morphine"],0),("Seizure risk:",["High doses"],0)],
["EDA controlled drugs law.","WHO tramadol review.","Egypt narcotics control.","Grond tramadol pharmacology."],
"\n*Next: [Lesson 4.4](./lesson-04-antidepressants.md)*","Lessons 4.1–4.2")

L("04-cns-analgesics","lesson-04-antidepressants.md","EG-MED-04-L04",
"Lesson 4.4: Antidepressants — SSRIs & SNRIs","الدرس 4.4: مضادات الاكتئاب",
["Explain **SSRI/SNRI mechanisms**","Identify **Cipralex, Seroxat, Cymbalta**",
 "Counsel **2-4 week onset**","Manage **discontinuation syndrome**","Screen **SSRI + tramadol** interaction"],
"""## 1. SSRIs Egypt
| Generic | Brand | Dose |
|---|---|---|
| Escitalopram | Cipralex | 10-20mg OD |
| Sertraline | Lustral | 50-200mg |
| Paroxetine | Seroxat | 20mg OD |
| Fluoxetine | Prozac | 20mg OD |

## 2. SNRIs
Venlafaxine (Efexor), Duloxetine (Cymbalta) — also pain indications.

**Counseling (Arabic):** \"مضاد الاكتئاب محتاج 2-4 أسابيع. متوقفوش فجأة. لو أفكار سيئة تزيد، كلم الدكتور فوراً.\"

## 3. Scenario
> Stopped Seroxat after 3 days — dizziness, electric shocks. Explain discontinuation; gradual taper needed.""",
["Cipralex widely used Egypt","2-4 week onset essential counseling",
 "Taper SSRIs — never abrupt","SSRI + tramadol danger",
 "Seroxat avoid pregnancy","Cymbalta for pain+depression"],
[("SSRI onset:",["2-4 weeks"],0),("Cipralex:",["Escitalopram"],0),("Seroxat:",["Paroxetine"],0),
 ("Abrupt stop:",["Discontinuation syndrome"],0),("SNRI:",["Venlafaxine"],0),("SSRI+tramadol:",["Serotonin syndrome"],0),
 ("First-line often:",["Escitalopram/sertraline"],0),("Cymbalta:",["Duloxetine"],0),("Early activation:",["Possible anxiety increase"],0),("Pregnancy avoid:",["Paroxetine"],0)],
["NICE depression.","Cipralex PI.","BNF SSRI withdrawal.","FDA suicidality warning."],
"\n*Next: [Lesson 4.5](./lesson-05-anxiolytics-hypnotics.md)*","Lessons 4.1–4.4")

L("04-cns-analgesics","lesson-05-anxiolytics-hypnotics.md","EG-MED-04-L05",
"Lesson 4.5: Anxiolytics & Hypnotics — Egypt Controls","الدرس 4.5: المهدئات والمنومات",
["Compare **benzodiazepines vs Z-drugs**","Identify **Lexotanil, Xanax, Stilnox**",
 "Apply **EDA controlled rules**","Counsel **dependence** in Arabic","Recognize **elderly fall risk**"],
"""## 1. Benzodiazepines
| Drug | Brand | Notes |
|---|---|---|
| Bromazepam | Lexotanil | Common Egypt |
| Alprazolam | Xanax | High dependence |
| Lorazepam | Tavor | Less metabolites |
| Diazepam | Valium | Long acting |
| Clonazepam | Rivotril | Epilepsy/panic |

## 2. Z-drugs: Stilnox (zolpidem), Imovane (zopiclone)

**Counseling (Arabic):** \"المنومات تسبب اعتماد. خدها قبل النوم ب30 دقيقة. ممنوع الكحول. أقصر مدة ممكن.\"

## 3. Scenario
> Elderly early Lexotanil refill third time — refer prescriber, fall risk, dependence concern.""",
["Benzo controlled Egypt","Lexotanil commonly prescribed",
 "Stilnox short-term insomnia","Alcohol + benzo dangerous",
 "Elderly fall risk","2-4 week hypnotic limit"],
[("Benzo MOA:",["GABA-A enhancement"],0),("Lexotanil:",["Bromazepam"],0),("Stilnox:",["Zolpidem"],0),
 ("Long-term risk:",["Dependence"],0),("Elderly:",["Falls"],0),("Alcohol:",["Dangerous combo"],0),
 ("EDA:",["Prescription required"],0),("Xanax:",["Alprazolam"],0),("Hypnotic duration:",["Short-term"],0),("Taper:",["After prolonged use"],0)],
["BNF hypnotics.","EDA controlled law.","Beers Criteria.","WHO sedative use."],
"\n*Next: [Lesson 4.6](./lesson-06-antiepileptics.md)*","Lessons 4.1–4.5")

L("04-cns-analgesics","lesson-06-antiepileptics.md","EG-MED-04-L06",
"Lesson 4.6: Antiepileptics — Tegretol, Depakine, Keppra","الدرس 4.6: مضادات الصرع",
["Classify **AED mechanisms**","Identify **Tegretol, Depakine, Keppra**",
 "Counsel **never miss doses**","Manage **valproate teratogenicity**","Screen **CBZ interactions**"],
"""## 1. Major AEDs
| Drug | Brand | Caution |
|---|---|---|
| Carbamazepine | Tegretol | Enzyme inducer |
| Valproate | Depakine | Teratogenic |
| Levetiracetam | Keppra | Mood changes |
| Lamotrigine | Lamictal | Rash — slow titration |
| Phenytoin | Epilantin | Zero-order kinetics |

**Counseling (Arabic):** \"مضاد الصرع بنظام — أي جرعة فائتة خطر. ديباكين ممنوع في الحمل.\"

## 3. Scenario
> Pregnant on Depakine — urgent specialist referral, do not stop abruptly.""",
["Tegretol induces CYP enzymes","Depakine contraindicated pregnancy",
 "Keppra increasingly first-line","Never stop AED abruptly",
 "Adherence prevents seizures","Lamictal slow titration"],
[("Tegretol:",["Carbamazepine"],0),("Depakine:",["Valproate"],0),("Pregnancy:",["Avoid valproate"],0),
 ("Keppra:",["Levetiracetam"],0),("Missed doses:",["Seizure risk"],0),("CBZ:",["Enzyme inducer"],0),
 ("Lamictal:",["Slow titration"],0),("Abrupt stop:",["Status risk"],0),("Phenytoin:",["Zero-order kinetics"],0),("Safer pregnancy:",["Levetiracetam often"],0)],
["ILAE guidelines.","NICE epilepsy.","MHRA valproate pregnancy.","Depakine PI."],
"\n*Next: [Lesson 4.7](./lesson-07-antipsychotics-adhd.md)*","Lessons 4.1–4.6")

L("04-cns-analgesics","lesson-07-antipsychotics-adhd.md","EG-MED-04-L07",
"Lesson 4.7: Antipsychotics & ADHD Medications","الدرس 4.7: مضادات الذهان وفرط الحركة",
["Compare **typical vs atypical antipsychotics**","Identify **Risperdal, Zyprexa**",
 "Counsel **metabolic monitoring**","Explain **Ritalin controls**","Recognize **EPS**"],
"""## 1. Antipsychotics
| Drug | Brand | Risk |
|---|---|---|
| Risperidone | Risperdal | EPS, prolactin |
| Olanzapine | Zyprexa | Weight, metabolic |
| Quetiapine | Seroquel | Sedation |
| Aripiprazole | Abilify | Less metabolic |
| Haloperidol | Haldol | High EPS |

## 2. ADHD: Ritalin/Concerta (methylphenidate) — controlled. Strattera non-stimulant.

**Counseling (Arabic):** \"ريتالين صبح مش بالليل. زيبريكسا ممكن تزود الوزن — راقب السكر.\"

## 3. Scenario
> Zyprexa 8kg weight gain — metabolic monitoring, psychiatrist review.""",
["Metabolic monitoring on atypicals","Risperdal/Zyprexa common",
 "Ritalin controlled morning dose","Never abrupt antipsychotic stop",
 "Clozapine needs WBC monitoring","Abilify metabolic-friendlier"],
[("Zyprexa:",["Olanzapine"],0),("Metabolic risk:",["Weight/diabetes"],0),("Ritalin:",["Methylphenidate"],0),
 ("ADHD timing:",["Morning"],0),("Risperdal:",["Risperidone"],0),("Clozapine:",["WBC monitoring"],0),
 ("Haloperidol:",["High EPS"],0),("Stop AP:",["Gradual taper"],0),("Strattera:",["Non-stimulant"],0),("Abilify:",["Aripiprazole"],0)],
["NICE psychosis.","NICE ADHD.","APA metabolic monitoring.","EDA controlled list."],
"\n*Next: [Lesson 4.8](./lesson-08-substance-abuse.md)*","Lessons 4.1–4.7")

L("04-cns-analgesics","lesson-08-substance-abuse.md","EG-MED-04-L08",
"Lesson 4.8: Substance Abuse Awareness — Tramadol Epidemic","الدرس 4.8: التوعية من التعاطي",
["Describe **abuse scope** in Egypt","Identify **tramadol, benzo, pregabalin** misuse",
 "Apply **refusal protocols**","Counsel families in Arabic","Integrate Course 4 controls"],
"""## 1. Egypt context
Tramadol epidemic (2010s), benzodiazepine diversion, Lyrica (pregabalin) emerging misuse.

## 2. Pharmacist role
Verify Rx, refuse early refills, document suspicious patterns, refer NCI addiction services.

**Counseling (Arabic):** \"التعاطي الخاطئ بيدمر الصحة. الصيدلي ملزم مايصرفش بدون روشتة. ساعد اللي حواليك يروح لعلاج الإدمان.\"

## 3. Scenario
> Multiple similar Tramal Rx from one clinic — report per regulations.""",
["Tramadol shaped drug policy","Pharmacist must refuse improper Rx",
 "Pregabalin emerging misuse","Early refill red flag",
 "NCI referral pathway","Course 4 complete"],
[("Tramadol Egypt:",["Abuse epidemic history"],0),("Pharmacist:",["Refuse invalid Rx"],0),("Lyrica:",["Pregabalin"],0),
 ("Doctor shopping:",["Red flag"],0),("Benzo risk:",["Dependence"],0),("Referral:",["Addiction centers"],0),
 ("Register:",["Controlled drug book"],0),("Family:",["Warning signs"],0),("Next course:",["GI/Respiratory"],0),("Pregabalin misuse:",["Emerging"],0)],
["EDA narcotics law.","UNODC Egypt report.","WHO substance abuse.","Egypt addiction council."],
"\n*Course complete. Proceed to [Course 5](../../05-gi-respiratory/course-overview.md)*","Lessons 4.1–4.7")

# ===== COURSE 05 GI/RESP 6 lessons =====
L("05-gi-respiratory","lesson-01-ppi-h2.md","EG-MED-05-L01",
"Lesson 5.1: PPIs & H2 Blockers — Nexium, Controloc, Antodine","الدرس 5.1: مثبطات المضخة وH2",
["Explain **acid suppression mechanisms**","Identify **Nexium, Controloc, Antodine, Pepcid**",
 "Counsel **PPI long-term risks**","Compare **PPI vs H2** indications","Manage **H. pylori triple therapy** components"],
"""## 1. PPIs Egypt
| Generic | Brand | Dose | EGP/month |
|---|---|---|---|
| Esomeprazole | Nexium | 20-40mg OD | 150-400 |
| Pantoprazole | Controloc | 40mg OD | 100-300 |
| Omeprazole | Losec, Omez | 20mg OD | 80-200 |
| Rabeprazole | Pariet | 20mg OD | 120-280 |

## 2. H2 blockers
Famotidine (Pepcid), Ranitidine (limited — withdrawn many markets), Cimetidine (Antodine).

**Long-term PPI risks:** Hypomagnesemia, C. diff, fracture, B12 deficiency.

**Counseling (Arabic):** \"العلاج 30-60 دقيقة قبل الأكل. لو أعراض رجعوا بعد الإيقاف، راجع الدكتور — ممكن التهاب جرثومة المعدة.\"

## 3. H. pylori regimen
PPI + amoxicillin + clarithromycin (Klacid) × 14 days — common Egypt.

## 4. Scenario
> PPI × 3 years without review — counsel magnesium, B12, reassess indication.""",
["Nexium/Controloc dominant Egypt","PPI before meals 30-60 min",
 "H. pylori: PPI+amox+Klacid","Long-term PPI monitoring needed",
 "Antodine H2 for mild GERD","Omeprazole generics affordable"],
[("PPI timing:",["30-60 min before food"],0),("Nexium:",["Esomeprazole"],0),("Controloc:",["Pantoprazole"],0),
 ("H2 example:",["Famotidine"],0),("H pylori needs:",["Triple therapy"],0),("Long PPI risk:",["Hypomagnesemia"],0),
 ("Omez:",["Omeprazole"],0),("Antodine class:",["H2 blocker"],0),("Klacid in H pylori:",["Clarithromycin"],0),("GERD first line often:",["PPI"],0)],
["ACG GERD guidelines.","Nexium PI.","WHO H pylori guidelines.","Takeda Controloc PI."],
"\n*Next: [Lesson 5.2](./lesson-02-antiemetics-ibs.md)*")

L("05-gi-respiratory","lesson-02-antiemetics-ibs.md","EG-MED-05-L02",
"Lesson 5.2: Antiemetics, Prokinetics & IBS","الدرس 5.2: مضادات القيء ومتلازمة القولون",
["Classify **antiemetics** by receptor","Identify **Motilium, Primperan, Zofran**",
 "Counsel **IBS dietary management**","Explain **prokinetic cardiac risk** (domperidone)",
 "Select **IBS agents** — mebeverine, trimebutine"],
"""## 1. Antiemetics
| Drug | Brand | Mechanism |
|---|---|---|
| Metoclopramide | Primperan | D2 antagonist — EPS risk |
| Domperidone | Motilium | D2 — less CNS; QT risk |
| Ondansetron | Zofran | 5-HT3 — chemo/post-op |
| Dimenhydrinate | Dramamine | Antihistamine — motion sickness |

## 2. IBS Egypt
Mebeverine (Duspatalin), Trimebutine (Polybalm), Peppermint oil. Diet: low FODMAP counseling.

**Counseling (Arabic):** \"موتيليوم قبل الأكل ب15-30 دقيقة. قلل الضغط والقهوة لمتلازمة القولون.\"

## 3. Scenario
> Motilium requested long-term — counsel max 7 days per EMA guidance, QT monitoring.""",
["Primperan EPS risk especially young","Motilium QT risk — short courses",
 "Zofran for severe nausea","IBS needs dietary counseling",
 "Mebeverine antispasmodic common","Avoid metoclopramide long-term"],
[("Primperan:",["Metoclopramide"],0),("Motilium:",["Domperidone"],0),("Zofran:",["Ondansetron"],0),
 ("Motilium risk:",["QT prolongation"],0),("IBS diet:",["Low FODMAP help"],0),("Metoclopramide risk:",["EPS"],0),
 ("Mebeverine:",["Antispasmodic"],0),("Motion sickness:",["Dimenhydrinate"],0),("Prokinetic timing:",["Before meals"],0),("Long metoclopramide:",["Avoid"],0)],
["EMA domperidone guidance.","NICE IBS.","Sanofi Motilium PI.","ACG nausea guidelines."],
"\n*Next: [Lesson 5.3](./lesson-03-antidiarrheals-probiotics.md)*","Lesson 5.1")

L("05-gi-respiratory","lesson-03-antidiarrheals-probiotics.md","EG-MED-05-L03",
"Lesson 5.3: Antidiarrheals & Probiotics — Antinal, Normix","الدرس 5.3: مضادات الإسهال والبروبيوتيك",
["Compare **antidiarrheal mechanisms**","Identify **Antinal, Imodium, Normix**",
 "Counsel **when NOT to stop diarrhea**","Explain **rifaximin** for IBS-D and HE",
 "Address **pediatric ORS priority**"],
"""## 1. Antidiarrheals
| Drug | Brand | Use |
|---|---|---|
| Loperamide | Imodium | Symptomatic non-bloody diarrhea |
| Nifuroxazide | Antinal | OTC concern Egypt — not first line |
| Rifaximin | Normix | IBS-D, hepatic encephalopathy |
| Racecadotril | Tiorfan | Enkephalinase inhibitor — pediatrics |

## 2. Probiotics
| Brand | Use |
|---|---|
| Bioflor, Lacteol | Antibiotic-associated diarrhea |
| Enterogermina | Bacillus clausii |

**Counseling (Arabic):** \"الإسهال مع دم أو حرارة — لازم دكتور. ORS أهم من وقف الإسهال للأطفال. إيموديوم للبالغين بس بدون دم.\"

## 3. Scenario
> Child 2 years diarrhea — ORS + zinc, NO loperamide, physician if bloody.""",
["Imodium adults non-bloody diarrhea only","Antinal OTC misuse concern",
 "Normix rifaximin IBS-D/HE","ORS first-line pediatrics",
 "Probiotics with antibiotics help","Bloody diarrhea needs physician"],
[("Imodium:",["Loperamide"],0),("Antinal:",["Nifuroxazide"],0),("Normix:",["Rifaximin"],0),
 ("Child diarrhea first:",["ORS"],0),("Bloody stool:",["Refer physician"],0),("Loperamide child:",["Avoid young children"],0),
 ("Probiotic use:",["AAD prevention"],0),("Nifuroxazide issue:",["OTC misuse"],0),("Rifaximin HE:",["Hepatic encephalopathy"],0),("Zinc with ORS:",["Recommended pediatrics"],0)],
["WHO diarrhea guidelines.","EMA loperamide guidance.","Egyptian Pediatric Society.","Normix PI."],
"\n*Next: [Lesson 5.4](./lesson-04-hepatoprotectants.md)*","Lessons 5.1–5.2")

L("05-gi-respiratory","lesson-04-hepatoprotectants.md","EG-MED-05-L04",
"Lesson 5.4: Hepatoprotectants & Gallstone Medications","الدرس 5.4: حاميات الكبد وحصوات المرارة",
["Evaluate **hepatoprotectant evidence**","Identify **Legalon, Ursofalk, Rowachol**",
 "Counsel on **alcohol avoidance** with liver disease","Explain **UDCA** for gallstones/PBC",
 "Manage **paracetamol overdose** awareness"],
"""## 1. Hepatoprotectants (variable evidence)
| Product | Active | Claim |
|---|---|---|
| Legalon | Silymarin | Milk thistle — adjunct |
| Essentiale | Phospholipids | Fatty liver adjunct |
| Hepaticum | Mixed herbal | Popular Egypt OTC |

Evidence modest — not substitute for treating cause (HBV, NASH, alcohol).

## 2. Gallstone dissolution
Ursodeoxycholic acid (Ursofalk) — cholesterol stones, PBC. Rowachol — adjunct.

**Counseling (Arabic):** \"حاميات الكبد مساعدة بس — الأهم وقف الكحول وعلاج السبب. باراسيتامول متعديش الجرعة — سام للكبد.\"

## 3. Scenario
> Patient with hepatitis B on herbal hepatoprotectant only — urgent physician referral for antiviral assessment.""",
["Legalon popular but modest evidence","Treat underlying liver disease cause",
 "Ursofalk for cholesterol gallstones","Paracetamol overdose hepatotoxic",
 "Alcohol cessation critical","Herbal not substitute for antivirals"],
[("Legalon contains:",["Silymarin"],0),("Ursofalk:",["UDCA"],0),("HBV needs:",["Antiviral assessment"],0),
 ("Paracetamol OD:",["Hepatotoxicity"],0),("Alcohol liver:",["Must stop"],0),("Essentiale:",["Phospholipids"],0),
 ("PBC treatment:",["UDCA"],0),("Herbal alone HBV:",["Insufficient"],0),("Rowachol:",["Gallstone adjunct"],0),("NASH foundation:",["Weight loss"],0)],
["EASL liver disease guidelines.","AASLD HBV guidelines.","Ursofalk PI.","WHO viral hepatitis."],
"\n*Next: [Lesson 5.5](./lesson-05-bronchodilators-inhalers.md)*","Lessons 5.1–5.3")

L("05-gi-respiratory","lesson-05-bronchodilators-inhalers.md","EG-MED-05-L05",
"Lesson 5.5: Bronchodilators & Inhalers — Ventolin, Seretide","الدرس 5.5: موسعات الشعب ومستنشقات",
["Distinguish **SABA, LABA, ICS**","Identify **Ventolin, Seretide, Symbicort**",
 "Teach **inhaler technique** in Arabic","Explain **spacer use** pediatrics",
 "Counsel **rescue vs controller** inhalers"],
"""## 1. Bronchodilators
| Class | Brand | Use |
|---|---|---|
| SABA | Ventolin (salbutamol) | Rescue |
| LABA | Serevent | With ICS only |
| ICS | Flixotide | Controller |
| ICS/LABA | Seretide, Symbicort | Asthma/COPD maintenance |
| Anticholinergic | Spiriva (tiotropium) | COPD |

## 2. Technique
Shake MDI, exhale, seal lips, actuate inhaling slowly, hold 10 sec. Spacer improves delivery pediatrics/elderly.

**Counseling (Arabic):** \"فنتولين للضيق السريع — لو بتستخدمه كتير كل يوم، راجع الدكتور. سيريتايد للوقاية يومياً حتى لو مفيش أعراض. اشطف فمك بعد البخاخ الكورتيزون.\"

## 3. Scenario
> Uses Seretide only when symptomatic — counsel daily controller use, Ventolin for rescue.""",
["Ventolin SABA rescue","Seretide/Symbicort daily controller",
 "Rinse mouth after ICS","Spacer improves technique",
 "LABA never alone in asthma","Shake MDI before use"],
[("Ventolin:",["Salbutamol SABA"],0),("Seretide:",["Fluticasone/salmeterol"],0),("Rescue inhaler:",["SABA"],0),
 ("Controller:",["ICS/LABA daily"],0),("After ICS:",["Rinse mouth"],0),("Spacer helps:",["Pediatric delivery"],0),
 ("LABA alone asthma:",["Not recommended"],0),("Symbicort:",["ICS/formoterol"],0),("COPD long-acting:",["Spiriva"],0),("Hold breath:",["~10 seconds"],0)],
["GINA asthma guidelines.","GOLD COPD.","NHS inhaler technique.","GSK Ventolin PI."],
"\n*Next: [Lesson 5.6](./lesson-06-antihistamines-cold-flu.md)*","Lessons 5.1–5.4")

L("05-gi-respiratory","lesson-06-antihistamines-cold-flu.md","EG-MED-05-L06",
"Lesson 5.6: Antihistamines & Cold/Flu — Telfast, Otrivin","الدرس 5.6: مضادات الهيستامين والبرد",
["Compare **1st vs 2nd gen antihistamines**","Identify **Telfast, Zyrtec, Otrivin**",
 "Counsel **sedation and driving**","Warn **decongestant BP** effect",
 "Select **cold product** appropriate ingredients"],
"""## 1. Antihistamines
| Gen | Brand | Sedation |
|---|---|---|
| 2nd | Telfast (fexofenadine) | Non-sedating |
| 2nd | Zyrtec (cetirizine) | Mild sedation |
| 1st | Allergex (chlorpheniramine) | Sedating |
| 2nd | Claritin (loratadine) | Non-sedating |

## 2. Cold/flu products Egypt
Otrivin (xylometazoline) — max 7 days. Pseudoephedrine products raise BP. Paracetamol + phenylephrine combos common.

**Counseling (Arabic):** \"أوتريفين مايتستخدمش أكتر من 7 أيام — ممكن يسبب احتقان مزمن. مضادات الهيستامين الأولى بتنعس — متسوقش. لو عندك ضغط، احذر مزيلات الاحتقان.\"

## 3. Scenario
> Hypertensive patient wants OTC cold remedy with pseudoephedrine — counsel BP risk, alternative.""",
["Telfast non-sedating choice","Otrivin max 7 days",
 "1st gen antihistamines sedating","Decongestants raise BP",
 "Cold = supportive care mainly","Read combo product labels"],
[("Telfast:",["Fexofenadine"],0),("Otrivin:",["Xylometazoline nasal"],0),("1st gen:",["More sedating"],0),
 ("Decongestant risk:",["Raises BP"],0),("Viral cold:",["Supportive care"],0),("Zyrtec:",["Cetirizine"],0),
 ("Otrivin limit:",["7 days"],0),("Allergex:",["Chlorpheniramine"],0),("Claritin:",["Loratadine"],0),("Combo labels:",["Check ingredients"],0)],
["ARIA allergic rhinitis.","BNF nasal decongestants.","FDA OTC cold guidance.","GSK Otrivin PI."],
"\n*Course complete. Proceed to [Course 6](../../06-otc-selfcare/course-overview.md)*","Lessons 5.1–5.5")

# ===== COURSE 06 OTC 5 lessons =====
L("06-otc-selfcare","lesson-01-otc-regulations.md","EG-MED-06-L01",
"Lesson 6.1: Egyptian OTC Regulatory Framework (EDA)","الدرس 6.1: إطار الأدوية بدون روشتة",
["Explain **EDA OTC classification**","Distinguish **OTC vs Rx vs controlled**",
 "Describe **pharmacist OTC counseling duties**","Identify **products incorrectly sold OTC**",
 "Apply **referral criteria** from self-medication"],
"""## 1. EDA classification
| Category | Examples | Pharmacy rule |
|---|---|---|
| OTC | Paracetamol, some antacids | Counsel appropriately |
| Rx only | Antibiotics, antihypertensives | Valid prescription |
| Controlled | Tramadol, benzos | Register + verify |

## 2. Misuse concerns Egypt
Antibiotics OTC (illegal), nifuroxazide pediatric diarrhea, corticosteroid creams OTC abuse.

**Counseling (Arabic):** \"الصيدلي مسؤول يتأكد إن الدوا مناسب لحالتك. لو الأعراض خطيرة أو مستمرة، لازم دكتور.\"

## 3. Scenario
> Customer demands antibiotic for cold — refuse, educate, supportive care.""",
["EDA regulates OTC vs Rx","Antibiotics never OTC",
 "Pharmacist gatekeeper role","Refer persistent symptoms",
 "Document OTC counseling","Illegal OTC antibiotic sales reportable"],
[("Antibiotics OTC:",["Illegal in Egypt"],0),("EDA role:",["Drug regulation"],0),("Tramadol:",["Controlled Rx"],0),
 ("Pharmacist duty:",["Counsel and refer"],0),("Cold needs:",["Not antibiotics"],0),("OTC example:",["Paracetamol"],0),
 ("Persistent fever:",["Refer physician"],0),("Controlled register:",["Required"],0),("Nifuroxazide:",["OTC concern"],0),("Self-care limit:",["3-5 days symptoms"],0)],
["EDA regulations.","Egyptian Pharmacy Law.","WHO self-medication guidelines.","FIP pharmacist role."],
"\n*Next: [Lesson 6.2](./lesson-02-vitamins-minerals.md)*")

L("06-otc-selfcare","lesson-02-vitamins-minerals.md","EG-MED-06-L02",
"Lesson 6.2: Vitamins & Minerals — Popular Brands Egypt","الدرس 6.2: الفيتامينات والمعادن",
["Classify **vitamin deficiency states**","Identify **Centrum, Vidrop, Ferrograd**",
 "Counsel **iron with vitamin C, empty stomach**","Warn **fat-soluble vitamin overdose**",
 "Advise **calcium + vitamin D** combinations"],
"""## 1. Multivitamins
| Brand | Type | Notes |
|---|---|---|
| Centrum | Adult MV | Popular Egypt |
| Vidrop | Vitamin D drops | Pediatrics |
| Osteocare | Ca + D | Bone health |
| Ferrograd | Iron + folic | Anemia |

## 2. Key counseling
Iron: take with vitamin C, avoid tea/coffee 2h. Vitamin D: 1000-2000 IU maintenance common. B12: neuropathy prevention.

**Counseling (Arabic):** \"الحديد يتاخد على معدة فاضية مع عصير برتقال. فيتامين د مهم في مصر لقلة الشمس. متاخدش مكملات من غير تحليل.\"

## 3. Scenario
> Pregnant woman wants high-dose vitamin A — counsel teratogenicity, prenatal formula instead.""",
["Vidrop D drops pediatrics","Ferrograd iron counseling",
 "Avoid high vitamin A pregnancy","Calcium+D for osteoporosis",
 "Test before megadosing","Centrum general supplement"],
[("Vidrop:",["Vitamin D drops"],0),("Iron absorption:",["Vitamin C helps"],0),("Pregnancy avoid:",["High vitamin A"],0),
 ("Ferrograd:",["Iron supplement"],0),("Osteocare:",["Calcium/vitamin D"],0),("Tea with iron:",["Reduces absorption"],0),
 ("Centrum:",["Multivitamin"],0),("D deficiency Egypt:",["Common"],0),("B12 deficiency:",["Neuropathy risk"],0),("Megadose risk:",["Fat-soluble vitamins"],0)],
["WHO micronutrient guidelines.","NICE anemia.","EDA supplement regulations.","Centrum product info."],
"\n*Next: [Lesson 6.3](./lesson-03-topical-products.md)*","Lesson 6.1")

L("06-otc-selfcare","lesson-03-topical-products.md","EG-MED-06-L03",
"Lesson 6.3: Topical OTC — Skin, Eye, Ear","الدرس 6.3: المستحضرات الموضعية",
["Categorize **topical OTC** products","Identify **Fucidin OTC issue, Optive, Otosporin**",
 "Counsel **antibiotic cream overuse**","Explain **eye drop technique**",
 "Warn **steroid cream misuse**"],
"""## 1. Skin
| Product | Active | Counsel |
|---|---|---|
| Fucidin cream | Fusidic acid | Short course; resistance |
| Canesten | Clotrimazole | Fungal — complete course |
| Betnovate OTC abuse | Betamethasone | **Should be Rx** — skin atrophy |
| Burnol | Antiseptic | Minor burns |

## 2. Eye/Ear
Optive (carboxymethylcellulose), Tobrex (Rx antibiotic), Otosporin (ear infections — Rx).

**Counseling (Arabic):** \"كريمات الكورتيزون خطيرة من غير روشتة — ممكن تسبب بشرة رقيقة. قطرة العين متلمسش العين بالبخاخة.\"

## 3. Scenario
> Chronic betamethasone cream OTC use facial — refer dermatology, steroid withdrawal.""",
["Steroid cream misuse common Egypt","Fucidin short course only",
 "Eye drops — no bottle tip contact","Fungal cream complete 2-4 weeks",
 "Ear drops if TM perforated caution","Sunscreen OTC important"],
[("Betnovate:",["Potent steroid — Rx only"],0),("Canesten:",["Antifungal"],0),("Fucidin:",["Antibiotic cream"],0),
 ("Steroid misuse:",["Skin atrophy"],0),("Eye drop tip:",["Don't touch eye"],0),("Otosporin:",["Ear combination"],0),
 ("Optive:",["Artificial tears"],0),("Fungal duration:",["2-4 weeks"],0),("Antibiotic cream:",["Short course"],0),("Sunscreen:",["UV protection"],0)],
["BNF topical steroids.","EDA cosmetic/topical rules.","WHO skin infection guidance.","Leo Pharma Fucidin PI."],
"\n*Next: [Lesson 6.4](./lesson-04-herbal-traditional.md)*","Lessons 6.1–6.2")

L("06-otc-selfcare","lesson-04-herbal-traditional.md","EG-MED-06-L04",
"Lesson 6.4: Herbal & Traditional Products — Egypt","الدرس 6.4: الأعشاب والطب التقليدي",
["Explain **EDA herbal registration**","Identify **popular Egyptian herbal products**",
 "Counsel **herb-drug interactions**","Assess **quality and contamination risks**",
 "Distinguish **evidence-based vs traditional claims**"],
"""## 1. Regulatory status
Herbal products must register with EDA. Traditional remedies (Hijama, herbal teas) coexist with modern pharmacy.

| Product type | Example | Risk |
|---|---|---|
| Registered herbal | Hepatic herbs | Interaction with Rx |
| Unregistered | Street herbs | Contamination, variable dose |
| Weight loss herbal | Various | Hidden pharmaceuticals |

## 2. Common interactions
St John's wort ↓ OCP, warfarin. Garlic ↑ bleeding with anticoagulants. Licorice ↑ BP.

**Counseling (Arabic):** \"الأعشاب مش معناها آمنة — ممكن تتعارض مع أدوية القلب والضغط. خد المنتج المسجل في هيئة الدواء بس.\"

## 3. Scenario
> Diabetic on metformin adds herbal sugar-lowering tea — counsel hypoglycemia risk, monitor glucose.""",
["EDA registration required","St John's wort major interactions",
 "Licorice raises BP","Unregistered herbs risky",
 "Hidden drugs in weight loss products","Disclose all herbs to pharmacist"],
[("Herbal products need:",["EDA registration"],0),("St John's wort:",["CYP inducer"],0),("Licorice:",["Raises BP"],0),
 ("Unregistered herbs:",["Quality risk"],0),("Weight loss herbal:",["Hidden drugs risk"],0),("Disclose herbs:",["To pharmacist"],0),
 ("Garlic + warfarin:",["Bleeding risk"],0),("Traditional ≠ safe:",["Always"],0),("Diabetic herbs:",["Hypoglycemia risk"],0),("Quality issue:",["Contamination"],0)],
["EDA herbal guidelines.","WHO traditional medicine strategy.","NIH NCCIH herb-drug interactions.","Egypt MOH herbal registration."],
"\n*Next: [Lesson 6.5](./lesson-05-selfcare-scenarios.md)*","Lessons 6.1–6.4")

L("06-otc-selfcare","lesson-05-selfcare-scenarios.md","EG-MED-06-L05",
"Lesson 6.5: Self-Care Counseling Scenarios — Egyptian Practice","الدرس 6.5: سيناريوهات الرعاية الذاتية",
["Apply **WWHAM questions** in Arabic","Triage **minor vs serious** symptoms",
 "Integrate **Courses 1-6 OTC knowledge**","Design **self-care action plans**",
 "Document **counseling and referrals**"],
"""## 1. WWHAM framework
Who — patient age/condition? What — symptoms? How long? Action taken? Medication currently?

## 2. Integrated scenarios

### Scenario A — Heartburn 3 months
Refer GP — possible GERD/H. pylori; OTC antacid short-term only.

### Scenario B — Child fever 39°C
Paracetamol dosing by weight; fluids; refer if <3 months, stiff neck, rash.

### Scenario C — Request double BP medication dose
Refuse without Rx; counsel adherence; physician review.

### Scenario D — Sunburn tourist
Aloe, NSAID gel, hydration; severe blistering — clinic.

**Counseling (Arabic):** \"اسأل نفسك: الأعراض بقت أسوأ؟ في علامات خطر؟ لو آه، روح للدكتور. الصيدلي يساعدك في الحالات البسيطة بس.\"

## 3. Red flags universal
Chest pain, difficulty breathing, severe bleeding, altered consciousness, anaphylaxis → emergency.""",
["WWHAM structured counseling","Red flags → emergency",
 "Chronic symptoms need physician","Weight-based pediatric dosing",
 "Never alter Rx doses OTC","Document all counseling"],
[("WWHAM includes:",["Who What How long Action Meds"],0),("Chronic heartburn:",["Refer GP"],0),("Red flag:",["Chest pain emergency"],0),
 ("Child fever refer:",["<3 months"],0),("Double BP dose:",["Refuse without Rx"],0),("OTC limit:",["Short-term minor ailments"],0),
 ("Anaphylaxis:",["Emergency"],0),("Document:",["Counseling records"],0),("Weight dosing:",["Pediatrics essential"],0),("Course 6 completes:",["OTC pathway"],0)],
["PSNC WWHAM.","WHO self-care guidelines.","Egyptian Pharmacy Practice standards.","RPS minor ailments framework."],
"\n*Course complete. Proceed to [Course 7](../../07-pediatrics/course-overview.md)*","Lessons 6.1–6.4")

# ===== COURSE 07 PEDIATRICS 6 lessons =====
L("07-pediatrics","lesson-01-dosing-formulations.md","EG-MED-07-L01",
"Lesson 7.1: Pediatric Dosing & Formulations Egypt","الدرس 7.1: جرعات الأطفال والتركيبات",
["Calculate **mg/kg dosing**","Select **syrup, drops, dispersible** forms",
 "Identify **Egyptian pediatric brands**","Counsel **accurate measurement**",
 "Avoid **adult formulations** in children"],
"""## 1. Dosing principles
Always weight-based. Clark/YBC rules outdated — use mg/kg per guidelines.

| Formulation | Use |
|---|---|
| Syrup 250mg/5mL | Paracetamol, antibiotics |
| Drops | Vitamin D, some ABX |
| Dispersible tabs | Zinc, some antibiotics |
| Suppositories | Vomiting, young infants |

## 2. Egyptian products
Augmentin susp, Ceporex syrup, Vidrop, Cetal pediatric drops.

**Counseling (Arabic):** \"استخدم السرنجة المرفقة — مش ملعقة الأكل. الجرعة حسب الوزن مش العمر بس.\"

## 3. Scenario
> Mother gives adult paracetamol tablet crushed — calculate correct syrup dose by weight.""",
["Weight-based dosing mandatory","Oral syringe most accurate",
 "Vidrop drops standardized","Never use kitchen spoons",
 "Age bands approximate only","Pediatric formulations safer"],
[("Dosing based on:",["Weight mg/kg"],0),("Best measure:",["Oral syringe"],0),("Vidrop:",["Vitamin D drops"],0),
 ("Kitchen spoon:",["Inaccurate"],0),("Adult tabs crushed:",["Dosing error risk"],0),("Augmentin form:",["Suspension"],0),
 ("Suppository use:",["When vomiting"],0),("Clark rule:",["Outdated"],0),("Drops need:",["Dropper calibration"],0),("Pharmacist calculates:",["Weight dose"],0)],
["BNF Children.","WHO pediatric dosing.","Egyptian Pediatric Society.","NICE medicines for children."],
"\n*Next: [Lesson 7.2](./lesson-02-antibiotics-antipyretics.md)*")

L("07-pediatrics","lesson-02-antibiotics-antipyretics.md","EG-MED-07-L02",
"Lesson 7.2: Pediatric Antibiotics & Antipyretics","الدرس 7.2: مضادات حيوية وخافضات حرارة للأطفال",
["Dose **amoxicillin, augmentin, cephalexin** pediatrics","Identify **Cetal, Brufen pediatric** formulations",
 "Counsel **fever is not always emergency**","Manage **febrile seizure counseling**",
 "Avoid **aspirin in children**"],
"""## 1. Antibiotics pediatrics
| Drug | Brand | Dose example |
|---|---|---|
| Amoxicillin | Amoxil susp | 25-45mg/kg/day divided |
| Amox-clav | Augmentin ES | 45mg/kg amox component |
| Cefalexin | Ceporex syrup | 25-50mg/kg/day |

## 2. Antipyretics
Paracetamol 10-15mg/kg Q4-6h max 4 doses/day. Ibuprofen >6 months 5-10mg/kg.

**NEVER aspirin <16** — Reye syndrome.

**Counseling (Arabic):** \"الحرارة مش عدو — جسم الطفل بيقاتل العدو. باراسيتامول لو حرارة تعبيه أو فوق 38.5. ممنوع أسبرين للأطفال.\"

## 3. Scenario
> 8mo fever 38.2 active playing — counsel observation, fluids, paracetamol only if distressed.""",
["Augmentin ES high-dose otitis","Paracetamol 10-15mg/kg",
 "Ibuprofen >6 months only","No aspirin children Reye",
 "Fever not always treat","Antibiotics only bacterial indications"],
[("Paracetamol dose:",["10-15 mg/kg"],0),("Aspirin child:",["Reye syndrome risk"],0),("Augmentin:",["Amoxicillin-clavulanate"],0),
 ("Ibuprofen age:",[">6 months typically"],0),("Fever treat when:",["Distressed/high"],0),("Ceporex:",["Cefalexin syrup"],0),
 ("Antibiotic viral:",["Not indicated"],0),("Max paracetamol doses:",["4 per day"],0),("Amox dose unit:",["mg/kg/day"],0),("Playing with fever:",["May observe"],0)],
["WHO pediatric fever.","BNF Children antibiotics.","AAP fever guidelines.","GSK Augmentin PI."],
"\n*Next: [Lesson 7.3](./lesson-03-respiratory-cough-cold.md)*","Lesson 7.1")

L("07-pediatrics","lesson-03-respiratory-cough-cold.md","EG-MED-07-L03",
"Lesson 7.3: Pediatric Respiratory & Cough/Cold — What to Avoid","الدرس 7.3: تنفس وسعال الأطفال",
["List **medications to avoid <6 years**","Counsel **saline, humidification**",
 "Identify **Ventolin pediatric dosing**","Warn **codeine cough syrup** ban pediatrics",
 "Manage **wheeze referral criteria**"],
"""## 1. Avoid in young children
Codeine cough syrups (banned pediatrics). Decongestant oral <6. Sedating antihistamines caution.

## 2. Appropriate care
Saline nasal drops, bulb suction infants, honey >1 year cough, paracetamol fever.

| Drug | Pediatric use |
|---|---|
| Salbutamol neb/MDI+spacer | Wheeze per physician |
| Montelukast | Asthma >6 months |
| Desloratadine | >6 months allergy |

**Counseling (Arabic):** \"شراب السعال بالكوديين ممنوع للأطفال. المحلول الملحي للأنف آمن. العسل للسعال بعد سنة.\"

## 3. Scenario
> Mother wants OTC cough syrup 3-year-old — recommend saline, fluids, honey if >1yr, physician if wheeze.""",
["No codeine cough pediatrics","Saline drops first-line",
 "Honey >1 year cough","Ventolin with spacer",
 "Wheeze needs physician","Avoid sedating cold combos"],
[("Codeine child:",["Avoid/banned"],0),("Saline nose:",["Safe first-line"],0),("Honey cough:",[">1 year"],0),
 ("Oral decongestant young:",["Avoid <6"],0),("Wheeze drug:",["Salbutamol per Rx"],0),("Sedating cold syrup:",["Avoid young"],0),
 ("Montelukast:",["Asthma prophylaxis"],0),("Bulb suction:",["Infant nasal"],0),("Fluids:",["Supportive"],0),("Physician wheeze:",["Required"],0)],
["FDA pediatric cough guidance.","GINA pediatric asthma.","WHO URI children.","MHRA codeine pediatrics."],
"\n*Next: [Lesson 7.4](./lesson-04-pediatric-gi.md)*","Lessons 7.1–7.2")

L("07-pediatrics","lesson-04-pediatric-gi.md","EG-MED-07-L04",
"Lesson 7.4: Pediatric GI — ORS, Antiemetics, Colic","الدرس 7.4: جهاز هضمي للأطفال",
["Prepare **ORS counseling**","Identify **Enterogermina, Lacinox**",
 "Manage **infant colic** non-drug measures","Avoid **loperamide young children**",
 "Counsel **zinc supplementation** diarrhea"],
"""## 1. ORS
WHO formula ORS sachets — reconstitute correctly. Zinc 10mg <6mo, 20mg >6mo × 10-14 days diarrhea.

## 2. Colic
Simethicone (Infacol limited), probiotics, swaddling, parental support. No dicyclomine infants.

## 3. Antiemetics
Ondansetron prescription severe vomiting. Domperidone short course per physician.

**Counseling (Arabic):** \"محلول الجفاف يحل في لتر مية نظيفة — متزودش سكر. الزنك يقصر مدة الإسهال. المغص يتحسن غالباً بعد 3 شهور.\"

## 4. Scenario
> Dehydrated child lethargic — ORS while arranging urgent care, NOT home alone if severe.""",
["ORS cornerstone diarrhea","Zinc 10-14 days diarrhea",
 "No loperamide young","Colic peaks 6 weeks",
 "Probiotics adjunct AAD","Severe dehydration urgent"],
[("ORS key for:",["Diarrhea dehydration"],0),("Zinc duration:",["10-14 days"],0),("Loperamide young:",["Avoid"],0),
 ("Colic improves:",["~3-4 months"],0),("Probiotics:",["AAD adjunct"],0),("Lethargy:",["Urgent care"],0),
 ("ORS prep:",["Correct water volume"],0),("Dicyclomine infant:",["Avoid"],0),("Enterogermina:",["Probiotic"],0),("Home severe dehydration:",["Insufficient"],0)],
["WHO diarrhea program.","UNICEF ORS zinc.","Egyptian Pediatric Society.","NICE dehydration children."],
"\n*Next: [Lesson 7.5](./lesson-05-vitamins-iron.md)*","Lessons 7.1–7.4")

L("07-pediatrics","lesson-05-vitamins-iron.md","EG-MED-07-L05",
"Lesson 7.5: Pediatric Vitamins, Iron & Growth","الدرس 7.5: فيتامينات وحديد الأطفال",
["Dose **vitamin D 400IU** infants","Identify **Vidrop, Fer-In-Sol**",
 "Counsel **iron staining teeth** — syringe back cheek","Assess **failure to thrive referral**",
 "Warn **iron overdose toxicity**"],
"""## 1. Vitamin D
400 IU/day infants breastfed. Vidrop drops common Egypt. Deficiency rickets risk.

## 2. Iron
Fer-In-Sol, Maltofer. Take away from dairy/calcium 2h. Stool darkening normal.

## 3. Multivitamins
Bebelac vitamins, Centrum kids — supplement if diet inadequate.

**Counseling (Arabic):** \"فيتامين د يومياً للرضع. الحديد يتاخد بعيد عن الحليب. احفظ الحديد بعيد عن الأطفال — سم لو أخدوا كتير.\"

## 4. Scenario
> Toddler ate iron tablets — emergency poison center, vomiting, deferoxamine possible.""",
["Vit D 400IU/day infants","Iron away from dairy",
 "Iron overdose emergency","Vidrop standard Egypt",
 "Dark stool iron normal","FTT needs physician"],
[("Infant vitamin D:",["400 IU/day"],0),("Vidrop:",["D drops"],0),("Iron + milk:",["Separate 2 hours"],0),
 ("Iron OD:",["Emergency"],0),("Dark stool:",["Normal on iron"],0),("Rickets prevent:",["Vitamin D"],0),
 ("Store iron:",["Child-proof"],0),("Maltofer:",["Iron supplement"],0),("FTT:",["Refer"],0),("Breastfed needs:",["Vitamin D supplement"],0)],
["AAP vitamin D policy.","WHO infant iron.","Egyptian nutrition guidelines.","Poison center Egypt protocols."],
"\n*Next: [Lesson 7.6](./lesson-06-vaccination.md)*","Lessons 7.1–7.5")

L("07-pediatrics","lesson-06-vaccination.md","EG-MED-07-L06",
"Lesson 7.6: Vaccination Schedule Egypt & Pharmacy Role","الدرس 7.6: جدول التطعيمات في مصر",
["State **Egyptian MOH immunization schedule**","Identify **key vaccines** birth-18 months",
 "Counsel **vaccine myths** in Arabic","Store **cold chain** awareness",
 "Support **referral to vaccination centers**"],
"""## 1. Egypt MOH schedule (key ages)
| Age | Vaccines |
|---|---|
| Birth | BCG, HepB 0 |
| 2,4,6 mo | Pentavalent (DPT+Hib+HepB), OPV/IPV, PCV, Rotavirus |
| 9 mo | Measles/MMR |
| 18 mo | DPT booster, MMR, OPV |
| School | Boosters per MOH updates |

## 2. Pharmacy role
Counsel on schedule, refer to centers, some pharmacies participate in vaccination programs. Cold chain 2-8°C.

**Counseling (Arabic):** \"التطعيمات بتحمي من أمراض خطيرة — الآثار الجانبية خفيفة زي حرارة وسخونة مكان الحقنة. الربط بين التطعيم والتوحد غلط علمياً.\"

## 3. Scenario
> Parent refuses MMR — counsel evidence, herd immunity, document, respectful persistence.""",
["MOH schedule pentavalent 2-4-6mo","MMR 9 and 18 months",
 "Autism link debunked","Cold chain essential",
 "Pharmacy referral role","BCG at birth"],
[("Birth vaccine:",["BCG and HepB"],0),("Pentavalent months:",["2,4,6"],0),("MMR timing:",["9 and 18 months"],0),
 ("Autism claim:",["False"],0),("Cold chain:",["2-8°C"],0),("Pharmacy role:",["Counsel and refer"],0),
 ("Rotavirus:",["In schedule"],0),("PCV:",["Pneumococcal conjugate"],0),("Herd immunity:",["Community protection"],0),("Local reaction:",["Normal mild"],0)],
["Egypt MOH immunization schedule.","WHO immunization standards.","CDC vaccine information.","UNICEF Egypt EPI."],
"\n*Course complete. Proceed to [Course 8](../../08-womens-health/course-overview.md)*","Lessons 7.1–7.5")

# ===== COURSE 08 WOMENS HEALTH 5 lessons =====
L("08-womens-health","lesson-01-contraceptives.md","EG-MED-08-L01",
"Lesson 8.1: Contraceptives Available in Egypt","الدرس 8.1: وسائل منع الحمل في مصر",
["List **OCP, IUD, implant, emergency** options Egypt","Identify **Microgynon, Yasmin, IUD brands**",
 "Counsel **missed pill rules** in Arabic","Explain **rifampicin/OCP interaction**",
 "Compare **LARC vs daily pills**"],
"""## 1. Contraceptive methods Egypt
| Method | Examples | Notes |
|---|---|---|
| COC | Microgynon, Yasmin, Marvelon | Daily pill |
| POP | Micronor | Progestin only |
| Emergency | Postinor-2 (levonorgestrel) | 72h |
| IUD | Copper IUD, Mirena (limited) | LARC |
| Implant | Implanon (limited) | 3 years |
| Injectable | Depo-Provera | 3 months |

## 2. Missed pill rules
<12h late — take immediately. >12h — refer to leaflet, backup 7 days.

**Counseling (Arabic):** \"الحبوب لازم نفس الساعة يومياً. لو نسيتي قرص، شوفي التعليمات على العبوة. الريفامبيسين بيقلل فعالية منع الحمل.\"

## 3. Scenario
> TB patient on rifampicin using Microgynon — counsel failure risk, IUD or depot alternative.""",
["Microgynon widely available","Postinor-2 emergency 72h",
 "Rifampicin reduces OCP efficacy","LARC most effective reversible",
 "Missed pill backup needed","COC contraindications: thrombosis, migraine aura"],
[("Emergency contraceptive:",["Postinor-2"],0),("Rifampicin OCP:",["Reduces efficacy"],0),("LARC example:",["IUD"],0),
 ("COC example:",["Microgynon"],0),("Missed pill >12h:",["Backup contraception"],0),("Depo interval:",["3 months"],0),
 ("Implanon duration:",["3 years"],0),("POP brand:",["Micronor"],0),("Take pill timing:",["Same time daily"],0),("TB on OCP:",["Need alternative method"],0)],
["WHO contraception guidelines.","FSRH missed pill.","Egypt MOH family planning.","Bayer Microgynon PI."],
"\n*Next: [Lesson 8.2](./lesson-02-pregnancy-safe-meds.md)*")

L("08-womens-health","lesson-02-pregnancy-safe-meds.md","EG-MED-08-L02",
"Lesson 8.2: Pregnancy-Safe Medications — PLLR Review","الدرس 8.2: أدوية آمنة في الحمل",
["Apply **pregnancy risk assessment**","List **safe: paracetamol, some antibiotics**",
 "Identify **contraindicated: ACE-I, valproate, warfarin**","Counsel **morning sickness** options",
 "Use **FDA PLLR categories** context"],
"""## 1. Generally safe
Paracetamol, many penicillins/cephalosporins, insulin, some antihistamines (loratadine).

## 2. Contraindicated
| Drug class | Risk |
|---|---|
| ACE-I/ARB | Fetal renal damage |
| Valproate | Neural tube defects |
| Warfarin | Teratogenic 1st trimester |
| Methotrexate | Teratogenic |
| Live vaccines | Fetal infection risk |
| NSAIDs | 3rd trimester ductus closure |

## 3. Nausea/vomiting pregnancy
Pyridoxine, doxylamine (Diclegis limited), metoclopramide short-term.

**Counseling (Arabic):** \"لو حامل، قولي للصيدلي قبل أي دواء. الباراسيتامول آمن. الإيبوبروفين ممنوع في آخر الحمل. ممنوع أدوية الضغط من مجموعة ACE.\"

## 4. Scenario
> Pregnant woman prescribed lisinopril — urgent physician contact for safer antihypertensive (methyldopa, labetalol, nifedipine).""",
["Paracetamol first-line pain pregnancy","ACE-I contraindicated all trimesters",
 "Valproate never in pregnancy","NSAID avoid 3rd trimester",
 "Penicillins generally safe","Always check pregnancy before dispensing"],
[("Pain pregnancy safe:",["Paracetamol"],0),("ACE-I pregnancy:",["Contraindicated"],0),("Valproate:",["Teratogenic"],0),
 ("NSAID 3rd trimester:",["Avoid"],0),("Penicillin pregnancy:",["Generally safe"],0),("Warfarin 1st tri:",["Teratogenic"],0),
 ("HTN pregnancy alt:",["Labetalol/methyldopa"],0),("Methotrexate:",["Contraindicated"],0),("Live vaccines pregnancy:",["Avoid"],0),("Check pregnancy:",["Before any Rx"],0)],
["ACOG medication pregnancy.","BNF pregnancy appendix.","MHRA valproate pregnancy prevention.","FDA PLLR guidance."],
"\n*Next: [Lesson 8.3](./lesson-03-lactation.md)*","Lesson 8.1")

L("08-womens-health","lesson-03-lactation.md","EG-MED-08-L03",
"Lesson 8.3: Lactation Compatibility — Egyptian Prescriptions","الدرس 8.3: الرضاعة وتوافق الأدوية",
["Use **LactMed principles**","Identify **compatible: most penicillins, paracetamol**",
 "Counsel **incompatible: some chemo, radiopharmaceuticals**","Manage **mastitis antibiotic selection**",
 "Advise **timing doses** relative to feeds"],
"""## 1. Generally compatible
Paracetamol, ibuprofen (short-term), penicillins, cephalosporins, most insulins.

## 2. Use with caution / avoid
| Drug | Lactation |
|---|---|
| Codeine | Avoid — infant CNS depression (ultra-rapid metabolizers) |
| Metronidazole | Short courses OK; pause breastfeeding 12-24h high dose |
| Fluoroquinolones | Avoid if alternatives |
| Bromocriptine | Suppresses lactation |

## 3. Mastitis
Flucloxacillin, cephalexin compatible — continue breastfeeding.

**Counseling (Arabic):** \"معظم المضادات البنسلين آمنة في الرضاعة. الكوديين ممكن يسبب نعاس للرضيع — تجنبيه. استمري في الرضاعة مع التهاب الثدي مع المضاد المناسب.\"

## 4. Scenario
> Breastfeeding mother prescribed codeine post C-section — counsel alternative analgesia (paracetamol, ibuprofen).""",
["Penicillins compatible lactation","Codeine avoid breastfeeding",
 "Continue BF with mastitis + ABX","Fluoroquinolones avoid if possible",
 "LactMed reference standard","Timing high-risk drugs after feed"],
[("Paracetamol lactation:",["Compatible"],0),("Codeine lactation:",["Avoid"],0),("Mastitis:",["Breastfeed + antibiotic"],0),
 ("Penicillin:",["Generally compatible"],0),("FQ lactation:",["Avoid if alternatives"],0),("Metronidazole:",["Short course often OK"],0),
 ("Reference:",["LactMed"],0),("Bromocriptine:",["Stops lactation"],0),("Ibuprofen short:",["Generally compatible"],0),("Chemo:",["Contraindicated BF"],0)],
["LactMed database.","ABM mastitis protocol.","WHO breastfeeding and medicines.","BNF lactation appendix."],
"\n*Next: [Lesson 8.4](./lesson-04-menopause-hrt.md)*","Lessons 8.1–8.2")

L("08-womens-health","lesson-04-menopause-hrt.md","EG-MED-08-L04",
"Lesson 8.4: Menopause & HRT Products in Egypt","الدرس 8.4: سن اليأس والعلاج الهرموني",
["Explain **HRT benefits/risks**","Identify **Premarin, Activelle, Estradiol patches**",
 "Counsel **VTE, breast cancer risk**","Describe **non-hormonal alternatives** — SSRIs, gabapentin",
 "Screen **contraindications** — breast cancer history"],
"""## 1. HRT products Egypt
| Type | Brand | Components |
|---|---|---|
| Oral CEE | Premarin | Conjugated estrogens |
| Combined | Activelle, Femoston | Estrogen + progestogen |
| Patch | Estraderm | Transdermal estradiol |
| Local | Ovestin cream | Vaginal estriol |

## 2. Indications
Moderate-severe vasomotor symptoms, urogenital atrophy. Shortest effective duration.

**Risks:** VTE, stroke (oral), breast cancer with long combined HRT.

**Counseling (Arabic):** \"العلاج الهرموني يفيد الهبات الساخنة بس ليه مخاطر — أقصر مدة وأقل جرعة. اللصقة ممكن تكون أأمن من الحبوب للجلطات.\"

## 3. Scenario
> Woman 52 severe hot flashes, hysterectomy — estrogen-only HRT option with physician; annual review.""",
["HRT shortest duration lowest dose","Patch lower VTE than oral estrogen",
 "Add progestogen if uterus present","Premarin/Activelle available Egypt",
 "Non-hormonal: SSRIs, gabapentin","Breast cancer history contraindication"],
[("HRT principle:",["Lowest dose shortest time"],0),("Patch vs oral:",["Lower VTE patch"],0),("Uterus present needs:",["Progestogen"],0),
 ("Premarin:",["Conjugated estrogens"],0),("Contraindication:",["Breast cancer history"],0),("Non-hormonal:",["SSRI/gabapentin"],0),
 ("Activelle:",["Combined HRT"],0),("Local estrogen:",["Vaginal atrophy"],0),("Annual review:",["Required"],0),("Hysterectomy:",["Estrogen only possible"],0)],
["NICE menopause guidelines.","BMS HRT guidance.","WH WHI study context.","Pfizer Premarin PI."],
"\n*Next: [Lesson 8.5](./lesson-05-fertility-prenatal.md)*","Lessons 8.1–8.4")

L("08-womens-health","lesson-05-fertility-prenatal.md","EG-MED-08-L05",
"Lesson 8.5: Fertility Treatments & Prenatal Vitamins Egypt","الدرس 8.5: الخصوبة وفيتامينات ما قبل الحمل",
["List **fertility drugs** — clomiphene, gonadotropins","Identify **prenatal vitamins Egypt** — Folic acid, Pregnacare",
 "Counsel **folic acid 400mcg preconception**","Explain **IVF medication** awareness",
 "Support **iron and DHA** in pregnancy supplements"],
"""## 1. Fertility medications
| Drug | Brand | Use |
|---|---|---|
| Clomiphene | Clomid | Ovulation induction |
| Letrozole | Femara | Off-label ovulation |
| Gonadotropins | Gonal-F, Menogon | IVF stimulation |
| hCG trigger | Pregnyl, Ovitrelle | Trigger ovulation |
| Progesterone | Utrogestan, Cyclogest | Luteal support |

## 2. Prenatal vitamins Egypt
| Product | Contents |
|---|---|
| Folic acid | 400-500mcg — preconception |
| Pregnacare | MV + folic + DHA |
| Materna | Prenatal MV |
| Feroglobin | Iron + folic |

**Folic acid:** 400mcg ≥1 month preconception — neural tube defect prevention. 5mg if high risk.

**Counseling (Arabic):** \"حمض الفوليك يبدأ قبل الحمل بشهر على الأقل. فيتامينات الحمل مش بديل أكل صحي. أدوية الخصوبة محتاجة متابعة طبية دقيقة.\"

## 3. Scenario
> Woman planning pregnancy on valproate — urgent neurology switch before conception.""",
["Folic acid 400mcg preconception","Clomid common ovulation induction",
 "IVF drugs specialist only","Pregnacare popular Egypt",
 "Valproate must stop pre-pregnancy","DHA supports fetal brain development"],
[("Folic acid dose:",["400mcg standard"],0),("Start folic:",["1 month preconception"],0),("Clomid:",["Clomiphene"],0),
 ("Valproate conception:",["Contraindicated — switch"],0),("Pregnacare:",["Prenatal vitamin"],0),("High risk folic:",["5mg"],0),
 ("IVF gonadotropins:",["Specialist use"],0),("Progesterone luteal:",["Utrogestan"],0),("NTD prevention:",["Folic acid"],0),("Fertility self-medicate:",["Never"],0)],
["WHO preconception care.","NICE fertility guidelines.","ACOG folic acid.","Vitabiotics Pregnacare PI."],
"\n*Course complete. Proceed to [Final Assessment](../../../assessments/MASTER-QUIZ-BANK.md)*","Lessons 8.1–8.4")

for args in LESSONS:
    mk(*args)

print(f"Generated {len(LESSONS)} lessons total")
