"use client";

import { useId, useMemo } from "react";
import {
  STAMP_INK_PALETTE,
  seededPick,
  seededRotationRange,
  seededStampCode,
} from "@/lib/palette";
import { COUNTRY_BY_ALPHA3, countryName } from "@/lib/countries";

const SHAPES = [
  "circle",
  "hexagon",
  "octagon",
  "roundedRect",
  "oval",
  "triangle",
  "diamond",
  "scallop",
] as const;
type Shape = (typeof SHAPES)[number];

const ICONS = ["plane", "ship", "train", "star"] as const;
type Icon = (typeof ICONS)[number];

const LABELS = ["ARRIVAL", "VISITED"] as const;

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

/** Builds a scalloped/gear-edge ring — a circle whose radius wobbles in a
 * repeating small-amplitude wave, read at a glance as "perforated" rather
 * than a precise involute gear. */
function scallopPoints(cx: number, cy: number, r: number, teeth: number, amplitude: number): string {
  const pts: string[] = [];
  const steps = teeth * 4; // enough points per tooth to read as a smooth wave
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble = Math.sin(angle * teeth) * amplitude;
    const x = cx + (r + wobble) * Math.cos(angle - Math.PI / 2);
    const y = cy + (r + wobble) * Math.sin(angle - Math.PI / 2);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Small hand-built transit-icon silhouettes, kept to a handful of shapes
 * each so they still read at ~28-44px. Drawn in a local 0-20 box, centred
 * at (10, 10), then positioned by the caller. */
function IconGlyph({ icon, colour, opacity = 0.85 }: { icon: Icon; colour: string; opacity?: number }) {
  switch (icon) {
    case "plane":
      return (
        <path
          d="M10 1 L11.6 7.5 L18.5 11 L18.5 12.6 L11.6 10.6 L11.1 15.5 L13.5 17.3 L13.5 18.6 L10 17.6 L6.5 18.6 L6.5 17.3 L8.9 15.5 L8.4 10.6 L1.5 12.6 L1.5 11 L8.4 7.5 Z"
          fill={colour}
          fillOpacity={opacity}
        />
      );
    case "ship":
      return (
        <path
          d="M10 1 L10 11 M6 4 L10 4 L10 1 M2.5 13 L17.5 13 L15 18 L5 18 Z M10 11 L14.5 13 M10 11 L5.5 13"
          fill="none"
          stroke={colour}
          strokeOpacity={opacity}
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "train":
      return (
        <g fill="none" stroke={colour} strokeOpacity={opacity} strokeWidth={1.3} strokeLinejoin="round">
          <rect x="3" y="2" width="14" height="12" rx="2" />
          <line x1="3" y1="8" x2="17" y2="8" />
          <line x1="7" y1="8" x2="7" y2="12" />
          <line x1="13" y1="8" x2="13" y2="12" />
          <circle cx="6" cy="17" r="1.4" fill={colour} stroke="none" />
          <circle cx="14" cy="17" r="1.4" fill={colour} stroke="none" />
        </g>
      );
    case "star":
    default:
      return <path d={polygonToPath(starPoints(10, 10, 8.5, 3.4, 5))} fill={colour} fillOpacity={opacity} />;
  }
}

function polygonToPath(points: string): string {
  return `M${points.replace(/ /g, " L")} Z`;
}

function starPoints(cx: number, cy: number, rOuter: number, rInner: number, spikes: number): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/**
 * Generative "visa/customs stamp" for a visited country — distinct from the
 * host-pin `Stamp.tsx` (double-ring circle only, used on the map/entry
 * panel). This is an INTENTIONAL, EXPLICIT exception to the rest of the
 * app's oxblood-only/restrained palette: see design.md's "Passport stamps"
 * section. Colour, shape, rotation, icon, and reference code are all
 * deterministic from `id` so the same entry always renders the same stamp.
 */
export function PassportStamp({
  id,
  countryCode,
  date,
  size = 96,
  detail,
  className = "",
}: {
  id: string;
  countryCode: string;
  date: string;
  size?: number;
  /** "full" shows the reference-code corners + icon glyph; "simple" is a
   * cleaner reduced layout for small sizes (e.g. the login watermark).
   * Defaults to a threshold on `size` when omitted. */
  detail?: "full" | "simple";
  className?: string;
}) {
  const isFull = detail ? detail === "full" : size >= 60;
  const rotation = seededRotationRange(id, 17);
  const shape = seededPick<Shape>(id, SHAPES);
  const ink = seededPick(id, STAMP_INK_PALETTE).hex;
  const icon = seededPick<Icon>(`${id}-icon`, ICONS);
  const label = seededPick(`${id}-label`, LABELS);
  const code = useMemo(() => seededStampCode(id), [id]);
  const filterId = useId();
  const arcId = useId();
  const cx = 50;
  const cy = 50;
  const r = 44;

  const name = countryName(countryCode).toUpperCase();
  const continent = COUNTRY_BY_ALPHA3.get(countryCode)?.continent ?? "";
  const visaDate = useMemo(() => formatVisaDate(date), [date]);
  const seed = Math.abs(Math.round(rotation * 37)) || 1;

  // Circle/scallop shapes get an arced country name along the top of the
  // ring (nice-to-have from the reference sheets); everything else falls
  // back to a straight centred line.
  const canArc = isFull && (shape === "circle" || shape === "scallop");

  const shapeProps = useMemo(() => {
    switch (shape) {
      case "hexagon":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r, 6) };
      case "octagon":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r, 8, -90 + 22.5) };
      case "triangle":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r * 1.05, 3) };
      case "diamond":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r, 4) };
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
      case "scallop":
        return { el: "polygon" as const, points: scallopPoints(cx, cy, r, 14, 2.6) };
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
      case "triangle":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r * 1.05 * innerScale, 3) };
      case "diamond":
        return { el: "polygon" as const, points: polygonPoints(cx, cy, r * innerScale, 4) };
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
      case "scallop":
        return { el: "circle" as const, cx, cy, r: r * innerScale };
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
        {canArc && (
          <path id={arcId} d={`M ${cx - r * 0.78} ${cy} A ${r * 0.78} ${r * 0.78} 0 1 1 ${cx + r * 0.78} ${cy}`} fill="none" />
        )}
      </defs>

      {/* outer border: solid ink colour, roughened via SVG filter */}
      <ShapeEl
        {...shapeProps}
        fill={`${ink}1A`}
        stroke={ink}
        strokeWidth={4}
        filter={`url(#${filterId})`}
      />

      {/* inner border: ~40% opacity */}
      <ShapeEl {...innerProps} fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth={2} />

      {canArc && (
        <text
          fill={ink}
          fillOpacity={0.9}
          className="font-mono-data uppercase select-none"
          style={{ fontSize: 6, letterSpacing: "0.12em" }}
        >
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {name.length > 20 ? `${name.slice(0, 19)}…` : name}
          </textPath>
        </text>
      )}

      <g transform={`rotate(${-rotation}, ${cx}, ${cy})`}>
        {!canArc && (
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ink}
            className="font-display select-none"
            style={{ fontSize: 11, letterSpacing: "0.05em" }}
          >
            {name.length > 16 ? `${name.slice(0, 15)}…` : name}
          </text>
        )}

        {/* flanking rule-lines either side of the label line */}
        {isFull && (
          <>
            <line x1={cx - 22} y1={cy - (canArc ? 3 : 1)} x2={cx - 14} y2={cy - (canArc ? 3 : 1)} stroke={ink} strokeOpacity={0.55} strokeWidth={1} />
            <line x1={cx + 14} y1={cy - (canArc ? 3 : 1)} x2={cx + 22} y2={cy - (canArc ? 3 : 1)} stroke={ink} strokeOpacity={0.55} strokeWidth={1} />
          </>
        )}

        {continent && (
          <text
            x={cx}
            y={canArc ? cy - 3 : cy + 4}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ink}
            fillOpacity={0.75}
            className="font-mono-data uppercase select-none"
            style={{ fontSize: 6, letterSpacing: "0.14em" }}
          >
            {continent}
          </text>
        )}

        {isFull && (
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ink}
            fillOpacity={0.85}
            className="font-mono-data uppercase select-none"
            style={{ fontSize: 5, letterSpacing: "0.16em" }}
          >
            {label}
          </text>
        )}

        {/* tick divider */}
        <line
          x1={cx - 8}
          y1={cy + (isFull ? 17 : 13)}
          x2={cx + 8}
          y2={cy + (isFull ? 17 : 13)}
          stroke={ink}
          strokeOpacity={0.5}
          strokeWidth={1}
        />

        <text
          x={cx}
          y={cy + (isFull ? 25 : 21)}
          textAnchor="middle"
          dominantBaseline="central"
          fill={ink}
          className="font-mono-data uppercase select-none"
          style={{ fontSize: 6.5, letterSpacing: "0.1em" }}
        >
          {visaDate}
        </text>

        {isFull && (
          <>
            {/* mirrored reference-code corners, in the style of the
                reference sheets' small flight/entry codes */}
            <text
              x={cx - r * 0.62}
              y={cy - r * 0.6}
              textAnchor="middle"
              dominantBaseline="central"
              fill={ink}
              fillOpacity={0.8}
              className="font-mono-data select-none"
              style={{ fontSize: 5 }}
            >
              {code}
            </text>
            <text
              x={cx + r * 0.62}
              y={cy + r * 0.6}
              textAnchor="middle"
              dominantBaseline="central"
              fill={ink}
              fillOpacity={0.8}
              className="font-mono-data select-none"
              style={{ fontSize: 5 }}
            >
              {code}
            </text>

            {/* icon glyph, tucked in a corner clear of the text stack */}
            <g transform={`translate(${cx + r * 0.55}, ${cy - r * 0.62}) scale(0.6)`}>
              <IconGlyph icon={icon} colour={ink} />
            </g>
          </>
        )}
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
