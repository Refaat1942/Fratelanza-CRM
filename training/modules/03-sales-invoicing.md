# Module 03 — Sales & Invoicing / المبيعات والفواتير

> **Duration:** 45 minutes | **Audience:** Cashier, manager
> **Route:** `/invoices`

---

## What this module covers / ماذا يغطي

The **Invoices** module handles counter sales — creating bills for customers, recording payments, printing receipts, and sending via WhatsApp. Payments automatically sync to the Finance module.

وحدة **الفواتير** تتعامل مع مبيعات الكاونتر — إنشاء فواتير للعملاء، تسجيل المدفوعات، طباعة الإيصالات، والإرسال عبر واتساب. المدفوعات تتزامن تلقائياً مع المالية.

---

## 1. Invoice list / قائمة الفواتير

Open **Invoices / الفواتير** from the sidebar.

**Summary cards** at the top show:
- Total invoices by status (draft, sent, paid, overdue)
- Revenue totals

**Status meanings:**

| Status | Arabic | Meaning |
|---|---|---|
| Draft | مسودة | Created but not finalized |
| Sent | مُرسلة | Sent to customer, awaiting payment |
| Paid | مدفوعة | Fully paid |
| Overdue | متأخرة | Past due date, unpaid |
| Cancelled | ملغاة | Voided |

Use the **status filter** dropdown to view specific statuses.

---

## 2. Creating a sales invoice / إنشاء فاتورة بيع

1. Click **Create Invoice / إنشاء فاتورة**
2. Fill in the header:

| Field | Arabic | Notes |
|---|---|---|
| Client | العميل | **Required** — select from dropdown or add new in CRM first |
| Issue Date | تاريخ الإصدار | Defaults to today |
| Due Date | تاريخ الاستحقاق | Optional for counter sales |
| Tax Rate % | نسبة الضريبة | Usually 0% or 14% VAT |
| Notes | ملاحظات | Optional |

3. Add **line items / بنود الفاتورة**:

| Field | Arabic | Example |
|---|---|---|
| Description | الوصف | Panadol Extra 24 tabs |
| Quantity | الكمية | 2 |
| Unit Price | سعر الوحدة | 45.00 |

- Click **+ Add Item / إضافة بند** for more lines
- Subtotal, tax, and total calculate automatically

4. Click **Create / إنشاء**

> **Tip:** For faster invoicing, look up the product price in Products first, then enter it as a line item. The system does not auto-pull from the product catalog (yet).

---

## 3. Recording payment / تسجيل الدفع

After creating the invoice:

1. Open the invoice (click to view details)
2. Click **Record Payment / تسجيل دفعة**
3. Enter the **amount** (can be partial)
4. Click **Confirm**

- Full payment → status changes to **Paid / مدفوعة**
- Partial payment → shows paid amount vs remaining
- Payment auto-posts as **income** in Finance

---

## 4. Changing invoice status / تغيير حالة الفاتورة

From the invoice detail view:
- **Mark as Sent** — when you've given the invoice to the customer
- **Mark as Paid** — shortcut if full amount received
- **Cancel** — void the invoice (won't delete, just marks cancelled)

---

## 5. Printing an invoice / طباعة الفاتورة

1. Open the invoice
2. Click **Print / طباعة** (printer icon)
3. A print-friendly page opens with:
   - Your pharmacy logo and name (from Settings → Branding)
   - Invoice number, date, client info
   - Line items with quantities and prices
   - Total amount
4. Print or save as PDF

---

## 6. Sending via WhatsApp / الإرسال عبر واتساب

1. Open the invoice
2. Click **WhatsApp** button (green icon)
3. Opens WhatsApp with a pre-filled message containing invoice summary
4. Customer must have a phone number saved in CRM

> The customer record must have a valid phone number (e.g. 010xxxxxxxx) for WhatsApp to work.

---

## 7. Viewing invoice details / عرض تفاصيل الفاتورة

Click any invoice to see:
- Full line items with totals
- Payment history
- Client information
- Status timeline
- Action buttons (print, WhatsApp, payment, status change)

---

## Typical counter sale workflow / سير عمل البيع في الكاونتر

```
Customer arrives
    ↓
Search products → confirm availability & price
    ↓
Find/create customer in CRM (if not walk-in regular)
    ↓
Create invoice → add line items → save
    ↓
Customer pays (cash / card / Instapay)
    ↓
Record payment → status = Paid
    ↓
Print receipt (optional)
    ↓
Adjust stock OUT for each sold item (Module 02)
```

> **Best practice:** Adjust stock at end of shift in batch, or adjust immediately per sale with reason "بيع — فاتورة #XXX".

---

## Practice exercises / تمارين عملية

**Exercise 1:** Create invoice for customer "أحمد محمد":
- 1× Panadol Extra — 45 EGP
- 2× Vitamin C 1000mg — 30 EGP each
- Tax: 0%
- Record full payment
- Print the invoice

**Exercise 2:** Create a draft invoice (don't pay). Change status to Sent. Then record partial payment of 50 EGP.

**Exercise 3:** Send a paid invoice via WhatsApp (if customer has phone number).

---

## Common mistakes / أخطاء شائعة

| Mistake | Fix |
|---|---|
| Invoice without client | Always select a client — create in CRM first if new |
| Wrong price on line item | Double-check in Products before entering |
| Forgot to record payment | Invoice stays "Sent" — revenue not counted in Finance |
| Deleting instead of cancelling | Use Cancel status to keep audit trail |
