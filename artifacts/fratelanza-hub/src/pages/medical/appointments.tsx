import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Plus, Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, User, Stethoscope,
  MessageCircle, Trash2, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { BranchSelect } from "@/components/BranchSelect";
import { useAuth } from "@/components/AuthProvider";

type Patient = { id: number; firstName: string; firstNameAr?: string | null; lastName?: string | null; lastNameAr?: string | null; phone?: string | null };
type Employee = { id: number; name: string; nameAr?: string | null; role?: string | null };

type Appointment = {
  id: number;
  patientId: number;
  doctorId: number | null;
  startAt: string;
  endAt: string | null;
  status: "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";
  reason: string | null;
  reasonAr: string | null;
  notes: string | null;
  patientFirstName: string | null;
  patientFirstNameAr: string | null;
  patientLastName: string | null;
  patientLastNameAr: string | null;
  patientPhone: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
};

const STATUS_META = {
  scheduled:  { en: "Scheduled", ar: "محجوز",   color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400", icon: CalIcon },
  confirmed:  { en: "Confirmed", ar: "مؤكد",    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  completed:  { en: "Completed", ar: "مكتمل",   color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400", icon: CheckCircle2 },
  no_show:    { en: "No-show",   ar: "لم يحضر", color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertCircle },
  cancelled:  { en: "Cancelled", ar: "ملغي",    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
} as const;

function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: true });
}

const EMPTY_FORM = {
  patientId: "",
  doctorId: "",
  date: ymd(new Date()),
  time: "10:00",
  durationMin: "30",
  reason: "",
  reasonAr: "",
  notes: "",
  branchId: null as number | null,
};

export default function Appointments() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const { user } = useAuth();
  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, branchId: user?.branchId ?? null });

  const from = day;
  const to = addDays(day, 1);

  const { data: appts, isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments", ymd(day)],
    queryFn: () => apiFetch(`/appointments?from=${from.toISOString()}&to=${to.toISOString()}`),
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => apiFetch("/patients"),
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });

  // Mini 7-day overview (counts per day)
  const weekFrom = day;
  const weekTo = addDays(day, 7);
  const { data: weekAppts } = useQuery<Appointment[]>({
    queryKey: ["appointments-week", ymd(day)],
    queryFn: () => apiFetch(`/appointments?from=${weekFrom.toISOString()}&to=${weekTo.toISOString()}`),
  });
  const weekCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (let i = 0; i < 7; i++) m[ymd(addDays(day, i))] = 0;
    for (const a of weekAppts || []) {
      const k = ymd(new Date(a.startAt));
      if (k in m) m[k]++;
    }
    return m;
  }, [weekAppts, day]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["appointments-week"] });
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const startAt = new Date(`${form.date}T${form.time}:00`);
      const endAt = new Date(startAt.getTime() + Number(form.durationMin) * 60 * 1000);
      return apiFetch<Appointment>("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(form.patientId),
          doctorId: form.doctorId ? Number(form.doctorId) : null,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          reason: form.reason || null,
          reasonAr: form.reasonAr || null,
          notes: form.notes || null,
          branchId: form.branchId ?? null,
        }),
      });
    },
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      setForm({ ...EMPTY_FORM });
      toast({ title: t("Appointment booked", "تم حجز الموعد") });
    },
    onError: (e: Error) => {
      const msg = e.message?.includes("409") ? t("This doctor already has an overlapping appointment.", "هذا الطبيب لديه موعد متداخل بالفعل.") : (e.message || t("Error", "خطأ"));
      toast({ title: msg, variant: "destructive" });
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Appointment["status"] }) =>
      apiFetch<Appointment>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { invalidate(); toast({ title: t("Status updated", "تم تحديث الحالة") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/appointments/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Appointment deleted", "تم حذف الموعد") }); },
  });

  const patientName = (a: Appointment) => {
    if (isAr) {
      return `${a.patientFirstNameAr || a.patientFirstName || ""} ${a.patientLastNameAr || a.patientLastName || ""}`.trim() || "—";
    }
    return `${a.patientFirstName || ""} ${a.patientLastName || ""}`.trim() || "—";
  };
  const doctorName = (a: Appointment) =>
    a.doctorId ? (isAr ? (a.doctorNameAr || a.doctorName) : a.doctorName) : null;

  const patientLabel = (p: Patient) => {
    if (isAr) return `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim();
    return `${p.firstName} ${p.lastName || ""}`.trim();
  };
  const employeeLabel = (e: Employee) => isAr ? (e.nameAr || e.name) : e.name;

  const sendWhatsAppReminder = (a: Appointment) => {
    if (!a.patientPhone) {
      toast({ title: t("Patient has no phone number", "المريض ليس لديه رقم هاتف"), variant: "destructive" });
      return;
    }
    const when = new Date(a.startAt).toLocaleString(isAr ? "ar-EG" : "en-US", {
      weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    });
    const drName = doctorName(a) || (isAr ? "الطبيب" : "the doctor");
    const msg = isAr
      ? `السلام عليكم ${patientName(a)},\nنذكركم بموعدكم مع ${drName} يوم ${when}. شكرًا.`
      : `Hello ${patientName(a)},\nReminder: your appointment with ${drName} is on ${when}. Thank you.`;
    openWhatsApp(a.patientPhone, msg);
  };

  const dateLocale = isAr ? "ar-EG" : "en-US";
  const dayLabel = day.toLocaleDateString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const isToday = ymd(day) === ymd(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Appointments", "المواعيد")}</h2>
          <p className="text-muted-foreground">{t("Schedule and manage patient visits", "جدولة وإدارة مواعيد المرضى")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm({ ...EMPTY_FORM, date: ymd(day), branchId: user?.branchId ?? null }); }}>
          <DialogTrigger asChild>
            <Button data-testid="btn-create-appointment" className="shrink-0 gap-2" onClick={() => setForm({ ...EMPTY_FORM, date: ymd(day), branchId: user?.branchId ?? null })}>
              <Plus size={16}/>{t("New Appointment", "موعد جديد")}
            </Button>
          </DialogTrigger>
          <DialogContent className={`max-w-lg ${isRtl ? "rtl" : "ltr"}`}>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}>
              <DialogHeader><DialogTitle>{t("New Appointment", "موعد جديد")}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t("Patient *", "المريض *")}</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })} required>
                    <SelectTrigger><SelectValue placeholder={t("Select patient", "اختر مريض")} /></SelectTrigger>
                    <SelectContent>
                      {(patients || []).map(p => <SelectItem key={p.id} value={String(p.id)}>{patientLabel(p)}{p.phone ? ` · ${p.phone}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {(!patients || patients.length === 0) && <p className="text-xs text-amber-600">{t("Add a patient first in the Patients page.", "أضف مريضًا أولاً من صفحة المرضى.")}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t("Doctor", "الطبيب")}</Label>
                  <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                    <SelectTrigger><SelectValue placeholder={t("Optional — pick a doctor", "اختياري — اختر طبيبًا")} /></SelectTrigger>
                    <SelectContent>
                      {(employees || []).map(e => <SelectItem key={e.id} value={String(e.id)}>{employeeLabel(e)}{e.role ? ` · ${e.role}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>{t("Date *", "التاريخ *")}</Label>
                    <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Time *", "الوقت *")}</Label>
                    <Input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Duration (min)", "المدة (دقيقة)")}</Label>
                    <Select value={form.durationMin} onValueChange={(v) => setForm({ ...form, durationMin: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["15","30","45","60","90","120"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("Reason / Chief complaint", "السبب / الشكوى الرئيسية")}</Label>
                  <Input
                    dir={isAr ? "rtl" : "ltr"}
                    value={isAr ? form.reasonAr : form.reason}
                    onChange={(e) => isAr ? setForm({ ...form, reasonAr: e.target.value }) : setForm({ ...form, reason: e.target.value })}
                    placeholder={t("e.g. follow-up, dental cleaning", "مثل: متابعة، تنظيف أسنان")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("Internal notes", "ملاحظات داخلية")}</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <BranchSelect value={form.branchId} onChange={(id) => setForm({ ...form, branchId: id })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || !form.patientId}>{t("Book", "حجز")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Day navigator */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, -1))}><ChevronLeft size={16} /></Button>
            <Input type="date" value={ymd(day)} onChange={(e) => setDay(startOfDay(new Date(e.target.value)))} className="w-44" />
            <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, 1))}><ChevronRight size={16} /></Button>
            {!isToday && <Button variant="ghost" size="sm" onClick={() => setDay(startOfDay(new Date()))}>{t("Today", "اليوم")}</Button>}
          </div>
          <p className="text-sm font-medium text-muted-foreground">{dayLabel}</p>
        </CardContent>
      </Card>

      {/* 7-day overview */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(day, i);
          const key = ymd(d);
          const count = weekCounts[key] || 0;
          const active = i === 0;
          return (
            <button
              key={key}
              onClick={() => setDay(d)}
              className={`p-2 rounded border text-center transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}
              data-testid={`day-${key}`}
            >
              <div className="text-xs text-muted-foreground">{d.toLocaleDateString(dateLocale, { weekday: "short" })}</div>
              <div className="text-lg font-bold">{d.getDate()}</div>
              <div className="text-xs">{count > 0 ? <Badge variant="secondary" className="text-[10px]">{count}</Badge> : <span className="text-muted-foreground/40">—</span>}</div>
            </button>
          );
        })}
      </div>

      {/* Day list */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !appts || appts.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <CalIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t("No appointments on this day.", "لا توجد مواعيد في هذا اليوم.")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appts.map(a => {
            const meta = STATUS_META[a.status];
            const StatusIcon = meta.icon;
            return (
              <Card key={a.id} className="hover:border-primary/50 transition-colors" data-testid={`appt-${a.id}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex items-center gap-3 sm:w-32 shrink-0">
                    <div className="w-12 h-12 rounded bg-primary/10 text-primary flex flex-col items-center justify-center">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="font-mono font-bold">{fmtTime(a.startAt, dateLocale)}</p>
                      {a.endAt && <p className="text-xs text-muted-foreground font-mono">→ {fmtTime(a.endAt, dateLocale)}</p>}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      {patientName(a)}
                    </p>
                    {doctorName(a) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Stethoscope size={12} />
                        {doctorName(a)}
                      </p>
                    )}
                    {(isAr ? a.reasonAr || a.reason : a.reason || a.reasonAr) && (
                      <p className="text-sm mt-1">{isAr ? (a.reasonAr || a.reason) : (a.reason || a.reasonAr)}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge className={meta.color} variant="outline">
                      <StatusIcon size={11} className={isRtl ? "ml-1" : "mr-1"} />
                      {isAr ? meta.ar : meta.en}
                    </Badge>
                    <Select value={a.status} onValueChange={(v) => statusMut.mutate({ id: a.id, status: v as Appointment["status"] })}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map(k => (
                          <SelectItem key={k} value={k} className="text-xs">{isAr ? STATUS_META[k].ar : STATUS_META[k].en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {a.patientPhone && (
                      <Button variant="outline" size="sm"
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                        onClick={() => sendWhatsAppReminder(a)}
                        title={t("Send WhatsApp reminder", "إرسال تذكير واتساب")}
                        data-testid={`btn-whatsapp-appt-${a.id}`}>
                        <MessageCircle size={14} />
                      </Button>
                    )}
                    <Button variant="outline" size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                      onClick={() => confirmDelete({
                        title: t("Delete appointment?", "حذف الموعد؟"),
                        onConfirm: async () => deleteMut.mutate(a.id),
                      })}
                      data-testid={`btn-delete-appt-${a.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
