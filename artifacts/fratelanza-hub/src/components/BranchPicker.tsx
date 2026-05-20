import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "./LanguageProvider";
import { useAuth } from "./AuthProvider";
import { useFeatures } from "./FeaturesProvider";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Branch = { id: number; name: string; nameAr?: string | null; isActive: boolean };

/**
 * Admin-only topbar picker that sets a server-side session "branchOverride".
 * Non-admin users automatically see only their assigned branch — no picker needed.
 * Hidden for tenants with no branches.
 */
export function BranchPicker() {
  const { t, language } = useLanguage();
  const { user, refresh } = useAuth();
  const { features } = useFeatures();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isAr = language === "ar";
  const branchesEnabled = features["branches"] !== false;

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/branches"),
    staleTime: 5 * 60 * 1000,
    enabled: user?.role === "admin" && branchesEnabled,
  });

  if (!branchesEnabled) return null;
  if (user?.role !== "admin") return null;
  const active = (branches ?? []).filter(b => b.isActive);
  if (active.length === 0) return null;

  const current = user.branchOverride ?? null;

  const apply = async (v: string) => {
    const branchId = v === "all" ? null : parseInt(v, 10);
    try {
      await apiFetch("/branches/select-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId }),
      });
      await refresh();
      await qc.invalidateQueries();
      toast({
        title: t("Branch view updated", "تم تحديث عرض الفرع"),
        description: branchId
          ? t("Showing data for one branch.", "يتم عرض بيانات فرع واحد.")
          : t("Showing all branches.", "يتم عرض جميع الفروع."),
      });
    } catch {
      toast({ title: t("Failed to switch branch", "تعذر تبديل الفرع"), variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Building2 size={14} className="text-muted-foreground" />
      <Select value={current == null ? "all" : String(current)} onValueChange={apply}>
        <SelectTrigger className="h-8 w-[170px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("All branches", "كل الفروع")}</SelectItem>
          {active.map(b => (
            <SelectItem key={b.id} value={String(b.id)}>
              {isAr ? (b.nameAr || b.name) : b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
