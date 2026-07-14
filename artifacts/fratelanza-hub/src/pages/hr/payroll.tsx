import React, { useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { FadeSlideIn, StaggerGrid, StaggerItem } from "@/components/motion/FadeSlideIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type PayrollRun = {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalAmount: number;
  createdAt: string;
};

type PayrollStats = { draftRuns: number; paidTotal: number };

export default function PayrollPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [periodStart, setPeriodStart] = useState(monthStart);
  const [periodEnd, setPeriodEnd] = useState(monthEnd);

  const { data: runs, isLoading } = useQuery<PayrollRun[]>({
    queryKey: ["payroll-runs"],
    queryFn: () => apiFetch("/payroll/runs"),
  });

  const { data: stats } = useQuery<PayrollStats>({
    queryKey: ["payroll-stats"],
    queryFn: () => apiFetch("/payroll/stats"),
  });

  const createRun = useMutation({
    mutationFn: () => apiFetch("/payroll/runs", {
      method: "POST",
      body: JSON.stringify({ periodStart, periodEnd }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      qc.invalidateQueries({ queryKey: ["payroll-stats"] });
      toast({ title: t("Payroll run created", "تم إنشاء كشف الرواتب") });
    },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const finalizeRun = useMutation({
    mutationFn: (id: number) => apiFetch(`/payroll/runs/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "finalized" }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      toast({ title: t("Payroll finalized", "تم اعتماد الرواتب") });
    },
  });

  const statusLabel = (s: string) => {
    if (s === "draft") return t("Draft", "مسودة");
    if (s === "finalized") return t("Finalized", "معتمد");
    if (s === "paid") return t("Paid", "مدفوع");
    return s;
  };

  return (
    <div className="space-y-6">
      <FadeSlideIn>
        <PageHeader
          title={t("Payroll", "الرواتب")}
          description={t("Generate payslips from attendance hours", "إنشاء كشوف رواتب من ساعات الحضور")}
          icon={<Wallet className="text-primary" />}
        />
      </FadeSlideIn>

      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StaggerItem>
          <KpiCard tone="warning" label={t("Draft runs", "مسودات")} value={stats?.draftRuns ?? 0} icon={<FileText size={18} />} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard tone="success" label={t("Total paid (EGP)", "إجمالي المدفوع (ج.م)")} value={stats?.paidTotal?.toLocaleString() ?? 0} icon={<Wallet size={18} />} />
        </StaggerItem>
      </StaggerGrid>

      <FadeSlideIn delay={0.1}>
        <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm space-y-4">
          <h3 className="font-semibold">{t("New payroll run", "كشف رواتب جديد")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("Period start", "بداية الفترة")}</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t("Period end", "نهاية الفترة")}</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="mt-1" />
            </div>
          </div>
          <Button onClick={() => createRun.mutate()} disabled={createRun.isPending}>
            {t("Generate payroll", "إنشاء الرواتب")}
          </Button>
        </div>
      </FadeSlideIn>

      <FadeSlideIn delay={0.2}>
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold">{t("Payroll history", "سجل الرواتب")}</div>
          {isLoading ? (
            <p className="p-6 text-muted-foreground">{t("Loading…", "جاري التحميل…")}</p>
          ) : !runs?.length ? (
            <p className="p-8 text-center text-muted-foreground">{t("No payroll runs yet", "لا توجد كشوف رواتب")}</p>
          ) : (
            <ul className="divide-y">
              {runs.map(run => (
                <li key={run.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{run.periodStart} → {run.periodEnd}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums">{run.totalAmount.toLocaleString()} {t("EGP", "ج.م")}</span>
                    <Badge variant={run.status === "paid" ? "default" : "secondary"}>{statusLabel(run.status)}</Badge>
                    {run.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => finalizeRun.mutate(run.id)}>
                        <CheckCircle2 size={14} className="mr-1" /> {t("Finalize", "اعتماد")}
                      </Button>
                    )}
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
