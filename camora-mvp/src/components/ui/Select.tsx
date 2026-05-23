"use client";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Select<T extends string>({
  value, onChange, options, label, className, disabled,
}: SelectProps<T>) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
          {label}
        </span>
      )}
      <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border",
            "border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100",
            "hover:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500",
            "data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed",
            "transition-colors duration-150"
          )}
        >
          <RadixSelect.Value />
          <RadixSelect.Icon>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={cn(
              "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl",
              "border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60",
              "animate-in fade-in-0 zoom-in-95"
            )}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-lg px-3 py-2",
                    "text-sm text-zinc-200 outline-none",
                    "data-[highlighted]:bg-zinc-800 data-[highlighted]:text-zinc-50",
                    "data-[state=checked]:text-cyan-400"
                  )}
                >
                  <RadixSelect.ItemText>
                    <span className="font-medium">{opt.label}</span>
                    {opt.description && (
                      <span className="ml-2 text-xs text-zinc-500">{opt.description}</span>
                    )}
                  </RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <Check className="h-3.5 w-3.5" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
