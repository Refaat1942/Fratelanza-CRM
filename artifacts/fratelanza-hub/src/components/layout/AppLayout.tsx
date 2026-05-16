import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, Users, CreditCard, Settings, Menu } from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة القيادة" },
  { href: "/tasks", icon: CheckSquare, labelEn: "Tasks", labelAr: "المهام" },
  { href: "/crm", icon: Users, labelEn: "Clients", labelAr: "العملاء" },
  { href: "/finance", icon: CreditCard, labelEn: "Finance", labelAr: "المالية" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t, isRtl } = useLanguage();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 border-${isRtl ? 'l' : 'r'} border-border bg-card`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm border-2 border-primary-foreground"></div>
            </div>
            <span className="font-bold text-lg tracking-tight">
              {t("Fratelanza", "فراتيلانزا")}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                data-testid={`nav-${item.labelEn.toLowerCase()}`}
              >
                <Icon size={18} className={isActive ? "text-primary-foreground" : "text-muted-foreground"} />
                {t(item.labelEn, item.labelAr)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link 
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
              location.startsWith("/settings") 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            data-testid="nav-settings"
          >
            <Settings size={18} className={location.startsWith("/settings") ? "text-primary-foreground" : "text-muted-foreground"} />
            {t("Settings", "الإعدادات")}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 mr-2">
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-semibold">
              {navItems.find(i => i.href === location || (i.href !== "/" && location.startsWith(i.href)))?.labelEn ? 
                t(
                  navItems.find(i => i.href === location || (i.href !== "/" && location.startsWith(i.href)))?.labelEn || "Overview", 
                  navItems.find(i => i.href === location || (i.href !== "/" && location.startsWith(i.href)))?.labelAr || "نظرة عامة"
                ) : location.startsWith("/settings") ? t("Settings", "الإعدادات") : t("Overview", "نظرة عامة")
              }
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
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
