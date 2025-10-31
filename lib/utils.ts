import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ARC_BASE_RADIUS,
  HEX_B_END,
  HEX_B_START,
  HEX_G_END,
  HEX_G_START,
  HEX_LENGTH,
  HEX_R_END,
  HEX_R_START,
  LINE_EPSILON,
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

export function calcPath(
  r: Relationship | undefined,
  tableWidth = 200,
  zoom = 1
): string {
  if (!r) {
    return "";
  }
  const width = tableWidth * zoom;

  const computeFieldCenterY = (tableY: number, fieldIndex: number) =>
    tableY +
    fieldIndex * TABLE_FIELD_HEIGHT +
    TABLE_HEADER_HEIGHT +
    TABLE_FIELD_HEIGHT / 2;

  const x1 = r.startTable.x;
  const y1 = computeFieldCenterY(r.startTable.y, r.startFieldIndex);

  const x2 = r.endTable.x;
  const y2 = computeFieldCenterY(r.endTable.y, r.endFieldIndex);

  const midX = (x2 + x1 + width) / 2;
  const endX = x2 + width < x1 ? x2 + width : x2;

  const tryStraightLineCase = () => {
    if (Math.abs(y1 - y2) > TABLE_FIELD_HEIGHT * zoom) {
      return "";
    }
    const radiusLocal = Math.abs(y2 - y1) / RADIUS_DIVISOR;
    if (radiusLocal > 2) {
      return "";
    }
    if (x1 + width <= x2) {
      return `M ${x1 + width} ${y1} L ${x2} ${y2 + LINE_EPSILON}`;
    }
    if (x2 + width < x1) {
      return `M ${x1} ${y1} L ${x2 + width} ${y2 + LINE_EPSILON}`;
    }
    return "";
  };

  const radius = (() => {
    if (Math.abs(y1 - y2) <= TABLE_FIELD_HEIGHT * zoom) {
      const dynamic = Math.abs(y2 - y1) / RADIUS_DIVISOR;
      return dynamic > 2 ? dynamic : ARC_BASE_RADIUS * zoom;
    }
    return ARC_BASE_RADIUS * zoom;
  })();

  const straight = tryStraightLineCase();
  if (straight) {
    return straight;
  }

  const doubleRadius = 2 * radius;
  // biome-ignore lint/style/noMagicNumbers: false
  const threeRadius = 3 * radius;
  const pathWhenYIncreasing = () => {
    if (x1 + width <= x2) {
      return `M ${x1 + width} ${y1} L ${midX - radius} ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${endX} ${y2}`;
    }
    if (x2 <= x1 + width && x1 <= x2) {
      return `M ${x1 + width} ${y1} L ${x2 + width} ${y1} A ${radius} ${radius} 0 0 1 ${x2 + width + radius} ${y1 + radius} L ${x2 + width + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${x2 + width} ${y2} L ${x2 + width} ${y2}`;
    }
    if (x2 + width >= x1 && x2 + width <= x1 + width) {
      return `M ${x1} ${y1} L ${x2 - radius} ${y1} A ${radius} ${radius} 0 0 0 ${x2 - doubleRadius} ${y1 + radius} L ${x2 - doubleRadius} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${x2 - radius} ${y2} L ${x2} ${y2}`;
    }
    return `M ${x1} ${y1} L ${midX + radius} ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 + radius} L ${midX} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${midX - radius} ${y2} L ${endX} ${y2}`;
  };

  const pathWhenYDecreasing = () => {
    if (x1 + width <= x2) {
      return `M ${x1 + width} ${y1} L ${midX - radius} ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${endX} ${y2}`;
    }
    if (x1 + width >= x2 && x1 + width <= x2 + width) {
      return `M ${x1} ${y1} L ${x1 - doubleRadius} ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - doubleRadius} ${y1 - radius} L ${x1 - threeRadius} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${x1 - doubleRadius} ${y2} L ${endX} ${y2}`;
    }
    if (x1 >= x2 && x1 <= x2 + width) {
      return `M ${x1 + width} ${y1} L ${x1 + width + radius} ${y1} A ${radius} ${radius} 0 0 0 ${x1 + width + doubleRadius} ${y1 - radius} L ${x1 + width + doubleRadius} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${x1 + width + radius} ${y2} L ${x2 + width} ${y2}`;
    }
    return `M ${x1} ${y1} L ${midX + radius} ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 - radius} L ${midX} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${midX - radius} ${y2} L ${endX} ${y2}`;
  };

  return y1 <= y2 ? pathWhenYIncreasing() : pathWhenYDecreasing();
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
