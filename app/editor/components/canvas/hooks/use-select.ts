import { useContext } from "react";
import { SelectContext } from "../context/select-context";

export function useSelect() {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("useSelect must be used within SelectContextProvider");
  }

  return context;
}
