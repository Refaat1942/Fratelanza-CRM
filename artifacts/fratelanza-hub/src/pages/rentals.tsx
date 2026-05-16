import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, FileText, Upload, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Rental = {
  id: number; clientName?: string; employeeName?: string; productName?: string;
  quantity: number; startDate: string; endDate?: string; returnDate?: string;
  dailyRate?: number; totalAmount?: number; depositAmount?: number;
  status: string; notes?: string; documentPath?: string; documentName?: string;
  createdAt: string;
};

type Employee = { id: number; name: string; nameAr?: string };
type Client = { id: number; name: string; nameAr?: string };
type Product = { id: number; name: string; nameAr?: string; price: number };

const STATUSES = [
  { value: "new", en: "New", ar: "جديد", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "confirmed", en: "Confirmed", ar: "مؤكد", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "active", en: "Active", ar: "نشط", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "returned", en: "Returned", ar: "تم الإرجاع", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "cancelled", en: "Cancelled", ar: "ملغى", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
];

const emptyForm = { clientName: "", employeeName: "", productName: "", quantity: 1, startDate: "", endDate: "", returnDate: "", dailyRate: 0, totalAmount: 0, depositAmount: 0, status: "new", notes: "" };

export default function Rentals() {
  const { t, isRtl, language } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Rental | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [docFile, setDocFile] = useState<File | null>(null);

  const { data: rentals, isLoading } = useQuery<Rental[]>({ queryKey: ["rentals"], queryFn: () => apiFetch("/rentals") });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["employees"], queryFn: () => apiFetch("/employees") });
  const { data: clients } = useQuery<Client[]>({ queryKey: ["clients"], queryFn: () => apiFetch("/clients") });
  const { data: products } = useQuery<Product[]>({ queryKey: ["products"], queryFn: () => apiFetch("/products") });

  const submitRental = async (id?: number) => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== "") fd.append(k, String(v)); });
    if (docFile) fd.append("document", docFile);
    const url = id ? `/rentals/${id}` : "/rentals";
    const method = id ? "PATCH" : "POST";
    const res = await fetch(`/api${url}`, { method, body: fd, credentials: "include" });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  };

  const createR = useMutation({
    mutationFn: () => submitRental(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rentals"] }); setIsCreateOpen(false); setForm({ ...emptyForm }); setDocFile(null); toast({ title: t("Rental Created", "تم إنشاء الإيجار") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });
  const updateR = useMutation({
    mutationFn: () => submitRental(selected!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rentals"] }); setIsEditOpen(false); setForm({ ...emptyForm }); setDocFile(null); toast({ title: t("Rental Updated", "تم تحديث الإيجار") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });
  const deleteR = useMutation({
    mutationFn: (id: number) => apiFetch(`/rentals/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rentals"] }); toast({ title: t("Rental Deleted", "تم حذف الإيجار") }); },
  });

  const openEdit = (r: Rental) => {
    setSelected(r);
    setForm({ clientName: r.clientName || "", employeeName: r.employeeName || "", productName: r.productName || "", quantity: r.quantity, startDate: r.startDate || "", endDate: r.endDate || "", returnDate: r.returnDate || "", dailyRate: r.dailyRate || 0, totalAmount: r.totalAmount || 0, depositAmount: r.depositAmount || 0, status: r.status, notes: r.notes || "" });
    setIsEditOpen(true);
  };

  const getStatus = (s: string) => STATUSES.find(x => x.value === s) ?? STATUSES[0];

  const RentalForm = () => (
    <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Client", "العميل")}</Label>
          <Select value={form.clientName} onValueChange={v => setForm({ ...form, clientName: v })}>
            <SelectTrigger><SelectValue placeholder={t("Select client", "اختر عميلاً")} /></SelectTrigger>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={isRtl ? (c.nameAr || c.name) : c.name}>{isRtl ? (c.nameAr || c.name) : c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder={t("Or type name", "أو اكتب الاسم")} />
        </div>
        <div className="space-y-2">
          <Label>{t("Responsible Employee", "الموظف المسؤول")}</Label>
          <Select value={form.employeeName} onValueChange={v => setForm({ ...form, employeeName: v })}>
            <SelectTrigger><SelectValue placeholder={t("Select employee", "اختر موظفاً")} /></SelectTrigger>
            <SelectContent>{employees?.map(e => <SelectItem key={e.id} value={isRtl ? (e.nameAr || e.name) : e.name}>{isRtl ? (e.nameAr || e.name) : e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Item / Product", "العنصر / المنتج")}</Label>
          <Select value={form.productName} onValueChange={v => setForm({ ...form, productName: v })}>
            <SelectTrigger><SelectValue placeholder={t("Select product", "اختر منتجاً")} /></SelectTrigger>
            <SelectContent>{products?.map(p => <SelectItem key={p.id} value={isRtl ? (p.nameAr || p.name) : p.name}>{isRtl ? (p.nameAr || p.name) : p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder={t("Or type item name", "أو اكتب اسم العنصر")} />
        </div>
        <div className="space-y-2"><Label>{t("Quantity", "الكمية")}</Label><Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>{t("Start Date", "تاريخ البدء")}</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></div>
        <div className="space-y-2"><Label>{t("Expected End Date", "تاريخ الانتهاء المتوقع")}</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>{t("Daily Rate (EGP)", "السعر اليومي (ج.م)")}</Label><Input type="number" min={0} value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>{t("Total (EGP)", "الإجمالي (ج.م)")}</Label><Input type="number" min={0} value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>{t("Deposit (EGP)", "التأمين (ج.م)")}</Label><Input type="number" min={0} value={form.depositAmount} onChange={e => setForm({ ...form, depositAmount: Number(e.target.value) })} /></div>
      </div>
      <div className="space-y-2">
        <Label>{t("Status", "الحالة")}</Label>
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{t(s.en, s.ar)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>{t("Notes", "ملاحظات")}</Label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} dir={isRtl ? "rtl" : "ltr"} />
      </div>
      <div className="space-y-2">
        <Label>{t("Upload Document (Contract / ID)", "رفع مستند (عقد / هوية)")}</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
          <input type="file" className="hidden" id="doc-upload" onChange={e => setDocFile(e.target.files?.[0] ?? null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="text-muted-foreground" size={24} />
            {docFile ? <span className="text-sm font-medium text-primary">{docFile.name}</span> : <span className="text-sm text-muted-foreground">{t("Click to upload", "انقر للرفع")}</span>}
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Rentals", "الإيجارات")}</h2>
          <p className="text-muted-foreground">{t("Manage rental contracts and items", "إدارة عقود الإيجار والعناصر")}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) { setForm({ ...emptyForm }); setDocFile(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus size={16} />{t("New Rental", "إيجار جديد")}</Button>
          </DialogTrigger>
          <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
            <form onSubmit={e => { e.preventDefault(); createR.mutate(); }}>
              <DialogHeader><DialogTitle>{t("New Rental", "إيجار جديد")}</DialogTitle></DialogHeader>
              <RentalForm />
              <DialogFooter><Button type="submit" disabled={createR.isPending}>{t("Create Rental", "إنشاء إيجار")}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => {
          const count = rentals?.filter(r => r.status === s.value).length ?? 0;
          return (
            <span key={s.value} className={`text-xs px-3 py-1 rounded-full font-medium ${s.color}`}>
              {t(s.en, s.ar)}: {count}
            </span>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : rentals?.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("No rentals yet.", "لا توجد إيجارات بعد.")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals?.map(r => {
            const s = getStatus(r.status);
            return (
              <Card key={r.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{t(s.en, s.ar)}</span>
                        {r.productName && <span className="font-semibold">{r.productName} × {r.quantity}</span>}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        {r.clientName && <span>👤 {r.clientName}</span>}
                        {r.employeeName && <span>🧑‍💼 {r.employeeName}</span>}
                        <span>📅 {r.startDate}{r.endDate ? ` → ${r.endDate}` : ""}</span>
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.notes}</p>}
                      {r.documentName && (
                        <p className="text-xs text-primary mt-1 flex items-center gap-1"><FileText size={10} />{r.documentName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {(r.totalAmount ?? 0) > 0 && <span className="font-bold text-primary">{r.totalAmount?.toLocaleString()} {t("EGP", "ج.م")}</span>}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit2 size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { if (confirm(t("Delete?", "حذف؟"))) deleteR.mutate(r.id); }}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) { setForm({ ...emptyForm }); setDocFile(null); } }}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <form onSubmit={e => { e.preventDefault(); updateR.mutate(); }}>
            <DialogHeader><DialogTitle>{t("Edit Rental", "تعديل الإيجار")}</DialogTitle></DialogHeader>
            <RentalForm />
            <DialogFooter><Button type="submit" disabled={updateR.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
