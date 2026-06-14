# Module 04 — Suppliers & Purchase Orders / الموردين وأوامر الشراء

> **Duration:** 30 minutes | **Audience:** Stock clerk, manager
> **Routes:** `/suppliers`, `/purchase-orders`

---

## What this module covers / ماذا يغطي

When your pharmacy runs low on stock, you order from suppliers. This module covers maintaining your vendor list and creating purchase orders that automatically update inventory when goods are received.

عندما ينخفض مخزون الصيدلية، تطلب من الموردين. هذه الوحدة تغطي إدارة قائمة الموردين وإنشاء أوامر الشراء التي تحدّث المخزون تلقائياً عند استلام البضاعة.

---

## Part A — Suppliers / الموردين

### 1. Supplier list / قائمة الموردين

Open **Suppliers / الموردين** from the sidebar.

| Column | Arabic | Meaning |
|---|---|---|
| Name | الاسم | Company name |
| Contact | جهة الاتصال | Contact person |
| Phone | الهاتف | Phone number |
| Email | البريد | Email address |
| Notes | ملاحظات | Payment terms, delivery schedule |

### 2. Adding a supplier / إضافة مورد

1. Click **Add Supplier / إضافة مورد**
2. Fill in: name (Arabic + English), contact person, phone, email, notes
3. Click **Save**

**Example suppliers for a pharmacy:**
- شركة الأدوية المتحدة — 02-12345678
- المصرية للأدوية — 02-87654321
- فاركو للأدوية — 02-11223344

---

## Part B — Purchase Orders / أوامر الشراء

### 3. PO list overview / نظرة على أوامر الشراء

Open **Purchase Orders / أوامر الشراء** from the sidebar.

**PO statuses:**

| Status | Arabic | Meaning |
|---|---|---|
| Draft | مسودة | Being prepared, not sent to supplier |
| Ordered | مُطلَب | Sent to supplier, awaiting delivery |
| Received | مُستلَم | Goods received, stock updated |
| Cancelled | ملغى | Order cancelled |

### 4. Creating a purchase order / إنشاء أمر شراء

1. Click **Create PO / إنشاء أمر شراء**
2. Select **Supplier / المورد** from dropdown
3. Set **Order Date / تاريخ الطلب** (defaults to today)
4. Set **Expected Date / تاريخ التسليم المتوقع** (optional)
5. Add **line items / البنود**:

| Field | Arabic | Notes |
|---|---|---|
| Product | المنتج | Select from your product catalog |
| Quantity | الكمية | How many to order |
| Unit Cost | سعر الوحدة | Cost per unit from supplier |

- Click **+ Add Item** for more products
- Total calculates automatically

6. Add **Notes / ملاحظات** (optional — e.g. "عاجل")
7. Click **Create** — PO is created with status **Ordered**

### 5. Receiving goods / استلام البضاعة

When the supplier delivers:

1. Open the PO from the list
2. Verify quantities match what was delivered
3. Click **Receive / استلام**
4. Status changes to **Received / مُستلَم**
5. **Product stock automatically increases** by the ordered quantities
6. Stock movements are logged in Products → History

> ⚠️ **This is the most important step.** Stock does NOT update until you click Receive. Many pharmacies forget this and wonder why stock numbers are wrong.

### 6. Cancelling a PO / إلغاء أمر شراء

- Only possible on Draft or Ordered status
- Click **Delete / حذف** and confirm
- No stock changes if cancelled before receiving

---

## Full restocking workflow / سير عمل إعادة التخزين الكامل

```
Morning: Check Products page for low-stock items
    ↓
Create Purchase Order with low-stock products
    ↓
Send PO to supplier (phone/WhatsApp — outside the system)
    ↓
Supplier delivers (1-3 days later)
    ↓
Open PO → verify quantities → click Receive
    ↓
Confirm stock increased in Products module
    ↓
(Optional) Adjust stock if delivered qty differs from PO
```

---

## Practice exercises / تمارين عملية

**Exercise 1:** Add supplier "المصرية للأدوية" with phone 02-99998888

**Exercise 2:** Create PO from that supplier:
- 50× Panadol Extra @ 32 EGP
- 20× Augmentin 1g @ 85 EGP
- Expected delivery: 3 days from now

**Exercise 3:** Mark the PO as Received. Go to Products and verify stock increased by 50 and 20 respectively.

**Exercise 4:** Check stock movement history on Panadol — you should see an "in" entry from the PO.

---

## Common mistakes / أخطاء شائعة

| Mistake | Fix |
|---|---|
| Created PO but never received | Stock won't update — always click Receive |
| Wrong product selected in PO line | Double-check product name before saving |
| Receiving twice | Stock will double-count — cancel and recreate if needed |
| No supplier on file | Add supplier first before creating PO |
