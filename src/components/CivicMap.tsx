"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Crosshair, MapPin, Navigation, Plus, Minus, RotateCcw, User, Check } from "lucide-react";

export type MapCandidate = {
  id: number;
  fullName: string;
  role?: string;
  department?: string | null;
  skills?: string[];
  expertise?: string[];
  experienceYears?: number;
  registeredLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  availabilityStatus: string;
  distanceKm?: number | null;
  score?: number;
  photoUrl?: string | null;
  isAssigned?: boolean;
};

export function isValidCoordinate(lat: unknown, lon: unknown): boolean {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return false;
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) return false;
  if (nLat < -90 || nLat > 90 || nLon < -180 || nLon > 180) return false;
  if (Math.abs(nLat) < 0.0001 && Math.abs(nLon) < 0.0001) return false;
  return true;
}

export interface CivicMapProps {
  problemLocation: {
    title: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
  };
  candidates: MapCandidate[];
  selectedCandidateId?: number | null;
  onSelectCandidate?: (candidate: MapCandidate) => void;
  radiusKm?: number;
  onRadiusChange?: (radiusKm: number) => void;
  assignedCandidateId?: number | null;
  className?: string;
  height?: string;
}

// Convert Lat/Lon to standard Web Mercator coordinates
function latLonToMeters(lat: number, lon: number) {
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  return { x, y };
}

function metersToTile(x: number, y: number, zoom: number) {
  const originShift = 20037508.34;
  const initialResolution = (2 * originShift) / 256;
  const res = initialResolution / Math.pow(2, zoom);
  const px = (x + originShift) / res;
  const py = (originShift - y) / res;
  return {
    tileX: Math.floor(px / 256),
    tileY: Math.floor(py / 256),
    pixelX: px,
    pixelY: py,
  };
}

export function CivicMap({
  problemLocation,
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  radiusKm = 5,
  onRadiusChange,
  assignedCandidateId,
  className = "",
  height = "460px",
}: CivicMapProps) {
  const isMapped = isValidCoordinate(problemLocation.latitude, problemLocation.longitude);
  const validLat = isMapped ? Number(problemLocation.latitude) : 0;
  const validLon = isMapped ? Number(problemLocation.longitude) : 0;

  // Default zoom 12 covers a ~16 km span, perfectly framing the 5 km radius circle and all nearby field person pins
  const [zoom, setZoom] = useState(12);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const [centerLat, setCenterLat] = useState(validLat);
  const [centerLon, setCenterLon] = useState(validLon);

  // Pan dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 680, height: 460 });

  useEffect(() => {
    if (isValidCoordinate(problemLocation.latitude, problemLocation.longitude)) {
      setCenterLat(Number(problemLocation.latitude));
      setCenterLon(Number(problemLocation.longitude));
    }
  }, [problemLocation.latitude, problemLocation.longitude]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const centerMeters = useMemo(() => latLonToMeters(centerLat, centerLon), [centerLat, centerLon]);
  const centerTile = useMemo(() => metersToTile(centerMeters.x, centerMeters.y, zoom), [centerMeters, zoom]);

  const getScreenPos = (lat: number, lon: number) => {
    const m = latLonToMeters(lat, lon);
    const t = metersToTile(m.x, m.y, zoom);
    const dx = t.pixelX - centerTile.pixelX;
    const dy = t.pixelY - centerTile.pixelY;
    return {
      x: containerSize.width / 2 + dx,
      y: containerSize.height / 2 + dy,
    };
  };

  const problemPos = useMemo(
    () => (isMapped ? getScreenPos(validLat, validLon) : { x: 0, y: 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMapped, validLat, validLon, centerTile, containerSize, zoom],
  );

  const radiusPixels = useMemo(() => {
    const metersPerPixel = (Math.cos((centerLat * Math.PI) / 180) * 2 * Math.PI * 6378137) / (256 * Math.pow(2, zoom));
    return (radiusKm * 1000) / metersPerPixel;
  }, [centerLat, zoom, radiusKm]);

  // Compute visible 256x256 tiles around center
  const tiles = useMemo(() => {
    const tileList = [];
    const tilesX = Math.ceil(containerSize.width / 256) + 2;
    const tilesY = Math.ceil(containerSize.height / 256) + 2;
    const halfX = Math.floor(tilesX / 2);
    const halfY = Math.floor(tilesY / 2);

    for (let dx = -halfX; dx <= halfX; dx++) {
      for (let dy = -halfY; dy <= halfY; dy++) {
        const tx = centerTile.tileX + dx;
        const ty = centerTile.tileY + dy;
        const maxTile = Math.pow(2, zoom);
        if (tx >= 0 && tx < maxTile && ty >= 0 && ty < maxTile) {
          const tileLeft = containerSize.width / 2 + (tx * 256 - centerTile.pixelX);
          const tileTop = containerSize.height / 2 + (ty * 256 - centerTile.pixelY);
          tileList.push({
            x: tx,
            y: ty,
            left: tileLeft,
            top: tileTop,
            key: `${zoom}-${tx}-${ty}`,
          });
        }
      }
    }
    return tileList;
  }, [centerTile, containerSize, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const originShift = 20037508.34;
    const initialResolution = (2 * originShift) / 256;
    const res = initialResolution / Math.pow(2, zoom);

    const newMetersX = centerMeters.x - dx * res;
    const newMetersY = centerMeters.y + dy * res;

    const newLon = (newMetersX / 20037508.34) * 180;
    let newLat = (newMetersY / 20037508.34) * 180;
    newLat = (180 / Math.PI) * (2 * Math.atan(Math.exp((newLat * Math.PI) / 180)) - Math.PI / 2);

    setCenterLat(newLat);
    setCenterLon(newLon);
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    if (isMapped) {
      setCenterLat(validLat);
      setCenterLon(validLon);
      setZoom(12);
    }
  };

  // Extract short label for problem (e.g. "Nalgonda", "Shapur", "Warangal")
  const problemShortName = useMemo(() => {
    const raw = (problemLocation.address || problemLocation.title || "").trim();
    if (!raw) return "Site";
    const parts = raw.split(",");
    return parts[0]?.trim() || raw.slice(0, 20);
  }, [problemLocation]);

  if (!isMapped) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-8 flex flex-col items-center justify-center text-center shadow-sm ${className}`}
        style={{ height }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 mb-3 shadow-sm">
          <MapPin className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">Location could not be accurately mapped.</h4>
        <p className="mt-1.5 max-w-md text-xs text-slate-600">
          The reported location <strong>"{problemLocation.address || problemLocation.title}"</strong> could not be resolved to verified GPS coordinates. Please update the problem location or provide a landmark.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm ${className}`}>
      {/* Map Canvas with draggable surface */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height }}
        className={`relative w-full cursor-grab active:cursor-grabbing overflow-hidden ${
          isDragging ? "cursor-grabbing" : ""
        }`}
      >
        {/* Raster Map Tiles */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {tiles.map((t) => {
            const tileUrl =
              mapType === "street"
                ? `https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`
                : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`;
            return (
              <img
                key={t.key}
                src={tileUrl}
                alt=""
                className={`absolute h-[256px] w-[256px] object-cover ${mapType === "street" ? "brightness-95 contrast-95" : ""}`}
                style={{ left: `${t.left}px`, top: `${t.top}px` }}
                loading="lazy"
                draggable={false}
              />
            );
          })}
        </div>

        {/* TOP-LEFT FLOATING MAP LEGEND */}
        <div className="absolute top-3.5 left-3.5 z-20 rounded-2xl bg-white/95 px-3.5 py-3 shadow-lg border border-slate-100/80 backdrop-blur pointer-events-auto">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="grid h-4 w-4 place-items-center text-rose-600 font-bold">📍</span>
              <span className="font-medium text-slate-800">Reported Problem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-white text-[9px] font-bold">👤</div>
              <span className="font-medium text-slate-800">Available Field Person</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white text-[9px] font-bold">👤</div>
              <span className="font-medium text-slate-800">Assigned Field Person</span>
            </div>
          </div>
        </div>

        {/* SVG Overlay: Search Radius Circle & Connector Lines */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
          {/* Radial red glow for problem site */}
          <circle
            cx={problemPos.x}
            cy={problemPos.y}
            r={38}
            fill="rgba(244, 63, 94, 0.16)"
          />

          {/* Dotted search radius circle */}
          <circle
            cx={problemPos.x}
            cy={problemPos.y}
            r={Math.max(1, radiusPixels)}
            fill="rgba(59, 130, 246, 0.04)"
            stroke="#3b82f6"
            strokeWidth="1.75"
            strokeDasharray="5 4"
          />

          {/* Line to selected candidate */}
          {candidates
            .filter((c) => c.id === selectedCandidateId && c.latitude && c.longitude)
            .map((c) => {
              const pos = getScreenPos(c.latitude!, c.longitude!);
              return (
                <line
                  key={c.id}
                  x1={problemPos.x}
                  y1={problemPos.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.7"
                />
              );
            })}
        </svg>

        {/* Radius Tag on circle perimeter (5 km) */}
        <div
          className="absolute z-15 -translate-y-1/2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none"
          style={{ left: `${problemPos.x + radiusPixels}px`, top: `${problemPos.y}px` }}
        >
          {radiusKm} km
        </div>

        {/* 🔴 REPORTED PROBLEM MARKER */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full transition-transform duration-75 pointer-events-auto cursor-pointer"
          style={{ left: `${problemPos.x}px`, top: `${problemPos.y}px` }}
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              <span className="absolute -inset-1 animate-ping rounded-full bg-rose-400 opacity-60" />
              <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-rose-600 text-white shadow-xl">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            {/* Label below pin matching screenshot: "Shapur" */}
            <div className="mt-1 whitespace-nowrap rounded-md bg-white/95 px-2 py-0.5 text-xs font-bold text-slate-900 shadow border border-slate-200">
              {problemShortName}
            </div>
          </div>
        </div>

        {/* 🔵 / 🟢 NEARBY FIELD PERSON MARKERS */}
        {candidates.map((person) => {
          if (person.latitude === null || person.longitude === null || person.latitude === undefined || person.longitude === undefined) {
            return null;
          }
          const pos = getScreenPos(person.latitude, person.longitude);
          const isSelected = person.id === selectedCandidateId;
          const isAssigned = person.isAssigned || person.id === assignedCandidateId;

          const markerBg = isAssigned ? "bg-emerald-600" : "bg-blue-600";

          return (
            <div
              key={person.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCandidate?.(person);
              }}
              className={`absolute z-20 -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 cursor-pointer ${
                isSelected ? "scale-110 z-30" : ""
              }`}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            >
              <div className="relative flex flex-col items-center">
                {/* CALLOUT SPEECH BUBBLE (Exact match to screenshot) */}
                {isSelected && (
                  <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-3 py-2 shadow-2xl border border-slate-200/80 pointer-events-none z-40 transition-all animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 text-xs leading-tight">{person.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {person.distanceKm !== null && person.distanceKm !== undefined ? `${person.distanceKm} km away` : "Nearby"}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{person.availabilityStatus === "AVAILABLE" ? "Available" : person.availabilityStatus}</span>
                        </div>
                      </div>
                    </div>
                    {/* Downward triangle pointer */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-white border-r border-b border-slate-200/80" />
                  </div>
                )}

                {/* Candidate Pin */}
                <div className="relative">
                  {isAssigned ? (
                    <span className="absolute -inset-1 animate-ping rounded-full bg-emerald-400 opacity-60" />
                  ) : isSelected ? (
                    <span className="absolute -inset-1 animate-pulse rounded-full bg-blue-400 opacity-60" />
                  ) : null}
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white text-white shadow-xl transition ${markerBg} ${
                      isSelected ? "ring-4 ring-blue-300 shadow-blue-500/30" : ""
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* BOTTOM-LEFT SATELLITE TOGGLE (Exact match to screenshot) */}
        <button
          type="button"
          onClick={() => setMapType((m) => (m === "street" ? "satellite" : "street"))}
          className="absolute bottom-3 left-3 z-20 overflow-hidden rounded-xl border-2 border-white bg-white/90 shadow-md hover:scale-105 transition pointer-events-auto"
          title="Toggle Satellite view"
        >
          <div className="relative h-11 w-11">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=100&auto=format&fit=crop&q=80"
              alt="Satellite"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-bold text-white text-center py-0.5">
              {mapType === "street" ? "Satellite" : "Map"}
            </span>
          </div>
        </button>

        {/* BOTTOM-RIGHT CONTROLS: Zoom in, Zoom out, Locate */}
        <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 1, 17))}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white text-slate-700 shadow-md hover:bg-slate-50 active:scale-95 border border-slate-200 transition font-bold"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 1, 9))}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white text-slate-700 shadow-md hover:bg-slate-50 active:scale-95 border border-slate-200 transition font-bold"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white text-slate-700 shadow-md hover:bg-slate-50 active:scale-95 border border-slate-200 transition"
            title="Reset center"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
