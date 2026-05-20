import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { PageHeader } from "@/components/ui-ext/page-header";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { Building2, Plus, Edit2, Trash2, Lock } from "lucide-react";

type Branch = {
  id: number;
  name: string;
  nameAr: string | null;
  address: string | null;
  addressAr: string | null;
  phone: string | null;
  manager: string | null;
  isActive: boolean;
};

const EMPTY = { name: "", nameAr: "", address: "", addressAr: "", phone: "", manager: "", isActive: true };

export default function Branches() {
  const { t, isRtl: isAr } = useLanguage();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);

  const { data: branches, isLoading } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/branches"),
  });

  const saveMut = useMutation({
    mutationFn: (data: any) => editId
      ? apiFetch(`/branches/${editId}`, { method: "PATCH", body: JSON.stringify(data) })
      : apiFetch("/branches", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      setOpen(false); setForm(EMPTY); setEditId(null);
      toast({ title: editId ? t("Branch updated", "تم تحديث الفرع") : t("Branch created", "تم إنشاء الفرع") });
    },
    onError: (e: any) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/branches/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); toast({ title: t("Branch deleted", "تم حذف الفرع") }); },
  });

  const openCreate = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({
      name: b.name, nameAr: b.nameAr ?? "", address: b.address ?? "",
      addressAr: b.addressAr ?? "", phone: b.phone ?? "", manager: b.manager ?? "",
      isActive: b.isActive,
    });
    setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: t("Name required", "الاسم مطلوب"), variant: "destructive" }); return; }
    saveMut.mutate({
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || null,
      address: form.address.trim() || null,
      addressAr: form.addressAr.trim() || null,
      phone: form.phone.trim() || null,
      manager: form.manager.trim() || null,
      isActive: form.isActive,
    });
  };

  if (me?.role !== "admin") {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Lock size={32} className="mx-auto mb-3 opacity-40" />
          <p>{t("Branches are managed by administrators only.", "الفروع تُدار من قبل المدراء فقط.")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 size={20} />}
        title={t("Branches", "الفروع")}
        description={t("Manage your business locations", "إدارة مواقع عملك")}
        actions={<Button onClick={openCreate}><Plus size={16} className="me-1" />{t("Add branch", "إضافة فرع")}</Button>}
      />

      {isLoading ? (
        <div className="text-muted-foreground">{t("Loading…", "جارٍ التحميل…")}</div>
      ) : !branches?.length ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title={t("No branches yet", "لا توجد فروع بعد")}
          description={t("Add your first branch to start assigning users and records to specific locations.", "أضف أول فرع لبدء تعيين المستخدمين والسجلات لمواقع محددة.")}
          action={<Button onClick={openCreate}><Plus size={16} className="me-1" />{t("Add branch", "إضافة فرع")}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map(b => {
            const displayName = isAr ? (b.nameAr || b.name) : (b.name || b.nameAr || "");
            const displayAddr = isAr ? (b.addressAr || b.address) : (b.address || b.addressAr);
            return (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg">{displayName}</div>
                      {b.manager && <div className="text-sm text-muted-foreground mt-0.5">{t("Manager", "المدير")}: {b.manager}</div>}
                    </div>
                    <Badge variant={b.isActive ? "default" : "secondary"}>
                      {b.isActive ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                    </Badge>
                  </div>
                  {displayAddr && <div className="text-sm text-muted-foreground">{displayAddr}</div>}
                  {b.phone && <div className="text-sm">📞 {b.phone}</div>}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Edit2 size={14} className="me-1" />{t("Edit", "تعديل")}</Button>
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => confirmDelete({
                        title: t("Delete branch?", "حذف الفرع؟"),
                        description: t("This cannot be undone.", "لا يمكن التراجع."),
                        onConfirm: () => delMut.mutate(b.id),
                      })}><Trash2 size={14} className="me-1" />{t("Delete", "حذف")}</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? t("Edit branch", "تعديل الفرع") : t("Add branch", "إضافة فرع")}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            {isAr ? (
              <div><Label>{t("Branch name (Arabic)", "اسم الفرع (عربي)")}</Label>
                <Input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value, name: form.name || e.target.value })} required /></div>
            ) : (
              <div><Label>{t("Branch name", "اسم الفرع")}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            )}
            <div><Label>{t("Address", "العنوان")}</Label>
              <Input value={isAr ? form.addressAr : form.address}
                onChange={e => setForm({ ...form, [isAr ? "addressAr" : "address"]: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("Phone", "الهاتف")}</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>{t("Manager", "المدير")}</Label>
                <Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label>{t("Active", "نشط")}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("Cancel", "إلغاء")}</Button>
              <Button type="submit" disabled={saveMut.isPending}>{t("Save", "حفظ")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
