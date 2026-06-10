import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "./SearchableSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { appendCatalogLabel } from "@/lib/catalogHelpers";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  rows?: number;
  placeholder?: { en: string; ar: string };
  className?: string;
};

/** Textarea with a searchable catalog picker that appends bilingual labels. */
export function CatalogPickTextarea({ value, onChange, options, rows = 2, placeholder, className }: Props) {
  const { language, t } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-1.5">
      <SearchableSelect
        options={options}
        value=""
        onChange={(v) => {
          const item = options.find((o) => o.value === v);
          if (!item) return;
          const label = isAr && item.labelAr ? item.labelAr : item.labelEn;
          onChange(appendCatalogLabel(value, label));
        }}
        placeholder={{
          en: "Search catalog and add…",
          ar: "ابحث في القائمة وأضف…",
        }}
      />
      <Textarea
        rows={rows}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ? (isAr ? placeholder.ar : placeholder.en) : undefined}
      />
      <p className="text-[11px] text-muted-foreground">
        {t("Pick from catalog or type freely — separate multiple with commas.", "اختر من القائمة أو اكتب يدوياً — افصل بين أكثر من قيمة بفاصلة.")}
      </p>
    </div>
  );
}
