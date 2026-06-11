import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Diagnosis = { id: number; code: string | null; name: string; nameAr: string | null };

type Props = {
  value: string;
  onChange: (v: string) => void;
  isAr?: boolean;
};

export function DiagnosisPicker({ value, onChange, isAr }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);

  const { data: items = [] } = useQuery<Diagnosis[]>({
    queryKey: ["diagnoses-master", q],
    queryFn: () => apiFetch(`/diagnoses-master?search=${encodeURIComponent(q)}`),
    enabled: q.length >= 1,
  });

  return (
    <div className="relative">
      <Input
        value={q}
        dir={isAr ? "rtl" : "ltr"}
        onChange={e => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t("Diagnosis (pick from master or type)", "التشخيص (اختر من القائمة أو اكتب)")}
      />
      {open && items.length > 0 && (
        <ul className={cn("absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto text-sm")}>
          {items.slice(0, 10).map(d => {
            const label = isAr ? (d.nameAr || d.name) : d.name;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  className="w-full text-start px-3 py-2 hover:bg-muted"
                  onMouseDown={e => { e.preventDefault(); setQ(label); onChange(label); setOpen(false); }}
                >
                  {d.code && <span className="text-xs text-muted-foreground me-2">{d.code}</span>}
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
