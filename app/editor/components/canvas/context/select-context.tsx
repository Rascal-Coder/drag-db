import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useState,
} from "react";
import { ObjectType } from "@/enums";

type SelectState = {
  id: string;
  type: ObjectType;
};
type BulkSelectedElement = {
  id: string;
  type: number;
  currentCoords: {
    x: number;
    y: number;
  };
  initialCoords: {
    x: number;
    y: number;
  };
};
type SelectContextValue = {
  selectedElement: SelectState;
  setSelectedElement: Dispatch<SetStateAction<SelectState>>;
  bulkSelectedElements: BulkSelectedElement[];
  setBulkSelectedElements: Dispatch<SetStateAction<BulkSelectedElement[]>>;
};
export const SelectContext = createContext<null | SelectContextValue>(null);
export default function SelectContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedElement, setSelectedElement] = useState<SelectState>({
    type: ObjectType.NONE,
    id: "",
  });
  const [bulkSelectedElements, setBulkSelectedElements] = useState<
    {
      id: string;
      type: number;
      currentCoords: {
        x: number;
        y: number;
      };
      initialCoords: {
        x: number;
        y: number;
      };
    }[]
  >([]);

  return (
    <SelectContext.Provider
      value={{
        selectedElement,
        setSelectedElement,
        bulkSelectedElements,
        setBulkSelectedElements,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}
