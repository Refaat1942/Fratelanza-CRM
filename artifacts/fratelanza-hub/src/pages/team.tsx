import React, { useState } from "react";
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
import { Plus, Trash2, Edit2, Users, UserCheck, Coffee } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui-ext/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDeleteConfirm } from "@/components/DeleteConfirmProvider";
import { BranchSelect } from "@/components/BranchSelect";
import { useAuth } from "@/components/AuthProvider";

type Employee = {
  id: number; name: string; nameAr?: string; email?: string; phone?: string;
  department?: string; departmentAr?: string; role?: string; roleAr?: string;
  status: string; salary?: string; joinDate?: string; notes?: string;
  createdAt: string; updatedAt: string;
};

type Stats = { active: number; inactive: number; on_leave: number };

const emptyForm = {
  name: "", nameAr: "", email: "", phone: "",
  department: "", departmentAr: "", role: "", roleAr: "",
  status: "active", salary: "", joinDate: "", notes: "",
  branchId: null as number | null,
};

export default function Team() {
  const { t, isRtl, language } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirmDelete = useDeleteConfirm();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState({ ...emptyForm, branchId: user?.branchId ?? null });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["employees-stats"],
    queryFn: () => apiFetch("/employees/stats"),
  });

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/employees"),
  });

  const createEmp = useMutation({
    mutationFn: (data: typeof emptyForm) => apiFetch("/employees", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); qc.invalidateQueries({ queryKey: ["employees-stats"] }); setIsCreateOpen(false); setForm({ ...emptyForm }); toast({ title: t("Employee Added", "تم إضافة الموظف") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const updateEmp = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof emptyForm }) => apiFetch(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); qc.invalidateQueries({ queryKey: ["employees-stats"] }); setIsEditOpen(false); setForm({ ...emptyForm }); toast({ title: t("Employee Updated", "تم تحديث الموظف") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteEmp = useMutation({
    mutationFn: (id: number) => apiFetch(`/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); qc.invalidateQueries({ queryKey: ["employees-stats"] }); toast({ title: t("Employee Removed", "تم حذف الموظف") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (emp: Employee) => {
    setSelected(emp);
    setForm({ name: emp.name || "", nameAr: emp.nameAr || "", email: emp.email || "", phone: emp.phone || "", department: emp.department || "", departmentAr: emp.departmentAr || "", role: emp.role || "", roleAr: emp.roleAr || "", status: emp.status || "active", salary: emp.salary || "", joinDate: emp.joinDate || "", notes: emp.notes || "", branchId: (emp as any).branchId ?? null });
    setIsEditOpen(true);
  };

  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    on_leave: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };

  const isAr = language === "ar";

  const statusLabel = (s: string) =>
    s === "active" ? t("Active", "نشط") : s === "on_leave" ? t("On Leave", "في إجازة") : t("Inactive", "غير نشط");

  const employeeColumns: DataTableColumn<Employee>[] = [
    {
      id: "name",
      header: t("Name", "الاسم"),
      sortValue: e => isRtl ? (e.nameAr || e.name) : e.name,
      cell: e => <span className="font-medium">{isRtl ? (e.nameAr || e.name) : e.name}</span>,
      export: { header: t("Name", "الاسم"), value: e => isRtl ? (e.nameAr || e.name) : e.name },
    },
    {
      id: "role",
      header: t("Role", "الدور"),
      sortValue: e => e.role || "",
      cell: e => isRtl ? (e.roleAr || e.role) : e.role,
      export: { header: t("Role", "الدور"), value: e => e.role },
    },
    {
      id: "department",
      header: t("Department", "القسم"),
      sortValue: e => e.department || "",
      cell: e => isRtl ? (e.departmentAr || e.department) : e.department,
      export: { header: t("Department", "القسم"), value: e => e.department },
    },
    {
      id: "status",
      header: t("Status", "الحالة"),
      sortValue: e => e.status,
      cell: e => <Badge variant="outline" className={statusColor[e.status] || statusColor.inactive}>{statusLabel(e.status)}</Badge>,
      export: { header: t("Status", "الحالة"), value: e => statusLabel(e.status) },
    },
    {
      id: "salary",
      header: t("Salary", "الراتب"),
      sortValue: e => Number(e.salary) || 0,
      cell: e => e.salary ? `${e.salary} ${t("EGP", "ج.م")}` : "—",
      export: { header: t("Salary", "الراتب"), value: e => e.salary },
    },
    {
      id: "actions",
      header: "",
      sortable: false,
      cell: e => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit2 size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete({ title: t("Remove this employee?", "حذف هذا الموظف؟"), onConfirm: () => deleteEmp.mutate(e.id) })}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  const renderFormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>{isAr ? "الاسم *" : "Name *"}</Label>
        <Input
          required
          dir={isAr ? "rtl" : "ltr"}
          value={isAr ? form.nameAr : form.name}
          onChange={e => isAr
            ? setForm({ ...form, nameAr: e.target.value })
            : setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Email", "البريد الإلكتروني")}</Label>
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{t("Phone", "الهاتف")}</Label>
          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{isAr ? "القسم" : "Department"}</Label>
        <Input
          dir={isAr ? "rtl" : "ltr"}
          value={isAr ? form.departmentAr : form.department}
          onChange={e => isAr
            ? setForm({ ...form, departmentAr: e.target.value })
            : setForm({ ...form, department: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{isAr ? "الدور الوظيفي" : "Role"}</Label>
        <Input
          dir={isAr ? "rtl" : "ltr"}
          value={isAr ? form.roleAr : form.role}
          onChange={e => isAr
            ? setForm({ ...form, roleAr: e.target.value })
            : setForm({ ...form, role: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("Status", "الحالة")}</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("Active", "نشط")}</SelectItem>
              <SelectItem value="inactive">{t("Inactive", "غير نشط")}</SelectItem>
              <SelectItem value="on_leave">{t("On Leave", "في إجازة")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("Salary", "الراتب")} ({t("EGP", "ج.م")})</Label>
          <Input value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("Join Date", "تاريخ الانضمام")}</Label>
        <Input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t("Notes", "ملاحظات")}</Label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} dir={isAr ? "rtl" : "ltr"} />
      </div>
      <BranchSelect value={form.branchId} onChange={(id) => setForm({ ...form, branchId: id })} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("Team & HR", "الفريق والموارد البشرية")}</h2>
          <p className="text-muted-foreground">{t("Manage your employees and departments", "إدارة موظفيك وأقسامك")}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) setForm({ ...emptyForm }); }}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2"><Plus size={16} />{t("Add Employee", "إضافة موظف")}</Button>
          </DialogTrigger>
          <DialogContent className={isRtl ? "rtl" : "ltr"}>
            <form onSubmit={e => { e.preventDefault(); createEmp.mutate(form); }}>
              <DialogHeader><DialogTitle>{t("Add Employee", "إضافة موظف")}</DialogTitle></DialogHeader>
              {renderFormFields()}
              <DialogFooter><Button type="submit" disabled={createEmp.isPending}>{t("Save", "حفظ")}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-emerald-800 dark:text-emerald-500">{t("Active", "نشط")}</p><h3 className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-400">{stats?.active ?? 0}</h3></div>
              <UserCheck className="w-8 h-8 text-emerald-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-amber-800 dark:text-amber-500">{t("On Leave", "في إجازة")}</p><h3 className="text-2xl font-bold mt-1 text-amber-900 dark:text-amber-400">{stats?.on_leave ?? 0}</h3></div>
              <Coffee className="w-8 h-8 text-amber-500/50" />
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("Total", "الإجمالي")}</p><h3 className="text-2xl font-bold mt-1">{(stats?.active ?? 0) + (stats?.inactive ?? 0) + (stats?.on_leave ?? 0)}</h3></div>
              <Users className="w-8 h-8 text-gray-400/50" />
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        data={employees ?? []}
        columns={employeeColumns}
        rowKey={e => e.id}
        isLoading={isLoading}
        searchPlaceholder={t("Search employees…", "بحث عن موظفين…")}
        searchPredicate={(e, q) => [e.name, e.nameAr, e.role, e.department, e.email, e.phone].filter(Boolean).join(" ").toLowerCase().includes(q)}
        filters={[{
          id: "status",
          label: t("Status", "الحالة"),
          allLabel: t("All statuses", "كل الحالات"),
          options: [
            { value: "active", label: t("Active", "نشط") },
            { value: "on_leave", label: t("On Leave", "في إجازة") },
            { value: "inactive", label: t("Inactive", "غير نشط") },
          ],
          predicate: (e, v) => e.status === v,
        }]}
        exportFilename="employees"
        exportLabel={t("Download Excel", "تحميل Excel")}
        emptyMessage={t("No employees yet.", "لا يوجد موظفون بعد.")}
      />

      <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) setForm({ ...emptyForm }); }}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => { e.preventDefault(); if (selected) updateEmp.mutate({ id: selected.id, data: form }); }}>
            <DialogHeader><DialogTitle>{t("Edit Employee", "تعديل الموظف")}</DialogTitle></DialogHeader>
            {renderFormFields()}
            <DialogFooter><Button type="submit" disabled={updateEmp.isPending}>{t("Save Changes", "حفظ التغييرات")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
