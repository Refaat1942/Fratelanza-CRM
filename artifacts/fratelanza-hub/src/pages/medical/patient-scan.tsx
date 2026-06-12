import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui-ext/page-header";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Search, User, Phone, IdCard, AlertTriangle } from "lucide-react";

type Patient = {
  id: number;
  firstName: string; lastName?: string | null;
  firstNameAr?: string | null; lastNameAr?: string | null;
  phone?: string | null; nationalId?: string | null;
  bloodType?: string | null; allergies?: string | null;
  chronicConditions?: string | null;
  governorate?: string | null; city?: string | null;
  dateOfBirth?: string | null;
  qrToken?: string | null;
};

function extractToken(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    const t = u.searchParams.get("t");
    if (t) return t;
  } catch { /* not a URL */ }
  if (s.startsWith("PAT:")) return s.slice(4);
  if (/^[a-f0-9]{20,}$/i.test(s)) return s;
  return s;
}

export default function PatientScanPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [token, setToken] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "patient-qr-reader";

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ["patient-scan", activeToken],
    queryFn: () => apiFetch(`/patients/scan/${encodeURIComponent(activeToken)}`),
    enabled: !!activeToken,
    retry: false,
  });

  const lookup = (value: string) => {
    const tok = extractToken(value);
    if (tok) setActiveToken(tok);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t0 = params.get("t");
    if (t0) {
      setToken(t0);
      setActiveToken(t0);
    }
  }, []);

  const startCamera = async () => {
    if (scanning) return;
    setScanning(true);
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          setToken(decoded);
          lookup(decoded);
          void stopCamera();
        },
        () => {},
      );
    } catch {
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    const s = scannerRef.current;
    if (s?.isScanning) {
      try { await s.stop(); } catch { /* ignore */ }
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => { void stopCamera(); }, []);

  const fullName = (p: Patient) =>
    isAr
      ? `${p.firstNameAr ?? p.firstName} ${p.lastNameAr ?? p.lastName ?? ""}`.trim()
      : `${p.firstName} ${p.lastName ?? ""}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<QrCode size={20} />}
        title={t("Scan patient QR", "مسح QR المريض")}
        description={t("Scan the patient card or paste the token to open their record instantly.", "امسح بطاقة المريض أو الصق الرمز لفتح السجل فوراً.")}
      />

      <SectionCard>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t("Paste QR URL or token…", "الصق رابط QR أو الرمز…")}
                onKeyDown={(e) => e.key === "Enter" && lookup(token)}
              />
              <Button type="button" onClick={() => lookup(token)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!scanning ? (
                <Button type="button" variant="secondary" onClick={() => void startCamera()}>
                  {t("Open camera scanner", "فتح كاميرا المسح")}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => void stopCamera()}>
                  {t("Stop camera", "إيقاف الكاميرا")}
                </Button>
              )}
            </div>
            <div id={readerId} className="max-w-sm rounded border overflow-hidden min-h-[200px]" />
          </div>

          <div className="rounded-lg border bg-card p-4 min-h-[240px]">
            {!activeToken && (
              <p className="text-muted-foreground text-sm">{t("Scan or search to view patient details.", "امسح أو ابحث لعرض بيانات المريض.")}</p>
            )}
            {activeToken && isLoading && <p>{t("Loading…", "جاري التحميل…")}</p>}
            {activeToken && error && (
              <p className="text-destructive">{t("Patient not found for this QR.", "لم يُعثر على مريض لهذا الرمز.")}</p>
            )}
            {patient && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{fullName(patient)}</h3>
                  <Badge variant="outline">#{patient.id}</Badge>
                </div>
                {patient.phone && (
                  <p className="flex items-center gap-2 text-sm"><Phone size={14} /> <span dir="ltr">{patient.phone}</span></p>
                )}
                {patient.nationalId && (
                  <p className="flex items-center gap-2 text-sm"><IdCard size={14} /> <span dir="ltr">{patient.nationalId}</span></p>
                )}
                {patient.bloodType && <p className="text-sm">{t("Blood type", "فصيلة الدم")}: <b>{patient.bloodType}</b></p>}
                {(patient.governorate || patient.city) && (
                  <p className="text-sm">{t("Location", "الموقع")}: {[patient.governorate, patient.city].filter(Boolean).join(" · ")}</p>
                )}
                {patient.dateOfBirth && (
                  <p className="text-sm">{t("Date of birth", "تاريخ الميلاد")}: {patient.dateOfBirth}</p>
                )}
                {patient.allergies && (
                  <div className="flex gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 text-sm">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span><b>{t("Allergies", "حساسية")}:</b> {patient.allergies}</span>
                  </div>
                )}
                {patient.chronicConditions && (
                  <p className="text-sm"><b>{t("Chronic conditions", "أمراض مزمنة")}:</b> {patient.chronicConditions}</p>
                )}
                <Button variant="outline" size="sm" asChild>
                  <a href={`/medical/patients`}>{t("Open patients list", "فتح قائمة المرضى")}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
