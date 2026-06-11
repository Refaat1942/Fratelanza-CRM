import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { downloadExcel, type ExcelColumn } from "@/lib/export-excel";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  export?: ExcelColumn<T>;
  className?: string;
  sortable?: boolean;
};

export type DataTableFilter<T> = {
  id: string;
  label: string;
  allLabel?: string;
  options: { value: string; label: string }[];
  predicate: (row: T, value: string) => boolean;
};

type Props<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  filters?: DataTableFilter<T>[];
  searchPlaceholder?: string;
  searchPredicate?: (row: T, q: string) => boolean;
  exportFilename?: string;
  exportLabel?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  rowKey: (row: T) => string | number;
  toolbarExtra?: React.ReactNode;
  className?: string;
};

type SortDir = "asc" | "desc";

export function DataTable<T>({
  data,
  columns,
  filters = [],
  searchPlaceholder = "Search…",
  searchPredicate,
  exportFilename = "export",
  exportLabel = "Excel",
  emptyMessage = "No records found.",
  isLoading,
  rowKey,
  toolbarExtra,
  className,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map(f => [f.id, "all"])),
  );
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let rows = [...data];
    const q = search.trim().toLowerCase();
    if (q && searchPredicate) {
      rows = rows.filter(r => searchPredicate(r, q));
    }
    for (const f of filters) {
      const v = filterValues[f.id] ?? "all";
      if (v !== "all") rows = rows.filter(r => f.predicate(r, v));
    }
    if (sortCol) {
      const col = columns.find(c => c.id === sortCol);
      if (col?.sortValue) {
        rows.sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const aStr = av == null ? "" : String(av);
          const bStr = bv == null ? "" : String(bv);
          const aNum = typeof av === "number" ? av : Number(av);
          const bNum = typeof bv === "number" ? bv : Number(bv);
          let cmp = 0;
          if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aStr !== "" && bStr !== "") {
            cmp = aNum - bNum;
          } else {
            cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" });
          }
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }
    return rows;
  }, [data, search, searchPredicate, filters, filterValues, sortCol, sortDir, columns]);

  const toggleSort = (colId: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortCol === colId) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(colId); setSortDir("asc"); }
  };

  const handleExport = () => {
    const exportCols = columns.filter(c => c.export).map(c => c.export!);
    if (exportCols.length === 0) return;
    downloadExcel(filtered, exportCols, exportFilename);
  };

  const hasExport = columns.some(c => c.export);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 flex-1">
          {searchPredicate && (
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 ps-8 bg-card"
              />
            </div>
          )}
          {filters.map(f => (
            <Select
              key={f.id}
              value={filterValues[f.id] ?? "all"}
              onValueChange={v => setFilterValues(prev => ({ ...prev, [f.id]: v }))}
            >
              <SelectTrigger className="h-9 w-full sm:w-[160px] bg-card">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.allLabel ?? f.label}</SelectItem>
                {f.options.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {toolbarExtra}
          {hasExport && (
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport}>
              <Download size={14} />
              {exportLabel}
            </Button>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} / {data.length}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map(col => (
                <TableHead key={col.id} className={cn("text-xs font-semibold uppercase tracking-wide", col.className)}>
                  {col.sortable !== false && col.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleSort(col.id, true)}
                    >
                      {col.header}
                      {sortCol === col.id
                        ? (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                        : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  ) : col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(row => (
                <TableRow key={rowKey(row)} className="hover:bg-accent/40 transition-colors">
                  {columns.map(col => (
                    <TableCell key={col.id} className={col.className}>{col.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
