import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Medicine = {
  id: number;
  material: string;
  materialDescription: string;
  bun: string | null;
};

type Props = {
  value: string;
  onChange: (name: string, medicine?: Medicine) => void;
  required?: boolean;
};

export function MedicinePicker({ value, onChange, required }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);

  const { data: items = [] } = useQuery<Medicine[]>({
    queryKey: ["medicine-master", q],
    queryFn: () => apiFetch(`/medicine-master?search=${encodeURIComponent(q)}`),
    enabled: q.length >= 1,
  });

  const filtered = useMemo(() => items.slice(0, 12), [items]);
  const exactMatch = useMemo(
    () => filtered.some(m => m.materialDescription.toLowerCase() === q.trim().toLowerCase()),
    [filtered, q],
  );
  const showAdd = q.trim().length >= 2 && !exactMatch;

  const addMut = useMutation({
    mutationFn: () => {
      const name = q.trim();
      const material = name.slice(0, 32).replace(/\s+/g, "_").toUpperCase() || `MED_${Date.now()}`;
      return apiFetch<Medicine>("/medicine-master", {
        method: "POST",
        body: JSON.stringify({ material, materialDescription: name, bun: null }),
      });
    },
    onSuccess: (med) => {
      qc.invalidateQueries({ queryKey: ["medicine-master"] });
      setQ(med.materialDescription);
      onChange(med.materialDescription, med);
      setOpen(false);
      toast({ title: t("Medicine added to master", "تمت إضافة الدواء للسجل") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="relative">
      <Input
        required={required}
        value={q}
        onChange={e => {
          setQ(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={t("Search medicine master…", "ابحث في سجل الأدوية…")}
      />
      {open && (filtered.length > 0 || showAdd) && (
        <ul className={cn(
          "absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto text-sm",
        )}>
          {filtered.map(m => (
            <li key={m.id}>
              <button
                type="button"
                className="w-full text-start px-3 py-2 hover:bg-muted"
                onMouseDown={e => {
                  e.preventDefault();
                  setQ(m.materialDescription);
                  onChange(m.materialDescription, m);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{m.materialDescription}</div>
                <div className="text-xs text-muted-foreground">{m.material}{m.bun ? ` · ${m.bun}` : ""}</div>
              </button>
            </li>
          ))}
          {showAdd && (
            <li>
              <button
                type="button"
                className="w-full text-start px-3 py-2 hover:bg-muted text-primary flex items-center gap-1.5"
                disabled={addMut.isPending}
                onMouseDown={e => {
                  e.preventDefault();
                  addMut.mutate();
                }}
              >
                <Plus size={14} />
                {addMut.isPending
                  ? t("Adding…", "جاري الإضافة…")
                  : t(`Add "${q.trim()}" to master`, `إضافة "${q.trim()}" للسجل`)}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
