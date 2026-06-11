import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
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
import {
  Plus, User, Phone, Mail, Trash2, Edit2, Users, UserPlus, MessageCircle,
  IdCard, AlertTriangle, Stethoscope, Search, Sparkles, QrCode, History,
} from "lucide-react";
import { AiSummaryDialog } from "@/components/medical/AiSummaryDialog";
import { openWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { SectionCard } from "@/components/ui-ext/section-card";
import { BranchSelect } from "@/components/BranchSelect";
import { useAuth } from "@/components/AuthProvider";

type Patient = {
  id: number;
  firstName: string; firstNameAr?: string | null;
  lastName?: string | null; lastNameAr?: string | null;
  gender?: "male" | "female" | "other" | null;
  dateOfBirth?: string | null;
  nationalId?: string | null;
  phone?: string | null; email?: string | null;
  address?: string | null; addressAr?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null; notesAr?: string | null;
  branchId?: number | null;
};

type Stats = { total: number; recent: number };

const EMPTY: Patient = {
  id: 0, firstName: "", firstNameAr: "", lastName: "", lastNameAr: "",
  gender: null, dateOfBirth: "", nationalId: "", phone: "", email: "",
  address: "", addressAr: "", bloodType: "", allergies: "", chronicConditions: "",
  emergencyContactName: "", emergencyContactPhone: "", notes: "", notesAr: "",
  branchId: null,
};

function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

export default function Patients() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const lf = useLangField();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<Patient>(EMPTY);
  const [aiSummaryFor, setAiSummaryFor] = useState<Patient | null>(null);
  const [qrPatient, setQrPatient] = useState<Patient | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const { data: stats } = useQuery<Stats>({
    queryKey: ["patients-stats"],
    queryFn: () => apiFetch("/patients/stats"),
  });

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["patients", search],
    queryFn: () => apiFetch(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["patients"] });
    qc.invalidateQueries({ queryKey: ["patients-stats"] });
  };

  const createMut = useMutation({
    mutationFn: (data: Partial<Patient>) =>
      apiFetch<Patient>("/patients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (patient) => {
      invalidate();
      setCreateOpen(false);
      setForm(EMPTY);
      setQrPatient(patient);
      toast({ title: t("Patient added — QR ready", "تمت إضافة المريض — رمز QR جاهز") });
    },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Patient> }) =>
      apiFetch<Patient>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setEditing(null); setForm(EMPTY); toast({ title: t("Patient updated", "تم تحديث المريض") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Patient deleted", "تم حذف المريض") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (p: Patient) => { setEditing(p); setForm({ ...EMPTY, ...p }); };

  const openCreate = () => {
    setForm({ ...EMPTY, branchId: user?.branchId ?? null });
    setCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Strict per-language form. Write policy:
    //  - Always send the active-language fields.
    //  - OMIT the inactive-language fields entirely so PATCH does not wipe them.
    //  - On CREATE, mirror the active value into the required NOT NULL column.
    const data: Partial<Patient> = {
      gender: form.gender || null,
      dateOfBirth: form.dateOfBirth || null,
      nationalId: form.nationalId || null,
      phone: form.phone || null,
      email: form.email || null,
      bloodType: form.bloodType || null,
      allergies: form.allergies || null,
      chronicConditions: form.chronicConditions || null,
      emergencyContactName: form.emergencyContactName || null,
      emergencyContactPhone: form.emergencyContactPhone || null,
      branchId: form.branchId ?? null,
    };
    if (isAr) {
      data.firstNameAr = form.firstNameAr || "";
      data.lastNameAr = form.lastNameAr || null;
      data.addressAr = form.addressAr || null;
      data.notesAr = form.notesAr || null;
      // firstName is NOT NULL — on CREATE fall back to AR value; on UPDATE leave EN side untouched.
      if (!editing) data.firstName = form.firstNameAr || "";
    } else {
      data.firstName = form.firstName;
      data.lastName = form.lastName || null;
      data.address = form.address || null;
      data.notes = form.notes || null;
    }
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const fullName = (p: Patient) => {
    if (isAr) return `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim();
    return `${p.firstName || p.firstNameAr || ""} ${p.lastName || p.lastNameAr || ""}`.trim();
  };

  const genderLabel = (g?: string | null) =>
    g === "male" ? t("Male", "ذكر") : g === "female" ? t("Female", "أنثى") : g === "other" ? t("Other", "آخر") : null;

  const historyUrl = (p: Patient) => `${window.location.origin}/medical/patient-history/${p.id}`;
  useEffect(() => {
    let cancelled = false;
    if (!qrPatient) { setQrDataUrl(""); return; }
    QRCode.toDataURL(historyUrl(qrPatient), { width: 240, margin: 1 })
      .then(url => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [qrPatient]);

  const openHistory = (p: Patient) => { window.location.href = `/medical/patient-history/${p.id}`; };

  const PatientForm = (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isAr ? "الاسم الأول *" : "First Name *"}</Label>
            <Input
              required dir={lf.dir}
              value={isAr ? (form.firstNameAr || "") : form.firstName}
              onChange={e => isAr
                ? setForm({ ...form, firstNameAr: e.target.value })
                : setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isAr ? "اسم العائلة" : "Last Name"}</Label>
            <Input
              dir={lf.dir}
              value={isAr ? (form.lastNameAr || "") : (form.lastName || "")}
              onChange={e => isAr
                ? setForm({ ...form, lastNameAr: e.target.value })
                : setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Gender", "النوع")}</Label>
            <Select value={form.gender || ""} onValueChange={v => setForm({ ...form, gender: (v || null) as any })}>
              <SelectTrigger><SelectValue placeholder={t("Select", "اختر")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("Male", "ذكر")}</SelectItem>
                <SelectItem value="female">{t("Female", "أنثى")}</SelectItem>
                <SelectItem value="other">{t("Other", "آخر")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Date of Birth", "تاريخ الميلاد")}</Label>
            <Input type="date" value={form.dateOfBirth || ""} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Blood Type", "فصيلة الدم")}</Label>
            <Select value={form.bloodType || ""} onValueChange={v => setForm({ ...form, bloodType: v || null })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Phone", "الهاتف")}</Label>
            <Input dir="ltr" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Email", "البريد الإلكتروني")}</Label>
            <Input type="email" dir="ltr" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("National ID", "الرقم القومي")}</Label>
          <Input dir="ltr" value={form.nationalId || ""} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Address", "العنوان")}</Label>
          <Textarea
            rows={2} dir={lf.dir}
            value={isAr ? (form.addressAr || "") : (form.address || "")}
            onChange={e => isAr ? setForm({ ...form, addressAr: e.target.value }) : setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-600"/>{t("Allergies", "الحساسية")}</Label>
          <Textarea rows={2} value={form.allergies || ""} onChange={e => setForm({ ...form, allergies: e.target.value })}
            placeholder={t("e.g. Penicillin, peanuts", "مثل: البنسلين، الفول السوداني")} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Chronic Conditions", "أمراض مزمنة")}</Label>
          <Textarea rows={2} value={form.chronicConditions || ""} onChange={e => setForm({ ...form, chronicConditions: e.target.value })}
            placeholder={t("e.g. Diabetes, hypertension", "مثل: السكري، ضغط الدم")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Emergency Contact", "جهة اتصال للطوارئ")}</Label>
            <Input dir={lf.dir} value={form.emergencyContactName || ""} onChange={e => setForm({ ...form, emergencyContactName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Emergency Phone", "هاتف الطوارئ")}</Label>
            <Input dir="ltr" value={form.emergencyContactPhone || ""} onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Notes", "ملاحظات")}</Label>
          <Textarea
            rows={2} dir={lf.dir}
            value={isAr ? (form.notesAr || "") : (form.notes || "")}
            onChange={e => isAr ? setForm({ ...form, notesAr: e.target.value }) : setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <BranchSelect value={form.branchId} onChange={id => setForm({ ...form, branchId: id })} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {editing ? t("Save Changes", "حفظ التغييرات") : t("Save Patient", "حفظ المريض")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users size={20} />}
        title={t("Patients", "المرضى")}
        description={t("Manage every patient record — bilingual, searchable, hardened.", "إدارة جميع سجلات المرضى — ثنائية اللغة، قابلة للبحث، آمنة.")}
        actions={
          <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) setForm(EMPTY); }}>
            <DialogTrigger asChild>
              <Button data-testid="btn-create-patient" className="gap-1.5 h-9" onClick={openCreate}><Plus size={15}/>{t("New Patient", "مريض جديد")}</Button>
            </DialogTrigger>
            <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><UserPlus size={18} className="text-primary"/>{t("Add Patient", "إضافة مريض")}</DialogTitle>
              </DialogHeader>
              {PatientForm}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label={t("Total Patients", "إجمالي المرضى")}
          value={stats?.total ?? "—"}
          icon={<Users size={18} />}
          tone="primary"
        />
        <KpiCard
          label={t("New (30 days)", "جدد (30 يوم)")}
          value={stats?.recent ?? "—"}
          icon={<UserPlus size={18} />}
          tone="success"
        />
        <KpiCard
          label={t("Active Filter", "بحث نشط")}
          value={search ? t("Filtered", "مفلتر") : t("All", "الكل")}
          icon={<Search size={18} />}
          hint={search ? `"${search}"` : t("Showing every patient", "عرض جميع المرضى")}
        />
      </div>

      <SectionCard
        title={t("All Patients", "كل المرضى")}
        actions={
          <div className="relative w-full sm:w-72">
            <Search size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-2.5" : "left-2.5"} text-muted-foreground`} />
            <Input
              placeholder={t("Search by name, phone, national ID…", "بحث بالاسم، الهاتف، الرقم القومي…")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`h-8 ${isRtl ? "pr-8" : "pl-8"}`}
              dir={lf.dir}
            />
          </div>
        }
        noPadding
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44 w-full rounded-md" />)}
          </div>
        ) : !patients || patients.length === 0 ? (
          <EmptyState
            icon={<User size={22} />}
            title={t("No patients yet", "لا يوجد مرضى بعد")}
            description={t("Add your first patient to start tracking visits, prescriptions, and invoices.", "أضف أول مريض لتبدأ تتبع الزيارات والوصفات والفواتير.")}
            action={
              <Button onClick={openCreate} className="gap-1.5"><Plus size={15}/>{t("Add Patient", "إضافة مريض")}</Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {patients.map(p => {
              const age = calcAge(p.dateOfBirth);
              return (
                <div key={p.id}
                  className="group bg-card border border-card-border rounded-md overflow-hidden hover:border-primary/60 hover:shadow-sm transition-all"
                  data-testid={`patient-${p.id}`}>
                  <div className="px-4 py-3 border-b border-card-border bg-secondary/50 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-[15px] truncate text-foreground">{fullName(p)}</div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {genderLabel(p.gender) && <Badge variant="outline" className="text-[10px] h-5 px-1.5">{genderLabel(p.gender)}</Badge>}
                        {age !== null && <Badge variant="outline" className="text-[10px] h-5 px-1.5">{age} {t("yrs", "سنة")}</Badge>}
                        {p.bloodType && <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold text-red-600 border-red-200">{p.bloodType}</Badge>}
                      </div>
                    </div>
                    <Stethoscope size={16} className="text-muted-foreground/60 shrink-0 mt-0.5" />
                  </div>
                  <div className="p-4 space-y-1.5 text-[13px]">
                    {p.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone size={13} className="shrink-0"/><span dir="ltr" className="truncate">{p.phone}</span></div>}
                    {p.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={13} className="shrink-0"/><span className="truncate">{p.email}</span></div>}
                    {p.nationalId && <div className="flex items-center gap-2 text-muted-foreground"><IdCard size={13} className="shrink-0"/><span dir="ltr" className="truncate">{p.nationalId}</span></div>}
                    {p.allergies && (
                      <div className="flex items-start gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5"/>
                        <span className="text-[11px] leading-relaxed"><b>{t("Allergies", "حساسية")}:</b> {p.allergies}</span>
                      </div>
                    )}
                    <div className="pt-3 mt-2 border-t border-card-border flex items-center justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-violet-700 hover:bg-violet-50 hover:text-violet-800 border-violet-200"
                        onClick={() => setAiSummaryFor(p)}
                        title={t("AI Summary", "ملخص ذكاء اصطناعي")} data-testid={`btn-ai-summary-${p.id}`}>
                        <Sparkles size={13} />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2"
                        onClick={() => openHistory(p)}
                        title={t("History", "السجل")} data-testid={`btn-history-patient-${p.id}`}>
                        <History size={13} />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2"
                        onClick={() => setQrPatient(p)}
                        title={t("QR history link", "رابط السجل QR")} data-testid={`btn-qr-patient-${p.id}`}>
                        <QrCode size={13} />
                      </Button>
                      {p.phone && (
                        <Button variant="outline" size="sm" className="h-7 px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-200"
                          onClick={() => openWhatsApp(p.phone!, isAr ? `السلام عليكم ${p.firstNameAr || p.firstName}،` : `Hello ${p.firstName},`)}
                          title={t("Send WhatsApp", "إرسال واتساب")} data-testid={`btn-whatsapp-patient-${p.id}`}>
                          <MessageCircle size={13} />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEdit(p)} data-testid={`btn-edit-patient-${p.id}`}>
                        <Edit2 size={13} className={isRtl ? "ml-1" : "mr-1"}/>{t("Edit", "تعديل")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                        onClick={() => confirmDelete({
                          title: t("Delete patient?", "حذف المريض؟"),
                          onConfirm: async () => deleteMut.mutate(p.id),
                        })}
                        data-testid={`btn-delete-patient-${p.id}`}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {aiSummaryFor && (
        <AiSummaryDialog
          patientId={aiSummaryFor.id}
          patientName={fullName(aiSummaryFor)}
          open={aiSummaryFor !== null}
          onOpenChange={(v) => { if (!v) setAiSummaryFor(null); }}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={open => { if (!open) { setEditing(null); setForm(EMPTY); } }}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 size={18} className="text-primary"/>{t("Edit Patient", "تعديل بيانات المريض")}</DialogTitle>
          </DialogHeader>
          {PatientForm}
        </DialogContent>
      </Dialog>

      <Dialog open={qrPatient !== null} onOpenChange={open => { if (!open) setQrPatient(null); }}>
        <DialogContent className={`max-w-sm ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode size={18} className="text-primary"/>{t("Patient history QR", "رمز QR لسجل المريض")}</DialogTitle>
          </DialogHeader>
          {qrPatient && (
            <div className="space-y-4 text-center">
              <div>
                <div className="font-semibold">{fullName(qrPatient)}</div>
                <div className="text-xs text-muted-foreground">{t("Scan to open full patient history", "امسح لفتح سجل المريض الكامل")}</div>
              </div>
              <div className="mx-auto w-64 h-64 rounded-lg border bg-white flex items-center justify-center p-3">
                {qrDataUrl ? <img src={qrDataUrl} alt="patient-history-qr" className="w-full h-full object-contain" /> : <QrCode size={64} className="text-muted-foreground" />}
              </div>
              <div className="text-[11px] break-all bg-muted rounded p-2 text-muted-foreground" dir="ltr">{historyUrl(qrPatient)}</div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(historyUrl(qrPatient))}>{t("Copy link", "نسخ الرابط")}</Button>
                <Button type="button" onClick={() => openHistory(qrPatient)}>{t("Open history", "فتح السجل")}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
