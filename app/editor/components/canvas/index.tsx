"use client";

import { nanoid } from "nanoid";
import { useTheme } from "next-themes";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useEventListener } from "usehooks-ts";
import {
  DEFAULT_TABLE_WIDTH,
  ZOOM_EAGERNESS_FACTOR,
  ZOOM_FACTOR,
} from "@/constants";
import { Cardinality, Constraint, ObjectType } from "@/enums";
import {
  getRectFromEndpoints,
  getTableHeight,
  isInsideRect,
  isSameElement,
} from "@/lib/utils";
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

const BULK_SELECTION_FRAME_OFFSET = 8; // 包裹框距离表格的偏移量（px）
const BULK_SELECTION_FRAME_STROKE_WIDTH = 1; // 包裹框线条宽度（px）
const BULK_SELECTION_FRAME_RADIUS = 12; // 包裹框圆角（px）

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
  const {
    setSelectedElement,
    selectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();
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

  // 提取左键点击逻辑以降低复杂度
  const handleLeftButtonDown = (ev: React.PointerEvent<SVGSVGElement>) => {
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
      // 如果不是 Ctrl/Cmd 点击，清空选择状态
      if (!isCtrlLike(ev)) {
        setSelectedElement({
          type: ObjectType.NONE,
          id: "",
        });
        setBulkSelectedElements([]);
      }
    }
    pointer.setStyle("crosshair");
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
      handleLeftButtonDown(ev);
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

  const collectSelectedElements = () => {
    const rect = getRectFromEndpoints(bulkSelectRect);
    const elements: typeof bulkSelectedElements = [];
    const shouldAddElement = (
      elementRect: { x: number; y: number; width: number; height: number },
      element: {
        id: string;
        type: ObjectType;
        currentCoords: { x: number; y: number };
        initialCoords: { x: number; y: number };
      }
    ) => {
      // if ctrl key is pressed, only add the elements that are not already selected
      // can theoretically be optimized later if the selected elements is
      // a map from id to element (after the ids are made unique)
      return (
        isInsideRect(elementRect, rect) &&
        !(
          (bulkSelectRect.ctrlKey || bulkSelectRect.metaKey) &&
          bulkSelectedElements.some((el) => isSameElement(el, element))
        )
      );
    };

    for (const table of tables) {
      const element = {
        id: table.id,
        type: ObjectType.TABLE,
        currentCoords: { x: table.x, y: table.y },
        initialCoords: { x: table.x, y: table.y },
      };
      const tableRect = {
        x: table.x,
        y: table.y,
        width: DEFAULT_TABLE_WIDTH,
        height: getTableHeight(table),
      };
      if (shouldAddElement(tableRect, element)) {
        elements.push(element);
      }
    }

    if (bulkSelectRect.ctrlKey || bulkSelectRect.metaKey) {
      setBulkSelectedElements([...bulkSelectedElements, ...elements]);
    } else {
      setBulkSelectedElements(elements);
    }
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
      if (!isDragging()) {
        collectSelectedElements();
      }
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

  // 计算批量选中元素的包裹框边界
  const calculateBulkSelectionBounds = () => {
    if (bulkSelectedElements.length === 0) {
      return null;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const element of bulkSelectedElements) {
      if (element.type === ObjectType.TABLE) {
        const table = tables.find((t) => t.id === element.id);
        if (table) {
          const tableHeight = getTableHeight(table);
          minX = Math.min(minX, table.x);
          minY = Math.min(minY, table.y);
          maxX = Math.max(maxX, table.x + DEFAULT_TABLE_WIDTH);
          maxY = Math.max(maxY, table.y + tableHeight);
        }
      }
    }

    if (minX === Number.POSITIVE_INFINITY) {
      return null;
    }

    return {
      x: minX - BULK_SELECTION_FRAME_OFFSET,
      y: minY - BULK_SELECTION_FRAME_OFFSET,
      width: maxX - minX + BULK_SELECTION_FRAME_OFFSET * 2,
      height: maxY - minY + BULK_SELECTION_FRAME_OFFSET * 2,
    };
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
            {/* 批量选中包裹框阴影效果 */}
            <filter
              height="200%"
              id="bulk-selection-shadow"
              width="200%"
              x="-50%"
              y="-50%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                floodColor={theme === "dark" ? "#6366f1" : "#3B82F6"}
                floodOpacity="0.6"
                stdDeviation="8"
              />
            </filter>
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
          {/* 批量选中元素的整体包裹框（仅在选中多个表格时显示） */}
          {bulkSelectedElements.length > 1 &&
            !bulkSelectRect.show &&
            (() => {
              const bounds = calculateBulkSelectionBounds();
              if (!bounds) {
                return null;
              }
              return (
                <rect
                  className="pointer-events-none"
                  fill="none"
                  filter="url(#bulk-selection-shadow)"
                  height={bounds.height}
                  rx={BULK_SELECTION_FRAME_RADIUS}
                  ry={BULK_SELECTION_FRAME_RADIUS}
                  stroke={theme === "dark" ? "#6366f1" : "#3B82F6"}
                  strokeWidth={BULK_SELECTION_FRAME_STROKE_WIDTH}
                  width={bounds.width}
                  x={bounds.x}
                  y={bounds.y}
                />
              );
            })()}
        </svg>
      </div>
    </div>
  );
}
