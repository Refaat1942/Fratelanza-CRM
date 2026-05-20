# Onboarding Checklist / قائمة التشغيل لعميل جديد

> Use this checklist every time a new customer signs up. Each step should take 5–15 minutes.
> استخدم هذه القائمة مع كل عميل جديد. كل خطوة 5-15 دقيقة.

---

## ✅ Step 1 — Collect customer info / جمع بيانات العميل

- [ ] Business name (English) — اسم النشاط بالإنجليزي
- [ ] Business name (Arabic) — اسم النشاط بالعربي
- [ ] Desired subdomain (e.g. `dr-ahmed`, `clinic-elsaeed`, `metro-rentals`) — يجب أن يكون حروف صغيرة وأرقام و`-` فقط
- [ ] Contact name + phone + email + WhatsApp
- [ ] Package selected (Starter / Business / Clinic / Dental / Enterprise)
- [ ] Billing cycle (monthly / quarterly / yearly / lifetime)
- [ ] Features to enable (default = everything in their package)
- [ ] Payment received? (bank / Vodafone Cash / Instapay / cash)

## ✅ Step 2 — Create customer in admin panel / إنشاء العميل في لوحة التحكم

1. Open `admin.fratelanza.com` and log in.
2. Click **Customers → New Customer**.
3. Fill name, subdomain, contact info, plan, billing amount, cycle.
4. **Features**: tick only what the customer paid for.
5. Click **Save**. The system will:
   - Auto-create a private database for this customer
   - Apply all schema migrations (including medical, dental, branches)
   - Seed a default `admin` / `admin123` user
6. Wait for status to show **"ready"** (usually < 30 seconds).
7. If status is **"failed"**, click **Re-provision DB**. If it fails twice, contact tech.

## ✅ Step 3 — First-payment record / تسجيل أول دفعة

1. On the customer page, click **Record Payment**.
2. Enter amount, date, method (bank / cash / Vodafone Cash / etc.).
3. Save. The system auto-advances `next_billing_date` by one cycle.

## ✅ Step 4 — Reset and share login / إعادة تعيين بيانات الدخول وإرسالها

1. On the customer page, click **Reset Admin Password**.
2. **COPY the revealed password ONCE — it cannot be shown again.**
3. Send the customer this WhatsApp message:

```
أهلاً [اسم العميل]،
حسابك جاهز على فراتيلانزا هَب 🎉

🌐 الرابط: https://[subdomain].fratelanza.com
👤 اسم المستخدم: admin
🔑 كلمة المرور: [paste the revealed password]

أول مرة هتدخل هيطلب منك تغيّر كلمة المرور — ده ضروري لأمان حسابك.

لو احتجت مساعدة، أنا تحت أمرك في أي وقت.
```

## ✅ Step 5 — First call / المكالمة الأولى (15 دقيقة)

Walk the customer through:
- [ ] Logging in & changing the admin password
- [ ] Creating their first 2-3 users with permissions
- [ ] (If multi-branch) Creating branches
- [ ] Switching between Arabic and English
- [ ] Where to find the support contact

شرح للعميل:
- [ ] تسجيل الدخول وتغيير كلمة المرور
- [ ] إضافة أول 2-3 مستخدمين وتحديد صلاحياتهم
- [ ] (إن كان متعدد الفروع) إضافة الفروع
- [ ] التبديل بين العربي والإنجليزي
- [ ] أين يجد جهة اتصال الدعم

## ✅ Step 6 — Add to follow-up schedule / إضافة إلى جدول المتابعة

- **Day 3:** Call to check usage and answer questions
- **Day 14:** End-of-trial call: confirm satisfaction, collect feedback
- **Day 25:** Reminder before next billing date

- **اليوم 3:** اتصال للاطمئنان والإجابة على الأسئلة
- **اليوم 14:** نهاية الفترة التجريبية: تأكيد الرضا وجمع الملاحظات
- **اليوم 25:** تذكير قبل موعد الدفع التالي

---

## 🚨 Common issues / المشاكل الشائعة

| Problem | Quick fix | المشكلة |
|---|---|---|
| Customer can't log in | Reset admin password from admin panel | لا يستطيع تسجيل الدخول |
| `internal_error` on login | Check tenant DB exists & is `ready`. If not, re-provision. | خطأ داخلي عند تسجيل الدخول |
| Subdomain doesn't open | Wait 1-2 min for DNS propagation. If still down, check wildcard cert is valid. | النطاق الفرعي لا يفتح |
| Feature missing from sidebar | Check customer's enabled features in admin panel | وحدة مفقودة من القائمة |
| Branches button missing for admin user | Customer's "Multi-branch" feature is off — turn it on | لا يظهر زر الفروع |
| Old data needs to be imported | Quote the data-migration fee (2,499 – 9,999 EGP) | يحتاج استيراد بيانات قديمة |

---

## 📋 Internal: monthly recurring tasks / المهام الشهرية الداخلية

- [ ] Check all customers with status **"due"** or **"overdue"** — send WhatsApp reminder
- [ ] Review admin **Reports tab** — MRR, churn risk
- [ ] Download monthly Excel report (admin → Reports → Export.xlsx) for records
- [ ] Check VPS backup ran successfully (`/var/log/fratelanza-backup.log`)
- [ ] Apply any new tenant migrations released this month (`deploy/migrate-tenants.sh`)
