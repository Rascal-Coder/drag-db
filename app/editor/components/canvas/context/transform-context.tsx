import { createContext, type ReactNode, useCallback, useState } from "react";

const MIN_ZOOM = 0.02;
const MAX_ZOOM = 5;
const DEFAULT_ZOOM = 1;

type TransformState = {
  zoom: number;
  pan: { x: number; y: number };
};
type TransformAction =
  | TransformState
  | ((prev: TransformState) => TransformState);

/**
 * 变换操作的上下文值接口
 */
type TransformContextValue = {
  transform: TransformState;
  setTransform: (actionOrValue: TransformAction) => void;
};

export const TransformContext = createContext<TransformContextValue | null>(
  null
);

export default function TransformContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [transform, setTransformInternal] = useState<TransformState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });

  const setTransform = useCallback((actionOrValue: TransformAction) => {
    // 将值限制在 min 和 max 之间
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    // 从给定值中找到第一个有效的数字
    const findFirstNumber = (...values: unknown[]) =>
      values.find(
        (value) => typeof value === "number" && !Number.isNaN(value)
      ) as number | undefined;

    setTransformInternal((prev) => {
      let value: TransformState;
      if (typeof actionOrValue === "function") {
        value = actionOrValue(prev);
      } else {
        value = actionOrValue;
      }

      return {
        // 将缩放限制在 MIN_ZOOM 和 MAX_ZOOM 之间，默认回退到 DEFAULT_ZOOM
        zoom: clamp(
          findFirstNumber(value.zoom, prev.zoom, DEFAULT_ZOOM) ?? DEFAULT_ZOOM,
          MIN_ZOOM,
          MAX_ZOOM
        ),
        // 为平移坐标使用值、前值或 0 中的第一个有效数字
        pan: {
          x: findFirstNumber(value.pan?.x, prev.pan?.x, 0) ?? 0,
          y: findFirstNumber(value.pan?.y, prev.pan?.y, 0) ?? 0,
        },
      };
    });
  }, []);

  return (
    <TransformContext.Provider value={{ transform, setTransform }}>
      {children}
    </TransformContext.Provider>
  );
}
