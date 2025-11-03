import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

  // 存储待处理的最新操作，确保总是应用最新的值
  const pendingActionRef = useRef<TransformAction | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // 将值限制在 min 和 max 之间
  const clamp = useCallback(
    (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value)),
    []
  );

  // 从给定值中找到第一个有效的数字
  const findFirstNumber = useCallback(
    (...values: unknown[]) =>
      values.find(
        (value) => typeof value === "number" && !Number.isNaN(value)
      ) as number | undefined,
    []
  );

  const applyTransform = useCallback(
    (actionOrValue: TransformAction, currentState: TransformState) => {
      let value: TransformState;
      if (typeof actionOrValue === "function") {
        value = actionOrValue(currentState);
      } else {
        value = actionOrValue;
      }

      return {
        // 将缩放限制在 MIN_ZOOM 和 MAX_ZOOM 之间，默认回退到 DEFAULT_ZOOM
        zoom: clamp(
          findFirstNumber(value.zoom, currentState.zoom, DEFAULT_ZOOM) ??
            DEFAULT_ZOOM,
          MIN_ZOOM,
          MAX_ZOOM
        ),
        // 为平移坐标使用值、前值或 0 中的第一个有效数字
        pan: {
          x: findFirstNumber(value.pan?.x, currentState.pan?.x, 0) ?? 0,
          y: findFirstNumber(value.pan?.y, currentState.pan?.y, 0) ?? 0,
        },
      };
    },
    [clamp, findFirstNumber]
  );

  const setTransform = useCallback(
    (actionOrValue: TransformAction) => {
      // 保存最新的操作
      pendingActionRef.current = actionOrValue;

      // 如果已经有待处理的 RAF，不需要创建新的
      if (rafIdRef.current !== null) {
        return;
      }

      // 使用 requestAnimationFrame 进行节流，限制更新频率到 ~60fps
      const scheduleUpdate = () => {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;

          // 获取最新的待处理操作
          const action = pendingActionRef.current;
          if (action === null) {
            return;
          }

          // 清空待处理操作，准备应用
          pendingActionRef.current = null;

          // 应用状态更新
          setTransformInternal((prev) => applyTransform(action, prev));

          // 如果在处理期间又有新的操作，立即安排下一次更新
          if (pendingActionRef.current !== null) {
            scheduleUpdate();
          }
        });
      };

      scheduleUpdate();
    },
    [applyTransform]
  );

  // 组件卸载时清理 requestAnimationFrame
  useEffect(() => {
    const cleanup = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    return cleanup;
  }, []);

  return (
    <TransformContext.Provider value={{ transform, setTransform }}>
      {children}
    </TransformContext.Provider>
  );
}
