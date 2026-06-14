# Module 07 — Manager & Admin / الإدارة والإعدادات

> **Duration:** 30 minutes | **Audience:** Pharmacy owner, manager
> **Route:** `/settings`, `/branches`, `/reports`, `/finance`

---

## What this module covers / ماذا يغطي

This module is for the pharmacy owner or manager — setting up users, configuring branding, managing branches, and reviewing business reports.

هذه الوحدة لصاحب الصيدلية أو المدير — إعداد المستخدمين، تخصيص العلامة التجارية، إدارة الفروع، ومراجعة التقارير.

---

## 1. User management / إدارة المستخدمين

Open **Settings / الإعدادات** → **Users** tab.

### Creating a new user / إنشاء مستخدم

1. Click **Add User / إضافة مستخدم**
2. Fill in: username, full name, email, password
3. Select a **role preset / دور**:

| Role | Arabic | Typical pharmacy use |
|---|---|---|
| admin | مدير النظام | Owner — full access |
| manager | مدير | Branch manager |
| accountant | محاسب | Finance & reports |
| assistant | مساعد | Cashier / counter staff |
| receptionist | استقبال | Front desk |

4. **Customize permissions** if needed (checkboxes per module)
5. Assign to a **branch** (if multi-branch)
6. Click **Save**

### Recommended permission matrix for pharmacies

| Permission | Owner | Manager | Cashier | Stock | Pharmacist | Accountant |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| products | ✅ | ✅ | ✅ | ✅ | — | — |
| crm | ✅ | ✅ | ✅ | — | — | — |
| invoicing | ✅ | ✅ | ✅ | — | — | ✅ |
| suppliers | ✅ | ✅ | — | ✅ | — | — |
| purchase_orders | ✅ | ✅ | — | ✅ | — | — |
| finance | ✅ | ✅ | — | — | — | ✅ |
| reports | ✅ | ✅ | — | — | — | ✅ |
| medical | ✅ | ✅ | — | — | ✅ | — |
| admin (settings) | ✅ | — | — | — | — | — |

### Resetting a password / إعادة تعيين كلمة المرور

- Manager cannot reset passwords directly
- Contact Fratelanza support or use admin panel (admin.fratelanza.com) to reset

---

## 2. Branding / العلامة التجارية

Settings → **Branding** tab.

| Field | Arabic | Appears on |
|---|---|---|
| Business Name | اسم النشاط | Invoices, dashboard, login page |
| Logo | الشعار | Invoice header, login page |
| Primary Color | اللون الأساسي | Buttons, accents |

Upload your pharmacy logo (PNG/JPG, max 2MB). It appears on printed invoices and the login screen.

---

## 3. Prescription header / ترويسة الروشتة

Settings → **Prescription Header** tab (if medical module enabled).

Configure what appears on printed prescriptions:
- Clinic/pharmacy name
- Address
- Phone
- License number
- Doctor name (default)

---

## 4. Branch management / إدارة الفروع

Open **Branches / الفروع** (if multi-branch feature enabled).

### Adding a branch / إضافة فرع

1. Click **Add Branch / إضافة فرع**
2. Fill in: name (Arabic + English), address, phone
3. Click **Save**

### How branches work

- Each product, invoice, and PO can be assigned to a branch
- Staff see only their branch data (unless admin)
- Admin can switch branches via the top-bar dropdown
- Reports can be filtered per branch

---

## 5. Finance overview / نظرة على المالية

Open **Finance / المالية** from the sidebar.

| Section | Arabic | Content |
|---|---|---|
| Income | الدخل | Auto-posted from paid invoices |
| Expenses | المصروفات | Manual entries (rent, utilities, salaries) |
| Balance | الرصيد | Income minus expenses |

**Key point:** Invoice payments automatically create income entries. You don't need to double-enter sales revenue.

### Adding an expense / إضافة مصروف

1. Click **Add Expense / إضافة مصروف**
2. Fill in: description, amount (EGP), category, date
3. Click **Save**

**Common pharmacy expenses:** إيجار، فواتير، رواتب، مشتريات بضاعة

---

## 6. Reports / التقارير

Open **Reports / التقارير** from the sidebar.

Available reports:
- **Revenue over time** — daily/weekly/monthly charts
- **Top products** — best-selling items
- **Invoice summary** — paid vs outstanding
- **Client activity** — most active customers

Use the **date range picker** to filter reports.

For medical module: **Medical Reports** (`/medical/reports`) shows clinic-specific KPIs.

---

## 7. Dashboard / لوحة التحكم

The home page shows KPI cards:
- Total revenue (this month)
- Active clients
- Pending tasks
- Low-stock products count

Managers should check the dashboard daily for a quick health check.

---

## Practice exercises / تمارين عملية

**Exercise 1:** Create a user "سارة" with role "assistant" (cashier) — assign products + invoicing permissions only

**Exercise 2:** Upload your pharmacy logo in Branding settings

**Exercise 3:** Add an expense "إيجار المحل — مارس" for 5,000 EGP

**Exercise 4:** Open Reports — check this month's revenue chart

---

## Manager daily checklist / قائمة المدير اليومية

- [ ] Check dashboard KPIs
- [ ] Review low-stock products count
- [ ] Check unpaid/overdue invoices
- [ ] Review today's revenue in Finance
- [ ] Respond to staff questions about the system

## Manager weekly checklist / قائمة المدير الأسبوعية

- [ ] Review weekly revenue report
- [ ] Check stock levels vs physical count
- [ ] Review user activity (any login issues?)
- [ ] Follow up on pending purchase orders
- [ ] Back up important data (automatic daily backup runs on cloud)

---

## Common mistakes / أخطاء شائعة

| Mistake | Fix |
|---|---|
| Giving everyone admin access | Use role presets — least privilege principle |
| Forgetting to set branch on new users | Staff won't see data if branch doesn't match |
| Manual income entry for sales | Invoice payments auto-sync — don't double-enter |
| Not uploading logo | Invoices print without branding — looks unprofessional |
