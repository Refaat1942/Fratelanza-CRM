import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { useLangField } from "@/lib/lang-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Grid3x3, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui-ext/page-header";
import { SectionCard } from "@/components/ui-ext/section-card";
import { EmptyState } from "@/components/ui-ext/empty-state";

type Patient = {
  id: number;
  firstName: string; firstNameAr?: string | null;
  lastName?: string | null; lastNameAr?: string | null;
};

type ChartEntry = {
  id: number | null;
  patientId: number;
  toothNumber: number;
  condition: string;
  notes: string | null;
  notesAr: string | null;
};

const UPPER_RIGHT = [18,17,16,15,14,13,12,11];
const UPPER_LEFT  = [21,22,23,24,25,26,27,28];
const LOWER_RIGHT = [48,47,46,45,44,43,42,41];
const LOWER_LEFT  = [31,32,33,34,35,36,37,38];

const CONDITIONS: { key: string; en: string; ar: string; color: string }[] = [
  { key: "healthy",    en: "Healthy",      ar: "سليم",          color: "bg-white border-slate-300 text-slate-700" },
  { key: "cavity",     en: "Cavity",       ar: "تسوس",          color: "bg-amber-100 border-amber-400 text-amber-800" },
  { key: "filled",     en: "Filled",       ar: "محشو",          color: "bg-sky-100 border-sky-400 text-sky-800" },
  { key: "crown",      en: "Crown",        ar: "تاج",           color: "bg-violet-100 border-violet-400 text-violet-800" },
  { key: "root_canal", en: "Root Canal",   ar: "علاج عصب",      color: "bg-emerald-100 border-emerald-400 text-emerald-800" },
  { key: "missing",    en: "Missing",      ar: "مفقود",         color: "bg-slate-200 border-slate-400 text-slate-500" },
  { key: "extracted",  en: "Extracted",    ar: "مخلوع",         color: "bg-red-100 border-red-400 text-red-800" },
  { key: "implant",    en: "Implant",      ar: "زراعة",         color: "bg-cyan-100 border-cyan-400 text-cyan-800" },
  { key: "bridge",     en: "Bridge",       ar: "جسر",           color: "bg-indigo-100 border-indigo-400 text-indigo-800" },
  { key: "other",      en: "Other",        ar: "أخرى",          color: "bg-zinc-100 border-zinc-400 text-zinc-700" },
];

const condColor = (c: string) => CONDITIONS.find(x => x.key === c)?.color || CONDITIONS[0].color;

export default function DentalChart() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const lf = useLangField();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [editTooth, setEditTooth] = useState<ChartEntry | null>(null);
  const [editForm, setEditForm] = useState<{ condition: string; notes: string; notesAr: string }>({
    condition: "healthy", notes: "", notesAr: "",
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients", search],
    queryFn: () => apiFetch(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const { data: chart, isLoading: chartLoading } = useQuery<ChartEntry[]>({
    queryKey: ["dental-chart", selectedPatientId],
    queryFn: () => apiFetch(`/patients/${selectedPatientId}/dental-chart`),
    enabled: selectedPatientId !== null,
  });

  const saveMut = useMutation({
    mutationFn: ({ tooth, body }: { tooth: number; body: any }) =>
      apiFetch(`/patients/${selectedPatientId}/dental-chart/${tooth}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dental-chart", selectedPatientId] });
      setEditTooth(null);
      toast({ title: t("Tooth updated", "تم تحديث السن") });
    },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const byTooth = useMemo(() => {
    const m = new Map<number, ChartEntry>();
    (chart || []).forEach(e => m.set(e.toothNumber, e));
    return m;
  }, [chart]);

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  const fullName = (p: Patient) =>
    isAr
      ? `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim()
      : `${p.firstName || p.firstNameAr} ${p.lastName || p.lastNameAr || ""}`.trim();

  const openTooth = (n: number) => {
    const entry = byTooth.get(n) || {
      id: null, patientId: selectedPatientId!, toothNumber: n, condition: "healthy", notes: null, notesAr: null,
    };
    setEditTooth(entry);
    setEditForm({ condition: entry.condition, notes: entry.notes || "", notesAr: entry.notesAr || "" });
  };

  const submitTooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTooth) return;
    // Strict per-language: send active-language notes, OMIT the inactive side so upsert
    // does not wipe previously-saved opposite-language notes on existing entries.
    const body: any = { condition: editForm.condition };
    if (isAr) body.notesAr = editForm.notesAr || null;
    else body.notes = editForm.notes || null;
    saveMut.mutate({ tooth: editTooth.toothNumber, body });
  };

  const Tooth = ({ n }: { n: number }) => {
    const e = byTooth.get(n);
    const c = e?.condition || "healthy";
    const color = condColor(c);
    return (
      <button
        type="button"
        onClick={() => openTooth(n)}
        className={`w-9 h-11 sm:w-10 sm:h-12 rounded-md border-2 ${color} flex flex-col items-center justify-center text-[10px] font-bold hover:scale-110 hover:shadow-md transition-all`}
        title={`${n} — ${CONDITIONS.find(x => x.key === c)?.[isAr ? "ar" : "en"]}`}
        data-testid={`tooth-${n}`}
      >
        <span className="tabular-nums leading-none">{n}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Grid3x3 size={20} />}
        title={t("Dental Chart", "خريطة الأسنان")}
        description={t("Pick a patient, click any tooth to record its condition. FDI numbering (11-48).", "اختر المريض، اضغط على أي سن لتسجيل حالته. ترقيم FDI (11-48).")}
      />

      <SectionCard
        title={t("Select Patient", "اختر المريض")}
        actions={
          <div className="relative w-full sm:w-72">
            <Search size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-2.5" : "left-2.5"} text-muted-foreground`} />
            <Input dir={lf.dir} placeholder={t("Search patient…", "ابحث عن مريض…")}
              value={search} onChange={e => setSearch(e.target.value)}
              className={`h-8 ${isRtl ? "pr-8" : "pl-8"}`} />
          </div>
        }
      >
        {!patients ? (
          <Skeleton className="h-10 w-full" />
        ) : patients.length === 0 ? (
          <EmptyState icon={<Users size={20} />} title={t("No matching patients", "لا يوجد مرضى مطابقون")} />
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {patients.slice(0, 30).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                  selectedPatientId === p.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-card-border hover:border-primary/40 hover:bg-accent"
                }`}
                data-testid={`patient-pick-${p.id}`}
              >
                {fullName(p)}
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {selectedPatientId === null ? (
        <SectionCard>
          <EmptyState
            icon={<Grid3x3 size={22} />}
            title={t("No patient selected", "لم يتم اختيار مريض")}
            description={t("Pick a patient above to view and edit their dental chart.", "اختر مريضًا أعلاه لعرض وتعديل خريطة أسنانه.")}
          />
        </SectionCard>
      ) : chartLoading ? (
        <SectionCard><Skeleton className="h-64 w-full" /></SectionCard>
      ) : (
        <SectionCard
          title={selectedPatient ? fullName(selectedPatient) : ""}
          description={t("Click a tooth to update its condition", "اضغط على أي سن لتحديث حالته")}
        >
          {/* Always render the chart left-to-right with patient's right (#1x) on viewer's left */}
          <div dir="ltr" className="space-y-4 select-none">
            <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("Upper jaw", "الفك العلوي")}
            </div>
            <div className="flex justify-center items-center gap-1 flex-wrap">
              {UPPER_RIGHT.map(n => <Tooth key={n} n={n} />)}
              <div className="w-1.5 h-12 bg-border mx-1" />
              {UPPER_LEFT.map(n => <Tooth key={n} n={n} />)}
            </div>
            <div className="border-t border-dashed border-border my-3" />
            <div className="flex justify-center items-center gap-1 flex-wrap">
              {LOWER_RIGHT.map(n => <Tooth key={n} n={n} />)}
              <div className="w-1.5 h-12 bg-border mx-1" />
              {LOWER_LEFT.map(n => <Tooth key={n} n={n} />)}
            </div>
            <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("Lower jaw", "الفك السفلي")}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("Legend", "المفتاح")}</div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <div key={c.key} className={`flex items-center gap-1.5 px-2 py-1 rounded border-2 ${c.color} text-[11px] font-medium`}>
                  <div className="w-2.5 h-2.5 rounded-sm border" />
                  {isAr ? c.ar : c.en}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      <Dialog open={editTooth !== null} onOpenChange={o => { if (!o) setEditTooth(null); }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("Tooth", "السن")} #{editTooth?.toothNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitTooth}>
            <div className="grid gap-3 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("Condition", "الحالة")}</Label>
                <Select value={editForm.condition} onValueChange={v => setEditForm({ ...editForm, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => <SelectItem key={c.key} value={c.key}>{isAr ? c.ar : c.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("Notes", "ملاحظات")}</Label>
                <Textarea rows={3} dir={lf.dir}
                  value={isAr ? editForm.notesAr : editForm.notes}
                  onChange={e => isAr
                    ? setEditForm({ ...editForm, notesAr: e.target.value })
                    : setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMut.isPending}>{t("Save", "حفظ")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
