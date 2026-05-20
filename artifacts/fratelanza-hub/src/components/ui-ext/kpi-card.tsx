import React from "react";

type Tone = "default" | "primary" | "success" | "warning" | "destructive" | "info";

const TONE_BG: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-accent text-accent-foreground",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  destructive: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
  trend,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  hint?: React.ReactNode;
  trend?: { value: string | number; positive?: boolean };
}) {
  return (
    <div className="bg-card rounded-md border border-card-border p-4 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums truncate">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${TONE_BG[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
