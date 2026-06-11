import React, { useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { 
  useListClients, 
  useGetClientStats, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  getListClientsQueryKey,
  getGetClientStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, Trash2, Edit2, Star, Target, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui-ext/data-table";
import { openWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

export default function CRM() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    email: "",
    phone: "",
    company: "",
    companyAr: "",
    status: "active",
    notes: "",
    notesAr: ""
  });

  const { data: stats, isLoading: isStatsLoading } = useGetClientStats();
  const { data: clients = [], isLoading: isClientsLoading } = useListClients({});

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient.mutateAsync({ data: formData as any });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetClientStatsQueryKey() });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: t("Client Added", "تم إضافة العميل") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await updateClient.mutateAsync({ id: selectedClient.id, data: formData as any });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetClientStatsQueryKey() });
      setIsEditOpen(false);
      resetForm();
      toast({ title: t("Client Updated", "تم تحديث العميل") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const handleDeleteClient = async (id: number) => {
    confirmDelete({
      title: t("Delete client?", "حذف العميل؟"),
      onConfirm: async () => {
        try {
          await deleteClient.mutateAsync({ id });
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetClientStatsQueryKey() });
          toast({ title: t("Client deleted", "تم حذف العميل") });
        } catch { toast({ title: t("Error", "خطأ"), variant: "destructive" }); }
      },
    });
  };

  const _unusedDelete = async (id: number) => {
    try {
      await deleteClient.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetClientStatsQueryKey() });
      toast({ title: t("Client Deleted", "تم حذف العميل") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const openEdit = (client: any) => {
    setSelectedClient(client);
    setFormData({
      name: client.name || "",
      nameAr: client.nameAr || "",
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      companyAr: client.companyAr || "",
      status: client.status || "active",
      notes: client.notes || "",
      notesAr: client.notesAr || ""
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      email: "",
      phone: "",
      company: "",
      companyAr: "",
      status: "active",
      notes: "",
      notesAr: ""
    });
    setSelectedClient(null);
  };

  type ClientRow = NonNullable<typeof clients>[number];

  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    active: { label: t("Active", "نشط"), color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    inactive: { label: t("Inactive", "غير نشط"), color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700", icon: XCircle },
    lead: { label: t("Lead", "عميل محتمل"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800", icon: Target },
    prospect: { label: t("Prospect", "مرتقب"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border-amber-200 dark:border-amber-800", icon: Star }
  };

  const clientColumns: DataTableColumn<ClientRow>[] = [
    {
      id: "name",
      header: t("Name", "الاسم"),
      sortValue: r => isAr ? (r.nameAr || r.name) : r.name,
      cell: r => <span className="font-medium">{isAr ? (r.nameAr || r.name) : r.name}</span>,
      export: { header: t("Name", "الاسم"), value: r => isAr ? (r.nameAr || r.name) : r.name },
    },
    {
      id: "company",
      header: t("Company", "الشركة"),
      sortValue: r => isAr ? (r.companyAr || r.company || "") : (r.company || ""),
      cell: r => (
        <span className="text-muted-foreground flex items-center gap-1">
          {r.company && <Building2 size={13} />}
          {isAr ? (r.companyAr || r.company) : r.company}
        </span>
      ),
      export: { header: t("Company", "الشركة"), value: r => isAr ? (r.companyAr || r.company) : r.company },
    },
    {
      id: "email",
      header: t("Email", "البريد"),
      sortValue: r => r.email || "",
      cell: r => <span dir="ltr" className="text-sm">{r.email || "—"}</span>,
      export: { header: "Email", value: r => r.email },
    },
    {
      id: "phone",
      header: t("Phone", "الهاتف"),
      sortValue: r => r.phone || "",
      cell: r => <span dir="ltr">{r.phone || "—"}</span>,
      export: { header: t("Phone", "الهاتف"), value: r => r.phone },
    },
    {
      id: "status",
      header: t("Status", "الحالة"),
      sortValue: r => r.status,
      cell: r => {
        const s = statusConfig[r.status];
        return s ? <Badge variant="outline" className={s.color}>{s.label}</Badge> : r.status;
      },
      export: { header: t("Status", "الحالة"), value: r => statusConfig[r.status]?.label || r.status },
    },
    {
      id: "actions",
      header: "",
      sortable: false,
      cell: r => (
        <div className="flex justify-end gap-1">
          {r.phone && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => openWhatsApp(r.phone!, isAr ? `السلام عليكم ${r.nameAr || r.name}،` : `Hello ${r.name},`)}>
              <MessageCircle size={14} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Edit2 size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClient(r.id)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Clients", "العملاء")}</h2>
          <p className="text-muted-foreground">{t("Manage your client relationships", "إدارة علاقات العملاء")}</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="btn-create-client" className="shrink-0 gap-2">
              <Plus size={16} />
              {t("New Client", "عميل جديد")}
            </Button>
          </DialogTrigger>
          <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
            <form onSubmit={handleCreateClient}>
              <DialogHeader>
                <DialogTitle>{t("Add Client", "إضافة عميل")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>{isAr ? "الاسم *" : "Name *"}</Label>
                  <Input
                    required
                    dir={isAr ? "rtl" : "ltr"}
                    value={isAr ? formData.nameAr : formData.name}
                    onChange={e => isAr
                      ? setFormData({ ...formData, nameAr: e.target.value, name: e.target.value })
                      : setFormData({ ...formData, name: e.target.value, nameAr: formData.nameAr || e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الشركة" : "Company"}</Label>
                  <Input
                    dir={isAr ? "rtl" : "ltr"}
                    value={isAr ? formData.companyAr : formData.company}
                    onChange={e => isAr
                      ? setFormData({ ...formData, companyAr: e.target.value })
                      : setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Email", "البريد الإلكتروني")}</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Phone", "رقم الهاتف")}</Label>
                    <Input dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>{t("Status", "الحالة")}</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createClient.isPending}>{t("Save", "حفظ")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      {isStatsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-emerald-200 dark:border-emerald-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-500">{t("Active", "نشط")}</p>
                <h3 className="text-2xl font-bold mt-1">{stats.active}</h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-500">{t("Leads", "عملاء محتملين")}</p>
                <h3 className="text-2xl font-bold mt-1">{stats.lead}</h3>
              </div>
              <Target className="w-8 h-8 text-blue-500/50" />
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-500">{t("Prospects", "مرتقبين")}</p>
                <h3 className="text-2xl font-bold mt-1">{stats.prospect}</h3>
              </div>
              <Star className="w-8 h-8 text-amber-500/50" />
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("Inactive", "غير نشط")}</p>
                <h3 className="text-2xl font-bold mt-1">{stats.inactive}</h3>
              </div>
              <XCircle className="w-8 h-8 text-gray-400/50" />
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        data={clients}
        columns={clientColumns}
        rowKey={r => r.id}
        isLoading={isClientsLoading}
        searchPlaceholder={t("Search clients…", "بحث عن عملاء…")}
        searchPredicate={(r, q) => {
          const hay = [r.name, r.nameAr, r.company, r.companyAr, r.email, r.phone].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(q);
        }}
        filters={[{
          id: "status",
          label: t("Status", "الحالة"),
          allLabel: t("All statuses", "كل الحالات"),
          options: Object.entries(statusConfig).map(([k, c]) => ({ value: k, label: c.label })),
          predicate: (r, v) => r.status === v,
        }]}
        exportFilename="clients"
        exportLabel={t("Download Excel", "تحميل Excel")}
        emptyMessage={t("No clients found.", "لا يوجد عملاء.")}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
        <DialogContent className={`max-w-2xl ${isRtl ? "rtl" : "ltr"}`}>
          <form onSubmit={handleUpdateClient}>
            <DialogHeader>
              <DialogTitle>{t("Edit Client", "تعديل بيانات العميل")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم *" : "Name *"}</Label>
                <Input
                  required
                  dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? formData.nameAr : formData.name}
                  onChange={e => isAr
                    ? setFormData({ ...formData, nameAr: e.target.value, name: e.target.value })
                    : setFormData({ ...formData, name: e.target.value, nameAr: formData.nameAr || e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الشركة" : "Company"}</Label>
                <Input
                  dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? formData.companyAr : formData.company}
                  onChange={e => isAr
                    ? setFormData({ ...formData, companyAr: e.target.value })
                    : setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Email", "البريد الإلكتروني")}</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Phone", "رقم الهاتف")}</Label>
                  <Input dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>{t("Status", "الحالة")}</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateClient.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
