import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, User, Phone, Mail, Trash2, Edit2, Users, UserPlus, MessageCircle, IdCard, AlertTriangle, Calendar,
} from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

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
};

type Stats = { total: number; recent: number };

const EMPTY: Patient = {
  id: 0, firstName: "", firstNameAr: "", lastName: "", lastNameAr: "",
  gender: null, dateOfBirth: "", nationalId: "", phone: "", email: "",
  address: "", addressAr: "", bloodType: "", allergies: "", chronicConditions: "",
  emergencyContactName: "", emergencyContactPhone: "", notes: "", notesAr: "",
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
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<Patient>(EMPTY);

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
    onSuccess: () => { invalidate(); setCreateOpen(false); setForm(EMPTY); toast({ title: t("Patient added", "تمت إضافة المريض") }); },
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

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({ ...EMPTY, ...p });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Patient> = { ...form };
    // Coerce empty strings to null for optional fields
    for (const k of Object.keys(data) as (keyof Patient)[]) {
      if (k === "id" || k === "firstName") continue;
      if ((data as any)[k] === "") (data as any)[k] = null;
    }
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const fullName = (p: Patient) => {
    if (isAr) return `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim();
    return `${p.firstName} ${p.lastName || ""}`.trim();
  };

  const genderLabel = (g?: string | null) =>
    g === "male" ? t("Male", "ذكر") : g === "female" ? t("Female", "أنثى") : g === "other" ? t("Other", "آخر") : null;

  const PatientForm = (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{isAr ? "الاسم الأول *" : "First Name *"}</Label>
            <Input
              required dir={isAr ? "rtl" : "ltr"}
              value={isAr ? (form.firstNameAr || "") : form.firstName}
              onChange={e => isAr
                ? setForm({ ...form, firstNameAr: e.target.value, firstName: form.firstName || e.target.value })
                : setForm({ ...form, firstName: e.target.value })}
            />
            {isAr && !form.firstName && (
              <p className="text-xs text-amber-600">{t("Tip: also enter the English name in the EN view for search.", "تلميح: أدخل أيضًا الاسم بالإنجليزية للبحث.")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "اسم العائلة" : "Last Name"}</Label>
            <Input
              dir={isAr ? "rtl" : "ltr"}
              value={isAr ? (form.lastNameAr || "") : (form.lastName || "")}
              onChange={e => isAr
                ? setForm({ ...form, lastNameAr: e.target.value })
                : setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>{t("Gender", "النوع")}</Label>
            <Select value={form.gender || ""} onValueChange={v => setForm({ ...form, gender: (v || null) as any })}>
              <SelectTrigger><SelectValue placeholder={t("Select", "اختر")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("Male", "ذكر")}</SelectItem>
                <SelectItem value="female">{t("Female", "أنثى")}</SelectItem>
                <SelectItem value="other">{t("Other", "آخر")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("Date of Birth", "تاريخ الميلاد")}</Label>
            <Input type="date" value={form.dateOfBirth || ""} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("Blood Type", "فصيلة الدم")}</Label>
            <Select value={form.bloodType || ""} onValueChange={v => setForm({ ...form, bloodType: v || null })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("Phone", "الهاتف")}</Label>
            <Input dir="ltr" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("Email", "البريد الإلكتروني")}</Label>
            <Input type="email" dir="ltr" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("National ID", "الرقم القومي")}</Label>
          <Input dir="ltr" value={form.nationalId || ""} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>{t("Address", "العنوان")}</Label>
          <Textarea
            rows={2} dir={isAr ? "rtl" : "ltr"}
            value={isAr ? (form.addressAr || "") : (form.address || "")}
            onChange={e => isAr ? setForm({ ...form, addressAr: e.target.value }) : setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1"><AlertTriangle size={14} className="text-amber-600"/>{t("Allergies", "الحساسية")}</Label>
          <Textarea rows={2} value={form.allergies || ""} onChange={e => setForm({ ...form, allergies: e.target.value })}
            placeholder={t("e.g. Penicillin, peanuts", "مثل: البنسلين، الفول السوداني")} />
        </div>

        <div className="space-y-2">
          <Label>{t("Chronic Conditions", "أمراض مزمنة")}</Label>
          <Textarea rows={2} value={form.chronicConditions || ""} onChange={e => setForm({ ...form, chronicConditions: e.target.value })}
            placeholder={t("e.g. Diabetes, hypertension", "مثل: السكري، ضغط الدم")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("Emergency Contact", "جهة اتصال للطوارئ")}</Label>
            <Input value={form.emergencyContactName || ""} onChange={e => setForm({ ...form, emergencyContactName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("Emergency Phone", "هاتف الطوارئ")}</Label>
            <Input dir="ltr" value={form.emergencyContactPhone || ""} onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("Notes", "ملاحظات")}</Label>
          <Textarea
            rows={2} dir={isAr ? "rtl" : "ltr"}
            value={isAr ? (form.notesAr || "") : (form.notes || "")}
            onChange={e => isAr ? setForm({ ...form, notesAr: e.target.value }) : setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {editing ? t("Save Changes", "حفظ التغييرات") : t("Save", "حفظ")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Patients", "المرضى")}</h2>
          <p className="text-muted-foreground">{t("Manage your patient records", "إدارة سجلات المرضى")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) setForm(EMPTY); }}>
          <DialogTrigger asChild>
            <Button data-testid="btn-create-patient" className="shrink-0 gap-2"><Plus size={16}/>{t("New Patient", "مريض جديد")}</Button>
          </DialogTrigger>
          <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
            <DialogHeader><DialogTitle>{t("Add Patient", "إضافة مريض")}</DialogTitle></DialogHeader>
            {PatientForm}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-200 dark:border-blue-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-500">{t("Total Patients", "إجمالي المرضى")}</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.total ?? "—"}</h3>
            </div>
            <Users className="w-8 h-8 text-blue-500/50" />
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-500">{t("New (30 days)", "جدد (30 يوم)")}</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.recent ?? "—"}</h3>
            </div>
            <UserPlus className="w-8 h-8 text-emerald-500/50" />
          </CardContent>
        </Card>
      </div>

      <div className="bg-card p-4 rounded-lg border border-border">
        <Input
          placeholder={t("Search by name, phone or national ID...", "بحث بالاسم أو الهاتف أو الرقم القومي...")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : !patients || patients.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <User className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t("No patients yet. Add your first patient.", "لا يوجد مرضى. أضف أول مريض.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(p => {
            const age = calcAge(p.dateOfBirth);
            return (
              <Card key={p.id} className="overflow-hidden hover:border-primary/50 transition-colors group" data-testid={`patient-${p.id}`}>
                <CardHeader className="p-4 pb-2 border-b border-border bg-muted/20 flex flex-row items-start justify-between space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">{fullName(p)}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {genderLabel(p.gender) && <Badge variant="outline" className="text-xs">{genderLabel(p.gender)}</Badge>}
                      {age !== null && <Badge variant="outline" className="text-xs">{age} {t("yrs", "سنة")}</Badge>}
                      {p.bloodType && <Badge variant="outline" className="text-xs">{p.bloodType}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-sm">
                  {p.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} className="shrink-0"/><span dir="ltr">{p.phone}</span></div>}
                  {p.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={14} className="shrink-0"/><span className="truncate">{p.email}</span></div>}
                  {p.nationalId && <div className="flex items-center gap-2 text-muted-foreground"><IdCard size={14} className="shrink-0"/><span dir="ltr" className="truncate">{p.nationalId}</span></div>}
                  {p.allergies && (
                    <div className="flex items-start gap-2 text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded p-2 mt-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                      <span className="text-xs"><b>{t("Allergies", "حساسية")}:</b> {p.allergies}</span>
                    </div>
                  )}
                  <div className="pt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.phone && (
                      <Button variant="outline" size="sm"
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                        onClick={() => openWhatsApp(p.phone!, isAr ? `السلام عليكم ${p.firstNameAr || p.firstName}،` : `Hello ${p.firstName},`)}
                        title={t("Send WhatsApp", "إرسال واتساب")} data-testid={`btn-whatsapp-patient-${p.id}`}>
                        <MessageCircle size={14} />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)} data-testid={`btn-edit-patient-${p.id}`}>
                      <Edit2 size={14} className={isRtl ? "ml-1" : "mr-1"}/>{t("Edit", "تعديل")}
                    </Button>
                    <Button variant="outline" size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                      onClick={() => confirmDelete({
                        title: t("Delete patient?", "حذف المريض؟"),
                        onConfirm: async () => deleteMut.mutate(p.id),
                      })}
                      data-testid={`btn-delete-patient-${p.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={open => { if (!open) { setEditing(null); setForm(EMPTY); } }}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader><DialogTitle>{t("Edit Patient", "تعديل بيانات المريض")}</DialogTitle></DialogHeader>
          {PatientForm}
        </DialogContent>
      </Dialog>
    </div>
  );
}
