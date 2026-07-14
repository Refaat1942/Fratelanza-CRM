import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "../LanguageProvider";
import { apiFetch } from "@/lib/api";
import QRCode from "qrcode";
import { QrCode, RefreshCw } from "lucide-react";

export function EmployeeClockQrDialog({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  clockToken,
  onTokenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeName: string;
  employeeId: number;
  clockToken: string | null | undefined;
  onTokenChange?: (token: string) => void;
}) {
  const { t } = useLanguage();
  const [token, setToken] = useState(clockToken ?? "");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const clockUrl = token
    ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/c/${token}`
    : "";

  useEffect(() => {
    setToken(clockToken ?? "");
  }, [clockToken, open]);

  useEffect(() => {
    if (!clockUrl) { setQrDataUrl(""); return; }
    QRCode.toDataURL(clockUrl, { width: 240, margin: 2 }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [clockUrl]);

  const regenerate = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ clockToken: string }>(`/employees/${employeeId}/regenerate-clock-token`, { method: "POST" });
      setToken(res.clockToken);
      onTokenChange?.(res.clockToken);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode size={20} className="text-primary" />
            {t("Clock badge", "بطاقة الحضور")} — {employeeName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" className="rounded-xl border shadow-sm" width={240} height={240} />
          ) : (
            <div className="w-[240px] h-[240px] rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm text-center p-4">
              {t("Generate a badge to enable scanning", "أنشئ بطاقة لتفعيل المسح")}
            </div>
          )}
          {clockUrl && (
            <p className="text-xs text-muted-foreground break-all text-center font-mono">{clockUrl}</p>
          )}
          <Button variant="outline" onClick={regenerate} disabled={loading} className="gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {token ? t("Regenerate badge", "إعادة إنشاء البطاقة") : t("Generate badge", "إنشاء البطاقة")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {t("Print this QR for the employee to scan at the clock kiosk", "اطبع هذا الرمز ليمسحه الموظف عند ساعة الحضور")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
