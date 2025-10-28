"use client";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEventListener, useResizeObserver } from "usehooks-ts";
import { useTransform } from "../hooks";

type Coord = { x?: number; y?: number };

type CanvasContextValue = {
  canvas: {
    screenSize: { x: number; y: number };
    viewBox: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  };
  coords: {
    toDiagramSpace: (coords: Coord) => Coord;
    toScreenSpace: (coords: Coord) => Coord;
  };
  pointer: {
    spaces: {
      screen: { x: number; y: number };
      diagram: { x?: number; y?: number };
    };
    style: string;
    setStyle: (style: string) => void;
  };
};

export const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasContextProvider({
  children,
  ...attrs
}: {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const transformContext = useTransform();

  if (!transformContext) {
    throw new Error(
      "CanvasContextProvider must be used within TransformContextProvider"
    );
  }

  const { transform } = transformContext;
  const canvasSize = useResizeObserver({
    ref: canvasWrapRef as React.RefObject<HTMLElement>,
    box: "content-box",
  });
  const screenSize = useMemo(
    () => ({
      x: canvasSize.width ?? 0,
      y: canvasSize.height ?? 0,
    }),
    [canvasSize.height, canvasSize.width]
  );
  const viewBoxSize = useMemo(
    () => ({
      x: screenSize.x / transform.zoom,
      y: screenSize.y / transform.zoom,
    }),
    [screenSize.x, screenSize.y, transform.zoom]
  );
  // const viewBox = useMemo(
  //   () =>
  //     new DOMRect(
  //       transform.pan.x - viewBoxSize.x / 2,
  //       transform.pan.y - viewBoxSize.y / 2,
  //       viewBoxSize.x,
  //       viewBoxSize.y
  //     ),
  //   [transform.pan.x, transform.pan.y, viewBoxSize.x, viewBoxSize.y]
  // );

  const viewBox = useMemo(
    () => ({
      left: transform.pan.x - viewBoxSize.x / 2,
      top: transform.pan.y - viewBoxSize.y / 2,
      width: viewBoxSize.x,
      height: viewBoxSize.y,
    }),
    [transform.pan.x, transform.pan.y, viewBoxSize.x, viewBoxSize.y]
  );

  const toDiagramSpace = useCallback(
    (coord: Coord) => ({
      x:
        typeof coord.x === "number"
          ? (coord.x / screenSize.x) * viewBox.width + viewBox.left
          : undefined,
      y:
        typeof coord.y === "number"
          ? (coord.y / screenSize.y) * viewBox.height + viewBox.top
          : undefined,
    }),
    [
      screenSize.x,
      screenSize.y,
      viewBox.height,
      viewBox.left,
      viewBox.top,
      viewBox.width,
    ]
  );

  const toScreenSpace = useCallback(
    (coord: Coord) => ({
      x:
        typeof coord.x === "number"
          ? ((coord.x - viewBox.left) / viewBox.width) * screenSize.x
          : undefined,
      y:
        typeof coord.y === "number"
          ? ((coord.y - viewBox.top) / viewBox.height) * screenSize.y
          : undefined,
    }),
    [
      screenSize.x,
      screenSize.y,
      viewBox.height,
      viewBox.left,
      viewBox.top,
      viewBox.width,
    ]
  );

  const [pointerScreenCoords, setPointerScreenCoords] = useState({
    x: 0,
    y: 0,
  });
  const pointerDiagramCoords = useMemo(
    () => toDiagramSpace(pointerScreenCoords),
    [pointerScreenCoords, toDiagramSpace]
  );
  const [pointerStyle, setPointerStyle] = useState("default");

  function detectPointerMovement(e: globalThis.PointerEvent) {
    const targetElm = e.currentTarget;
    if (!(e.isPrimary && targetElm && targetElm instanceof HTMLDivElement)) {
      return;
    }

    const canvasBounds = targetElm.getBoundingClientRect();

    setPointerScreenCoords({
      x: e.clientX - canvasBounds.left,
      y: e.clientY - canvasBounds.top,
    });
  }

  // Important for touch screen devices!
  useEventListener(
    "pointerdown",
    detectPointerMovement,
    canvasWrapRef as React.RefObject<HTMLElement>
  );

  useEventListener(
    "pointermove",
    detectPointerMovement,
    canvasWrapRef as React.RefObject<HTMLElement>
  );

  const contextValue = {
    canvas: {
      screenSize,
      viewBox,
    },
    coords: {
      toDiagramSpace,
      toScreenSpace,
    },
    pointer: {
      spaces: {
        screen: pointerScreenCoords,
        diagram: pointerDiagramCoords,
      },
      style: pointerStyle,
      setStyle: setPointerStyle,
    },
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      <div {...attrs} ref={canvasWrapRef}>
        {children}
      </div>
    </CanvasContext.Provider>
  );
}
