import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

export type SearchableOption = {
  value: string;
  labelEn: string;
  labelAr?: string;
  keywords?: string;
};

type Props = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: { en: string; ar: string };
  emptyText?: { en: string; ar: string };
  className?: string;
  allowClear?: boolean;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  className,
  allowClear,
}: Props) {
  const { language, t } = useLanguage();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const label = selected ? (isAr && selected.labelAr ? selected.labelAr : selected.labelEn) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">
            {label || (placeholder ? (isAr ? placeholder.ar : placeholder.en) : t("Select…", "اختر…"))}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("Search…", "بحث…")} />
          <CommandList>
            <CommandEmpty>{emptyText ? (isAr ? emptyText.ar : emptyText.en) : t("No results", "لا نتائج")}</CommandEmpty>
            <CommandGroup>
              {allowClear && value && (
                <CommandItem value="__clear__" onSelect={() => { onChange(""); setOpen(false); }}>
                  {t("Clear", "مسح")}
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.value} ${o.labelEn} ${o.labelAr ?? ""} ${o.keywords ?? ""}`}
                  onSelect={() => { onChange(o.value); setOpen(false); }}
                >
                  <Check className={cn("me-2 h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                  {isAr && o.labelAr ? o.labelAr : o.labelEn}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
