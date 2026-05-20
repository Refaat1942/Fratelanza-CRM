import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import {
  Users, Stethoscope, CalendarDays, DollarSign, AlertCircle, Activity,
} from "lucide-react";

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

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"];

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

  const stat = (label: string, value: React.ReactNode, icon: React.ReactNode, sub?: string, tone?: string) => (
    <Card><CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className={`text-2xl font-bold mt-1 ${tone || ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent></Card>
  );

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-bold">{t("Medical Reports", "تقارير العيادة")}</h2>
        <p className="text-muted-foreground">{t("Visit trends, revenue per doctor, and top procedures — all in EGP", "اتجاهات الزيارات وإيراد كل طبيب وأكثر الإجراءات شيوعًا — بالجنيه")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("Cancelled invoices are excluded. For the full cash ledger (including reversals), see Finance.", "الفواتير الملغاة غير محسوبة هنا. للحسابات الكاملة، راجع المالية.")}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {l1 ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />) : (
          <>
            {stat(t("Patients", "المرضى"), overview?.patients ?? 0, <Users size={12} />)}
            {stat(t("Visits today", "زيارات اليوم"), overview?.visits_today ?? 0, <Activity size={12} />, t(`${overview?.visits_week ?? 0} this week`, `${overview?.visits_week ?? 0} هذا الأسبوع`))}
            {stat(t("Appts today", "مواعيد اليوم"), overview?.appts_today ?? 0, <CalendarDays size={12} />)}
            {stat(t("Revenue today", "إيراد اليوم"), `${fmtEgp(overview?.revenue_today ?? 0)} ${t("EGP", "ج.م")}`, <DollarSign size={12} />, t(`${fmtEgp(overview?.revenue_month ?? 0)} this month`, `${fmtEgp(overview?.revenue_month ?? 0)} هذا الشهر`), "text-emerald-700")}
            {stat(t("Outstanding", "متبقي"), `${fmtEgp(overview?.outstanding ?? 0)} ${t("EGP", "ج.م")}`, <AlertCircle size={12} />, undefined, "text-amber-700")}
            {stat(t("Follow-ups", "متابعات"), overview?.upcoming_followups ?? 0, <Stethoscope size={12} />, t("upcoming", "قادمة"))}
          </>
        )}
      </div>

      {/* Monthly trend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">{t("Monthly revenue (last 6 months)", "الإيراد الشهري (آخر 6 شهور)")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" fontSize={12} reversed={isRtl} />
                <YAxis fontSize={12} orientation={isRtl ? "right" : "left"} />
                <Tooltip formatter={(v: number) => `${fmtEgp(v)} ${t("EGP", "ج.م")}`} />
                <Legend />
                <Line type="monotone" dataKey="billed"    name={t("Billed", "إجمالي الفواتير")}  stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="collected" name={t("Collected", "محصّل")}        stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Visits per day */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">{t("Visits per day (last 30 days)", "الزيارات اليومية (آخر 30 يوم)")}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" fontSize={11} interval={Math.floor(dailyChart.length / 8)} reversed={isRtl} />
                <YAxis fontSize={12} orientation={isRtl ? "right" : "left"} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="visits" name={t("Visits", "الزيارات")} stroke="#8b5cf6" fill="url(#visitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue per doctor */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">{t("Revenue per doctor (last 90 days)", "إيراد كل طبيب (آخر 90 يوم)")}</h3>
            {doctorChart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">{t("No paid invoices yet.", "لا توجد فواتير مدفوعة بعد.")}</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doctorChart} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" fontSize={11} orientation={isRtl ? "top" : "bottom"} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={100} orientation={isRtl ? "right" : "left"} />
                    <Tooltip formatter={(v: number) => `${fmtEgp(v)} ${t("EGP", "ج.م")}`} />
                    <Bar dataKey="revenue" name={t("Revenue", "الإيراد")} radius={[0, 4, 4, 0]}>
                      {doctorChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top procedures */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">{t("Top procedures (last 90 days)", "أكثر الإجراءات شيوعًا (آخر 90 يوم)")}</h3>
            {procChart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">{t("No invoice lines yet.", "لا توجد فواتير بعد.")}</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={procChart} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" fontSize={11} orientation={isRtl ? "top" : "bottom"} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={120} orientation={isRtl ? "right" : "left"} />
                    <Tooltip formatter={(v: number, n: string) => n === "revenue" ? `${fmtEgp(v)} ${t("EGP", "ج.م")}` : v} />
                    <Bar dataKey="revenue" name={t("Revenue", "الإيراد")} fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {procChart.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {procChart.map((p, i) => (
                  <div key={i} className="flex justify-between"><span className="truncate">{p.name}</span><span>×{p.count}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
