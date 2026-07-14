import React, { useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { FadeSlideIn, StaggerGrid, StaggerItem } from "@/components/motion/FadeSlideIn";
import { Clock, Users, LogIn, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type AttendanceRow = {
  id: number;
  employeeId: number;
  type: string;
  clockedAt: string;
  method: string;
  employeeName?: string;
  employeeNameAr?: string;
  department?: string;
};

type TodayResponse = {
  records: AttendanceRow[];
  stats: { punchesToday: number; currentlyIn: number };
};

export default function AttendancePage() {
  const { t, language } = useLanguage();
  const [date] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery<TodayResponse>({
    queryKey: ["attendance-today", date],
    queryFn: () => apiFetch("/attendance/today"),
    refetchInterval: 15000,
  });

  const name = (r: AttendanceRow) =>
    language === "ar" && r.employeeNameAr ? r.employeeNameAr : (r.employeeName ?? `#${r.employeeId}`);

  return (
    <div className="space-y-6">
      <FadeSlideIn>
        <PageHeader
          title={t("Attendance", "الحضور")}
          description={t("Today's clock-ins and clock-outs", "تسجيلات الدخول والخروج اليوم")}
          icon={<Clock className="text-primary" />}
        />
      </FadeSlideIn>

      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <KpiCard tone="primary" label={t("Punches today", "تسجيلات اليوم")} value={data?.stats.punchesToday ?? "—"} icon={<Clock size={18} />} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard tone="success" label={t("Currently in", "حاضر الآن")} value={data?.stats.currentlyIn ?? "—"} icon={<Users size={18} />} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard tone="info" label={t("Open kiosk", "شاشة المسح")} value={t("/hr/clock", "/hr/clock")} hint={t("Full-screen scan mode", "وضع ملء الشاشة")} icon={<LogIn size={18} />} />
        </StaggerItem>
      </StaggerGrid>

      <FadeSlideIn delay={0.15}>
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold">{t("Recent punches", "آخر التسجيلات")}</div>
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !data?.records.length ? (
            <p className="p-8 text-center text-muted-foreground">{t("No punches yet today", "لا توجد تسجيلات اليوم")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.records.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="font-medium">{name(r)}</p>
                    <p className="text-xs text-muted-foreground">{r.department ?? "—"} · {r.method}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.type === "in" ? "default" : "secondary"} className="gap-1">
                      {r.type === "in" ? <LogIn size={12} /> : <LogOut size={12} />}
                      {r.type === "in" ? t("In", "دخول") : t("Out", "خروج")}
                    </Badge>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {new Date(r.clockedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FadeSlideIn>
    </div>
  );
}
