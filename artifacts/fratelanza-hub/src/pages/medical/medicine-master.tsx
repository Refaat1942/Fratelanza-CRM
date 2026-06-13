import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui-ext/page-header";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { Upload, Pill, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Medicine = {
  id: number;
  material: string;
  materialDescription: string;
  bun: string | null;
  active: number;
};

type MedicineListResponse = {
  items: Medicine[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 100;

export default function MedicineMasterPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: list, isLoading, isError, error: loadError } = useQuery<MedicineListResponse>({
    queryKey: ["medicine-master", search, page],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      p.set("page", String(page));
      p.set("pageSize", String(PAGE_SIZE));
      return apiFetch(`/medicine-master?${p}`);
    },
    retry: false,
  });

  const items = list?.items ?? [];
  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: stats } = useQuery<{ total: number }>({
    queryKey: ["medicine-master-stats"],
    queryFn: () => apiFetch("/medicine-master/stats"),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiFetch<{ inserted: number; updated: number; skipped: number; total: number; inDb: number; dbName?: string; postgresDatabase?: string; usesTenantBindingDb?: boolean; subdomain?: string }>(
        "/medicine-master/upload",
        { method: "POST", body: fd },
      );
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      qc.invalidateQueries({ queryKey: ["medicine-master-stats"] });
      setPage(1);
      toast({
        title: t("Upload complete", "اكتمل الرفع"),
        description: t(
          `${r.inDb} in ${r.postgresDatabase ?? r.dbName ?? "?"} (tenant: ${r.subdomain ?? "?"})`,
          `${r.inDb} في ${r.postgresDatabase ?? r.dbName ?? "?"} (المستأجر: ${r.subdomain ?? "?"})`,
        ),
      });
    },
    onError: (e: Error) => {
      const msg = e.message.includes("medicine_master_table_missing")
        ? t(
          "Database not ready — on the server run: ./deploy/migrate-tenants.sh deploy/migrations/011-medical-extensions.sql",
          "قاعدة البيانات غير جاهزة — على السيرفر نفّذ: ./deploy/migrate-tenants.sh deploy/migrations/011-medical-extensions.sql",
        )
        : e.message;
      toast({ title: msg, variant: "destructive" });
    },
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

      <KpiCard icon={<Pill size={18} />} tone="primary" label={t("Total medicines", "إجمالي الأدوية")} value={stats?.total ?? total} />

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {loadError?.message?.includes("medicine_master_table_missing")
            ? t(
              "Medicine Master table is missing on this clinic database. Ask your admin to run migration 011 on the VPS, then try again.",
              "جدول سجل الأدوية غير موجود على قاعدة بيانات العيادة. اطلب من المسؤول تشغيل migration 011 على السيرفر ثم أعد المحاولة.",
            )
            : (loadError?.message || t("Could not load medicines", "تعذر تحميل الأدوية"))}
        </div>
      )}

      <Input
        placeholder={t("Search material or description", "بحث بالمادة أو الوصف")}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("Showing", "عرض")} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} {t("of", "من")} {total}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(m.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
