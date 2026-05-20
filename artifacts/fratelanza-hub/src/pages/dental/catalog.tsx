import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { useLangField } from "@/lib/lang-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, ListPlus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { PageHeader } from "@/components/ui-ext/page-header";
import { SectionCard } from "@/components/ui-ext/section-card";
import { EmptyState } from "@/components/ui-ext/empty-state";

type DentalProcedure = {
  id: number;
  name: string;
  nameAr?: string | null;
  category?: string | null;
  price: number;
  active: "true" | "false";
};

const CATEGORIES: { key: string; en: string; ar: string }[] = [
  { key: "cleaning",   en: "Cleaning",         ar: "تنظيف" },
  { key: "filling",    en: "Filling",          ar: "حشو" },
  { key: "root_canal", en: "Root Canal",       ar: "علاج عصب" },
  { key: "crown",      en: "Crown",            ar: "تاج" },
  { key: "braces",     en: "Braces",           ar: "تقويم" },
  { key: "whitening",  en: "Whitening",        ar: "تبييض" },
  { key: "extraction", en: "Extraction",       ar: "خلع" },
  { key: "implant",    en: "Implant",          ar: "زراعة" },
  { key: "bridge",     en: "Bridge",           ar: "جسر" },
  { key: "other",      en: "Other",            ar: "أخرى" },
];

const EMPTY: Partial<DentalProcedure> = { name: "", nameAr: "", category: "filling", price: 0, active: "true" };

export default function DentalCatalog() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const lf = useLangField();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DentalProcedure | null>(null);
  const [form, setForm] = useState<Partial<DentalProcedure>>(EMPTY);

  const { data: procs, isLoading } = useQuery<DentalProcedure[]>({
    queryKey: ["dental-procedures"],
    queryFn: () => apiFetch("/dental-procedures"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["dental-procedures"] });

  const createMut = useMutation({
    mutationFn: (data: Partial<DentalProcedure>) =>
      apiFetch("/dental-procedures", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setOpen(false); setForm(EMPTY); toast({ title: t("Procedure added", "تمت الإضافة") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DentalProcedure> }) =>
      apiFetch(`/dental-procedures/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); setEditing(null); setForm(EMPTY); toast({ title: t("Updated", "تم التحديث") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/dental-procedures/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Deleted", "تم الحذف") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });
  const seedMut = useMutation({
    mutationFn: () => apiFetch<{ seeded: number }>("/dental-procedures/seed", { method: "POST" }),
    onSuccess: (r) => { invalidate(); toast({ title: t(`Seeded ${r.seeded} procedures`, `تمت إضافة ${r.seeded} إجراء`) }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (p: DentalProcedure) => { setEditing(p); setForm(p); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Strict per-language form. Write policy:
    //  - Always send the active-language name.
    //  - OMIT the inactive-language column so PATCH does not wipe it.
    //  - `name` is NOT NULL: on CREATE mirror AR -> EN as fallback; on UPDATE leave the EN side alone.
    const data: any = {
      category: form.category || null,
      price: Number(form.price) || 0,
      active: (form.active as "true" | "false") || "true",
    };
    if (isAr) {
      data.nameAr = form.nameAr || "";
      if (!editing) data.name = form.nameAr || "";
    } else {
      data.name = form.name || "";
    }
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const catLabel = (k?: string | null) => {
    const c = CATEGORIES.find(x => x.key === k);
    if (!c) return k || "—";
    return isAr ? c.ar : c.en;
  };

  const Form = (
    <form onSubmit={submit}>
      <div className="grid gap-3 py-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{isAr ? "اسم الإجراء *" : "Procedure Name *"}</Label>
          <Input
            required dir={lf.dir}
            value={isAr ? (form.nameAr || "") : (form.name || "")}
            onChange={e => isAr
              ? setForm({ ...form, nameAr: e.target.value })
              : setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Category", "الفئة")}</Label>
            <Select value={form.category || ""} onValueChange={v => setForm({ ...form, category: v || null })}>
              <SelectTrigger><SelectValue placeholder={t("Select", "اختر")} /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{isAr ? c.ar : c.en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("Price (EGP)", "السعر (ج.م)")}</Label>
            <Input dir="ltr" type="number" step="0.01" min={0} value={form.price ?? 0}
              onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("Status", "الحالة")}</Label>
          <Select value={form.active || "true"} onValueChange={v => setForm({ ...form, active: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t("Active", "نشط")}</SelectItem>
              <SelectItem value="false">{t("Inactive", "غير نشط")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {editing ? t("Save Changes", "حفظ التغييرات") : t("Add Procedure", "إضافة إجراء")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ListPlus size={20} />}
        title={t("Dental Catalog", "قائمة علاجات الأسنان")}
        description={t("Procedures and prices used in dental visits and invoices.", "الإجراءات والأسعار المستخدمة في زيارات وفواتير الأسنان.")}
        actions={
          <div className="flex gap-2">
            {procs && procs.length === 0 && (
              <Button variant="outline" onClick={() => seedMut.mutate()} disabled={seedMut.isPending} className="gap-1.5 h-9">
                <Sparkles size={15} />{t("Seed common procedures", "تعبئة الإجراءات الشائعة")}
              </Button>
            )}
            <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setForm(EMPTY); }}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 h-9" data-testid="btn-add-dental-procedure"><Plus size={15} />{t("New Procedure", "إجراء جديد")}</Button>
              </DialogTrigger>
              <DialogContent className={isRtl ? "rtl" : "ltr"}>
                <DialogHeader><DialogTitle>{t("Add Dental Procedure", "إضافة إجراء جديد")}</DialogTitle></DialogHeader>
                {Form}
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <SectionCard title={t("All Procedures", "كل الإجراءات")} noPadding>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !procs || procs.length === 0 ? (
          <EmptyState
            icon={<ListPlus size={22} />}
            title={t("No dental procedures yet", "لا توجد إجراءات بعد")}
            description={t("Click 'Seed common procedures' to start with 11 typical dental services, or add your own.", "اضغط 'تعبئة الإجراءات الشائعة' للبدء بـ 11 خدمة أسنان شائعة، أو أضف الخاصة بك.")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Name", "الاسم")}</th>
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Category", "الفئة")}</th>
                  <th className={`text-${isRtl ? "left" : "right"} px-4 py-2.5`}>{t("Price", "السعر")}</th>
                  <th className={`text-${isRtl ? "right" : "left"} px-4 py-2.5`}>{t("Status", "الحالة")}</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {procs.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-accent/40 transition-colors ${i % 2 === 1 ? "bg-secondary/20" : ""}`}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{isAr ? (p.nameAr || p.name) : (p.name || p.nameAr)}</td>
                    <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px]">{catLabel(p.category)}</Badge></td>
                    <td className={`px-4 py-2.5 text-${isRtl ? "left" : "right"} font-semibold tabular-nums`}>{p.price.toLocaleString()} <span className="text-xs text-muted-foreground">{t("EGP", "ج.م")}</span></td>
                    <td className="px-4 py-2.5">
                      <Badge className={p.active === "true" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}>
                        {p.active === "true" ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEdit(p)}><Edit2 size={13} /></Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                          onClick={() => confirmDelete({ title: t("Delete procedure?", "حذف الإجراء؟"), onConfirm: async () => deleteMut.mutate(p.id) })}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={editing !== null} onOpenChange={o => { if (!o) { setEditing(null); setForm(EMPTY); } }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("Edit Procedure", "تعديل الإجراء")}</DialogTitle></DialogHeader>
          {Form}
        </DialogContent>
      </Dialog>
    </div>
  );
}
