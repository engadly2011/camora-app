import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "warning" | "error" | "success" | "info";
  className?: string;
}

const variants = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  warning: "bg-amber-950/60 text-amber-400 border-amber-700/50",
  error:   "bg-red-950/60 text-red-400 border-red-700/50",
  success: "bg-emerald-950/60 text-emerald-400 border-emerald-700/50",
  info:    "bg-cyan-950/60 text-cyan-400 border-cyan-700/50",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
