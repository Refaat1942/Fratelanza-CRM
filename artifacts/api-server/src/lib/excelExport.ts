import type { Response } from "express";
import ExcelJS from "exceljs";

export type ExcelColumn<T> = {
  header: string;
  key: keyof T | string;
  width?: number;
  format?: (row: T) => string | number | null | undefined;
};

export async function sendExcel<T extends Record<string, unknown>>(
  res: Response,
  filename: string,
  sheetName: string,
  columns: ExcelColumn<T>[],
  rows: T[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: String(c.key),
    width: c.width ?? 18,
  }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F4EA" } };
  for (const row of rows) {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      const k = String(col.key);
      out[k] = col.format ? col.format(row) : row[k];
    }
    ws.addRow(out);
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

/** Parse sort query: ?sortBy=createdAt&sortDir=asc */
export function parseSort(
  query: Record<string, unknown>,
  allowed: string[],
  defaultField: string,
): { field: string; dir: "asc" | "desc" } {
  const sortBy = typeof query.sortBy === "string" && allowed.includes(query.sortBy)
    ? query.sortBy
    : defaultField;
  const sortDir = query.sortDir === "asc" ? "asc" : "desc";
  return { field: sortBy, dir: sortDir };
}
