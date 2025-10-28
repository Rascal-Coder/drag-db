import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function strHasQuotes(str: string) {
  if (str.length < 2) {
    return false;
  }

  return (
    (str[0] === str.at(-1) && str[0] === "'") ||
    (str[0] === str.at(-1) && str[0] === '"') ||
    (str[0] === str.at(-1) && str[0] === "`")
  );
}
