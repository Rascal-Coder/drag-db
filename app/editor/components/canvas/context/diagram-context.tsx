import { createContext, type ReactNode, useState } from "react";
import type { Cardinality, Constraint } from "@/enums";
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
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}
