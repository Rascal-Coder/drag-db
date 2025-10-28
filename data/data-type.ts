import { strHasQuotes } from "@/lib/utils";
import {
  binaryColor,
  booleanColor,
  dateColor,
  decimalColor,
  documentColor,
  enumSetColor,
  geometricColor,
  intColor,
  stringColor,
} from "./constants";

export type Field = {
  default: string;
  size: number;
  values: string[];
};

export type MySQLTypeDef = {
  type: string;
  color: string;
  checkDefault?: (field: Field) => boolean;
  hasCheck?: boolean;
  isSized?: boolean;
  hasPrecision?: boolean;
  canIncrement?: boolean;
  signed?: boolean;
  defaultSize?: number;
  hasQuotes?: boolean;
  noDefault?: boolean;
};

const intRegex = /^-?\d*$/;
const doubleRegex = /^-?\d*.?\d+$/;
const binaryRegex = /^[01]+$/;
const timeRegex = /^(?:[01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/;
const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const yearRegex = /^\d{4}$/;
const YEAR_MIN_UNIX = 1970;
const YEAR_MAX_UNIX32 = 2038;
const YEAR_MIN = 1000;
const YEAR_MAX = 9999;

export const mysqlTypesBase: Record<string, MySQLTypeDef> = {
  TINYINT: {
    type: "TINYINT",
    color: intColor,
    checkDefault: (field) => intRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  SMALLINT: {
    type: "SMALLINT",
    color: intColor,
    checkDefault: (field) => intRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  MEDIUMINT: {
    type: "MEDIUMINT",
    color: intColor,
    checkDefault: (field) => intRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  INTEGER: {
    type: "INTEGER",
    color: intColor,
    checkDefault: (field) => intRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  BIGINT: {
    type: "BIGINT",
    color: intColor,
    checkDefault: (field) => intRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: false,
    canIncrement: true,
    signed: true,
  },
  DECIMAL: {
    type: "DECIMAL",
    color: decimalColor,
    checkDefault: (field) => doubleRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  NUMERIC: {
    type: "NUMERIC",
    color: decimalColor,
    checkDefault: (field) => doubleRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  FLOAT: {
    type: "FLOAT",
    color: decimalColor,
    checkDefault: (field) => doubleRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  DOUBLE: {
    type: "DOUBLE",
    color: decimalColor,
    checkDefault: (field) => doubleRegex.test(field.default),
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BIT: {
    type: "BIT",
    color: binaryColor,
    checkDefault: (field) => field.default === "1" || field.default === "0",
    hasCheck: true,
    isSized: false,
    hasPrecision: true,
  },
  BOOLEAN: {
    type: "BOOLEAN",
    color: booleanColor,
    checkDefault: (field) =>
      field.default.toLowerCase() === "false" ||
      field.default.toLowerCase() === "true" ||
      field.default === "0" ||
      field.default === "1",
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
  },
  TIME: {
    type: "TIME",
    color: dateColor,
    checkDefault: (field) => timeRegex.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  TIMESTAMP: {
    type: "TIMESTAMP",
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!timestampRegex.test(field.default)) {
        return false;
      }
      const content = field.default.split(" ");
      const date = content[0].split("-");
      return (
        Number.parseInt(date[0], 10) >= YEAR_MIN_UNIX &&
        Number.parseInt(date[0], 10) <= YEAR_MAX_UNIX32
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  DATE: {
    type: "DATE",
    color: dateColor,
    checkDefault: (field) => dateRegex.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  DATETIME: {
    type: "DATETIME",
    color: dateColor,
    checkDefault: (field) => {
      if (field.default.toUpperCase() === "CURRENT_TIMESTAMP") {
        return true;
      }
      if (!datetimeRegex.test(field.default)) {
        return false;
      }
      const c = field.default.split(" ");
      const d = c[0].split("-");
      return (
        Number.parseInt(d[0], 10) >= YEAR_MIN &&
        Number.parseInt(d[0], 10) <= YEAR_MAX
      );
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  YEAR: {
    type: "YEAR",
    color: dateColor,
    checkDefault: (field) => yearRegex.test(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
  },
  CHAR: {
    type: "CHAR",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: true,
  },
  VARCHAR: {
    type: "VARCHAR",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 255,
    hasQuotes: true,
  },
  BINARY: {
    type: "BINARY",
    color: binaryColor,
    checkDefault: (field) =>
      field.default.length <= field.size && binaryRegex.test(field.default),
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 1,
    hasQuotes: true,
  },
  VARBINARY: {
    type: "VARBINARY",
    color: binaryColor,
    checkDefault: (field) =>
      field.default.length <= field.size && binaryRegex.test(field.default),
    hasCheck: false,
    isSized: true,
    hasPrecision: false,
    defaultSize: 255,
    hasQuotes: true,
  },
  TINYBLOB: {
    type: "TINYBLOB",
    color: binaryColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  BLOB: {
    type: "BLOB",
    color: binaryColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MEDIUMBLOB: {
    type: "MEDIUMBLOB",
    color: binaryColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  LONGBLOB: {
    type: "LONGBLOB",
    color: binaryColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  TINYTEXT: {
    type: "TINYTEXT",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65_535,
    hasQuotes: true,
  },
  TEXT: {
    type: "TEXT",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65_535,
    hasQuotes: true,
  },
  MEDIUMTEXT: {
    type: "MEDIUMTEXT",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65_535,
    hasQuotes: true,
  },
  LONGTEXT: {
    type: "LONGTEXT",
    color: stringColor,
    checkDefault: (field) => {
      if (strHasQuotes(field.default)) {
        return field.default.length - 2 <= field.size;
      }
      return field.default.length <= field.size;
    },
    hasCheck: true,
    isSized: true,
    hasPrecision: false,
    defaultSize: 65_535,
    hasQuotes: true,
  },
  ENUM: {
    type: "ENUM",
    color: enumSetColor,
    checkDefault: (field) => field.values.includes(field.default),
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    hasQuotes: true,
  },
  SET: {
    type: "SET",
    color: enumSetColor,
    checkDefault: (field) => {
      const defaultValues = field.default.split(",");
      for (const value of defaultValues) {
        if (!field.values.includes(value.trim())) {
          return false;
        }
      }
      return true;
    },
    hasCheck: false,
    isSized: false,
    hasPrecision: false,
    noDefault: true,
  },
  GEOMETRY: {
    type: "GEOMETRY",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  POINT: {
    type: "POINT",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  LINESTRING: {
    type: "LINESTRING",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  POLYGON: {
    type: "POLYGON",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTIPOINT: {
    type: "MULTIPOINT",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTILINESTRING: {
    type: "MULTILINESTRING",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  MULTIPOLYGON: {
    type: "MULTIPOLYGON",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  GEOMETRYCOLLECTION: {
    type: "GEOMETRYCOLLECTION",
    color: geometricColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
  JSON: {
    type: "JSON",
    color: documentColor,
    checkDefault: () => true,
    isSized: false,
    hasCheck: false,
    hasPrecision: false,
    noDefault: true,
  },
};

export const mysqlTypes = new Proxy(mysqlTypesBase, {
  get: (target, prop: PropertyKey): MySQLTypeDef | false => {
    if (typeof prop !== "string") {
      return false;
    }
    return prop in target ? target[prop] : false;
  },
}) as unknown as Record<string, MySQLTypeDef | false>;
