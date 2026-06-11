import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { publicApiFetch } from "@/lib/public-api";
import { useLanguage } from "@/components/LanguageProvider";
import { Stethoscope, Pill, CalendarClock, User } from "lucide-react";

type History = {
  patient: {
    firstName: string; firstNameAr: string | null;
    lastName: string | null; lastNameAr: string | null;
    gender: string | null; dateOfBirth: string | null;
    bloodType: string | null; allergies: string | null;
    chronicConditions: string | null;
  };
  visits: {
    id: number; visitDate: string;
    chiefComplaint: string | null; chiefComplaintAr: string | null;
    diagnosis: string | null; diagnosisAr: string | null;
    treatment: string | null; treatmentAr: string | null;
    doctorName: string | null; doctorNameAr: string | null;
  }[];
  prescriptions: {
    id: number; visitId: number;
    medicineName: string; medicineNameAr: string | null;
    dosage: string | null; frequency: string | null;
    durationDays: number | null;
    instructions: string | null; instructionsAr: string | null;
    createdAt: string;
  }[];
  appointments: {
    id: number; startAt: string; status: string;
    reason: string | null; reasonAr: string | null;
    doctorName: string | null; doctorNameAr: string | null;
  }[];
};

export default function PublicPatientHistory() {
  const [, params] = useRoute("/p/:token");
  const token = params?.token || "";
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [data, setData] = useState<History | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicApiFetch<History>(`/public/patient/${encodeURIComponent(token)}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const name = data
    ? (isAr
      ? `${data.patient.firstNameAr || data.patient.firstName} ${data.patient.lastNameAr || data.patient.lastName || ""}`.trim()
      : `${data.patient.firstName} ${data.patient.lastName || ""}`.trim())
    : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center text-slate-600">
          <p className="font-medium">{t("Record not found", "السجل غير موجود")}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <User size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{name}</h1>
              <p className="text-xs text-slate-500">{t("Medical history", "السجل الطبي")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {data.patient.bloodType && <div><span className="text-slate-500">{t("Blood type", "فصيلة الدم")}:</span> {data.patient.bloodType}</div>}
            {data.patient.allergies && <div className="col-span-2"><span className="text-slate-500">{t("Allergies", "الحساسية")}:</span> {data.patient.allergies}</div>}
            {data.patient.chronicConditions && <div className="col-span-2"><span className="text-slate-500">{t("Chronic conditions", "أمراض مزمنة")}:</span> {data.patient.chronicConditions}</div>}
          </div>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold flex items-center gap-2 mb-3 text-slate-800">
            <Stethoscope size={16} /> {t("Visits", "الزيارات")}
          </h2>
          {data.visits.length === 0 ? (
            <p className="text-sm text-slate-500">{t("No visits recorded", "لا توجد زيارات")}</p>
          ) : (
            <ul className="space-y-3">
              {data.visits.map(v => (
                <li key={v.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                  <div className="font-medium text-slate-800">{new Date(v.visitDate).toLocaleDateString(isAr ? "ar-EG" : undefined)}</div>
                  {(v.diagnosis || v.diagnosisAr) && (
                    <div className="text-slate-600 mt-1">{isAr ? (v.diagnosisAr || v.diagnosis) : v.diagnosis}</div>
                  )}
                  {(v.treatment || v.treatmentAr) && (
                    <div className="text-slate-500 text-xs mt-1">{isAr ? (v.treatmentAr || v.treatment) : v.treatment}</div>
                  )}
                  {(v.doctorName || v.doctorNameAr) && (
                    <div className="text-xs text-slate-400 mt-1">{isAr ? (v.doctorNameAr || v.doctorName) : v.doctorName}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold flex items-center gap-2 mb-3 text-slate-800">
            <Pill size={16} /> {t("Prescriptions", "الوصفات")}
          </h2>
          {data.prescriptions.length === 0 ? (
            <p className="text-sm text-slate-500">{t("No prescriptions", "لا توجد وصفات")}</p>
          ) : (
            <ul className="space-y-2">
              {data.prescriptions.map(rx => (
                <li key={rx.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                  <div className="font-medium">{isAr ? (rx.medicineNameAr || rx.medicineName) : rx.medicineName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {[rx.dosage, rx.frequency, rx.durationDays ? `${rx.durationDays} ${t("days", "يوم")}` : null].filter(Boolean).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold flex items-center gap-2 mb-3 text-slate-800">
            <CalendarClock size={16} /> {t("Appointments", "المواعيد")}
          </h2>
          {data.appointments.length === 0 ? (
            <p className="text-sm text-slate-500">{t("No appointments", "لا توجد مواعيد")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.appointments.map(a => (
                <li key={a.id} className="flex justify-between border-b border-slate-50 pb-2">
                  <span>{new Date(a.startAt).toLocaleString(isAr ? "ar-EG" : undefined)}</span>
                  <span className="text-slate-500">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
