# Module 06 — Medicine Master & Prescriptions / سجل الأدوية والروشتات

> **Duration:** 30 minutes | **Audience:** Pharmacist, manager
> **Routes:** `/medical/medicine-master`, `/medical/prescriptions`, `/medical/materials`
> **Prerequisite:** Medical module must be enabled on your account

---

## Important distinction / تمييز مهم

Fratelanza Hub has **two separate drug catalogs**:

| Catalog | Route | Purpose | Linked to stock? |
|---|---|---|---|
| **Products** | `/products` | Sellable inventory (OTC, supplements) | ✅ Yes — full stock tracking |
| **Medicine Master** | `/medical/medicine-master` | Prescription formulary (drug names for Rx) | ❌ No — reference only |
| **Medical Materials** | `/medical/materials` | Clinic supplies & medications stock | ⚠️ Simple +/- adjust only |

> When training pharmacy staff: **Products = what you sell. Medicine Master = what doctors prescribe.** They are not automatically linked.

---

## Part A — Medicine Master / سجل الأدوية

### 1. What is Medicine Master?

A searchable database of drug names used when writing or viewing prescriptions. Typically uploaded from an Excel file provided by your drug distributor or the Egyptian drug formulary.

### 2. Viewing the formulary / عرض السجل

Open **Medicine Master / سجل الأدوية** (in Medical workspace).

| Column | Meaning |
|---|---|
| Material | Short drug code (e.g. AMOX500) |
| Material Description | Full drug name (e.g. Amoxicillin 500mg caps) |
| BUn | Base unit (e.g. TAB, CAP, ML) |

Use the **search box** to find drugs by name or code.

### 3. Uploading drugs from Excel / رفع ملف Excel

1. Prepare an Excel/CSV file with columns: **Material**, **Material description**, **BUn**
2. Click **Upload file / رفع ملف**
3. Select your .xlsx or .csv file
4. System reports: X new, Y updated, Z skipped
5. Formulary is now searchable

**Example Excel format:**

| Material | Material description | BUn |
|---|---|---|
| PAN500 | Panadol 500mg tablets | TAB |
| AMOX500 | Amoxicillin 500mg capsules | CAP |
| AUG1G | Augmentin 1g tablets | TAB |
| MET500 | Metformin 500mg tablets | TAB |

### 4. Adding a drug manually / إضافة دواء يدوياً

1. Click **Add medicine / إضافة دواء**
2. Fill in Material (code), Material Description (name), BUn (unit)
3. Click **Save**

### 5. Deleting a drug / حذف دواء

- Click delete on any row
- Only delete duplicates or errors — don't delete drugs that appear on existing prescriptions

---

## Part B — Prescriptions / الروشتات

### 6. Viewing prescriptions / عرض الروشتات

Open **Prescriptions / الروشتات** (in Medical workspace).

Each prescription is linked to a **patient visit** — you cannot create a standalone Rx without a visit context.

| Column | Arabic | Meaning |
|---|---|---|
| Patient | المريض | Who the Rx is for |
| Visit Date | تاريخ الزيارة | When the visit occurred |
| Doctor | الطبيب | Prescribing doctor |
| Medicines | الأدوية | List of prescribed drugs |
| Status | الحالة | Active, completed |

### 7. Viewing Rx details / تفاصيل الروشتة

1. Click a prescription to open details
2. See each medicine line: name, dosage, frequency, duration, notes
3. Click **Print / طباعة** for a formatted prescription with:
   - Clinic/pharmacy header (from Settings → Prescription Header)
   - Patient name and date
   - Medicine list with instructions
   - Doctor signature line

### 8. Prescription OCR (if enabled) / مسح الروشتة بالكاميرا

If your account has the OCR feature:

1. Click **Scan Prescription / مسح روشتة**
2. Take a photo or upload image of a paper prescription
3. System extracts medicine names using AI
4. Review extracted items — correct any errors
5. Import into the prescription

> OCR is a helper tool — always review extracted data before saving.

---

## Part C — Medical Materials / المواد الطبية

### 9. Simple medication stock / مخزون أدوية مبسط

Open **Medical Materials / المواد الطبية** (in Medical workspace).

This is a simpler inventory for clinic supplies. Items can be categorized as `medication`.

| Action | How |
|---|---|
| Add item | Name, category (medication), quantity, reorder level |
| Quick adjust | +/- buttons on each row |
| Low stock alert | Badge when below reorder level |

> This does NOT have full movement history like Products. For pharmacy retail stock, use **Products** (Module 02) instead.

---

## Pharmacy use cases / حالات الاستخدام في الصيدلية

### Scenario 1: Pharmacy attached to a clinic
- Doctor writes Rx in the clinic (Visits → Prescriptions)
- Pharmacist views Rx in Prescriptions module
- Pharmacist checks Products for availability
- Pharmacist creates sales invoice (Module 03)
- Pharmacist adjusts stock out (Module 02)

### Scenario 2: Standalone pharmacy (no clinic)
- Medicine Master may still be useful as a drug name reference
- Prescriptions module is less relevant (no visits)
- Focus on Products + Invoicing workflow

### Scenario 3: Rx fulfillment check
1. Patient brings paper prescription
2. Pharmacist searches Medicine Master to identify drugs
3. Checks Products for stock and price
4. Creates invoice and dispenses

---

## Practice exercises / تمارين عملية

**Exercise 1:** Upload a sample Excel with 5 drugs (or add them manually)

**Exercise 2:** Search Medicine Master for "Amox" — find Amoxicillin

**Exercise 3:** (If clinic-linked) View a sample prescription and print it

**Exercise 4:** Explain to a colleague the difference between Medicine Master and Products

---

## Common mistakes / أخطاء شائعة

| Mistake | Fix |
|---|---|
| Expecting Rx to auto-deduct Products stock | Manual process — check Products, adjust stock separately |
| Uploading Excel with wrong column names | Must be: Material, Material description, BUn |
| Using Medical Materials for retail stock | Use Products for sellable inventory with full audit trail |
| Creating Rx without a visit | Prescriptions require a visit — contact clinic staff |
