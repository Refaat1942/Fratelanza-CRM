import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import {
  Users, Stethoscope, CalendarDays, DollarSign, AlertCircle, Activity, LineChart as LineChartIcon,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";

type Overview = {
  patients: number; visits_today: number; visits_week: number; visits_month: number;
  appts_today: number; revenue_today: number; revenue_week: number; revenue_month: number;
  outstanding: number; upcoming_followups: number;
};
type Daily = { day: string; count: number };
type DoctorRev = { doctor_id: number | null; doctor_name: string; doctor_name_ar: string | null; total_paid: number; invoice_count: number };
type TopProc = { procedure_id: number | null; name: string; name_ar: string | null; count: number; revenue: number };
type Trend = { month: string; billed: number; collected: number };

const fmtEgp = (n: number) => (n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const PALETTE = ["#1e40af", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#ec4899", "#f97316", "#6366f1"];

export default function MedicalReports() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";

  const { data: overview, isLoading: l1 } = useQuery<Overview>({
    queryKey: ["medical-reports/overview"], queryFn: () => apiFetch("/medical-reports/overview"),
  });
  const { data: daily } = useQuery<Daily[]>({
    queryKey: ["medical-reports/visits-per-day"], queryFn: () => apiFetch("/medical-reports/visits-per-day?days=30"),
  });
  const { data: doctors } = useQuery<DoctorRev[]>({
    queryKey: ["medical-reports/revenue-per-doctor"], queryFn: () => apiFetch("/medical-reports/revenue-per-doctor"),
  });
  const { data: procs } = useQuery<TopProc[]>({
    queryKey: ["medical-reports/top-procedures"], queryFn: () => apiFetch("/medical-reports/top-procedures"),
  });
  const { data: trend } = useQuery<Trend[]>({
    queryKey: ["medical-reports/monthly-trend"], queryFn: () => apiFetch("/medical-reports/monthly-trend"),
  });

  const dateLocale = isAr ? "ar-EG" : "en-US";
  const dailyChart = (daily || []).map(d => ({
    label: new Date(d.day).toLocaleDateString(dateLocale, { month: "short", day: "numeric" }),
    visits: d.count,
  }));
  const doctorChart = (doctors || []).map(d => ({
    name: isAr ? (d.doctor_name_ar || d.doctor_name) : d.doctor_name,
    revenue: Math.round(d.total_paid),
    invoices: d.invoice_count,
  }));
  const procChart = (procs || []).map(p => ({
    name: isAr ? (p.name_ar || p.name) : p.name,
    revenue: Math.round(p.revenue),
    count: p.count,
  }));
  const trendChart = (trend || []).map(m => ({
    month: new Date(m.month + "-01").toLocaleDateString(dateLocale, { month: "short", year: "2-digit" }),
    billed: Math.round(m.billed),
    collected: Math.round(m.collected),
  }));

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        icon={<LineChartIcon size={20} />}
        title={t("Medical Reports", "تقارير العيادة")}
        description={t("Visit trends, revenue per doctor, and top procedures — all in EGP.", "اتجاهات الزيارات وإيراد كل طبيب وأكثر الإجراءات شيوعًا — بالجنيه.")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = "/api/medical-reports/export.xlsx"; }}
            data-testid="btn-export-medical-xlsx"
          >
            <Download size={14} className="me-1.5" />
            {t("Download Excel", "تنزيل Excel")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {l1 ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />) : (
          <>
            <KpiCard
              label={t("Patients", "المرضى")}
              value={overview?.patients ?? 0}
              icon={<Users size={18} />}
              tone="primary"
            />
            <KpiCard
              label={t("Visits today", "زيارات اليوم")}
              value={overview?.visits_today ?? 0}
              icon={<Activity size={18} />}
              tone="info"
              hint={t(`${overview?.visits_week ?? 0} this week`, `${overview?.visits_week ?? 0} هذا الأسبوع`)}
            />
            <KpiCard
              label={t("Appts today", "مواعيد اليوم")}
              value={overview?.appts_today ?? 0}
              icon={<CalendarDays size={18} />}
              tone="info"
            />
            <KpiCard
              label={t("Revenue today", "إيراد اليوم")}
              value={`${fmtEgp(overview?.revenue_today ?? 0)} ${t("EGP", "ج.م")}`}
              icon={<DollarSign size={18} />}
              tone="success"
              hint={t(`${fmtEgp(overview?.revenue_month ?? 0)} this month`, `${fmtEgp(overview?.revenue_month ?? 0)} هذا الشهر`)}
            />
            <KpiCard
              label={t("Outstanding", "متبقي")}
              value={`${fmtEgp(overview?.outstanding ?? 0)} ${t("EGP", "ج.م")}`}
              icon={<AlertCircle size={18} />}
              tone="warning"
            />
            <KpiCard
              label={t("Follow-ups", "متابعات")}
              value={overview?.upcoming_followups ?? 0}
              icon={<Stethoscope size={18} />}
              tone="default"
              hint={t("upcoming", "قادمة")}
            />
          </>
        )}
      </div>

      <SectionCard
        title={t("Monthly revenue (last 6 months)", "الإيراد الشهري (آخر 6 شهور)")}
        description={t("Billed vs Collected — excludes cancelled invoices.", "إجمالي الفواتير مقابل المحصّل — يستثني الفواتير الملغاة.")}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={11} reversed={isRtl} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} orientation={isRtl ? "right" : "left"} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => `${fmtEgp(v)} ${t("EGP", "ج.م")}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="billed"    name={t("Billed", "إجمالي الفواتير")}  stroke="#1e40af" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="collected" name={t("Collected", "محصّل")}        stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title={t("Visits per day (last 30 days)", "الزيارات اليومية (آخر 30 يوم)")}>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={11} interval={Math.floor(dailyChart.length / 8)} reversed={isRtl} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} orientation={isRtl ? "right" : "left"} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
              <Area type="monotone" dataKey="visits" name={t("Visits", "الزيارات")} stroke="#1e40af" strokeWidth={2} fill="url(#visitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title={t("Revenue per doctor (last 90 days)", "إيراد كل طبيب (آخر 90 يوم)")}>
          {doctorChart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">{t("No paid invoices yet.", "لا توجد فواتير مدفوعة بعد.")}</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorChart} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} orientation={isRtl ? "top" : "bottom"} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" fontSize={11} width={100} orientation={isRtl ? "right" : "left"} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number) => `${fmtEgp(v)} ${t("EGP", "ج.م")}`}
                  />
                  <Bar dataKey="revenue" name={t("Revenue", "الإيراد")} radius={[0, 4, 4, 0]}>
                    {doctorChart.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("Top procedures (last 90 days)", "أكثر الإجراءات شيوعًا (آخر 90 يوم)")}>
          {procChart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">{t("No invoice lines yet.", "لا توجد فواتير بعد.")}</p>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={procChart} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={11} orientation={isRtl ? "top" : "bottom"} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" fontSize={11} width={120} orientation={isRtl ? "right" : "left"} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                      formatter={(v: number, n: string) => n === "revenue" ? `${fmtEgp(v)} ${t("EGP", "ج.م")}` : v}
                    />
                    <Bar dataKey="revenue" name={t("Revenue", "الإيراد")} fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border-t border-border pt-3">
                {procChart.map((p, i) => (
                  <div key={i} className="flex justify-between"><span className="truncate">{p.name}</span><span className="font-medium">×{p.count}</span></div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("Cancelled invoices are excluded. For the full cash ledger (including reversals), see Finance.", "الفواتير الملغاة غير محسوبة هنا. للحسابات الكاملة، راجع المالية.")}
      </p>
    </div>
  );
}
