
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This utility now adds a way to get consistent time button styling
export const timeButtonStyles = {
  container: "border border-white/20 bg-black/60 rounded-full px-3 py-1.5 min-w-[120px] flex items-center justify-center",
  text: "font-mono text-base tracking-wider",
  activeText: "font-mono text-base tracking-wider text-white",
  expiredText: "font-mono text-base tracking-wider text-red-400",
}
