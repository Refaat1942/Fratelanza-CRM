import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Package, PackageCheck, PackageX, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: number; name: string; nameAr?: string; description?: string; descriptionAr?: string;
  price: number; stock: number; category?: string; categoryAr?: string; sku?: string; status: string;
  createdAt: string; updatedAt: string;
};

const emptyForm = { name: "", nameAr: "", description: "", descriptionAr: "", price: 0, stock: 0, category: "", categoryAr: "", sku: "", status: "available" };

export default function Products() {
  const { t, isRtl, language } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => apiFetch("/products"),
  });

  const createP = useMutation({
    mutationFn: (d: typeof emptyForm) => apiFetch("/products", { method: "POST", body: JSON.stringify({ ...d, price: Number(d.price), stock: Number(d.stock) }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setIsCreateOpen(false); setForm({ ...emptyForm }); toast({ title: t("Product Added", "تم إضافة المنتج") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const updateP = useMutation({
    mutationFn: ({ id, d }: { id: number; d: typeof emptyForm }) => apiFetch(`/products/${id}`, { method: "PATCH", body: JSON.stringify({ ...d, price: Number(d.price), stock: Number(d.stock) }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setIsEditOpen(false); setForm({ ...emptyForm }); toast({ title: t("Product Updated", "تم تحديث المنتج") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteP = useMutation({
    mutationFn: (id: number) => apiFetch(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast({ title: t("Product Deleted", "تم حذف المنتج") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (p: Product) => {
    setSelected(p);
    setForm({ name: p.name || "", nameAr: p.nameAr || "", description: p.description || "", descriptionAr: p.descriptionAr || "", price: p.price, stock: p.stock, category: p.category || "", categoryAr: p.categoryAr || "", sku: p.sku || "", status: p.status || "available" });
    setIsEditOpen(true);
  };

  const statusCfg: Record<string, { label: string; labelAr: string; color: string; icon: any }> = {
    available: { label: "Available", labelAr: "متاح", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: PackageCheck },
    unavailable: { label: "Unavailable", labelAr: "غير متاح", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: PackageX },
    low_stock: { label: "Low Stock", labelAr: "مخزون منخفض", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  };

  const renderF = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-2"><Label>{language === "ar" ? "الاسم" : "Name"}</Label>
        <Input required value={language === "ar" ? form.nameAr : form.name} onChange={e => setForm(language === "ar" ? { ...form, nameAr: e.target.value } : { ...form, name: e.target.value })} dir={language === "ar" ? "rtl" : "ltr"} />
      </div>
      <div className="space-y-2"><Label>{language === "ar" ? "الوصف" : "Description"}</Label>
        <Textarea value={language === "ar" ? form.descriptionAr : form.description} onChange={e => setForm(language === "ar" ? { ...form, descriptionAr: e.target.value } : { ...form, description: e.target.value })} dir={language === "ar" ? "rtl" : "ltr"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>{t("Price (EGP)", "السعر (ج.م)")}</Label><Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>{t("Stock", "المخزون")}</Label><Input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
      </div>
      <div className="space-y-2"><Label>{language === "ar" ? "الفئة" : "Category"}</Label>
        <Input value={language === "ar" ? form.categoryAr : form.category} onChange={e => setForm(language === "ar" ? { ...form, categoryAr: e.target.value } : { ...form, category: e.target.value })} dir={language === "ar" ? "rtl" : "ltr"} />
      </div>
      <div className="space-y-2"><Label>{t("SKU / Code", "كود المنتج")}</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>{t("Status", "الحالة")}</Label>
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(statusCfg).map(([k, c]) => <SelectItem key={k} value={k}>{t(c.label, c.labelAr)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Product Store", "متجر المنتجات")}</h2>
          <p className="text-muted-foreground">{t("Manage your inventory and products", "إدارة مخزونك ومنتجاتك")}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) setForm({ ...emptyForm }); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus size={16} />{t("Add Product", "إضافة منتج")}</Button>
          </DialogTrigger>
          <DialogContent className={isRtl ? "rtl" : "ltr"}>
            <form onSubmit={e => { e.preventDefault(); createP.mutate({ ...form, name: form.name || form.nameAr }); }}>
              <DialogHeader><DialogTitle>{t("Add Product", "إضافة منتج")}</DialogTitle></DialogHeader>
              {renderF()}
              <DialogFooter><Button type="submit" disabled={createP.isPending}>{t("Save", "حفظ")}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : products?.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("No products yet.", "لا توجد منتجات بعد.")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products?.map(p => {
            const cfg = statusCfg[p.status] ?? statusCfg.available;
            const Icon = cfg.icon;
            return (
              <Card key={p.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{isRtl ? (p.nameAr || p.name) : p.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                          <Icon size={10} />{t(cfg.label, cfg.labelAr)}
                        </span>
                      </div>
                      {(isRtl ? (p.descriptionAr || p.description) : p.description) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{isRtl ? (p.descriptionAr || p.description) : p.description}</p>
                      )}
                      {(isRtl ? (p.categoryAr || p.category) : p.category) && (
                        <p className="text-xs text-muted-foreground mt-1">{t("Category:", "الفئة:")} {isRtl ? (p.categoryAr || p.category) : p.category}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit2 size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(t("Delete?", "حذف؟"))) deleteP.mutate(p.id); }}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
                    <span className="font-bold text-primary">{p.price.toLocaleString()} {t("EGP", "ج.م")}</span>
                    <span className="text-muted-foreground">{t("Stock:", "المخزون:")} {p.stock}</span>
                  </div>
                  {p.sku && <p className="text-xs text-muted-foreground mt-1">{t("SKU:", "كود:")} {p.sku}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) setForm({ ...emptyForm }); }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => { e.preventDefault(); if (selected) updateP.mutate({ id: selected.id, d: { ...form, name: form.name || form.nameAr } }); }}>
            <DialogHeader><DialogTitle>{t("Edit Product", "تعديل المنتج")}</DialogTitle></DialogHeader>
            {renderF()}
            <DialogFooter><Button type="submit" disabled={updateP.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
