import { useContext } from "react";
import { DiagramContext } from "../context/diagram-context";

export function useDiagram() {
  const context = useContext(DiagramContext);

  if (!context) {
    throw new Error("useDiagram must be used within DiagramContextProvider");
  }

  return context;
}
