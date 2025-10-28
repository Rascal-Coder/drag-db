import { useContext } from "react";
import { TransformContext } from "./transform-context";

export function useTransform() {
  const context = useContext(TransformContext);

  if (!context) {
    throw new Error(
      "useTransform must be used within TransformContextProvider"
    );
  }

  return context;
}
