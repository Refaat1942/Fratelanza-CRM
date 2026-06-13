import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);

  const { data: items = [] } = useQuery<Medicine[]>({
    queryKey: ["medicine-master", q],
    queryFn: async () => {
      const res = await apiFetch<{ items: Medicine[] } | Medicine[]>(
        `/medicine-master?search=${encodeURIComponent(q)}&pageSize=20`,
      );
      return Array.isArray(res) ? res : res.items;
    },
    enabled: q.length >= 1,
  });

  const filtered = useMemo(() => items.slice(0, 12), [items]);

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
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t("Search medicine master…", "ابحث في سجل الأدوية…")}
      />
      {open && filtered.length > 0 && (
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
        </ul>
      )}
    </div>
  );
}
