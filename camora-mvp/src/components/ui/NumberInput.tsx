"use client";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

export function NumberInput({
  label, value, onChange, min, max, step = 1, suffix, className,
}: NumberInputProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className={cn(
            "h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3",
            "font-mono text-sm text-zinc-100 tabular-nums",
            "hover:border-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40",
            "transition-colors duration-150",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
        {suffix && <span className="shrink-0 text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
}
