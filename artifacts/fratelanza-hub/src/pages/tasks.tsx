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
import { Plus, Clock, CheckCircle2, AlertCircle, PlayCircle, Trash2, Edit2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { t, isRtl } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    assignee: ""
  });

  const { data: stats, isLoading: isStatsLoading } = useGetTaskStats();
  const { data: tasks, isLoading: isTasksLoading } = useListTasks(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({ data: formData as any });
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: t("Task Created", "تم إنشاء المهمة") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await updateTask.mutateAsync({ id: selectedTask.id, data: formData as any });
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      setIsEditOpen(false);
      resetForm();
      toast({ title: t("Task Updated", "تم تحديث المهمة") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm(t("Are you sure?", "هل أنت متأكد؟"))) return;
    try {
      await deleteTask.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      toast({ title: t("Task Deleted", "تم حذف المهمة") });
    } catch (error) {
      toast({ title: t("Error", "خطأ"), variant: "destructive" });
    }
  };

  const openEdit = (task: any) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || "",
      titleAr: task.titleAr || "",
      description: task.description || "",
      descriptionAr: task.descriptionAr || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      dueDate: task.dueDate || "",
      assignee: task.assignee || ""
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      titleAr: "",
      description: "",
      descriptionAr: "",
      status: "pending",
      priority: "medium",
      dueDate: "",
      assignee: ""
    });
    setSelectedTask(null);
  };

  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: t("Pending", "قيد الانتظار"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500", icon: Clock },
    in_progress: { label: t("In Progress", "قيد التنفيذ"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: PlayCircle },
    completed: { label: t("Completed", "مكتمل"), color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500", icon: CheckCircle2 },
    cancelled: { label: t("Cancelled", "ملغى"), color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: AlertCircle }
  };

  const priorityConfig: Record<string, { label: string, color: string }> = {
    high: { label: t("High", "عالي"), color: "border-red-200 text-red-700 dark:border-red-900/50 dark:text-red-400" },
    medium: { label: t("Medium", "متوسط"), color: "border-blue-200 text-blue-700 dark:border-blue-900/50 dark:text-blue-400" },
    low: { label: t("Low", "منخفض"), color: "border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-400" }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Tasks", "المهام")}</h2>
          <p className="text-muted-foreground">{t("Manage your team's tasks and priorities", "إدارة مهام فريقك وأولوياته")}</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="btn-create-task" className="shrink-0 gap-2">
              <Plus size={16} />
              {t("New Task", "مهمة جديدة")}
            </Button>
          </DialogTrigger>
          <DialogContent className={isRtl ? "rtl" : "ltr"}>
            <form onSubmit={handleCreateTask}>
              <DialogHeader>
                <DialogTitle>{t("Create Task", "إنشاء مهمة")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Title (EN)", "العنوان (بالإنجليزية)")}</Label>
                    <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Title (AR)", "العنوان (بالعربية)")}</Label>
                    <Input dir="rtl" value={formData.titleAr} onChange={e => setFormData({...formData, titleAr: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("Description (EN)", "الوصف (بالإنجليزية)")}</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Description (AR)", "الوصف (بالعربية)")}</Label>
                    <Textarea dir="rtl" value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>{t("Priority", "الأولوية")}</Label>
                    <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTask.isPending}>{t("Save", "حفظ")}</Button>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-500">{t("Pending", "قيد الانتظار")}</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-400">{stats.pending}</h3>
              </div>
              <Clock className="w-8 h-8 text-amber-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-500">{t("In Progress", "قيد التنفيذ")}</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-400">{stats.in_progress}</h3>
              </div>
              <PlayCircle className="w-8 h-8 text-blue-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-500">{t("Completed", "مكتمل")}</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-400">{stats.completed}</h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("Total", "الإجمالي")}</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pending + stats.in_progress + stats.completed + stats.cancelled}</h3>
              </div>
              <Activity className="w-8 h-8 text-gray-400/50" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button 
          variant={statusFilter === "all" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setStatusFilter("all")}
        >
          {t("All Tasks", "جميع المهام")}
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

      {/* Tasks List */}
      {isTasksLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-card/50">
          <p className="text-muted-foreground">{t("No tasks found.", "لا توجد مهام.")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks?.map(task => {
            const StatusIcon = statusConfig[task.status]?.icon || Clock;
            return (
              <Card key={task.id} className="hover:border-primary/50 transition-colors" data-testid={`task-${task.id}`}>
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div className="flex gap-4 items-start">
                    <div className={`mt-1 rounded-full p-2 ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                      <StatusIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        {isRtl ? (task.titleAr || task.title) : task.title}
                        <Badge variant="outline" className={priorityConfig[task.priority]?.color}>
                          {priorityConfig[task.priority]?.label}
                        </Badge>
                      </h4>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {isRtl ? (task.descriptionAr || task.description) : task.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(task)} data-testid={`btn-edit-task-${task.id}`}>
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTask(task.id)} data-testid={`btn-delete-task-${task.id}`}>
                      <Trash2 size={16} />
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
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={handleUpdateTask}>
            <DialogHeader>
              <DialogTitle>{t("Edit Task", "تعديل المهمة")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Title (EN)", "العنوان (بالإنجليزية)")}</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Title (AR)", "العنوان (بالعربية)")}</Label>
                  <Input dir="rtl" value={formData.titleAr} onChange={e => setFormData({...formData, titleAr: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Description (EN)", "الوصف (بالإنجليزية)")}</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Description (AR)", "الوصف (بالعربية)")}</Label>
                  <Textarea dir="rtl" value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>{t("Priority", "الأولوية")}</Label>
                  <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateTask.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
