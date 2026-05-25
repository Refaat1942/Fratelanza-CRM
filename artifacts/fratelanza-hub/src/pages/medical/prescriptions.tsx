import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { Pill, Plus, Trash2, FileText, Calendar, Activity } from "lucide-react";

type Prescription = {
  id: number;
  visitId: number;
  medicineName: string;
  medicineNameAr: string | null;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
  instructionsAr: string | null;
  createdAt: string;
  patientId: number | null;
  visitDate: string | null;
  patientFirstName: string | null;
  patientFirstNameAr: string | null;
  patientLastName: string | null;
  patientLastNameAr: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
};

type Visit = { id: number; patientId: number; visitDate: string };
type Patient = { id: number; firstName: string; firstNameAr: string | null; lastName: string | null; lastNameAr: string | null };

export default function PrescriptionsPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{
    visitId: string; medicineName: string; medicineNameAr: string;
    dosage: string; frequency: string; durationDays: string;
    instructions: string; instructionsAr: string;
  }>({ visitId: "", medicineName: "", medicineNameAr: "", dosage: "", frequency: "", durationDays: "", instructions: "", instructionsAr: "" });

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ["prescriptions"],
    queryFn: () => apiFetch("/prescriptions"),
  });
  const { data: stats } = useQuery<{ total: number; last7: number; last30: number }>({
    queryKey: ["prescriptions-stats"],
    queryFn: () => apiFetch("/prescriptions-stats"),
  });
  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ["visits"],
    queryFn: () => apiFetch("/visits"),
  });
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/patients"),
  });

  const patientLabel = (p?: { firstName?: string | null; firstNameAr?: string | null; lastName?: string | null; lastNameAr?: string | null } | null) => {
    if (!p) return "—";
    if (isAr) return `${p.firstNameAr || p.firstName || ""} ${p.lastNameAr || p.lastName || ""}`.trim();
    return `${p.firstName || ""} ${p.lastName || ""}`.trim();
  };

  const createMutation = useMutation({
    mutationFn: (body: any) => apiFetch("/prescriptions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      qc.invalidateQueries({ queryKey: ["prescriptions-stats"] });
      setOpen(false);
      setForm({ visitId: "", medicineName: "", medicineNameAr: "", dosage: "", frequency: "", durationDays: "", instructions: "", instructionsAr: "" });
      toast({ title: t("Prescription added", "تم إضافة الوصفة") });
    },
    onError: (err: any) => toast({ title: err?.message || t("Failed", "فشل"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/prescriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      qc.invalidateQueries({ queryKey: ["prescriptions-stats"] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitId || !form.medicineName) return;
    const body: any = {
      visitId: Number(form.visitId),
      medicineName: form.medicineName.trim(),
    };
    if (form.medicineNameAr.trim()) body.medicineNameAr = form.medicineNameAr.trim();
    if (form.dosage.trim()) body.dosage = form.dosage.trim();
    if (form.frequency.trim()) body.frequency = form.frequency.trim();
    if (form.durationDays.trim()) body.durationDays = Number(form.durationDays);
    if (form.instructions.trim()) body.instructions = form.instructions.trim();
    if (form.instructionsAr.trim()) body.instructionsAr = form.instructionsAr.trim();
    createMutation.mutate(body);
  };

  const filtered = prescriptions.filter(p => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const name = (isAr ? (p.medicineNameAr || p.medicineName) : p.medicineName).toLowerCase();
    const pat = patientLabel(p as any).toLowerCase();
    return name.includes(s) || pat.includes(s);
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Pill size={20} />}
        title={t("Prescriptions", "الوصفات الطبية")}
        description={t("Medicines prescribed per visit", "الأدوية الموصوفة لكل زيارة")}
        actions={
          <Button onClick={() => setOpen(true)} data-testid="button-new-prescription">
            <Plus size={16} className="me-1.5" />
            {t("New Prescription", "وصفة جديدة")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard icon={<FileText size={18} />} tone="primary" label={t("Total", "الإجمالي")} value={stats?.total ?? 0} />
        <KpiCard icon={<Calendar size={18} />} tone="info" label={t("Last 7 days", "آخر ٧ أيام")} value={stats?.last7 ?? 0} />
        <KpiCard icon={<Activity size={18} />} tone="success" label={t("Last 30 days", "آخر ٣٠ يوم")} value={stats?.last30 ?? 0} />
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t("Search by medicine or patient name", "البحث باسم الدواء أو المريض")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("Loading…", "جاري التحميل…")}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Pill size={24} />}
          title={t("No prescriptions yet", "لا توجد وصفات بعد")}
          description={t("Create a prescription tied to a visit", "أنشئ وصفة مرتبطة بزيارة")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-md p-3.5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1.5">
                    <h3 className="font-semibold text-[15px]" data-testid={`text-medicine-${p.id}`}>
                      {isAr ? (p.medicineNameAr || p.medicineName) : p.medicineName}
                    </h3>
                    {p.dosage && <span className="text-xs text-muted-foreground">· {p.dosage}</span>}
                    {p.frequency && <span className="text-xs text-muted-foreground">· {p.frequency}</span>}
                    {p.durationDays != null && (
                      <span className="text-xs text-muted-foreground">· {p.durationDays} {t("days", "يوم")}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>
                      {t("Patient", "المريض")}: <span className="text-foreground">{patientLabel(p as any)}</span>
                      {(p.doctorName || p.doctorNameAr) && (
                        <span className="ms-3">
                          {t("Doctor", "الطبيب")}: <span className="text-foreground">{isAr ? (p.doctorNameAr || p.doctorName) : p.doctorName}</span>
                        </span>
                      )}
                    </div>
                    {p.visitDate && (
                      <div>
                        {t("Visit", "الزيارة")}: {new Date(p.visitDate).toLocaleDateString(isAr ? "ar-EG" : undefined)}
                      </div>
                    )}
                    {(p.instructions || p.instructionsAr) && (
                      <div className="text-foreground/80 mt-1.5 p-2 bg-muted/40 rounded text-xs">
                        {isAr ? (p.instructionsAr || p.instructions) : p.instructions}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => { if (confirm(t("Delete prescription?", "حذف الوصفة؟"))) deleteMutation.mutate(p.id); }}
                  data-testid={`button-delete-prescription-${p.id}`}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("New Prescription", "وصفة جديدة")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>{t("Visit", "الزيارة")}*</Label>
              <Select value={form.visitId} onValueChange={v => setForm({ ...form, visitId: v })}>
                <SelectTrigger><SelectValue placeholder={t("Pick a visit", "اختر زيارة")} /></SelectTrigger>
                <SelectContent>
                  {visits.length === 0 && (
                    <SelectItem value="_none" disabled>{t("No visits yet — create a visit first", "لا توجد زيارات — أنشئ زيارة أولاً")}</SelectItem>
                  )}
                  {visits.slice(0, 100).map(v => {
                    const pat = patients.find(p => p.id === v.patientId);
                    return (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {patientLabel(pat as any)} — {new Date(v.visitDate).toLocaleDateString(isAr ? "ar-EG" : undefined)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {isAr ? (
              <div className="space-y-1.5">
                <Label>{t("Medicine name (Arabic)", "اسم الدواء (عربي)")}*</Label>
                <Input value={form.medicineNameAr} onChange={e => setForm({ ...form, medicineNameAr: e.target.value, medicineName: e.target.value })} required />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t("Medicine name", "اسم الدواء")}*</Label>
                <Input value={form.medicineName} onChange={e => setForm({ ...form, medicineName: e.target.value })} required />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Dosage", "الجرعة")}</Label>
                <Input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder={t("500mg", "500 ملجم")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Frequency", "التكرار")}</Label>
                <Input value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} placeholder={t("3× daily", "٣ مرات يوميا")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Days", "الأيام")}</Label>
                <Input type="number" min={1} value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} placeholder="7" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("Instructions", "التعليمات")}</Label>
              <Input
                value={isAr ? form.instructionsAr : form.instructions}
                onChange={e => isAr ? setForm({ ...form, instructionsAr: e.target.value }) : setForm({ ...form, instructions: e.target.value })}
                placeholder={t("Take after meals", "بعد الأكل")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("Cancel", "إلغاء")}</Button>
              <Button type="submit" disabled={createMutation.isPending || !form.visitId}>
                {createMutation.isPending ? t("Saving…", "جاري الحفظ…") : t("Save", "حفظ")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
