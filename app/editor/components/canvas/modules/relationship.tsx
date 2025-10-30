import { useMemo } from "react";
import { DEFAULT_TABLE_WIDTH } from "@/constants";
import { calcPath } from "@/lib/utils";
import type { RelationshipData } from "../context/diagram-context";
import { useDiagram } from "../hooks";

export default function Relationship({ data }: { data: RelationshipData }) {
  const { tables } = useDiagram();
  const pathValues = useMemo(() => {
    const startTable = tables.find((t) => t.id === data.startTableId);
    const endTable = tables.find((t) => t.id === data.endTableId);

    if (!(startTable && endTable)) {
      return;
    }

    return {
      startFieldIndex: startTable.fields.findIndex(
        (f) => f.id === data.startFieldId
      ),
      endFieldIndex: endTable.fields.findIndex((f) => f.id === data.endFieldId),
      startTable: { x: startTable.x, y: startTable.y },
      endTable: { x: endTable.x, y: endTable.y },
    };
  }, [tables, data]);
  return (
    <g className="group select-none">
      <path
        cursor="pointer"
        d={calcPath(pathValues, DEFAULT_TABLE_WIDTH)}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
      />
      <path
        className="relationship-path"
        cursor="pointer"
        d={calcPath(pathValues, DEFAULT_TABLE_WIDTH)}
        fill="none"
        filter="url(#rel-shadow)"
      />
      <filter height="140%" id="rel-shadow" width="140%" x="-20%" y="-20%">
        <feDropShadow
          dx="0"
          dy="3"
          floodColor="#000"
          floodOpacity="0.35"
          stdDeviation="2.5"
        />
      </filter>
    </g>
  );
}
