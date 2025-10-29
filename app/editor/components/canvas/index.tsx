"use client";

import { useRef, useState } from "react";
import { useCanvas } from "./hooks";
import Table, { type TableData } from "./modules/table";

const ObjectType = {
  NONE: 0,
  TABLE: 1,
  AREA: 2,
  NOTE: 3,
  RELATIONSHIP: 4,
  TYPE: 5,
};
const mockTableData = {
  id: "VaOSMG72lrWkujgFO6FB-",
  name: "table_VaOSMG72lrWkujgFO6FB-",
  x: 0,
  y: 0,
  locked: false,
  fields: [
    {
      name: "id",
      type: "INTEGER",
      default: "",
      check: "",
      primary: true,
      unique: true,
      notNull: true,
      increment: true,
      comment: "",
      id: "SRy51ecVa9axZGMagBQhE",
    },
    {
      id: "1SktdmYhgkcBluMlXRhdS",
      name: "title",
      type: "VARCHAR",
      default: "test title",
      check: "",
      primary: false,
      unique: false,
      notNull: false,
      increment: false,
      comment: "",
      size: 255,
    },
  ],
  color: "#155dfc",
};
const isSameElement = (
  el1: {
    id: string;
    type: number;
  },
  el2: {
    id: string;
    type: number;
  }
) => el1.id === el2.id && el1.type === el2.type;
export default function Canvas() {
  const [tables, setTables] = useState([mockTableData]);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;
  const canvasRef = useRef<SVGSVGElement>(null);
  const notDragging = {
    id: "",
    type: ObjectType.NONE,
    grabOffset: { x: 0, y: 0 }, //抓取偏移量
  };
  const [dragging, setDragging] = useState(notDragging);

  const isDragging = () => dragging.type !== ObjectType.NONE && dragging.id;
  const didDrag = () => {
    if (!isDragging()) {
      return false;
    }
    if (bulkSelectedElements.length === 0) {
      return false;
    }
    // checking any element is sufficient
    const { currentCoords, initialCoords } = bulkSelectedElements[0];
    return (
      currentCoords.x !== initialCoords.x || currentCoords.y !== initialCoords.y
    );
  };
  const [_, setSelectedElement] = useState({
    id: "",
    type: ObjectType.NONE,
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
  const coordinatesAfterSnappingToGrid = ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => ({ x, y });
  // this is used to store the element that is clicked on
  // at the moment, and shouldn't be a part of the state
  const elementPointerDown = useRef<null | {
    element: TableData;
    type: number;
  }>(null);
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
  const handlePointerDownOnElement = (
    ev: React.PointerEvent<SVGSVGElement>,
    {
      element,
      type,
    }: {
      element: TableData;
      type: number;
    }
  ): void => {
    if (!ev.isPrimary) {
      return;
    }
    // 记录被选择元素
    if (!(ev.ctrlKey || ev.metaKey)) {
      setSelectedElement((prev) => ({
        ...prev,
        type,
        id: element.id,
      }));
    }
    // 按住ctrl就不是在拖拽
    if (ev.ctrlKey || ev.metaKey) {
      setDragging(notDragging);
      return;
    }

    const elementInBulk = {
      id: element.id,
      type,
      currentCoords: { x: element.x, y: element.y },
      initialCoords: { x: element.x, y: element.y },
    };
    const isSelected = bulkSelectedElements.some((el) =>
      isSameElement(el, elementInBulk)
    );
    if (!isSelected) {
      setBulkSelectedElements([elementInBulk]);
    }
    setDragging({
      id: element.id,
      type,
      grabOffset: {
        x: (pointer.spaces.diagram.x ?? 0) - element.x,
        y: (pointer.spaces.diagram.y ?? 0) - element.y,
      },
    });
  };
  const handlePointerDown = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!ev.isPrimary) {
      return;
    }
    const isMouseLeftButton = ev.button === 0;
    // const isMouseMiddleButton = event.button === 1;
    if (isMouseLeftButton && elementPointerDown.current !== null) {
      handlePointerDownOnElement(ev, elementPointerDown.current);
    }
    // Reset the pointer-down element when clicking outside tables or after handling
    // to avoid keeping a stale reference across clicks.
    if (isMouseLeftButton) {
      elementPointerDown.current = null;
    }
  };
  const handlePointerMove = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!ev.isPrimary) {
      return;
    }

    if (!isDragging()) {
      return;
    }

    const getMainElementFinalCoords = () =>
      coordinatesAfterSnappingToGrid({
        x: (pointer.spaces.diagram.x ?? 0) - dragging.grabOffset.x,
        y: (pointer.spaces.diagram.y ?? 0) - dragging.grabOffset.y,
      });

    const findDraggedElementInBulk = () =>
      bulkSelectedElements.find((el) => isSameElement(el, dragging));

    const computeDelta = (
      current: { x: number; y: number },
      target: { x: number; y: number }
    ) => ({
      deltaX: target.x - current.x,
      deltaY: target.y - current.y,
    });

    const applyDeltaToBulkSelection = (dx: number, dy: number) => {
      const updated: typeof bulkSelectedElements = [];
      for (const el of bulkSelectedElements) {
        const elementFinalCoords = {
          x: el.currentCoords.x + dx,
          y: el.currentCoords.y + dy,
        };
        if (el.type === ObjectType.TABLE) {
          updateTable(el.id, { ...elementFinalCoords });
        }
        updated.push({ ...el, currentCoords: elementFinalCoords });
      }
      setBulkSelectedElements(updated);
    };

    if (bulkSelectedElements.length === 0) {
      return;
    }

    const mainFinal = getMainElementFinalCoords();
    const found = findDraggedElementInBulk();
    if (!found) {
      return;
    }
    const { deltaX, deltaY } = computeDelta(found.currentCoords, mainFinal);
    applyDeltaToBulkSelection(deltaX, deltaY);
    return;
  };

  const handlePointerUp = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!ev.isPrimary) {
      return;
    }
    if (didDrag()) {
      setBulkSelectedElements((prev) =>
        prev.map((el) => ({
          ...el,
          initialCoords: { ...el.currentCoords },
        }))
      );
    }
    setDragging(notDragging);
  };
  return (
    <div className="h-full grow touch-none" id="svg-container">
      <div
        className="h-full w-full"
        style={{
          cursor: pointer.style,
        }}
      >
        <svg
          aria-label="Diagram"
          className="absolute h-full w-full touch-none"
          id="diagram"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={canvasRef}
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
        >
          <title>Diagram</title>
          <defs>
            <pattern
              height={24}
              id="grid"
              patternUnits="userSpaceOnUse"
              width={24}
            >
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            fill="url(#grid)"
            height={viewBox.height}
            width={viewBox.width}
            x={viewBox.left}
            y={viewBox.top}
          />
          {tables.map((table) => (
            <Table
              key={table.id}
              onPointerDown={() => {
                elementPointerDown.current = {
                  element: table,
                  type: ObjectType.TABLE,
                };
              }}
              tableData={table}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
