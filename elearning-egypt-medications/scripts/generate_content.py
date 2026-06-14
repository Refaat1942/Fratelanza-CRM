#!/usr/bin/env python3
"""Generate comprehensive e-learning lesson files for Egyptian medications courses."""
import json
import os

BASE = "/workspace/elearning-egypt-medications"

def lesson_header(title_en, title_ar, lesson_id, duration="90 minutes (25 min video + 65 min study)", prereq="See course overview"):
    return f"""# {title_en}
# {title_ar}

| | |
|---|---|
| **Duration** | {duration} |
| **Lesson ID** | {lesson_id} |
| **Prerequisites** | {prereq} |

---

## Learning objectives

After completing this lesson, you will be able to:

"""

def objectives(items):
    return "\n".join(f"{i}. {obj}" for i, obj in enumerate(items, 1)) + "\n\n---\n\n"

def takeaways(items):
    lines = "\n".join(f"> - {item}" for item in items)
    return f"""## Key takeaways

> 📌 **Key Takeaways**
{lines}

---

"""

def quiz(questions):
    out = "## Lesson Quiz (10 questions)\n\n"
    for i, (q, opts, correct_idx) in enumerate(questions, 1):
        out += f"**Q{i}.** {q}\n"
        for j, opt in enumerate(opts):
            mark = " ✓" if j == correct_idx else ""
            letter = chr(97 + j)
            out += f"- {letter}) {opt}{mark}\n"
        out += "\n"
    return out

def refs(items, next_link=None):
    out = "## References\n\n"
    for i, r in enumerate(items, 1):
        out += f"{i}. {r}\n"
    if next_link:
        out += f"\n*Next: {next_link}*\n"
    return out

def counseling(ar_text):
    return f"""**Counseling script (Arabic):**

> "{ar_text}"

"""

def scenario(title, text, response):
    return f"""### {title}
> *{text}*

**Response:**
{response}

"""

# ============ LESSON CONTENT DEFINITIONS ============

LESSONS = {}

# --- Course 01 Cardiovascular 03-08 ---
LESSONS["01-cardiovascular/lessons/lesson-03-ccb-beta-blockers.md"] = {
    "header": lesson_header(
        "Lesson 1.3: Calcium Channel Blockers & Beta-Blockers — Egyptian Market",
        "الدرس 1.3: حاصرات قنوات الكالسيوم وحاصرات بيتا — السوق المصري",
        "EG-MED-01-L03", prereq="Lessons 1.1–1.2"
    ),
    "objectives": objectives([
        "Explain **calcium channel blocker (CCB)** and **beta-blocker** mechanisms of action",
        "Identify **Egyptian brands** for amlodipine, nifedipine, bisoprolol, metoprolol, atenolol",
        "Select appropriate CCB or beta-blocker based on **comorbidities** (asthma, diabetes, HF)",
        "Counsel on **ankle edema** (CCB) and **bradycardia/fatigue** (beta-blockers) in Arabic",
        "Recognize **drug interactions** with verapamil/diltiazem and beta-blockers"
    ]),
    "body": """## 1. Calcium channel blockers — mechanism

### 1.1 Pharmacology

CCBs block L-type calcium channels in vascular smooth muscle and myocardium:

```
Ca²⁺ influx blocked → Smooth muscle relaxation → Vasodilation → ↓ BP
Dihydropyridines (amlodipine, nifedipine): Vascular selective → peripheral vasodilation
Non-DHP (verapamil, diltiazem): Cardiac + vascular → ↓ HR, ↓ contractility + vasodilation
```

**Evidence:** ALLHAT trial — amlodipine equivalent to chlorthalidone for CV outcomes. ASCOT-BPLA — amlodipine + perindopril superior to atenolol + thiazide.

### 1.2 Dihydropyridine CCBs — Egyptian market

| Generic | Brand (Egypt) | Manufacturer | Strengths | Dosing | Approx. EGP/month |
|---|---|---|---|---|---|
| **Amlodipine** | Norvasc | Pfizer | 5, 10mg | 5–10mg OD | 50–150 |
| **Amlodipine** | Amlor, Amlodipine | Pharco, Sedico, EIPICO | 5, 10mg | 5–10mg OD | 30–80 |
| **Nifedipine XL** | Adalat Oros | Bayer | 30, 60mg | 30–60mg OD | 80–180 |
| **Nifedipine XL** | Nifecard, Nifedipine | Memphis, local | 30mg | 30–60mg OD | 40–100 |
| **Lercanidipine** | Zanidip | Recordati / generic | 10, 20mg | 10–20mg OD | 100–200 |
| **Felodipine** | Plendil | AstraZeneca / generic | 5, 10mg | 5–10mg OD | 80–150 |

### 1.3 CCB side effects & contraindications

| Effect | Frequency | Management |
|---|---|---|
| Peripheral edema | 10–30% (amlodipine) | Elevate legs; consider ACE-I add-on; switch CCB class |
| Flushing, headache | Common initially | Usually transient; take at bedtime |
| Gingival hyperplasia | Rare (nifedipine) | Dental referral |
| Reflex tachycardia | DHP CCBs | Less with amlodipine |

**Contraindications:** Severe aortic stenosis, cardiogenic shock, unstable angina (immediate-release nifedipine), severe LV dysfunction (non-DHP).

**Interactions:** Simvastatin dose max 20mg with amlodipine (CYP3A4); avoid grapefruit juice with felodipine.

---

## 2. Beta-blockers — mechanism

### 2.1 Pharmacology

Beta-blockers antagonize β1 (cardiac) and/or β2 (bronchial, vascular) adrenergic receptors:

```
β1 blockade → ↓ HR, ↓ contractility, ↓ renin → ↓ BP
β1 selective (bisoprolol, metoprolol): Less bronchospasm risk
Non-selective (propranolol): Also blocks β2 — avoid in asthma
```

**Evidence:** COMET trial — carvedilol superior to metoprolol in heart failure mortality. Beta-blockers post-MI reduce mortality (NNT ~42 over 2 years).

### 2.2 Beta-blockers — Egyptian market

| Generic | Brand (Egypt) | Manufacturer | Strengths | Dosing | Indication notes |
|---|---|---|---|---|---|
| **Bisoprolol** | Concor | Merck / Sedico | 2.5, 5, 10mg | 2.5–10mg OD | HTN, HF (CIBIS trials) |
| **Metoprolol tartrate** | Lopressor | AstraZeneca / Memphis | 50, 100mg | 50–100mg BD | HTN, post-MI |
| **Metoprolol succinate XL** | Betaloc ZOK | AstraZeneca / generic | 50, 100mg | 50–200mg OD | HF, HTN |
| **Atenolol** | Tenormin, Atenolol | AstraZeneca / Pharco | 50, 100mg | 50–100mg OD | HTN — less evidence vs others |
| **Carvedilol** | Dilatrend, Carvedilol | Roche / EIPICO | 6.25, 25mg | 6.25–25mg BD | HF, HTN |
| **Propranolol** | Inderal, Propranolol | AstraZeneca / local | 10, 40mg | 10–40mg BD-TDS | Migraine, tremor, anxiety |
| **Nebivolol** | Nebilet | Menarini / generic | 5mg | 5mg OD | HTN — nitric oxide mediated |

### 2.3 Beta-blocker side effects & contraindications

| Effect | Management |
|---|---|
| Bradycardia (<55 bpm) | Reduce dose; check for drug interactions |
| Fatigue, cold extremities | Common; counsel; may improve with time |
| Bronchospasm | Avoid non-selective; use cardioselective with caution in asthma |
| Masked hypoglycemia | Counsel diabetic patients — monitor glucose |
| Sexual dysfunction | Discuss with physician; consider switch |

**Contraindications:** Severe bradycardia, 2nd/3rd degree AV block (without pacemaker), decompensated HF, severe asthma/COPD (relative for β1-selective).

**Interactions:** Verapamil/diltiazem + beta-blocker → severe bradycardia/heart block. **Never stop beta-blocker abruptly** — rebound tachycardia/angina.

""" + counseling(
        "لو رجلك بتورم بعد دواء النورفاسك أو الأملوديبين، ده عرض شائع من توسيع الأوعية. ارفع رجلك، قلل الملح، ولو الورم زاد قول للدكتور — ممكن يضيف دواء تاني أو يغير الجرعة. متوقفش الدواء فجأة."
    ) + """
---

## 3. When to choose CCB vs beta-blocker

| Situation | Preferred class |
|---|---|
| Uncomplicated HTN (first line) | CCB (amlodipine) — equal first line |
| HTN + angina | Either; beta-blocker if high HR |
| HTN + heart failure (HFrEF) | Beta-blocker (bisoprolol, carvedilol) — NOT verapamil |
| HTN + asthma | CCB preferred; if beta-blocker needed → bisoprolol low dose |
| HTN + diabetes | Both acceptable; avoid atenolol if alternatives exist |
| HTN + peripheral edema | Beta-blocker or switch CCB |
| Rate control (AF) | Beta-blocker or non-DHP CCB |
| Post-MI | Beta-blocker mandatory unless contraindicated |
| Pregnancy HTN | Labetalol, nifedipine — avoid atenolol |

---

## 4. Pharmacy practice scenario

""" + scenario(
    "Scenario 1.3 — Ankle swelling on amlodipine",
    "Patient 58 years on amlodipine 10mg (Norvasc) for 3 months. BP controlled 130/80 but complains of swollen ankles. No heart failure history.",
    """1. Confirm edema is bilateral, pitting — typical CCB effect
2. Check for heart failure signs (refer if dyspnea, weight gain)
3. Counsel: elevate legs, reduce salt, compression stockings
4. Suggest physician review — may add low-dose ACE-I (reduces CCB edema) or switch to lercanidipine
5. Do NOT recommend furosemide without physician — may not address cause"""
) + takeaways([
    "Amlodipine (Norvasc/Amlor) is the most prescribed CCB in Egypt — affordable generics from Pharco, Sedico",
    "CCB edema is dose-dependent; adding ACE-I often helps",
    "Concor (bisoprolol) and Lopressor (metoprolol) are key Egyptian beta-blocker brands",
    "Never combine verapamil + beta-blocker without specialist oversight",
    "Beta-blockers are NOT first-line for uncomplicated HTN unless specific indication",
    "Never stop beta-blockers abruptly — taper over 1–2 weeks"
]) + quiz([
    ("Dihydropyridine CCBs primarily cause vasodilation by blocking:", ["Sodium channels", "L-type calcium channels in vascular smooth muscle", "Beta-1 receptors", "Angiotensin receptors"], 1),
    ("Most common side effect of amlodipine:", ["Dry cough", "Peripheral edema", "Hyperkalemia", "Bronchospasm"], 1),
    ("Egyptian brand Concor contains:", ["Amlodipine", "Bisoprolol", "Metoprolol", "Atenolol"], 1),
    ("Beta-blocker with strongest heart failure evidence (COMET trial):", ["Atenolol", "Propranolol", "Carvedilol", "Nebivolol"], 2),
    ("Combining verapamil with beta-blocker risks:", ["Hyperkalemia", "Severe bradycardia/heart block", "Cough", "Hepatotoxicity"], 1),
    ("Amlodipine generic from Pharco is commonly sold as:", ["Tareg", "Amlor", "Capoten", "Plavix"], 1),
    ("Beta-blocker contraindicated in severe asthma:", ["Bisoprolol (relative)", "Propranolol (non-selective)", "Metoprolol (relative)", "Nebivolol (relative)"], 1),
    ("Maximum simvastatin dose with amlodipine:", ["80mg", "40mg", "20mg", "10mg"], 2),
    ("Post-MI patient should receive:", ["CCB first line", "Beta-blocker unless contraindicated", "No cardiac drugs", "Only aspirin"], 1),
    ("Atenolol for hypertension:", ["Superior to amlodipine per ASCOT", "Less favored vs newer agents per current guidelines", "First line in pregnancy", "Best for heart failure"], 1),
]) + refs([
    "ALLHAT Officers. (2002). *JAMA* — amlodipine vs thiazide outcomes.",
    "ASCOT-BPLA Study Group. (2005). *Lancet*.",
    "Packer M, et al. COMET trial. (2003). *Lancet*.",
    "Williams B, et al. (2023). ESH Hypertension Guidelines. *European Heart Journal*.",
], "*Next: [Lesson 1.4 — Diuretics & Combination Products](./lesson-04-diuretics-combos.md)*")
}

print("Script part 1 loaded - will continue with full generator")
