import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/hooks/use-toast";

type SummaryResponse = {
  summary: string;
  language: "en" | "ar";
  generatedAt: string;
  disclaimer: string;
};

export function AiSummaryDialog({
  patientId,
  patientName,
  open,
  onOpenChange,
}: {
  patientId: number;
  patientName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t, language, isRtl } = useLanguage();
  const { toast } = useToast();
  const [data, setData] = useState<SummaryResponse | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      apiFetch<SummaryResponse>(`/patients/${patientId}/ai-summary`, {
        method: "POST",
        body: JSON.stringify({ language }),
      }),
    onSuccess: (resp) => setData(resp),
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  // Auto-generate on first open if we haven't yet. Effect (not render-time)
  // so StrictMode's double-invoke doesn't fire two parallel mutations.
  useEffect(() => {
    if (open && !data && !mut.isPending && !mut.isError) {
      mut.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      // Reset state on close so the next open re-fetches a fresh summary.
      setTimeout(() => { setData(null); mut.reset(); }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            {t("AI Medical Summary", "ملخص طبي بالذكاء الاصطناعي")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{patientName}</p>
        </DialogHeader>

        {/* Disclaimer banner */}
        <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-xs">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-900 dark:text-amber-200">
            {data?.disclaimer ||
              t(
                "AI-generated summary for reference only. Not a medical diagnosis and does not replace clinical judgment.",
                "هذا الملخص تم إنشاؤه بواسطة الذكاء الاصطناعي للمرجعية فقط. ليس تشخيصاً طبياً ولا يحل محل الحكم السريري للطبيب.",
              )}
          </p>
        </div>

        <div className="min-h-[200px] max-h-[55vh] overflow-y-auto">
          {mut.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-8/12" />
              <p className="text-xs text-muted-foreground text-center pt-2">
                {t("Reviewing patient history…", "جاري مراجعة سجل المريض…")}
              </p>
            </div>
          )}
          {mut.isError && !mut.isPending && (
            <div className="text-sm text-destructive">
              {(mut.error as Error)?.message || t("Failed to generate summary", "فشل إنشاء الملخص")}
            </div>
          )}
          {data && !mut.isPending && (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{data.summary}</div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {data && (
            <p className="text-xs text-muted-foreground mr-auto">
              {t("Generated", "تم الإنشاء")} {new Date(data.generatedAt).toLocaleString(isRtl ? "ar-EG" : "en-US")}
            </p>
          )}
          <Button variant="outline" onClick={() => { setData(null); mut.reset(); mut.mutate(); }} disabled={mut.isPending} className="gap-1.5">
            <RefreshCw size={14} />{t("Regenerate", "إعادة الإنشاء")}
          </Button>
          <Button onClick={() => handleClose(false)}>{t("Close", "إغلاق")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
