import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientName: string;
  qrToken: string | null | undefined;
};

export function PatientQrDialog({ open, onOpenChange, patientName, qrToken }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const scanUrl = qrToken
    ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/p/${qrToken}`
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
            {t("Generating…", "جاري الإنشاء…")}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {t("Scan to view full medical history", "امسح الرمز لعرض السجل الطبي الكامل")}
        </p>
        {scanUrl && (
          <div className="flex gap-2 justify-center">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              <Copy size={14} className="me-1" />
              {t("Copy link", "نسخ الرابط")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
