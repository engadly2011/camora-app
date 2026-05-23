"use client";
import * as RadixSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  className?: string;
}

export function Slider({
  label, value, onChange, min, max, step = 1, format, className,
}: SliderProps) {
  const display = format ? format(value) : String(value);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">{label}</span>
        <span className="font-mono text-xs text-cyan-400 tabular-nums">{display}</span>
      </div>
      <RadixSlider.Root
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => v !== undefined && onChange(v)}
        className="relative flex h-4 w-full touch-none select-none items-center"
      >
        <RadixSlider.Track className="relative h-[3px] w-full grow rounded-full bg-zinc-800">
          <RadixSlider.Range className="absolute h-full rounded-full bg-cyan-500" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className={cn(
            "block h-4 w-4 rounded-full border-2 border-cyan-500 bg-zinc-950",
            "shadow-md shadow-cyan-500/20",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500/40",
            "transition-transform duration-100 hover:scale-110"
          )}
        />
      </RadixSlider.Root>
    </div>
  );
}
