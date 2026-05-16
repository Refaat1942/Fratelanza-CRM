import React, { useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, ShieldCheck, User as UserIcon, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AppUser = {
  id: number;
  username: string;
  displayName?: string;
  role: string;
  permissions: string;
  createdAt: string;
};

const ALL_MODULES = [
  { key: "dashboard", labelEn: "Dashboard", labelAr: "لوحة القيادة" },
  { key: "tasks", labelEn: "Tasks", labelAr: "المهام" },
  { key: "crm", labelEn: "Clients", labelAr: "العملاء" },
  { key: "finance", labelEn: "Finance", labelAr: "المالية" },
  { key: "team", labelEn: "Team", labelAr: "الفريق" },
  { key: "products", labelEn: "Products", labelAr: "المنتجات" },
  { key: "rentals", labelEn: "Rentals", labelAr: "الإيجارات" },
  { key: "reports", labelEn: "Reports", labelAr: "التقارير" },
  { key: "notifications", labelEn: "Notifications", labelAr: "الإشعارات" },
];

export default function Settings() {
  const { t, isRtl } = useLanguage();
  const { user: me } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [permUser, setPermUser] = useState<AppUser | null>(null);

  const [createForm, setCreateForm] = useState({ username: "", password: "", displayName: "", role: "user" });
  const [editForm, setEditForm] = useState({ displayName: "", role: "user", password: "" });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const { data: users, isLoading } = useQuery<AppUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/users"),
    enabled: me?.role === "admin",
  });

  const createUser = useMutation({
    mutationFn: (data: any) => apiFetch("/users", { method: "POST", body: JSON.stringify({ ...data, permissions: [] }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setCreateOpen(false); setCreateForm({ username: "", password: "", displayName: "", role: "user" }); toast({ title: t("User created", "تم إنشاء المستخدم") }); },
    onError: (e: any) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setEditUser(null); toast({ title: t("User updated", "تم تحديث المستخدم") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const updatePerms = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) => apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ permissions }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setPermUser(null); toast({ title: t("Permissions saved", "تم حفظ الصلاحيات") }); },
    onError: () => toast({ title: t("Error", "خطأ"), variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast({ title: t("User deleted", "تم حذف المستخدم") }); },
    onError: (e: any) => toast({ title: e.message || t("Error", "خطأ"), variant: "destructive" }),
  });

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setEditForm({ displayName: u.displayName || "", role: u.role, password: "" });
  };

  const openPerms = (u: AppUser) => {
    setPermUser(u);
    try { setSelectedPerms(JSON.parse(u.permissions) as string[]); } catch { setSelectedPerms([]); }
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  if (me?.role !== "admin") {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{t("Settings", "الإعدادات")}</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Lock size={32} className="mx-auto mb-3 opacity-40" />
            <p>{t("Settings are only accessible to administrators.", "الإعدادات متاحة للمدراء فقط.")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-bold">{t("Settings", "الإعدادات")}</h2>
        <p className="text-muted-foreground text-sm">{t("Manage users and access permissions", "إدارة المستخدمين والصلاحيات")}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">{t("User Management", "إدارة المستخدمين")}</CardTitle>
            <CardDescription>{t("Create users and control what each user can access", "أنشئ مستخدمين وتحكم فيما يمكن لكل مستخدم الوصول إليه")}</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus size={15} />{t("Add User", "إضافة مستخدم")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {users?.map(u => {
                let perms: string[] = [];
                try { perms = JSON.parse(u.permissions); } catch {}
                const isAdmin = u.role === "admin";
                const isSelf = u.id === me?.id;
                return (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-card hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {isAdmin ? <ShieldCheck size={18} /> : <UserIcon size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{u.displayName || u.username}</span>
                          <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                            {isAdmin ? t("Admin", "مدير") : t("User", "مستخدم")}
                          </Badge>
                          {isSelf && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{t("You", "أنت")}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          @{u.username} · {isAdmin ? t("Full access", "وصول كامل") : `${perms.length} ${t("modules", "وحدات")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isAdmin && (
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openPerms(u)}>
                          <ShieldCheck size={13} />{t("Permissions", "الصلاحيات")}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Edit2 size={14} /></Button>
                      {!isSelf && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => { if (confirm(t("Delete this user?", "حذف هذا المستخدم؟"))) deleteUser.mutate(u.id); }}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => { e.preventDefault(); createUser.mutate(createForm); }}>
            <DialogHeader><DialogTitle>{t("Add User", "إضافة مستخدم")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>{t("Username", "اسم المستخدم")} *</Label><Input required value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("Display Name", "الاسم المعروض")}</Label><Input value={createForm.displayName} onChange={e => setCreateForm({ ...createForm, displayName: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("Password", "كلمة المرور")} *</Label><Input type="password" required minLength={4} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>{t("Role", "الدور")}</Label>
                <Select value={createForm.role} onValueChange={v => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("User", "مستخدم")}</SelectItem>
                    <SelectItem value="admin">{t("Admin", "مدير")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" disabled={createUser.isPending}>{t("Create", "إنشاء")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={v => !v && setEditUser(null)}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={e => { e.preventDefault(); if (editUser) { const data: any = { displayName: editForm.displayName, role: editForm.role }; if (editForm.password) data.password = editForm.password; updateUser.mutate({ id: editUser.id, data }); } }}>
            <DialogHeader><DialogTitle>{t("Edit User", "تعديل المستخدم")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>{t("Display Name", "الاسم المعروض")}</Label><Input value={editForm.displayName} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>{t("Role", "الدور")}</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("User", "مستخدم")}</SelectItem>
                    <SelectItem value="admin">{t("Admin", "مدير")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("New Password", "كلمة المرور الجديدة")} ({t("leave blank to keep", "اتركه فارغاً للإبقاء")})</Label><Input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="submit" disabled={updateUser.isPending}>{t("Save", "حفظ")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={!!permUser} onOpenChange={v => !v && setPermUser(null)}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("Access Permissions", "صلاحيات الوصول")}</DialogTitle>
            <p className="text-sm text-muted-foreground">{permUser?.displayName || permUser?.username}</p>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{t("Select which pages this user can access", "اختر الصفحات التي يمكن لهذا المستخدم الوصول إليها")}</span>
              <button type="button" className="text-xs text-primary underline"
                onClick={() => setSelectedPerms(selectedPerms.length === ALL_MODULES.length ? [] : ALL_MODULES.map(m => m.key))}>
                {selectedPerms.length === ALL_MODULES.length ? t("Deselect all", "إلغاء الكل") : t("Select all", "تحديد الكل")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MODULES.map(mod => (
                <label key={mod.key} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPerms.includes(mod.key) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <input type="checkbox" className="accent-primary" checked={selectedPerms.includes(mod.key)} onChange={() => togglePerm(mod.key)} />
                  <span className="text-sm font-medium">{isRtl ? mod.labelAr : mod.labelEn}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermUser(null)}>{t("Cancel", "إلغاء")}</Button>
            <Button onClick={() => permUser && updatePerms.mutate({ id: permUser.id, permissions: selectedPerms })} disabled={updatePerms.isPending}>
              {t("Save Permissions", "حفظ الصلاحيات")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
