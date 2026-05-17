import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/LanguageProvider";
import { Eye, EyeOff, Building2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || t("Login failed", "فشل تسجيل الدخول"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir={isRtl ? "rtl" : "ltr"}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-primary blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500 blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Fratelanza</span>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            {t("Manage your business with confidence", "أدر عملك بثقة واحترافية")}
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            {t("Tasks · CRM · Finance · Team · Products · Rentals", "المهام · العملاء · المالية · الفريق · المنتجات · الإيجارات")}
          </p>
          <div className="flex gap-2 pt-2">
            {["Tasks", "Finance", "Reports", "Team"].map(tag => (
              <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">{tag}</span>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-white/30 text-xs">© {new Date().getFullYear()} Fratelanza Hub</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="flex justify-end items-center gap-2 p-4">
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")} className="text-xs">
            {language === "en" ? "عربي" : "English"}
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Building2 size={20} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Fratelanza</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t("Welcome back", "مرحباً بعودتك")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("Sign in to your account to continue", "سجل دخولك للمتابعة")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">{t("Username", "اسم المستخدم")}</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t("Password", "كلمة المرور")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={`h-11 ${isRtl ? "pl-10" : "pr-10"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRtl ? "left-3" : "right-3"}`}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading ? t("Signing in…", "جاري الدخول…") : t("Sign In", "تسجيل الدخول")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
