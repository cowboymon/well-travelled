"use client";

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
  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 font-mono-data font-medium transition-opacity duration-150 ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: colour,
        color: colour,
        transform: `rotate(${rotation}deg)`,
        opacity: dimmed ? 0.25 : 0.88,
        fontSize: Math.max(9, size * 0.36),
        background: `${colour}1A`,
      }}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: "68%",
          height: "68%",
          border: `1px solid ${colour}66`,
        }}
      >
        {initial}
      </span>
    </div>
  );
}
