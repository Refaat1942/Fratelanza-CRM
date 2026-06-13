import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui-ext/page-header";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { Upload, Pill, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

type Medicine = {
  id: number;
  material: string;
  materialDescription: string;
  bun: string | null;
  active: number;
};

export default function MedicineMasterPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ material: "", materialDescription: "", bun: "" });

  const { data: items = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicine-master", search],
    queryFn: () => apiFetch(`/medicine-master${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });
  const { data: stats } = useQuery<{ total: number }>({
    queryKey: ["medicine-master-stats"],
    queryFn: () => apiFetch("/medicine-master/stats"),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<{
        inserted: number;
        updated: number;
        skipped: number;
        total: number;
        inDb?: number;
        dbName?: string;
        postgresDatabase?: string;
      }>(
        "/medicine-master/upload",
        { method: "POST", body: fd },
      );
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      qc.invalidateQueries({ queryKey: ["medicine-master-stats"] });
      const variant = r.inDb === 0 && r.total > 0 ? "destructive" as const : "default" as const;
      toast({
        title: t("Upload complete", "اكتمل الرفع"),
        description: `${r.inserted} ${t("new", "جديد")}, ${r.updated} ${t("updated", "محدّث")}${r.inDb != null ? ` · ${r.inDb} ${t("in database", "في القاعدة")}` : ""}`,
        variant,
      });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const addMut = useMutation({
    mutationFn: () => apiFetch("/medicine-master", {
      method: "POST",
      body: JSON.stringify({
        material: addForm.material.trim() || addForm.materialDescription.trim().slice(0, 32).replace(/\s+/g, "_").toUpperCase(),
        materialDescription: addForm.materialDescription.trim(),
        bun: addForm.bun.trim() || null,
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      qc.invalidateQueries({ queryKey: ["medicine-master-stats"] });
      setAddOpen(false);
      setAddForm({ material: "", materialDescription: "", bun: "" });
      toast({ title: t("Medicine added", "تمت إضافة الدواء") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/medicine-master/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      qc.invalidateQueries({ queryKey: ["medicine-master-stats"] });
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Pill size={20} />}
        title={t("Medicine Master", "سجل الأدوية")}
        description={t("Upload Material, Material description, BUn columns from Excel/CSV", "ارفع ملف Excel/CSV يحتوي Material و Material description و BUn")}
        actions={
          <>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus size={16} className="me-1.5" />
              {t("Add medicine", "إضافة دواء")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) uploadMut.mutate(f);
                e.target.value = "";
              }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploadMut.isPending}>
              <Upload size={16} className="me-1.5" />
              {uploadMut.isPending ? t("Uploading…", "جاري الرفع…") : t("Upload file", "رفع ملف")}
            </Button>
          </>
        }
      />

      <KpiCard icon={<Pill size={18} />} tone="primary" label={t("Total medicines", "إجمالي الأدوية")} value={stats?.total ?? 0} />

      <Input
        placeholder={t("Search material or description", "بحث بالمادة أو الوصف")}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("Loading…", "جاري التحميل…")}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Pill size={24} />}
          title={t("No medicines yet", "لا توجد أدوية بعد")}
          description={t("Upload an Excel file with Material, Material description, BUn columns", "ارفع ملف Excel بالأعمدة المطلوبة")}
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-2.5 font-medium">{t("Material", "المادة")}</th>
                <th className="text-start p-2.5 font-medium">{t("Material description", "وصف المادة")}</th>
                <th className="text-start p-2.5 font-medium">BUn</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-2.5 font-mono text-xs">{m.material}</td>
                  <td className="p-2.5">{m.materialDescription}</td>
                  <td className="p-2.5 text-muted-foreground">{m.bun || "—"}</td>
                  <td className="p-2.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => confirmDelete({
                        title: t("Delete medicine?", "حذف الدواء؟"),
                        onConfirm: async () => deleteMut.mutate(m.id),
                      })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("Add medicine", "إضافة دواء")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              if (!addForm.materialDescription.trim()) return;
              addMut.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label>{t("Material description", "وصف المادة")}*</Label>
              <Input
                required
                value={addForm.materialDescription}
                onChange={e => setAddForm({ ...addForm, materialDescription: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Material code", "كود المادة")}</Label>
              <Input
                value={addForm.material}
                onChange={e => setAddForm({ ...addForm, material: e.target.value })}
                placeholder={t("Auto-generated if empty", "يُنشأ تلقائياً إن تُرك فارغاً")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>BUn</Label>
              <Input value={addForm.bun} onChange={e => setAddForm({ ...addForm, bun: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>{t("Cancel", "إلغاء")}</Button>
              <Button type="submit" disabled={addMut.isPending}>{t("Save", "حفظ")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
