import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
          {language === "en" ? "عربي" : "English"}
        </Button>
      </div>

      <Card className="w-full max-w-sm shadow-2xl border-border">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 rounded border-2 border-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("Fratelanza Hub", "فراتيلانزا هاب")}</CardTitle>
          <CardDescription>{t("Sign in to your account", "تسجيل الدخول إلى حسابك")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("Username", "اسم المستخدم")}</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t("admin", "admin")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("Password", "كلمة المرور")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={isRtl ? "pl-10" : "pr-10"}
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
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("Signing in…", "جاري الدخول…") : t("Sign In", "تسجيل الدخول")}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            {t("Default: admin / admin123", "الافتراضي: admin / admin123")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
