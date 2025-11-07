import { nanoid } from "nanoid";
import { createContext, type ReactNode, useState } from "react";
import { DEFAULT_BLUE } from "@/constants";
import type { Cardinality, Constraint } from "@/enums";
import { useTransform } from "../hooks";
import type { TableData } from "../modules/table";

type DiagramContextValue = {
  tables: TableData[];
  setTables: (actionOrValue: TableData[]) => void;
  updateTable: (
    id: string,
    updatedValues: {
      x: number;
      y: number;
    }
  ) => void;
  addRelationship: (relationshipData: RelationshipData) => void;
  relationships: RelationshipData[];
  addTable: (data?: TableData) => void;
};

export type RelationshipData = {
  startTableId: string;
  startFieldId: string;
  endTableId: string;
  endFieldId: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  cardinality: Cardinality;
  updateConstraint: Constraint;
  deleteConstraint: Constraint;
  name: string;
  id: string;
};

export const DiagramContext = createContext<DiagramContextValue | null>(null);

export default function DiagramContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { transform } = useTransform();
  const [tables, setTables] = useState<TableData[]>([]);
  const [relationships, setRelationships] = useState<RelationshipData[]>([]);
  const updateTable = (
    id: string,
    updatedValues: {
      x: number;
      y: number;
    }
  ) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedValues } : t))
    );
  };
  const addTable = (data?: TableData) => {
    const id = nanoid();
    if (data) {
      setTables((prev) => {
        const temp = prev.slice();
        temp.splice(data.index ?? 0, 0, data);
        return temp;
      });
    } else {
      setTables((prev) => [
        ...prev,
        {
          id,
          name: `table_${id}`,
          x: transform.pan.x,
          y: transform.pan.y,
          locked: false,
          fields: [
            {
              id: nanoid(),
              name: "id",
              type: "INTEGER",
              default: "",
              check: "",
              primary: true,
              unique: true,
              notNull: true,
              increment: true,
              comment: "",
            },
          ],
          color: DEFAULT_BLUE,
        },
      ]);
    }
  };
  const addRelationship = (data: RelationshipData) => {
    setRelationships((prev) => [...prev, data]);
  };
  return (
    <DiagramContext.Provider
      value={{
        tables,
        setTables,
        updateTable,
        addRelationship,
        relationships,
        addTable,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}
