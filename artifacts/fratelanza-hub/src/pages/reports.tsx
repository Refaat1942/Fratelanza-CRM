import React from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, CheckSquare, DollarSign, UserCheck } from "lucide-react";

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

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

export default function Reports() {
  const { t, isRtl } = useLanguage();

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["reports-overview"],
    queryFn: () => apiFetch("/reports/overview"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1, 2].map(i => <Skeleton key={i} className="h-72" />)}</div>
      </div>
    );
  }

  const kpis = [
    { title: t("Total Revenue", "إجمالي الإيرادات"), value: `$${(data?.finance.totalIncome || 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30" },
    { title: t("Total Expenses", "إجمالي المصروفات"), value: `$${(data?.finance.totalExpenses || 0).toLocaleString()}`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" },
    { title: t("Active Clients", "العملاء النشطون"), value: data?.clients.active ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30" },
    { title: t("Task Completion", "إنجاز المهام"), value: data?.tasks.total ? `${Math.round(((data.tasks.completed || 0) / data.tasks.total) * 100)}%` : "0%", icon: CheckSquare, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
  ];

  const priorityLabels: Record<string, string> = { high: t("High", "عالي"), medium: t("Medium", "متوسط"), low: t("Low", "منخفض") };
  const statusLabels: Record<string, string> = { active: t("Active", "نشط"), inactive: t("Inactive", "غير نشط"), lead: t("Lead", "عميل محتمل"), prospect: t("Prospect", "مرتقب") };

  const pieTaskData = data?.charts.tasksByPriority.map(d => ({ name: priorityLabels[d.priority] || d.priority, value: d.count })) || [];
  const pieClientData = data?.charts.clientsByStatus.map(d => ({ name: statusLabels[d.status] || d.status, value: d.count })) || [];

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-bold">{t("Reports & Analytics", "التقارير والتحليلات")}</h2>
        <p className="text-muted-foreground">{t("Business performance overview", "نظرة عامة على أداء الأعمال")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className={kpi.bg}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
                </div>
                <Icon className={`w-8 h-8 opacity-50 ${kpi.color}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("Monthly Revenue vs Expenses", "الإيرادات الشهرية مقابل المصروفات")}</CardTitle></CardHeader>
          <CardContent>
            {data?.charts.monthlyFinance.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{t("No financial data yet.", "لا توجد بيانات مالية بعد.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.charts.monthlyFinance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
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
            {pieTaskData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{t("No task data yet.", "لا توجد بيانات مهام بعد.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieTaskData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieTaskData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("Clients by Status", "العملاء حسب الحالة")}</CardTitle></CardHeader>
          <CardContent>
            {pieClientData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{t("No client data yet.", "لا توجد بيانات عملاء بعد.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieClientData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieClientData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("Summary Stats", "ملخص الإحصاءات")}</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-2">
            {[
              { label: t("Total Tasks", "إجمالي المهام"), value: data?.tasks.total ?? 0, icon: CheckSquare },
              { label: t("Total Clients", "إجمالي العملاء"), value: data?.clients.total ?? 0, icon: Users },
              { label: t("Net Balance", "الرصيد الصافي"), value: `$${(data?.finance.netBalance || 0).toLocaleString()}`, icon: DollarSign },
              { label: t("Active Employees", "الموظفون النشطون"), value: data?.employees.active ?? 0, icon: UserCheck },
            ].map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={16} />{row.label}</div>
                  <span className="font-semibold">{row.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
