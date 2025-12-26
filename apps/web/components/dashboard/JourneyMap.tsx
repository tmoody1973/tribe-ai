"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getCountryCoordinates } from "@/lib/constants/countryCoordinates";
import { Plane } from "lucide-react";

interface JourneyMapProps {
  origin: string;
  destination: string;
  className?: string;
}

export function JourneyMap({ origin, destination, className = "" }: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animationRef = useRef<number | null>(null);

  const originCoords = getCountryCoordinates(origin);
  const destCoords = getCountryCoordinates(destination);

  useEffect(() => {
    if (!mapContainer.current || !originCoords || !destCoords) return;

    // Initialize map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const centerLng = (originCoords[0] + destCoords[0]) / 2;
    const centerLat = (originCoords[1] + destCoords[1]) / 2;

    // Calculate zoom based on distance
    const distance = Math.sqrt(
      Math.pow(destCoords[0] - originCoords[0], 2) +
      Math.pow(destCoords[1] - originCoords[1], 2)
    );
    const zoom = Math.max(1, Math.min(4, 8 - distance / 30));

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [centerLng, centerLat],
      zoom: zoom,
      interactive: false,
      attributionControl: false,
    });

    map.current.on("load", () => {
      if (!map.current) return;
      setMapLoaded(true);

      // Add origin marker
      const originEl = document.createElement("div");
      originEl.className = "origin-marker";
      originEl.innerHTML = `
        <div class="w-8 h-8 bg-blue-500 border-4 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#000] animate-pulse">
          <span class="text-white text-xs font-bold">A</span>
        </div>
      `;
      new mapboxgl.Marker(originEl)
        .setLngLat(originCoords)
        .addTo(map.current);

      // Add destination marker
      const destEl = document.createElement("div");
      destEl.className = "dest-marker";
      destEl.innerHTML = `
        <div class="w-8 h-8 bg-green-500 border-4 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#000]">
          <span class="text-white text-xs font-bold">B</span>
        </div>
      `;
      new mapboxgl.Marker(destEl)
        .setLngLat(destCoords)
        .addTo(map.current);

      // Create curved line (arc) between points
      const curvePoints = generateArc(originCoords, destCoords, 50);

      // Add the route line
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: curvePoints,
          },
        },
      });

      // Dashed background line
      map.current.addLayer({
        id: "route-bg",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#000",
          "line-width": 4,
          "line-dasharray": [2, 2],
        },
      });

      // Animated line overlay
      map.current.addSource("route-animated", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      map.current.addLayer({
        id: "route-animated",
        type: "line",
        source: "route-animated",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      });

      // Animate the line
      let progress = 0;
      const animate = () => {
        progress += 0.01;
        if (progress > 1) progress = 0;

        const pointIndex = Math.floor(progress * curvePoints.length);
        const animatedPoints = curvePoints.slice(0, pointIndex + 1);

        const source = map.current?.getSource("route-animated") as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: animatedPoints.length > 1 ? animatedPoints : [originCoords, originCoords],
            },
          });
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.current?.remove();
    };
  }, [origin, destination, originCoords, destCoords]);

  // Generate arc points between two coordinates
  function generateArc(start: [number, number], end: [number, number], numPoints: number): [number, number][] {
    const points: [number, number][] = [];

    // Calculate arc height based on distance
    const distance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
    );
    const arcHeight = distance * 0.2;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const lng = start[0] + (end[0] - start[0]) * t;
      const lat = start[1] + (end[1] - start[1]) * t;

      // Add arc curve (parabolic)
      const arcOffset = Math.sin(t * Math.PI) * arcHeight;
      points.push([lng, lat + arcOffset]);
    }

    return points;
  }

  if (!originCoords || !destCoords) {
    return (
      <div className={`bg-gray-100 border-4 border-black shadow-[4px_4px_0_0_#000] p-4 ${className}`}>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <Plane className="mr-2" />
          <span>Map coordinates not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border-4 border-black shadow-[4px_4px_0_0_#000] overflow-hidden ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-48" />

      {/* Overlay with journey info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
            <span className="font-bold text-sm">{origin}</span>
          </div>
          <Plane className="text-yellow-400 animate-pulse" size={20} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{destination}</span>
            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      )}
    </div>
  );
}
