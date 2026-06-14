# Fratelanza Hub — Pharmacy Training Kit / حقيبة تدريب الصيدليات

This folder contains ready-to-deliver training materials for pharmacy teams using **Fratelanza Hub**.

هذا المجلد يحتوي على مواد تدريبية جاهزة لفرق الصيدليات التي تستخدم **فراتيلانزا هَب**.

---

## Who is this for? / لمن هذا؟

| Audience | Use these files |
|---|---|
| **Trainer / مدرب** | `TRAINER-GUIDE.md` + `PHARMACY-TRAINING-PROGRAM.md` |
| **Pharmacy owner / manager** | `modules/07-manager-admin.md` |
| **Cashier / صندوق** | `modules/03-sales-invoicing.md` + `QUICK-REFERENCE.md` |
| **Stock clerk / أمين مخزن** | `modules/02-products-inventory.md` + `modules/04-suppliers-purchase-orders.md` |
| **Pharmacist / صيدلي** | `modules/06-medicine-master-prescriptions.md` (if medical module enabled) |
| **Everyone / الجميع** | `modules/01-getting-started.md` |

---

## Files / الملفات

| File | Purpose | المدة المقترحة |
|---|---|---|
| **TRAINER-GUIDE.md** | How to run a session, prep checklist, demo tips | — |
| **PHARMACY-TRAINING-PROGRAM.md** | Full 4-hour curriculum with agenda | 4 ساعات |
| **QUICK-REFERENCE.md** | One-page cheat sheet (print & laminate) | — |
| **modules/01-getting-started.md** | Login, navigation, language, notifications | 30 دقيقة |
| **modules/02-products-inventory.md** | Drug catalog, stock levels, adjustments, history | 45 دقيقة |
| **modules/03-sales-invoicing.md** | Counter sales, payments, print, WhatsApp | 45 دقيقة |
| **modules/04-suppliers-purchase-orders.md** | Restocking workflow from supplier to shelf | 30 دقيقة |
| **modules/05-crm-customers.md** | Customer records and WhatsApp contact | 20 دقيقة |
| **modules/06-medicine-master-prescriptions.md** | Formulary upload, Rx lookup, print (optional) | 30 دقيقة |
| **modules/07-manager-admin.md** | Users, roles, branches, branding, reports | 30 دقيقة |

---

## Recommended training flow / تسلسل التدريب المقترح

```
Day 0 — Before training
  → Trainer reads TRAINER-GUIDE.md
  → Confirm customer's enabled features (Business + optional medical)
  → Prepare demo data (sample drugs, 2 suppliers, 3 customers)

Session 1 (2 hours) — All staff
  → 01 Getting Started (everyone)
  → 02 Products & Inventory (stock + cashier)
  → 03 Sales & Invoicing (cashier focus)
  → 05 CRM (quick overview)

Session 2 (2 hours) — Role-specific
  → Stock clerk: 04 Purchase Orders (deep dive)
  → Pharmacist: 06 Medicine Master (if enabled)
  → Manager: 07 Admin & Reports
  → Practice exercises + Q&A
```

---

## Recommended tenant setup for pharmacies / الإعداد المقترح للصيدليات

| Package | Why |
|---|---|
| **Business** (EGP 999/mo) | Products, suppliers, POs, invoicing, finance, branches |
| **+ medical flags** (optional) | If linked to a clinic: medicine master, prescriptions, medical materials |

**Suggested roles:**

| Role | Permissions |
|---|---|
| Cashier / صندوق | `dashboard`, `products`, `crm`, `invoicing`, `notifications` |
| Stock clerk / مخزن | `dashboard`, `products`, `suppliers`, `purchase_orders`, `notifications` |
| Pharmacist / صيدلي | `dashboard`, `medical`, `notifications` |
| Accountant / محاسب | `dashboard`, `finance`, `invoicing`, `reports`, `notifications` |
| Manager / مدير | `admin` role (full access) |

---

## What Fratelanza Hub does NOT do (say this upfront) / ما لا يفعله النظام

Be honest with pharmacy staff during training:

- ❌ No barcode scanner / POS cash-register mode
- ❌ No expiry date or batch/lot tracking
- ❌ No automatic Rx-to-dispense stock deduction
- ❌ No Egyptian Drug Authority (EDA) regulatory compliance module
- ❌ Medicine Master (formulary) and Products (sellable stock) are **separate catalogs**

- ❌ لا يوجد ماسح باركود أو وضع كاشير POS
- ❌ لا يوجد تتبع لتواريخ الصلاحية أو أرقام التشغيلة
- ❌ لا يوجد خصم تلقائي من المخزون عند صرف الروشتة
- ❌ لا يوجد وحدة امتثال لهيئة الدواء المصرية
- ❌ سجل الأدوية (للروشتات) ومخزون المنتجات (للبيع) **كتالوجان منفصلان**

---

## How to convert to PDF / كيف تحوّل لـ PDF

Same as the sales kit — see `sales/README.md` for PDF conversion options (markdowntopdf.com, VS Code extension, or phone Print → Save as PDF).

Print `QUICK-REFERENCE.md` as a laminated desk card for each workstation.

---

## Demo account / حساب تجريبي

Use `test.fratelanza.com` (admin / admin123) or the customer's own subdomain for live training.
