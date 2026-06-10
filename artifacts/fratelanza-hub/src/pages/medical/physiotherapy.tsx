import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicalDataTable, MedicalListToolbar } from "@/components/medical/MedicalListToolbar";
import { Activity, ClipboardList, Dumbbell, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PatientSearchSelect } from "@/components/medical/PatientSearchSelect";
import { SearchableSelect } from "@/components/medical/SearchableSelect";
import { CatalogPickTextarea } from "@/components/medical/CatalogPickTextarea";
import { useEgyptMedicalCatalog } from "@/hooks/useEgyptMedicalCatalog";
import { appendCatalogLabel, toSearchableOptions } from "@/lib/catalogHelpers";
import { BranchSelect } from "@/components/BranchSelect";

type Patient = {
  id: number; firstName: string; lastName?: string | null;
  firstNameAr?: string | null; lastNameAr?: string | null;
};
type Employee = { id: number; name: string; nameAr?: string | null; role?: string | null };

type Assessment = {
  id: number; patientId: number; assessmentDate: string; therapistId?: number | null;
  bodyRegion?: string | null; painScale?: number | null; romNotes?: string | null;
  diagnosis?: string | null; goals?: string | null; contraindications?: string | null; notes?: string | null;
};
type Session = {
  id: number; patientId: number; planId?: number | null; therapistId?: number | null;
  sessionDate: string; sessionNumber?: number | null; bodyRegion?: string | null;
  painBefore?: number | null; painAfter?: number | null;
  modalities?: string | null; exercisesPerformed?: string | null; homeProgram?: string | null;
  status: string; feeEgp?: number | null; notes?: string | null;
};
type Plan = {
  id: number; patientId: number; assessmentId?: number | null; title: string; titleAr?: string | null;
  sessionsPlanned: number; sessionsCompleted: number; frequencyPerWeek?: number | null;
  startDate?: string | null; endDate?: string | null; status: string; notes?: string | null;
};
type Exercise = {
  id: number; name: string; nameAr?: string | null; category?: string | null;
  bodyRegion?: string | null; instructions?: string | null; durationMinutes?: number | null;
};

const BODY_REGIONS = [
  { en: "Cervical spine", ar: "العنق" },
  { en: "Lumbar spine", ar: "أسفل الظهر" },
  { en: "Thoracic spine", ar: "الظهر العلوي" },
  { en: "Shoulder", ar: "الكتف" },
  { en: "Knee", ar: "الركبة" },
  { en: "Hip", ar: "الورك" },
  { en: "Ankle", ar: "الكاحل" },
  { en: "Elbow", ar: "المرفق" },
  { en: "Wrist", ar: "المعصم" },
  { en: "General", ar: "عام" },
];

const EXERCISE_CATEGORIES = [
  { en: "Strengthening", ar: "تقوية", value: "strengthening" },
  { en: "Stretching", ar: "إطالة", value: "stretching" },
  { en: "Balance", ar: "توازن", value: "balance" },
  { en: "Mobility", ar: "حركة", value: "mobility" },
  { en: "Electrotherapy", ar: "علاج كهربائي", value: "electrotherapy" },
  { en: "Manual therapy", ar: "علاج يدوي", value: "manual" },
];

const SESSION_STATUSES = [
  { en: "Scheduled", ar: "مجدول", value: "scheduled" },
  { en: "Completed", ar: "مكتمل", value: "completed" },
  { en: "No show", ar: "لم يحضر", value: "no_show" },
  { en: "Cancelled", ar: "ملغي", value: "cancelled" },
];

const PLAN_STATUSES = [
  { en: "Active", ar: "نشط", value: "active" },
  { en: "Completed", ar: "مكتمل", value: "completed" },
  { en: "Paused", ar: "موقوف", value: "paused" },
  { en: "Cancelled", ar: "ملغي", value: "cancelled" },
];

const DEFAULT_SESSION = {
  patientId: "", planId: "", therapistId: "",
  sessionDate: new Date().toISOString().slice(0, 16),
  sessionNumber: "", bodyRegion: "", painBefore: "", painAfter: "",
  modalities: "", exercisesPerformed: "", homeProgram: "",
  status: "completed", feeEgp: "350", notes: "", branchId: null as number | null,
};

const DEFAULT_ASSESSMENT = {
  patientId: "", therapistId: "", assessmentDate: new Date().toISOString().slice(0, 10),
  bodyRegion: "", painScale: "", romNotes: "", diagnosis: "", goals: "",
  contraindications: "", notes: "", branchId: null as number | null,
};

const DEFAULT_PLAN = {
  patientId: "", assessmentId: "", therapistId: "", title: "", titleAr: "",
  sessionsPlanned: "10", frequencyPerWeek: "2",
  startDate: new Date().toISOString().slice(0, 10), endDate: "",
  status: "active", notes: "", branchId: null as number | null,
};

const DEFAULT_EXERCISE = {
  name: "", nameAr: "", category: "strengthening", bodyRegion: "",
  instructions: "", durationMinutes: "10",
};

export default function PhysiotherapyPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const { catalog } = useEgyptMedicalCatalog();

  const bodyRegionOptions = useMemo(() => toSearchableOptions(BODY_REGIONS), []);
  const modalityOptions = useMemo(() => toSearchableOptions(catalog?.physioModalities ?? []), [catalog?.physioModalities]);
  const diagnosisOptions = useMemo(() => toSearchableOptions(catalog?.diagnoses ?? []), [catalog?.diagnoses]);
  const categoryOptions = useMemo(() => toSearchableOptions(EXERCISE_CATEGORIES), []);
  const sessionStatusOptions = useMemo(() => toSearchableOptions(SESSION_STATUSES), []);
  const planStatusOptions = useMemo(() => toSearchableOptions(PLAN_STATUSES), []);

  const [tab, setTab] = useState("sessions");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sessionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("");

  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ ...DEFAULT_SESSION });
  const [assessOpen, setAssessOpen] = useState(false);
  const [assessForm, setAssessForm] = useState({ ...DEFAULT_ASSESSMENT });
  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ ...DEFAULT_PLAN });
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({ ...DEFAULT_EXERCISE });

  const { data: stats } = useQuery<{ assessments: number; sessions: number; activePlans: number }>({
    queryKey: ["physio-stats"],
    queryFn: () => apiFetch("/physio/stats"),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients-list-short"],
    queryFn: () => apiFetch("/patients"),
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });

  const therapistOptions = useMemo(
    () => (employees ?? []).map((e) => ({
      value: String(e.id),
      labelEn: `${e.name}${e.role ? ` · ${e.role}` : ""}`,
      labelAr: `${e.nameAr ?? e.name}${e.role ? ` · ${e.role}` : ""}`,
    })),
    [employees],
  );

  const sessionsQ = useQuery<Session[]>({
    queryKey: ["physio-sessions", sortBy, sortDir, statusFilter, search],
    queryFn: () => {
      const p = new URLSearchParams({ sortBy, sortDir });
      if (statusFilter) p.set("status", statusFilter);
      return apiFetch(`/physio-sessions?${p}`);
    },
    enabled: tab === "sessions",
  });

  const assessmentsQ = useQuery<Assessment[]>({
    queryKey: ["physio-assessments", sortBy, sortDir, search],
    queryFn: () => {
      const p = new URLSearchParams({ sortBy, sortDir });
      if (search) p.set("search", search);
      return apiFetch(`/physio-assessments?${p}`);
    },
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

  const { data: exerciseCatalog } = useQuery<Exercise[]>({
    queryKey: ["physio-exercises-all"],
    queryFn: () => apiFetch("/physio-exercises"),
  });

  const { data: patientPlans } = useQuery<Plan[]>({
    queryKey: ["physio-plans-patient", sessionForm.patientId],
    queryFn: () => apiFetch(`/physio-plans?patientId=${sessionForm.patientId}&status=active`),
    enabled: !!sessionForm.patientId,
  });

  const { data: patientAssessments } = useQuery<Assessment[]>({
    queryKey: ["physio-assessments-patient", planForm.patientId],
    queryFn: () => apiFetch(`/physio-assessments?patientId=${planForm.patientId}&sortBy=assessmentDate&sortDir=desc`),
    enabled: !!planForm.patientId,
  });

  const exercisePickOptions = useMemo(
    () => (exerciseCatalog ?? []).map((e) => ({
      value: e.name,
      labelEn: e.name,
      labelAr: e.nameAr ?? e.name,
      keywords: [e.category, e.bodyRegion].filter(Boolean).join(" "),
    })),
    [exerciseCatalog],
  );

  const planPickOptions = useMemo(
    () => (patientPlans ?? []).map((p) => ({
      value: String(p.id),
      labelEn: `${p.title} (${p.sessionsCompleted}/${p.sessionsPlanned})`,
      labelAr: `${p.titleAr ?? p.title} (${p.sessionsCompleted}/${p.sessionsPlanned})`,
    })),
    [patientPlans],
  );

  const assessmentPickOptions = useMemo(
    () => (patientAssessments ?? []).map((a) => ({
      value: String(a.id),
      labelEn: `${a.assessmentDate} — ${a.diagnosis ?? a.bodyRegion ?? "Assessment"}`,
      labelAr: `${a.assessmentDate} — ${a.diagnosis ?? a.bodyRegion ?? "تقييم"}`,
    })),
    [patientAssessments],
  );

  const patientName = (id: number) => {
    const p = patients?.find((x) => x.id === id);
    if (!p) return `#${id}`;
    if (isAr) return `${p.firstNameAr ?? p.firstName} ${p.lastNameAr ?? p.lastName ?? ""}`.trim();
    return `${p.firstName} ${p.lastName ?? ""}`.trim();
  };

  const createSession = useMutation({
    mutationFn: () => apiFetch("/physio-sessions", {
      method: "POST",
      body: JSON.stringify({
        patientId: Number(sessionForm.patientId),
        planId: sessionForm.planId ? Number(sessionForm.planId) : null,
        therapistId: sessionForm.therapistId ? Number(sessionForm.therapistId) : null,
        sessionDate: new Date(sessionForm.sessionDate).toISOString(),
        sessionNumber: sessionForm.sessionNumber ? Number(sessionForm.sessionNumber) : null,
        bodyRegion: sessionForm.bodyRegion || null,
        painBefore: sessionForm.painBefore !== "" ? Number(sessionForm.painBefore) : null,
        painAfter: sessionForm.painAfter !== "" ? Number(sessionForm.painAfter) : null,
        modalities: sessionForm.modalities || null,
        exercisesPerformed: sessionForm.exercisesPerformed || null,
        homeProgram: sessionForm.homeProgram || null,
        status: sessionForm.status,
        feeEgp: sessionForm.feeEgp ? Number(sessionForm.feeEgp) : 0,
        notes: sessionForm.notes || null,
        branchId: sessionForm.branchId,
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physio-sessions"] });
      qc.invalidateQueries({ queryKey: ["physio-stats"] });
      qc.invalidateQueries({ queryKey: ["physio-plans"] });
      setSessionOpen(false);
      setSessionForm({ ...DEFAULT_SESSION });
      toast({ title: t("Session recorded", "تم تسجيل الجلسة") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createAssessment = useMutation({
    mutationFn: () => apiFetch("/physio-assessments", {
      method: "POST",
      body: JSON.stringify({
        patientId: Number(assessForm.patientId),
        therapistId: assessForm.therapistId ? Number(assessForm.therapistId) : null,
        assessmentDate: assessForm.assessmentDate,
        bodyRegion: assessForm.bodyRegion || null,
        painScale: assessForm.painScale !== "" ? Number(assessForm.painScale) : null,
        romNotes: assessForm.romNotes || null,
        diagnosis: assessForm.diagnosis || null,
        goals: assessForm.goals || null,
        contraindications: assessForm.contraindications || null,
        notes: assessForm.notes || null,
        branchId: assessForm.branchId,
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physio-assessments"] });
      qc.invalidateQueries({ queryKey: ["physio-stats"] });
      setAssessOpen(false);
      setAssessForm({ ...DEFAULT_ASSESSMENT });
      toast({ title: t("Assessment saved", "تم حفظ التقييم") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createPlan = useMutation({
    mutationFn: () => apiFetch("/physio-plans", {
      method: "POST",
      body: JSON.stringify({
        patientId: Number(planForm.patientId),
        assessmentId: planForm.assessmentId ? Number(planForm.assessmentId) : null,
        therapistId: planForm.therapistId ? Number(planForm.therapistId) : null,
        title: planForm.title,
        titleAr: planForm.titleAr || null,
        sessionsPlanned: Number(planForm.sessionsPlanned) || 10,
        frequencyPerWeek: planForm.frequencyPerWeek ? Number(planForm.frequencyPerWeek) : 2,
        startDate: planForm.startDate || null,
        endDate: planForm.endDate || null,
        status: planForm.status,
        notes: planForm.notes || null,
        branchId: planForm.branchId,
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physio-plans"] });
      qc.invalidateQueries({ queryKey: ["physio-stats"] });
      setPlanOpen(false);
      setPlanForm({ ...DEFAULT_PLAN });
      toast({ title: t("Treatment plan created", "تم إنشاء خطة العلاج") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createExercise = useMutation({
    mutationFn: () => apiFetch("/physio-exercises", {
      method: "POST",
      body: JSON.stringify({
        name: exerciseForm.name,
        nameAr: exerciseForm.nameAr || null,
        category: exerciseForm.category || null,
        bodyRegion: exerciseForm.bodyRegion || null,
        instructions: exerciseForm.instructions || null,
        durationMinutes: exerciseForm.durationMinutes ? Number(exerciseForm.durationMinutes) : null,
        active: "true",
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physio-exercises"] });
      setExerciseOpen(false);
      setExerciseForm({ ...DEFAULT_EXERCISE });
      toast({ title: t("Exercise added to catalog", "تمت إضافة التمرين للكتالوج") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const exportUrl = tab === "sessions" ? "/api/physio-sessions/export.xlsx"
    : tab === "assessments" ? "/api/physio-assessments/export.xlsx"
    : tab === "plans" ? "/api/physio-plans/export.xlsx"
    : "/api/physio-exercises/export.xlsx";

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("desc"); }
  };

  const appendExercise = (name: string) => {
    const label = exercisePickOptions.find((o) => o.value === name);
    const text = isAr && label?.labelAr ? label.labelAr : (label?.labelEn ?? name);
    setSessionForm((f) => ({ ...f, exercisesPerformed: appendCatalogLabel(f.exercisesPerformed, text) }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Physiotherapy", "العلاج الطبيعي")}
        description={t(
          "Full clinic workflow: initial assessment → treatment plan → sessions with modalities & home program",
          "سير عمل كامل: تقييم أولي → خطة علاج → جلسات مع وسائل علاج وبرنامج منزلي",
        )}
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
              <Button onClick={() => { setSessionForm({ ...DEFAULT_SESSION }); setSessionOpen(true); }}>
                <Plus className="h-4 w-4 me-1" />{t("New session", "جلسة جديدة")}
              </Button>
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
                    {SESSION_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <MedicalDataTable
              rows={sessionsQ.data ?? []}
              isLoading={sessionsQ.isLoading}
              sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}
              rowKey={(r) => r.id}
              emptyMessage={{ en: "No sessions yet — record the first session", ar: "لا توجد جلسات — سجّل أول جلسة" }}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "sessionDate", headerEn: "Date", headerAr: "التاريخ", sortable: true, sortKey: "sessionDate",
                  render: (r) => new Date(r.sessionDate).toLocaleString(isAr ? "ar-EG" : "en-EG") },
                { key: "bodyRegion", headerEn: "Region", headerAr: "المنطقة", render: (r) => r.bodyRegion ?? "—" },
                { key: "modalities", headerEn: "Modalities", headerAr: "الوسائل", render: (r) => r.modalities ?? "—" },
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
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">{t("Initial assessments", "التقييمات الأولية")}</h3>
              <Button onClick={() => { setAssessForm({ ...DEFAULT_ASSESSMENT }); setAssessOpen(true); }}>
                <Plus className="h-4 w-4 me-1" />{t("New assessment", "تقييم جديد")}
              </Button>
            </div>
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
                { key: "goals", headerEn: "Goals", headerAr: "الأهداف", render: (r) => r.goals ?? "—" },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <SectionCard>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">{t("Treatment plans", "خطط العلاج")}</h3>
              <Button onClick={() => { setPlanForm({ ...DEFAULT_PLAN }); setPlanOpen(true); }}>
                <Plus className="h-4 w-4 me-1" />{t("New plan", "خطة جديدة")}
              </Button>
            </div>
            <MedicalListToolbar
              search="" onSearchChange={() => {}}
              sortBy="createdAt" sortDir="desc"
              onSortByChange={() => {}}
              onSortDirToggle={() => {}}
              sortOptions={[{ value: "createdAt", labelEn: "Created", labelAr: "تاريخ الإنشاء" }]}
              exportUrl={exportUrl}
              extraFilters={
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All", "الكل")}</SelectItem>
                    {PLAN_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <MedicalDataTable
              rows={plansQ.data ?? []}
              isLoading={plansQ.isLoading}
              sortBy="title" sortDir="asc" onSort={() => {}}
              rowKey={(r) => r.id}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "title", headerEn: "Plan", headerAr: "الخطة", render: (r) => isAr && r.titleAr ? r.titleAr : r.title },
                { key: "progress", headerEn: "Sessions", headerAr: "الجلسات", render: (r) => `${r.sessionsCompleted}/${r.sessionsPlanned}` },
                { key: "frequency", headerEn: "Per week", headerAr: "أسبوعياً", render: (r) => r.frequencyPerWeek ?? "—" },
                { key: "dates", headerEn: "Period", headerAr: "الفترة", render: (r) => `${r.startDate ?? "—"} → ${r.endDate ?? "—"}` },
                { key: "status", headerEn: "Status", headerAr: "الحالة", render: (r) => <Badge>{r.status}</Badge> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="exercises" className="mt-4">
          <SectionCard>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">{t("Exercise catalog", "كتالوج التمارين")}</h3>
              <Button onClick={() => { setExerciseForm({ ...DEFAULT_EXERCISE }); setExerciseOpen(true); }}>
                <Plus className="h-4 w-4 me-1" />{t("Add exercise", "إضافة تمرين")}
              </Button>
            </div>
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
                { key: "duration", headerEn: "Duration (min)", headerAr: "المدة (د)", render: (r) => r.durationMinutes ?? "—" },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Session dialog */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("Record physio session", "تسجيل جلسة علاج طبيعي")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{t("Patient", "المريض")} *</Label>
              <PatientSearchSelect value={sessionForm.patientId} onChange={(v) => setSessionForm((f) => ({ ...f, patientId: v, planId: "" }))} />
            </div>
            {sessionForm.patientId && planPickOptions.length > 0 && (
              <div><Label>{t("Treatment plan", "خطة العلاج")}</Label>
                <SearchableSelect options={planPickOptions} value={sessionForm.planId} onChange={(v) => setSessionForm((f) => ({ ...f, planId: v }))}
                  placeholder={{ en: "Link to active plan (optional)", ar: "ربط بخطة نشطة (اختياري)" }} allowClear />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Therapist", "المعالج")}</Label>
                <SearchableSelect options={therapistOptions} value={sessionForm.therapistId} onChange={(v) => setSessionForm((f) => ({ ...f, therapistId: v }))}
                  placeholder={{ en: "Search staff…", ar: "ابحث عن المعالج…" }} allowClear />
              </div>
              <div><Label>{t("Session #", "رقم الجلسة")}</Label>
                <Input type="number" min={1} value={sessionForm.sessionNumber} onChange={(e) => setSessionForm((f) => ({ ...f, sessionNumber: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Date & time", "التاريخ والوقت")} *</Label>
                <Input type="datetime-local" value={sessionForm.sessionDate} onChange={(e) => setSessionForm((f) => ({ ...f, sessionDate: e.target.value }))} />
              </div>
              <div><Label>{t("Status", "الحالة")}</Label>
                <SearchableSelect options={sessionStatusOptions} value={sessionForm.status} onChange={(v) => setSessionForm((f) => ({ ...f, status: v || "completed" }))} />
              </div>
            </div>
            <div><Label>{t("Body region", "منطقة الجسم")}</Label>
              <SearchableSelect options={bodyRegionOptions} value={sessionForm.bodyRegion} onChange={(v) => setSessionForm((f) => ({ ...f, bodyRegion: v }))}
                placeholder={{ en: "Search body region…", ar: "ابحث عن منطقة الجسم…" }} />
            </div>
            <div><Label>{t("Modalities (TENS, ultrasound…)", "وسائل العلاج (تنس، موجات فوق صوتية…)")}</Label>
              <CatalogPickTextarea value={sessionForm.modalities} onChange={(v) => setSessionForm((f) => ({ ...f, modalities: v }))} options={modalityOptions}
                placeholder={{ en: "e.g. TENS, hot pack, manual therapy", ar: "مثل: تنس، كمادات ساخنة، علاج يدوي" }} />
            </div>
            <div><Label>{t("Exercises performed", "التمارين المنفذة")}</Label>
              {exercisePickOptions.length > 0 && (
                <SearchableSelect options={exercisePickOptions} value="" onChange={appendExercise}
                  placeholder={{ en: "Pick from exercise catalog…", ar: "اختر من كتالوج التمارين…" }} />
              )}
              <Textarea className="mt-1.5" rows={2} value={sessionForm.exercisesPerformed}
                onChange={(e) => setSessionForm((f) => ({ ...f, exercisesPerformed: e.target.value }))}
                placeholder={t("Exercises done in clinic today", "التمارين التي نُفذت في العيادة اليوم")} />
            </div>
            <div><Label>{t("Home program", "البرنامج المنزلي")}</Label>
              <Textarea rows={2} value={sessionForm.homeProgram} onChange={(e) => setSessionForm((f) => ({ ...f, homeProgram: e.target.value }))}
                placeholder={t("Exercises for patient at home", "تمارين للمريض في المنزل")} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>{t("Pain before (0-10)", "الألم قبل")}</Label>
                <Input type="number" min={0} max={10} value={sessionForm.painBefore} onChange={(e) => setSessionForm((f) => ({ ...f, painBefore: e.target.value }))} /></div>
              <div><Label>{t("Pain after (0-10)", "الألم بعد")}</Label>
                <Input type="number" min={0} max={10} value={sessionForm.painAfter} onChange={(e) => setSessionForm((f) => ({ ...f, painAfter: e.target.value }))} /></div>
              <div><Label>{t("Fee (EGP)", "الرسوم (ج.م)")}</Label>
                <Input type="number" value={sessionForm.feeEgp} onChange={(e) => setSessionForm((f) => ({ ...f, feeEgp: e.target.value }))} /></div>
            </div>
            <div><Label>{t("Notes", "ملاحظات")}</Label>
              <Textarea rows={2} value={sessionForm.notes} onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <BranchSelect value={sessionForm.branchId} onChange={(id) => setSessionForm((f) => ({ ...f, branchId: id }))} />
          </div>
          <DialogFooter>
            <Button onClick={() => createSession.mutate()} disabled={!sessionForm.patientId || createSession.isPending}>
              {t("Save session", "حفظ الجلسة")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment dialog */}
      <Dialog open={assessOpen} onOpenChange={setAssessOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("Physio assessment", "تقييم علاج طبيعي")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{t("Patient", "المريض")} *</Label>
              <PatientSearchSelect value={assessForm.patientId} onChange={(v) => setAssessForm((f) => ({ ...f, patientId: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Assessment date", "تاريخ التقييم")} *</Label>
                <Input type="date" value={assessForm.assessmentDate} onChange={(e) => setAssessForm((f) => ({ ...f, assessmentDate: e.target.value }))} />
              </div>
              <div><Label>{t("Therapist", "المعالج")}</Label>
                <SearchableSelect options={therapistOptions} value={assessForm.therapistId} onChange={(v) => setAssessForm((f) => ({ ...f, therapistId: v }))} allowClear
                  placeholder={{ en: "Search staff…", ar: "ابحث عن المعالج…" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Body region", "منطقة الجسم")}</Label>
                <SearchableSelect options={bodyRegionOptions} value={assessForm.bodyRegion} onChange={(v) => setAssessForm((f) => ({ ...f, bodyRegion: v }))} allowClear />
              </div>
              <div><Label>{t("Pain scale (0-10)", "مقياس الألم (0-10)")}</Label>
                <Input type="number" min={0} max={10} value={assessForm.painScale} onChange={(e) => setAssessForm((f) => ({ ...f, painScale: e.target.value }))} />
              </div>
            </div>
            <div><Label>{t("ROM / mobility notes", "ملاحظات مدى الحركة")}</Label>
              <Textarea rows={2} value={assessForm.romNotes} onChange={(e) => setAssessForm((f) => ({ ...f, romNotes: e.target.value }))}
                placeholder={t("Range of motion, stiffness, swelling…", "مدى الحركة، تيبس، تورم…")} />
            </div>
            <div><Label>{t("Diagnosis / clinical impression", "التشخيص / الانطباع السريري")}</Label>
              <CatalogPickTextarea value={assessForm.diagnosis} onChange={(v) => setAssessForm((f) => ({ ...f, diagnosis: v }))} options={diagnosisOptions}
                placeholder={{ en: "e.g. Low back pain, knee OA", ar: "مثل: آلام أسفل الظهر، خشونة الركبة" }} />
            </div>
            <div><Label>{t("Treatment goals", "أهداف العلاج")}</Label>
              <Textarea rows={2} value={assessForm.goals} onChange={(e) => setAssessForm((f) => ({ ...f, goals: e.target.value }))}
                placeholder={t("Reduce pain, improve gait, return to work…", "تقليل الألم، تحسين المشي، العودة للعمل…")} />
            </div>
            <div><Label>{t("Contraindications", "موانع العلاج")}</Label>
              <Textarea rows={2} value={assessForm.contraindications} onChange={(e) => setAssessForm((f) => ({ ...f, contraindications: e.target.value }))} />
            </div>
            <div><Label>{t("Notes", "ملاحظات")}</Label>
              <Textarea rows={2} value={assessForm.notes} onChange={(e) => setAssessForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <BranchSelect value={assessForm.branchId} onChange={(id) => setAssessForm((f) => ({ ...f, branchId: id }))} />
          </div>
          <DialogFooter>
            <Button onClick={() => createAssessment.mutate()} disabled={!assessForm.patientId || createAssessment.isPending}>
              {t("Save assessment", "حفظ التقييم")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("Treatment plan", "خطة علاج")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{t("Patient", "المريض")} *</Label>
              <PatientSearchSelect value={planForm.patientId} onChange={(v) => setPlanForm((f) => ({ ...f, patientId: v, assessmentId: "" }))} />
            </div>
            {planForm.patientId && assessmentPickOptions.length > 0 && (
              <div><Label>{t("Based on assessment", "بناءً على تقييم")}</Label>
                <SearchableSelect options={assessmentPickOptions} value={planForm.assessmentId} onChange={(v) => setPlanForm((f) => ({ ...f, assessmentId: v }))} allowClear />
              </div>
            )}
            <div><Label>{t("Plan title", "عنوان الخطة")} *</Label>
              <Input value={planForm.title} onChange={(e) => setPlanForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t("e.g. Lumbar rehab — 10 sessions", "مثل: تأهيل قطني — 10 جلسات")} />
            </div>
            <div><Label>{t("Title (Arabic)", "العنوان (عربي)")}</Label>
              <Input dir="rtl" value={planForm.titleAr} onChange={(e) => setPlanForm((f) => ({ ...f, titleAr: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Sessions planned", "جلسات مخططة")}</Label>
                <Input type="number" min={1} value={planForm.sessionsPlanned} onChange={(e) => setPlanForm((f) => ({ ...f, sessionsPlanned: e.target.value }))} />
              </div>
              <div><Label>{t("Per week", "في الأسبوع")}</Label>
                <Input type="number" min={1} max={7} value={planForm.frequencyPerWeek} onChange={(e) => setPlanForm((f) => ({ ...f, frequencyPerWeek: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Start date", "تاريخ البداية")}</Label>
                <Input type="date" value={planForm.startDate} onChange={(e) => setPlanForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div><Label>{t("End date", "تاريخ النهاية")}</Label>
                <Input type="date" value={planForm.endDate} onChange={(e) => setPlanForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div><Label>{t("Therapist", "المعالج")}</Label>
              <SearchableSelect options={therapistOptions} value={planForm.therapistId} onChange={(v) => setPlanForm((f) => ({ ...f, therapistId: v }))} allowClear />
            </div>
            <div><Label>{t("Notes", "ملاحظات")}</Label>
              <Textarea rows={2} value={planForm.notes} onChange={(e) => setPlanForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <BranchSelect value={planForm.branchId} onChange={(id) => setPlanForm((f) => ({ ...f, branchId: id }))} />
          </div>
          <DialogFooter>
            <Button onClick={() => createPlan.mutate()} disabled={!planForm.patientId || !planForm.title || createPlan.isPending}>
              {t("Create plan", "إنشاء الخطة")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise dialog */}
      <Dialog open={exerciseOpen} onOpenChange={setExerciseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Add exercise to catalog", "إضافة تمرين للكتالوج")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{t("Name (English)", "الاسم (إنجليزي)")} *</Label>
              <Input value={exerciseForm.name} onChange={(e) => setExerciseForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div><Label>{t("Name (Arabic)", "الاسم (عربي)")}</Label>
              <Input dir="rtl" value={exerciseForm.nameAr} onChange={(e) => setExerciseForm((f) => ({ ...f, nameAr: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Category", "الفئة")}</Label>
                <SearchableSelect options={categoryOptions} value={exerciseForm.category} onChange={(v) => setExerciseForm((f) => ({ ...f, category: v }))} />
              </div>
              <div><Label>{t("Body region", "منطقة الجسم")}</Label>
                <SearchableSelect options={bodyRegionOptions} value={exerciseForm.bodyRegion} onChange={(v) => setExerciseForm((f) => ({ ...f, bodyRegion: v }))} allowClear />
              </div>
            </div>
            <div><Label>{t("Duration (minutes)", "المدة (دقائق)")}</Label>
              <Input type="number" min={1} value={exerciseForm.durationMinutes} onChange={(e) => setExerciseForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
            <div><Label>{t("Instructions", "التعليمات")}</Label>
              <Textarea rows={3} value={exerciseForm.instructions} onChange={(e) => setExerciseForm((f) => ({ ...f, instructions: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createExercise.mutate()} disabled={!exerciseForm.name || createExercise.isPending}>
              {t("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
