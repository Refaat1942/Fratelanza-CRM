import * as XLSX from "xlsx";

export type ExcelColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

export function downloadExcel<T>(
  rows: T[],
  columns: ExcelColumn<T>[],
  filename: string,
): void {
  const data = rows.map(row => {
    const obj: Record<string, string | number> = {};
    for (const col of columns) {
      const v = col.value(row);
      obj[col.header] = v == null || v === "" ? "" : v;
    }
    return obj;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Data");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
