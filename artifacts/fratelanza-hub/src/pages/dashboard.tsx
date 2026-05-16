import React from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Users, CheckSquare, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { t, isRtl } = useLanguage();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: recentActivity, isLoading: isActivityLoading } = useGetRecentActivity();

  if (isSummaryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const statCards = [
    {
      title: t("Total Revenue", "إجمالي الإيرادات"),
      value: `${(summary?.totalRevenue || 0).toLocaleString()} ${t("EGP", "ج.م")}`,
      icon: Banknote,
      color: "text-emerald-500"
    },
    {
      title: t("Active Clients", "العملاء النشطين"),
      value: summary?.activeClients || 0,
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: t("Completed Tasks", "المهام المنجزة"),
      value: summary?.completedTasks || 0,
      icon: CheckSquare,
      color: "text-primary"
    },
    {
      title: t("Net Balance", "الرصيد الصافي"),
      value: `${(summary?.netBalance || 0).toLocaleString()} ${t("EGP", "ج.م")}`,
      icon: Activity,
      color: "text-amber-500"
    }
  ];

  const chartData = [
    { name: t("Income", "الدخل"), value: summary?.totalRevenue || 0, color: "#10b981" },
    { name: t("Expenses", "المصروفات"), value: summary?.totalExpenses || 0, color: "#ef4444" },
    { name: t("Net", "الصافي"), value: summary?.netBalance || 0, color: "#3b82f6" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} data-testid={`stat-card-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("Financial Overview", "النظرة المالية العامة")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
                  reversed={isRtl}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  orientation={isRtl ? "right" : "left"}
                />
                <Tooltip
                  cursor={{ fill: 'var(--secondary)' }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} ${t("EGP", "ج.م")}`, ""]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("Recent Activity", "النشاط الأخير")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentActivity?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t("No recent activity.", "لا يوجد نشاط أخير.")}
              </div>
            ) : (
              <div className="space-y-6">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex gap-4" data-testid={`activity-${activity.id}`}>
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {isRtl ? (activity.descriptionAr || activity.description) : activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
