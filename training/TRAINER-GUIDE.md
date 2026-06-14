# Trainer Guide / دليل المدرب

> For anyone delivering Fratelanza Hub pharmacy training (online or on-site).
> لأي شخص يقدّم تدريب فراتيلانزا هَب لفرق الصيدليات (أونلاين أو حضوري).

---

## Before the session / قبل الجلسة

### 1. Confirm customer setup (15 min)

- [ ] Customer subdomain is live (e.g. `pharmacy-name.fratelanza.com`)
- [ ] Admin password has been changed from default
- [ ] **Business** package features enabled: `products`, `suppliers`, `purchase_orders`, `invoicing`, `crm`, `finance`, `reports`
- [ ] If pharmacy is clinic-linked: confirm which medical flags are on (`medical_medicine_master`, `medical_prescriptions`, `medical_materials`)
- [ ] Multi-branch enabled? Note branch names for demo
- [ ] At least one non-admin user created per role you'll train

### 2. Prepare demo data (20 min)

Create realistic sample data so trainees see familiar items:

| Data | Examples |
|---|---|
| **Products** (10–15 items) | Panadol 500mg, Augmentin 1g, Vitamin C, Betadine, masks, thermometers |
| **Categories** | أدوية / مستلزمات طبية / عناية شخصية |
| **Suppliers** (2) | شركة الأدوية المتحدة، المصرية للأدوية |
| **Clients** (3) | Walk-in customer, regular patient, corporate account |
| **Purchase order** (1 draft + 1 received) | Show the full lifecycle |
| **Invoice** (1 paid + 1 draft) | Show status workflow |

> Tip: Use Arabic names for products (`nameAr`) — most pharmacy staff work in Arabic.

### 3. Tech check (10 min)

- [ ] Stable internet on trainer side
- [ ] Screen sharing works (Zoom / Google Meet / Teams)
- [ ] Customer can log in on at least one device
- [ ] Browser: Chrome or Edge (latest)
- [ ] Have admin panel access in case you need to toggle a feature mid-session

### 4. Print / share materials

- [ ] Send `QUICK-REFERENCE.md` as PDF before the session
- [ ] Have `PHARMACY-TRAINING-PROGRAM.md` open for timing
- [ ] Open the relevant module files for each section

---

## During the session / أثناء الجلسة

### Teaching style

1. **Show → Do → Review** — demonstrate once, let each trainee do it, then review together
2. **Use their real subdomain** — not the generic demo (builds confidence)
3. **Speak Arabic** for operational steps; use English only for UI labels when needed
4. **Pause every 20 minutes** for questions
5. **Write down** questions you can't answer — escalate to tech support after

### Screen-sharing tips

- Zoom the browser to 125% so phone viewers can read text
- Switch language to Arabic at the start — show the EN/AR toggle once, then stay in Arabic
- Keep the sidebar visible so trainees learn navigation
- Use real drug names the pharmacy actually sells

### Common trainee mistakes (correct gently)

| Mistake | Correction |
|---|---|
| Editing stock directly in product form | "Use **Adjust Stock** — every change needs a reason for the audit trail" |
| Creating invoice without selecting client | "Always pick a client — even walk-in customers should be in CRM first" |
| Confusing Medicine Master with Products | "Medicine Master = روشتة catalog. Products = what you sell and count on the shelf" |
| Forgetting to click **Receive** on PO | "Stock doesn't increase until you mark the PO as received" |
| Recording full payment when customer paid partial | "Use Record Payment — you can pay in installments" |

---

## After the session / بعد الجلسة

### Follow-up schedule

| When | Action |
|---|---|
| **Same day** | Send PDF of QUICK-REFERENCE + module summaries via WhatsApp |
| **Day 3** | 15-min check-in call: "Did anyone get stuck?" |
| **Day 7** | Review first week: stock counts match? invoices created? |
| **Day 14** | Optional refresher (30 min) on the module with most questions |

### Escalation

If a trainee reports a bug or missing feature during training:

1. Note the exact steps to reproduce
2. Check admin panel → customer features (is the module enabled?)
3. If it's a real bug, log it for the dev team
4. If it's a missing feature (barcode, expiry), refer to "What the system does NOT do" in README.md — don't promise a workaround

---

## On-site vs online differences / الفرق بين الحضوري والأونلاين

| | Online (4h) | On-site (1 day) |
|---|---|---|
| Group size | Max 8 per session | Max 12 with 2 devices |
| Hands-on | Each person shares screen briefly | Rotate on 2-3 pharmacy PCs |
| Best for | Remote branches, refresher | New go-live, full team |
| Extra time | — | Lunch break + 1h practice block |
| Materials | Send PDFs before | Print QUICK-REFERENCE, laminate 3 copies |

---

## Session opening script (Arabic) / افتتاحية الجلسة

```
أهلاً بيكم في تدريب فراتيلانزا هَب لصيدلية [اسم الصيدلية] 👋

النهارده هنتعلم:
1. إزاي تدخلوا النظام وتتحركوا فيه
2. إزاي تديروا مخزون الأدوية
3. إزاي تعملوا فواتير البيع
4. إزاي تستلموا بضاعة من الموردين

مهم أقولكم من الأول: النظام ده مش برنامج صيدلية كامل —
مفيش باركود ولا تاريخ صلاحية ولا صرف روشتة أوتوماتيك.
بس هيغطيلكم: المخزون، الفواتير، الموردين، والعملاء بشكل ممتاز.

أي سؤال في أي وقت — ارفعوا إيدكم أو اكتبوا في الشات.
يلا نبدأ! 🚀
```
