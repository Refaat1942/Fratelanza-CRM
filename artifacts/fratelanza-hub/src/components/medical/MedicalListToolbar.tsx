import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type SortOption = { value: string; labelEn: string; labelAr: string };

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: { en: string; ar: string };
  sortBy: string;
  sortDir: "asc" | "desc";
  onSortByChange: (v: string) => void;
  onSortDirToggle: () => void;
  sortOptions: SortOption[];
  exportUrl: string;
  extraFilters?: React.ReactNode;
};

export function MedicalListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirToggle,
  sortOptions,
  exportUrl,
  extraFilters,
}: Props) {
  const { language, t } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4">
      <div className="flex flex-1 flex-wrap gap-2 items-center min-w-0">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder ? (isAr ? searchPlaceholder.ar : searchPlaceholder.en) : t("Search…", "بحث…")}
          />
        </div>
        {extraFilters}
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("Sort by", "ترتيب حسب")} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {isAr ? o.labelAr : o.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" onClick={onSortDirToggle} title={t("Toggle sort direction", "عكس الترتيب")}>
          <ArrowUpDown className={`h-4 w-4 ${sortDir === "asc" ? "rotate-180" : ""}`} />
        </Button>
      </div>
      <Button type="button" variant="outline" className="gap-2 shrink-0" onClick={() => { window.location.href = exportUrl; }}>
        <Download className="h-4 w-4" />
        {t("Export Excel", "تصدير Excel")}
      </Button>
    </div>
  );
}

type Column<T> = {
  key: string;
  headerEn: string;
  headerAr: string;
  sortable?: boolean;
  sortKey?: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: { en: string; ar: string };
  rowKey: (row: T) => string | number;
};

export function MedicalDataTable<T>({
  columns,
  rows,
  sortBy,
  sortDir,
  onSort,
  isLoading,
  emptyMessage,
  rowKey,
}: TableProps<T>) {
  const { language, t } = useLanguage();
  const isAr = language === "ar";

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center">{t("Loading…", "جاري التحميل…")}</div>;
  }
  if (!rows.length) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {emptyMessage ? (isAr ? emptyMessage.ar : emptyMessage.en) : t("No records", "لا توجد سجلات")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-start font-medium ${col.sortable ? "cursor-pointer select-none hover:bg-muted" : ""} ${col.className ?? ""}`}
                onClick={() => col.sortable && onSort(col.sortKey ?? col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {isAr ? col.headerAr : col.headerEn}
                  {col.sortable && sortBy === (col.sortKey ?? col.key) && (
                    <span className="text-xs text-muted-foreground">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-2 ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
