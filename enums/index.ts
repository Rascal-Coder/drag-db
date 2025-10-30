export const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
  RELATIONSHIP: 4,
  TYPE: 5,
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

export const Cardinality = {
  ONE_TO_ONE: "one_to_one",
  ONE_TO_MANY: "one_to_many",
  MANY_TO_ONE: "many_to_one",
} as const;

export type Cardinality = (typeof Cardinality)[keyof typeof Cardinality];

export const Constraint = {
  NONE: "No action",
  RESTRICT: "Restrict",
  CASCADE: "Cascade",
  SET_NULL: "Set null",
  SET_DEFAULT: "Set default",
} as const;

export type Constraint = (typeof Constraint)[keyof typeof Constraint];
