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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicalDataTable, MedicalListToolbar } from "@/components/medical/MedicalListToolbar";
import { Apple, ClipboardList, Salad, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PatientSearchSelect } from "@/components/medical/PatientSearchSelect";
import { SearchableSelect } from "@/components/medical/SearchableSelect";
import { useEgyptMedicalCatalog } from "@/hooks/useEgyptMedicalCatalog";
import { toSearchableOptions } from "@/lib/catalogHelpers";

type Assessment = {
  id: number; patientId: number; assessmentDate: string;
  weightKg?: number | null; heightCm?: number | null; bmi?: number | null;
  activityLevel?: string | null; goals?: string | null;
};
type MealPlan = {
  id: number; patientId: number; title: string; dailyCaloriesTarget?: number | null; status: string;
};
type Consultation = {
  id: number; patientId: number; consultationDate: string;
  weightKg?: number | null; adherenceScore?: number | null; feeEgp?: number | null;
};
type Food = {
  id: number; name: string; nameAr?: string | null; category?: string | null;
  caloriesKcal?: number | null; servingSize?: string | null;
};

const FOOD_CATEGORIES = [
  { value: "egyptian_dishes", en: "Egyptian dishes", ar: "أطباق مصرية" },
  { value: "grains", en: "Grains & bread", ar: "حبوب وخبز" },
  { value: "proteins", en: "Proteins", ar: "بروتينات" },
  { value: "dairy", en: "Dairy", ar: "ألبان" },
  { value: "vegetables", en: "Vegetables", ar: "خضروات" },
  { value: "fruits", en: "Fruits", ar: "فواكه" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", en: "Sedentary", ar: "قليل الحركة" },
  { value: "light", en: "Light activity", ar: "نشاط خفيف" },
  { value: "moderate", en: "Moderate", ar: "متوسط" },
  { value: "active", en: "Active", ar: "نشط" },
  { value: "athlete", en: "Athlete", ar: "رياضي" },
];

export default function ClinicalNutritionPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const { catalog } = useEgyptMedicalCatalog();
  const activityOptions = useMemo(
    () => toSearchableOptions(catalog?.activityLevels ?? ACTIVITY_LEVELS),
    [catalog?.activityLevels],
  );
  const foodCategoryOptions = useMemo(
    () => toSearchableOptions(
      FOOD_CATEGORIES.map((c) => ({ en: c.en, ar: c.ar, value: c.value })),
    ),
    [],
  );

  const [tab, setTab] = useState("assessments");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("assessmentDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [assessOpen, setAssessOpen] = useState(false);
  const [assessForm, setAssessForm] = useState({
    patientId: "", assessmentDate: new Date().toISOString().slice(0, 10),
    weightKg: "", heightCm: "", activityLevel: "", goals: "",
  });

  const { data: stats } = useQuery<{ assessments: number; mealPlans: number; consultations: number }>({
    queryKey: ["nutrition-stats"],
    queryFn: () => apiFetch("/nutrition/stats"),
  });

  const { data: patients } = useQuery<{ id: number; firstName: string; lastName?: string | null }[]>({
    queryKey: ["patients-list-short"],
    queryFn: () => apiFetch("/patients"),
  });

  const assessmentsQ = useQuery<Assessment[]>({
    queryKey: ["nutrition-assessments", sortBy, sortDir],
    queryFn: () => apiFetch(`/nutrition-assessments?sortBy=${sortBy}&sortDir=${sortDir}`),
    enabled: tab === "assessments",
  });

  const mealPlansQ = useQuery<MealPlan[]>({
    queryKey: ["nutrition-meal-plans"],
    queryFn: () => apiFetch("/nutrition-meal-plans"),
    enabled: tab === "meal-plans",
  });

  const consultationsQ = useQuery<Consultation[]>({
    queryKey: ["nutrition-consultations", sortBy, sortDir],
    queryFn: () => apiFetch(`/nutrition-consultations?sortBy=${sortBy}&sortDir=${sortDir}`),
    enabled: tab === "consultations",
  });

  const foodQ = useQuery<Food[]>({
    queryKey: ["nutrition-food", search, categoryFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (categoryFilter) p.set("category", categoryFilter);
      return apiFetch(`/nutrition-food-catalog?${p}`);
    },
    enabled: tab === "food-catalog",
  });

  const createAssessment = useMutation({
    mutationFn: () => apiFetch("/nutrition-assessments", {
      method: "POST",
      body: JSON.stringify({
        patientId: Number(assessForm.patientId),
        assessmentDate: assessForm.assessmentDate,
        weightKg: assessForm.weightKg ? Number(assessForm.weightKg) : null,
        heightCm: assessForm.heightCm ? Number(assessForm.heightCm) : null,
        activityLevel: assessForm.activityLevel || null,
        goals: assessForm.goals || null,
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutrition-assessments"] });
      qc.invalidateQueries({ queryKey: ["nutrition-stats"] });
      setAssessOpen(false);
      toast({ title: t("Assessment saved", "تم حفظ التقييم") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const patientName = (id: number) => {
    const p = patients?.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName ?? ""}`.trim() : `#${id}`;
  };

  const exportUrl = tab === "assessments" ? "/api/nutrition-assessments/export.xlsx"
    : tab === "meal-plans" ? "/api/nutrition-meal-plans/export.xlsx"
    : tab === "consultations" ? "/api/nutrition-consultations/export.xlsx"
    : "/api/nutrition-food-catalog/export.xlsx";

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Clinical Nutrition", "التغذية العلاجية")}
        description={t("Nutrition assessments, Egyptian food catalog, meal plans & follow-ups", "تقييمات تغذية وكتالوج أطعمة مصرية وخطط غذائية ومتابعات")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<ClipboardList size={18} />} label={t("Assessments", "التقييمات")} value={stats?.assessments ?? 0} />
        <KpiCard icon={<Salad size={18} />} label={t("Active meal plans", "خطط غذائية نشطة")} value={stats?.mealPlans ?? 0} />
        <KpiCard icon={<Utensils size={18} />} label={t("Consultations", "الاستشارات")} value={stats?.consultations ?? 0} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="assessments">{t("Assessments", "التقييمات")}</TabsTrigger>
          <TabsTrigger value="meal-plans">{t("Meal plans", "الخطط الغذائية")}</TabsTrigger>
          <TabsTrigger value="consultations">{t("Consultations", "الاستشارات")}</TabsTrigger>
          <TabsTrigger value="food-catalog"><Apple className="h-4 w-4 me-1 inline" />{t("Food catalog", "كتالوج الأطعمة")}</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="mt-4">
          <SectionCard>
            <div className="flex justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">{t("Nutrition assessments", "تقييمات التغذية")}</h3>
              <Button onClick={() => setAssessOpen(true)}>{t("New assessment", "تقييم جديد")}</Button>
            </div>
            <MedicalListToolbar
              search={search} onSearchChange={setSearch}
              sortBy={sortBy} sortDir={sortDir}
              onSortByChange={setSortBy}
              onSortDirToggle={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              sortOptions={[
                { value: "assessmentDate", labelEn: "Date", labelAr: "التاريخ" },
                { value: "bmi", labelEn: "BMI", labelAr: "مؤشر الكتلة" },
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
                { key: "weightKg", headerEn: "Weight (kg)", headerAr: "الوزن (كجم)", render: (r) => r.weightKg ?? "—" },
                { key: "bmi", headerEn: "BMI", headerAr: "مؤشر الكتلة", sortable: true, sortKey: "bmi", render: (r) => r.bmi ?? "—" },
                { key: "activityLevel", headerEn: "Activity", headerAr: "النشاط", render: (r) => r.activityLevel ?? "—" },
                { key: "goals", headerEn: "Goals", headerAr: "الأهداف", render: (r) => r.goals ?? "—" },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="meal-plans" className="mt-4">
          <SectionCard>
            <MedicalListToolbar
              search="" onSearchChange={() => {}}
              sortBy="title" sortDir="asc"
              onSortByChange={() => {}}
              onSortDirToggle={() => {}}
              sortOptions={[{ value: "title", labelEn: "Title", labelAr: "العنوان" }]}
              exportUrl={exportUrl}
            />
            <MedicalDataTable
              rows={mealPlansQ.data ?? []}
              isLoading={mealPlansQ.isLoading}
              sortBy="title" sortDir="asc" onSort={() => {}}
              rowKey={(r) => r.id}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "title", headerEn: "Plan", headerAr: "الخطة", render: (r) => r.title },
                { key: "calories", headerEn: "Cal/day", headerAr: "سعرات/يوم", render: (r) => r.dailyCaloriesTarget ?? "—" },
                { key: "status", headerEn: "Status", headerAr: "الحالة", render: (r) => <Badge>{r.status}</Badge> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="consultations" className="mt-4">
          <SectionCard>
            <MedicalListToolbar
              search="" onSearchChange={() => {}}
              sortBy={sortBy} sortDir={sortDir}
              onSortByChange={setSortBy}
              onSortDirToggle={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              sortOptions={[
                { value: "consultationDate", labelEn: "Date", labelAr: "التاريخ" },
                { value: "adherenceScore", labelEn: "Adherence", labelAr: "الالتزام" },
              ]}
              exportUrl={exportUrl}
            />
            <MedicalDataTable
              rows={consultationsQ.data ?? []}
              isLoading={consultationsQ.isLoading}
              sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}
              rowKey={(r) => r.id}
              columns={[
                { key: "patient", headerEn: "Patient", headerAr: "المريض", render: (r) => patientName(r.patientId) },
                { key: "consultationDate", headerEn: "Date", headerAr: "التاريخ", sortable: true, sortKey: "consultationDate",
                  render: (r) => new Date(r.consultationDate).toLocaleString(isAr ? "ar-EG" : "en-EG") },
                { key: "weightKg", headerEn: "Weight", headerAr: "الوزن", render: (r) => r.weightKg ?? "—" },
                { key: "adherenceScore", headerEn: "Adherence (1-10)", headerAr: "الالتزام", sortable: true, sortKey: "adherenceScore", render: (r) => r.adherenceScore ?? "—" },
                { key: "feeEgp", headerEn: "Fee (EGP)", headerAr: "الرسوم", render: (r) => (r.feeEgp ?? 0).toLocaleString(isAr ? "ar-EG" : "en-EG") },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="food-catalog" className="mt-4">
          <SectionCard>
            <MedicalListToolbar
              search={search} onSearchChange={setSearch}
              sortBy="name" sortDir="asc"
              onSortByChange={() => {}}
              onSortDirToggle={() => {}}
              sortOptions={[{ value: "name", labelEn: "Name", labelAr: "الاسم" }]}
              exportUrl={exportUrl}
              extraFilters={
                <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder={t("Category", "الفئة")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All categories", "كل الفئات")}</SelectItem>
                    {FOOD_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <MedicalDataTable
              rows={foodQ.data ?? []}
              isLoading={foodQ.isLoading}
              sortBy="name" sortDir="asc" onSort={() => {}}
              rowKey={(r) => r.id}
              columns={[
                { key: "name", headerEn: "Food", headerAr: "الطعام", render: (r) => isAr && r.nameAr ? r.nameAr : r.name },
                { key: "category", headerEn: "Category", headerAr: "الفئة", render: (r) => r.category ?? "—" },
                { key: "servingSize", headerEn: "Serving", headerAr: "الحصة", render: (r) => r.servingSize ?? "—" },
                { key: "caloriesKcal", headerEn: "Calories", headerAr: "السعرات", render: (r) => r.caloriesKcal ?? "—" },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={assessOpen} onOpenChange={setAssessOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Nutrition assessment", "تقييم تغذية")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>{t("Patient", "المريض")}</Label>
              <PatientSearchSelect
                value={assessForm.patientId}
                onChange={(v) => setAssessForm((f) => ({ ...f, patientId: v }))}
              />
            </div>
            <div>
              <Label>{t("Date", "التاريخ")}</Label>
              <Input type="date" value={assessForm.assessmentDate}
                onChange={(e) => setAssessForm((f) => ({ ...f, assessmentDate: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>{t("Weight (kg)", "الوزن (كجم)")}</Label>
                <Input type="number" value={assessForm.weightKg}
                  onChange={(e) => setAssessForm((f) => ({ ...f, weightKg: e.target.value }))} /></div>
              <div><Label>{t("Height (cm)", "الطول (سم)")}</Label>
                <Input type="number" value={assessForm.heightCm}
                  onChange={(e) => setAssessForm((f) => ({ ...f, heightCm: e.target.value }))} /></div>
            </div>
            <div>
              <Label>{t("Activity level", "مستوى النشاط")}</Label>
              <SearchableSelect
                options={activityOptions}
                value={assessForm.activityLevel}
                onChange={(v) => setAssessForm((f) => ({ ...f, activityLevel: v }))}
                placeholder={{ en: "Search activity level…", ar: "ابحث عن مستوى النشاط…" }}
              />
            </div>
            <div>
              <Label>{t("Goals", "الأهداف")}</Label>
              <Input value={assessForm.goals} onChange={(e) => setAssessForm((f) => ({ ...f, goals: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createAssessment.mutate()} disabled={!assessForm.patientId || createAssessment.isPending}>
              {t("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
