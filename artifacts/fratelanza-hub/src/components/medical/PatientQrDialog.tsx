import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Copy, QrCode, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientName: string;
  patientId?: number;
  qrToken: string | null | undefined;
  onTokenChange?: (token: string) => void;
};

export function PatientQrDialog({
  open, onOpenChange, patientName, patientId, qrToken, onTokenChange,
}: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [token, setToken] = useState(qrToken ?? "");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(qrToken ?? "");
  }, [qrToken, open]);

  const scanUrl = token
    ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/p/${token}`
    : "";

  useEffect(() => {
    if (!open || !scanUrl) { setDataUrl(null); return; }
    let cancelled = false;
    import("qrcode").then(QR => {
      QR.toDataURL(scanUrl, { width: 240, margin: 2 }).then(url => {
        if (!cancelled) setDataUrl(url);
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [open, scanUrl]);

  const ensureToken = async () => {
    if (!patientId || token) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ qrToken: string }>(`/patients/${patientId}/regenerate-qr`, { method: "POST" });
      setToken(res.qrToken);
      onTokenChange?.(res.qrToken);
    } catch (e: any) {
      toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && patientId && !token) void ensureToken();
  }, [open, patientId, token]);

  const regenerate = async () => {
    if (!patientId) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ qrToken: string }>(`/patients/${patientId}/regenerate-qr`, { method: "POST" });
      setToken(res.qrToken);
      onTokenChange?.(res.qrToken);
      toast({ title: t("QR code regenerated", "تم تجديد رمز QR") });
    } catch (e: any) {
      toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!scanUrl) return;
    await navigator.clipboard.writeText(scanUrl);
    toast({ title: t("Link copied", "تم نسخ الرابط") });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <QrCode size={18} />
            {t("Patient QR Code", "رمز QR للمريض")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{patientName}</p>
        {dataUrl ? (
          <img src={dataUrl} alt="QR" className="mx-auto rounded-lg border border-border" width={240} height={240} />
        ) : (
          <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
            {busy ? t("Generating…", "جاري الإنشاء…") : t("No QR token", "لا يوجد رمز")}
          </div>
        )}
        {scanUrl && (
          <p className="text-[11px] text-muted-foreground break-all px-2" dir="ltr">{scanUrl}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("Scan to view full medical history", "امسح الرمز لعرض السجل الطبي الكامل")}
        </p>
        {scanUrl && (
          <div className="flex gap-2 justify-center flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              <Copy size={14} className="me-1" />
              {t("Copy link", "نسخ الرابط")}
            </Button>
            {patientId && (
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={regenerate}>
                <RefreshCw size={14} className="me-1" />
                {t("Regenerate", "تجديد")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
