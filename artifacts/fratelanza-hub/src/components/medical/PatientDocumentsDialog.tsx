import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { FileText, Upload, Trash2, ExternalLink } from "lucide-react";

type Doc = {
  id: number;
  patientId: number;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  notes: string | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientId: number;
  patientName: string;
};

export function PatientDocumentsDialog({ open, onOpenChange, patientId, patientName }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["patient-documents", patientId],
    queryFn: () => apiFetch(`/patients/${patientId}/documents`),
    enabled: open && patientId > 0,
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("document", file);
      if (notes.trim()) fd.append("notes", notes.trim());
      return apiFetch<Doc>(`/patients/${patientId}/documents`, { method: "POST", body: fd });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-documents", patientId] });
      setNotes("");
      toast({ title: t("Document uploaded", "تم رفع المستند") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/patients/${patientId}/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-documents", patientId] }),
  });

  const formatSize = (n: number | null) => {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} />
            {t("Patient documents", "مستندات المريض")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{patientName}</p>

        <div className="space-y-2 border border-border rounded-md p-3">
          <Label className="text-xs">{t("Upload document", "رفع مستند")}</Label>
          <Textarea
            rows={2}
            className="text-sm"
            placeholder={t("Optional note about this file…", "ملاحظة اختيارية عن الملف…")}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) uploadMut.mutate(f);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" disabled={uploadMut.isPending} onClick={() => fileRef.current?.click()}>
            <Upload size={14} className="me-1.5" />
            {uploadMut.isPending ? t("Uploading…", "جاري الرفع…") : t("Choose file", "اختر ملف")}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            {t("PDF, images, Word — max 15 MB", "PDF، صور، Word — حتى 15 ميجا")}
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("Loading…", "جاري التحميل…")}</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No documents yet", "لا توجد مستندات بعد")}</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {docs.map(d => (
              <li key={d.id} className="flex items-start gap-2 border border-border rounded-md p-2.5 text-sm">
                <FileText size={16} className="shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <a href={d.filePath} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline truncate block">
                    {d.fileName}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString()} {formatSize(d.fileSize) && `· ${formatSize(d.fileSize)}`}
                  </div>
                  {d.notes && <p className="text-xs mt-1 text-foreground/80">{d.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={d.filePath} target="_blank" rel="noopener noreferrer" title={t("Open", "فتح")}>
                      <ExternalLink size={13} />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => confirmDelete({
                      title: t("Delete document?", "حذف المستند؟"),
                      onConfirm: async () => deleteMut.mutate(d.id),
                    })}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
