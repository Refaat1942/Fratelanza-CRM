import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

type Patient = {
  id: number;
  firstName: string;
  lastName?: string | null;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
  qrToken?: string | null;
};

type Props = {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PatientQrDialog({ patient, open, onOpenChange }: Props) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanUrl, setScanUrl] = useState("");

  const fullName = patient
    ? (isAr
      ? `${patient.firstNameAr ?? patient.firstName} ${patient.lastNameAr ?? patient.lastName ?? ""}`.trim()
      : `${patient.firstName} ${patient.lastName ?? ""}`.trim())
    : "";

  useEffect(() => {
    if (!open || !patient?.qrToken || !canvasRef.current) return;
    const url = `${window.location.origin}/medical/patient-scan?t=${patient.qrToken}`;
    setScanUrl(url);
    QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 2 }).catch(() => {});
  }, [open, patient?.qrToken]);

  const printCard = () => {
    if (!patient?.qrToken) return;
    const w = window.open("", "_blank", "width=400,height=520");
    if (!w) return;
    const img = canvasRef.current?.toDataURL("image/png") ?? "";
    w.document.write(`<!doctype html><html dir="${isAr ? "rtl" : "ltr"}"><head><title>${fullName}</title>
<style>body{font-family:sans-serif;text-align:center;padding:24px}h1{font-size:18px;margin:0 0 8px}p{color:#666;font-size:12px}</style></head>
<body><h1>${fullName}</h1><p>${t("Patient ID", "رقم المريض")}: #${patient.id}</p>
<img src="${img}" width="220" alt="QR"/><p style="margin-top:12px;font-size:11px">${scanUrl}</p>
<script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>{t("Patient QR card", "بطاقة QR للمريض")}</DialogTitle>
        </DialogHeader>
        <p className="font-semibold">{fullName}</p>
        {!patient.qrToken ? (
          <p className="text-sm text-muted-foreground">{t("QR not ready — save patient again or run backfill.", "رمز QR غير جاهز — احفظ المريض مرة أخرى.")}</p>
        ) : (
          <>
            <canvas ref={canvasRef} className="mx-auto rounded border" />
            <p className="text-xs text-muted-foreground break-all">{scanUrl}</p>
            <Button type="button" variant="outline" onClick={printCard}>{t("Print card", "طباعة البطاقة")}</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
