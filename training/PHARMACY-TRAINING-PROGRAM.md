# Pharmacy Training Program — 4 Hours / برنامج تدريب الصيدليات — 4 ساعات

> Standard curriculum for the paid "Custom Arabic training (4 hours, online)" package.
> المنهج القياسي لباقة "تدريب مخصص (4 ساعات أونلاين)".

---

## Overview / نظرة عامة

| | |
|---|---|
| **Duration** | 4 hours (2 sessions × 2 hours, or 1 block with breaks) |
| **Audience** | Pharmacy owner, cashier, stock clerk, pharmacist (as applicable) |
| **Prerequisites** | Customer account provisioned, demo data loaded, trainees have login credentials |
| **Outcome** | Each role can perform daily tasks independently |

---

## Session 1 — Foundations & Daily Operations (2 hours)

### Block 1: Getting Started (30 min)
**Module:** `modules/01-getting-started.md`

| Time | Topic | Activity |
|---|---|---|
| 0:00 | Welcome, set expectations, limitations | Trainer talks |
| 0:10 | Login, change password, language toggle | Each trainee logs in |
| 0:20 | Sidebar navigation, workspace switch (General/Medical) | Trainer walks through |
| 0:25 | Notifications bell, logout | Quick demo |

**Exercise:** Each person logs in, switches to Arabic, opens Dashboard.

---

### Block 2: Products & Inventory (45 min)
**Module:** `modules/02-products-inventory.md`

| Time | Topic | Activity |
|---|---|---|
| 0:30 | Product list, search, status badges (available / low / out) | Trainer demo |
| 0:40 | Add a new drug product (name, price, SKU, category) | Trainees add 1 product each |
| 0:50 | Adjust Stock (in / out) with reason | Trainees adjust stock on a sample item |
| 1:00 | Stock movement history (audit trail) | Trainer shows history on adjusted item |
| 1:05 | Reorder point and low-stock alerts | Discuss pharmacy restocking habits |
| 1:10 | **Break (5 min)** | |

**Exercise:** Add "Panadol Extra 24 tabs" with price 45 EGP, stock 50, reorder point 10. Then adjust out 5 units with reason "بيع".

---

### Block 3: Sales & Invoicing (45 min)
**Module:** `modules/03-sales-invoicing.md`

| Time | Topic | Activity |
|---|---|---|
| 1:15 | Invoice list, status filters (draft / sent / paid) | Trainer demo |
| 1:25 | Create invoice: select client, add line items, tax | Trainees create 1 invoice |
| 1:35 | Record payment (full or partial) | Trainees mark invoice as paid |
| 1:42 | Print invoice, send via WhatsApp | Trainer demo |
| 1:48 | Invoice auto-syncs to Finance | Quick look at Finance tab |
| 1:55 | **Break (5 min)** | |

**Exercise:** Create invoice for a walk-in customer — 2 items, total ~100 EGP. Record payment. Print.

---

## Session 2 — Procurement, CRM & Role-Specific (2 hours)

### Block 4: CRM — Customers (20 min)
**Module:** `modules/05-crm-customers.md`

| Time | Topic | Activity |
|---|---|---|
| 2:00 | Client list, search, add new customer | Trainees add 1 customer |
| 2:10 | WhatsApp deep link from client card | Trainer demo |
| 2:15 | Link customer to invoice | Quick recap from Block 3 |

**Exercise:** Add customer "أحمد محمد" with phone 010xxxxxxxx. Create invoice for him.

---

### Block 5: Suppliers & Purchase Orders (30 min)
**Module:** `modules/04-suppliers-purchase-orders.md`

| Time | Topic | Activity |
|---|---|---|
| 2:20 | Supplier directory | Trainer demo |
| 2:28 | Create PO: select supplier, add product lines | Stock clerk creates PO |
| 2:38 | PO status: draft → ordered → received | Trainer shows lifecycle |
| 2:45 | Receive PO → stock auto-increments | Verify in Products module |

**Exercise:** Create PO from "شركة الأدوية المتحدة" for 3 products. Mark as received. Confirm stock increased.

---

### Block 6: Role-Specific Deep Dive (30 min)

Pick based on customer's enabled features:

#### Option A — Pharmacist (if medical module enabled)
**Module:** `modules/06-medicine-master-prescriptions.md`

| Time | Topic |
|---|---|
| 2:50 | Medicine Master: upload Excel, search formulary |
| 3:00 | Add medicine manually (Material, Description, BUn) |
| 3:10 | View prescriptions, print formatted Rx |
| 3:15 | OCR scan (if enabled): photo → import |

#### Option B — No medical module
**Module:** `modules/07-manager-admin.md` (partial)

| Time | Topic |
|---|---|
| 2:50 | Reports dashboard: revenue, top products |
| 3:00 | Finance overview: income from invoices |
| 3:10 | Branch filtering (if multi-branch) |

---

### Block 7: Manager & Admin (30 min)
**Module:** `modules/07-manager-admin.md`

| Time | Topic | Activity |
|---|---|---|
| 3:20 | Settings → Users: create user, assign role | Manager creates 1 user |
| 3:30 | Role presets: cashier, stock clerk, pharmacist | Discuss permission matrix |
| 3:38 | Branding: logo, pharmacy name on invoices | Quick demo |
| 3:42 | Prescription header (if medical) | Show print layout |
| 3:45 | Branch setup (if multi-branch) | Demo branch picker |

---

### Block 8: Practice & Q&A (30 min)

| Time | Activity |
|---|---|
| 3:50 | **Scenario drill:** "A customer buys 3 items, pays cash, you need to check if one is low stock" |
| 4:05 | **Scenario drill:** "Supplier delivers 50 boxes — how do you receive them?" |
| 4:15 | Open Q&A |
| 4:25 | Recap key points, share QUICK-REFERENCE PDF |
| 4:30 | End |

---

## Assessment checklist / قائمة تقييم

Trainer marks each trainee at end of session:

| Skill | Cashier | Stock | Pharmacist | Manager |
|---|:---:|:---:|:---:|:---:|
| Login & navigate | ☐ | ☐ | ☐ | ☐ |
| Search product & check stock | ☐ | ☐ | ☐ | ☐ |
| Adjust stock with reason | — | ☐ | — | ☐ |
| Create sales invoice | ☐ | — | — | ☐ |
| Record payment | ☐ | — | — | ☐ |
| Add customer in CRM | ☐ | — | — | ☐ |
| Create & receive PO | — | ☐ | — | ☐ |
| Search medicine master | — | — | ☐ | — |
| Create user with permissions | — | — | — | ☐ |

---

## Customization notes / ملاحظات التخصيص

- **Single-branch pharmacy:** Skip all branch-related content (~10 min saved)
- **No medical module:** Replace Block 6 Option A with extra invoicing practice
- **Multi-branch chain:** Add 15 min on branch filtering and per-branch reports
- **On-site full day:** Add 1-hour supervised practice block after lunch
