import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ListPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

type Procedure = {
  id: number;
  name: string;
  nameAr: string | null;
  category: string | null;
  price: number;
  active: string;
};

const CATEGORIES = [
  { v: "general",     en: "General",     ar: "عام" },
  { v: "dental",      en: "Dental",      ar: "أسنان" },
  { v: "consultation",en: "Consultation",ar: "كشف" },
  { v: "lab",         en: "Lab",         ar: "تحاليل" },
  { v: "imaging",     en: "Imaging",     ar: "أشعة" },
  { v: "surgery",     en: "Surgery",     ar: "جراحة" },
  { v: "other",       en: "Other",       ar: "أخرى" },
];

const EMPTY = { name: "", nameAr: "", category: "general", price: "0", active: "true" };

export default function Procedures() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const { data: procs, isLoading } = useQuery<Procedure[]>({
    queryKey: ["procedures"],
    queryFn: () => apiFetch("/procedures"),
  });

  const filtered = (procs || []).filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.nameAr || "").includes(search);
  });

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (p: Procedure) => {
    setEditing(p);
    setForm({
      name: p.name,
      nameAr: p.nameAr || "",
      category: p.category || "general",
      price: String(p.price),
      active: p.active,
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        nameAr: form.nameAr || null,
        category: form.category || null,
        price: Number(form.price) || 0,
        active: form.active as "true" | "false",
      };
      if (editing) return apiFetch(`/procedures/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      return apiFetch("/procedures", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedures"] });
      setOpen(false);
      toast({ title: editing ? t("Updated", "تم التحديث") : t("Procedure added", "تمت إضافة الإجراء") });
    },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/procedures/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedures"] });
      toast({ title: t("Procedure deleted", "تم حذف الإجراء") });
    },
  });

  const catLabel = (v: string | null) => {
    if (!v) return "—";
    const c = CATEGORIES.find(x => x.v === v);
    return c ? (isAr ? c.ar : c.en) : v;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Procedures Catalog", "كتالوج الإجراءات")}</h2>
          <p className="text-muted-foreground">{t("Services your clinic offers and their EGP prices", "الخدمات التي تقدمها العيادة وأسعارها بالجنيه")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="btn-create-procedure">
          <Plus size={16} />{t("New Procedure", "إجراء جديد")}
        </Button>
      </div>

      <Card><CardContent className="p-3">
        <div className="relative">
          <Search size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"} text-muted-foreground`} />
          <Input className={isRtl ? "pr-9" : "pl-9"} value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by name…", "ابحث بالاسم…")} />
        </div>
      </CardContent></Card>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !filtered.length ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <ListPlus className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{procs?.length ? t("No matches.", "لا توجد نتائج.") : t("Add your first procedure (e.g. Consultation, Dental Cleaning).", "أضف أول إجراء (مثل: كشف، تنظيف أسنان).")}</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(p => (
            <Card key={p.id} data-testid={`procedure-${p.id}`} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{isAr ? (p.nameAr || p.name) : p.name}</p>
                  {p.nameAr && p.name && (
                    <p className="text-xs text-muted-foreground" dir={isAr ? "ltr" : "rtl"}>{isAr ? p.name : p.nameAr}</p>
                  )}
                </div>
                <Badge variant="secondary">{catLabel(p.category)}</Badge>
                {p.active === "false" && <Badge variant="outline" className="text-muted-foreground">{t("Inactive", "غير نشط")}</Badge>}
                <p className="font-mono font-bold text-primary w-28 text-right">
                  {p.price.toLocaleString()} <span className="text-xs text-muted-foreground">{t("EGP", "ج.م")}</span>
                </p>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit size={14} /></Button>
                <Button variant="ghost" size="icon"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => confirmDelete({
                    title: t("Delete procedure?", "حذف الإجراء؟"),
                    description: t("Existing invoice lines that referenced it will keep their description, but won't link back.", "خطوط الفواتير الموجودة ستحتفظ بوصفها لكن لن يكون لها رابط."),
                    onConfirm: async () => deleteMut.mutate(p.id),
                  })}>
                  <Trash2 size={14} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }}>
            <DialogHeader><DialogTitle>{editing ? t("Edit Procedure", "تعديل الإجراء") : t("New Procedure", "إجراء جديد")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (عربي) *" : "Name (English) *"}</Label>
                <Input required dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? form.nameAr : form.name}
                  onChange={(e) => isAr ? setForm({ ...form, nameAr: e.target.value, name: form.name || e.target.value }) : setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "Name (English)" : "الاسم (عربي)"}</Label>
                <Input dir={isAr ? "ltr" : "rtl"}
                  value={isAr ? form.name : form.nameAr}
                  onChange={(e) => isAr ? setForm({ ...form, name: e.target.value }) : setForm({ ...form, nameAr: e.target.value })}
                  placeholder={isAr ? "Optional" : "اختياري"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("Category", "الفئة")}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{isAr ? c.ar : c.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Price (EGP) *", "السعر (ج.م) *")}</Label>
                  <Input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Status", "الحالة")}</Label>
                <Select value={form.active} onValueChange={(v) => setForm({ ...form, active: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("Active", "نشط")}</SelectItem>
                    <SelectItem value="false">{t("Inactive (hidden from invoices)", "غير نشط (مخفي من الفواتير)")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" disabled={saveMut.isPending}>{editing ? t("Save", "حفظ") : t("Add", "إضافة")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
