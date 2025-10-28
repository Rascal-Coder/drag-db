import { useContext } from "react";
import { CanvasContext } from "./canvas-context";

export function useCanvas() {
  const context = useContext(CanvasContext);

  if (!context) {
    throw new Error("useCanvas must be used within CanvasContextProvider");
  }

  return context;
}
