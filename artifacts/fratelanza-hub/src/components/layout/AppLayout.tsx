import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, CheckSquare, Users, CreditCard, Settings, Menu, BarChart2,
  Bell, UserSquare2, X, Package, Home as HomeIcon, LogOut, KeyRound,
  Truck, FileText, Receipt
} from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "../AuthProvider";
import { useFeatures } from "../FeaturesProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ALL_NAV_ITEMS = [
  { href: "/", key: "dashboard", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة القيادة" },
  { href: "/tasks", key: "tasks", icon: CheckSquare, labelEn: "Tasks", labelAr: "المهام" },
  { href: "/crm", key: "crm", icon: Users, labelEn: "Clients", labelAr: "العملاء" },
  { href: "/finance", key: "finance", icon: CreditCard, labelEn: "Finance", labelAr: "المالية" },
  { href: "/team", key: "team", icon: UserSquare2, labelEn: "Team", labelAr: "الفريق" },
  { href: "/products", key: "products", icon: Package, labelEn: "Products", labelAr: "المنتجات" },
  { href: "/suppliers", key: "suppliers", icon: Truck, labelEn: "Suppliers", labelAr: "الموردون" },
  { href: "/purchase-orders", key: "purchase_orders", icon: FileText, labelEn: "Purchase Orders", labelAr: "أوامر الشراء" },
  { href: "/invoices", key: "invoicing", icon: Receipt, labelEn: "Invoices", labelAr: "الفواتير" },
  { href: "/rentals", key: "rentals", icon: HomeIcon, labelEn: "Rentals", labelAr: "الإيجارات" },
  { href: "/reports", key: "reports", icon: BarChart2, labelEn: "Reports", labelAr: "التقارير" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const { data: notifications } = useQuery<{ id: number; isRead: boolean }[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications"),
    refetchInterval: 15000,
  });
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const isAdmin = user?.role === "admin";
  const userPerms = user?.permissions ?? [];
  const { features } = useFeatures();

  const navItems = ALL_NAV_ITEMS.filter(item => {
    // Dashboard always visible; other items must be enabled for the tenant AND the user.
    if (item.key !== "dashboard" && features[item.key] === false) return false;
    return isAdmin || userPerms.includes(item.key);
  });

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  const handleLogout = async () => { await logout(); };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toast({ title: t("Passwords do not match", "كلمتا المرور غير متطابقتين"), variant: "destructive" }); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: t("Password changed", "تم تغيير كلمة المرور") });
      setChangePwOpen(false);
      setPw({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast({ title: err.message || t("Error", "خطأ"), variant: "destructive" });
    } finally { setPwLoading(false); }
  };

  const NavLink = ({ item, onClick }: { item: typeof ALL_NAV_ITEMS[0]; onClick?: () => void }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link href={item.href} onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        data-testid={`nav-${item.labelEn.toLowerCase()}`}
      >
        <Icon size={17} className={active ? "text-primary-foreground" : "text-muted-foreground"} />
        {t(item.labelEn, item.labelAr)}
      </Link>
    );
  };

  const showNotifications = isAdmin || userPerms.includes("notifications");
  const showSettings = isAdmin;

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-sm border-2 border-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">{t("Fratelanza", "فراتيلانزا")}</span>
        </div>
        {user?.displayName && (
          <p className="text-xs text-muted-foreground mt-2 truncate">{user.displayName}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavLink key={item.href} item={item} onClick={onNavClick} />)}
      </nav>

      <div className="p-3 border-t border-border space-y-0.5">
        {showNotifications && (
          <Link href="/notifications" onClick={onNavClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${location.startsWith("/notifications") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            data-testid="nav-notifications"
          >
            <div className="relative">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </div>
            {t("Notifications", "الإشعارات")}
            {unreadCount > 0 && <span className="ml-auto text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </Link>
        )}
        {showSettings && (
          <Link href="/settings" onClick={onNavClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${location.startsWith("/settings") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            data-testid="nav-settings"
          >
            <Settings size={17} />
            {t("Settings", "الإعدادات")}
          </Link>
        )}
        <button onClick={() => setChangePwOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
          <KeyRound size={17} />
          {t("Change Password", "تغيير كلمة المرور")}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-destructive hover:bg-destructive/10">
          <LogOut size={17} />
          {t("Sign Out", "تسجيل الخروج")}
        </button>
      </div>
    </>
  );

  const allNavForHeader = [...ALL_NAV_ITEMS,
    { href: "/notifications", key: "notifications", labelEn: "Notifications", labelAr: "الإشعارات" },
    { href: "/settings", key: "settings", labelEn: "Settings", labelAr: "الإعدادات" },
  ];
  const currentNavItem = allNavForHeader.find(i => isActive(i.href));
  const headerTitle = currentNavItem ? t(currentNavItem.labelEn, currentNavItem.labelAr) : t("Overview", "نظرة عامة");

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <aside className={`hidden md:flex flex-col w-60 border-${isRtl ? "l" : "r"} border-border bg-card`}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className={`relative flex flex-col w-60 h-full bg-card border-${isRtl ? "l" : "r"} border-border`}>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10" onClick={() => setMobileOpen(false)}><X size={18} /></Button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></Button>
            <h1 className="text-lg font-semibold">{headerTitle}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")} data-testid="toggle-language" className="font-medium text-xs px-2">
              {language === "en" ? "عربي" : "English"}
            </Button>
            {unreadCount > 0 && showNotifications && (
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={17} />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>

      <Dialog open={changePwOpen} onOpenChange={setChangePwOpen}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={handleChangePw}>
            <DialogHeader><DialogTitle>{t("Change Password", "تغيير كلمة المرور")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>{t("Current Password", "كلمة المرور الحالية")}</Label><Input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required /></div>
              <div className="space-y-2"><Label>{t("New Password", "كلمة المرور الجديدة")}</Label><Input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} required /></div>
              <div className="space-y-2"><Label>{t("Confirm New Password", "تأكيد كلمة المرور الجديدة")}</Label><Input type="password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} required /></div>
            </div>
            <DialogFooter><Button type="submit" disabled={pwLoading}>{t("Change Password", "تغيير كلمة المرور")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
