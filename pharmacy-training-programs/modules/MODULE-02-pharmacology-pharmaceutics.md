# Module 2: Pharmacology & Pharmaceutics
# الوحدة 2: علم الأدوية والصيدليات

| | |
|---|---|
| **Duration** | 16 contact hours + 6 self-study hours |
| **Level** | Intermediate — pharmacists essential; assistants selected sections |
| **Prerequisites** | Module 1 |
| **Assessment** | 25 MCQ + calculation exam (5 problems) |

---

## Learning objectives

1. **Explain** ADME processes with quantitative parameters (t½, Vd, CL, F, Cmax, Tmax)
2. **Calculate** loading and maintenance doses using basic pharmacokinetic equations
3. **Describe** receptor theory and dose-response relationships (ED50, TD50, therapeutic index)
4. **Compare** dosage forms by bioavailability and clinical implications
5. **Evaluate** bioequivalence criteria (FDA/EMA: 80–125% CI) for generic substitution

---

## Section 2.1 — Pharmacokinetics (ADME)

### 2.1.1 Absorption

**Bioavailability (F):** Fraction of administered dose reaching systemic circulation unchanged.

| Route | F (typical) | Onset | Clinical note |
|---|---|---|---|
| IV | 1.0 (100%) | Immediate | Reference standard |
| IM | 0.65–0.90 | 10–30 min | Depot effect for some drugs |
| Oral (tablet) | 0.05–1.0 | 30–90 min | First-pass metabolism reduces F |
| Sublingual | 0.3–0.8 | 1–5 min | Bypasses first-pass (nitroglycerin) |
| Topical | Variable | Hours | Depends on skin permeability |
| Inhaled | 0.1–0.9 | Seconds–min | Local vs systemic effect |

**First-pass metabolism:** Oral drugs absorbed from GI tract pass through portal vein → liver before systemic circulation. Drugs with high first-pass (e.g., propranolol F≈0.25, morphine F≈0.25) have much lower oral bioavailability than IV.

**Example calculation:**

> Propranolol 80mg oral, F = 0.25. What is the systemic dose equivalent?
> Systemic dose = 80 × 0.25 = **20 mg**

### 2.1.2 Distribution — Volume of distribution (Vd)

**Formula:** Vd = Dose / Plasma concentration (at t=0)

| Vd range | Interpretation | Example drugs |
|---|---|---|
| Low (4–8 L) | Confined to plasma | Warfarin, phenytoin (highly protein-bound) |
| Medium (15–50 L) | Distributes to ECF | Ethanol, theophylline |
| High (>100 L) | Extensive tissue distribution | Chloroquine (Vd >500L), amiodarone |

**Clinical significance:** High Vd drugs take longer to eliminate from body; dialysis is ineffective for removal.

### 2.1.3 Metabolism — Cytochrome P450 system

**Major CYP enzymes and substrates:**

| Enzyme | % of drugs metabolized | Key substrates | Important inhibitors | Important inducers |
|---|---|---|---|---|
| **CYP3A4** | ~50% | Simvastatin, amlodipine, cyclosporine, midazolam | Ketoconazole, grapefruit juice, erythromycin | Rifampicin, carbamazepine, St. John's Wort |
| **CYP2D6** | ~25% | Codeine, tramadol, metoprolol, tamoxifen | Fluoxetine, paroxetine, bupropion | None clinically significant |
| **CYP2C9** | ~15% | Warfarin, phenytoin, losartan, NSAIDs | Amiodarone, fluconazole | Rifampicin, phenytoin |
| **CYP2C19** | ~10% | Clopidogrel, omeprazole, diazepam | Omeprazole, fluconazole | Rifampicin |

**CYP2D6 genetic polymorphism:**
- **Poor metabolizers (PM):** 5–10% of Caucasians, higher in some Asian populations
- **Codeine in PM:** Cannot convert to morphine → **no analgesic effect**
- **Ultra-rapid metabolizers (UM):** Excessive morphine from codeine → **respiratory depression risk** (FDA black box warning removed codeine from pediatric use partly for this reason)

### 2.1.4 Excretion and half-life

**Elimination half-life (t½):** Time for plasma concentration to decrease by 50%.

**Formula (first-order kinetics):** t½ = 0.693 / ke (where ke = elimination rate constant)

**Steady-state rule:** Steady state reached after **4–5 half-lives** of continuous dosing.

| Drug | t½ | Time to steady state | Clinical implication |
|---|---|---|---|
| Atenolol | 6–7 h | 1–2 days | Once-daily dosing achievable |
| Warfarin | 36–42 h | 7–10 days | Dose changes need 1 week to assess |
| Diazepam | 20–50 h (active metabolite 100h) | 1–2 weeks | Accumulation in elderly |
| Amiodarone | 40–55 days | **Months** | Loading dose essential |

**Loading dose formula:**

> Loading dose = (Vd × target concentration) / F

**Maintenance dose formula:**

> Maintenance dose = (CL × target concentration × τ) / F
> Where τ = dosing interval, CL = clearance

**Worked example:**

> Digoxin: Vd = 7 L/kg, target = 1 mcg/L, F = 0.7, patient = 70 kg
> Loading dose = (7 × 70 × 1) / 0.7 = **700 mcg = 0.7 mg**

---

## Section 2.2 — Pharmacodynamics

### 2.2.1 Receptor theory

**Drug-receptor interaction:** Most drugs bind specific molecular targets:

| Receptor type | Mechanism | Examples |
|---|---|---|
| GPCR (G-protein coupled) | 7-transmembrane, second messengers | Beta-adrenergic (salbutamol), opioid (morphine), histamine (chlorpheniramine) |
| Ion channels | Open/close ion flow | Lidocaine (Na+ channel), benzodiazepines (GABA-A Cl-) |
| Enzymes | Inhibit catalytic activity | ACE inhibitors, statins (HMG-CoA reductase) |
| Nuclear receptors | Gene transcription | Corticosteroids, thyroid hormones, oral contraceptives |

**Agonist vs antagonist:**
- **Full agonist:** Maximum response (morphine at opioid receptor)
- **Partial agonist:** Submaximal response (buprenorphine)
- **Antagonist:** Blocks receptor, no intrinsic activity (naloxone)
- **Inverse agonist:** Reduces constitutive receptor activity

### 2.2.2 Dose-response relationships

**Key parameters:**

| Parameter | Definition | Clinical use |
|---|---|---|
| **ED50** | Dose producing 50% of maximum effect | Potency comparison |
| **TD50** | Dose producing toxicity in 50% | Safety assessment |
| **Therapeutic Index (TI)** | TD50 / ED50 (or LD50/ED50) | Narrow TI = high monitoring need |
| **Margin of Safety** | TD1 / ED99 | More clinically relevant than TI |

**Narrow therapeutic index drugs (NTI) — require extra caution:**

| Drug | Therapeutic range | Toxicity |
|---|---|---|
| Warfarin | INR 2–3 | Bleeding |
| Digoxin | 0.5–2.0 ng/mL | Arrhythmias, nausea |
| Lithium | 0.6–1.2 mmol/L | Tremor, renal toxicity, toxicity |
| Phenytoin | 10–20 mcg/mL | Ataxia, nystagmus, gingival hyperplasia |
| Theophylline | 10–20 mcg/mL | Seizures, arrhythmias |
| Carbamazepine | 4–12 mcg/mL | Drowsiness, diplopia, blood dyscrasias |
| Insulin | Variable | Hypoglycemia |

**WHO/ISMP classification:** All NTI drugs are **high-alert medications** requiring independent double-check before dispensing.

---

## Section 2.3 — Pharmaceutics — dosage forms

### 2.3.1 Solid oral dosage forms

| Form | Manufacturing | Release | Do not crush/split |
|---|---|---|---|
| Immediate-release tablet | Compressed powder | Rapid | Some scored tablets OK to split |
| Enteric-coated | Polymer coat dissolves in intestine | Delayed (protects stomach or drug) | **Yes — destroys coating** |
| Sustained-release (SR/XL) | Matrix or osmotic pump | Slow over 12–24h | **Yes — dose dumping risk** |
| Sublingual (SL) | Rapid dissolution | Minutes | N/A |
| Buccal | Mucosal adhesion | Sustained mucosal | N/A |

**Critical counseling example:**
> *Metformin XR 1000mg — "Do not crush or chew. Swallow whole with evening meal. If you see tablet shell in stool, this is normal (osmotic pump)."*

### 2.3.2 Liquid dosage forms

**Suspension vs solution:**
- **Solution:** Drug dissolved — uniform concentration, faster absorption
- **Suspension:** Drug particles dispersed — **must shake well** before each dose

**Pediatric dosing:** Always use oral syringe (not household teaspoon — 2.5–7.3 mL variation).

**Oral syringe accuracy:** WHO recommends **5 mL syringes for doses ≤5 mL** (±0.1 mL accuracy vs ±2 mL for teaspoons).

### 2.3.3 Parenteral preparations

| Type | Particles | Use | Stability after opening |
|---|---|---|---|
| Solution for injection | Dissolved | IV, IM, SC | Hours to days (varies) |
| Powder for reconstitution | Lyophilized | Reconstitute before use | 24h refrigerated typically |
| Emulsion (propofol) | Oil-in-water | IV only | Strict aseptic technique |
| Suspension for injection | Particles | Depot IM (penicillin G benzathine) | Shake before use |

---

## Section 2.4 — Bioequivalence and generics

### 2.4.1 Regulatory science

**FDA/EMA bioequivalence criteria:**
- 90% confidence interval for AUC and Cmax must fall within **80–125%** of reference product
- Studies in healthy volunteers, crossover design, fasting conditions
- Egypt EDA follows similar principles for generic registration

**When generics are NOT interchangeable:**
- Narrow therapeutic index drugs (some countries require branded warfarin)
- Modified-release formulations (different release mechanisms)
- Drugs with documented clinical failure on switch (patient-specific)

### 2.4.2 Case study — generic substitution counseling

> *Patient on branded atorvastatin (Lipitor) 20mg, doctor writes generic "atorvastatin 20mg." Patient worried about quality.*

**Counseling script (evidence-based):**
1. Same active ingredient: atorvastatin calcium 20mg
2. Generic approved by EDA after bioequivalence study showing equivalent blood levels
3. WHO promotes generic use to improve access and reduce costs
4. If any difference noticed in effect or side effects, report to pharmacist immediately
5. Do not switch between different generic manufacturers frequently without monitoring

---

## Module 2 — Calculation exam

**1.** A drug has t½ = 8 hours. How long to reach steady state with continuous infusion?
**2.** Calculate oral dose of morphine equivalent to 10mg IV (F oral = 0.25).
**3.** Patient needs theophylline maintenance: CL = 2 L/h, target = 10 mg/L, τ = 12h, F = 0.8. Calculate dose.
**4.** If Vd = 50L and target concentration = 4 mg/L, F = 1.0, calculate loading dose.
**5.** CYP3A4 inhibitor started in patient on simvastatin 40mg. Explain mechanism and recommend action.

### Answers (trainer)
1. 32–40 hours (4–5 × t½)
2. 10 / 0.25 = 40 mg oral
3. (2 × 10 × 12) / 0.8 = 300 mg per 12h
4. (50 × 4) / 1.0 = 200 mg
5. Inhibitor increases simvastatin levels → rhabdomyolysis risk → reduce dose or switch to pravastatin/rosuvastatin (less CYP3A4 dependent)

---

## References

1. Goodman & Gilman's *The Pharmacological Basis of Therapeutics* (14th ed.). McGraw-Hill.
2. Rowland M, Tozer TN. *Clinical Pharmacokinetics and Pharmacodynamics* (4th ed.). Lippincott.
3. FDA. (2020). *Bioequivalence Studies with Pharmacokinetic Endpoints for Drugs Submitted Under ANDA.*
4. International Society for Pharmacoeconomics and Outcomes Research (ISPE). *Good Practices for Real-World Data Studies.*
5. Desta Z, et al. (2002). Clinical significance of CYP2D6 genetic polymorphism. *Drug Metab Rev*, 34(3), 385–407.

*Module 2 — Version 1.0 — June 2026*
