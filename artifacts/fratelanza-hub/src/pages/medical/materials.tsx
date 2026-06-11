import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useLanguage } from "../../components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package, Pencil, AlertTriangle, Minus, Plus as PlusIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

type Material = {
  id: number;
  name: string; nameAr: string | null;
  sku: string | null; category: string | null; unit: string | null;
  quantityInStock: number; reorderLevel: number; unitPrice: number;
  supplier: string | null;
  notes: string | null; notesAr: string | null;
  active: number;
  updatedAt: string;
};
type Stats = { total: number; lowStock: number; outOfStock: number; totalValue: number };
type MedicineMaster = { id: number; material: string; materialDescription: string; bun: string };

const CATEGORIES = [
  { value: "consumable", en: "Consumable", ar: "مستهلكات" },
  { value: "dental", en: "Dental", ar: "أسنان" },
  { value: "medication", en: "Medication", ar: "دواء" },
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const emptyForm = () => ({
  name: "", nameAr: "", sku: "", category: "consumable", unit: "pcs",
  quantityInStock: 0, reorderLevel: 0, unitPrice: 0,
  supplier: "", notes: "", notesAr: "",
});

export default function MedicalMaterials() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["medical-materials", search],
    queryFn: () => apiFetch(`/medical-materials${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });
  const { data: stats } = useQuery<Stats>({
    queryKey: ["medical-materials-stats"],
    queryFn: () => apiFetch("/medical-materials/stats"),
  });
  const { data: medicineMaster = [] } = useQuery<MedicineMaster[]>({
    queryKey: ["medicine-master"],
    queryFn: () => apiFetch("/medicine-master"),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setOpenDialog(true); };
  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({
      name: m.name || "", nameAr: m.nameAr || "", sku: m.sku || "",
      category: m.category || "consumable", unit: m.unit || "pcs",
      quantityInStock: m.quantityInStock, reorderLevel: m.reorderLevel, unitPrice: m.unitPrice,
      supplier: m.supplier || "", notes: m.notes || "", notesAr: m.notesAr || "",
    });
    setOpenDialog(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        // Per-language write: only populate the active language column
        name: isAr ? null : (form.name || null),
        nameAr: isAr ? (form.nameAr || null) : (editing?.nameAr || null),
        sku: form.sku || null,
        category: form.category || null,
        unit: form.unit || null,
        quantityInStock: Number(form.quantityInStock) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        supplier: form.supplier || null,
        notes: isAr ? null : (form.notes || null),
        notesAr: isAr ? (form.notesAr || null) : null,
      };
      if (isAr && !editing) (body as any).name = form.nameAr || null;
      return editing
        ? apiFetch(`/medical-materials/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) })
        : apiFetch("/medical-materials", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-materials"] });
      qc.invalidateQueries({ queryKey: ["medical-materials-stats"] });
      setOpenDialog(false);
      toast({ title: t(editing ? "Updated" : "Added", editing ? "تم التحديث" : "تمت الإضافة") });
    },
    onError: (e: any) => toast({ title: t("Save failed", "تعذر الحفظ"), description: e?.message, variant: "destructive" }),
  });

  const adjust = useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      apiFetch(`/medical-materials/${id}/adjust`, { method: "POST", body: JSON.stringify({ delta }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-materials"] });
      qc.invalidateQueries({ queryKey: ["medical-materials-stats"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`/medical-materials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-materials"] });
      qc.invalidateQueries({ queryKey: ["medical-materials-stats"] });
      toast({ title: t("Deleted", "تم الحذف") });
    },
  });

  const importMedicineMaster = useMutation({
    mutationFn: (rows: Array<{ Material: string; "Material description": string; BUn: string }>) =>
      apiFetch<{ imported: number }>("/medicine-master/import", { method: "POST", body: JSON.stringify({ rows }) }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      toast({ title: t("Medicine master uploaded", "تم رفع بيانات الأدوية"), description: `${result.imported} ${t("rows imported", "صف مستورد")}` });
    },
    onError: (e: any) => toast({ title: t("Import failed", "فشل الاستيراد"), description: e?.message, variant: "destructive" }),
  });

  const handleMedicineFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    const rows = raw.map(row => ({
      Material: String(row.Material ?? row.material ?? "").trim(),
      "Material description": String(row["Material description"] ?? row.materialDescription ?? "").trim(),
      BUn: String(row.BUn ?? row.bun ?? "").trim(),
    })).filter(row => row.Material && row["Material description"] && row.BUn);
    if (!rows.length) {
      toast({ title: t("No valid rows found", "لم يتم العثور على صفوف صحيحة"), description: "Required columns: Material, Material description, BUn", variant: "destructive" });
      return;
    }
    importMedicineMaster.mutate(rows);
  };

  const lowStockCount = useMemo(
    () => materials?.filter(m => m.reorderLevel > 0 && m.quantityInStock <= m.reorderLevel).length ?? 0,
    [materials]
  );

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="text-primary" /> {t("Materials Inventory", "مخزون المستلزمات")}</h2>
          <p className="text-muted-foreground text-sm">{t("Track clinic supplies, stock levels and reorder points (EGP).", "تتبع مستلزمات العيادة ومستويات المخزون ونقاط إعادة الطلب (ج.م).")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium cursor-pointer">
            <Upload size={16} />{importMedicineMaster.isPending ? t("Uploading…", "جاري الرفع…") : t("Upload Medicine Master", "رفع بيانات الأدوية")}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={importMedicineMaster.isPending}
              onChange={e => { const file = e.target.files?.[0]; if (file) handleMedicineFile(file); e.target.value = ""; }}
            />
          </label>
          <Button onClick={openCreate} className="gap-2"><Plus size={16} />{t("Add Material", "إضافة مادة")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("Total items", "إجمالي الأصناف")}</p>
          <p className="text-2xl font-bold mt-1">{stats?.total ?? 0}</p>
        </CardContent></Card>
        <Card className={lowStockCount > 0 ? "border-amber-300 bg-amber-50/40" : ""}><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("Low stock", "مخزون منخفض")}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{stats?.lowStock ?? 0}</p>
        </CardContent></Card>
        <Card className={stats?.outOfStock ? "border-rose-300 bg-rose-50/40" : ""}><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("Out of stock", "نفد المخزون")}</p>
          <p className="text-2xl font-bold mt-1 text-rose-600">{stats?.outOfStock ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("Medicine master", "بيانات الأدوية")}</p>
          <p className="text-2xl font-bold mt-1">{medicineMaster.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("Stock value", "قيمة المخزون")}</p>
          <p className="text-2xl font-bold mt-1">{(stats?.totalValue ?? 0).toFixed(0)} <span className="text-sm font-normal">{t("EGP", "ج.م")}</span></p>
        </CardContent></Card>
      </div>

      <Input
        placeholder={t("Search by name or SKU…", "بحث بالاسم أو الكود…")}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : !materials || materials.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t("No materials yet. Click 'Add Material' to start tracking your clinic inventory.", "لا توجد مواد بعد. انقر على 'إضافة مادة' لبدء تتبع مخزون العيادة.")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map(m => {
            const low = m.reorderLevel > 0 && m.quantityInStock <= m.reorderLevel;
            const out = m.quantityInStock === 0;
            return (
              <Card key={m.id} className={`${out ? "border-rose-300" : low ? "border-amber-300" : ""}`}>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{isAr ? (m.nameAr || m.name) : (m.name || m.nameAr)}</span>
                      {m.sku && <span className="text-xs font-mono px-2 py-0.5 bg-muted rounded">{m.sku}</span>}
                      {m.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {(() => { const c = CATEGORIES.find(x => x.value === m.category); return c ? (isAr ? c.ar : c.en) : m.category; })()}
                        </span>
                      )}
                      {out && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1"><AlertTriangle size={11} />{t("Out", "نفد")}</span>}
                      {!out && low && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1"><AlertTriangle size={11} />{t("Low", "منخفض")}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.unitPrice.toFixed(2)} {t("EGP", "ج.م")} {m.unit ? `/ ${m.unit}` : ""}
                      {m.supplier && <span> · {t("Supplier:", "المورد:")} {m.supplier}</span>}
                      {m.reorderLevel > 0 && <span> · {t("Reorder at:", "إعادة الطلب عند:")} {m.reorderLevel}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => adjust.mutate({ id: m.id, delta: -1 })} title={t("Consume 1", "صرف 1")}>
                      <Minus size={14} />
                    </Button>
                    <span className="font-bold text-lg min-w-[3rem] text-center tabular-nums">{m.quantityInStock}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => adjust.mutate({ id: m.id, delta: 1 })} title={t("Add 1", "إضافة 1")}>
                      <PlusIcon size={14} />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive"
                      onClick={() => confirmDelete({ title: t("Delete this material?", "حذف هذه المادة؟"), onConfirm: () => del.mutate(m.id) })}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <form onSubmit={e => { e.preventDefault(); save.mutate(); }}>
            <DialogHeader><DialogTitle>{editing ? t("Edit Material", "تعديل المادة") : t("Add Material", "إضافة مادة")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>{t("Name", "الاسم")} *</Label>
                  {isAr ? (
                    <Input dir="rtl" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required placeholder="مثال: قفازات لاتكس" />
                  ) : (
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Latex gloves" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("SKU / Code", "رمز SKU")}</Label>
                  <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="GLV-100" />
                </div>
                <div className="space-y-2">
                  <Label>{t("Category", "الفئة")}</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Unit", "الوحدة")}</Label>
                  <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder={t("pcs / box / tube / ml", "قطعة / علبة / أنبوب / مل")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Supplier", "المورد")}</Label>
                  <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Quantity in stock", "الكمية بالمخزون")}</Label>
                  <Input type="number" min="0" step="any" placeholder="0"
                    value={form.quantityInStock === 0 ? "" : form.quantityInStock}
                    onChange={e => setForm({ ...form, quantityInStock: e.target.value === "" ? 0 : Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Reorder level", "نقطة إعادة الطلب")}</Label>
                  <Input type="number" min="0" step="any" placeholder="0"
                    value={form.reorderLevel === 0 ? "" : form.reorderLevel}
                    onChange={e => setForm({ ...form, reorderLevel: e.target.value === "" ? 0 : Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Unit price (EGP)", "سعر الوحدة (ج.م)")}</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0"
                    value={form.unitPrice === 0 ? "" : form.unitPrice}
                    onChange={e => setForm({ ...form, unitPrice: e.target.value === "" ? 0 : Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Notes", "ملاحظات")}</Label>
                <Textarea
                  dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? form.notesAr : form.notes}
                  onChange={e => isAr ? setForm({ ...form, notesAr: e.target.value }) : setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>{t("Cancel", "إلغاء")}</Button>
              <Button type="submit" disabled={save.isPending}>{t("Save", "حفظ")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
