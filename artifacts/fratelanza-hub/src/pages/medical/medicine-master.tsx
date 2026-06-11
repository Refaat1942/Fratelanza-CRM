import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { DataTable, type DataTableColumn } from "@/components/ui-ext/data-table";
import { Upload, Pill, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Medicine = {
  id: number;
  material: string;
  materialDescription: string;
  bun: string | null;
  active: number;
};

export default function MedicineMasterPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicine-master"],
    queryFn: () => apiFetch("/medicine-master"),
  });
  const { data: stats } = useQuery<{ total: number }>({
    queryKey: ["medicine-master-stats"],
    queryFn: () => apiFetch("/medicine-master/stats"),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<{ inserted: number; updated: number; skipped: number; total: number }>(
        "/medicine-master/upload",
        { method: "POST", body: fd },
      );
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      qc.invalidateQueries({ queryKey: ["medicine-master-stats"] });
      toast({
        title: t("Upload complete", "اكتمل الرفع"),
        description: `${r.inserted} ${t("new", "جديد")}, ${r.updated} ${t("updated", "محدّث")}`,
      });
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

  const columns: DataTableColumn<Medicine>[] = [
    {
      id: "material",
      header: t("Material", "المادة"),
      sortValue: r => r.material,
      cell: r => <span className="font-mono text-xs">{r.material}</span>,
      export: { header: "Material", value: r => r.material },
    },
    {
      id: "description",
      header: t("Material description", "وصف المادة"),
      sortValue: r => r.materialDescription,
      cell: r => r.materialDescription,
      export: { header: "Material description", value: r => r.materialDescription },
    },
    {
      id: "bun",
      header: "BUn",
      sortValue: r => r.bun || "",
      cell: r => <span className="text-muted-foreground">{r.bun || "—"}</span>,
      export: { header: "BUn", value: r => r.bun },
    },
    {
      id: "actions",
      header: "",
      sortable: false,
      cell: r => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(r.id)}>
          <Trash2 size={14} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Pill size={20} />}
        title={t("Medicine Master", "سجل الأدوية")}
        description={t("Upload Material, Material description, BUn columns from Excel/CSV", "ارفع ملف Excel/CSV يحتوي Material و Material description و BUn")}
        actions={
          <>
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

      <DataTable
        data={items}
        columns={columns}
        rowKey={r => r.id}
        isLoading={isLoading}
        searchPlaceholder={t("Search material or description", "بحث بالمادة أو الوصف")}
        searchPredicate={(r, q) =>
          [r.material, r.materialDescription, r.bun].filter(Boolean).join(" ").toLowerCase().includes(q)
        }
        exportFilename="medicine-master"
        exportLabel={t("Download Excel", "تحميل Excel")}
        emptyMessage={t("No medicines yet", "لا توجد أدوية بعد")}
      />
    </div>
  );
}
