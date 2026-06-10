import type { SearchableOption } from "@/components/medical/SearchableSelect";

type Bilingual = { en: string; ar: string; value?: string };

export function toSearchableOptions(items: Bilingual[]): SearchableOption[] {
  return items.map((i) => ({
    value: i.value ?? i.en,
    labelEn: i.en,
    labelAr: i.ar,
  }));
}

export function appendCatalogLabel(current: string, label: string): string {
  const parts = current
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some((p) => p.toLowerCase() === label.toLowerCase())) return current;
  return parts.length ? `${parts.join(", ")}, ${label}` : label;
}
