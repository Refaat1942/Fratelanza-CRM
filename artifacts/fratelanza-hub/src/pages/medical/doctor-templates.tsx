import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui-ext/page-header";
import { FileImage, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Employee = { id: number; name: string; nameAr?: string | null };
type Template = {
  id: number;
  doctorId: number;
  templateUrl: string | null;
  doctorTitle: string | null;
  doctorTitleAr: string | null;
  doctorLicense: string | null;
  footerText: string | null;
  footerTextAr: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
};

export default function DoctorTemplatesPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [doctorId, setDoctorId] = useState("");
  const [meta, setMeta] = useState({
    doctorTitle: "", doctorTitleAr: "", doctorLicense: "", footerText: "", footerTextAr: "",
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["doctor-prescription-templates"],
    queryFn: () => apiFetch("/doctor-prescription-templates"),
  });

  const saveMut = useMutation({
    mutationFn: async (file?: File) => {
      if (!doctorId) throw new Error(t("Select a doctor", "اختر طبيباً"));
      const fd = new FormData();
      if (file) fd.append("template", file);
      if (meta.doctorTitle) fd.append("doctorTitle", meta.doctorTitle);
      if (meta.doctorTitleAr) fd.append("doctorTitleAr", meta.doctorTitleAr);
      if (meta.doctorLicense) fd.append("doctorLicense", meta.doctorLicense);
      if (meta.footerText) fd.append("footerText", meta.footerText);
      if (meta.footerTextAr) fd.append("footerTextAr", meta.footerTextAr);
      return apiFetch(`/doctor-prescription-templates/${doctorId}`, { method: "POST", body: fd });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor-prescription-templates"] });
      toast({ title: t("Template saved", "تم حفظ القالب") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const doctorLabel = (e: Employee) => isAr ? (e.nameAr || e.name) : e.name;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<FileImage size={20} />}
        title={t("Prescription Templates", "قوالب الوصفات")}
        description={t("Upload a prescription layout/shape for each doctor you sell to", "ارفع شكل الوصفة لكل طبيب")}
      />

      <div className="bg-card border border-border rounded-lg p-5 space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>{t("Doctor", "الطبيب")}*</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger><SelectValue placeholder={t("Select doctor", "اختر الطبيب")} /></SelectTrigger>
            <SelectContent>
              {employees.map(e => (
                <SelectItem key={e.id} value={String(e.id)}>{doctorLabel(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Title (EN)", "اللقب (إنجليزي)")}</Label>
            <Input value={meta.doctorTitle} onChange={e => setMeta({ ...meta, doctorTitle: e.target.value })} placeholder="Dr." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Title (AR)", "اللقب (عربي)")}</Label>
            <Input value={meta.doctorTitleAr} onChange={e => setMeta({ ...meta, doctorTitleAr: e.target.value })} placeholder="د." dir="rtl" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("License number", "رقم الترخيص")}</Label>
          <Input value={meta.doctorLicense} onChange={e => setMeta({ ...meta, doctorLicense: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("Template image (PNG/JPG/PDF)", "صورة القالب")}*</Label>
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) saveMut.mutate(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={saveMut.isPending || !doctorId}>
            <Upload size={14} className="me-1.5" />
            {t("Upload template", "رفع القالب")}
          </Button>
        </div>
      </div>

      {templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map(tpl => (
            <div key={tpl.id} className="border border-border rounded-lg p-4 flex gap-4">
              {tpl.templateUrl && (
                <img src={tpl.templateUrl} alt="" className="w-24 h-32 object-cover rounded border border-border" />
              )}
              <div className="text-sm">
                <div className="font-medium">{isAr ? (tpl.doctorNameAr || tpl.doctorName) : tpl.doctorName}</div>
                <div className="text-muted-foreground text-xs mt-1">{tpl.doctorTitle || tpl.doctorTitleAr}</div>
                {tpl.doctorLicense && <div className="text-xs mt-1">{t("License", "ترخيص")}: {tpl.doctorLicense}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
