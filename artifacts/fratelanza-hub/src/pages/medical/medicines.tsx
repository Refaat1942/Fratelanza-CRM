import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { PageHeader } from "@/components/ui-ext/page-header";
import { SectionCard } from "@/components/ui-ext/section-card";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Upload, Trash2, Search, Package, AlertTriangle } from "lucide-react";

type Medicine = {
  id: number;
  name: string;
  nameAr?: string | null;
  sku?: string | null;
  price: number;
  stock: number;
  category?: string | null;
  status: string;
};

function pickCell(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
}

async function parseMedicinesExcel(file: File) {
  const xlsx = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = xlsx.read(buf);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows
    .map((row) => ({
      name: pickCell(row, ["name", "Name", "NAME", "medicine", "Medicine", "drug", "Drug", "الاسم", "اسم الدواء"]),
      nameAr: pickCell(row, ["nameAr", "name_ar", "Name Ar", "name ar", "الاسم عربي", "اسم عربي"]) || undefined,
      sku: pickCell(row, ["sku", "SKU", "code", "Code", "barcode", "كود"]) || undefined,
      price: Number(pickCell(row, ["price", "Price", "سعر"]) || 0) || 0,
      stock: Number(pickCell(row, ["stock", "Stock", "qty", "quantity", "المخزون"]) || 0) || 0,
    }))
    .filter((r) => r.name);
}

export default function MedicinesPage() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);

  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medications"],
    queryFn: () => apiFetch("/products/medications"),
  });

  const clearMut = useMutation({
    mutationFn: () => apiFetch<{ deleted: number }>("/products/medications", { method: "DELETE" }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["egypt-medical-catalog"] });
      toast({ title: t(`Cleared ${res.deleted} medicines`, `تم مسح ${res.deleted} دواء`) });
    },
    onError: (e: Error) => toast({ title: e.message || t("Failed", "فشل"), variant: "destructive" }),
  });

  const importFile = async (file: File) => {
    setImporting(true);
    try {
      const items = await parseMedicinesExcel(file);
      if (!items.length) {
        toast({ title: t("No medicine rows found in file", "لم يُعثر على أدوية في الملف"), variant: "destructive" });
        return;
      }
      const chunks: typeof items[] = [];
      for (let i = 0; i < items.length; i += 500) chunks.push(items.slice(i, i + 500));
      let total = 0;
      for (const chunk of chunks) {
        const res = await apiFetch<{ imported: number }>("/products/medications/bulk", {
          method: "POST",
          body: JSON.stringify({ items: chunk, branchId: user?.branchId ?? null }),
        });
        total += res.imported;
      }
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["egypt-medical-catalog"] });
      toast({ title: t(`Imported ${total} medicines`, `تم استيراد ${total} دواء`) });
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : t("Import failed", "فشل الاستيراد"), variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const filtered = medicines.filter((m) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s)
      || (m.nameAr?.toLowerCase().includes(s) ?? false)
      || (m.sku?.toLowerCase().includes(s) ?? false);
  });

  const lowStock = medicines.filter((m) => m.stock <= 5).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Pill size={20} />}
        title={t("Medicines catalog", "كتالوج الأدوية")}
        description={t(
          "Import your clinic formulary for prescriptions. Products uploaded here appear in the prescription medicine list.",
          "استورد قائمة أدوية العيادة للوصفات. المنتجات المرفوعة هنا تظهر في قائمة الأدوية عند كتابة الوصفة.",
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
              }}
            />
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
              data-testid="btn-import-medicines"
            >
              <Upload size={15} className="me-1.5" />
              {importing ? t("Importing…", "جاري الاستيراد…") : t("Import Excel", "استيراد Excel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!medicines.length || clearMut.isPending}
              onClick={() => confirmDelete({
                title: t("Clear all medicines?", "مسح كل الأدوية؟"),
                description: t(
                  "This removes every medicine product so you can re-import from Excel. Prescriptions already saved are not deleted.",
                  "سيحذف كل منتجات الأدوية لإعادة الاستيراد من Excel. الوصفات المحفوظة لن تُحذف.",
                ),
                onConfirm: async () => { await clearMut.mutateAsync(); },
              })}
              data-testid="btn-clear-medicines"
            >
              <Trash2 size={15} className="me-1.5" />
              {t("Clear all", "مسح الكل")}
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <b>{t("Excel columns", "أعمدة Excel")}:</b>{" "}
          {t("name (required), nameAr, sku, price, stock", "name (مطلوب), nameAr, sku, price, stock")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard icon={<Pill size={18} />} tone="primary" label={t("Total medicines", "إجمالي الأدوية")} value={medicines.length} />
        <KpiCard icon={<Package size={18} />} tone="info" label={t("Shown", "المعروض")} value={filtered.length} />
        <KpiCard icon={<AlertTriangle size={18} />} tone="warning" label={t("Low stock (≤5)", "مخزون منخفض (≤5)")} value={lowStock} />
      </div>

      <SectionCard title={t("Imported medicines", "الأدوية المستوردة")}>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search name or SKU…", "بحث بالاسم أو الكود…")}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 grid gap-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Pill size={22} />}
            title={t("No medicines yet", "لا توجد أدوية بعد")}
            description={t(
              "Import an Excel file with a name column. Medicines will appear here and in prescriptions.",
              "استورد ملف Excel يحتوي عمود الاسم. ستظهر الأدوية هنا وفي الوصفات.",
            )}
            action={
              <Button onClick={() => fileRef.current?.click()} className="gap-1.5">
                <Upload size={15} />
                {t("Import Excel", "استيراد Excel")}
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30" data-testid={`medicine-${m.id}`}>
                <div className="min-w-0">
                  <div className="font-medium truncate">{isAr && m.nameAr ? m.nameAr : m.name}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                    {m.sku && <span dir="ltr">SKU: {m.sku}</span>}
                    <span>{t("Stock", "المخزون")}: {m.stock}</span>
                    <span>{t("Price", "السعر")}: {m.price} {t("EGP", "ج.م")}</span>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{t("In prescriptions", "في الوصفات")}</Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
