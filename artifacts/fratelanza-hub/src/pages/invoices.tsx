import React, { useState, useMemo } from "react";
import { useLanguage } from "../components/LanguageProvider";
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
import { Plus, Trash2, FileText, Printer, MessageCircle, CheckCircle2, Eye, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { openWhatsApp } from "@/lib/whatsapp";

type Client = { id: number; name: string; nameAr?: string; phone?: string; email?: string };
type Item = { description: string; descriptionAr?: string; quantity: number; unitPrice: number };
type Invoice = {
  id: number; invoiceNumber: string; clientId: number | null;
  clientNameSnapshot: string | null; clientPhoneSnapshot: string | null;
  status: string; issueDate: string; dueDate: string | null;
  subtotal: number; taxRate: number; taxAmount: number; total: number; paidAmount: number;
  notes: string | null; notesAr: string | null;
  createdAt: string;
};
type InvoiceDetail = Invoice & { items: (Item & { id: number; total: number; sortOrder: number })[]; client: Client | null };
type Stats = Record<string, { count: number; total: number }>;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  overdue: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const emptyItem = (): Item => ({ description: "", descriptionAr: "", quantity: 1, unitPrice: 0 });

export default function Invoices() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [paymentInv, setPaymentInv] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState({
    clientId: "" as string,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    taxRate: 0,
    notes: "",
    notesAr: "",
    items: [emptyItem()],
  });

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", filterStatus],
    queryFn: () => apiFetch(`/invoices${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`),
  });
  const { data: stats } = useQuery<Stats>({ queryKey: ["invoices-stats"], queryFn: () => apiFetch("/invoices/stats") });
  const { data: clients } = useQuery<Client[]>({ queryKey: ["clients"], queryFn: () => apiFetch("/clients") });
  const { data: detail } = useQuery<InvoiceDetail>({
    queryKey: ["invoice", viewId], queryFn: () => apiFetch(`/invoices/${viewId}`), enabled: viewId !== null,
  });

  const subtotal = useMemo(() => form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0), [form.items]);
  const taxAmount = useMemo(() => +(subtotal * (form.taxRate / 100)).toFixed(2), [subtotal, form.taxRate]);
  const total = useMemo(() => +(subtotal + taxAmount).toFixed(2), [subtotal, taxAmount]);

  const resetForm = () => setForm({
    clientId: "", issueDate: new Date().toISOString().slice(0, 10), dueDate: "",
    taxRate: 0, notes: "", notesAr: "", items: [emptyItem()],
  });

  const createInv = useMutation({
    mutationFn: () => apiFetch("/invoices", {
      method: "POST",
      body: JSON.stringify({
        clientId: form.clientId ? Number(form.clientId) : null,
        issueDate: form.issueDate, dueDate: form.dueDate || null,
        taxRate: Number(form.taxRate) || 0,
        notes: form.notes || null, notesAr: form.notesAr || null,
        items: form.items.filter(it => it.description.trim()).map(it => ({
          description: it.description, descriptionAr: it.descriptionAr || null,
          quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) || 0,
        })),
      }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices-stats"] });
      setCreateOpen(false); resetForm();
      toast({ title: t("Invoice created", "تم إنشاء الفاتورة") });
    },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices-stats"] });
      qc.invalidateQueries({ queryKey: ["invoice", viewId] });
      toast({ title: t("Status updated", "تم تحديث الحالة") });
    },
  });

  const recordPayment = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      apiFetch(`/invoices/${id}/payments`, { method: "POST", body: JSON.stringify({ amount, recordTransaction: true }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices-stats"] });
      qc.invalidateQueries({ queryKey: ["invoice", viewId] });
      setPaymentInv(null); setPaymentAmount("");
      toast({ title: t("Payment recorded", "تم تسجيل الدفعة") });
    },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteInv = useMutation({
    mutationFn: (id: number) => apiFetch(`/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices-stats"] });
      toast({ title: t("Invoice deleted", "تم حذف الفاتورة") });
    },
  });

  const sendWhatsApp = (inv: Invoice | InvoiceDetail) => {
    const phone = inv.clientPhoneSnapshot || (("client" in inv && inv.client?.phone) || null);
    const greeting = isAr ? "السلام عليكم" : "Hello";
    const msg = isAr
      ? `${greeting}،\nفاتورتك رقم *${inv.invoiceNumber}*\nالإجمالي: *${inv.total.toFixed(2)} ج.م*${inv.dueDate ? `\nتاريخ الاستحقاق: ${inv.dueDate}` : ""}\nشكراً لتعاملك معنا.`
      : `${greeting},\nYour invoice *${inv.invoiceNumber}*\nTotal: *EGP ${inv.total.toFixed(2)}*${inv.dueDate ? `\nDue: ${inv.dueDate}` : ""}\nThank you for your business.`;
    const ok = openWhatsApp(phone, msg);
    if (!ok) toast({ title: t("No phone number on file for this client", "لا يوجد رقم هاتف لهذا العميل"), variant: "destructive" });
  };

  const printInvoice = () => window.print();

  const statCards = [
    { key: "draft", labelEn: "Draft", labelAr: "مسودة", color: "slate" },
    { key: "sent", labelEn: "Sent", labelAr: "مرسلة", color: "blue" },
    { key: "paid", labelEn: "Paid", labelAr: "مدفوعة", color: "emerald" },
    { key: "overdue", labelEn: "Overdue", labelAr: "متأخرة", color: "rose" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold">{t("Invoices", "الفواتير")}</h2>
          <p className="text-muted-foreground">{t("Create, send and track invoices in EGP", "إنشاء وإرسال ومتابعة الفواتير بالجنيه المصري")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2"><Plus size={16} />{t("New Invoice", "فاتورة جديدة")}</Button>
          </DialogTrigger>
          <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRtl ? "rtl" : "ltr"}`}>
            <form onSubmit={e => { e.preventDefault(); createInv.mutate(); }}>
              <DialogHeader><DialogTitle>{t("New Invoice", "فاتورة جديدة")}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Client", "العميل")}</Label>
                    <Select value={form.clientId} onValueChange={v => setForm({ ...form, clientId: v })}>
                      <SelectTrigger><SelectValue placeholder={t("Select client (optional)", "اختر عميل (اختياري)")} /></SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{isAr ? (c.nameAr || c.name) : c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Tax Rate %", "نسبة الضريبة %")}</Label>
                    <Input type="number" min="0" max="100" step="0.01" value={form.taxRate}
                      onChange={e => setForm({ ...form, taxRate: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Issue Date", "تاريخ الإصدار")}</Label>
                    <Input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Due Date", "تاريخ الاستحقاق")}</Label>
                    <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>{t("Line Items", "بنود الفاتورة")}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}>
                      <Plus size={14} className="mr-1" />{t("Add Line", "إضافة بند")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-xs">{t("Description", "الوصف")}</Label>
                          <Input
                            dir={isAr ? "rtl" : "ltr"}
                            value={isAr ? (it.descriptionAr || "") : it.description}
                            onChange={e => {
                              const next = [...form.items];
                              if (isAr) next[idx].descriptionAr = e.target.value;
                              else next[idx].description = e.target.value;
                              if (!next[idx].description && isAr) next[idx].description = e.target.value;
                              setForm({ ...form, items: next });
                            }}
                            placeholder={t("Item description", "وصف البند")}
                            required={idx === 0}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">{t("Qty", "الكمية")}</Label>
                          <Input type="number" min="0" step="0.01" value={it.quantity}
                            onChange={e => { const next = [...form.items]; next[idx].quantity = Number(e.target.value); setForm({ ...form, items: next }); }} />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">{t("Unit Price", "السعر")}</Label>
                          <Input type="number" min="0" step="0.01" value={it.unitPrice}
                            onChange={e => { const next = [...form.items]; next[idx].unitPrice = Number(e.target.value); setForm({ ...form, items: next }); }} />
                        </div>
                        <div className="col-span-1 text-xs text-muted-foreground self-center pt-4">
                          {((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toFixed(2)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {form.items.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="text-destructive"
                              onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}>
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/40 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between"><span>{t("Subtotal", "المجموع الفرعي")}</span><span className="font-medium">{subtotal.toFixed(2)} {t("EGP", "ج.م")}</span></div>
                  <div className="flex justify-between"><span>{t("Tax", "الضريبة")} ({form.taxRate}%)</span><span className="font-medium">{taxAmount.toFixed(2)} {t("EGP", "ج.م")}</span></div>
                  <div className="flex justify-between pt-2 border-t text-base font-bold"><span>{t("Total", "الإجمالي")}</span><span>{total.toFixed(2)} {t("EGP", "ج.م")}</span></div>
                </div>

                <div className="space-y-2">
                  <Label>{t("Notes", "ملاحظات")}</Label>
                  <Textarea dir={isAr ? "rtl" : "ltr"}
                    value={isAr ? form.notesAr : form.notes}
                    onChange={e => isAr ? setForm({ ...form, notesAr: e.target.value }) : setForm({ ...form, notes: e.target.value })}
                    placeholder={t("Payment terms, thank-you message, etc.", "شروط الدفع، رسالة شكر، إلخ.")} />
                </div>
              </div>
              <DialogFooter><Button type="submit" disabled={createInv.isPending}>{t("Create Invoice", "إنشاء الفاتورة")}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        {statCards.map(s => (
          <Card key={s.key} className={`bg-${s.color}-50/50 dark:bg-${s.color}-900/10 border-${s.color}-200 dark:border-${s.color}-900/30 cursor-pointer hover:scale-[1.02] transition-transform`}
            onClick={() => setFilterStatus(s.key === filterStatus ? "all" : s.key)}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t(s.labelEn, s.labelAr)}</p>
              <p className="text-2xl font-bold mt-1">{stats?.[s.key]?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{(stats?.[s.key]?.total ?? 0).toFixed(0)} {t("EGP", "ج.م")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filterStatus !== "all" && (
        <div className="flex items-center gap-2 print:hidden">
          <span className="text-sm text-muted-foreground">{t("Filtered:", "تصفية:")}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[filterStatus]}`}>{filterStatus}</span>
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus("all")}>{t("Clear", "مسح")}</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : invoices?.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t("No invoices yet. Click 'New Invoice' to create one.", "لا توجد فواتير. انقر على 'فاتورة جديدة' للبدء.")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices?.map(inv => (
            <Card key={inv.id} className="hover:border-primary/40 transition-colors print:hidden">
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold font-mono text-sm">{inv.invoiceNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>{inv.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {inv.clientNameSnapshot || t("(no client)", "(بدون عميل)")} · {inv.issueDate}
                    {inv.dueDate && <span> · {t("Due", "استحقاق")}: {inv.dueDate}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{inv.total.toFixed(2)} {t("EGP", "ج.م")}</p>
                  {inv.paidAmount > 0 && inv.paidAmount < inv.total && (
                    <p className="text-xs text-emerald-600">{t("Paid", "مدفوع")}: {inv.paidAmount.toFixed(2)}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setViewId(inv.id)} title={t("View", "عرض")}><Eye size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => sendWhatsApp(inv)} title={t("Send via WhatsApp", "إرسال عبر واتساب")} className="text-emerald-600 hover:bg-emerald-50">
                    <MessageCircle size={16} />
                  </Button>
                  {inv.status !== "paid" && inv.status !== "cancelled" && (
                    <Button variant="ghost" size="icon" onClick={() => { setPaymentInv(inv); setPaymentAmount(String(inv.total - inv.paidAmount)); }} title={t("Record Payment", "تسجيل دفعة")} className="text-blue-600">
                      <DollarSign size={16} />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive"
                    onClick={() => confirmDelete({ title: t("Delete this invoice?", "حذف هذه الفاتورة؟"), onConfirm: () => deleteInv.mutate(inv.id) })}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail / print view */}
      <Dialog open={viewId !== null} onOpenChange={v => !v && setViewId(null)}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${isRtl ? "rtl" : "ltr"} print:max-w-none print:shadow-none print:border-0`}>
          {detail && (
            <div className="print-area">
              <DialogHeader className="print:hidden">
                <DialogTitle className="flex items-center justify-between">
                  <span>{t("Invoice Detail", "تفاصيل الفاتورة")}</span>
                  <div className="flex gap-2 mr-6">
                    {detail.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: detail.id, status: "sent" })}>
                        <CheckCircle2 size={14} className="mr-1" />{t("Mark Sent", "وضع كمرسلة")}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => sendWhatsApp(detail)} className="text-emerald-600">
                      <MessageCircle size={14} className="mr-1" />{t("WhatsApp", "واتساب")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={printInvoice}>
                      <Printer size={14} className="mr-1" />{t("Print / PDF", "طباعة / PDF")}
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="bg-white text-slate-900 p-8 rounded-lg border print:border-0 print:p-0">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("INVOICE", "فاتورة")}</h1>
                    <p className="text-slate-500 mt-1 font-mono text-sm">{detail.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium uppercase ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("Bill To", "إلى")}</p>
                    <p className="font-semibold">{detail.clientNameSnapshot || t("(no client)", "(بدون عميل)")}</p>
                    {detail.client?.phone && <p className="text-slate-600">{detail.client.phone}</p>}
                    {detail.client?.email && <p className="text-slate-600">{detail.client.email}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("Issue Date", "تاريخ الإصدار")}</p>
                    <p className="font-medium">{detail.issueDate}</p>
                    {detail.dueDate && (<>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mt-2 mb-1">{t("Due Date", "تاريخ الاستحقاق")}</p>
                      <p className="font-medium">{detail.dueDate}</p>
                    </>)}
                  </div>
                </div>

                <table className="w-full text-sm mb-6">
                  <thead className="border-b-2 border-slate-300">
                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                      <th className="text-left py-2">{t("Description", "الوصف")}</th>
                      <th className="text-right py-2 w-20">{t("Qty", "الكمية")}</th>
                      <th className="text-right py-2 w-28">{t("Unit Price", "السعر")}</th>
                      <th className="text-right py-2 w-28">{t("Total", "الإجمالي")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map(it => (
                      <tr key={it.id} className="border-b border-slate-100">
                        <td className="py-3">{isAr && it.descriptionAr ? it.descriptionAr : it.description}</td>
                        <td className="text-right py-3">{it.quantity}</td>
                        <td className="text-right py-3">{it.unitPrice.toFixed(2)}</td>
                        <td className="text-right py-3 font-medium">{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-6">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between"><span>{t("Subtotal", "المجموع الفرعي")}</span><span>{detail.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>{t("Tax", "الضريبة")} ({detail.taxRate}%)</span><span>{detail.taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between pt-2 border-t-2 border-slate-300 text-base font-bold"><span>{t("Total", "الإجمالي")}</span><span>{detail.total.toFixed(2)} {t("EGP", "ج.م")}</span></div>
                    {detail.paidAmount > 0 && (
                      <div className="flex justify-between text-emerald-700"><span>{t("Paid", "المدفوع")}</span><span>−{detail.paidAmount.toFixed(2)}</span></div>
                    )}
                    {detail.paidAmount > 0 && detail.paidAmount < detail.total && (
                      <div className="flex justify-between pt-1 border-t font-semibold"><span>{t("Balance Due", "المتبقي")}</span><span>{(detail.total - detail.paidAmount).toFixed(2)}</span></div>
                    )}
                  </div>
                </div>

                {((isAr && detail.notesAr) || (!isAr && detail.notes)) && (
                  <div className="mt-6 pt-4 border-t text-sm text-slate-600">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("Notes", "ملاحظات")}</p>
                    <p className="whitespace-pre-wrap">{isAr ? detail.notesAr : detail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record payment dialog */}
      <Dialog open={paymentInv !== null} onOpenChange={v => !v && setPaymentInv(null)}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle>{t("Record Payment", "تسجيل دفعة")}</DialogTitle></DialogHeader>
          {paymentInv && (
            <form onSubmit={e => { e.preventDefault(); recordPayment.mutate({ id: paymentInv.id, amount: Number(paymentAmount) }); }}>
              <div className="space-y-4 py-4">
                <div className="text-sm bg-muted/40 p-3 rounded">
                  <p>{t("Invoice", "فاتورة")}: <span className="font-mono font-semibold">{paymentInv.invoiceNumber}</span></p>
                  <p>{t("Total", "الإجمالي")}: <span className="font-semibold">{paymentInv.total.toFixed(2)} {t("EGP", "ج.م")}</span></p>
                  {paymentInv.paidAmount > 0 && <p>{t("Already Paid", "مدفوع سابقاً")}: {paymentInv.paidAmount.toFixed(2)}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t("Payment Amount (EGP)", "مبلغ الدفعة (ج.م)")}</Label>
                  <Input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required autoFocus />
                  <p className="text-xs text-muted-foreground">{t("This will also create an Income entry in Finance.", "سيتم إضافة قيد دخل في المالية تلقائياً.")}</p>
                </div>
              </div>
              <DialogFooter><Button type="submit" disabled={recordPayment.isPending}>{t("Record", "تسجيل")}</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
