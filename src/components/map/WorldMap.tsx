"use client";

import { useEffect, useMemo, useRef } from "react";
import { geoNaturalEarth1 as geoNaturalEarthFallback, geoPath } from "d3-geo";
import * as d3geo from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";
import { COUNTRY_BY_NUMERIC } from "@/lib/countries";
import { seededRotation } from "@/lib/palette";
import type { EntryRecord, HostRecord, SuggestionRecord } from "@/lib/types";

const geoNaturalEarth =
  (d3geo as unknown as { geoNaturalEarth?: typeof geoNaturalEarthFallback })
    .geoNaturalEarth ?? geoNaturalEarthFallback;

const WIDTH = 960;
const HEIGHT = 500;
const MIN_SCALE = 1;
const MAX_SCALE = 8;

interface CountryFeature {
  type: "Feature";
  id: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown>;
}

export function WorldMap({
  entries,
  hostById,
  highlightedHostId,
  selectedCountry,
  onSelectCountry,
  suggestions = [],
}: {
  entries: EntryRecord[];
  hostById: Map<string, HostRecord>;
  highlightedHostId: string | null;
  selectedCountry: string | null;
  onSelectCountry: (alpha3: string) => void;
  suggestions?: SuggestionRecord[];
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomLayerRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null
  );

  const countries = useMemo<CountryFeature[]>(() => {
    const topo = topology as unknown as Topology;
    const geo = feature(
      topo,
      topo.objects.countries as GeometryCollection
    ) as unknown as { features: CountryFeature[] };
    return geo.features;
  }, []);

  const projection = useMemo(
    () => geoNaturalEarth().fitSize([WIDTH, HEIGHT], { type: "Sphere" }),
    []
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const outline = useMemo(() => path({ type: "Sphere" }) ?? "", [path]);

  // Most recent entry per country (map is keyed by ISO numeric via topojson id)
  const latestByCountry = useMemo(() => {
    const map = new Map<string, EntryRecord>();
    for (const e of entries) {
      const existing = map.get(e.countryCode);
      if (!existing || new Date(e.date) > new Date(existing.date)) {
        map.set(e.countryCode, e);
      }
    }
    return map;
  }, [entries]);

  const suggestedCountries = useMemo(() => {
    const set = new Set<string>();
    for (const s of suggestions) {
      if (!latestByCountry.has(s.countryCode)) set.add(s.countryCode);
    }
    return set;
  }, [suggestions, latestByCountry]);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!svgRef.current || !zoomLayerRef.current) return;
    const svg = select(svgRef.current);
    const layer = select(zoomLayerRef.current);

    // No translateExtent: the map should pan freely in all directions
    // ("like a globe") at any zoom level, including the default 1x. A
    // translateExtent equal to the content size ([0,0]-[WIDTH,HEIGHT])
    // was previously clamping translation to zero slack at scale 1,
    // which made single-finger drag-pan feel dead/broken on mobile.
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .touchable(() => true)
      .on("zoom", (event) => {
        layer.attr("transform", event.transform.toString());
      });

    svg.call(behavior);
    zoomBehaviorRef.current = behavior;

    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  function zoomBy(factor: number) {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = select(svgRef.current);
    const duration = reduceMotion ? 0 : 180;
    svg
      .transition()
      .duration(duration)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  }

  function resetZoom() {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = select(svgRef.current);
    const duration = reduceMotion ? 0 : 180;
    svg
      .transition()
      .duration(duration)
      .call(zoomBehaviorRef.current.transform, zoomIdentity);
  }

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full touch-none"
        role="img"
        aria-label="World map of visited countries"
      >
        <g ref={zoomLayerRef}>
          <path d={outline} fill="var(--ocean)" opacity={0.5} />
          <g>
            {countries.map((c) => {
              const ref = COUNTRY_BY_NUMERIC.get(c.id);
              const alpha3 = ref?.alpha3;
              const visited = alpha3 ? latestByCountry.has(alpha3) : false;
              const isSelected = alpha3 === selectedCountry;
              const feat = c as unknown as GeoJSON.Feature;
              const d = path(feat);
              if (!d) return null;

              // Never re-stroke the country's own path to show selection.
              // A bounding-box "is this tiny" threshold isn't reliable —
              // archipelago / thin-coastline countries (Croatia, Greece,
              // Philippines, the Balkan states) have plenty of bounding-box
              // area but are made of many thin, close-together path
              // fragments; any stroke width thick enough to read as a
              // highlight overlaps itself across those fragments and reads
              // as visual noise ("melted" edges), independent of overall
              // country size. Selection is communicated solely via fill
              // (below) plus the centroid ring drawn in the markers layer,
              // which scales sensibly regardless of the underlying
              // geometry's shape.
              const fillBoost = isSelected ? 0.15 : 0;

              return (
                <path
                  key={c.id}
                  d={d}
                  fill={visited ? "#DCD2B8" : "var(--unvisited-land)"}
                  fillOpacity={(visited ? 0.9 : 0.55) + fillBoost}
                  stroke="var(--paper)"
                  strokeWidth={0.4}
                  className="cursor-pointer transition-colors duration-150"
                  onClick={() => alpha3 && onSelectCountry(alpha3)}
                />
              );
            })}
          </g>
          <g>
            {selectedCountry &&
              (() => {
                const ref = [...COUNTRY_BY_NUMERIC.values()].find(
                  (v) => v.alpha3 === selectedCountry
                );
                if (!ref) return null;
                const c = countries.find((cc) => cc.id === ref.numeric);
                if (!c) return null;
                const feat = c as unknown as GeoJSON.Feature;
                const centroid = path.centroid(feat);
                if (!centroid || Number.isNaN(centroid[0])) return null;
                return (
                  <circle
                    cx={centroid[0]}
                    cy={centroid[1]}
                    r={9}
                    fill="none"
                    stroke="var(--oxblood)"
                    strokeWidth={1.2}
                    pointerEvents="none"
                  />
                );
              })()}
          </g>
          <g>
            {[...latestByCountry.entries()].map(([alpha3, entry]) => {
              const ref = [...COUNTRY_BY_NUMERIC.values()].find(
                (v) => v.alpha3 === alpha3
              );
              if (!ref) return null;
              const c = countries.find((cc) => cc.id === ref.numeric);
              if (!c) return null;
              const centroid = path.centroid(c as unknown as GeoJSON.Feature);
              if (!centroid || Number.isNaN(centroid[0])) return null;
              const host = hostById.get(entry.hostId);
              if (!host) return null;
              const dimmed = Boolean(
                highlightedHostId && highlightedHostId !== host.id
              );
              const rotation = seededRotation(entry.id);
              const r = 8;
              return (
                <g
                  key={alpha3}
                  transform={`translate(${centroid[0]}, ${centroid[1]}) rotate(${rotation})`}
                  className="cursor-pointer animate-stamp-in"
                  onClick={() => onSelectCountry(alpha3)}
                >
                  {/* invisible larger hit target, min ~44px screen px worth of svg units */}
                  <circle r={16} fill="transparent" />
                  <circle
                    r={r}
                    fill={`${host.colour}26`}
                    stroke={host.colour}
                    strokeWidth={1.6}
                    opacity={dimmed ? 0.25 : 0.88}
                  />
                  <circle
                    r={r * 0.6}
                    fill="none"
                    stroke={host.colour}
                    strokeOpacity={0.4}
                    strokeWidth={1}
                    opacity={dimmed ? 0.25 : 0.88}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={6.5}
                    fill={host.colour}
                    opacity={dimmed ? 0.25 : 0.95}
                    className="font-mono-data select-none"
                    transform={`rotate(${-rotation})`}
                  >
                    {host.initial}
                  </text>
                </g>
              );
            })}
          </g>
          <g>
            {[...suggestedCountries].map((alpha3) => {
              const ref = [...COUNTRY_BY_NUMERIC.values()].find(
                (v) => v.alpha3 === alpha3
              );
              if (!ref) return null;
              const c = countries.find((cc) => cc.id === ref.numeric);
              if (!c) return null;
              const centroid = path.centroid(c as unknown as GeoJSON.Feature);
              if (!centroid || Number.isNaN(centroid[0])) return null;
              return (
                <g
                  key={`suggestion-${alpha3}`}
                  transform={`translate(${centroid[0]}, ${centroid[1]})`}
                  className="cursor-pointer"
                  onClick={() => onSelectCountry(alpha3)}
                >
                  <circle r={16} fill="transparent" />
                  <circle
                    r={6}
                    fill="none"
                    stroke="var(--ink-faded)"
                    strokeWidth={1}
                    strokeDasharray="1.4 1.6"
                    opacity={0.85}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={7}
                    fill="var(--ink-faded)"
                    className="font-mono-data select-none"
                  >
                    ?
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1.5)}
          aria-label="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-brass/50 bg-paper/90 font-mono-data text-sm uppercase text-ink shadow-paper-sm hover:bg-black/5"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.5)}
          aria-label="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-brass/50 bg-paper/90 font-mono-data text-sm uppercase text-ink shadow-paper-sm hover:bg-black/5"
        >
          &minus;
        </button>
        <button
          type="button"
          onClick={resetZoom}
          aria-label="Reset view"
          className="flex h-9 items-center justify-center rounded-sm border border-brass/50 bg-paper/90 px-2 font-mono-data text-[9px] uppercase tracking-[0.1em] text-ink shadow-paper-sm hover:bg-black/5"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
