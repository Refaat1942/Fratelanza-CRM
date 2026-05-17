import React from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, CheckSquare, Banknote, UserCheck, Download } from "lucide-react";

type ReportData = {
  tasks: { total: number; completed: number; pending: number; in_progress: number };
  clients: { total: number; active: number; leads: number };
  finance: { totalIncome: number; totalExpenses: number; netBalance: number };
  employees: { total: number; active: number };
  charts: {
    monthlyFinance: { month: string; income: number; expenses: number }[];
    tasksByPriority: { priority: string; count: number }[];
    clientsByStatus: { status: string; count: number }[];
  };
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
    fontSize: '13px',
  },
};

export default function Reports() {
  const { t, isRtl } = useLanguage();

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["reports-overview"],
    queryFn: () => apiFetch("/reports/overview"),
  });

  const fmtEGP = (v: number) => `${v.toLocaleString()} ${t("EGP", "ج.م")}`;
  const pct = (n: number, d: number) => d ? `${Math.round((n / d) * 100)}%` : "0%";

  const exportToExcel = async () => {
    if (!data) return;
    const xlsx = await import("xlsx");
    const wb = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
      [t("Financial Summary", "ملخص مالي")],
      [t("Total Income", "إجمالي الدخل"), data.finance.totalIncome],
      [t("Total Expenses", "إجمالي المصروفات"), data.finance.totalExpenses],
      [t("Net Balance", "الرصيد الصافي"), data.finance.netBalance],
    ]), t("Finance", "المالية"));

    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
      [t("Monthly Finance", "المالية الشهرية")],
      [t("Month", "الشهر"), t("Income", "الدخل"), t("Expenses", "المصروفات")],
      ...(data.charts.monthlyFinance.map(r => [r.month, r.income, r.expenses])),
    ]), t("Monthly", "شهري"));

    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
      [t("Tasks Summary", "ملخص المهام")],
      [t("Total", "الإجمالي"), data.tasks.total],
      [t("Completed", "مكتملة"), data.tasks.completed],
      [t("Pending", "معلقة"), data.tasks.pending],
      [t("In Progress", "قيد التنفيذ"), data.tasks.in_progress],
    ]), t("Tasks", "المهام"));

    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
      [t("Clients Summary", "ملخص العملاء")],
      [t("Total", "الإجمالي"), data.clients.total],
      [t("Active", "نشط"), data.clients.active],
      [t("Leads", "محتملون"), data.clients.leads],
    ]), t("Clients", "العملاء"));

    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
      [t("Employees Summary", "ملخص الموظفين")],
      [t("Total", "الإجمالي"), data.employees.total],
      [t("Active", "نشط"), data.employees.active],
    ]), t("Employees", "الموظفون"));

    xlsx.writeFile(wb, `fratelanza-report-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1, 2].map(i => <Skeleton key={i} className="h-72" />)}</div>
      </div>
    );
  }

  const kpis = [
    { title: t("Total Revenue", "إجمالي الإيرادات"), value: fmtEGP(data?.finance.totalIncome || 0), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" },
    { title: t("Total Expenses", "إجمالي المصروفات"), value: fmtEGP(data?.finance.totalExpenses || 0), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800" },
    { title: t("Active Clients", "العملاء النشطون"), value: data?.clients.active ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" },
    { title: t("Task Completion", "إنجاز المهام"), value: pct(data?.tasks.completed || 0, data?.tasks.total || 0), icon: CheckSquare, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
  ];

  const priorityLabels: Record<string, string> = { high: t("High", "عالي"), medium: t("Medium", "متوسط"), low: t("Low", "منخفض") };
  const statusLabels: Record<string, string> = { active: t("Active", "نشط"), inactive: t("Inactive", "غير نشط"), lead: t("Lead", "عميل محتمل"), prospect: t("Prospect", "مرتقب") };

  const pieTaskData = data?.charts.tasksByPriority.map(d => ({ name: priorityLabels[d.priority] || d.priority, value: d.count })) || [];
  const pieClientData = data?.charts.clientsByStatus.map(d => ({ name: statusLabels[d.status] || d.status, value: d.count })) || [];

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t("Reports & Analytics", "التقارير والتحليلات")}</h2>
          <p className="text-muted-foreground text-sm">{t("Business performance overview", "نظرة عامة على أداء الأعمال")}</p>
        </div>
        <Button onClick={exportToExcel} variant="outline" className="gap-2" disabled={!data}>
          <Download size={16} />
          {t("Export Excel", "تصدير Excel")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className={kpi.bg}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                  <h3 className="text-xl font-bold mt-1">{kpi.value}</h3>
                </div>
                <Icon className={`w-7 h-7 opacity-60 ${kpi.color}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("Monthly Revenue vs Expenses", "الإيرادات الشهرية مقابل المصروفات")}</CardTitle></CardHeader>
          <CardContent>
            {!data?.charts.monthlyFinance.length ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{t("No financial data yet.", "لا توجد بيانات مالية بعد.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.charts.monthlyFinance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => fmtEGP(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name={t("Income", "دخل")} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t("Expenses", "مصروفات")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("Tasks by Priority", "المهام حسب الأولوية")}</CardTitle></CardHeader>
          <CardContent>
            {!pieTaskData.length ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{t("No task data yet.", "لا توجد بيانات مهام بعد.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieTaskData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieTaskData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("Clients by Status", "العملاء حسب الحالة")}</CardTitle></CardHeader>
          <CardContent>
            {!pieClientData.length ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{t("No client data yet.", "لا توجد بيانات عملاء بعد.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieClientData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieClientData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t("Performance Summary", "ملخص الأداء")}</CardTitle></CardHeader>
          <CardContent className="space-y-0 pt-2">
            {[
              { label: t("Total Tasks", "إجمالي المهام"), value: data?.tasks.total ?? 0, icon: CheckSquare, sub: `${pct(data?.tasks.completed || 0, data?.tasks.total || 0)} ${t("completion", "إنجاز")}` },
              { label: t("Total Clients", "إجمالي العملاء"), value: data?.clients.total ?? 0, icon: Users, sub: `${data?.clients.leads ?? 0} ${t("leads", "محتملون")}` },
              { label: t("Net Balance", "الرصيد الصافي"), value: fmtEGP(data?.finance.netBalance || 0), icon: Banknote, sub: `${fmtEGP(data?.finance.totalIncome || 0)} ${t("income", "دخل")}` },
              { label: t("Active Employees", "الموظفون النشطون"), value: data?.employees.active ?? 0, icon: UserCheck, sub: `${data?.employees.total ?? 0} ${t("total", "الإجمالي")}` },
            ].map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-secondary">
                      <Icon size={15} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.sub}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{row.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Employee & Client Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("Task Status Breakdown", "توزيع حالات المهام")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {[
              { label: t("Completed", "مكتملة"), value: data?.tasks.completed ?? 0, color: "bg-emerald-500" },
              { label: t("In Progress", "قيد التنفيذ"), value: data?.tasks.in_progress ?? 0, color: "bg-blue-500" },
              { label: t("Pending", "معلقة"), value: data?.tasks.pending ?? 0, color: "bg-amber-500" },
            ].map((row, i) => {
              const total = data?.tasks.total || 1;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${Math.round((row.value / total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("Client Pipeline", "مسار العملاء")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {[
              { label: t("Active Clients", "عملاء نشطون"), value: data?.clients.active ?? 0, color: "bg-emerald-500" },
              { label: t("Leads", "محتملون"), value: data?.clients.leads ?? 0, color: "bg-blue-500" },
              { label: t("Total", "الإجمالي"), value: data?.clients.total ?? 0, color: "bg-primary" },
            ].map((row, i) => {
              const total = data?.clients.total || 1;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${Math.round((row.value / total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("Finance Overview", "نظرة مالية")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            {[
              { label: t("Income", "الدخل"), value: fmtEGP(data?.finance.totalIncome || 0), dot: "bg-emerald-500" },
              { label: t("Expenses", "المصروفات"), value: fmtEGP(data?.finance.totalExpenses || 0), dot: "bg-red-500" },
              { label: t("Net Balance", "الرصيد الصافي"), value: fmtEGP(data?.finance.netBalance || 0), dot: "bg-blue-500" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${row.dot}`} />
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                </div>
                <span className="font-semibold text-sm">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
