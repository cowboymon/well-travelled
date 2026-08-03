"use client";

import { useId } from "react";
import { seededRotation } from "@/lib/palette";

export function Stamp({
  id,
  colour,
  initial,
  size = 28,
  dimmed = false,
  className = "",
}: {
  id: string;
  colour: string;
  initial: string;
  size?: number;
  dimmed?: boolean;
  className?: string;
}) {
  const rotation = seededRotation(id);
  const filterId = useId();
  const r = 46; // viewBox is 0-100, stamp radius in local units
  const cx = 50;
  const cy = 50;
  const tickCount = 20;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity: dimmed ? 0.25 : 0.88,
      }}
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={Math.abs(Math.round(rotation * 37)) || 1}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={2.2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {/* outer ring: solid, roughened via SVG filter */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`${colour}1A`}
        stroke={colour}
        strokeWidth={5}
        filter={`url(#${filterId})`}
      />

      {/* ring of tick marks between outer and inner ring */}
      {Array.from({ length: tickCount }).map((_, i) => {
        const angle = (i / tickCount) * Math.PI * 2;
        const inner = r * 0.78;
        const outer = r * 0.86;
        const x1 = cx + inner * Math.cos(angle);
        const y1 = cy + inner * Math.sin(angle);
        const x2 = cx + outer * Math.cos(angle);
        const y2 = cy + outer * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colour}
            strokeOpacity={0.5}
            strokeWidth={2}
          />
        );
      })}

      {/* inner ring: ~40% opacity */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.62}
        fill="none"
        stroke={colour}
        strokeOpacity={0.4}
        strokeWidth={2.5}
      />

      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={34}
        fill={colour}
        transform={`rotate(${-rotation}, ${cx}, ${cy})`}
        className="font-mono-data font-medium select-none"
      >
        {initial}
      </text>
    </svg>
  );
}
