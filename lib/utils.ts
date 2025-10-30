import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ARC_BASE_RADIUS,
  DEFAULT_TABLE_WIDTH,
  HEX_B_END,
  HEX_B_START,
  HEX_G_END,
  HEX_G_START,
  HEX_LENGTH,
  HEX_R_END,
  HEX_R_START,
  LINE_EPSILON,
  MIN_RADIUS,
  RADIUS_DIVISOR,
  TABLE_FIELD_HEIGHT,
  TABLE_HEADER_HEIGHT,
} from "@/constants";
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

export const isSameElement = (
  el1: {
    id: string;
    type: number;
  },
  el2: {
    id: string;
    type: number;
  }
) => el1.id === el2.id && el1.type === el2.type;

type Relationship = {
  startTable: { x: number; y: number };
  endTable: { x: number; y: number };
  startFieldIndex: number;
  endFieldIndex: number;
  controlPoints?: { x: number; y: number }[];
};

type PathParamsBase = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
};

type HorizontalParams = PathParamsBase & { zoom: number };
type CurvedParams = PathParamsBase & {
  radius: number;
  midX: number;
  endX: number;
};

function tryBuildNearlyHorizontalPath(p: HorizontalParams): string | null {
  const { x1, y1, x2, y2, width, zoom } = p;
  if (Math.abs(y1 - y2) <= TABLE_FIELD_HEIGHT * zoom) {
    const radius = Math.abs(y2 - y1) / RADIUS_DIVISOR;
    if (radius <= MIN_RADIUS) {
      if (x1 + width <= x2) {
        return `M ${x1 + width} ${y1} L ${x2} ${y2 + LINE_EPSILON}`;
      }
      if (x2 + width < x1) {
        return `M ${x1} ${y1} L ${x2 + width} ${y2 + LINE_EPSILON}`;
      }
    }
  }
  return null;
}

function buildPathUpward(p: CurvedParams): string {
  const { x1, y1, x2, y2, width, radius, midX, endX } = p;
  const isLeftToRight = x1 + width <= x2;
  const x2OverlapLeft = x2 <= x1 + width && x1 <= x2;
  const x2OverlapRight = x2 + width >= x1 && x2 + width <= x1 + width;

  if (isLeftToRight) {
    return `M ${x1 + width} ${y1} L ${midX - radius} ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${endX} ${y2}`;
  }
  if (x2OverlapLeft) {
    return `M ${x1 + width} ${y1} L ${x2 + width} ${y1} A ${radius} ${radius} 0 0 1 ${x2 + width + radius} ${y1 + radius} L ${x2 + width + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${x2 + width} ${y2} L ${x2 + width} ${y2}`;
  }
  if (x2OverlapRight) {
    return `M ${x1} ${y1} L ${x2 - radius} ${y1} A ${radius} ${radius} 0 0 0 ${x2 - radius - radius} ${y1 + radius} L ${x2 - radius - radius} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${x2 - radius} ${y2} L ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${midX + radius} ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 + radius} L ${midX} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${midX - radius} ${y2} L ${endX} ${y2}`;
}

function buildPathDownward(p: CurvedParams): string {
  const { x1, y1, x2, y2, width, radius, midX, endX } = p;
  const isLeftToRight = x1 + width <= x2;
  if (isLeftToRight) {
    return `M ${x1 + width} ${y1} L ${midX - radius} ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${endX} ${y2}`;
  }
  if (x1 + width >= x2 && x1 + width <= x2 + width) {
    return `M ${x1} ${y1} L ${x1 - radius - radius} ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y1 - radius} L ${x1 - radius - radius - radius} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius} ${y2} L ${endX} ${y2}`;
  }
  if (x1 >= x2 && x1 <= x2 + width) {
    return `M ${x1 + width} ${y1} L ${x1 + width + radius} ${y1} A ${radius} ${radius} 0 0 0 ${x1 + width + radius + radius} ${y1 - radius} L ${x1 + width + radius + radius} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${x1 + width + radius} ${y2} L ${x2 + width} ${y2}`;
  }
  return `M ${x1} ${y1} L ${midX + radius} ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 - radius} L ${midX} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${midX - radius} ${y2} L ${endX} ${y2}`;
}

export function calcPath(
  r: Relationship | undefined,
  tableWidth = DEFAULT_TABLE_WIDTH,
  zoom = 1
): string {
  if (!r) {
    return "";
  }
  const width = tableWidth * zoom;

  const x1 = r.startTable.x;
  const y1 =
    r.startTable.y +
    r.startFieldIndex * TABLE_FIELD_HEIGHT +
    TABLE_HEADER_HEIGHT +
    TABLE_FIELD_HEIGHT / 2;

  const x2 = r.endTable.x;
  const y2 =
    r.endTable.y +
    r.endFieldIndex * TABLE_FIELD_HEIGHT +
    TABLE_HEADER_HEIGHT +
    TABLE_FIELD_HEIGHT / 2;

  const midX = (x2 + x1 + width) / 2;
  const endX = x2 + width < x1 ? x2 + width : x2;

  const horizontal = tryBuildNearlyHorizontalPath({
    x1,
    y1,
    x2,
    y2,
    width,
    zoom,
  });
  if (horizontal) {
    return horizontal;
  }

  const radius = ARC_BASE_RADIUS * zoom;
  if (y1 <= y2) {
    return buildPathUpward({ x1, y1, x2, y2, width, radius, midX, endX });
  }
  return buildPathDownward({ x1, y1, x2, y2, width, radius, midX, endX });
}

// hex2rgba: 简单将 #RRGGBB 转换为 rgba(r,g,b,a)
// 仅支持 #RRGGBB，不含alpha和缩写。若格式错直接返回原色。
export function hex2rgba(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== HEX_LENGTH) {
    return hex;
  }
  const r = Number.parseInt(hex.slice(HEX_R_START, HEX_R_END), 16);
  const g = Number.parseInt(hex.slice(HEX_G_START, HEX_G_END), 16);
  const b = Number.parseInt(hex.slice(HEX_B_START, HEX_B_END), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
