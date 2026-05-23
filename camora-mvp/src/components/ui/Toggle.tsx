"use client";
import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

export function Toggle({ label, description, checked, onChange, className }: ToggleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        {description && <span className="text-xs text-zinc-500">{description}</span>}
      </div>
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onChange}
        className={cn(
          "relative h-5 w-9 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40",
          checked ? "bg-cyan-500" : "bg-zinc-700"
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "block h-4 w-4 rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </RadixSwitch.Root>
    </div>
  );
}
