import React, { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Receipt, Plus, Trash2, X, User, Stethoscope, Wallet, CreditCard,
  CheckCircle2, AlertCircle, Eye, DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { BranchSelect } from "@/components/BranchSelect";
import { useAuth as useAuthForBranch } from "@/components/AuthProvider";

type Patient = { id: number; firstName: string; firstNameAr?: string | null; lastName?: string | null; lastNameAr?: string | null; phone?: string | null };
type Employee = { id: number; name: string; nameAr?: string | null; role?: string | null };
type Procedure = { id: number; name: string; nameAr: string | null; category: string | null; price: number; active: string };

type InvoiceLine = {
  id?: number;
  procedureId: number | null;
  description: string;
  descriptionAr: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Invoice = {
  id: number;
  patientId: number;
  doctorId: number | null;
  invoiceDate: string;
  total: number;
  paidAmount: number;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  paymentMethod: string | null;
  transactionId: number | null;
  notes: string | null;
  notesAr: string | null;
  patientFirstName: string | null;
  patientFirstNameAr: string | null;
  patientLastName: string | null;
  patientLastNameAr: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
  lines?: InvoiceLine[];
};

type Stats = { total: number; paid: number; outstanding: number; count: number; monthRevenue: number };

const STATUS_META = {
  unpaid:    { en: "Unpaid",    ar: "غير مدفوع",   color: "bg-amber-100 text-amber-800 border-amber-200" },
  partial:   { en: "Partial",   ar: "جزئي",        color: "bg-blue-100 text-blue-800 border-blue-200" },
  paid:      { en: "Paid",      ar: "مدفوع",       color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { en: "Cancelled", ar: "ملغاة",       color: "bg-red-100 text-red-800 border-red-200" },
} as const;

const fmtEgp = (n: number) => (n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function MedicalInvoices() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [payOpen, setPayOpen] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");

  const { user } = useAuthForBranch();
  const initialForm = () => ({
    patientId: "",
    doctorId: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash" as "cash" | "card" | "transfer" | "other",
    paidNow: "0",
    notes: "",
    notesAr: "",
    lines: [] as InvoiceLine[],
    branchId: user?.branchId ?? null as number | null,
  });
  const [form, setForm] = useState(initialForm);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["medical-invoices"], queryFn: () => apiFetch("/medical-invoices"),
  });
  const { data: stats } = useQuery<Stats>({
    queryKey: ["medical-invoices-stats"], queryFn: () => apiFetch("/medical-invoices/stats"),
  });
  const { data: patients } = useQuery<Patient[]>({ queryKey: ["patients"], queryFn: () => apiFetch("/patients") });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["employees"], queryFn: () => apiFetch("/employees") });
  const { data: procedures } = useQuery<Procedure[]>({ queryKey: ["procedures"], queryFn: () => apiFetch("/procedures") });

  const activeProcedures = (procedures || []).filter(p => p.active !== "false");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["medical-invoices"] });
    qc.invalidateQueries({ queryKey: ["medical-invoices-stats"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const addLineFromProcedure = (procId: string) => {
    if (procId === "__custom__") {
      setForm(f => ({ ...f, lines: [...f.lines, { procedureId: null, description: "", descriptionAr: null, quantity: 1, unitPrice: 0, total: 0 }] }));
      return;
    }
    const p = activeProcedures.find(x => String(x.id) === procId);
    if (!p) return;
    setForm(f => ({
      ...f,
      lines: [...f.lines, {
        procedureId: p.id,
        description: p.name,
        descriptionAr: p.nameAr,
        quantity: 1,
        unitPrice: p.price,
        total: p.price,
      }],
    }));
  };

  const updateLine = (i: number, patch: Partial<InvoiceLine>) => {
    setForm(f => {
      const lines = [...f.lines];
      const merged = { ...lines[i], ...patch };
      merged.total = merged.quantity * merged.unitPrice;
      lines[i] = merged;
      return { ...f, lines };
    });
  };
  const removeLine = (i: number) => setForm(f => ({ ...f, lines: f.lines.filter((_, x) => x !== i) }));

  const total = useMemo(() => form.lines.reduce((s, l) => s + l.total, 0), [form.lines]);

  const createMut = useMutation({
    mutationFn: () => apiFetch<Invoice>("/medical-invoices", {
      method: "POST",
      body: JSON.stringify({
        patientId: Number(form.patientId),
        doctorId: form.doctorId ? Number(form.doctorId) : null,
        invoiceDate: form.invoiceDate,
        paymentMethod: form.paymentMethod,
        paidAmount: Number(form.paidNow) || 0,
        notes: form.notes || null,
        notesAr: form.notesAr || null,
        branchId: form.branchId,
        lines: form.lines.map(l => ({
          procedureId: l.procedureId,
          description: l.description,
          descriptionAr: l.descriptionAr,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      }),
    }),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      setForm(initialForm());
      toast({ title: t("Invoice created", "تم إنشاء الفاتورة") });
    },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const payMut = useMutation({
    mutationFn: () => apiFetch(`/medical-invoices/${payOpen!.id}/pay`, {
      method: "POST",
      body: JSON.stringify({ amount: Number(payAmount), paymentMethod: payMethod }),
    }),
    onSuccess: () => {
      invalidate();
      setPayOpen(null);
      setPayAmount("");
      toast({ title: t("Payment recorded — added to Finance as income", "تم تسجيل الدفعة — أضيفت إلى المالية كدخل") });
    },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/medical-invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: t("Invoice deleted", "تم حذف الفاتورة") }); },
    onError: (e: Error) => toast({ title: e.message || t("Cannot delete — cancel instead", "لا يمكن الحذف — استخدم الإلغاء"), variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/medical-invoices/${id}/cancel`, { method: "POST" }),
    onSuccess: () => { invalidate(); toast({ title: t("Invoice cancelled — Finance reversed", "تم إلغاء الفاتورة — وعُكست في المالية") }); },
    onError: (e: Error) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  // View detail when clicking eye
  const viewMut = useMutation({
    mutationFn: (id: number) => apiFetch<Invoice>(`/medical-invoices/${id}`),
    onSuccess: (inv) => setViewing(inv),
  });

  const patientLabel = (p: Patient) =>
    isAr ? `${p.firstNameAr || p.firstName} ${p.lastNameAr || p.lastName || ""}`.trim()
         : `${p.firstName} ${p.lastName || ""}`.trim();
  const employeeLabel = (e: Employee) => isAr ? (e.nameAr || e.name) : e.name;
  const invPatient = (i: Invoice) =>
    isAr ? `${i.patientFirstNameAr || i.patientFirstName || ""} ${i.patientLastNameAr || i.patientLastName || ""}`.trim() || "—"
         : `${i.patientFirstName || ""} ${i.patientLastName || ""}`.trim() || "—";
  const invDoctor = (i: Invoice) => i.doctorId ? (isAr ? (i.doctorNameAr || i.doctorName) : i.doctorName) : null;
  const dateLocale = isAr ? "ar-EG" : "en-US";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Medical Invoices", "الفواتير الطبية")}</h2>
          <p className="text-muted-foreground">{t("Bill patients — paid amounts flow into Finance automatically", "احسب فواتير المرضى — المبالغ المدفوعة تنتقل تلقائياً إلى المالية")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(initialForm()); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-create-invoice"><Plus size={16}/>{t("New Invoice", "فاتورة جديدة")}</Button>
          </DialogTrigger>
          <DialogContent className={`max-w-3xl ${isRtl ? "rtl" : "ltr"}`}>
            <form onSubmit={(e) => { e.preventDefault(); if (form.lines.length === 0) { toast({ title: t("Add at least one line", "أضف خط واحد على الأقل"), variant: "destructive" }); return; } createMut.mutate(); }}>
              <DialogHeader><DialogTitle>{t("New Invoice", "فاتورة جديدة")}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>{t("Patient *", "المريض *")}</Label>
                    <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })} required>
                      <SelectTrigger><SelectValue placeholder={t("Select patient", "اختر مريض")} /></SelectTrigger>
                      <SelectContent>
                        {(patients || []).map(p => <SelectItem key={p.id} value={String(p.id)}>{patientLabel(p)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Date *", "التاريخ *")}</Label>
                    <Input type="date" required value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("Doctor", "الطبيب")}</Label>
                    <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                      <SelectTrigger><SelectValue placeholder={t("Optional", "اختياري")} /></SelectTrigger>
                      <SelectContent>
                        {(employees || []).map(e => <SelectItem key={e.id} value={String(e.id)}>{employeeLabel(e)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Add procedure from catalog", "أضف من الكتالوج")}</Label>
                    <Select value="" onValueChange={addLineFromProcedure}>
                      <SelectTrigger><SelectValue placeholder={t("Pick to add a line…", "اختر لإضافة خط…")} /></SelectTrigger>
                      <SelectContent>
                        {activeProcedures.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {isAr ? (p.nameAr || p.name) : p.name} — {fmtEgp(p.price)} {t("EGP", "ج.م")}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">{t("+ Custom line", "+ خط مخصص")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lines table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className={`p-2 ${isRtl ? "text-right" : "text-left"}`}>{t("Description", "الوصف")}</th>
                        <th className="p-2 w-16 text-center">{t("Qty", "الكمية")}</th>
                        <th className="p-2 w-28 text-right">{t("Price", "السعر")}</th>
                        <th className="p-2 w-28 text-right">{t("Total", "المجموع")}</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lines.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">{t("Add a procedure above to start.", "اختر إجراء بالأعلى للبدء.")}</td></tr>
                      ) : form.lines.map((l, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-1">
                            <Input className="h-8" required value={isAr ? (l.descriptionAr || l.description) : l.description}
                              onChange={(e) => updateLine(i, isAr ? { descriptionAr: e.target.value } : { description: e.target.value })} />
                          </td>
                          <td className="p-1"><Input className="h-8 text-center" type="number" min="1" value={l.quantity} onChange={(e) => updateLine(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} /></td>
                          <td className="p-1"><Input className="h-8 text-right" type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) || 0 })} /></td>
                          <td className="p-2 font-mono font-medium text-right">{fmtEgp(l.total)}</td>
                          <td className="p-1 text-center"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(i)}><X size={14} /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t">
                      <tr>
                        <td className="p-2 font-bold" colSpan={3}>{t("Total", "الإجمالي")}</td>
                        <td className="p-2 font-mono font-bold text-right text-primary">{fmtEgp(total)} {t("EGP", "ج.م")}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("Pay now (EGP)", "ادفع الآن (ج.م)")}</Label>
                    <Input type="number" min="0" step="0.01" max={total} value={form.paidNow}
                      onChange={(e) => setForm({ ...form, paidNow: e.target.value })} />
                    <p className="text-xs text-muted-foreground">{t("Leave 0 if patient hasn't paid yet. Any amount you enter will be recorded as income in Finance.", "اتركها 0 إذا لم يدفع المريض بعد. أي مبلغ ستضيفه سيُسجل كدخل في المالية.")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Payment method", "طريقة الدفع")}</Label>
                    <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t("Cash", "نقدي")}</SelectItem>
                        <SelectItem value="card">{t("Card", "بطاقة")}</SelectItem>
                        <SelectItem value="transfer">{t("Bank transfer", "تحويل بنكي")}</SelectItem>
                        <SelectItem value="other">{t("Other", "أخرى")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("Notes", "ملاحظات")}</Label>
                  <Textarea rows={2} dir={isAr ? "rtl" : "ltr"}
                    value={isAr ? form.notesAr : form.notes}
                    onChange={(e) => isAr ? setForm({ ...form, notesAr: e.target.value }) : setForm({ ...form, notes: e.target.value })} />
                </div>
                <BranchSelect value={form.branchId} onChange={(id) => setForm({ ...form, branchId: id })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || !form.patientId || form.lines.length === 0}>
                  {t("Create invoice", "إنشاء الفاتورة")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Receipt size={12} />{t("Invoices", "الفواتير")}</p>
          <p className="text-2xl font-bold mt-1">{stats?.count ?? "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign size={12} />{t("Billed", "إجمالي الفواتير")}</p>
          <p className="text-2xl font-bold mt-1">{fmtEgp(stats?.total ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 text-emerald-700"><CheckCircle2 size={12} />{t("Paid", "مدفوع")}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">{fmtEgp(stats?.paid ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 text-amber-700"><AlertCircle size={12} />{t("Outstanding", "متبقي")}</p>
          <p className="text-2xl font-bold mt-1 text-amber-700">{fmtEgp(stats?.outstanding ?? 0)}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !invoices?.length ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t("No invoices yet. Add procedures to your catalog, then bill a patient.", "لا توجد فواتير بعد. أضف إجراءات للكتالوج ثم احسب فاتورة لمريض.")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const meta = STATUS_META[inv.status];
            const dr = invDoctor(inv);
            return (
              <Card key={inv.id} data-testid={`invoice-${inv.id}`} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <div className="w-16 text-center shrink-0">
                    <p className="text-xs text-muted-foreground">#{inv.id}</p>
                    <p className="text-xs font-mono">{new Date(inv.invoiceDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold flex items-center gap-2"><User size={13} className="text-muted-foreground" />{invPatient(inv)}</p>
                    {dr && <p className="text-xs text-muted-foreground flex items-center gap-1"><Stethoscope size={11} />{dr}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{fmtEgp(inv.total)} {t("EGP", "ج.م")}</p>
                    {inv.paidAmount > 0 && inv.paidAmount < inv.total && (
                      <p className="text-xs text-emerald-700">{t("paid", "مدفوع")}: {fmtEgp(inv.paidAmount)}</p>
                    )}
                  </div>
                  <Badge className={meta.color} variant="outline">{isAr ? meta.ar : meta.en}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => viewMut.mutate(inv.id)}><Eye size={14} /></Button>
                  {inv.status !== "paid" && inv.status !== "cancelled" && (
                    <Button variant="outline" size="sm" className="gap-1 text-emerald-700 border-emerald-300"
                      onClick={() => { setPayOpen(inv); setPayAmount(String(inv.total - inv.paidAmount)); setPayMethod("cash"); }}
                      data-testid={`btn-pay-${inv.id}`}>
                      <Wallet size={13} />{t("Record payment", "تسجيل دفعة")}
                    </Button>
                  )}
                  {inv.paidAmount > 0 && inv.status !== "cancelled" ? (
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => confirmDelete({
                        title: t("Cancel invoice?", "إلغاء الفاتورة؟"),
                        description: t("Status becomes 'cancelled' and a reversing Finance entry is created automatically. The invoice is kept for audit.", "ستصبح الحالة 'ملغاة' ويتم إنشاء قيد عكسي في المالية تلقائيًا. تُحفظ الفاتورة للمراجعة."),
                        onConfirm: async () => cancelMut.mutate(inv.id),
                      })}>
                      <X size={14} />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => confirmDelete({
                        title: t("Delete invoice?", "حذف الفاتورة؟"),
                        description: t("This invoice has no payments — safe to delete.", "لا توجد دفعات على هذه الفاتورة — يمكن حذفها بأمان."),
                        onConfirm: async () => deleteMut.mutate(inv.id),
                      })}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View detail */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <DialogHeader><DialogTitle>{t(`Invoice #${viewing?.id}`, `فاتورة #${viewing?.id}`)}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("Patient: ", "المريض: ")}</span><b>{invPatient(viewing)}</b></div>
                <div><span className="text-muted-foreground">{t("Date: ", "التاريخ: ")}</span><b>{new Date(viewing.invoiceDate).toLocaleDateString(dateLocale, { dateStyle: "long" })}</b></div>
                {invDoctor(viewing) && <div><span className="text-muted-foreground">{t("Doctor: ", "الطبيب: ")}</span><b>{invDoctor(viewing)}</b></div>}
                {viewing.paymentMethod && <div><span className="text-muted-foreground">{t("Method: ", "الطريقة: ")}</span><b>{viewing.paymentMethod}</b></div>}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr><th className={`p-2 ${isRtl ? "text-right" : "text-left"}`}>{t("Item", "البند")}</th>
                    <th className="p-2 text-center">{t("Qty", "الكمية")}</th>
                    <th className="p-2 text-right">{t("Price", "السعر")}</th>
                    <th className="p-2 text-right">{t("Total", "المجموع")}</th></tr>
                  </thead>
                  <tbody>
                    {(viewing.lines || []).map(l => (
                      <tr key={l.id} className="border-t">
                        <td className="p-2">{isAr ? (l.descriptionAr || l.description) : l.description}</td>
                        <td className="p-2 text-center font-mono">{l.quantity}</td>
                        <td className="p-2 text-right font-mono">{fmtEgp(l.unitPrice)}</td>
                        <td className="p-2 text-right font-mono">{fmtEgp(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t">
                    <tr><td colSpan={3} className="p-2 font-bold">{t("Total", "الإجمالي")}</td>
                    <td className="p-2 text-right font-mono font-bold text-primary">{fmtEgp(viewing.total)} {t("EGP", "ج.م")}</td></tr>
                    <tr><td colSpan={3} className="p-2 text-emerald-700">{t("Paid", "مدفوع")}</td>
                    <td className="p-2 text-right font-mono text-emerald-700">{fmtEgp(viewing.paidAmount)}</td></tr>
                    {viewing.total - viewing.paidAmount > 0 && (
                      <tr><td colSpan={3} className="p-2 text-amber-700">{t("Outstanding", "المتبقي")}</td>
                      <td className="p-2 text-right font-mono text-amber-700">{fmtEgp(viewing.total - viewing.paidAmount)}</td></tr>
                    )}
                  </tfoot>
                </table>
              </div>
              {viewing.transactionId && (
                <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 size={12} />{t(`Linked to Finance transaction #${viewing.transactionId}`, `مرتبط بمعاملة مالية #${viewing.transactionId}`)}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={(e) => { e.preventDefault(); payMut.mutate(); }}>
            <DialogHeader><DialogTitle>{t("Record Payment", "تسجيل دفعة")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {payOpen && (
                <p className="text-sm text-muted-foreground">
                  {t(`Outstanding: ${fmtEgp(payOpen.total - payOpen.paidAmount)} EGP`, `المتبقي: ${fmtEgp(payOpen.total - payOpen.paidAmount)} ج.م`)}
                </p>
              )}
              <div className="space-y-2">
                <Label>{t("Amount (EGP) *", "المبلغ (ج.م) *")}</Label>
                <Input type="number" min="0.01" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>{t("Method", "الطريقة")}</Label>
                <Select value={payMethod} onValueChange={(v) => setPayMethod(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("Cash", "نقدي")}</SelectItem>
                    <SelectItem value="card">{t("Card", "بطاقة")}</SelectItem>
                    <SelectItem value="transfer">{t("Bank transfer", "تحويل بنكي")}</SelectItem>
                    <SelectItem value="other">{t("Other", "أخرى")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-emerald-700 flex items-center gap-1"><CreditCard size={12} />{t("This payment is added to Finance as income (category: medical).", "ستُسجل هذه الدفعة في المالية كدخل (الفئة: طبي).")}</p>
            </div>
            <DialogFooter><Button type="submit" disabled={payMut.isPending}>{t("Confirm", "تأكيد")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
