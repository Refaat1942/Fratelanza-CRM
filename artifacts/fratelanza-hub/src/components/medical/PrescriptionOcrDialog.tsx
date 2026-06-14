import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

export type OcrMedicine = {
  medicineName: string;
  medicineNameAr?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  durationDays?: number | null;
  instructions?: string | null;
  instructionsAr?: string | null;
};

type OcrResult = {
  medicines: OcrMedicine[];
  rawNotes?: string | null;
  disclaimer?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  visitId: string;
  onVisitIdChange: (v: string) => void;
  visits: { id: number; patientId: number; visitDate: string }[];
  patientLabel: (patientId: number) => string;
  onImported: () => void;
};

export function PrescriptionOcrDialog({
  open, onOpenChange, visitId, onVisitIdChange, visits, patientLabel, onImported,
}: Props) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [addToMaster, setAddToMaster] = useState(true);

  const scanMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("language", isAr ? "ar" : "en");
      return apiFetch<OcrResult>("/prescriptions/ocr-scan", { method: "POST", body: fd });
    },
    onSuccess: (data) => {
      setResult(data);
      const sel: Record<number, boolean> = {};
      data.medicines.forEach((_, i) => { sel[i] = true; });
      setSelected(sel);
      if (data.medicines.length === 0) {
        toast({ title: t("No medicines detected", "لم يُعثر على أدوية"), variant: "destructive" });
      }
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const importMut = useMutation({
    mutationFn: async () => {
      if (!visitId || !result) return;
      const meds = result.medicines.filter((_, i) => selected[i]);
      for (const m of meds) {
        await apiFetch("/prescriptions", {
          method: "POST",
          body: JSON.stringify({
            visitId: Number(visitId),
            medicineName: m.medicineName,
            medicineNameAr: m.medicineNameAr ?? null,
            dosage: m.dosage ?? null,
            frequency: m.frequency ?? null,
            durationDays: m.durationDays ?? null,
            instructions: m.instructions ?? null,
            instructionsAr: m.instructionsAr ?? null,
            notes: result.rawNotes ?? null,
            createMedicineIfMissing: addToMaster,
          }),
        });
      }
    },
    onSuccess: () => {
      toast({ title: t("Prescriptions imported", "تم استيراد الوصفات") });
      setResult(null);
      setPreview(null);
      onImported();
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const onFile = (file: File) => {
    setResult(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    scanMut.mutate(file);
  };

  const reset = () => {
    setResult(null);
    setPreview(null);
    setSelected({});
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={18} />
            {t("Scan prescription", "مسح الوصفة")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>{t("Visit", "الزيارة")}*</Label>
          <Select value={visitId} onValueChange={onVisitIdChange}>
            <SelectTrigger><SelectValue placeholder={t("Pick a visit", "اختر زيارة")} /></SelectTrigger>
            <SelectContent>
              {visits.slice(0, 100).map(v => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {patientLabel(v.patientId)} — {new Date(v.visitDate).toLocaleDateString(isAr ? "ar-EG" : undefined)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />

        {preview && (
          <img src={preview} alt="preview" className="w-full max-h-48 object-contain rounded border border-border" />
        )}

        <Button type="button" variant="outline" disabled={scanMut.isPending} onClick={() => fileRef.current?.click()}>
          {scanMut.isPending ? <Loader2 size={14} className="me-1.5 animate-spin" /> : <Camera size={14} className="me-1.5" />}
          {scanMut.isPending ? t("Reading…", "جاري القراءة…") : t("Take or upload photo", "التقاط أو رفع صورة")}
        </Button>

        {result && result.medicines.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
            <div className="flex items-center gap-2">
              <Checkbox id="add-master" checked={addToMaster} onCheckedChange={v => setAddToMaster(v === true)} />
              <Label htmlFor="add-master" className="text-xs font-normal">
                {t("Add unknown medicines to master", "إضافة الأدوية غير الموجودة للسجل")}
              </Label>
            </div>
            <ul className="space-y-2 border border-border rounded-md p-2 max-h-48 overflow-y-auto text-sm">
              {result.medicines.map((m, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <Checkbox
                    checked={selected[i] ?? false}
                    onCheckedChange={v => setSelected({ ...selected, [i]: v === true })}
                  />
                  <div>
                    <div className="font-medium">{isAr ? (m.medicineNameAr || m.medicineName) : m.medicineName}</div>
                    <div className="text-xs text-muted-foreground">
                      {[m.dosage, m.frequency, m.durationDays ? `${m.durationDays}d` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("Cancel", "إلغاء")}</Button>
          <Button
            type="button"
            disabled={!visitId || !result || importMut.isPending || !result.medicines.some((_, i) => selected[i])}
            onClick={() => importMut.mutate()}
          >
            {importMut.isPending ? t("Importing…", "جاري الاستيراد…") : t("Import selected", "استيراد المحدد")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
