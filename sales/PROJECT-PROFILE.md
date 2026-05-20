# Fratelanza Hub — Project Profile / ملف المشروع

> **One-line pitch:** A complete bilingual business operations platform built for Egyptian companies — CRM, finance, HR, inventory, rentals, and a full medical/dental clinic suite — all priced in Egyptian Pounds, fully Arabic-ready, runs in the cloud or on-premise.

> **بالعربية:** نظام إدارة أعمال متكامل ثنائي اللغة مصمم خصيصاً للشركات المصرية — إدارة العملاء، الحسابات، الموارد البشرية، المخزون، الإيجارات، ووحدة كاملة للعيادات الطبية وعيادات الأسنان — بالجنيه المصري، عربي بالكامل، يعمل على السحابة أو على خادمك الخاص.

---

## What is Fratelanza Hub? / ما هو فراتيلانزا هَب؟

Fratelanza Hub is a **multi-tenant SaaS platform**: one installation serves many customers, each with their own private database, their own subdomain (e.g. `clinic-elsaeed.fratelanza.com`), and their own users.

نظام **SaaS متعدد العملاء**: تركيب واحد يخدم العديد من العملاء، كل عميل له قاعدة بيانات خاصة، نطاق فرعي خاص (مثال: `clinic-elsaeed.fratelanza.com`)، ومستخدمين خاصين.

## Who is it for? / لمن هذا النظام؟

- **General businesses** — retailers, agencies, service companies, real-estate, rentals
- **Medical clinics** — single doctors, multi-doctor practices, polyclinics
- **Dental clinics** — interactive 32-tooth chart, FDI numbering, materials log
- **Multi-branch operations** — companies with 2+ locations needing per-branch reporting

- **الشركات العامة** — التجزئة، الوكالات، الخدمات، العقارات، الإيجارات
- **العيادات الطبية** — أطباء منفردين، عيادات متعددة الأطباء، مجمعات طبية
- **عيادات الأسنان** — مخطط أسنان تفاعلي 32 سن بترقيم FDI، سجل المواد
- **الشركات متعددة الفروع** — شركات لديها أكثر من فرع وتحتاج تقارير لكل فرع

## Modules / الوحدات

### Core (every package) / الأساسية (في كل الباقات)
| Module | الوحدة |
|---|---|
| Dashboard with KPI cards & charts | لوحة تحكم مع مؤشرات ورسوم بيانية |
| Tasks (Kanban + list, recurring, assignment) | المهام (كانبان + قائمة، متكررة، تعيين) |
| Notifications (in-app bell + WhatsApp links) | الإشعارات (داخل التطبيق + روابط واتساب) |
| User & permission management | إدارة المستخدمين والصلاحيات |
| Bilingual EN/AR with full RTL support | ثنائي اللغة عربي/إنجليزي مع دعم RTL |

### Add-on modules / الوحدات الإضافية
| Module | الوحدة |
|---|---|
| CRM / Clients pipeline | إدارة العملاء والمبيعات |
| Finance (income/expense, EGP only) | المالية (دخل/مصروف بالجنيه فقط) |
| Team / HR (employees, payroll-ready) | الموارد البشرية (الموظفين، جاهز للرواتب) |
| Products / Inventory | المنتجات والمخزون |
| Suppliers + Purchase Orders | الموردين وأوامر الشراء |
| Invoicing (general) | الفواتير العامة |
| Rentals (contracts, daily rates, documents) | الإيجارات (عقود، سعر يومي، مستندات) |
| Reports & analytics | التقارير والتحليلات |
| **Multi-branch** (filter every screen by branch) | **تعدد الفروع** (فلترة كل شاشة حسب الفرع) |
| **Medical Clinic** (patients, appts, visits, procedures, invoices, reports) | **العيادة الطبية** (مرضى، مواعيد، زيارات، إجراءات، فواتير، تقارير) |
| **Dental Clinic** (catalog, 32-tooth chart, dental visits) | **عيادة الأسنان** (كتالوج، مخطط 32 سن، زيارات) |

Every module above can be **switched on or off per customer** from the admin panel. The customer never sees a module they didn't pay for.

كل وحدة أعلاه يمكن **تفعيلها أو إيقافها لكل عميل** من لوحة التحكم. العميل لا يرى وحدة لم يدفع ثمنها.

## Why Fratelanza vs alternatives? / لماذا فراتيلانزا وليس البديل؟

| | Fratelanza | Foreign SaaS (Salesforce / HubSpot) | Generic Arabic SaaS |
|---|---|---|---|
| Price | **EGP, affordable** | USD, expensive | Often subscription-heavy |
| Arabic | **Full RTL, native** | Translation layer | Partial |
| Egyptian Pound currency | **Built-in** | Foreign exchange needed | Sometimes |
| Medical/Dental | **Included** | Add-on or N/A | Rarely |
| Multi-branch | **One click** | Enterprise tier only | Limited |
| On-premise option | **Yes** | No | Sometimes |
| Data residency | **Your VPS / Egypt** | US/EU servers | Varies |
| Per-tenant database | **Yes (true isolation)** | Shared DB | Shared DB |

## Tech stack (for IT buyers) / المنصة التقنية

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui + Recharts
- **Backend:** Node.js 24 + Express 5 + TypeScript 5.9
- **Database:** PostgreSQL 16 (per-tenant isolated DB)
- **Deployment:** Docker Compose (single-file stack), nginx + Let's Encrypt SSL
- **Backups:** Automated daily to Google Drive via rclone (30-day retention)
- **Auth:** Session-based, bcrypt password hashing, rate-limited login
- **Security:** Helmet, body-size limits, file-upload allow-list, audit logging

## Deployment options / خيارات التشغيل

1. **Cloud SaaS (hosted by us)** — customer gets `theirname.fratelanza.com`, we manage everything. Fastest start.
2. **On-premise / private VPS** — we install on the customer's own server. One-time setup fee + annual support.
3. **White-label** — your brand, your domain, your prices. Enterprise tier.

## Contact / للتواصل

- VPS demo: [test.fratelanza.com](https://test.fratelanza.com) — username `admin` / password `admin123`
- Admin panel: [admin.fratelanza.com](https://admin.fratelanza.com)
- WhatsApp: (fill in your number)
- Email: (fill in your email)
