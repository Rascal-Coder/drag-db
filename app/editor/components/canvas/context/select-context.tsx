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
type SelectContextValue = {
  selectedElement: SelectState;
  setSelectedElement: Dispatch<SetStateAction<SelectState>>;
  bulkSelectedElements: SelectState[];
  setBulkSelectedElements: Dispatch<SetStateAction<SelectState[]>>;
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
    SelectState[]
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
