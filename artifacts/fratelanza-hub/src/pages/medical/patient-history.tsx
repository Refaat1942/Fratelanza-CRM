import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CalendarClock, FileText, Pill, User, ArrowLeft, AlertTriangle } from "lucide-react";

type Patient = {
  id: number;
  firstName: string;
  firstNameAr?: string | null;
  lastName?: string | null;
  lastNameAr?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  notes?: string | null;
  notesAr?: string | null;
};

type HistoryResponse = {
  patient: Patient;
  visits: Array<any>;
  prescriptions: Array<any>;
  appointments: Array<any>;
};

function patientIdFromPath(): number {
  const last = window.location.pathname.split("/").filter(Boolean).pop();
  return Number(last);
}

export default function PatientHistoryPage() {
  const { t, language, isRtl } = useLanguage();
  const isAr = language === "ar";
  const [, navigate] = useLocation();
  const patientId = patientIdFromPath();
  const { data, isLoading, error } = useQuery<HistoryResponse>({
    queryKey: ["patient-history", patientId],
    queryFn: () => apiFetch(`/patients/${patientId}/history`),
    enabled: Number.isFinite(patientId) && patientId > 0,
  });

  const name = (p?: Patient) => {
    if (!p) return "—";
    return isAr
      ? `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim()
      : `${p.firstName || p.firstNameAr || ""} ${p.lastName || p.lastNameAr || ""}`.trim();
  };
  const date = (value?: string | null) => value ? new Date(value).toLocaleString(isAr ? "ar-EG" : undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
  const shortDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(isAr ? "ar-EG" : undefined) : "—";
  const doctor = (row: any) => isAr ? (row.doctorNameAr || row.doctorName) : row.doctorName;

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <AlertTriangle className="mx-auto mb-3 text-destructive" />
        <h2 className="text-xl font-semibold">{t("Patient history not found", "لم يتم العثور على سجل المريض")}</h2>
        <Button className="mt-4" onClick={() => navigate("/medical/patients")}>{t("Back to patients", "العودة للمرضى")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 gap-1" onClick={() => navigate("/medical/patients")}>
            <ArrowLeft size={14} />{t("Patients", "المرضى")}
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2"><User className="text-primary" />{name(data.patient)}</h1>
          <p className="text-sm text-muted-foreground">{t("Complete history from scanned QR", "السجل الكامل من رمز QR")}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{t("Visits", "الزيارات")}: {data.visits.length}</Badge>
          <Badge variant="outline">{t("Prescriptions", "الوصفات")}: {data.prescriptions.length}</Badge>
          <Badge variant="outline">{t("Appointments", "المواعيد")}: {data.appointments.length}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("Patient profile", "ملف المريض")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-xs text-muted-foreground">{t("Phone", "الهاتف")}</div><div dir="ltr">{data.patient.phone || "—"}</div></div>
          <div><div className="text-xs text-muted-foreground">{t("Date of birth", "تاريخ الميلاد")}</div><div>{shortDate(data.patient.dateOfBirth)}</div></div>
          <div><div className="text-xs text-muted-foreground">{t("Blood type", "فصيلة الدم")}</div><div>{data.patient.bloodType || "—"}</div></div>
          <div><div className="text-xs text-muted-foreground">{t("Gender", "النوع")}</div><div>{data.patient.gender || "—"}</div></div>
          {(data.patient.allergies || data.patient.chronicConditions) && (
            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
              <div><div className="text-xs text-muted-foreground">{t("Allergies", "الحساسية")}</div><div>{data.patient.allergies || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">{t("Chronic conditions", "الأمراض المزمنة")}</div><div>{data.patient.chronicConditions || "—"}</div></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText size={16}/>{t("Visits", "الزيارات")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.visits.length === 0 ? <div className="text-sm text-muted-foreground">{t("No visits recorded.", "لا توجد زيارات مسجلة.")}</div> : data.visits.map(v => (
            <div key={v.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-medium">
                <span>{date(v.visitDate)}</span>
                {doctor(v) && <span className="text-muted-foreground">{doctor(v)}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                <div><div className="text-xs text-muted-foreground">{t("Complaint", "الشكوى")}</div>{isAr ? (v.chiefComplaintAr || v.chiefComplaint || "—") : (v.chiefComplaint || v.chiefComplaintAr || "—")}</div>
                <div><div className="text-xs text-muted-foreground">{t("Diagnosis", "التشخيص")}</div>{isAr ? (v.diagnosisAr || v.diagnosis || "—") : (v.diagnosis || v.diagnosisAr || "—")}</div>
                <div><div className="text-xs text-muted-foreground">{t("Treatment", "العلاج")}</div>{isAr ? (v.treatmentAr || v.treatment || "—") : (v.treatment || v.treatmentAr || "—")}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pill size={16}/>{t("Prescriptions", "الوصفات الطبية")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.prescriptions.length === 0 ? <div className="text-sm text-muted-foreground">{t("No prescriptions recorded.", "لا توجد وصفات مسجلة.")}</div> : data.prescriptions.map(p => (
              <div key={p.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{isAr ? (p.medicineNameAr || p.medicineName) : p.medicineName}</div>
                <div className="text-xs text-muted-foreground mt-1">{[p.dosage, p.frequency, p.durationDays ? `${p.durationDays} ${t("days", "يوم")}` : null, p.medicineUnit].filter(Boolean).join(" · ")}</div>
                {p.instructions && <div className="mt-2">{p.instructions}</div>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock size={16}/>{t("Appointments", "المواعيد")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.appointments.length === 0 ? <div className="text-sm text-muted-foreground">{t("No appointments recorded.", "لا توجد مواعيد مسجلة.")}</div> : data.appointments.map(a => (
              <div key={a.id} className="rounded-lg border p-3 text-sm flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{date(a.startAt)}</div>
                  <div className="text-xs text-muted-foreground">{isAr ? (a.reasonAr || a.reason || "—") : (a.reason || a.reasonAr || "—")}</div>
                </div>
                <Badge variant="outline" className="shrink-0"><Activity size={11} className="me-1"/>{a.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
