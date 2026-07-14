import React from "react";

type Tone = "default" | "primary" | "success" | "warning" | "destructive" | "info";

const TONE_BG: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700",
  success: "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700",
  warning: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
  destructive: "bg-gradient-to-br from-red-100 to-rose-100 text-red-700",
  info: "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700",
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
    <div className="bg-card rounded-xl border border-card-border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110 ${TONE_BG[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
