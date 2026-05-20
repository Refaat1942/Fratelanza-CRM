import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { useLangField } from "@/lib/lang-fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, ClipboardList, Activity, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { PageHeader } from "@/components/ui-ext/page-header";
import { SectionCard } from "@/components/ui-ext/section-card";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { KpiCard } from "@/components/ui-ext/kpi-card";

type Patient = { id: number; firstName: string; firstNameAr?: string | null; lastName?: string | null; lastNameAr?: string | null };
type Employee = { id: number; name: string; nameAr?: string | null };
type DentalProc = { id: number; name: string; nameAr?: string | null; price: number };

type DentalVisit = {
  id: number;
  patientId: number;
  doctorId: number | null;
  visitDate: string;
  toothNumber: number | null;
  procedureId: number | null;
  treatmentType: string | null;
  treatmentTypeAr: string | null;
  materialsUsed: string | null;
  materialsUsedAr: string | null;
  cost: number;
  notes: string | null;
  notesAr: string | null;
  followUpDate: string | null;
  patientName: string | null;
  patientNameAr: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
  procedureName: string | null;
  procedureNameAr: string | null;
};

const FDI = [
  11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,
  31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48,
];

const EMPTY = {
  patientId: 0, doctorId: null as number | null, visitDate: new Date().toISOString().slice(0, 16),
  toothNumber: null as number | null, procedureId: null as number | null,
  treatmentType: "", treatmentTypeAr: "", materialsUsed: "", materialsUsedAr: "",
  cost: 0, notes: "", notesAr: "", followUpDate: "",
};

export default function DentalVisits() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const lf = useLangField();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DentalVisit | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data: visits, isLoading } = useQuery<DentalVisit[]>({
    queryKey: ["dental-visits"],
    queryFn: () => apiFetch("/dental-visits"),
  });
  const { data: stats } = useQuery<{ count: number; revenue: number }>({
    queryKey: ["dental-visits/stats"],
    queryFn: () => apiFetch("/dental-visits/stats"),
  });
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/patients"),
  });
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });
  const { data: procs } = useQuery<DentalProc[]>({
    queryKey: ["dental-procedures"],
    queryFn: () => apiFetch("/dental-procedures"),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dental-visits"] });
    qc.invalidateQueries({ queryKey: ["dental-visits/stats"] });
  };

  const createMut = useMutation({
    mutationFn: (data: any) => apiFetch("/dental-visits", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setOpen(false); setForm({ ...EMPTY }); toast({ title: t("Visit added", "تمت إضافة الزيارة") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/dental-visits/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setEditing(null); setForm({ ...EMPTY }); toast({ title: t("Updated", "تم التحديث") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/dental-visits/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Deleted", "تم الحذف") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (v: DentalVisit) => {
    setEditing(v);
    setForm({
      patientId: v.patientId,
      doctorId: v.doctorId,
      visitDate: v.visitDate ? new Date(v.visitDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      toothNumber: v.toothNumber,
      procedureId: v.procedureId,
      treatmentType: v.treatmentType || "",
      treatmentTypeAr: v.treatmentTypeAr || "",
      materialsUsed: v.materialsUsed || "",
      materialsUsedAr: v.materialsUsedAr || "",
      cost: v.cost,
      notes: v.notes || "",
      notesAr: v.notesAr || "",
      followUpDate: v.followUpDate || "",
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) { toast({ title: t("Please pick a patient", "اختر المريض"), variant: "destructive" }); return; }
    // Strict per-language form. Always send active-language columns; OMIT the inactive ones
    // so PATCH preserves previously-saved opposite-language content.
    const data: any = {
      patientId: Number(form.patientId),
      doctorId: form.doctorId ? Number(form.doctorId) : null,
      visitDate: form.visitDate ? new Date(form.visitDate).toISOString() : new Date().toISOString(),
      toothNumber: form.toothNumber ? Number(form.toothNumber) : null,
      procedureId: form.procedureId ? Number(form.procedureId) : null,
      cost: Number(form.cost) || 0,
      followUpDate: form.followUpDate || null,
    };
    if (isAr) {
      data.treatmentTypeAr = form.treatmentTypeAr || null;
      data.materialsUsedAr = form.materialsUsedAr || null;
      data.notesAr = form.notesAr || null;
    } else {
      data.treatmentType = form.treatmentType || null;
      data.materialsUsed = form.materialsUsed || null;
      data.notes = form.notes || null;
    }
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const patientName = (p: Patient) =>
    isAr ? `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim()
         : `${p.firstName || p.firstNameAr} ${p.lastName || p.lastNameAr || ""}`.trim();

  // Auto-fill cost when a procedure is picked
  const onProcChange = (vId: string) => {
    const pid = vId ? parseInt(vId, 10) : null;
    const proc = procs?.find(p => p.id === pid);
    setForm({ ...form, procedureId: pid, cost: proc ? proc.price : form.cost });
  };

  const Form = (
    <form onSubmit={submit}>
      <div className="grid gap-3 py-3 max-h-[65vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Patient *", "المريض *")}</Label>
            <Select value={form.patientId ? String(form.patientId) : ""} onValueChange={v => setForm({ ...form, patientId: parseInt(v, 10) })}>
              <SelectTrigger><SelectValue placeholder={t("Pick patient", "اختر المريض")} /></SelectTrigger>
              <SelectContent>
                {patients?.map(p => <SelectItem key={p.id} value={String(p.id)}>{patientName(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Doctor", "الطبيب")}</Label>
            <Select value={form.doctorId ? String(form.doctorId) : ""} onValueChange={v => setForm({ ...form, doctorId: v ? parseInt(v, 10) : null })}>
              <SelectTrigger><SelectValue placeholder={t("Optional", "اختياري")} /></SelectTrigger>
              <SelectContent>
                {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{isAr ? (e.nameAr || e.name) : e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Date & Time", "التاريخ والوقت")}</Label>
            <Input type="datetime-local" dir="ltr" value={form.visitDate}
              onChange={e => setForm({ ...form, visitDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Tooth (FDI)", "السن (FDI)")}</Label>
            <Select value={form.toothNumber ? String(form.toothNumber) : ""}
              onValueChange={v => setForm({ ...form, toothNumber: v ? parseInt(v, 10) : null })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {FDI.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Follow-up", "متابعة")}</Label>
            <Input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Procedure", "الإجراء")}</Label>
            <Select value={form.procedureId ? String(form.procedureId) : ""} onValueChange={onProcChange}>
              <SelectTrigger><SelectValue placeholder={t("Pick from catalog", "اختر من القائمة")} /></SelectTrigger>
              <SelectContent>
                {procs?.map(p => <SelectItem key={p.id} value={String(p.id)}>
                  {isAr ? (p.nameAr || p.name) : p.name} — {p.price.toLocaleString()} {t("EGP", "ج.م")}
                </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Cost (EGP)", "التكلفة (ج.م)")}</Label>
            <Input dir="ltr" type="number" step="0.01" min={0} value={form.cost}
              onChange={e => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Treatment Description", "وصف العلاج")}</Label>
          <Input dir={lf.dir}
            value={isAr ? form.treatmentTypeAr : form.treatmentType}
            onChange={e => isAr
              ? setForm({ ...form, treatmentTypeAr: e.target.value })
              : setForm({ ...form, treatmentType: e.target.value })}
            placeholder={t("e.g. Composite filling on occlusal surface", "مثل: حشو تجميلي على السطح الطاحن")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Materials Used", "المواد المستخدمة")}</Label>
          <Input dir={lf.dir}
            value={isAr ? form.materialsUsedAr : form.materialsUsed}
            onChange={e => isAr
              ? setForm({ ...form, materialsUsedAr: e.target.value })
              : setForm({ ...form, materialsUsed: e.target.value })}
            placeholder={t("e.g. 3M Filtek Z350, anesthesia 1.8ml lidocaine", "مثل: حشو 3M، تخدير ليدوكايين 1.8مل")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Notes", "ملاحظات")}</Label>
          <Textarea rows={2} dir={lf.dir}
            value={isAr ? form.notesAr : form.notes}
            onChange={e => isAr
              ? setForm({ ...form, notesAr: e.target.value })
              : setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {editing ? t("Save Changes", "حفظ التغييرات") : t("Add Visit", "إضافة زيارة")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ClipboardList size={20} />}
        title={t("Dental Visits", "زيارات الأسنان")}
        description={t("Tooth-specific treatment log with materials and cost.", "سجل العلاجات لكل سن مع المواد والتكلفة.")}
        actions={
          <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setForm({ ...EMPTY }); }}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 h-9" data-testid="btn-add-dental-visit"><Plus size={15}/>{t("New Visit", "زيارة جديدة")}</Button>
            </DialogTrigger>
            <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
              <DialogHeader><DialogTitle>{t("Record Dental Visit", "تسجيل زيارة أسنان")}</DialogTitle></DialogHeader>
              {Form}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KpiCard label={t("Total Visits", "إجمالي الزيارات")} value={stats?.count ?? "—"} icon={<Activity size={18} />} tone="primary" />
        <KpiCard label={t("Total Revenue", "إجمالي الإيراد")} value={`${(stats?.revenue ?? 0).toLocaleString()} ${t("EGP", "ج.م")}`} icon={<DollarSign size={18} />} tone="success" />
      </div>

      <SectionCard title={t("All Dental Visits", "كل زيارات الأسنان")} noPadding>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !visits || visits.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={22} />}
            title={t("No dental visits yet", "لا توجد زيارات بعد")}
            description={t("Record a visit to start building treatment history per tooth.", "سجل زيارة لبدء تتبع تاريخ العلاج لكل سن.")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Date", "التاريخ")}</th>
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Patient", "المريض")}</th>
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Tooth", "السن")}</th>
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Treatment", "العلاج")}</th>
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Doctor", "الطبيب")}</th>
                  <th className={`text-${isRtl ? "left" : "right"} px-4 py-2.5`}>{t("Cost", "التكلفة")}</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visits.map((v, i) => (
                  <tr key={v.id} className={`hover:bg-accent/40 transition-colors ${i % 2 === 1 ? "bg-secondary/20" : ""}`} data-testid={`dental-visit-${v.id}`}>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{new Date(v.visitDate).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</td>
                    <td className="px-4 py-2.5 font-medium">{isAr ? (v.patientNameAr || v.patientName) : (v.patientName || v.patientNameAr) || "—"}</td>
                    <td className="px-4 py-2.5">
                      {v.toothNumber ? <Badge variant="outline" className="font-mono">#{v.toothNumber}</Badge> : "—"}
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <div className="truncate">
                        {isAr
                          ? (v.treatmentTypeAr || v.procedureNameAr || v.treatmentType || v.procedureName)
                          : (v.treatmentType || v.procedureName || v.treatmentTypeAr || v.procedureNameAr) || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{isAr ? (v.doctorNameAr || v.doctorName) : (v.doctorName || v.doctorNameAr) || "—"}</td>
                    <td className={`px-4 py-2.5 text-${isRtl ? "left" : "right"} font-semibold tabular-nums`}>{v.cost.toLocaleString()} <span className="text-xs text-muted-foreground">{t("EGP", "ج.م")}</span></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEdit(v)}><Edit2 size={13} /></Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                          onClick={() => confirmDelete({ title: t("Delete visit?", "حذف الزيارة؟"), onConfirm: async () => deleteMut.mutate(v.id) })}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={editing !== null} onOpenChange={o => { if (!o) { setEditing(null); setForm({ ...EMPTY }); } }}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader><DialogTitle>{t("Edit Dental Visit", "تعديل الزيارة")}</DialogTitle></DialogHeader>
          {Form}
        </DialogContent>
      </Dialog>
    </div>
  );
}
