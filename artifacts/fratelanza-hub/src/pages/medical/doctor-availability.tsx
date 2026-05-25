import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui-ext/page-header";
import { SectionCard } from "@/components/ui-ext/section-card";
import { EmptyState } from "@/components/ui-ext/empty-state";

type Window = {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  branchId: number | null;
  doctorName?: string | null;
  doctorNameAr?: string | null;
};

type Employee = { id: number; name: string; nameAr?: string | null; role?: string | null };

const DAYS = [
  { idx: 0, en: "Sunday",    ar: "الأحد" },
  { idx: 1, en: "Monday",    ar: "الإثنين" },
  { idx: 2, en: "Tuesday",   ar: "الثلاثاء" },
  { idx: 3, en: "Wednesday", ar: "الأربعاء" },
  { idx: 4, en: "Thursday",  ar: "الخميس" },
  { idx: 5, en: "Friday",    ar: "الجمعة" },
  { idx: 6, en: "Saturday",  ar: "السبت" },
];

export default function DoctorAvailabilityPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [newDay, setNewDay] = useState<number>(1);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });

  const { data: windows, isLoading } = useQuery<Window[]>({
    queryKey: ["doctor-availability", doctorId],
    queryFn: () => apiFetch(`/doctor-availability${doctorId ? `?doctorId=${doctorId}` : ""}`),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["doctor-availability"] });

  const createMut = useMutation({
    mutationFn: (data: Partial<Window>) =>
      apiFetch<Window>("/doctor-availability", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); toast({ title: t("Window added", "تمت إضافة الفترة") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/doctor-availability/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Window removed", "تم حذف الفترة") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const doctors = (employees || []).filter((e) => !e.role || /doctor|طبيب/i.test(e.role));
  const docName = (e: Employee) => (isAr ? (e.nameAr || e.name) : (e.name || e.nameAr || ""));

  const handleAdd = () => {
    if (!doctorId) { toast({ title: t("Pick a doctor first", "اختر الطبيب أولاً"), variant: "destructive" }); return; }
    if (newEnd <= newStart) { toast({ title: t("End must be after start", "يجب أن يكون وقت الانتهاء بعد البداية"), variant: "destructive" }); return; }
    createMut.mutate({ doctorId, dayOfWeek: newDay, startTime: newStart, endTime: newEnd });
  };

  // Group windows by day for the selected doctor.
  const byDay = new Map<number, Window[]>();
  for (const w of windows || []) {
    if (doctorId && w.doctorId !== doctorId) continue;
    const arr = byDay.get(w.dayOfWeek) || [];
    arr.push(w);
    byDay.set(w.dayOfWeek, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Clock size={20} />}
        title={t("Doctor Availability", "ساعات عمل الأطباء")}
        description={t("Define when each doctor is available. Appointments outside these hours are blocked.", "حدد الأوقات التي يكون فيها كل طبيب متاحاً. سيتم رفض المواعيد خارج هذه الأوقات.")}
      />

      <SectionCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Doctor", "الطبيب")}</Label>
            <Select value={doctorId ? String(doctorId) : ""} onValueChange={(v) => setDoctorId(v ? parseInt(v, 10) : null)}>
              <SelectTrigger><SelectValue placeholder={t("Select a doctor", "اختر طبيباً")} /></SelectTrigger>
              <SelectContent>
                {(doctors.length ? doctors : (employees || [])).map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>{docName(e)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {doctors.length === 0 && (employees || []).length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("No employees with role 'doctor' — showing all staff.", "لا يوجد موظفون بمسمى 'طبيب' — عرض الكل.")}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {doctorId && (
        <SectionCard title={t("Add availability window", "إضافة فترة عمل")}>
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("Day", "اليوم")}</Label>
              <Select value={String(newDay)} onValueChange={(v) => setNewDay(parseInt(v, 10))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d.idx} value={String(d.idx)}>{isAr ? d.ar : d.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("Start time", "وقت البداية")}</Label>
              <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("End time", "وقت النهاية")}</Label>
              <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={createMut.isPending} className="gap-1.5">
              <Plus size={16} />{t("Add", "إضافة")}
            </Button>
          </div>
        </SectionCard>
      )}

      {doctorId ? (
        isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS.map((d) => {
              const dayWindows = byDay.get(d.idx) || [];
              return (
                <Card key={d.idx} className={dayWindows.length === 0 ? "opacity-60" : ""}>
                  <CardContent className="p-4 space-y-2">
                    <div className="font-semibold text-sm">{isAr ? d.ar : d.en}</div>
                    {dayWindows.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">{t("Off — no availability", "إجازة")}</p>
                    ) : (
                      dayWindows
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((w) => (
                          <div key={w.id} className="flex items-center justify-between bg-muted/40 rounded px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock size={13} className="text-primary" />
                              <span dir="ltr">{w.startTime}–{w.endTime}</span>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMut.mutate(w.id)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <EmptyState
          icon={<Clock size={22} />}
          title={t("Select a doctor", "اختر طبيباً")}
          description={t("Pick a doctor above to view and edit their weekly availability.", "اختر طبيباً من الأعلى لعرض وتعديل ساعات عمله الأسبوعية.")}
        />
      )}
    </div>
  );
}
