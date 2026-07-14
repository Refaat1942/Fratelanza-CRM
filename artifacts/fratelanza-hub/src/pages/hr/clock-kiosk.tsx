import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../components/LanguageProvider";
import { publicApiPost } from "@/lib/public-api";
import { CheckCircle2, LogIn, LogOut, ScanLine } from "lucide-react";

type ClockResult = {
  type: "in" | "out";
  clockedAt: string;
  employee: { name: string; nameAr?: string | null; department?: string | null; departmentAr?: string | null };
};

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? trimmed;
  } catch {
    return trimmed;
  }
}

export default function ClockKiosk() {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClockResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const refocus = () => inputRef.current?.focus();
    window.addEventListener("click", refocus);
    return () => window.removeEventListener("click", refocus);
  }, []);

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => setResult(null), 4000);
    return () => clearTimeout(id);
  }, [result]);

  const handleScan = async (raw: string) => {
    const token = extractToken(raw);
    if (!token || token.length < 8) return;
    setLoading(true);
    setError(null);
    try {
      const res = await publicApiPost<ClockResult>(`/public/clock/${encodeURIComponent(token)}`);
      setResult(res);
      setScanBuffer("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "scan_failed");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleScan(scanBuffer);
    }
  };

  const displayName = result
    ? (language === "ar" && result.employee.nameAr ? result.employee.nameAr : result.employee.name)
    : "";

  return (
    <div className="min-h-screen gradient-hero text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/30 animate-float" />
        <div className="absolute bottom-20 right-16 w-48 h-48 rounded-full bg-orange-300/30 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-cyan-200/30 animate-pulse-soft" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg text-center space-y-8"
      >
        <div>
          <p className="text-white/80 text-sm font-medium uppercase tracking-widest">
            {t("Attendance Clock", "ساعة الحضور")}
          </p>
          <p className="text-6xl font-extrabold tabular-nums mt-2 drop-shadow-sm">
            {now.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-white/70 mt-1">
            {now.toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl border border-white/25 p-8 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-4 animate-pulse-soft">
            <ScanLine size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t("Scan your badge", "امسح بطاقتك")}</h1>
          <p className="text-white/75 mt-2 text-sm">
            {t("Hold your QR badge to the scanner or tap to focus", "ضع بطاقة QR أمام الماسح أو اضغط للتركيز")}
          </p>
          <input
            ref={inputRef}
            type="text"
            value={scanBuffer}
            onChange={(e) => setScanBuffer(e.target.value)}
            onKeyDown={onKeyDown}
            className="sr-only"
            aria-label={t("Scan input", "إدخال المسح")}
            autoComplete="off"
          />
          {loading && (
            <div className="mt-6 w-8 h-8 mx-auto rounded-full border-2 border-white border-t-transparent animate-spin" />
          )}
          {error && (
            <p className="mt-4 text-sm bg-red-500/30 rounded-xl px-4 py-2">{error}</p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.clockedAt}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white text-foreground rounded-3xl p-6 shadow-2xl"
            >
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${result.type === "in" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
                {result.type === "in" ? <LogIn size={32} /> : <LogOut size={32} />}
              </div>
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={28} />
              <p className="text-xl font-bold">{displayName}</p>
              <p className="text-muted-foreground mt-1">
                {result.type === "in"
                  ? t("Clocked IN successfully", "تم تسجيل الدخول بنجاح")
                  : t("Clocked OUT successfully", "تم تسجيل الخروج بنجاح")}
              </p>
              <p className="text-sm text-muted-foreground mt-2 tabular-nums">
                {new Date(result.clockedAt).toLocaleTimeString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
