
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This utility now adds a way to get consistent time button styling
export const timeButtonStyles = {
  container: "border border-white/20 bg-black/60 rounded-full px-5 py-2.5 min-w-[150px] text-center",
  text: "font-mono text-lg tracking-wider",
  activeText: "font-mono text-lg tracking-wider text-white",
  expiredText: "font-mono text-lg tracking-wider text-red-400",
}
