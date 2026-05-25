import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, User, Stethoscope, Calendar, Trash2, Edit, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { BranchSelect } from "@/components/BranchSelect";
import { BranchBadge } from "@/components/BranchBadge";

type Patient = { id: number; firstName: string; firstNameAr?: string | null; lastName?: string | null; lastNameAr?: string | null };
type Employee = { id: number; name: string; nameAr?: string | null; role?: string | null };

type Visit = {
  id: number;
  patientId: number;
  appointmentId: number | null;
  doctorId: number | null;
  visitDate: string;
  chiefComplaint: string | null;
  chiefComplaintAr: string | null;
  diagnosis: string | null;
  diagnosisAr: string | null;
  treatment: string | null;
  treatmentAr: string | null;
  materialsUsed: string | null;
  materialsUsedAr: string | null;
  toothNumber: string | null;
  followUpDate: string | null;
  notes: string | null;
  patientFirstName: string | null;
  patientFirstNameAr: string | null;
  patientLastName: string | null;
  patientLastNameAr: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
};

type Stats = { today: number; week: number; upcomingFollowUps: number };

const EMPTY = {
  patientId: "",
  doctorId: "",
  visitDate: new Date().toISOString().slice(0, 16),
  chiefComplaint: "",
  chiefComplaintAr: "",
  diagnosis: "",
  diagnosisAr: "",
  treatment: "",
  treatmentAr: "",
  materialsUsed: "",
  materialsUsedAr: "",
  toothNumber: "",
  followUpDate: "",
  notes: "",
  branchId: null as number | null,
};

function parseQuery(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export default function Visits() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  const [, navigate] = useLocation();

  const initialPatient = parseQuery().get("patient") || "all";
  const [patientFilter, setPatientFilter] = useState<string>(initialPatient);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/patients"),
  });
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });
  const { data: stats } = useQuery<Stats>({
    queryKey: ["visits-stats"],
    queryFn: () => apiFetch("/visits/stats"),
  });

  const listUrl = patientFilter === "all" ? "/visits" : `/visits?patientId=${patientFilter}`;
  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ["visits", patientFilter],
    queryFn: () => apiFetch(listUrl),
  });

  // Sync URL when filter changes
  useEffect(() => {
    const url = patientFilter === "all" ? "/medical/visits" : `/medical/visits?patient=${patientFilter}`;
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState({}, "", url);
    }
  }, [patientFilter]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["visits"] });
    qc.invalidateQueries({ queryKey: ["visits-stats"] });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      patientId: patientFilter !== "all" ? patientFilter : "",
      visitDate: new Date().toISOString().slice(0, 16),
    });
    setOpen(true);
  };

  const openEdit = (v: Visit) => {
    setEditing(v);
    setForm({
      patientId: String(v.patientId),
      doctorId: v.doctorId ? String(v.doctorId) : "",
      visitDate: new Date(v.visitDate).toISOString().slice(0, 16),
      chiefComplaint: v.chiefComplaint || "",
      chiefComplaintAr: v.chiefComplaintAr || "",
      diagnosis: v.diagnosis || "",
      diagnosisAr: v.diagnosisAr || "",
      treatment: v.treatment || "",
      treatmentAr: v.treatmentAr || "",
      materialsUsed: v.materialsUsed || "",
      materialsUsedAr: v.materialsUsedAr || "",
      toothNumber: v.toothNumber || "",
      followUpDate: v.followUpDate || "",
      notes: v.notes || "",
      branchId: (v as any).branchId ?? null,
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        patientId: Number(form.patientId),
        doctorId: form.doctorId ? Number(form.doctorId) : null,
        visitDate: new Date(form.visitDate).toISOString(),
        chiefComplaint: form.chiefComplaint || null,
        chiefComplaintAr: form.chiefComplaintAr || null,
        diagnosis: form.diagnosis || null,
        diagnosisAr: form.diagnosisAr || null,
        treatment: form.treatment || null,
        treatmentAr: form.treatmentAr || null,
        materialsUsed: form.materialsUsed || null,
        materialsUsedAr: form.materialsUsedAr || null,
        toothNumber: form.toothNumber || null,
        followUpDate: form.followUpDate || null,
        notes: form.notes || null,
        branchId: form.branchId,
      };
      if (editing) {
        return apiFetch<Visit>(`/visits/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      return apiFetch<Visit>("/visits", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast({ title: editing ? t("Visit updated", "تم تحديث الزيارة") : t("Visit recorded", "تم تسجيل الزيارة") });
    },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/visits/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Visit deleted", "تم حذف الزيارة") }); },
  });

  const patientLabel = (p: Patient) =>
    isAr ? `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim()
         : `${p.firstName} ${p.lastName || ""}`.trim();
  const employeeLabel = (e: Employee) => isAr ? (e.nameAr || e.name) : e.name;

  const visitPatientName = (v: Visit) =>
    isAr ? `${v.patientFirstNameAr || v.patientFirstName || ""} ${v.patientLastNameAr || v.patientLastName || ""}`.trim() || "—"
         : `${v.patientFirstName || ""} ${v.patientLastName || ""}`.trim() || "—";
  const visitDoctorName = (v: Visit) =>
    v.doctorId ? (isAr ? (v.doctorNameAr || v.doctorName) : v.doctorName) : null;

  const dateLocale = isAr ? "ar-EG" : "en-US";

  const filteredPatient = useMemo(
    () => patientFilter === "all" ? null : (patients || []).find(p => String(p.id) === patientFilter),
    [patientFilter, patients]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Visits", "الزيارات")}</h2>
          <p className="text-muted-foreground">
            {filteredPatient
              ? t(`Visit history for ${patientLabel(filteredPatient)}`, `سجل الزيارات لـ ${patientLabel(filteredPatient)}`)
              : t("Consultation notes — chief complaint, diagnosis, treatment", "ملاحظات الاستشارة — الشكوى الرئيسية، التشخيص، العلاج")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="btn-create-visit">
          <Plus size={16} />{t("Record Visit", "تسجيل زيارة")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{t("Today", "اليوم")}</p>
          <p className="text-2xl font-bold mt-1">{stats?.today ?? "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{t("Last 7 days", "آخر 7 أيام")}</p>
          <p className="text-2xl font-bold mt-1">{stats?.week ?? "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{t("Upcoming follow-ups", "متابعات قادمة")}</p>
          <p className="text-2xl font-bold mt-1">{stats?.upcomingFollowUps ?? "—"}</p>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-3 flex flex-wrap items-center gap-2">
        <Label className="text-sm shrink-0">{t("Filter by patient:", "تصفية بالمريض:")}</Label>
        <Select value={patientFilter} onValueChange={setPatientFilter}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All patients", "كل المرضى")}</SelectItem>
            {(patients || []).map(p => <SelectItem key={p.id} value={String(p.id)}>{patientLabel(p)}</SelectItem>)}
          </SelectContent>
        </Select>
        {patientFilter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setPatientFilter("all")}>{t("Clear", "مسح")}</Button>
        )}
      </CardContent></Card>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : !visits || visits.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t("No visits yet.", "لا توجد زيارات بعد.")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(v => {
            const cc = isAr ? (v.chiefComplaintAr || v.chiefComplaint) : (v.chiefComplaint || v.chiefComplaintAr);
            const dx = isAr ? (v.diagnosisAr || v.diagnosis) : (v.diagnosis || v.diagnosisAr);
            const tx = isAr ? (v.treatmentAr || v.treatment) : (v.treatment || v.treatmentAr);
            const dr = visitDoctorName(v);
            return (
              <Card key={v.id} data-testid={`visit-${v.id}`} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <div>
                        <button
                          onClick={() => setPatientFilter(String(v.patientId))}
                          className="font-semibold hover:underline text-left flex items-center gap-1"
                        >
                          <User size={12} className="text-muted-foreground" />
                          {visitPatientName(v)}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.visitDate).toLocaleString(dateLocale, { dateStyle: "medium", timeStyle: "short" })}
                          {dr && <> · <Stethoscope size={11} className="inline" /> {dr}</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BranchBadge branchId={(v as any).branchId} />
                      {v.followUpDate && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400">
                          <Calendar size={11} className={isRtl ? "ml-1" : "mr-1"} />
                          {t("Follow-up:", "متابعة:")} {new Date(v.followUpDate).toLocaleDateString(dateLocale)}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)} data-testid={`btn-edit-visit-${v.id}`}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => confirmDelete({
                          title: t("Delete visit?", "حذف الزيارة؟"),
                          onConfirm: async () => deleteMut.mutate(v.id),
                        })}
                        data-testid={`btn-delete-visit-${v.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Chief complaint", "الشكوى الرئيسية")}</p>
                      <p>{cc || <span className="text-muted-foreground/50">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Diagnosis", "التشخيص")}</p>
                      <p>{dx || <span className="text-muted-foreground/50">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Treatment", "العلاج")}</p>
                      <p>{tx || <span className="text-muted-foreground/50">—</span>}</p>
                    </div>
                  </div>
                  {(v.materialsUsed || v.materialsUsedAr || v.toothNumber) && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Materials used", "المواد المستخدمة")}</p>
                        <p>{(isAr ? (v.materialsUsedAr || v.materialsUsed) : (v.materialsUsed || v.materialsUsedAr)) || <span className="text-muted-foreground/50">—</span>}</p>
                      </div>
                      {v.toothNumber && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Tooth #", "رقم السن")}</p>
                          <p dir="ltr">{v.toothNumber}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {v.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Notes", "ملاحظات")}</p>
                      <p className="text-sm whitespace-pre-wrap">{v.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }}>
            <DialogHeader>
              <DialogTitle>{editing ? t("Edit Visit", "تعديل الزيارة") : t("Record Visit", "تسجيل زيارة")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("Patient *", "المريض *")}</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })} required>
                    <SelectTrigger><SelectValue placeholder={t("Select patient", "اختر مريض")} /></SelectTrigger>
                    <SelectContent>
                      {(patients || []).map(p => <SelectItem key={p.id} value={String(p.id)}>{patientLabel(p)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Doctor", "الطبيب")}</Label>
                  <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                    <SelectTrigger><SelectValue placeholder={t("Optional", "اختياري")} /></SelectTrigger>
                    <SelectContent>
                      {(employees || []).map(e => <SelectItem key={e.id} value={String(e.id)}>{employeeLabel(e)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("Visit date & time *", "تاريخ ووقت الزيارة *")}</Label>
                  <Input type="datetime-local" required value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Follow-up date", "تاريخ المتابعة")}</Label>
                  <Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("Chief complaint", "الشكوى الرئيسية")}</Label>
                <Textarea rows={2} dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? form.chiefComplaintAr : form.chiefComplaint}
                  onChange={(e) => isAr ? setForm({ ...form, chiefComplaintAr: e.target.value }) : setForm({ ...form, chiefComplaint: e.target.value })}
                  placeholder={t("What is the patient reporting?", "ما الذي يشتكي منه المريض؟")} />
              </div>

              <div className="space-y-2">
                <Label>{t("Diagnosis", "التشخيص")}</Label>
                <Textarea rows={2} dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? form.diagnosisAr : form.diagnosis}
                  onChange={(e) => isAr ? setForm({ ...form, diagnosisAr: e.target.value }) : setForm({ ...form, diagnosis: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{t("Treatment / Plan", "العلاج / الخطة")}</Label>
                <Textarea rows={3} dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? form.treatmentAr : form.treatment}
                  onChange={(e) => isAr ? setForm({ ...form, treatmentAr: e.target.value }) : setForm({ ...form, treatment: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>{t("Materials used", "المواد المستخدمة")}</Label>
                  <Textarea rows={2} dir={isAr ? "rtl" : "ltr"}
                    value={isAr ? form.materialsUsedAr : form.materialsUsed}
                    onChange={(e) => isAr ? setForm({ ...form, materialsUsedAr: e.target.value }) : setForm({ ...form, materialsUsed: e.target.value })}
                    placeholder={t("e.g. composite filling, anesthetic, etc.", "مثلاً: حشو كومبوزيت، مخدر، إلخ.")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Tooth # (optional)", "رقم السن (اختياري)")}</Label>
                  <Input dir="ltr" value={form.toothNumber}
                    onChange={(e) => setForm({ ...form, toothNumber: e.target.value })}
                    placeholder="e.g. 11, 24" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("Internal notes", "ملاحظات داخلية")}</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <BranchSelect value={form.branchId} onChange={(id) => setForm({ ...form, branchId: id })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMut.isPending || !form.patientId}>
                {editing ? t("Save changes", "حفظ التغييرات") : t("Record", "تسجيل")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
