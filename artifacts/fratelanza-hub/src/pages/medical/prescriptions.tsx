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
import { Pill, Plus, Trash2, FileText, Calendar, Activity, Printer } from "lucide-react";
import { useBranding } from "@/components/BrandingProvider";

type Prescription = {
  id: number;
  visitId: number;
  medicineMasterId: number | null;
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
  medicineMaterial: string | null;
  medicineBun: string | null;
  doctorPrescriptionTemplateUrl: string | null;
  doctorPrescriptionHeader: string | null;
  doctorPrescriptionHeaderAr: string | null;
  doctorPrescriptionFooter: string | null;
  doctorPrescriptionFooterAr: string | null;
};

type Visit = { id: number; patientId: number; visitDate: string };
type Patient = { id: number; firstName: string; firstNameAr: string | null; lastName: string | null; lastNameAr: string | null };
type MedicineMaster = { id: number; material: string; materialDescription: string; bun: string };

type RxHeader = {
  companyName?: string | null; companyNameAr?: string | null; logoUrl?: string | null;
  clinicPhone?: string | null; clinicAddress?: string | null; clinicAddressAr?: string | null;
  doctorTitle?: string | null; doctorTitleAr?: string | null; doctorLicense?: string | null;
  prescriptionFooter?: string | null; prescriptionFooterAr?: string | null;
};

function escHtml(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escAttr(v: unknown): string { return escHtml(v); }

function printPrescription(p: Prescription, header: RxHeader, isAr: boolean, t: (en: string, ar: string) => string, patientLabelRaw: string) {
  const clinicName = escHtml(isAr ? (header.companyNameAr || header.companyName) : (header.companyName || header.companyNameAr));
  const address = escHtml(isAr ? (header.clinicAddressAr || header.clinicAddress) : (header.clinicAddress || header.clinicAddressAr));
  const doctor = escHtml(isAr ? (p.doctorNameAr || p.doctorName) : (p.doctorName || p.doctorNameAr));
  const doctorTitle = escHtml(isAr ? (header.doctorTitleAr || header.doctorTitle) : (header.doctorTitle || header.doctorTitleAr));
  const footer = escHtml(isAr ? (header.prescriptionFooterAr || header.prescriptionFooter) : (header.prescriptionFooter || header.prescriptionFooterAr));
  const doctorHeader = escHtml(isAr ? (p.doctorPrescriptionHeaderAr || p.doctorPrescriptionHeader) : (p.doctorPrescriptionHeader || p.doctorPrescriptionHeaderAr));
  const doctorFooter = escHtml(isAr ? (p.doctorPrescriptionFooterAr || p.doctorPrescriptionFooter) : (p.doctorPrescriptionFooter || p.doctorPrescriptionFooterAr));
  const medName = escHtml(isAr ? (p.medicineNameAr || p.medicineName) : p.medicineName);
  const instructions = escHtml(isAr ? (p.instructionsAr || p.instructions) : (p.instructions || p.instructionsAr));
  const dosage = escHtml(p.dosage);
  const frequency = escHtml(p.frequency);
  const clinicPhone = escHtml(header.clinicPhone);
  const logoUrl = escAttr(header.logoUrl);
  const templateUrl = escAttr(p.doctorPrescriptionTemplateUrl);
  const doctorLicense = escHtml(header.doctorLicense);
  const patientLabel = escHtml(patientLabelRaw);
  const initial = escHtml((isAr ? (header.companyNameAr || header.companyName) : (header.companyName || header.companyNameAr))?.charAt(0) || "C");
  const dateStr = new Date(p.createdAt).toLocaleDateString(isAr ? "ar-EG" : undefined);
  const visitDateStr = p.visitDate ? new Date(p.visitDate).toLocaleDateString(isAr ? "ar-EG" : undefined) : "";

  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  const dir = isAr ? "rtl" : "ltr";
  const html = `<!doctype html><html dir="${dir}" lang="${isAr ? "ar" : "en"}"><head>
<meta charset="utf-8"><title>${t("Prescription", "وصفة طبية")} #${p.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${isAr ? "'Tahoma','Segoe UI'" : "'Inter','Segoe UI','Helvetica'"},sans-serif;color:#0f172a;padding:32px 40px;line-height:1.5}
  .template-bg{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;opacity:.18;z-index:-1}
  .header{display:flex;align-items:center;gap:18px;padding-bottom:18px;border-bottom:3px solid #1e40af}
  .logo{width:72px;height:72px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0}
  .logo-placeholder{width:72px;height:72px;border-radius:8px;background:#1e40af;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
  .clinic-name{font-size:22px;font-weight:700;color:#1e40af}
  .clinic-meta{font-size:12px;color:#64748b;margin-top:4px}
  .doctor-bar{display:flex;justify-content:space-between;align-items:flex-end;margin:18px 0 8px;font-size:13px}
  .doctor-name{font-size:16px;font-weight:600}
  .doctor-sub{font-size:12px;color:#475569}
  .rx-mark{font-size:64px;font-weight:700;color:#1e40af;line-height:1;margin:8px 0}
  .patient-box{background:#f1f5f9;border-radius:6px;padding:10px 14px;margin-bottom:18px;display:flex;gap:24px;flex-wrap:wrap;font-size:13px}
  .patient-box b{color:#0f172a}
  .label{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
  .med-card{border:1px solid #e2e8f0;border-${isAr ? "right" : "left"}:4px solid #1e40af;border-radius:6px;padding:14px 18px;margin-bottom:14px}
  .med-name{font-size:18px;font-weight:700;color:#0f172a;margin-bottom:6px}
  .med-row{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:#475569;margin-bottom:6px}
  .instructions{background:#fefce8;border:1px solid #fde047;padding:10px 14px;border-radius:6px;font-size:13px;margin-top:8px}
  .signature{margin-top:60px;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#475569}
  .sig-line{width:220px;border-top:1px solid #94a3b8;padding-top:6px;text-align:center}
  .footer{margin-top:40px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;white-space:pre-wrap}
  @media print{ body{padding:24px 32px} }
</style></head><body>
  ${templateUrl ? `<img src="${templateUrl}" class="template-bg" alt="prescription template">` : ""}
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="logo">` : `<div class="logo-placeholder">${initial}</div>`}
    <div style="flex:1">
      <div class="clinic-name">${clinicName}</div>
      <div class="clinic-meta">
        ${address ? `<div>${address}</div>` : ""}
        ${clinicPhone ? `<div dir="ltr">☎ ${clinicPhone}</div>` : ""}
      </div>
    </div>
    <div style="text-align:${isAr ? "left" : "right"}">
      <div class="label">${escHtml(t("Date", "التاريخ"))}</div>
      <div style="font-size:14px;font-weight:600">${escHtml(dateStr)}</div>
    </div>
  </div>

  <div class="doctor-bar">
    <div>
      <div class="label">${escHtml(t("Doctor", "الطبيب"))}</div>
      <div class="doctor-name">${doctor || "—"}</div>
      <div class="doctor-sub">${doctorTitle}${doctorLicense ? `${doctorTitle ? " · " : ""}${escHtml(t("License", "ترخيص"))} #${doctorLicense}` : ""}</div>
      ${doctorHeader ? `<div class="doctor-sub">${doctorHeader}</div>` : ""}
    </div>
    <div class="rx-mark">℞</div>
  </div>

  <div class="patient-box">
    <div><span class="label">${escHtml(t("Patient", "المريض"))}</span><br><b>${patientLabel}</b></div>
    ${visitDateStr ? `<div><span class="label">${escHtml(t("Visit", "الزيارة"))}</span><br><b>${escHtml(visitDateStr)}</b></div>` : ""}
  </div>

  <div class="med-card">
    <div class="med-name">${medName}</div>
    <div class="med-row">
      ${dosage ? `<span><b>${escHtml(t("Dosage", "الجرعة"))}:</b> ${dosage}</span>` : ""}
      ${frequency ? `<span><b>${escHtml(t("Frequency", "التكرار"))}:</b> ${frequency}</span>` : ""}
      ${p.durationDays != null ? `<span><b>${escHtml(t("Duration", "المدة"))}:</b> ${Number(p.durationDays)} ${escHtml(t("days", "يوم"))}</span>` : ""}
      ${p.medicineBun ? `<span><b>${escHtml(t("Unit", "الوحدة"))}:</b> ${escHtml(p.medicineBun)}</span>` : ""}
    </div>
    ${instructions ? `<div class="instructions"><b>${escHtml(t("Instructions", "التعليمات"))}:</b> ${instructions}</div>` : ""}
  </div>

  <div class="signature">
    <div>
      <div class="label">${escHtml(t("Date", "التاريخ"))}</div>
      <div class="sig-line">${escHtml(dateStr)}</div>
    </div>
    <div>
      <div class="label">${escHtml(t("Doctor's signature", "توقيع الطبيب"))}</div>
      <div class="sig-line">${doctor}</div>
    </div>
  </div>

  ${(doctorFooter || footer) ? `<div class="footer">${doctorFooter || footer}</div>` : ""}

  <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`;
  w.document.write(html);
  w.document.close();
}

export default function PrescriptionsPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();
  const { branding } = useBranding();
  const { data: rxHeader } = useQuery<RxHeader>({
    queryKey: ["settings-branding-full"],
    queryFn: () => apiFetch("/settings/branding"),
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{
    visitId: string; medicineMasterId: string; medicineName: string; medicineNameAr: string;
    dosage: string; frequency: string; durationDays: string;
    instructions: string; instructionsAr: string;
  }>({ visitId: "", medicineMasterId: "", medicineName: "", medicineNameAr: "", dosage: "", frequency: "", durationDays: "", instructions: "", instructionsAr: "" });

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
  const { data: medicines = [] } = useQuery<MedicineMaster[]>({
    queryKey: ["medicine-master"],
    queryFn: () => apiFetch("/medicine-master"),
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
      setForm({ visitId: "", medicineMasterId: "", medicineName: "", medicineNameAr: "", dosage: "", frequency: "", durationDays: "", instructions: "", instructionsAr: "" });
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
    if (!form.visitId || (!form.medicineMasterId && !form.medicineName.trim())) return;
    const body: any = {
      visitId: Number(form.visitId),
    };
    if (form.medicineMasterId) body.medicineMasterId = Number(form.medicineMasterId);
    if (form.medicineName.trim()) body.medicineName = form.medicineName.trim();
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
                    {p.medicineMaterial && <span className="text-xs text-muted-foreground">· {p.medicineMaterial}</span>}
                    {p.medicineBun && <span className="text-xs text-muted-foreground">· {p.medicineBun}</span>}
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
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title={t("Print", "طباعة")}
                    onClick={() => printPrescription(p, { ...branding, ...(rxHeader || {}) }, isAr, t, patientLabel(p as any))}
                    data-testid={`button-print-prescription-${p.id}`}
                  >
                    <Printer size={15} />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => { if (confirm(t("Delete prescription?", "حذف الوصفة؟"))) deleteMutation.mutate(p.id); }}
                    data-testid={`button-delete-prescription-${p.id}`}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
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

            {medicines.length > 0 ? (
              <div className="space-y-1.5">
                <Label>{t("Medicine from master data", "الدواء من البيانات الرئيسية")}*</Label>
                <Select value={form.medicineMasterId} onValueChange={v => {
                  const med = medicines.find(m => String(m.id) === v);
                  setForm({ ...form, medicineMasterId: v, medicineName: med?.materialDescription || form.medicineName });
                }}>
                  <SelectTrigger><SelectValue placeholder={t("Pick medicine", "اختر الدواء")} /></SelectTrigger>
                  <SelectContent>
                    {medicines.map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.materialDescription} · {m.material} · {m.bun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : isAr ? (
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
              <Button type="submit" disabled={createMutation.isPending || !form.visitId || (!form.medicineMasterId && !form.medicineName.trim())}>
                {createMutation.isPending ? t("Saving…", "جاري الحفظ…") : t("Save", "حفظ")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
