import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, Users, CreditCard, Settings, Menu, BarChart2, Bell, UserSquare2, Sun, Moon, X } from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { useTheme } from "../ThemeProvider";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة القيادة" },
  { href: "/tasks", icon: CheckSquare, labelEn: "Tasks", labelAr: "المهام" },
  { href: "/crm", icon: Users, labelEn: "Clients", labelAr: "العملاء" },
  { href: "/finance", icon: CreditCard, labelEn: "Finance", labelAr: "المالية" },
  { href: "/team", icon: UserSquare2, labelEn: "Team", labelAr: "الفريق" },
  { href: "/reports", icon: BarChart2, labelEn: "Reports", labelAr: "التقارير" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications } = useQuery<{ id: number; isRead: boolean }[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications"),
    refetchInterval: 30000,
  });
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
          active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
        data-testid={`nav-${item.labelEn.toLowerCase()}`}
      >
        <Icon size={18} className={active ? "text-primary-foreground" : "text-muted-foreground"} />
        {t(item.labelEn, item.labelAr)}
      </Link>
    );
  };

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm border-2 border-primary-foreground"></div>
          </div>
          <span className="font-bold text-lg tracking-tight">{t("Fratelanza", "فراتيلانزا")}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map(item => <NavLink key={item.href} item={item} onClick={onNavClick} />)}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/notifications"
          onClick={onNavClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
            location.startsWith("/notifications") ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
          data-testid="nav-notifications"
        >
          <div className="relative">
            <Bell size={18} className={location.startsWith("/notifications") ? "text-primary-foreground" : "text-muted-foreground"} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </div>
          {t("Notifications", "الإشعارات")}
          {unreadCount > 0 && (
            <span className="ml-auto text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </Link>
        <Link
          href="/settings"
          onClick={onNavClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
            location.startsWith("/settings") ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
          data-testid="nav-settings"
        >
          <Settings size={18} className={location.startsWith("/settings") ? "text-primary-foreground" : "text-muted-foreground"} />
          {t("Settings", "الإعدادات")}
        </Link>
      </div>
    </>
  );

  const currentNavItem = navItems.find(i => isActive(i.href));
  const headerTitle =
    currentNavItem ? t(currentNavItem.labelEn, currentNavItem.labelAr) :
    location.startsWith("/settings") ? t("Settings", "الإعدادات") :
    location.startsWith("/notifications") ? t("Notifications", "الإشعارات") :
    t("Overview", "نظرة عامة");

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 border-${isRtl ? 'l' : 'r'} border-border bg-card`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-card border-r border-border">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </Button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-semibold">{headerTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              data-testid="toggle-language"
              className="font-medium"
            >
              {language === 'en' ? 'عربي' : 'English'}
            </Button>
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <span className="text-xs font-semibold">FH</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
