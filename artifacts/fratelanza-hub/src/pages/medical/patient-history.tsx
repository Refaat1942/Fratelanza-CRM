import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ClipboardList, FileText, Pill, Receipt, User } from "lucide-react";

type PatientHistory = {
  patient: {
    id: number;
    firstName: string;
    firstNameAr?: string | null;
    lastName?: string | null;
    lastNameAr?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    bloodType?: string | null;
    allergies?: string | null;
    chronicConditions?: string | null;
    phone?: string | null;
    nationalId?: string | null;
  };
  visits: Array<any>;
  prescriptions: Array<any>;
  appointments: Array<any>;
  invoices: Array<any>;
};

function dateText(value?: string | null, locale?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(locale);
}

export default function PatientHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language, isRtl } = useLanguage();
  const isAr = language === "ar";
  const locale = isAr ? "ar-EG" : "en-US";
  const { data, isLoading } = useQuery<PatientHistory>({
    queryKey: ["patient-history", id],
    queryFn: () => apiFetch(`/patients/${id}/history`),
    enabled: !!id,
  });

  const p = data?.patient;
  const patientName = p
    ? isAr
      ? `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim()
      : `${p.firstName || p.firstNameAr || ""} ${p.lastName || p.lastNameAr || ""}`.trim()
    : "";

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-52" /><Skeleton className="h-52" /></div>;
  }

  if (!data || !p) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("Patient history was not found.", "لم يتم العثور على سجل المريض.")}</p>
        <Button asChild className="mt-4"><Link href="/medical/patients">{t("Back to patients", "العودة للمرضى")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <User size={15} /> {t("Patient QR History", "سجل المريض من QR")}
            </div>
            <h2 className="text-2xl font-bold">{patientName}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.gender && <Badge variant="outline">{p.gender}</Badge>}
              {p.bloodType && <Badge variant="outline" className="text-red-600 border-red-200">{p.bloodType}</Badge>}
              {p.phone && <Badge variant="secondary" dir="ltr">{p.phone}</Badge>}
              {p.nationalId && <Badge variant="secondary" dir="ltr">{p.nationalId}</Badge>}
            </div>
          </div>
          <Button asChild variant="outline"><Link href="/medical/patients">{t("Patients list", "قائمة المرضى")}</Link></Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList size={17} />{t("Clinical risks", "عوامل الخطورة")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><b>{t("Date of birth", "تاريخ الميلاد")}:</b> {dateText(p.dateOfBirth, locale)}</div>
            <div><b>{t("Allergies", "الحساسية")}:</b> {p.allergies || "—"}</div>
            <div><b>{t("Chronic conditions", "أمراض مزمنة")}:</b> {p.chronicConditions || "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar size={17} />{t("Appointments", "المواعيد")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.appointments.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : data.appointments.map(a => (
              <div key={a.id} className="text-sm border rounded p-2">
                <b>{dateText(a.startAt, locale)}</b> · {a.status}{(isAr ? a.reasonAr || a.reason : a.reason || a.reasonAr) ? ` · ${isAr ? a.reasonAr || a.reason : a.reason || a.reasonAr}` : ""}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText size={17} />{t("Visit history", "سجل الزيارات")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.visits.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : data.visits.map(v => (
            <div key={v.id} className="border rounded-md p-3 text-sm space-y-1">
              <div className="font-semibold">{dateText(v.visitDate, locale)}{v.doctorName ? ` · ${isAr ? v.doctorNameAr || v.doctorName : v.doctorName}` : ""}</div>
              <div><b>{t("Complaint", "الشكوى")}:</b> {isAr ? v.chiefComplaintAr || v.chiefComplaint || "—" : v.chiefComplaint || v.chiefComplaintAr || "—"}</div>
              <div><b>{t("Diagnosis", "التشخيص")}:</b> {isAr ? v.diagnosisAr || v.diagnosis || "—" : v.diagnosis || v.diagnosisAr || "—"}</div>
              <div><b>{t("Treatment", "العلاج")}:</b> {isAr ? v.treatmentAr || v.treatment || "—" : v.treatment || v.treatmentAr || "—"}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pill size={17} />{t("Prescriptions", "الوصفات")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.prescriptions.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : data.prescriptions.map(rx => (
              <div key={rx.id} className="border rounded p-2 text-sm">
                <b>{isAr ? rx.medicineNameAr || rx.medicineName : rx.medicineName}</b>
                {rx.bun ? <span className="text-muted-foreground"> · {rx.bun}</span> : null}
                <div className="text-muted-foreground">{[rx.dosage, rx.frequency, rx.durationDays ? `${rx.durationDays} ${t("days", "يوم")}` : null].filter(Boolean).join(" · ") || "—"}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt size={17} />{t("Invoices", "الفواتير")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.invoices.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : data.invoices.map(inv => (
              <div key={inv.id} className="border rounded p-2 text-sm flex justify-between gap-3">
                <span>{dateText(inv.invoiceDate, locale)} · {inv.status}</span>
                <b>{Number(inv.total || 0).toFixed(2)}</b>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
