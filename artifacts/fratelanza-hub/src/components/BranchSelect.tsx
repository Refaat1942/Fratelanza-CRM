import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useFeatures } from "@/components/FeaturesProvider";
import { apiFetch } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Branch = { id: number; name: string; nameAr?: string | null; isActive: boolean };

export function BranchSelect({
  value,
  onChange,
  label,
  showLabel = true,
}: {
  value: number | null | undefined;
  onChange: (id: number | null) => void;
  label?: string;
  showLabel?: boolean;
}) {
  const { t, language } = useLanguage();
  const { features } = useFeatures();
  const isAr = language === "ar";
  const branchesEnabled = features["branches"] !== false;
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/branches"),
    staleTime: 5 * 60 * 1000,
    enabled: branchesEnabled,
  });
  const active = (branches ?? []).filter(b => b.isActive);
  if (active.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <Label className="text-xs font-semibold">
          {label ?? t("Branch", "الفرع")}
        </Label>
      )}
      <Select
        value={value == null ? "none" : String(value)}
        onValueChange={v => onChange(v === "none" ? null : parseInt(v))}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("— No branch —", "— بدون فرع —")}</SelectItem>
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
