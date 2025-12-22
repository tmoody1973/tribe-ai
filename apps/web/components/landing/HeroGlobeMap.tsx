"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// Migration corridors with real coordinates
const CORRIDORS = [
  {
    id: "mx-us",
    from: { name: "Mexico City", lng: -99.1332, lat: 19.4326 },
    to: { name: "Los Angeles", lng: -118.2437, lat: 34.0522 },
    color: "#ef4444",
  },
  {
    id: "ng-uk",
    from: { name: "Lagos", lng: 3.3792, lat: 6.5244 },
    to: { name: "London", lng: -0.1276, lat: 51.5074 },
    color: "#22c55e",
  },
  {
    id: "in-us",
    from: { name: "Mumbai", lng: 72.8777, lat: 19.076 },
    to: { name: "New York", lng: -74.006, lat: 40.7128 },
    color: "#f97316",
  },
  {
    id: "ph-ca",
    from: { name: "Manila", lng: 120.9842, lat: 14.5995 },
    to: { name: "Toronto", lng: -79.3832, lat: 43.6532 },
    color: "#3b82f6",
  },
  {
    id: "cn-au",
    from: { name: "Shanghai", lng: 121.4737, lat: 31.2304 },
    to: { name: "Sydney", lng: 151.2093, lat: -33.8688 },
    color: "#8b5cf6",
  },
  {
    id: "br-pt",
    from: { name: "São Paulo", lng: -46.6333, lat: -23.5505 },
    to: { name: "Lisbon", lng: -9.1393, lat: 38.7223 },
    color: "#eab308",
  },
];

// Generate arc points between two coordinates
function generateArc(
  start: [number, number],
  end: [number, number],
  numPoints = 50
): [number, number][] {
  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Calculate intermediate point
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;

    // Add arc height - peaks in the middle
    const arcHeight = Math.sin(t * Math.PI) * 15;

    points.push([lng, lat + arcHeight]);
  }

  return points;
}

// Create GeoJSON for all flight paths
function createFlightPathsGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: CORRIDORS.map((corridor) => ({
      type: "Feature" as const,
      properties: {
        color: corridor.color,
        id: corridor.id,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: generateArc(
          [corridor.from.lng, corridor.from.lat],
          [corridor.to.lng, corridor.to.lat]
        ),
      },
    })),
  };
}

// Animated dot that travels along a path
interface AnimatedDot {
  corridorIndex: number;
  progress: number;
  speed: number;
}

export function HeroGlobeMap() {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [animatedDots, setAnimatedDots] = useState<AnimatedDot[]>([]);
  const animationRef = useRef<number | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Initialize animated dots
  useEffect(() => {
    const dots: AnimatedDot[] = CORRIDORS.map((_, index) => ({
      corridorIndex: index,
      progress: Math.random(), // Random starting position
      speed: 0.002 + Math.random() * 0.002, // Varying speeds
    }));
    setAnimatedDots(dots);
  }, []);

  // Animation loop for dots
  useEffect(() => {
    if (!mapLoaded) return;

    const animate = () => {
      setAnimatedDots((prev) =>
        prev.map((dot) => ({
          ...dot,
          progress: (dot.progress + dot.speed) % 1,
        }))
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mapLoaded]);

  // Calculate dot position along arc
  const getDotPosition = useCallback(
    (corridorIndex: number, progress: number) => {
      const corridor = CORRIDORS[corridorIndex];
      if (!corridor) return null;

      const arc = generateArc(
        [corridor.from.lng, corridor.from.lat],
        [corridor.to.lng, corridor.to.lat]
      );

      const index = Math.floor(progress * (arc.length - 1));
      return arc[index];
    },
    []
  );

  if (!mapboxToken) {
    // Fallback if no token - show a stylized placeholder
    return (
      <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px] rounded-full overflow-hidden border-4 border-black shadow-[8px_8px_0_0_#000] bg-gradient-to-br from-cyan-100 via-blue-200 to-indigo-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl">🌍</span>
            <p className="text-sm font-bold mt-2">Global Migration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px]">
      {/* Outer glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200 via-blue-200 to-indigo-200 blur-2xl opacity-60 animate-pulse" />

      {/* Map container with circular mask */}
      <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-black shadow-[8px_8px_0_0_#000]">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: 20,
            latitude: 25,
            zoom: 1.1,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactive={false}
          attributionControl={false}
          onLoad={() => setMapLoaded(true)}
        >
          {mapLoaded && (
            <>
              {/* Flight path lines */}
              <Source
                id="flight-paths"
                type="geojson"
                data={createFlightPathsGeoJSON()}
              >
                {/* Glow effect layer */}
                <Layer
                  id="flight-paths-glow"
                  type="line"
                  paint={{
                    "line-color": ["get", "color"],
                    "line-width": 6,
                    "line-opacity": 0.3,
                    "line-blur": 4,
                  }}
                />
                {/* Main path */}
                <Layer
                  id="flight-paths-line"
                  type="line"
                  paint={{
                    "line-color": ["get", "color"],
                    "line-width": 2,
                    "line-opacity": 0.8,
                  }}
                />
                {/* Dashed animated overlay */}
                <Layer
                  id="flight-paths-dash"
                  type="line"
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": 1,
                    "line-opacity": 0.6,
                    "line-dasharray": [2, 4],
                  }}
                />
              </Source>

              {/* Origin markers */}
              {CORRIDORS.map((corridor) => (
                <Marker
                  key={`from-${corridor.id}`}
                  longitude={corridor.from.lng}
                  latitude={corridor.from.lat}
                  anchor="center"
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white animate-pulse"
                    style={{ backgroundColor: corridor.color, boxShadow: `0 0 8px ${corridor.color}` }}
                  />
                </Marker>
              ))}

              {/* Destination markers */}
              {CORRIDORS.map((corridor) => (
                <Marker
                  key={`to-${corridor.id}`}
                  longitude={corridor.to.lng}
                  latitude={corridor.to.lat}
                  anchor="center"
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: corridor.color, boxShadow: `0 0 12px ${corridor.color}` }}
                  />
                </Marker>
              ))}

              {/* Animated traveling dots */}
              {animatedDots.map((dot, index) => {
                const position = getDotPosition(dot.corridorIndex, dot.progress);
                if (!position) return null;
                const corridor = CORRIDORS[dot.corridorIndex];

                return (
                  <Marker
                    key={`dot-${index}`}
                    longitude={position[0]}
                    latitude={position[1]}
                    anchor="center"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: "#ffffff",
                        boxShadow: `0 0 10px ${corridor.color}, 0 0 20px ${corridor.color}`,
                      }}
                    />
                  </Marker>
                );
              })}
            </>
          )}
        </Map>

        {/* Subtle overlay gradient for depth */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-blue-500/10 to-transparent" />
      </div>

      {/* Floating decorative elements */}
      <div
        className="absolute top-2 right-6 animate-bounce"
        style={{ animationDuration: "3s" }}
      >
        <span className="text-2xl">✈️</span>
      </div>
      <div
        className="absolute bottom-6 left-2 animate-bounce"
        style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
      >
        <span className="text-xl">🧳</span>
      </div>
    </div>
  );
}
