"use client";

import { useMemo } from "react";
import { geoNaturalEarth1 as geoNaturalEarthFallback, geoPath } from "d3-geo";
import * as d3geo from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";
import { COUNTRY_BY_NUMERIC } from "@/lib/countries";
import { seededRotation } from "@/lib/palette";
import type { EntryRecord, HostRecord } from "@/lib/types";

const geoNaturalEarth =
  (d3geo as unknown as { geoNaturalEarth?: typeof geoNaturalEarthFallback })
    .geoNaturalEarth ?? geoNaturalEarthFallback;

const WIDTH = 960;
const HEIGHT = 500;

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
}: {
  entries: EntryRecord[];
  hostById: Map<string, HostRecord>;
  highlightedHostId: string | null;
  selectedCountry: string | null;
  onSelectCountry: (alpha3: string) => void;
}) {
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

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-full w-full"
      role="img"
      aria-label="World map of visited countries"
    >
      <path d={outline} fill="var(--ocean)" opacity={0.5} />
      <g>
        {countries.map((c) => {
          const ref = COUNTRY_BY_NUMERIC.get(c.id);
          const alpha3 = ref?.alpha3;
          const visited = alpha3 ? latestByCountry.has(alpha3) : false;
          const isSelected = alpha3 === selectedCountry;
          const d = path(c as unknown as GeoJSON.Feature);
          if (!d) return null;
          return (
            <path
              key={c.id}
              d={d}
              fill={visited ? "#DCD2B8" : "var(--unvisited-land)"}
              fillOpacity={visited ? 0.9 : 0.55}
              stroke={isSelected ? "var(--oxblood)" : "var(--paper)"}
              strokeWidth={isSelected ? 1.2 : 0.4}
              className="cursor-pointer transition-colors duration-150"
              onClick={() => alpha3 && onSelectCountry(alpha3)}
            />
          );
        })}
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
    </svg>
  );
}
