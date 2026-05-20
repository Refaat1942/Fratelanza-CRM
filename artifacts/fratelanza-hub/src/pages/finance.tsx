import React, { useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { 
  useListTransactions, 
  useGetFinancialSummary, 
  useCreateTransaction, 
  useUpdateTransaction, 
  useDeleteTransaction,
  getListTransactionsQueryKey,
  getGetFinancialSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Plus, Trash2, Edit2, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { BranchSelect } from "@/components/BranchSelect";
import { useAuth } from "@/components/AuthProvider";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function Finance() {
  const { t, isRtl } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const { language } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    amount: 0,
    type: "income",
    category: "Services",
    date: new Date().toISOString().split('T')[0],
    branchId: (user?.branchId ?? null) as number | null,
  });

  const { data: summary, isLoading: isSummaryLoading } = useGetFinancialSummary();
  const { data: transactions, isLoading: isTransactionsLoading } = useListTransactions(
    typeFilter !== "all" ? { type: typeFilter as any } : {}
  );

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction.mutateAsync({ data: { ...formData, amount: Number(formData.amount) } as any });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: t("Transaction Recorded", "تم تسجيل المعاملة") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    try {
      await updateTransaction.mutateAsync({ id: selectedTx.id, data: { ...formData, amount: Number(formData.amount) } as any });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
      setIsEditOpen(false);
      resetForm();
      toast({ title: t("Transaction Updated", "تم تحديث المعاملة") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    confirmDelete({
      title: t("Delete transaction?", "حذف المعاملة؟"),
      onConfirm: async () => {
        try {
          await deleteTransaction.mutateAsync({ id });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
          toast({ title: t("Transaction deleted", "تم حذف المعاملة") });
        } catch { toast({ title: t("Error", "خطأ"), variant: "destructive" }); }
      },
    });
  };

  const _unusedDelete = async (id: number) => {
    try {
      await deleteTransaction.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
      toast({ title: t("Transaction Deleted", "تم حذف المعاملة") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const openEdit = (tx: any) => {
    setSelectedTx(tx);
    setFormData({
      title: tx.title || "",
      titleAr: tx.titleAr || "",
      description: tx.description || "",
      amount: tx.amount || 0,
      type: tx.type || "income",
      category: tx.category || "",
      date: tx.date || new Date().toISOString().split('T')[0],
      branchId: tx.branchId ?? null,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      titleAr: "",
      description: "",
      amount: 0,
      type: "income",
      category: "Services",
      date: new Date().toISOString().split('T')[0],
      branchId: null,
    });
    setSelectedTx(null);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString(isRtl ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 })} ${isRtl ? 'ج.م' : 'EGP'}`;
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const incomeCategories = summary?.byCategory.filter(c => c.type === 'income') || [];
  const expenseCategories = summary?.byCategory.filter(c => c.type === 'expense') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Finance", "المالية")}</h2>
          <p className="text-muted-foreground">{t("Track income and expenses", "تتبع الدخل والمصروفات")}</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="btn-create-tx" className="shrink-0 gap-2">
              <Plus size={16} />
              {t("New Record", "تسجيل جديد")}
            </Button>
          </DialogTrigger>
          <DialogContent className={isRtl ? "rtl" : "ltr"}>
            <form onSubmit={handleCreateTransaction}>
              <DialogHeader>
                <DialogTitle>{t("Add Record", "إضافة سجل")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>{t("Type", "النوع")}</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">{t("Income", "دخل")}</SelectItem>
                        <SelectItem value="expense">{t("Expense", "مصروف")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "العنوان *" : "Title *"}</Label>
                  <Input
                    required
                    dir={language === "ar" ? "rtl" : "ltr"}
                    value={language === "ar" ? formData.titleAr : formData.title}
                    onChange={e => language === "ar"
                      ? setFormData({ ...formData, titleAr: e.target.value, title: e.target.value })
                      : setFormData({ ...formData, title: e.target.value, titleAr: formData.titleAr || e.target.value })
                    }
                    placeholder={language === "ar" ? "أدخل العنوان..." : "Enter title..."}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Amount", "المبلغ")}</Label>
                    <Input type="number" step="0.01" min="0" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Date", "التاريخ")}</Label>
                    <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("Category", "الفئة")}</Label>
                  <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <BranchSelect value={formData.branchId} onChange={(id) => setFormData({ ...formData, branchId: id })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTransaction.isPending}>{t("Save", "حفظ")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {isSummaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">{t("Net Balance", "الرصيد الصافي")}</p>
                  <h3 className="text-3xl font-bold mt-2">{formatCurrency(summary.netBalance)}</h3>
                </div>
                <div className="p-3 bg-white/10 rounded-full">
                  <Wallet size={24} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{t("Total Income", "إجمالي الدخل")}</p>
                  <h3 className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalIncome)}</h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{t("Total Expenses", "إجمالي المصروفات")}</p>
                  <h3 className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">{formatCurrency(summary.totalExpenses)}</h3>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <TrendingDown size={24} className="text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <Card className="col-span-1 border-border">
          <CardHeader>
            <CardTitle className="text-lg">{t("Expenses by Category", "المصروفات حسب الفئة")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-0">
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                {t("No data available", "لا تتوفر بيانات")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="col-span-1 lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border mb-4 px-6 pt-6">
            <CardTitle className="text-lg">{t("Transactions", "المعاملات")}</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={typeFilter === "all" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTypeFilter("all")}
              >
                {t("All", "الكل")}
              </Button>
              <Button 
                variant={typeFilter === "income" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTypeFilter("income")}
                className="text-emerald-600 dark:text-emerald-400"
              >
                {t("Income", "دخل")}
              </Button>
              <Button 
                variant={typeFilter === "expense" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setTypeFilter("expense")}
                className="text-red-600 dark:text-red-400"
              >
                {t("Expense", "مصروف")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {isTransactionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : transactions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("No transactions found.", "لا توجد معاملات.")}
              </div>
            ) : (
              <div className="space-y-1">
                {transactions?.map(tx => (
                  <div key={tx.id} className="group flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border" data-testid={`tx-${tx.id}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {isRtl ? (tx.titleAr || tx.title) : tx.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal">
                            {tx.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTransaction(tx.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={handleUpdateTransaction}>
            <DialogHeader>
              <DialogTitle>{t("Edit Record", "تعديل سجل")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>{t("Type", "النوع")}</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t("Income", "دخل")}</SelectItem>
                      <SelectItem value="expense">{t("Expense", "مصروف")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان *" : "Title *"}</Label>
                <Input
                  required
                  dir={language === "ar" ? "rtl" : "ltr"}
                  value={language === "ar" ? formData.titleAr : formData.title}
                  onChange={e => language === "ar"
                    ? setFormData({ ...formData, titleAr: e.target.value, title: e.target.value })
                    : setFormData({ ...formData, title: e.target.value, titleAr: formData.titleAr || e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Amount", "المبلغ")}</Label>
                  <Input type="number" step="0.01" min="0" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Date", "التاريخ")}</Label>
                  <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Category", "الفئة")}</Label>
                <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateTransaction.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
