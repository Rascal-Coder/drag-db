import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type MySQLTypeDef, mysqlTypes } from "@/data/data-type";

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

export const getTypeDef = (typeName: string) => mysqlTypes[typeName];

export const getTypeColor = (typeDef: MySQLTypeDef | false): string => {
  if (typeof typeDef === "object" && typeDef && "color" in typeDef) {
    return typeDef.color;
  }
  return "";
};

export const formatTypeSize = (
  typeDef: MySQLTypeDef | false,
  size?: number,
  precision?: number
): string => {
  if (!(typeof typeDef === "object" && typeDef)) {
    return "";
  }
  const def = typeDef;
  if (def.hasPrecision) {
    const s = typeof size === "number" ? size : def.defaultSize;
    const p = precision;
    if (typeof s === "number" && typeof p === "number") {
      return `(${s},${p})`;
    }
    if (typeof s === "number") {
      return `(${s})`;
    }
    return "";
  }
  if (def.isSized) {
    const s = typeof size === "number" ? size : def.defaultSize;
    return typeof s === "number" ? `(${s})` : "";
  }
  return "";
};
