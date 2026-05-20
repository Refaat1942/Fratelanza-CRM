import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { BranchSelect } from "@/components/BranchSelect";
import { useAuth as useBranchAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-ext/page-header";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { EmptyState } from "@/components/ui-ext/empty-state";
import { SectionCard } from "@/components/ui-ext/section-card";
import {
  ClipboardList, Plus, User, Stethoscope, Calendar, Trash2, CheckCircle2,
  Clock, FileText, Wallet, Edit, ChevronDown, ChevronRight,
} from "lucide-react";

type Patient = { id: number; firstName: string; firstNameAr?: string | null; lastName?: string | null; lastNameAr?: string | null };
type Employee = { id: number; name: string; nameAr?: string | null; role?: string | null };
type Procedure = { id: number; name: string; nameAr?: string | null; price: number; active?: string };

type Plan = {
  id: number;
  patientId: number;
  doctorId: number | null;
  title: string | null;
  titleAr: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  notes: string | null;
  notesAr: string | null;
  estimatedTotal: number;
  startDate: string | null;
  targetCompletionDate: string | null;
  createdAt: string;
  updatedAt: string;
  patientFirstName: string | null;
  patientFirstNameAr: string | null;
  patientLastName: string | null;
  patientLastNameAr: string | null;
  doctorName: string | null;
  doctorNameAr: string | null;
};

type PlanItem = {
  id: number;
  planId: number;
  procedureId: number | null;
  description: string | null;
  descriptionAr: string | null;
  toothNumber: number | null;
  quantity: number;
  unitPrice: number;
  total: number;
  status: "planned" | "scheduled" | "done" | "cancelled";
  scheduledDate: string | null;
  completedAt: string | null;
  notes: string | null;
};

type Stats = {
  total: number; active: number; completed: number; draft: number;
  plannedValue: number; completedValue: number;
};

const STATUS_TONES: Record<Plan["status"], "default" | "primary" | "success" | "warning"> = {
  draft: "default",
  active: "primary",
  completed: "success",
  cancelled: "warning",
};

const ITEM_STATUS_TONES: Record<PlanItem["status"], string> = {
  planned: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

function fmtEgp(n: number) {
  return `${Number(n || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })} ج.م`;
}

export default function TreatmentPlansPage() {
  const { user: branchUser } = useBranchAuth();
  const { t, isRtl, language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useDeleteConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [itemDialogPlan, setItemDialogPlan] = useState<Plan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: plans, isLoading: l1 } = useQuery<Plan[]>({
    queryKey: ["treatment-plans", statusFilter],
    queryFn: () => apiFetch(`/treatment-plans${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
  });
  const { data: stats } = useQuery<Stats>({
    queryKey: ["treatment-plans-stats"],
    queryFn: () => apiFetch("/treatment-plans-stats"),
  });
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients"], queryFn: () => apiFetch("/patients"),
  });
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"], queryFn: () => apiFetch("/employees"),
  });
  const { data: procedures } = useQuery<Procedure[]>({
    queryKey: ["procedures"], queryFn: () => apiFetch("/procedures"),
  });
  const { data: dentalProcs } = useQuery<Procedure[]>({
    queryKey: ["dental-procedures"],
    queryFn: async () => {
      try { return (await apiFetch("/dental-procedures")) as Procedure[]; }
      catch { return [] as Procedure[]; }
    },
  });

  const allProcs = useMemo(() => {
    const a = procedures ?? [];
    const b = (dentalProcs ?? []).map(p => ({ ...p, name: `[${t("Dental", "أسنان")}] ${p.name}` }));
    return [...a, ...b];
  }, [procedures, dentalProcs, t]);

  const patientName = (p: Plan) => {
    const first = isAr ? (p.patientFirstNameAr || p.patientFirstName) : (p.patientFirstName || p.patientFirstNameAr);
    const last = isAr ? (p.patientLastNameAr || p.patientLastName) : (p.patientLastName || p.patientLastNameAr);
    return [first, last].filter(Boolean).join(" ") || "—";
  };
  const doctorName = (p: Plan) =>
    isAr ? (p.doctorNameAr || p.doctorName || "—") : (p.doctorName || p.doctorNameAr || "—");
  const planTitle = (p: Plan) =>
    (isAr ? (p.titleAr || p.title) : (p.title || p.titleAr)) || t("Treatment Plan", "خطة علاج");

  // ---------- Create plan ----------
  const [newPlan, setNewPlan] = useState({
    patientId: "", doctorId: "",
    title: "", titleAr: "",
    notes: "", notesAr: "",
    startDate: "", targetCompletionDate: "",
    branchId: branchUser?.branchId ?? null as number | null,
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/treatment-plans", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans-stats"] });
      setCreateOpen(false);
      setNewPlan({ patientId: "", doctorId: "", title: "", titleAr: "", notes: "", notesAr: "", startDate: "", targetCompletionDate: "", branchId: branchUser?.branchId ?? null });
      toast({ title: t("Plan created", "تم إنشاء الخطة") });
    },
    onError: (e: any) => toast({ title: e.message || "Error", variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.patientId || createMut.isPending) return;
    const body: Record<string, unknown> = {
      patientId: Number(newPlan.patientId),
      doctorId: newPlan.doctorId ? Number(newPlan.doctorId) : null,
      startDate: newPlan.startDate || null,
      targetCompletionDate: newPlan.targetCompletionDate || null,
      status: "draft",
    };
    // Strict per-language: write only the active-language column.
    if (isAr) { body.titleAr = newPlan.titleAr || null; body.notesAr = newPlan.notesAr || null; }
    else      { body.title   = newPlan.title   || null; body.notes   = newPlan.notes   || null; }
    body.branchId = newPlan.branchId;
    createMut.mutate(body);
  };

  const setStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Plan["status"] }) =>
      apiFetch(`/treatment-plans/${id}`, { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans-stats"] });
    },
  });

  const deletePlanMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/treatment-plans/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans-stats"] });
      toast({ title: t("Plan deleted", "تم حذف الخطة") });
    },
  });

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader
        icon={<ClipboardList size={20} />}
        title={t("Treatment Plans", "خطط العلاج")}
        description={t(
          "Multi-visit treatment roadmaps per patient. Track progress, estimate cost, complete items as you go.",
          "خطط علاج متعددة الزيارات لكل مريض. تتبّع التقدم وقدّر التكلفة وأكمل البنود تباعًا.",
        )}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="btn-new-plan"><Plus size={16} className="me-1.5" />{t("New Plan", "خطة جديدة")}</Button>
            </DialogTrigger>
            <DialogContent className={isRtl ? "rtl" : "ltr"}>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle>{t("New Treatment Plan", "خطة علاج جديدة")}</DialogTitle></DialogHeader>
                <div className="grid gap-3 py-3">
                  <div className="space-y-1">
                    <Label>{t("Patient", "المريض")} *</Label>
                    <Select value={newPlan.patientId} onValueChange={v => setNewPlan({ ...newPlan, patientId: v })}>
                      <SelectTrigger data-testid="select-plan-patient"><SelectValue placeholder={t("Select patient", "اختر المريض")} /></SelectTrigger>
                      <SelectContent>
                        {patients?.map(p => {
                          const first = isAr ? (p.firstNameAr || p.firstName) : (p.firstName || p.firstNameAr);
                          const last = isAr ? (p.lastNameAr || p.lastName) : (p.lastName || p.lastNameAr);
                          return <SelectItem key={p.id} value={String(p.id)}>{[first, last].filter(Boolean).join(" ")}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("Doctor", "الطبيب")}</Label>
                    <Select value={newPlan.doctorId} onValueChange={v => setNewPlan({ ...newPlan, doctorId: v })}>
                      <SelectTrigger><SelectValue placeholder={t("Optional", "اختياري")} /></SelectTrigger>
                      <SelectContent>
                        {employees?.map(e => (
                          <SelectItem key={e.id} value={String(e.id)}>{isAr ? (e.nameAr || e.name) : (e.name || e.nameAr)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("Plan title", "عنوان الخطة")}</Label>
                    {isAr ? (
                      <Input value={newPlan.titleAr} onChange={e => setNewPlan({ ...newPlan, titleAr: e.target.value })} placeholder="مثال: علاج جذور كامل" dir="rtl" />
                    ) : (
                      <Input value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })} placeholder="e.g. Full mouth rehab" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t("Start date", "تاريخ البدء")}</Label>
                      <Input type="date" value={newPlan.startDate} onChange={e => setNewPlan({ ...newPlan, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("Target completion", "تاريخ الإكمال المستهدف")}</Label>
                      <Input type="date" value={newPlan.targetCompletionDate} onChange={e => setNewPlan({ ...newPlan, targetCompletionDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("Notes", "ملاحظات")}</Label>
                    {isAr ? (
                      <Textarea value={newPlan.notesAr} onChange={e => setNewPlan({ ...newPlan, notesAr: e.target.value })} rows={2} dir="rtl" />
                    ) : (
                      <Textarea value={newPlan.notes} onChange={e => setNewPlan({ ...newPlan, notes: e.target.value })} rows={2} />
                    )}
                  </div>
                  <BranchSelect value={newPlan.branchId} onChange={(id) => setNewPlan({ ...newPlan, branchId: id })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending || !newPlan.patientId} data-testid="btn-create-plan">
                    {createMut.isPending ? t("Saving…", "جاري الحفظ…") : t("Create", "إنشاء")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard tone="primary" icon={<ClipboardList size={16} />} label={t("Active", "نشطة")} value={stats?.active ?? 0} />
        <KpiCard tone="default" icon={<FileText size={16} />} label={t("Draft", "مسودة")} value={stats?.draft ?? 0} />
        <KpiCard tone="success" icon={<CheckCircle2 size={16} />} label={t("Completed", "مكتملة")} value={stats?.completed ?? 0} />
        <KpiCard tone="info" icon={<Wallet size={16} />} label={t("Planned value", "قيمة مخططة")} value={fmtEgp(stats?.plannedValue ?? 0)} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "draft", "active", "completed", "cancelled"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm"
            onClick={() => setStatusFilter(s)} data-testid={`filter-${s}`}>
            {t(s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1),
               s === "all" ? "الكل" : ({ draft: "مسودة", active: "نشطة", completed: "مكتملة", cancelled: "ملغاة" } as any)[s])}
          </Button>
        ))}
      </div>

      {l1 ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (plans ?? []).length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title={t("No treatment plans yet", "لا توجد خطط علاج بعد")}
          description={t("Create a plan for a patient to map out a multi-visit treatment with cost estimate.",
                        "أنشئ خطة لمريض لتحديد علاج متعدد الزيارات مع تقدير التكلفة.")}
        />
      ) : (
        <div className="space-y-3">
          {plans?.map(plan => (
            <PlanRow key={plan.id} plan={plan}
              isAr={isAr} t={t}
              expanded={!!expanded[plan.id]}
              onToggle={() => setExpanded(p => ({ ...p, [plan.id]: !p[plan.id] }))}
              patientName={patientName(plan)} doctorName={doctorName(plan)} title={planTitle(plan)}
              onChangeStatus={(status) => setStatusMut.mutate({ id: plan.id, status })}
              onDelete={() => confirm({
                title: t("Delete this plan?", "حذف هذه الخطة؟"),
                description: t("This will also delete all its items. Cannot be undone.",
                              "سيتم حذف جميع بنود الخطة أيضًا. لا يمكن التراجع."),
                onConfirm: () => deletePlanMut.mutate(plan.id),
              })}
              onAddItem={() => setItemDialogPlan(plan)}
            />
          ))}
        </div>
      )}

      <AddItemDialog
        open={!!itemDialogPlan}
        plan={itemDialogPlan}
        onClose={() => setItemDialogPlan(null)}
        procedures={allProcs}
        isAr={isAr}
        t={t}
        isRtl={isRtl}
      />
    </div>
  );
}

// ============== Plan Row ==============
function PlanRow({
  plan, isAr, t, expanded, onToggle, patientName, doctorName, title,
  onChangeStatus, onDelete, onAddItem,
}: {
  plan: Plan; isAr: boolean; t: (en: string, ar: string) => string;
  expanded: boolean; onToggle: () => void;
  patientName: string; doctorName: string; title: string;
  onChangeStatus: (s: Plan["status"]) => void;
  onDelete: () => void;
  onAddItem: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useDeleteConfirm();

  const { data: detail } = useQuery<Plan & { items: PlanItem[] }>({
    queryKey: ["treatment-plan", plan.id],
    queryFn: () => apiFetch(`/treatment-plans/${plan.id}`),
    enabled: expanded,
  });

  const itemStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PlanItem["status"] }) =>
      apiFetch(`/treatment-plan-items/${id}`, { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plan", plan.id] });
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans-stats"] });
    },
  });

  const deleteItemMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/treatment-plan-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plan", plan.id] });
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans-stats"] });
      toast({ title: t("Item removed", "تم حذف البند") });
    },
  });

  const items = detail?.items ?? [];
  const doneCount = items.filter(i => i.status === "done").length;
  const totalItems = items.filter(i => i.status !== "cancelled").length;
  const progress = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button className="w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-accent/40 transition"
          onClick={onToggle} data-testid={`plan-row-${plan.id}`}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} className={isAr ? "rotate-180" : ""} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">{title}</span>
              <Badge variant={STATUS_TONES[plan.status] === "default" ? "secondary" : "default"} className="text-[10px]">
                {t(plan.status.charAt(0).toUpperCase() + plan.status.slice(1),
                  ({ draft: "مسودة", active: "نشطة", completed: "مكتملة", cancelled: "ملغاة" } as any)[plan.status])}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><User size={11} />{patientName}</span>
              <span className="flex items-center gap-1"><Stethoscope size={11} />{doctorName}</span>
              {plan.targetCompletionDate && (
                <span className="flex items-center gap-1"><Calendar size={11} />{plan.targetCompletionDate}</span>
              )}
            </div>
          </div>
          <div className="text-end shrink-0">
            <div className="font-bold text-primary text-sm">{fmtEgp(plan.estimatedTotal)}</div>
            <div className="text-[10px] text-muted-foreground">{t("Estimate", "تقدير")}</div>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  {t("Progress:", "التقدم:")} <span className="font-semibold text-foreground">{doneCount}/{totalItems}</span> ({progress}%)
                </span>
                <div className="w-32 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={plan.status} onValueChange={(v) => onChangeStatus(v as Plan["status"])}>
                  <SelectTrigger className="h-8 text-xs w-32" data-testid={`select-plan-status-${plan.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["draft", "active", "completed", "cancelled"] as Plan["status"][]).map(s => (
                      <SelectItem key={s} value={s}>
                        {t(s.charAt(0).toUpperCase() + s.slice(1),
                          ({ draft: "مسودة", active: "نشطة", completed: "مكتملة", cancelled: "ملغاة" } as any)[s])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={onAddItem} data-testid={`btn-add-item-${plan.id}`}>
                  <Plus size={13} className="me-1" />{t("Add item", "إضافة بند")}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete} data-testid={`btn-delete-plan-${plan.id}`}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {t("No items yet. Click \"Add item\" to start.", "لا توجد بنود. اضغط \"إضافة بند\" للبدء.")}
              </div>
            ) : (
              <div className="space-y-1.5">
                {items.map(item => {
                  const desc = isAr ? (item.descriptionAr || item.description) : (item.description || item.descriptionAr);
                  return (
                    <div key={item.id} className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${ITEM_STATUS_TONES[item.status]}`}>
                        {t(item.status.charAt(0).toUpperCase() + item.status.slice(1),
                          ({ planned: "مخطط", scheduled: "مجدول", done: "تم", cancelled: "ملغي" } as any)[item.status])}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{desc || t("(no description)", "(بدون وصف)")}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                          {item.toothNumber && <span>{t("Tooth", "السن")} #{item.toothNumber}</span>}
                          {item.scheduledDate && <span><Calendar size={10} className="inline me-0.5" />{item.scheduledDate}</span>}
                          <span>{item.quantity} × {fmtEgp(item.unitPrice)}</span>
                        </div>
                      </div>
                      <div className="font-semibold text-sm text-end shrink-0">{fmtEgp(item.total)}</div>
                      <Select value={item.status} onValueChange={(v) => itemStatusMut.mutate({ id: item.id, status: v as PlanItem["status"] })}>
                        <SelectTrigger className="h-7 text-[11px] w-24" data-testid={`select-item-status-${item.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["planned", "scheduled", "done", "cancelled"] as PlanItem["status"][]).map(s => (
                            <SelectItem key={s} value={s}>
                              {t(s.charAt(0).toUpperCase() + s.slice(1),
                                ({ planned: "مخطط", scheduled: "مجدول", done: "تم", cancelled: "ملغي" } as any)[s])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => confirm({
                          title: t("Remove item?", "حذف البند؟"),
                          onConfirm: () => deleteItemMut.mutate(item.id),
                        })}
                        data-testid={`btn-delete-item-${item.id}`}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============== Add Item Dialog ==============
function AddItemDialog({
  open, plan, onClose, procedures, isAr, t, isRtl,
}: {
  open: boolean; plan: Plan | null; onClose: () => void;
  procedures: Procedure[]; isAr: boolean;
  t: (en: string, ar: string) => string; isRtl: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    procedureId: "", description: "", descriptionAr: "",
    toothNumber: "", quantity: "1", unitPrice: "0",
    scheduledDate: "", notes: "",
  });

  React.useEffect(() => {
    if (open) {
      setForm({ procedureId: "", description: "", descriptionAr: "", toothNumber: "", quantity: "1", unitPrice: "0", scheduledDate: "", notes: "" });
    }
  }, [open]);

  const addMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/treatment-plans/${plan!.id}/items`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plan", plan!.id] });
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans-stats"] });
      onClose();
      toast({ title: t("Item added", "تمت إضافة البند") });
    },
    onError: (e: any) => toast({ title: e.message || "Error", variant: "destructive" }),
  });

  const onProcChange = (procId: string) => {
    const p = procedures.find(x => String(x.id) === procId);
    setForm(f => ({
      ...f,
      procedureId: procId,
      unitPrice: p ? String(p.price) : f.unitPrice,
      description: p && !isAr ? (p.name || "") : f.description,
      descriptionAr: p && isAr ? (p.nameAr || p.name || "") : f.descriptionAr,
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    const body: Record<string, unknown> = {
      procedureId: form.procedureId ? Number(form.procedureId) : null,
      toothNumber: form.toothNumber ? Number(form.toothNumber) : null,
      quantity: Number(form.quantity) || 1,
      unitPrice: Number(form.unitPrice) || 0,
      scheduledDate: form.scheduledDate || null,
      notes: form.notes || null,
    };
    if (isAr) body.descriptionAr = form.descriptionAr || null;
    else      body.description   = form.description   || null;
    addMut.mutate(body);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={isRtl ? "rtl" : "ltr"}>
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>{t("Add Plan Item", "إضافة بند للخطة")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1">
              <Label>{t("Pick from catalog (optional)", "اختر من القائمة (اختياري)")}</Label>
              <Select value={form.procedureId} onValueChange={onProcChange}>
                <SelectTrigger data-testid="select-item-procedure"><SelectValue placeholder={t("Custom item", "بند مخصص")} /></SelectTrigger>
                <SelectContent>
                  {procedures.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {isAr ? (p.nameAr || p.name) : (p.name || p.nameAr)} — {fmtEgp(p.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("Description", "الوصف")}</Label>
              {isAr ? (
                <Input value={form.descriptionAr} onChange={e => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" />
              ) : (
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{t("Tooth #", "السن #")}</Label>
                <Input value={form.toothNumber} onChange={e => setForm({ ...form, toothNumber: e.target.value })} placeholder="e.g. 16" />
              </div>
              <div className="space-y-1">
                <Label>{t("Qty", "الكمية")}</Label>
                <Input type="number" step="1" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t("Unit price (EGP)", "سعر الوحدة (ج.م)")}</Label>
                <Input type="number" step="0.01" min="0" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("Scheduled date", "تاريخ الجدولة")}</Label>
              <Input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} />
            </div>
            <div className="text-end font-bold text-primary">
              {t("Total:", "الإجمالي:")} {fmtEgp((Number(form.quantity) || 0) * (Number(form.unitPrice) || 0))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addMut.isPending} data-testid="btn-create-item">
              {addMut.isPending ? t("Adding…", "جاري الإضافة…") : t("Add", "إضافة")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
