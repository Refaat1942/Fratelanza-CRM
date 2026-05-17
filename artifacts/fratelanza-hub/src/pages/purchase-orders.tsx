import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, FileText, PackageCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

type PO = {
  id: number; poNumber: string; supplierId: number; status: string;
  orderDate: string; expectedDate?: string; receivedDate?: string;
  total: number; notes?: string;
};
type Supplier = { id: number; name: string; nameAr?: string };
type Product = { id: number; name: string; nameAr?: string; stock: number; costPrice: number };
type LineItem = { productId: number; quantity: number; unitCost: number };

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-secondary text-foreground",
  ordered: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  received: "bg-green-500/15 text-green-700 dark:text-green-400",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function PurchaseOrdersPage() {
  const { t, isRtl } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const confirmDelete = useDeleteConfirm();

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  const { data: pos, isLoading } = useQuery<PO[]>({ queryKey: ["purchase-orders"], queryFn: () => apiFetch("/purchase-orders") });
  const { data: suppliers } = useQuery<Supplier[]>({ queryKey: ["suppliers"], queryFn: () => apiFetch("/suppliers") });
  const { data: products } = useQuery<Product[]>({ queryKey: ["products"], queryFn: () => apiFetch("/products") });

  const create = useMutation({
    mutationFn: (data: any) => apiFetch("/purchase-orders", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      setOpen(false); setSupplierId(""); setItems([]); setNotes(""); setExpectedDate("");
      toast({ title: t("Purchase order created", "تم إنشاء أمر الشراء") });
    },
    onError: (e: any) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const receive = useMutation({
    mutationFn: (id: number) => apiFetch(`/purchase-orders/${id}/receive`, { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({ title: t("Stock received", "تم استلام المخزون") });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`/purchase-orders/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase-orders"] }); toast({ title: t("Deleted", "تم الحذف") }); },
  });

  const addItem = () => setItems([...items, { productId: 0, quantity: 1, unitCost: 0 }]);
  const updateItem = (i: number, patch: Partial<LineItem>) => setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const total = items.reduce((s, it) => s + it.quantity * it.unitCost, 0);

  const submit = () => {
    if (!supplierId) { toast({ title: t("Select a supplier", "اختر مورداً"), variant: "destructive" }); return; }
    const valid = items.filter(it => it.productId && it.quantity > 0);
    if (valid.length === 0) { toast({ title: t("Add at least one item", "أضف عنصراً واحداً على الأقل"), variant: "destructive" }); return; }
    create.mutate({ supplierId: parseInt(supplierId), orderDate, expectedDate: expectedDate || undefined, notes: notes || undefined, items: valid, status: "ordered" });
  };

  const supplierName = (id: number) => {
    const s = suppliers?.find(x => x.id === id);
    return s ? (isRtl ? (s.nameAr || s.name) : s.name) : "—";
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("Purchase Orders", "أوامر الشراء")}</h2>
          <p className="text-muted-foreground text-sm">{t("Order stock from suppliers and receive into inventory", "اطلب المخزون من الموردين واستلمه في المخزن")}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus size={16} />{t("New Order", "أمر جديد")}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : pos && pos.length > 0 ? (
        <div className="space-y-3">
          {pos.map(po => (
            <Card key={po.id}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><FileText size={18} /></div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{po.poNumber}</span>
                      <Badge className={`text-[10px] h-4 px-1.5 ${STATUS_COLORS[po.status] || ""}`}>{t(po.status, po.status)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {supplierName(po.supplierId)} · {po.orderDate}
                      {po.expectedDate && ` · ${t("Expected", "متوقع")}: ${po.expectedDate}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("Total", "الإجمالي")}</p>
                    <p className="font-semibold text-sm">{po.total.toFixed(2)} {t("EGP", "ج.م")}</p>
                  </div>
                  {po.status !== "received" && po.status !== "cancelled" && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => receive.mutate(po.id)} disabled={receive.isPending}>
                      <PackageCheck size={14} />{t("Receive", "استلام")}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => confirmDelete({
                      title: t("Delete order?", "حذف الأمر؟"),
                      description: t(`Delete ${po.poNumber}?`, `حذف ${po.poNumber}؟`),
                      onConfirm: () => del.mutate(po.id),
                    })}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><FileText size={32} className="mx-auto mb-2 opacity-40" /><p>{t("No purchase orders yet", "لا توجد أوامر شراء بعد")}</p></CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader><DialogTitle>{t("New Purchase Order", "أمر شراء جديد")}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("Supplier", "المورد")} *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder={t("Select supplier", "اختر المورد")} /></SelectTrigger>
                  <SelectContent>
                    {suppliers?.map(s => <SelectItem key={s.id} value={String(s.id)}>{isRtl ? (s.nameAr || s.name) : s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("Order Date", "تاريخ الأمر")}</Label><Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>{t("Expected Delivery", "موعد التسليم المتوقع")}</Label><Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} /></div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("Items", "العناصر")}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus size={14} className="mr-1" />{t("Add", "إضافة")}</Button>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded">{t("No items added", "لا توجد عناصر")}</p>
              ) : items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_90px_auto] gap-2 items-end">
                  <Select value={String(it.productId)} onValueChange={v => { const p = products?.find(x => x.id === parseInt(v)); updateItem(i, { productId: parseInt(v), unitCost: p?.costPrice || it.unitCost }); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t("Product", "منتج")} /></SelectTrigger>
                    <SelectContent>{products?.map(p => <SelectItem key={p.id} value={String(p.id)}>{isRtl ? (p.nameAr || p.name) : p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={1} value={it.quantity} onChange={e => updateItem(i, { quantity: parseInt(e.target.value) || 0 })} placeholder={t("Qty", "كمية")} />
                  <Input type="number" step="0.01" min={0} value={it.unitCost} onChange={e => updateItem(i, { unitCost: parseFloat(e.target.value) || 0 })} placeholder={t("Cost", "السعر")} />
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeItem(i)}><Trash2 size={14} /></Button>
                </div>
              ))}
              {items.length > 0 && (
                <div className="flex justify-end text-sm font-medium pt-2">{t("Total", "الإجمالي")}: {total.toFixed(2)} {t("EGP", "ج.م")}</div>
              )}
            </div>

            <div className="space-y-2"><Label>{t("Notes", "ملاحظات")}</Label><Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("Cancel", "إلغاء")}</Button>
            <Button onClick={submit} disabled={create.isPending}>{t("Create Order", "إنشاء الأمر")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
