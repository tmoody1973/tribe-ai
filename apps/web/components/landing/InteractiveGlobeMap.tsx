"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// Migration corridor data with real coordinates
const CORRIDORS = [
  {
    id: "mx-us",
    from: { code: "MX", name: "Mexico", flag: "🇲🇽", lng: -102.5528, lat: 23.6345 },
    to: { code: "US", name: "United States", flag: "🇺🇸", lng: -98.5795, lat: 39.8283 },
    migrants: "11M+",
    trend: "stable" as const,
    color: "#ef4444",
  },
  {
    id: "in-us",
    from: { code: "IN", name: "India", flag: "🇮🇳", lng: 78.9629, lat: 20.5937 },
    to: { code: "US", name: "United States", flag: "🇺🇸", lng: -98.5795, lat: 39.8283 },
    migrants: "2.7M+",
    trend: "up" as const,
    color: "#f97316",
  },
  {
    id: "ng-uk",
    from: { code: "NG", name: "Nigeria", flag: "🇳🇬", lng: 8.6753, lat: 9.082 },
    to: { code: "UK", name: "United Kingdom", flag: "🇬🇧", lng: -3.436, lat: 55.3781 },
    migrants: "250K+",
    trend: "up" as const,
    color: "#22c55e",
  },
  {
    id: "ph-ca",
    from: { code: "PH", name: "Philippines", flag: "🇵🇭", lng: 121.774, lat: 12.8797 },
    to: { code: "CA", name: "Canada", flag: "🇨🇦", lng: -106.3468, lat: 56.1304 },
    migrants: "900K+",
    trend: "up" as const,
    color: "#3b82f6",
  },
  {
    id: "br-pt",
    from: { code: "BR", name: "Brazil", flag: "🇧🇷", lng: -51.9253, lat: -14.235 },
    to: { code: "PT", name: "Portugal", flag: "🇵🇹", lng: -8.2245, lat: 39.3999 },
    migrants: "200K+",
    trend: "up" as const,
    color: "#eab308",
  },
  {
    id: "cn-au",
    from: { code: "CN", name: "China", flag: "🇨🇳", lng: 104.1954, lat: 35.8617 },
    to: { code: "AU", name: "Australia", flag: "🇦🇺", lng: 133.7751, lat: -25.2744 },
    migrants: "650K+",
    trend: "stable" as const,
    color: "#8b5cf6",
  },
];

// Generate arc points for a great circle path
function generateArcPoints(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  numPoints: number = 100
): [number, number][] {
  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Spherical interpolation for great circle
    const lng = startLng + (endLng - startLng) * t;
    const lat = startLat + (endLat - startLat) * t;

    // Add arc height (parabolic curve)
    const arcHeight = Math.sin(t * Math.PI) * 20; // Peak height of 20 degrees
    const adjustedLat = lat + arcHeight * (1 - Math.abs(2 * t - 1));

    points.push([lng, adjustedLat]);
  }

  return points;
}

// Generate GeoJSON for all corridors
function generateCorridorGeoJSON(hoveredId: string | null) {
  const features = CORRIDORS.map((corridor) => {
    const points = generateArcPoints(
      corridor.from.lng,
      corridor.from.lat,
      corridor.to.lng,
      corridor.to.lat
    );

    return {
      type: "Feature" as const,
      properties: {
        id: corridor.id,
        color: corridor.color,
        isHovered: corridor.id === hoveredId,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: points,
      },
    };
  });

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

interface InteractiveGlobeMapProps {
  hoveredCorridor: string | null;
  onCorridorHover: (id: string | null) => void;
}

export function InteractiveGlobeMap({
  hoveredCorridor,
  onCorridorHover,
}: InteractiveGlobeMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  // Slow globe rotation animation
  const animateRotation = useCallback(() => {
    if (!mapRef.current || !isLoaded) return;

    rotationRef.current += 0.02; // Slow rotation speed
    const map = mapRef.current.getMap();

    // Only rotate if user isn't interacting
    if (!map.isMoving()) {
      map.setCenter([rotationRef.current % 360 - 180, 20]);
    }

    animationRef.current = requestAnimationFrame(animateRotation);
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      animationRef.current = requestAnimationFrame(animateRotation);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, animateRotation]);

  // Fly to corridor on hover
  useEffect(() => {
    if (!mapRef.current || !hoveredCorridor) return;

    const corridor = CORRIDORS.find((c) => c.id === hoveredCorridor);
    if (!corridor) return;

    // Calculate midpoint
    const midLng = (corridor.from.lng + corridor.to.lng) / 2;
    const midLat = (corridor.from.lat + corridor.to.lat) / 2;

    mapRef.current.flyTo({
      center: [midLng, midLat],
      zoom: 2.5,
      duration: 1000,
    });

    // Stop rotation while hovering
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [hoveredCorridor]);

  // Resume rotation when not hovering
  useEffect(() => {
    if (!hoveredCorridor && isLoaded) {
      animationRef.current = requestAnimationFrame(animateRotation);
    }
  }, [hoveredCorridor, isLoaded, animateRotation]);

  const corridorGeoJSON = generateCorridorGeoJSON(hoveredCorridor);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border-4 border-black shadow-[8px_8px_0_0_#000]">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: "globe" }}
        fog={{
          color: "rgb(186, 210, 235)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.02,
          "space-color": "rgb(11, 11, 25)",
          "star-intensity": 0.6,
        }}
        onLoad={() => setIsLoaded(true)}
        interactive={true}
        scrollZoom={false}
        doubleClickZoom={false}
      >
        {/* Corridor arcs */}
        <Source id="corridors" type="geojson" data={corridorGeoJSON}>
          {/* Glow effect layer */}
          <Layer
            id="corridor-glow"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": [
                "case",
                ["==", ["get", "isHovered"], true],
                12,
                6,
              ],
              "line-blur": 8,
              "line-opacity": 0.4,
            }}
          />
          {/* Main line layer */}
          <Layer
            id="corridor-lines"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": [
                "case",
                ["==", ["get", "isHovered"], true],
                4,
                2,
              ],
              "line-opacity": [
                "case",
                ["==", ["get", "isHovered"], true],
                1,
                0.7,
              ],
            }}
          />
        </Source>

        {/* Origin and destination markers */}
        {CORRIDORS.map((corridor) => (
          <Marker
            key={`${corridor.id}-from`}
            longitude={corridor.from.lng}
            latitude={corridor.from.lat}
            anchor="center"
          >
            <div
              className={`
                flex items-center justify-center
                w-8 h-8 rounded-full border-2 border-white
                text-lg cursor-pointer transition-transform duration-200
                ${hoveredCorridor === corridor.id ? "scale-125 shadow-lg" : "scale-100"}
              `}
              style={{ backgroundColor: corridor.color }}
              onMouseEnter={() => onCorridorHover(corridor.id)}
              onMouseLeave={() => onCorridorHover(null)}
            >
              {corridor.from.flag}
            </div>
          </Marker>
        ))}

        {CORRIDORS.map((corridor) => (
          <Marker
            key={`${corridor.id}-to`}
            longitude={corridor.to.lng}
            latitude={corridor.to.lat}
            anchor="center"
          >
            <div
              className={`
                flex items-center justify-center
                w-10 h-10 rounded-full border-3 border-white
                text-xl cursor-pointer transition-transform duration-200
                ${hoveredCorridor === corridor.id ? "scale-125 shadow-lg" : "scale-100"}
              `}
              style={{ backgroundColor: corridor.color }}
              onMouseEnter={() => onCorridorHover(corridor.id)}
              onMouseLeave={() => onCorridorHover(null)}
            >
              {corridor.to.flag}
            </div>
          </Marker>
        ))}
      </Map>

      {/* Overlay gradient for blending */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20">
          <span className="font-bold text-amber-400">280M+</span>
          <span className="text-sm ml-1">migrants worldwide</span>
        </div>
        <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20">
          <span className="font-bold text-cyan-400">195</span>
          <span className="text-sm ml-1">countries connected</span>
        </div>
      </div>
    </div>
  );
}

export { CORRIDORS };
