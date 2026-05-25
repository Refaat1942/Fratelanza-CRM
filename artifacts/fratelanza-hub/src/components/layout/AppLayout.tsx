import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, CheckSquare, Users, CreditCard, Settings, Menu, BarChart2,
  Bell, UserSquare2, X, Package, Home as HomeIcon, LogOut, KeyRound,
  Truck, FileText, Receipt, Stethoscope, CalendarClock, ClipboardList, ListPlus,
  Wallet, LineChart, ChevronDown, ChevronRight, Building2, Briefcase, Pill, ClipboardCheck
} from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "../AuthProvider";
import { useFeatures } from "../FeaturesProvider";
import { BranchPicker } from "../BranchPicker";
import { useCompanyName, useBranding } from "../BrandingProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type NavItem = {
  href: string;
  key: string;
  // Optional: tenant feature-flag key, if it differs from the user-permission key.
  // Defaults to `key` when omitted. Used so e.g. dental items can require the "dental"
  // feature flag but reuse the "medical" user permission.
  featureKey?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelEn: string;
  labelAr: string;
};

type NavSubgroup = {
  id: string;
  featureKey?: string;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: NavItem[];
};

type NavGroup = {
  id: string;
  labelEn: string;
  labelAr: string;
  items: NavItem[];
  subgroups?: NavSubgroup[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "general",
    labelEn: "General",
    labelAr: "عام",
    items: [
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
      { href: "/branches", key: "branches", icon: Building2, labelEn: "Branches", labelAr: "الفروع" },
    ],
  },
  {
    id: "medical",
    labelEn: "Medical",
    labelAr: "العيادة الطبية",
    items: [
      { href: "/medical/patients", key: "medical", icon: Users, labelEn: "Patients", labelAr: "المرضى" },
      { href: "/medical/appointments", key: "medical", icon: CalendarClock, labelEn: "Appointments", labelAr: "المواعيد" },
      { href: "/medical/visits", key: "medical", icon: ClipboardList, labelEn: "Visits", labelAr: "الزيارات" },
      { href: "/medical/prescriptions", key: "medical", icon: Pill, labelEn: "Prescriptions", labelAr: "الوصفات الطبية" },
      { href: "/medical/treatment-plans", key: "medical", icon: ClipboardCheck, labelEn: "Treatment Plans", labelAr: "خطط العلاج" },
      { href: "/medical/materials", key: "medical", icon: Package, labelEn: "Materials Inventory", labelAr: "مخزون المستلزمات" },
      { href: "/medical/invoices", key: "medical", icon: Wallet, labelEn: "Medical Invoices", labelAr: "الفواتير الطبية" },
      { href: "/medical/reports", key: "medical", icon: LineChart, labelEn: "Medical Reports", labelAr: "تقارير العيادة" },
    ],
  },
];

const ALL_NAV_ITEMS_FLAT: NavItem[] = NAV_GROUPS.flatMap(g => [
  ...g.items,
  ...(g.subgroups?.flatMap(s => s.items) ?? []),
]);

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

  // Soft chime when unread count increases (skip first render so we don't ding on login).
  const prevUnreadRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = prevUnreadRef.current;
    prevUnreadRef.current = unreadCount;
    if (prev === null) return;
    if (unreadCount > prev) {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        setTimeout(() => ctx.close().catch(() => {}), 600);
      } catch { /* audio blocked — silently ignore */ }
    }
  }, [unreadCount]);

  const isAdmin = user?.role === "admin";
  const userPerms = user?.permissions ?? [];
  const { features } = useFeatures();
  const isAr = language === "ar";
  const companyName = useCompanyName(isAr);
  const { branding } = useBranding();

  // Workspace toggle: "general" or "medical". Persisted per-user in localStorage.
  // Auto-defaults: if tenant only has medical (no tasks/crm/finance enabled),
  // default to medical; otherwise default to general. Auto-switches if the
  // current route belongs to the other workspace (so a direct URL keeps working).
  const hasGeneralFeatures = features["tasks"] !== false || features["crm"] !== false || features["finance"] !== false;
  const hasMedicalFeatures = features["medical"] !== false || features["dental"] !== false;
  const [workspace, setWorkspaceState] = useState<"general" | "medical">(() => {
    try {
      const stored = localStorage.getItem("workspace");
      if (stored === "general" || stored === "medical") return stored;
    } catch { /* ignore */ }
    // Auto-default by location, then by feature mix.
    if (location.startsWith("/medical") || location.startsWith("/dental")) return "medical";
    if (!hasGeneralFeatures && hasMedicalFeatures) return "medical";
    return "general";
  });
  const setWorkspace = (w: "general" | "medical") => {
    setWorkspaceState(w);
    try { localStorage.setItem("workspace", w); } catch { /* ignore */ }
  };
  // One-way auto-switch: if the user navigates straight into a medical/dental
  // route via URL or in-app link, surface the medical sidebar so the active
  // item is visible. We never auto-switch back to "general" — that would fight
  // the user's explicit toggle choice when they're sitting on the dashboard.
  useEffect(() => {
    if ((location.startsWith("/medical") || location.startsWith("/dental")) && workspace !== "medical") {
      setWorkspaceState("medical");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const showWorkspaceToggle = hasGeneralFeatures && hasMedicalFeatures;
  // When toggle is hidden (single-workspace tenant), default what we show.
  const effectiveWorkspace: "general" | "medical" =
    showWorkspaceToggle ? workspace : (hasMedicalFeatures && !hasGeneralFeatures ? "medical" : "general");

  const canSee = (item: NavItem) => {
    const featKey = item.featureKey ?? item.key;
    if (item.key !== "dashboard" && features[featKey] === false) return false;
    return isAdmin || userPerms.includes(item.key);
  };

  // Auto-expand dental sub-group if current route is inside it
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => g.subgroups?.forEach(s => {
      if (s.items.some(i => location === i.href || location.startsWith(i.href + "/"))) {
        init[s.id] = true;
      }
    }));
    return init;
  });
  const toggleSub = (id: string) => setExpandedSubs(p => ({ ...p, [id]: !p[id] }));

  // Auto-expand any subgroup that contains the active route (covers navigation
  // straight into a sub-item via URL or in-app link).
  useEffect(() => {
    setExpandedSubs(prev => {
      const next = { ...prev };
      NAV_GROUPS.forEach(g => g.subgroups?.forEach(s => {
        if (s.items.some(i => location === i.href || location.startsWith(i.href + "/"))) {
          next[s.id] = true;
        }
      }));
      return next;
    });
  }, [location]);

  // Keep the active sidebar item visible after every navigation. Without this,
  // clicking a Medical/Dental item scrolled the sidebar back to the top of the
  // General list and looked like the section disappeared.
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const scrollActiveIntoView = (nav: HTMLElement | null) => {
      if (!nav) return;
      const active = nav.querySelector<HTMLElement>('[data-active="true"]');
      if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    // Run after paint so the expanded subgroup has rendered.
    const id = window.requestAnimationFrame(() => {
      scrollActiveIntoView(desktopNavRef.current);
      scrollActiveIntoView(mobileNavRef.current);
    });
    return () => window.cancelAnimationFrame(id);
  }, [location, expandedSubs]);

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

  const NavLink = ({ item, onClick, indent }: { item: NavItem; onClick?: () => void; indent?: boolean }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link href={item.href} onClick={onClick}
        className={`group flex items-center gap-2.5 ${indent ? "px-3 ml-3" : "px-3"} py-2 rounded-md transition-all text-[13px] font-medium ${
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
        data-testid={`nav-${item.labelEn.toLowerCase().replace(/\s+/g, "-")}`}
        data-active={active ? "true" : "false"}
      >
        <Icon size={15} className={active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground"} />
        <span className="truncate">{t(item.labelEn, item.labelAr)}</span>
      </Link>
    );
  };

  const showNotifications = isAdmin || userPerms.includes("notifications");
  const showSettings = isAdmin;

  const renderGroup = (group: NavGroup, onNavClick?: () => void) => {
    const visibleItems = group.items.filter(canSee);
    const visibleSubgroups = (group.subgroups ?? []).filter(sg => {
      if (sg.featureKey && features[sg.featureKey] === false) return false;
      return sg.items.some(canSee);
    });
    if (visibleItems.length === 0 && visibleSubgroups.length === 0) return null;
    return (
      <div key={group.id} className="space-y-0.5">
        <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--sidebar-section))]">
          {t(group.labelEn, group.labelAr)}
        </div>
        {visibleItems.map(item => <NavLink key={item.href} item={item} onClick={onNavClick} />)}
        {visibleSubgroups.map(sg => {
          const SgIcon = sg.icon;
          const expanded = !!expandedSubs[sg.id];
          const ChevronExp = expanded ? ChevronDown : (isRtl ? ChevronRight : ChevronRight);
          const sgItems = sg.items.filter(canSee);
          if (sgItems.length === 0) return null;
          return (
            <div key={sg.id}>
              <button
                onClick={() => toggleSub(sg.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                data-testid={`nav-subgroup-${sg.id}`}
              >
                <SgIcon size={15} className="text-sidebar-foreground/55" />
                <span className="flex-1 text-start">{t(sg.labelEn, sg.labelAr)}</span>
                <ChevronExp size={13} className={`text-sidebar-foreground/55 transition-transform ${expanded ? "rotate-0" : (isRtl ? "rotate-180" : "")}`} />
              </button>
              {expanded && (
                <div className={`mt-0.5 space-y-0.5 ${isRtl ? "border-r-2 mr-5" : "border-l-2 ml-5"} border-sidebar-border pl-2`}>
                  {sgItems.map(item => <NavLink key={item.href} item={item} onClick={onNavClick} indent />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const SidebarContent = ({ onNavClick, navRef }: { onNavClick?: () => void; navRef?: React.RefObject<HTMLElement | null> }) => (
    <>
      <div className="px-5 pt-5 pb-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Stethoscope size={18} className="text-sidebar-primary-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[15px] tracking-tight text-sidebar-foreground truncate">{companyName}</div>
            {user?.displayName && (
              <p className="text-[11px] text-sidebar-foreground/55 mt-0.5 truncate">{user.displayName}</p>
            )}
          </div>
        </div>
      </div>

      {showWorkspaceToggle && (
        <div className="px-3 pt-3 pb-1">
          <div className="grid grid-cols-2 gap-1 p-1 bg-sidebar-accent/40 rounded-md">
            <button
              type="button"
              onClick={() => setWorkspace("general")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                effectiveWorkspace === "general"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              }`}
              data-testid="workspace-toggle-general"
            >
              <Briefcase size={12} />
              {t("General", "عام")}
            </button>
            <button
              type="button"
              onClick={() => setWorkspace("medical")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                effectiveWorkspace === "medical"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              }`}
              data-testid="workspace-toggle-medical"
            >
              <Stethoscope size={12} />
              {t("Medical", "طبي")}
            </button>
          </div>
        </div>
      )}

      <nav ref={navRef} className="flex-1 px-2.5 pb-3 overflow-y-auto">
        {NAV_GROUPS
          .filter(g => effectiveWorkspace === "general" ? g.id !== "medical" : g.id === "medical")
          .map(g => renderGroup(g, onNavClick))}
      </nav>

      <div className="p-2.5 border-t border-sidebar-border space-y-0.5">
        {showNotifications && (
          <Link href="/notifications" onClick={onNavClick}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-[13px] font-medium ${
              location.startsWith("/notifications")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
            data-testid="nav-notifications"
          >
            <div className="relative">
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </div>
            {t("Notifications", "الإشعارات")}
            {unreadCount > 0 && <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </Link>
        )}
        {showSettings && (
          <Link href="/settings" onClick={onNavClick}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-[13px] font-medium ${
              location.startsWith("/settings")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
            data-testid="nav-settings"
          >
            <Settings size={15} />
            {t("Settings", "الإعدادات")}
          </Link>
        )}
        <button onClick={() => setChangePwOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-[13px] font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <KeyRound size={15} />
          {t("Change Password", "تغيير كلمة المرور")}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-[13px] font-medium text-red-300 hover:bg-destructive/15 hover:text-red-200">
          <LogOut size={15} />
          {t("Sign Out", "تسجيل الخروج")}
        </button>
      </div>
    </>
  );

  const allNavForHeader = [...ALL_NAV_ITEMS_FLAT,
    { href: "/notifications", key: "notifications", labelEn: "Notifications", labelAr: "الإشعارات" } as any,
    { href: "/settings", key: "settings", labelEn: "Settings", labelAr: "الإعدادات" } as any,
  ];
  const currentNavItem = allNavForHeader.find(i => isActive(i.href));
  const headerTitle = currentNavItem ? t(currentNavItem.labelEn, currentNavItem.labelAr) : t("Overview", "نظرة عامة");

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <aside className={`hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground ${isRtl ? "border-l" : "border-r"} border-sidebar-border`}>
        <SidebarContent navRef={desktopNavRef} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className={`relative flex flex-col w-64 h-full bg-sidebar text-sidebar-foreground ${isRtl ? "border-l" : "border-r"} border-sidebar-border`}>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMobileOpen(false)}><X size={18} /></Button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} navRef={mobileNavRef} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></Button>
            <h1 className="text-[15px] font-semibold text-foreground">{headerTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <BranchPicker />
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")} data-testid="toggle-language" className="font-medium text-xs px-2.5 h-8">
              {language === "en" ? "عربي" : "English"}
            </Button>
            {unreadCount > 0 && showNotifications && (
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                  <Bell size={16} />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5 md:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
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
