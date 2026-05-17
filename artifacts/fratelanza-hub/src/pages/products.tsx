import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Package, PackageCheck, PackageX, AlertTriangle, ArrowUpDown, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

type Product = {
  id: number; name: string; nameAr?: string; description?: string; descriptionAr?: string;
  price: number; costPrice: number; stock: number; reorderPoint: number;
  category?: string; categoryAr?: string; sku?: string; status: string;
  createdAt: string; updatedAt: string;
};

type StockMovement = {
  id: number; productId: number; type: string; quantity: number; balanceAfter: number;
  reason?: string; username?: string; createdAt: string;
};

const emptyForm = { name: "", nameAr: "", description: "", descriptionAr: "", price: 0, costPrice: 0, stock: 0, reorderPoint: 5, category: "", categoryAr: "", sku: "", status: "available" };

export default function Products() {
  const { t, isRtl, language } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: "in", quantity: 1, reason: "" });

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => apiFetch("/products"),
  });

  const { data: movements } = useQuery<StockMovement[]>({
    queryKey: ["stock-movements", historyProduct?.id],
    queryFn: () => apiFetch(`/stock-movements?productId=${historyProduct!.id}`),
    enabled: !!historyProduct,
  });

  const createP = useMutation({
    mutationFn: (d: typeof emptyForm) => apiFetch("/products", { method: "POST", body: JSON.stringify({ ...d, price: Number(d.price), costPrice: Number(d.costPrice), stock: Number(d.stock), reorderPoint: Number(d.reorderPoint) }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setIsCreateOpen(false); setForm({ ...emptyForm }); toast({ title: t("Product Added", "تم إضافة المنتج") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const updateP = useMutation({
    mutationFn: ({ id, d }: { id: number; d: typeof emptyForm }) => apiFetch(`/products/${id}`, { method: "PATCH", body: JSON.stringify({ ...d, price: Number(d.price), costPrice: Number(d.costPrice), stock: Number(d.stock), reorderPoint: Number(d.reorderPoint) }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setIsEditOpen(false); setForm({ ...emptyForm }); toast({ title: t("Product Updated", "تم تحديث المنتج") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteP = useMutation({
    mutationFn: (id: number) => apiFetch(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast({ title: t("Product Deleted", "تم حذف المنتج") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const adjustStock = useMutation({
    mutationFn: (data: any) => apiFetch("/stock-movements", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      setAdjustProduct(null); setAdjustForm({ type: "in", quantity: 1, reason: "" });
      toast({ title: t("Stock updated", "تم تحديث المخزون") });
    },
    onError: (e: any) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (p: Product) => {
    setSelected(p);
    setForm({ name: p.name || "", nameAr: p.nameAr || "", description: p.description || "", descriptionAr: p.descriptionAr || "",
      price: p.price, costPrice: p.costPrice || 0, stock: p.stock, reorderPoint: p.reorderPoint || 5,
      category: p.category || "", categoryAr: p.categoryAr || "", sku: p.sku || "", status: p.status || "available" });
    setIsEditOpen(true);
  };

  const statusCfg: Record<string, { label: string; labelAr: string; color: string; icon: any }> = {
    available: { label: "Available", labelAr: "متاح", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: PackageCheck },
    unavailable: { label: "Out of Stock", labelAr: "نفد المخزون", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: PackageX },
    low_stock: { label: "Low Stock", labelAr: "مخزون منخفض", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  };

  const lowStockCount = products?.filter(p => p.stock <= (p.reorderPoint || 5)).length ?? 0;

  const renderF = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-2"><Label>{language === "ar" ? "الاسم" : "Name"} *</Label>
        {language === "ar"
          ? <Input required value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} dir="rtl" />
          : <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
      </div>
      <div className="space-y-2"><Label>{language === "ar" ? "الوصف" : "Description"}</Label>
        {language === "ar"
          ? <Textarea value={form.descriptionAr} onChange={e => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" />
          : <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>{t("Sale Price (EGP)", "سعر البيع (ج.م)")}</Label><Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>{t("Cost Price (EGP)", "سعر التكلفة (ج.م)")}</Label><Input type="number" min={0} step={0.01} value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>{t("Initial Stock", "المخزون الابتدائي")}</Label><Input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} disabled={!!selected} /></div>
        <div className="space-y-2"><Label>{t("Reorder Point", "حد إعادة الطلب")}</Label><Input type="number" min={0} value={form.reorderPoint} onChange={e => setForm({ ...form, reorderPoint: Number(e.target.value) })} /></div>
      </div>
      {!!selected && <p className="text-xs text-muted-foreground -mt-2">{t("To change stock, use \"Adjust Stock\" instead.", "لتغيير المخزون، استخدم \"تعديل المخزون\".")}</p>}
      <div className="space-y-2"><Label>{language === "ar" ? "الفئة" : "Category"}</Label>
        {language === "ar"
          ? <Input value={form.categoryAr} onChange={e => setForm({ ...form, categoryAr: e.target.value })} dir="rtl" />
          : <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />}
      </div>
      <div className="space-y-2"><Label>{t("SKU / Code", "كود المنتج")}</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
    </div>
  );

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Product Inventory", "مخزون المنتجات")}</h2>
          <p className="text-muted-foreground text-sm">{t("Manage stock, pricing and movements", "إدارة المخزون والأسعار والحركات")}</p>
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

      {lowStockCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-2.5 text-sm">
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="font-medium">{t(`${lowStockCount} product(s) need restocking`, `${lowStockCount} منتج يحتاج إعادة تخزين`)}</span>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-44" />)}</div>
      ) : products?.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("No products yet.", "لا توجد منتجات بعد.")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products?.map(p => {
            const isLow = p.stock <= (p.reorderPoint || 5);
            const effectiveStatus = p.stock === 0 ? "unavailable" : isLow ? "low_stock" : "available";
            const cfg = statusCfg[effectiveStatus];
            const Icon = cfg.icon;
            return (
              <Card key={p.id} className={`hover:border-primary/50 transition-colors ${isLow && p.stock > 0 ? "border-amber-500/40" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm">{isRtl ? (p.nameAr || p.name) : p.name}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                          <Icon size={10} />{t(cfg.label, cfg.labelAr)}
                        </span>
                      </div>
                      {(isRtl ? (p.categoryAr || p.category) : p.category) && (
                        <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? (p.categoryAr || p.category) : p.category}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title={t("Adjust stock", "تعديل المخزون")} onClick={() => { setAdjustProduct(p); setAdjustForm({ type: "in", quantity: 1, reason: "" }); }}><ArrowUpDown size={13} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title={t("History", "السجل")} onClick={() => setHistoryProduct(p)}><History size={13} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Edit2 size={13} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => confirmDelete({
                          title: t("Delete product?", "حذف المنتج؟"),
                          description: t(`Permanently delete "${isRtl ? (p.nameAr || p.name) : p.name}"?`, `حذف "${isRtl ? (p.nameAr || p.name) : p.name}" نهائياً؟`),
                          onConfirm: () => deleteP.mutate(p.id),
                        })}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("Sale", "البيع")}</span><span className="font-bold text-primary">{p.price.toLocaleString()} {t("EGP", "ج.م")}</span></div>
                    {p.costPrice > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t("Cost", "التكلفة")}</span><span>{p.costPrice.toLocaleString()} {t("EGP", "ج.م")}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("In stock", "المخزون")}</span><span className={`font-semibold ${isLow ? "text-amber-600" : ""}`}>{p.stock} {isLow && `/ ${p.reorderPoint}`}</span></div>
                    {p.sku && <div className="flex justify-between"><span className="text-muted-foreground">SKU</span><span>{p.sku}</span></div>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) { setForm({ ...emptyForm }); setSelected(null); } }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => { e.preventDefault(); if (selected) updateP.mutate({ id: selected.id, d: { ...form, name: form.name || form.nameAr } }); }}>
            <DialogHeader><DialogTitle>{t("Edit Product", "تعديل المنتج")}</DialogTitle></DialogHeader>
            {renderF()}
            <DialogFooter><Button type="submit" disabled={updateP.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjust Dialog */}
      <Dialog open={!!adjustProduct} onOpenChange={v => !v && setAdjustProduct(null)}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => {
            e.preventDefault();
            if (!adjustProduct) return;
            adjustStock.mutate({ productId: adjustProduct.id, type: adjustForm.type, quantity: adjustForm.quantity, reason: adjustForm.reason || undefined });
          }}>
            <DialogHeader>
              <DialogTitle>{t("Adjust Stock", "تعديل المخزون")}</DialogTitle>
              <DialogDescription>{adjustProduct && (isRtl ? (adjustProduct.nameAr || adjustProduct.name) : adjustProduct.name)} · {t("Current:", "الحالي:")} {adjustProduct?.stock}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("Movement Type", "نوع الحركة")}</Label>
                <Select value={adjustForm.type} onValueChange={v => setAdjustForm({ ...adjustForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">{t("Stock In (+)", "إدخال (+)")}</SelectItem>
                    <SelectItem value="out">{t("Stock Out (-)", "إخراج (-)")}</SelectItem>
                    <SelectItem value="adjustment">{t("Manual Adjustment (signed)", "تعديل يدوي (موجب/سالب)")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Quantity", "الكمية")}</Label>
                <Input type="number" required value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 0 })} />
                {adjustForm.type === "adjustment" && <p className="text-xs text-muted-foreground">{t("Use negative for decrease, positive for increase", "استخدم رقم سالب للخصم، موجب للزيادة")}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("Reason (optional)", "السبب (اختياري)")}</Label>
                <Textarea rows={2} value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder={t("e.g. damaged, returned, recount", "مثال: تالف، مرتجع، جرد")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustProduct(null)}>{t("Cancel", "إلغاء")}</Button>
              <Button type="submit" disabled={adjustStock.isPending}>{t("Apply", "تطبيق")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={!!historyProduct} onOpenChange={v => !v && setHistoryProduct(null)}>
        <DialogContent className={`max-w-xl ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader>
            <DialogTitle>{t("Stock History", "سجل المخزون")}</DialogTitle>
            <DialogDescription>{historyProduct && (isRtl ? (historyProduct.nameAr || historyProduct.name) : historyProduct.name)}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            {!movements || movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("No movements yet", "لا توجد حركات بعد")}</p>
            ) : (
              <div className="divide-y border rounded">
                {movements.map(m => (
                  <div key={m.id} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${m.quantity >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {m.type === "in" ? t("IN", "إدخال") : m.type === "out" ? t("OUT", "إخراج") : t("ADJ", "تعديل")}
                        </span>
                        <span className="font-semibold">{m.quantity >= 0 ? "+" : ""}{m.quantity}</span>
                        <span className="text-xs text-muted-foreground">→ {m.balanceAfter}</span>
                      </div>
                      {m.reason && <p className="text-xs text-muted-foreground mt-0.5">{m.reason}</p>}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{new Date(m.createdAt).toLocaleString()}</div>
                      {m.username && <div>{m.username}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
