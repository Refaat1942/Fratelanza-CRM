import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicalDataTable, MedicalListToolbar } from "@/components/medical/MedicalListToolbar";
import { Activity, ClipboardList, Dumbbell, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Assessment = {
  id: number; patientId: number; assessmentDate: string; bodyRegion?: string | null;
  painScale?: number | null; diagnosis?: string | null; goals?: string | null;
};
type Session = {
  id: number; patientId: number; sessionDate: string; sessionNumber?: number | null;
  bodyRegion?: string | null; painBefore?: number | null; painAfter?: number | null;
  status: string; feeEgp?: number | null;
};
type Plan = {
  id: number; patientId: number; title: string; sessionsPlanned: number;
  sessionsCompleted: number; status: string;
};
type Exercise = { id: number; name: string; nameAr?: string | null; category?: string | null; bodyRegion?: string | null };

const BODY_REGIONS = [
  { en: "Cervical spine", ar: "العنق" },
  { en: "Lumbar spine", ar: "أسفل الظهر" },
  { en: "Shoulder", ar: "الكتف" },
  { en: "Knee", ar: "الركبة" },
  { en: "Hip", ar: "الورك" },
  { en: "Ankle", ar: "الكاحل" },
  { en: "Elbow", ar: "المرفق" },
  { en: "Wrist", ar: "المعصم" },
];

export default function PhysiotherapyPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState("sessions");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sessionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    patientId: "", sessionDate: new Date().toISOString().slice(0, 16),
    bodyRegion: "", painBefore: "", painAfter: "", feeEgp: "", notes: "",
  });

  const { data: stats } = useQuery<{ assessments: number; sessions: number; activePlans: number }>({
    queryKey: ["physio-stats"],
    queryFn: () => apiFetch("/physio/stats"),
  });

  const { data: patients } = useQuery<{ id: number; firstName: string; lastName?: string | null }[]>({
    queryKey: ["patients-list-short"],
    queryFn: () => apiFetch("/patients"),
  });

  const sessionsQ = useQuery<Session[]>({
    queryKey: ["physio-sessions", sortBy, sortDir, statusFilter],
    queryFn: () => {
      const p = new URLSearchParams({ sortBy, sortDir });
      if (statusFilter) p.set("status", statusFilter);
      return apiFetch(`/physio-sessions?${p}`);
    },
    enabled: tab === "sessions",
  });

  const assessmentsQ = useQuery<Assessment[]>({
    queryKey: ["physio-assessments", sortBy, sortDir],
    queryFn: () => apiFetch(`/physio-assessments?sortBy=${sortBy}&sortDir=${sortDir}`),
    enabled: tab === "assessments",
  });

  const plansQ = useQuery<Plan[]>({
    queryKey: ["physio-plans", statusFilter],
    queryFn: () => apiFetch(`/physio-plans${statusFilter ? `?status=${statusFilter}` : ""}`),
    enabled: tab === "plans",
  });

  const exercisesQ = useQuery<Exercise[]>({
    queryKey: ["physio-exercises", search],
    queryFn: () => apiFetch(`/physio-exercises${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    enabled: tab === "exercises",
  });

  const createSession = useMutation({
    mutationFn: () => apiFetch("/physio-sessions", {
      method: "POST",
      body: JSON.stringify({
        patientId: Number(sessionForm.patientId),
        sessionDate: new Date(sessionForm.sessionDate).toISOString(),
        bodyRegion: sessionForm.bodyRegion || null,
        painBefore: sessionForm.painBefore ? Number(sessionForm.painBefore) : null,
        painAfter: sessionForm.painAfter ? Number(sessionForm.painAfter) : null,
        feeEgp: sessionForm.feeEgp ? Number(sessionForm.feeEgp) : 0,
        notes: sessionForm.notes || null,
        status: "completed",
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physio-sessions"] });
      qc.invalidateQueries({ queryKey: ["physio-stats"] });
      setSessionOpen(false);
      toast({ title: t("Session recorded", "تم تسجيل الجلسة") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const patientName = (id: number) => {
    const p = patients?.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName ?? ""}`.trim() : `#${id}`;
  };

  const exportUrl = tab === "sessions" ? "/api/physio-sessions/export.xlsx"
    : tab === "assessments" ? "/api/physio-assessments/export.xlsx"
    : tab === "plans" ? "/api/physio-plans/export.xlsx"
    : "/api/physio-exercises/export.xlsx";

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Physiotherapy", "العلاج الطبيعي")}
        description={t("Assessments, treatment plans, sessions & exercise catalog — Egypt clinic standards", "تقييمات وخطط علاج وجلسات وكتالوج تمارين — معايير العيادات المصرية")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<FileText size={18} />} label={t("Assessments", "التقييمات")} value={stats?.assessments ?? 0} />
        <KpiCard icon={<Activity size={18} />} label={t("Sessions", "الجلسات")} value={stats?.sessions ?? 0} />
        <KpiCard icon={<ClipboardList size={18} />} label={t("Active plans", "خطط نشطة")} value={stats?.activePlans ?? 0} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sessions">{t("Sessions", "الجلسات")}</TabsTrigger>
          <TabsTrigger value="assessments">{t("Assessments", "التقييمات")}</TabsTrigger>
          <TabsTrigger value="plans">{t("Treatment plans", "خطط العلاج")}</TabsTrigger>
          <TabsTrigger value="exercises"><Dumbbell className="h-4 w-4 me-1 inline" />{t("Exercises", "التمارين")}</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <SectionCard>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">{t("Physio sessions", "جلسات العلاج الطبيعي")}</h3>
              <Button onClick={() => setSessionOpen(true)}>{t("New session", "جلسة جديدة")}</Button>
            </div>
            <MedicalListToolbar
              search={search} onSearchChange={setSearch}
              sortBy={sortBy} sortDir={sortDir}
              onSortByChange={setSortBy}
              onSortDirToggle={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              sortOptions={[
                { value: "sessionDate", labelEn: "Date", labelAr: "التاريخ" },
                { value: "feeEgp", labelEn: "Fee", labelAr: "الرسوم" },
              ]}
              exportUrl={exportUrl}
              extraFilters={
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder={t("Status", "الحالة")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All", "الكل")}</SelectItem>
                    <SelectItem value="completed">{t("Completed", "مكتمل")}</SelectItem>
                    <SelectItem value="scheduled">{t("Scheduled", "مجدول")}</SelectItem>
                    <SelectItem value="no_show">{t("No show", "لم يحضر")}</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <MedicalDataTable
              rows={sessionsQ.data ?? []}
              isLoading={sessionsQ.isLoading}
              sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}
              rowKey={(r) => r.id}
              emptyMessage={{ en: "No sessions yet", ar: "لا توجد جلسات بعد" }}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "sessionDate", headerEn: "Date", headerAr: "التاريخ", sortable: true, sortKey: "sessionDate",
                  render: (r) => new Date(r.sessionDate).toLocaleString(isAr ? "ar-EG" : "en-EG") },
                { key: "bodyRegion", headerEn: "Region", headerAr: "المنطقة", render: (r) => r.bodyRegion ?? "—" },
                { key: "pain", headerEn: "Pain before→after", headerAr: "الألم قبل→بعد",
                  render: (r) => `${r.painBefore ?? "—"} → ${r.painAfter ?? "—"}` },
                { key: "feeEgp", headerEn: "Fee (EGP)", headerAr: "الرسوم (ج.م)", sortable: true, sortKey: "feeEgp",
                  render: (r) => (r.feeEgp ?? 0).toLocaleString(isAr ? "ar-EG" : "en-EG") },
                { key: "status", headerEn: "Status", headerAr: "الحالة", render: (r) => <Badge variant="outline">{r.status}</Badge> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <SectionCard>
            <MedicalListToolbar
              search={search} onSearchChange={setSearch}
              sortBy={sortBy} sortDir={sortDir}
              onSortByChange={setSortBy}
              onSortDirToggle={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              sortOptions={[
                { value: "assessmentDate", labelEn: "Date", labelAr: "التاريخ" },
                { value: "painScale", labelEn: "Pain scale", labelAr: "مقياس الألم" },
              ]}
              exportUrl={exportUrl}
            />
            <MedicalDataTable
              rows={assessmentsQ.data ?? []}
              isLoading={assessmentsQ.isLoading}
              sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}
              rowKey={(r) => r.id}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "assessmentDate", headerEn: "Date", headerAr: "التاريخ", sortable: true, sortKey: "assessmentDate", render: (r) => r.assessmentDate },
                { key: "bodyRegion", headerEn: "Region", headerAr: "المنطقة", render: (r) => r.bodyRegion ?? "—" },
                { key: "painScale", headerEn: "Pain (0-10)", headerAr: "الألم (0-10)", sortable: true, sortKey: "painScale", render: (r) => r.painScale ?? "—" },
                { key: "diagnosis", headerEn: "Diagnosis", headerAr: "التشخيص", render: (r) => r.diagnosis ?? "—" },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <SectionCard>
            <MedicalListToolbar
              search="" onSearchChange={() => {}}
              sortBy="createdAt" sortDir="desc"
              onSortByChange={() => {}}
              onSortDirToggle={() => {}}
              sortOptions={[{ value: "createdAt", labelEn: "Created", labelAr: "تاريخ الإنشاء" }]}
              exportUrl={exportUrl}
            />
            <MedicalDataTable
              rows={plansQ.data ?? []}
              isLoading={plansQ.isLoading}
              sortBy="title" sortDir="asc" onSort={() => {}}
              rowKey={(r) => r.id}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "title", headerEn: "Plan", headerAr: "الخطة", render: (r) => r.title },
                { key: "progress", headerEn: "Sessions", headerAr: "الجلسات", render: (r) => `${r.sessionsCompleted}/${r.sessionsPlanned}` },
                { key: "status", headerEn: "Status", headerAr: "الحالة", render: (r) => <Badge>{r.status}</Badge> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="exercises" className="mt-4">
          <SectionCard>
            <MedicalListToolbar
              search={search} onSearchChange={setSearch}
              sortBy="name" sortDir="asc"
              onSortByChange={() => {}}
              onSortDirToggle={() => {}}
              sortOptions={[{ value: "name", labelEn: "Name", labelAr: "الاسم" }]}
              exportUrl={exportUrl}
            />
            <MedicalDataTable
              rows={exercisesQ.data ?? []}
              isLoading={exercisesQ.isLoading}
              sortBy="name" sortDir="asc" onSort={() => {}}
              rowKey={(r) => r.id}
              columns={[
                { key: "name", headerEn: "Exercise", headerAr: "التمرين", render: (r) => isAr && r.nameAr ? r.nameAr : r.name },
                { key: "category", headerEn: "Category", headerAr: "الفئة", render: (r) => r.category ?? "—" },
                { key: "bodyRegion", headerEn: "Body region", headerAr: "منطقة الجسم", render: (r) => r.bodyRegion ?? "—" },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Record physio session", "تسجيل جلسة علاج طبيعي")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>{t("Patient", "المريض")}</Label>
              <Select value={sessionForm.patientId} onValueChange={(v) => setSessionForm((f) => ({ ...f, patientId: v }))}>
                <SelectTrigger><SelectValue placeholder={t("Select patient", "اختر المريض")} /></SelectTrigger>
                <SelectContent>
                  {(patients ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("Date & time", "التاريخ والوقت")}</Label>
              <Input type="datetime-local" value={sessionForm.sessionDate}
                onChange={(e) => setSessionForm((f) => ({ ...f, sessionDate: e.target.value }))} />
            </div>
            <div>
              <Label>{t("Body region", "منطقة الجسم")}</Label>
              <Select value={sessionForm.bodyRegion} onValueChange={(v) => setSessionForm((f) => ({ ...f, bodyRegion: v }))}>
                <SelectTrigger><SelectValue placeholder={t("Select region", "اختر المنطقة")} /></SelectTrigger>
                <SelectContent>
                  {BODY_REGIONS.map((r) => (
                    <SelectItem key={r.en} value={r.en}>{isAr ? r.ar : r.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Pain before (0-10)", "الألم قبل")}</Label>
                <Input type="number" min={0} max={10} value={sessionForm.painBefore}
                  onChange={(e) => setSessionForm((f) => ({ ...f, painBefore: e.target.value }))} /></div>
              <div><Label>{t("Pain after (0-10)", "الألم بعد")}</Label>
                <Input type="number" min={0} max={10} value={sessionForm.painAfter}
                  onChange={(e) => setSessionForm((f) => ({ ...f, painAfter: e.target.value }))} /></div>
            </div>
            <div>
              <Label>{t("Fee (EGP)", "الرسوم (ج.م)")}</Label>
              <Input type="number" value={sessionForm.feeEgp}
                onChange={(e) => setSessionForm((f) => ({ ...f, feeEgp: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createSession.mutate()} disabled={!sessionForm.patientId || createSession.isPending}>
              {t("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
