"use client";

import { useId, useMemo } from "react";
import { seededPick, seededRotation } from "@/lib/palette";
import { COUNTRY_BY_ALPHA3, countryName } from "@/lib/countries";

const OXBLOOD = "#7A2E2E";

const SHAPES = ["circle", "hexagon", "octagon", "roundedRect", "oval"] as const;
type Shape = (typeof SHAPES)[number];

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/** Formats an ISO date string (e.g. `2025-11-18`) as a visa-stamp date, e.g. `18 NOV 2025`. */
function formatVisaDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/** Builds the SVG points/attrs for a regular polygon centred at (cx, cy). */
function polygonPoints(cx: number, cy: number, r: number, sides: number, startAngle = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = ((startAngle + (360 / sides) * i) * Math.PI) / 180;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

/**
 * Generative "visa stamp" for a visited country — distinct from the
 * host-pin `Stamp.tsx` (double-ring circle only, used on the map/entry
 * panel). Always renders in oxblood ink only; never a host colour. Shape,
 * rotation, and roughness seed are all deterministic from `id` so the same
 * entry always renders the same stamp.
 */
export function PassportStamp({
  id,
  countryCode,
  date,
  size = 96,
  className = "",
}: {
  id: string;
  countryCode: string;
  date: string;
  size?: number;
  className?: string;
}) {
  const rotation = seededRotation(id);
  const shape = seededPick<Shape>(id, SHAPES);
  const filterId = useId();
  const cx = 50;
  const cy = 50;
  const r = 44;

  const continent = COUNTRY_BY_ALPHA3.get(countryCode)?.continent ?? "";
  const name = countryName(countryCode).toUpperCase();
  const visaDate = useMemo(() => formatVisaDate(date), [date]);
  const seed = Math.abs(Math.round(rotation * 37)) || 1;

  const shapeProps = useMemo(() => {
    switch (shape) {
      case "hexagon":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r, 6) };
      case "octagon":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r, 8, -90 + 22.5) };
      case "roundedRect":
        return {
          el: "rect" as const,
          x: cx - r,
          y: cy - r * 0.68,
          width: r * 2,
          height: r * 1.36,
          rx: 10,
        };
      case "oval":
        return { el: "ellipse" as const, cx, cy, rx: r, ry: r * 0.62 };
      case "circle":
      default:
        return { el: "circle" as const, cx, cy, r };
    }
  }, [shape, cx, cy, r]);

  const innerScale = 0.62;
  const innerProps = useMemo(() => {
    switch (shape) {
      case "hexagon":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r * innerScale, 6) };
      case "octagon":
        return {
          el: "polygon" as const,
          points: polygonPoints(cx, cy, r * innerScale, 8, -90 + 22.5),
        };
      case "roundedRect":
        return {
          el: "rect" as const,
          x: cx - r * innerScale,
          y: cy - r * 0.68 * innerScale,
          width: r * 2 * innerScale,
          height: r * 1.36 * innerScale,
          rx: 7,
        };
      case "oval":
        return { el: "ellipse" as const, cx, cy, rx: r * innerScale, ry: r * 0.62 * innerScale };
      case "circle":
      default:
        return { el: "circle" as const, cx, cy, r: r * innerScale };
    }
  }, [shape, cx, cy, r]);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={seed}
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

      {/* outer border: solid oxblood, roughened via SVG filter */}
      <ShapeEl
        {...shapeProps}
        fill={`${OXBLOOD}1A`}
        stroke={OXBLOOD}
        strokeWidth={4}
        filter={`url(#${filterId})`}
      />

      {/* inner border: ~40% opacity */}
      <ShapeEl {...innerProps} fill="none" stroke={OXBLOOD} strokeOpacity={0.4} strokeWidth={2} />

      <g transform={`rotate(${-rotation}, ${cx}, ${cy})`}>
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill={OXBLOOD}
          className="font-display select-none"
          style={{ fontSize: 11, letterSpacing: "0.05em" }}
        >
          {name.length > 16 ? `${name.slice(0, 15)}…` : name}
        </text>

        {continent && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            dominantBaseline="central"
            fill={OXBLOOD}
            fillOpacity={0.75}
            className="font-mono-data uppercase select-none"
            style={{ fontSize: 6, letterSpacing: "0.14em" }}
          >
            {continent}
          </text>
        )}

        {/* tick divider */}
        <line
          x1={cx - 8}
          y1={cy + 13}
          x2={cx + 8}
          y2={cy + 13}
          stroke={OXBLOOD}
          strokeOpacity={0.5}
          strokeWidth={1}
        />

        <text
          x={cx}
          y={cy + 21}
          textAnchor="middle"
          dominantBaseline="central"
          fill={OXBLOOD}
          className="font-mono-data uppercase select-none"
          style={{ fontSize: 6.5, letterSpacing: "0.1em" }}
        >
          {visaDate}
        </text>
      </g>
    </svg>
  );
}

type ShapeElProps =
  | ({ el: "circle" } & React.SVGProps<SVGCircleElement>)
  | ({ el: "ellipse" } & React.SVGProps<SVGEllipseElement>)
  | ({ el: "polygon" } & React.SVGProps<SVGPolygonElement>)
  | ({ el: "rect" } & React.SVGProps<SVGRectElement>);

function ShapeEl(props: ShapeElProps) {
  const { el, ...rest } = props;
  switch (el) {
    case "circle":
      return <circle {...(rest as React.SVGProps<SVGCircleElement>)} />;
    case "ellipse":
      return <ellipse {...(rest as React.SVGProps<SVGEllipseElement>)} />;
    case "polygon":
      return <polygon {...(rest as React.SVGProps<SVGPolygonElement>)} />;
    case "rect":
      return <rect {...(rest as React.SVGProps<SVGRectElement>)} />;
  }
}
