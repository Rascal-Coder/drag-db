"use client";

import { nanoid } from "nanoid";
import { useTheme } from "next-themes";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useEventListener } from "usehooks-ts";
import { ZOOM_EAGERNESS_FACTOR, ZOOM_FACTOR } from "@/constants";
import { Cardinality, Constraint, ObjectType } from "@/enums";
import { getRectFromEndpoints, isSameElement } from "@/lib/utils";
import { useCanvas, useDiagram, useTransform } from "./hooks";
import { useSelect } from "./hooks/use-select";
import Relationship from "./modules/relationship";
import Table, { type FiledData, type TableData } from "./modules/table";

const mockTables = [
  {
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
  },
  {
    id: "VaOSMG72lrWkujgFO6FX-",
    name: "table_VaOSMG72lrWkujgFO6FX-",
    x: -290,
    y: -150,
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
        id: "SRy51ecVa9axZGMagBQhX",
      },
      {
        id: "1SktdmYhgkcBluMlXRhdX",
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
    color: "#ea22bc",
  },
];
const gridSize = 24;
export default function Canvas() {
  const { tables, setTables, updateTable, addRelationship, relationships } =
    useDiagram();
  const { theme } = useTheme();
  const { transform, setTransform } = useTransform();

  const transformRef = useRef(transform);

  const [bulkSelectRect, setBulkSelectRect] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    show: false,
    ctrlKey: false,
    metaKey: false,
  });

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    setTables(mockTables);
  }, [setTables]);

  const [linking, setLinking] = useState(false);
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  const {
    canvas: { viewBox },
    pointer,
  } = useCanvas();

  const canvasRef = useRef<SVGSVGElement>(null);
  const notDragging: {
    id: string;
    type: ObjectType;
    grabOffset: {
      x: number;
      y: number;
    };
  } = {
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

  const [hoveredTable, setHoveredTable] = useState({
    tableId: "",
    fieldId: "",
  });

  const [linkingLine, setLinkingLine] = useState({
    startTableId: "",
    startFieldId: "",
    endTableId: "",
    endFieldId: "",
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const { setSelectedElement, selectedElement } = useSelect();
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
  // 是否对齐网格线
  const snapToGrid = true;
  const coordinatesAfterSnappingToGrid = ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => {
    if (snapToGrid) {
      return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
      };
    }
    return { x, y };
  };
  // this is used to store the element that is clicked on
  // at the moment, and shouldn't be a part of the state
  const elementPointerDown = useRef<null | {
    element: TableData;
    type: ObjectType;
  }>(null);
  const isCtrlLike = (ev: React.PointerEvent<SVGSVGElement>) =>
    ev.ctrlKey || ev.metaKey;

  const buildElementInBulk = (
    element: TableData,
    type: ObjectType
  ): {
    id: string;
    type: number;
    currentCoords: { x: number; y: number };
    initialCoords: { x: number; y: number };
  } => ({
    id: element.id,
    type,
    currentCoords: { x: element.x, y: element.y },
    initialCoords: { x: element.x, y: element.y },
  });

  const beginDragging = (element: TableData, type: ObjectType) => {
    setDragging({
      id: element.id,
      type,
      grabOffset: {
        x: (pointer.spaces.diagram.x ?? 0) - element.x,
        y: (pointer.spaces.diagram.y ?? 0) - element.y,
      },
    });
  };

  const handleCtrlSelection = (
    isSelected: boolean,
    elementInBulk: {
      id: string;
      type: number;
      currentCoords: { x: number; y: number };
      initialCoords: { x: number; y: number };
    }
  ) => {
    if (isSelected) {
      if (bulkSelectedElements.length > 1) {
        setBulkSelectedElements(
          bulkSelectedElements.filter((el) => !isSameElement(el, elementInBulk))
        );
        setSelectedElement({
          ...selectedElement,
          type: ObjectType.NONE,
          id: "",
        });
      }
    } else {
      setBulkSelectedElements([...bulkSelectedElements, elementInBulk]);
    }
    setDragging(notDragging);
  };

  const handlePointerDownOnElement = (
    ev: React.PointerEvent<SVGSVGElement>,
    {
      element,
      type,
    }: {
      element: TableData;
      type: ObjectType;
    }
  ): void => {
    if (!ev.isPrimary) {
      return;
    }
    // 记录被选择元素
    if (!isCtrlLike(ev)) {
      setSelectedElement((prev) => ({
        ...prev,
        type,
        id: element.id,
      }));
    }

    setBulkSelectRect((prev) => ({
      ...prev,
      show: false,
    }));

    const elementInBulk = buildElementInBulk(element, type);
    const isSelected = bulkSelectedElements.some((el) =>
      isSameElement(el, elementInBulk)
    );

    // 按住ctrl就不是在拖拽
    if (isCtrlLike(ev)) {
      handleCtrlSelection(isSelected, elementInBulk);
      return;
    }

    if (!isSelected) {
      setBulkSelectedElements([elementInBulk]);
    }
    beginDragging(element, type);
  };
  const handlePointerDown = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!ev.isPrimary) {
      return;
    }

    const isMouseLeftButton = ev.button === 0;
    const isMouseMiddleButton = ev.button === 1;
    if (isMouseMiddleButton) {
      setPanning({
        isPanning: true,
        panStart: transform.pan,
        // Diagram space depends on the current panning.
        // Use screen space to avoid circular dependencies and undefined behavior.
        cursorStart: pointer.spaces.screen,
      });
      pointer.setStyle("grabbing");
    }
    if (isMouseLeftButton) {
      const clickedElement = elementPointerDown.current;
      elementPointerDown.current = null;

      if (clickedElement !== null) {
        // 点击在元素上，处理元素点击逻辑
        handlePointerDownOnElement(ev, clickedElement);
      } else {
        // 点击在空白区域，显示框选框
        setBulkSelectRect({
          x1: pointer.spaces.diagram.x ?? 0,
          y1: pointer.spaces.diagram.y ?? 0,
          x2: pointer.spaces.diagram.x ?? 0,
          y2: pointer.spaces.diagram.y ?? 0,
          show: true,
          ctrlKey: ev.ctrlKey,
          metaKey: ev.metaKey,
        });
      }
      pointer.setStyle("crosshair");
    }
  };

  const handleDraggingMove = () => {
    if (bulkSelectedElements.length === 0) {
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

    const mainFinal = getMainElementFinalCoords();
    const found = findDraggedElementInBulk();
    if (!found) {
      return;
    }
    const { deltaX, deltaY } = computeDelta(found.currentCoords, mainFinal);
    applyDeltaToBulkSelection(deltaX, deltaY);
  };

  const handlePointerMove = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!ev.isPrimary) {
      return;
    }

    if (panning.isPanning) {
      setTransform((prev) => ({
        ...prev,
        pan: {
          x:
            panning.panStart.x +
            (panning.cursorStart.x - pointer.spaces.screen.x) / transform.zoom,
          y:
            panning.panStart.y +
            (panning.cursorStart.y - pointer.spaces.screen.y) / transform.zoom,
        },
      }));
      return;
    }

    if (linking) {
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x ?? 0,
        endY: pointer.spaces.diagram.y ?? 0,
      });
      return;
    }

    if (isDragging()) {
      handleDraggingMove();
      return;
    }

    if (bulkSelectRect.show) {
      setBulkSelectRect((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x ?? 0,
        y2: pointer.spaces.diagram.y ?? 0,
      }));
    }
  };

  const getCardinality = (startField: FiledData, endField: FiledData) => {
    const startIsUnique = startField.unique || startField.primary;
    const endIsUnique = endField.unique || endField.primary;

    if (startIsUnique && endIsUnique) {
      return Cardinality.ONE_TO_ONE;
    }

    if (startIsUnique && !endIsUnique) {
      return Cardinality.ONE_TO_MANY;
    }

    if (!startIsUnique && endIsUnique) {
      return Cardinality.MANY_TO_ONE;
    }

    return Cardinality.ONE_TO_ONE;
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

    if (bulkSelectRect.show) {
      setBulkSelectRect((prev) => ({
        ...prev,
        x2: pointer.spaces.diagram.x ?? 0,
        y2: pointer.spaces.diagram.y ?? 0,
        show: false,
      }));
    }
    setDragging(notDragging);

    setPanning((old) => ({ ...old, isPanning: false }));
    pointer.setStyle("default");
    if (linking) {
      handleLinking();
    }
    setLinking(false);
  };

  const handleLinking = () => {
    if (!hoveredTable.tableId) {
      return;
    }
    if (!hoveredTable.fieldId) {
      return;
    }
    const startTable = tables.find((t) => t.id === linkingLine.startTableId);
    if (!startTable) {
      return;
    }
    const { fields: startTableFields, name: startTableName } = startTable;
    const startField = startTableFields.find(
      (f) => f.id === linkingLine.startFieldId
    );
    const endTable = tables.find((t) => t.id === hoveredTable.tableId);
    if (!endTable) {
      return;
    }
    const { fields: endTableFields, name: endTableName } = endTable;
    const endField = endTableFields.find((f) => f.id === hoveredTable.fieldId);
    if (
      linkingLine.startTableId === hoveredTable.tableId &&
      linkingLine.startFieldId === hoveredTable.fieldId
    ) {
      return;
    }
    if (startField && endField) {
      const cardinality = getCardinality(startField, endField);
      const newRelationship = {
        ...linkingLine,
        cardinality,
        endTableId: hoveredTable.tableId,
        endFieldId: hoveredTable.fieldId,
        updateConstraint: Constraint.NONE,
        deleteConstraint: Constraint.NONE,
        name: `fk_${startTableName}_${startField.name}_${endTableName}`,
        id: nanoid(),
      };

      const {
        startX: _startX,
        startY: _startY,
        endX: _endX,
        endY: _endY,
        ...cleanedRelationship
      } = newRelationship;

      addRelationship(cleanedRelationship);
    }
  };
  const handleGripField = () => {
    setDragging(notDragging);
    setLinking(true);
  };

  useEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // How "eager" the viewport is to
        // center the cursor's coordinates
        setTransform((prev) => ({
          pan: {
            x:
              prev.pan.x -
              ((pointer.spaces.diagram.x ?? 0) - prev.pan.x) *
                ZOOM_EAGERNESS_FACTOR *
                Math.sign(e.deltaY),
            y:
              prev.pan.y -
              ((pointer.spaces.diagram.y ?? 0) - prev.pan.y) *
                ZOOM_EAGERNESS_FACTOR *
                Math.sign(e.deltaY),
          },
          zoom:
            e.deltaY <= 0 ? prev.zoom * ZOOM_FACTOR : prev.zoom / ZOOM_FACTOR,
        }));
      } else if (e.shiftKey) {
        setTransform((prev) => ({
          ...prev,
          pan: {
            ...prev.pan,
            x: prev.pan.x + e.deltaY / prev.zoom,
          },
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x + e.deltaX / prev.zoom,
            y: prev.pan.y + e.deltaY / prev.zoom,
          },
        }));
      }
    },
    canvasRef as RefObject<SVGSVGElement>,
    { passive: false }
  );
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
              height={gridSize}
              id="grid"
              patternUnits="userSpaceOnUse"
              width={gridSize}
            >
              <path
                d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
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
          {relationships.map((e) => (
            <Relationship data={e} key={e.id} />
          ))}
          {tables.map((table) => (
            <Table
              handleGripField={handleGripField}
              key={table.id}
              onPointerDown={() => {
                elementPointerDown.current = {
                  element: table,
                  type: ObjectType.TABLE,
                };
              }}
              setHoveredTable={setHoveredTable}
              setLinkingLine={setLinkingLine}
              tableData={table}
            />
          ))}
          {linking && (
            <path
              className="pointer-events-none touch-none"
              d={`M ${linkingLine.startX} ${linkingLine.startY} C ${(linkingLine.startX + linkingLine.endX) / 2} ${linkingLine.startY}, ${(linkingLine.startX + linkingLine.endX) / 2} ${linkingLine.endY}, ${linkingLine.endX} ${linkingLine.endY}`}
              fill="none"
              stroke={theme === "dark" ? "#dfe3eb" : "#b1b5be"}
              strokeDasharray="8,8"
            />
          )}
          {bulkSelectRect.show && (
            <rect
              {...getRectFromEndpoints(bulkSelectRect)}
              fill="#3B82F6"
              fillOpacity={0.2}
              stroke="#2563EB"
              strokeWidth={2}
            />
          )}
        </svg>
      </div>
    </div>
  );
}
