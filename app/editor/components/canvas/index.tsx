"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

const NoSSRTable = dynamic(() => import("./modules/table"), { ssr: false });
export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // 移除 title 元素以禁用 tooltip
    const titleElement = svgRef.current?.querySelector("title");
    if (titleElement) {
      titleElement.remove();
    }
  }, []);
  // const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
  //   console.log("pointer down", event);
  // };
  // const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
  //   console.log("pointer move", event);
  // };
  // const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
  //   console.log("pointer up", event);
  // };
  return (
    <div className="h-full grow touch-none" id="svg-container">
      <div className="h-full w-full">
        <svg
          aria-label="Diagram"
          className="absolute h-full w-full touch-none"
          // onPointerDown={handlePointerDown}
          // onPointerMove={handlePointerMove}
          // onPointerUp={handlePointerUp}
          id="diagram"
          ref={svgRef}
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
          <rect fill="url(#grid)" height="100%" width="100%" />
          <NoSSRTable />
        </svg>
      </div>
    </div>
  );
}
