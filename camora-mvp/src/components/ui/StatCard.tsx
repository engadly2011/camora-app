import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warning?: boolean;
  className?: string;
}

export function StatCard({ label, value, sub, accent, warning, className }: StatCardProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1 rounded-xl border p-4",
      accent  ? "border-cyan-700/50 bg-cyan-950/30" :
      warning ? "border-amber-700/40 bg-amber-950/20" :
                "border-zinc-800 bg-zinc-900/60",
      className
    )}>
      <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">{label}</span>
      <span className={cn(
        "font-mono text-2xl font-bold tabular-nums leading-none",
        accent  ? "text-cyan-300" :
        warning ? "text-amber-400" :
                  "text-zinc-100"
      )}>
        {value}
      </span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}
