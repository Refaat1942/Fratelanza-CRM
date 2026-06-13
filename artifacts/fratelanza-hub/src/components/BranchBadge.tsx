import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "./LanguageProvider";
import { useFeatures } from "./FeaturesProvider";
import { apiFetch } from "@/lib/api";
import { Building2 } from "lucide-react";

type Branch = { id: number; name: string; nameAr?: string | null; isActive: boolean };

/**
 * Small inline badge showing which branch a record belongs to.
 * Renders nothing if branchId is null/undefined or no branches are configured.
 * Uses shared cached query (same key as BranchPicker) so it's cheap.
 */
export function BranchBadge({ branchId }: { branchId: number | null | undefined }) {
  const { language } = useLanguage();
  const { features } = useFeatures();
  const isAr = language === "ar";
  const branchesEnabled = features["branches"] !== false;

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/branches"),
    staleTime: 5 * 60 * 1000,
    enabled: branchesEnabled,
  });

  if (branchId == null) return null;
  if (!branches || branches.length === 0) return null;
  const b = branches.find(x => x.id === branchId);
  if (!b) return null;

  const label = isAr ? (b.nameAr || b.name) : b.name;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Building2 size={10} />
      {label}
    </span>
  );
}
