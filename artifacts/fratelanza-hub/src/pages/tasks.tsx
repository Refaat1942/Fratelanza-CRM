import React, { useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import {
  useListTasks,
  useGetTaskStats,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey
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
import { Plus, Clock, CheckCircle2, AlertCircle, PlayCircle, Trash2, Edit2, Activity, LayoutList, Columns } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Task = {
  id: number; title: string; titleAr?: string | null; description?: string | null;
  descriptionAr?: string | null; status: string; priority: string;
  dueDate?: string | null; assignee?: string | null; clientId?: number | null;
  createdAt: string; updatedAt: string;
};

const statusConfig: Record<string, { labelEn: string; labelAr: string; color: string; icon: any }> = {
  pending: { labelEn: "Pending", labelAr: "قيد الانتظار", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500", icon: Clock },
  in_progress: { labelEn: "In Progress", labelAr: "قيد التنفيذ", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: PlayCircle },
  completed: { labelEn: "Completed", labelAr: "مكتمل", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500", icon: CheckCircle2 },
  cancelled: { labelEn: "Cancelled", labelAr: "ملغى", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: AlertCircle },
};

const priorityConfig: Record<string, { labelEn: string; labelAr: string; color: string }> = {
  high: { labelEn: "High", labelAr: "عالي", color: "border-red-200 text-red-700 dark:border-red-900/50 dark:text-red-400" },
  medium: { labelEn: "Medium", labelAr: "متوسط", color: "border-blue-200 text-blue-700 dark:border-blue-900/50 dark:text-blue-400" },
  low: { labelEn: "Low", labelAr: "منخفض", color: "border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-400" },
};

const emptyForm = {
  title: "", titleAr: "", description: "", descriptionAr: "",
  status: "pending", priority: "medium", dueDate: "", assignee: "",
};

export default function Tasks() {
  const { t, isRtl } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const { data: stats, isLoading: isStatsLoading } = useGetTaskStats();
  const { data: tasks, isLoading: isTasksLoading } = useListTasks(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({ data: formData as any });
      invalidate();
      setIsCreateOpen(false);
      setFormData({ ...emptyForm });
      toast({ title: t("Task Created", "تم إنشاء المهمة") });
    } catch { toast({ title: t("Error", "خطأ"), variant: "destructive" }); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await updateTask.mutateAsync({ id: selectedTask.id, data: formData as any });
      invalidate();
      setIsEditOpen(false);
      setFormData({ ...emptyForm });
      toast({ title: t("Task Updated", "تم تحديث المهمة") });
    } catch { toast({ title: t("Error", "خطأ"), variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("Are you sure?", "هل أنت متأكد؟"))) return;
    try {
      await deleteTask.mutateAsync({ id });
      invalidate();
      toast({ title: t("Task Deleted", "تم حذف المهمة") });
    } catch { toast({ title: t("Error", "خطأ"), variant: "destructive" }); }
  };

  const handleQuickStatus = async (task: Task, newStatus: string) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: newStatus } as any });
      invalidate();
    } catch { toast({ title: t("Error", "خطأ"), variant: "destructive" }); }
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || "", titleAr: task.titleAr || "",
      description: task.description || "", descriptionAr: task.descriptionAr || "",
      status: task.status || "pending", priority: task.priority || "medium",
      dueDate: task.dueDate || "", assignee: task.assignee || "",
    });
    setIsEditOpen(true);
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>{t("Title (EN)", "العنوان (بالإنجليزية)")}</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
        <div className="space-y-2"><Label>{t("Title (AR)", "العنوان (بالعربية)")}</Label><Input dir="rtl" value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>{t("Description (EN)", "الوصف (بالإنجليزية)")}</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
        <div className="space-y-2"><Label>{t("Description (AR)", "الوصف (بالعربية)")}</Label><Textarea dir="rtl" value={formData.descriptionAr} onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Status", "الحالة")}</Label>
          <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([k, c]) => <SelectItem key={k} value={k}>{t(c.labelEn, c.labelAr)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("Priority", "الأولوية")}</Label>
          <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(priorityConfig).map(([k, c]) => <SelectItem key={k} value={k}>{t(c.labelEn, c.labelAr)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>{t("Due Date", "تاريخ الاستحقاق")}</Label><Input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} /></div>
        <div className="space-y-2"><Label>{t("Assignee", "المسؤول")}</Label><Input value={formData.assignee} onChange={e => setFormData({ ...formData, assignee: e.target.value })} /></div>
      </div>
    </div>
  );

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusConfig[task.status]?.icon || Clock;
    return (
      <Card className="hover:border-primary/50 transition-colors" data-testid={`task-${task.id}`}>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="flex gap-3 items-start">
            <div className={`mt-1 rounded-full p-1.5 shrink-0 ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-500'}`}>
              <StatusIcon size={15} />
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 flex-wrap">
                {isRtl ? (task.titleAr || task.title) : task.title}
                <Badge variant="outline" className={`text-xs ${priorityConfig[task.priority]?.color}`}>
                  {t(priorityConfig[task.priority]?.labelEn, priorityConfig[task.priority]?.labelAr)}
                </Badge>
              </h4>
              {(isRtl ? (task.descriptionAr || task.description) : task.description) && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {isRtl ? (task.descriptionAr || task.description) : task.description}
                </p>
              )}
              {task.assignee && <p className="text-xs text-muted-foreground mt-1">{t("Assignee:", "المسؤول:")} {task.assignee}</p>}
              {task.dueDate && <p className="text-xs text-muted-foreground">{t("Due:", "الاستحقاق:")} {task.dueDate}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 sm:self-center">
            <Button variant="ghost" size="icon" onClick={() => openEdit(task)} data-testid={`btn-edit-task-${task.id}`}><Edit2 size={15} /></Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(task.id)} data-testid={`btn-delete-task-${task.id}`}><Trash2 size={15} /></Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanBoard = ({ tasks }: { tasks: Task[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[500px]">
      {Object.entries(statusConfig).map(([status, cfg]) => {
        const col = tasks.filter(t => t.status === status);
        const Icon = cfg.icon;
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${cfg.color}`}>
              <Icon size={14} />
              <span className="text-sm font-semibold">{t(cfg.labelEn, cfg.labelAr)}</span>
              <span className="ml-auto text-xs font-bold opacity-70">{col.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[200px] p-1">
              {col.map(task => (
                <Card key={task.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm leading-tight">{isRtl ? (task.titleAr || task.title) : task.title}</h4>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(task)}><Edit2 size={11} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(task.id)}><Trash2 size={11} /></Button>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs mt-2 ${priorityConfig[task.priority]?.color}`}>
                      {t(priorityConfig[task.priority]?.labelEn, priorityConfig[task.priority]?.labelAr)}
                    </Badge>
                    {task.assignee && <p className="text-xs text-muted-foreground mt-1">{task.assignee}</p>}
                    {task.dueDate && <p className="text-xs text-muted-foreground">{task.dueDate}</p>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.keys(statusConfig).filter(s => s !== status).map(s => (
                        <button
                          key={s}
                          onClick={() => handleQuickStatus(task, s)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:opacity-80 ${statusConfig[s].color}`}
                        >→ {t(statusConfig[s].labelEn, statusConfig[s].labelAr)}</button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {col.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground/50 min-h-[80px]">
                  {t("No tasks", "لا توجد مهام")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Tasks", "المهام")}</h2>
          <p className="text-muted-foreground">{t("Manage your team's tasks and priorities", "إدارة مهام فريقك وأولوياته")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="border border-border rounded-md p-0.5 flex">
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 gap-1" onClick={() => setViewMode("list")}>
              <LayoutList size={14} />{t("List", "قائمة")}
            </Button>
            <Button variant={viewMode === "board" ? "secondary" : "ghost"} size="sm" className="h-7 px-2 gap-1" onClick={() => setViewMode("board")}>
              <Columns size={14} />{t("Board", "لوحة")}
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) setFormData({ ...emptyForm }); }}>
            <DialogTrigger asChild>
              <Button data-testid="btn-create-task" className="shrink-0 gap-2"><Plus size={16} />{t("New Task", "مهمة جديدة")}</Button>
            </DialogTrigger>
            <DialogContent className={isRtl ? "rtl" : "ltr"}>
              <form onSubmit={handleCreate}>
                <DialogHeader><DialogTitle>{t("Create Task", "إنشاء مهمة")}</DialogTitle></DialogHeader>
                <FormFields />
                <DialogFooter><Button type="submit" disabled={createTask.isPending}>{t("Save", "حفظ")}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isStatsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-amber-800 dark:text-amber-500">{t("Pending", "قيد الانتظار")}</p><h3 className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-400">{stats.pending}</h3></div>
              <Clock className="w-8 h-8 text-amber-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-800 dark:text-blue-500">{t("In Progress", "قيد التنفيذ")}</p><h3 className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-400">{stats.in_progress}</h3></div>
              <PlayCircle className="w-8 h-8 text-blue-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-emerald-800 dark:text-emerald-500">{t("Completed", "مكتمل")}</p><h3 className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-400">{stats.completed}</h3></div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("Total", "الإجمالي")}</p><h3 className="text-2xl font-bold mt-1">{stats.pending + stats.in_progress + stats.completed + stats.cancelled}</h3></div>
              <Activity className="w-8 h-8 text-gray-400/50" />
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>{t("All", "الكل")}</Button>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Button key={key} variant={statusFilter === key ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(key)}>{t(cfg.labelEn, cfg.labelAr)}</Button>
          ))}
        </div>
      )}

      {isTasksLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : viewMode === "board" ? (
        <KanbanBoard tasks={tasks || []} />
      ) : tasks?.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <p className="text-muted-foreground">{t("No tasks found.", "لا توجد مهام.")}</p>
        </div>
      ) : (
        <div className="grid gap-3">{tasks?.map(task => <TaskCard key={task.id} task={task as Task} />)}</div>
      )}

      <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) setFormData({ ...emptyForm }); }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>{t("Edit Task", "تعديل المهمة")}</DialogTitle></DialogHeader>
            <FormFields />
            <DialogFooter><Button type="submit" disabled={updateTask.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
