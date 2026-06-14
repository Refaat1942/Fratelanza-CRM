# Module 02 — Products & Inventory / المنتجات والمخزون

> **Duration:** 45 minutes | **Audience:** Cashier, stock clerk, manager
> **Route:** `/products`

---

## What this module covers / ماذا يغطي

The **Products** module is your pharmacy's sellable inventory — every drug, supplement, and supply item you stock on the shelf. This is the primary tool for checking availability, pricing, and stock levels.

وحدة **المنتجات** هي مخزون الصيدلية القابل للبيع — كل دواء ومكمل ومستلزم على الرف. هذه الأداة الأساسية للتحقق من التوفر والأسعار ومستويات المخزون.

---

## 1. Product list overview / نظرة على قائمة المنتجات

Open **Products / المنتجات** from the sidebar.

You'll see a table with:

| Column | Arabic | Meaning |
|---|---|---|
| Name | الاسم | Drug or product name |
| SKU / Code | كود المنتج | Internal product code |
| Category | الفئة | e.g. أدوية، مستلزمات |
| Sale Price | سعر البيع | Price in EGP (ج.م) |
| Stock | المخزون | Current quantity on hand |
| Status | الحالة | Available / Low Stock / Out of Stock |

**Status badges:**
- 🟢 **Available / متاح** — in stock, above reorder point
- 🟡 **Low Stock / مخزون منخفض** — at or below reorder point
- 🔴 **Out of Stock / نفد المخزون** — zero stock

A counter at the top shows how many products are low on stock.

---

## 2. Searching for a product / البحث عن منتج

- Use the **search box** at the top to find products by name or SKU
- Type in Arabic or English — both work
- Example: search "بانادول" or "Panadol"

---

## 3. Adding a new product / إضافة منتج جديد

1. Click **Add Product / إضافة منتج**
2. Fill in the form:

| Field | Arabic | Example |
|---|---|---|
| Name | الاسم | Panadol Extra 24 tabs |
| Description | الوصف | مسكن للآلام والحمى |
| Sale Price (EGP) | سعر البيع | 45.00 |
| Cost Price (EGP) | سعر التكلفة | 32.00 |
| Initial Stock | المخزون الابتدائي | 100 |
| Reorder Point | حد إعادة الطلب | 20 |
| Category | الفئة | أدوية |
| SKU / Code | كود المنتج | PAN-EXT-24 |

3. Click **Save / حفظ**

> **Tip:** Set the reorder point to the minimum quantity before you need to reorder. When stock drops to this level, the product shows a "Low Stock" badge.

> **Important:** Initial stock can only be set when creating a product. To change stock later, use **Adjust Stock** (see below).

---

## 4. Adjusting stock / تعديل المخزون

Every stock change must go through **Adjust Stock** — this creates an audit trail.

1. Find the product in the list
2. Click the **Adjust Stock / تعديل المخزون** button (arrow icon)
3. Choose:
   - **Stock In / إدخال** — receiving goods (delivery, return from customer)
   - **Stock Out / إخراج** — removing goods (damage, expiry write-off, internal use)
4. Enter **quantity** and **reason / السبب**
5. Click **Confirm / تأكيد**

**Good reasons to write:**
- "استلام بضاعة من المورد"
- "بيع — فاتورة #123"
- "تالف / منتهي الصلاحية"
- "جرد — تصحيح"

> ⚠️ Never edit the stock number directly in the product edit form. Always use Adjust Stock.

---

## 5. Stock movement history / سجل حركات المخزون

1. Click the **History / السجل** button on any product
2. See every in/out movement with:
   - Date and time
   - Type (in/out)
   - Quantity
   - Balance after
   - Reason
   - Who made the change (username)

This is your audit trail — useful for inventory reconciliation and investigating discrepancies.

---

## 6. Editing product details / تعديل بيانات المنتج

1. Click the **Edit / تعديل** button (pencil icon)
2. You can change: name, description, prices, category, SKU, reorder point
3. You **cannot** change stock here — use Adjust Stock
4. Click **Save**

---

## 7. Deleting a product / حذف منتج

- Click **Delete / حذف** (trash icon)
- Confirm the deletion
- Only delete products that were added by mistake — prefer marking as unavailable instead

---

## Daily workflow for pharmacy staff / سير العمل اليومي

### Cashier (at counter)
1. Customer asks for a drug → search in Products
2. Check stock quantity and price
3. If available → proceed to create invoice (Module 03)
4. If low/out → inform customer, suggest alternative

### Stock clerk (in storeroom)
1. Morning: review low-stock count at top of Products page
2. Note items below reorder point → create Purchase Order (Module 04)
3. When delivery arrives → Adjust Stock In with reason "استلام بضاعة"
4. Weekly: spot-check physical count vs system count

---

## Practice exercises / تمارين عملية

**Exercise 1:** Add product "Augmentin 1g 14 tabs" — price 120 EGP, cost 85 EGP, stock 30, reorder 5, category "أدوية", SKU "AUG-1G-14"

**Exercise 2:** Adjust stock OUT 2 units of Panadol with reason "بيع"

**Exercise 3:** Open history on Panadol — verify your adjustment appears

**Exercise 4:** Search for a product by Arabic name. Check its status badge.

---

## Common mistakes / أخطاء شائعة

| Mistake | Why it's wrong | Do this instead |
|---|---|---|
| Changing stock in Edit form | No audit trail | Use Adjust Stock |
| No reason on adjustment | Can't investigate later | Always write a reason |
| Same SKU for different products | Confusing reports | Unique SKU per product |
| Reorder point = 0 | Never shows low-stock alert | Set realistic minimum |
