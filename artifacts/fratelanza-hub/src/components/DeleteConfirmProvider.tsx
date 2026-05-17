import React, { createContext, useContext, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { AlertTriangle } from "lucide-react";

type ConfirmOptions = {
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
};

type Ctx = { confirmDelete: (opts: ConfirmOptions) => void };
const DeleteConfirmContext = createContext<Ctx>({ confirmDelete: () => {} });

export function DeleteConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t, isRtl } = useLanguage();
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmDelete = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setPassword("");
    setError("");
  }, []);

  const close = () => {
    setOpts(null);
    setPassword("");
    setError("");
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opts || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("Incorrect password", "كلمة المرور غير صحيحة"));
      }
      await opts.onConfirm();
      close();
    } catch (err: any) {
      setError(err.message || t("Error", "خطأ"));
      setLoading(false);
    }
  };

  return (
    <DeleteConfirmContext.Provider value={{ confirmDelete }}>
      {children}
      <Dialog open={!!opts} onOpenChange={v => !v && !loading && close()}>
        <DialogContent className={isRtl ? "rtl" : "ltr"}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-destructive" />
                </div>
                <DialogTitle>{opts?.title || t("Confirm Delete", "تأكيد الحذف")}</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                {opts?.description || t("This action cannot be undone. Enter your password to confirm.", "لا يمكن التراجع عن هذا الإجراء. أدخل كلمة المرور للتأكيد.")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Label>{t("Your Password", "كلمة المرور الخاصة بك")}</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("Enter your password", "أدخل كلمة المرور")}
                autoFocus
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={close} disabled={loading}>
                {t("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" variant="destructive" disabled={loading || !password}>
                {loading ? t("Deleting...", "جاري الحذف...") : t("Delete", "حذف")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DeleteConfirmContext.Provider>
  );
}

export function useDeleteConfirm() {
  return useContext(DeleteConfirmContext).confirmDelete;
}
