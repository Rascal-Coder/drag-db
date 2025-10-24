"use client";
import { useRef } from "react";

export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
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
          className="absolute h-full w-full touch-none"
          id="diagram"
          // onPointerDown={handlePointerDown}
          // onPointerMove={handlePointerMove}
          // onPointerUp={handlePointerUp}
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
        </svg>
      </div>
    </div>
  );
}
