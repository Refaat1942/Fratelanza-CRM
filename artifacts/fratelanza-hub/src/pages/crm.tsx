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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, User, Phone, Mail, Trash2, Edit2, Star, Target, CheckCircle2, XCircle, MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";

const SPECIALIZATIONS = [
  {
    value: "gynecology",
    en: "Gynecology",
    ar: "نساء وتوليد",
    diagnosis: "Pregnancy follow-up, PCOS, endometriosis, infertility, menstrual disorders, pelvic inflammatory disease, menopause symptoms, cervical screening follow-up",
    features: "Pregnancy timeline, obstetric history, LMP/EDD tracking, ultrasound notes, lab follow-up, contraceptive counseling, high-risk pregnancy alerts",
  },
  {
    value: "orthopedics",
    en: "Orthopedics / Osteology",
    ar: "عظام",
    diagnosis: "Fractures, osteoarthritis, osteoporosis, back pain, ligament injuries, sprains, tendonitis, scoliosis, post-operative follow-up",
    features: "Pain score, range of motion, imaging notes, cast/splint tracking, physiotherapy plan, bone density follow-up, implant/procedure history",
  },
  {
    value: "dentistry",
    en: "Dentistry",
    ar: "أسنان",
    diagnosis: "Caries, pulpitis, periodontal disease, malocclusion, impacted teeth, abscess, bruxism, prosthodontic follow-up",
    features: "Tooth charting, treatment plans, procedure catalog, materials used, follow-up reminders, dental imaging notes",
  },
  {
    value: "cardiology",
    en: "Cardiology",
    ar: "قلب",
    diagnosis: "Hypertension, coronary artery disease, arrhythmia, heart failure, valvular disease, dyslipidemia",
    features: "Blood pressure trend, ECG/echo notes, medication adherence, risk factors, anticoagulation follow-up, cardiac alerts",
  },
  {
    value: "dermatology",
    en: "Dermatology",
    ar: "جلدية",
    diagnosis: "Acne, eczema, psoriasis, fungal infections, alopecia, urticaria, mole assessment, cosmetic follow-up",
    features: "Photo follow-up, lesion location, treatment response, allergy triggers, procedure notes, cosmetic session tracking",
  },
  {
    value: "pediatrics",
    en: "Pediatrics",
    ar: "أطفال",
    diagnosis: "Vaccination follow-up, respiratory infections, gastroenteritis, allergy/asthma, growth delay, fever assessment",
    features: "Growth chart, vaccine schedule, weight/height tracking, parent contacts, allergy alerts, school notes",
  },
];

export default function CRM() {
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    specialization: "",
    relatedDiagnosis: "",
    medicalFeatures: "",
    status: "active",
    notes: "",
    notesAr: ""
  });

  const { data: stats, isLoading: isStatsLoading } = useGetClientStats();
  const { data: clients, isLoading: isClientsLoading } = useListClients({
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
    ...(searchQuery ? { search: searchQuery } : {})
  });

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
      specialization: client.specialization || "",
      relatedDiagnosis: client.relatedDiagnosis || "",
      medicalFeatures: client.medicalFeatures || "",
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
      specialization: "",
      relatedDiagnosis: "",
      medicalFeatures: "",
      status: "active",
      notes: "",
      notesAr: ""
    });
    setSelectedClient(null);
  };

  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    active: { label: t("Active", "نشط"), color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    inactive: { label: t("Inactive", "غير نشط"), color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700", icon: XCircle },
    lead: { label: t("Lead", "عميل محتمل"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800", icon: Target },
    prospect: { label: t("Prospect", "مرتقب"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border-amber-200 dark:border-amber-800", icon: Star }
  };
  const applySpecialization = (value: string) => {
    const spec = SPECIALIZATIONS.find(s => s.value === value);
    setFormData({
      ...formData,
      specialization: value,
      relatedDiagnosis: spec?.diagnosis || "",
      medicalFeatures: spec?.features || "",
    });
  };
  const specializationLabel = (value?: string | null) => {
    const spec = SPECIALIZATIONS.find(s => s.value === value);
    return spec ? (isAr ? spec.ar : spec.en) : value;
  };

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
                <div className="space-y-2">
                  <Label>{t("Medical specialization", "التخصص الطبي")}</Label>
                  <Select value={formData.specialization || "none"} onValueChange={(val) => val === "none" ? setFormData({ ...formData, specialization: "", relatedDiagnosis: "", medicalFeatures: "" }) : applySpecialization(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("— Select specialization —", "— اختر التخصص —")}</SelectItem>
                      {SPECIALIZATIONS.map(spec => <SelectItem key={spec.value} value={spec.value}>{isAr ? spec.ar : spec.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {formData.specialization && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("Related diagnosis", "التشخيصات المرتبطة")}</Label>
                      <Textarea rows={3} value={formData.relatedDiagnosis} onChange={e => setFormData({ ...formData, relatedDiagnosis: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("Medical features", "الميزات الطبية")}</Label>
                      <Textarea rows={3} value={formData.medicalFeatures} onChange={e => setFormData({ ...formData, medicalFeatures: e.target.value })} />
                    </div>
                  </div>
                )}
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="w-full sm:w-64">
          <Input 
            placeholder={t("Search clients...", "البحث عن عملاء...")} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={statusFilter === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setStatusFilter("all")}
          >
            {t("All", "الكل")}
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button 
              key={key}
              variant={statusFilter === key ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter(key)}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      {isClientsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : clients?.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <p className="text-muted-foreground">{t("No clients found.", "لا يوجد عملاء.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients?.map(client => {
            const status = statusConfig[client.status];
            return (
              <Card key={client.id} className="overflow-hidden hover:border-primary/50 transition-colors group" data-testid={`client-${client.id}`}>
                <CardHeader className="p-4 pb-2 border-b border-border bg-muted/20 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      {isRtl ? (client.nameAr || client.name) : client.name}
                    </CardTitle>
                    {client.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 size={14} />
                        {isRtl ? (client.companyAr || client.company) : client.company}
                      </p>
                    )}
                    {client.specialization && (
                      <p className="text-xs text-primary mt-1">
                        {specializationLabel(client.specialization)}
                      </p>
                    )}
                  </div>
                  <Badge className={status?.color} variant="outline">
                    {status?.label}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2 text-sm">
                    {client.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} className="shrink-0" />
                        <span dir="ltr">{client.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 flex items-center justify-end gap-2">
                    {client.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                        onClick={() => {
                          const greeting = isAr
                            ? `السلام عليكم ${client.nameAr || client.name}،`
                            : `Hello ${client.name},`;
                          openWhatsApp(client.phone, greeting);
                        }}
                        title={t("Send WhatsApp", "إرسال واتساب")}
                        data-testid={`btn-whatsapp-client-${client.id}`}
                      >
                        <MessageCircle size={14} />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(client)} data-testid={`btn-edit-client-${client.id}`}>
                      <Edit2 size={14} className={isRtl ? "ml-1" : "mr-1"} />
                      {t("Edit", "تعديل")}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30" onClick={() => handleDeleteClient(client.id)} data-testid={`btn-delete-client-${client.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
              <div className="space-y-2">
                <Label>{t("Medical specialization", "التخصص الطبي")}</Label>
                <Select value={formData.specialization || "none"} onValueChange={(val) => val === "none" ? setFormData({ ...formData, specialization: "", relatedDiagnosis: "", medicalFeatures: "" }) : applySpecialization(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("— Select specialization —", "— اختر التخصص —")}</SelectItem>
                    {SPECIALIZATIONS.map(spec => <SelectItem key={spec.value} value={spec.value}>{isAr ? spec.ar : spec.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {formData.specialization && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Related diagnosis", "التشخيصات المرتبطة")}</Label>
                    <Textarea rows={3} value={formData.relatedDiagnosis} onChange={e => setFormData({ ...formData, relatedDiagnosis: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Medical features", "الميزات الطبية")}</Label>
                    <Textarea rows={3} value={formData.medicalFeatures} onChange={e => setFormData({ ...formData, medicalFeatures: e.target.value })} />
                  </div>
                </div>
              )}
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
