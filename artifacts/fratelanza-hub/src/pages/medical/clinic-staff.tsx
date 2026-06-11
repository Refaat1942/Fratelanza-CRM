import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui-ext/page-header";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { Stethoscope, Plus, Edit2, Trash2, Phone, Mail, IdCard, Upload, Image as ImageIcon } from "lucide-react";

type Staff = {
  id: number;
  name: string | null;
  nameAr: string | null;
  role: string;
  specialty: string | null;
  specialtyAr: string | null;
  licenseNumber: string | null;
  phone: string | null;
  email: string | null;
  prescriptionTemplateUrl: string | null;
  prescriptionHeader: string | null;
  prescriptionHeaderAr: string | null;
  prescriptionFooter: string | null;
  prescriptionFooterAr: string | null;
  notes: string | null;
  active: boolean;
};

const ROLES = [
  { value: "doctor",       en: "Doctor",       ar: "طبيب" },
  { value: "nurse",        en: "Nurse",        ar: "ممرض/ممرضة" },
  { value: "assistant",    en: "Assistant",    ar: "مساعد" },
  { value: "receptionist", en: "Receptionist", ar: "موظف استقبال" },
  { value: "technician",   en: "Technician",   ar: "فني" },
  { value: "other",        en: "Other",        ar: "أخرى" },
];

const ROLE_TONE: Record<string, string> = {
  doctor:       "bg-blue-100 text-blue-800",
  nurse:        "bg-emerald-100 text-emerald-800",
  assistant:    "bg-amber-100 text-amber-800",
  receptionist: "bg-purple-100 text-purple-800",
  technician:   "bg-slate-100 text-slate-800",
  other:        "bg-slate-100 text-slate-700",
};

const blank = () => ({
  name: "", nameAr: "", role: "doctor",
  specialty: "", specialtyAr: "",
  licenseNumber: "", phone: "", email: "", notes: "",
  prescriptionTemplateUrl: "", prescriptionHeader: "", prescriptionHeaderAr: "",
  prescriptionFooter: "", prescriptionFooterAr: "",
  active: true,
});

export default function ClinicStaffPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState(blank());
  const [filter, setFilter] = useState<string>("all");

  const { data: staff = [], isLoading } = useQuery<Staff[]>({
    queryKey: ["clinic-staff"],
    queryFn: () => apiFetch("/clinic-staff"),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) =>
      editing
        ? apiFetch(`/clinic-staff/${editing.id}`, { method: "PUT", body: JSON.stringify(body) })
        : apiFetch("/clinic-staff", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-staff"] });
      setOpen(false); setEditing(null); setForm(blank());
      toast({ title: editing ? t("Updated", "تم التحديث") : t("Added", "تم الإضافة") });
    },
    onError: (e: any) => toast({ title: e?.message || t("Failed", "فشل"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/clinic-staff/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-staff"] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const uploadTemplate = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData();
      fd.append("template", file);
      const res = await fetch(`/api/clinic-staff/${id}/prescription-template`, { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({} as any)))?.error || "upload_failed");
      return res.json();
    },
    onSuccess: (row: Staff) => {
      qc.invalidateQueries({ queryKey: ["clinic-staff"] });
      setEditing(row);
      setForm(prev => ({ ...prev, prescriptionTemplateUrl: row.prescriptionTemplateUrl || "" }));
      toast({ title: t("Prescription shape uploaded", "تم رفع شكل الوصفة") });
    },
    onError: (e: any) => toast({ title: e?.message || t("Upload failed", "فشل الرفع"), variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setForm(blank()); setOpen(true); };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name ?? "", nameAr: s.nameAr ?? "", role: s.role,
      specialty: s.specialty ?? "", specialtyAr: s.specialtyAr ?? "",
      licenseNumber: s.licenseNumber ?? "", phone: s.phone ?? "", email: s.email ?? "",
      prescriptionTemplateUrl: s.prescriptionTemplateUrl ?? "",
      prescriptionHeader: s.prescriptionHeader ?? "",
      prescriptionHeaderAr: s.prescriptionHeaderAr ?? "",
      prescriptionFooter: s.prescriptionFooter ?? "",
      prescriptionFooterAr: s.prescriptionFooterAr ?? "",
      notes: s.notes ?? "", active: s.active,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() && !form.nameAr.trim()) {
      toast({ title: t("Name is required", "الاسم مطلوب"), variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      name: form.name.trim() || null,
      nameAr: form.nameAr.trim() || null,
      role: form.role,
      specialty: form.specialty.trim() || null,
      specialtyAr: form.specialtyAr.trim() || null,
      licenseNumber: form.licenseNumber.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      prescriptionTemplateUrl: form.prescriptionTemplateUrl.trim() || null,
      prescriptionHeader: form.prescriptionHeader.trim() || null,
      prescriptionHeaderAr: form.prescriptionHeaderAr.trim() || null,
      prescriptionFooter: form.prescriptionFooter.trim() || null,
      prescriptionFooterAr: form.prescriptionFooterAr.trim() || null,
      notes: form.notes.trim() || null,
      active: form.active,
    });
  };

  const filtered = staff.filter(s => filter === "all" || s.role === filter);
  const counts = ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r.value] = staff.filter(s => s.role === r.value).length;
    return acc;
  }, {});

  const roleLabel = (role: string) => {
    const r = ROLES.find(x => x.value === role);
    return isAr ? (r?.ar ?? role) : (r?.en ?? role);
  };
  const displayName = (s: Staff) => isAr ? (s.nameAr || s.name || "—") : (s.name || s.nameAr || "—");
  const displaySpecialty = (s: Staff) => isAr ? (s.specialtyAr || s.specialty) : (s.specialty || s.specialtyAr);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Stethoscope size={20} />}
        title={t("Clinic Staff", "طاقم العيادة")}
        description={t("Doctors, nurses, assistants and front-desk team", "الأطباء والتمريض والمساعدين وفريق الاستقبال")}
        actions={
          <Button onClick={openNew} data-testid="button-new-staff">
            <Plus size={16} className="me-1.5" />
            {t("Add Staff", "إضافة موظف")}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"}`}
        >
          {t("All", "الكل")} ({staff.length})
        </button>
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setFilter(r.value)}
            className={`text-xs px-3 py-1.5 rounded-full border ${filter === r.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"}`}
          >
            {isAr ? r.ar : r.en} ({counts[r.value] ?? 0})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("Loading…", "جاري التحميل…")}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={24} />}
          title={t("No staff yet", "لا يوجد طاقم بعد")}
          description={t("Add your doctors and clinic team", "أضف أطبائك وفريق العيادة")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className={`bg-card border border-border rounded-md p-4 hover:shadow-sm transition-shadow ${!s.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[15px] truncate" data-testid={`text-staff-name-${s.id}`}>{displayName(s)}</h3>
                    {!s.active && <Badge variant="outline" className="text-[10px]">{t("Inactive", "غير نشط")}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${ROLE_TONE[s.role] ?? ROLE_TONE.other}`}>{roleLabel(s.role)}</span>
                    {displaySpecialty(s) && <span className="text-xs text-muted-foreground">{displaySpecialty(s)}</span>}
                    {s.prescriptionTemplateUrl && <span className="text-xs text-primary flex items-center gap-1"><ImageIcon size={11} />{t("Rx shape", "شكل الوصفة")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                    <Edit2 size={13} />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => { if (confirm(t("Delete this staff member?", "حذف هذا الموظف؟"))) deleteMutation.mutate(s.id); }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {s.licenseNumber && (
                  <div className="flex items-center gap-1.5"><IdCard size={12} /><span>{s.licenseNumber}</span></div>
                )}
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                    <Phone size={12} /><span dir="ltr">{s.phone}</span>
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 hover:text-foreground truncate">
                    <Mail size={12} /><span className="truncate" dir="ltr">{s.email}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(blank()); } }}>
        <DialogContent className="max-w-lg" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editing ? t("Edit staff member", "تعديل بيانات الموظف") : t("New staff member", "موظف جديد")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3.5">
            {isAr ? (
              <div className="space-y-1.5">
                <Label>{t("Name (Arabic)", "الاسم (عربي)")} *</Label>
                <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t("Name (English)", "الاسم (إنجليزي)")} *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("Role", "الدور")} *</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Specialty", "التخصص")}</Label>
                <Input
                  value={isAr ? form.specialtyAr : form.specialty}
                  onChange={e => isAr ? setForm({ ...form, specialtyAr: e.target.value }) : setForm({ ...form, specialty: e.target.value })}
                  placeholder={isAr ? "أمراض الباطنة" : "Internal medicine"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("License #", "رقم الترخيص")}</Label>
                <Input value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Phone", "الهاتف")}</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("Email", "البريد")}</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" />
            </div>

            <div className="space-y-1.5">
              <Label>{t("Notes", "ملاحظات")}</Label>
              <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            {form.role === "doctor" && (
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <Label className="text-sm font-semibold">{t("Prescription shape for this doctor", "شكل الوصفة لهذا الطبيب")}</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Upload a letterhead/template image and optional text printed only for this doctor.", "ارفع صورة قالب الوصفة ونصوص اختيارية تظهر لهذا الطبيب فقط.")}
                  </p>
                </div>
                {editing && (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
                      {form.prescriptionTemplateUrl ? <img src={form.prescriptionTemplateUrl} alt="rx-template" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-muted-foreground" />}
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90">
                      <Upload size={14} />{uploadTemplate.isPending ? t("Uploading…", "جاري الرفع…") : t("Upload shape", "رفع الشكل")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        disabled={uploadTemplate.isPending}
                        onChange={e => { const file = e.target.files?.[0]; if (file && editing) uploadTemplate.mutate({ id: editing.id, file }); e.target.value = ""; }}
                      />
                    </label>
                  </div>
                )}
                {!editing && <p className="text-xs text-amber-600">{t("Save the doctor first, then edit to upload the shape.", "احفظ الطبيب أولاً ثم عد للتعديل لرفع الشكل.")}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("Doctor prescription header", "ترويسة وصفة الطبيب")}</Label>
                    <Input value={isAr ? form.prescriptionHeaderAr : form.prescriptionHeader}
                      onChange={e => isAr ? setForm({ ...form, prescriptionHeaderAr: e.target.value }) : setForm({ ...form, prescriptionHeader: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("Doctor prescription footer", "تذييل وصفة الطبيب")}</Label>
                    <Input value={isAr ? form.prescriptionFooterAr : form.prescriptionFooter}
                      onChange={e => isAr ? setForm({ ...form, prescriptionFooterAr: e.target.value }) : setForm({ ...form, prescriptionFooter: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
                <span className="text-sm">{t("Active", "نشط")}</span>
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("Cancel", "إلغاء")}</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t("Saving…", "جاري الحفظ…") : t("Save", "حفظ")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
