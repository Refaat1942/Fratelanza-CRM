import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, Truck, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

type Supplier = {
  id: number;
  name: string;
  nameAr?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

const empty = { name: "", nameAr: "", contactPerson: "", phone: "", email: "", address: "", notes: "" };

export default function SuppliersPage() {
  const { t, isRtl, language } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const confirmDelete = useDeleteConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => apiFetch("/suppliers"),
  });

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? apiFetch(`/suppliers/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : apiFetch("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false); setEditing(null); setForm(empty);
      toast({ title: editing ? t("Supplier updated", "تم تحديث المورد") : t("Supplier created", "تم إنشاء المورد") });
    },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast({ title: t("Supplier deleted", "تم حذف المورد") }); },
  });

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name || "", nameAr: s.nameAr || "", contactPerson: s.contactPerson || "",
      phone: s.phone || "", email: s.email || "", address: s.address || "", notes: s.notes || "",
    });
    setOpen(true);
  };

  const buildPayload = () => {
    const p: any = { name: language === "ar" ? (form.nameAr || form.name) : form.name };
    if (language === "ar") p.nameAr = form.nameAr;
    if (form.contactPerson) p.contactPerson = form.contactPerson;
    if (form.phone) p.phone = form.phone;
    if (form.email) p.email = form.email;
    if (form.address) p.address = form.address;
    if (form.notes) p.notes = form.notes;
    return p;
  };

  const renderFields = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>{t("Supplier Name", "اسم المورد")} *</Label>
        {language === "ar"
          ? <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required dir="rtl" />
          : <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}
      </div>
      <div className="space-y-2"><Label>{t("Contact Person", "الشخص المسؤول")}</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>{t("Phone", "الهاتف")}</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-2"><Label>{t("Email", "البريد")}</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>{t("Address", "العنوان")}</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
      <div className="space-y-2"><Label>{t("Notes", "ملاحظات")}</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
    </div>
  );

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("Suppliers", "الموردون")}</h2>
          <p className="text-muted-foreground text-sm">{t("Manage your suppliers and vendor contacts", "إدارة الموردين وجهات الاتصال")}</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5"><Plus size={16} />{t("Add Supplier", "إضافة مورد")}</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map(s => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Truck size={18} /></div>
                  <div>
                    <CardTitle className="text-base">{isRtl ? (s.nameAr || s.name) : s.name}</CardTitle>
                    {s.contactPerson && <p className="text-xs text-muted-foreground">{s.contactPerson}</p>}
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit2 size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => confirmDelete({
                      title: t("Delete supplier?", "حذف المورد؟"),
                      description: t(`Permanently delete "${isRtl ? (s.nameAr || s.name) : s.name}"?`, `حذف "${isRtl ? (s.nameAr || s.name) : s.name}" نهائياً؟`),
                      onConfirm: () => del.mutate(s.id),
                    })}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1 text-muted-foreground">
                {s.phone && <div className="flex items-center gap-1.5"><Phone size={12} />{s.phone}</div>}
                {s.email && <div className="flex items-center gap-1.5"><Mail size={12} />{s.email}</div>}
                {s.address && <div>{s.address}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><Truck size={32} className="mx-auto mb-2 opacity-40" /><p>{t("No suppliers yet", "لا يوجد موردون بعد")}</p></CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => { e.preventDefault(); save.mutate(buildPayload()); }}>
            <DialogHeader><DialogTitle>{editing ? t("Edit Supplier", "تعديل المورد") : t("Add Supplier", "إضافة مورد")}</DialogTitle></DialogHeader>
            {renderFields()}
            <DialogFooter><Button type="submit" disabled={save.isPending}>{t("Save", "حفظ")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
