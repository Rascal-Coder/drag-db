"use client";

import {
  EditIcon,
  KeyRound,
  LockIcon,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatTypeSize, getTypeColor, getTypeDef } from "@/lib/utils";

export type TableData = {
  id: string;
  name: string;
  x: number;
  y: number;
  locked: boolean;
  color: string;
  fields: {
    name: string;
    type: string;
    default: string;
    check: string;
    primary: boolean;
    unique: boolean;
    notNull: boolean;
    increment: boolean;
    comment: string;
    id: string;
    size?: number;
    precision?: number;
  }[];
};

export default function Table({
  onPointerDown,
  tableData,
}: {
  onPointerDown: () => void;
  tableData: TableData;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredField, setHoveredField] = useState<null | number>(null);
  const lockUnlockTable = () => {
    return;
  };
  const openEditor = () => {
    setOpen(true);
  };

  // const mockFields: ReadonlyArray<{
  //   name: string;
  //   type: string;
  //   size?: number;
  //   precision?: number;
  //   primary?: boolean;
  //   notNull?: boolean;
  // }> = [
  //   { name: "id", type: "INTEGER", primary: true, notNull: true },
  //   { name: "title", type: "VARCHAR", size: 255, notNull: false },
  //   { name: "price", type: "DECIMAL", size: 10, precision: 2, notNull: true },
  //   { name: "is_active", type: "BOOLEAN", notNull: true },
  //   { name: "created_at", type: "DATETIME", notNull: true },
  //   { name: "meta", type: "JSON", notNull: true },
  // ];
  const tableFieldHeight = 36;
  const tableHeaderHeight = 50;
  const tableColorStripHeight = 7;

  const height =
    tableData.fields.length * tableFieldHeight +
    tableHeaderHeight +
    tableColorStripHeight;

  return (
    <foreignObject
      className="group cursor-move rounded-md drop-shadow-lg"
      height={height}
      key={tableData.id}
      onPointerDown={onPointerDown}
      width={220}
      x={tableData.x}
      y={tableData.y}
    >
      <div
        className={
          "w-full select-none rounded-lg border-2 border-zinc-300 bg-accent text-zinc-800 hover:border-primary hover:border-dashed dark:border-zinc-600 dark:text-zinc-200"
        }
        style={{ direction: "ltr" }}
      >
        <div
          className="h-[10px] w-full rounded-t-md"
          style={{
            backgroundColor: tableData.color,
          }}
        />
        <div
          className={
            "flex h-[40px] items-center justify-between overflow-hidden border-gray-400 border-b bg-zinc-200 font-bold dark:bg-zinc-900"
          }
        >
          <div className="overflow-hidden text-ellipsis whitespace-nowrap px-3">
            {tableData.name}
          </div>
          <div className="hidden group-hover:block">
            <div className="mx-2 flex items-center justify-end space-x-1.5">
              <Button onClick={lockUnlockTable} size="icon-sm">
                <LockIcon />
              </Button>
              <Button onClick={openEditor} size="icon-sm">
                <EditIcon />
              </Button>
              <Dialog onOpenChange={setOpen} open={open}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#808080b3] text-white hover:bg-[#606060b3]"
                    size="icon-sm"
                  >
                    <MoreHorizontal />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>表属性</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm">
                    <div className="mb-2 flex gap-1">
                      <strong>注释:</strong>
                      <div>未设置</div>
                    </div>
                    <div className="mb-2 flex gap-1">
                      <strong>索引:</strong>
                      <div>未设置</div>
                    </div>
                    <Button className="w-full" variant="destructive">
                      <Trash />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        {tableData.fields.map((field, index) => {
          const typeDef = getTypeDef(field.type);
          const typeColor = getTypeColor(typeDef);
          const sizeText = formatTypeSize(typeDef, field.size, field.precision);
          return (
            <div
              className={cn(
                "group flex h-[36px] w-full items-center justify-between gap-1 overflow-hidden px-2 py-1",
                "border-gray-400 border-b",
                index === tableData.fields.length - 1 &&
                  "rounded-b-md border-0",
                // "bg-(--db-table-bg)",
                // hoveredField === index && "text-zinc-400"
                hoveredField === index
                  ? "bg-blue-50 text-zinc-400 dark:bg-(--db-table-bg)/80" // ← Hover 背景变化
                  : "bg-(--db-table-bg)"
              )}
              key={field.name}
              onPointerDown={(e) => {
                // Required for onPointerLeave to trigger when a touch pointer leaves
                // https://stackoverflow.com/a/70976017/1137077
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerEnter={(e) => {
                if (!e.isPrimary) {
                  return;
                }

                setHoveredField(index);
              }}
              onPointerLeave={() => {
                setHoveredField(null);
              }}
            >
              <div className={cn("flex items-center gap-2 overflow-hidden")}>
                <div className="h-[10px] w-[10px] shrink-0 rounded-full border-2 border-transparent bg-[#2f68adcc] transition-all hover:cursor-crosshair hover:border-[#2f68adcc] hover:bg-transparent" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {field.name}
                </span>
              </div>
              <div>
                {hoveredField === index ? (
                  <Button size="icon-sm" variant="destructive">
                    <Trash />
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    {field.primary && <KeyRound size={16} />}
                    {!field.notNull && <span className="font-mono">?</span>}
                    <span
                      className={`font-mono ${typeColor}`}
                    >{`${field.type}${sizeText}`}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </foreignObject>
  );
}
