import React from 'react';
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_ROOMS,
  BUILDING,
  FLOORS,
  KIOSK_POSITIONS,
  ROOM_COLORS,
  STAIRS,
} from "./buildingData";
import {
  findPath,
  getNearestNodeForRoom,
  getNode,
  getPathPoints,
} from "./pathfinder";

import {
  iconSearch, iconOffice, iconClassroom, iconLab, iconFacility, iconRestroom,
  iconStairs, iconLobby, iconParking, iconStorage, iconUtility, iconSpecial,
  iconRoute, iconLayers, iconFloor, iconSingleFloor, iconSimpleView, iconReset,
  iconFocus, iconPlus, iconMinus, iconPin, iconKiosk, iconArrowRight, iconArrowUp,
  iconArrowDown, iconClose, iconInfo, iconLogoGc,
  wayStartDot, wayDestinationPin, wayKioskDot, wayStairsUp, wayStairsDown, wayFloorTransfer,
} from "./icons";

import { BlueprintIsometric } from "./BlueprintIsometric";
import campusLogo from "./assets/logo.png";

// ─── Tap-ripple animation ──────────────────────────────────────────────────────
const RIPPLE_STYLE = `
  @keyframes smartnav-ripple {
    0%   { r: 0;  opacity: 0.55; }
    60%  { r: 38; opacity: 0.25; }
    100% { r: 60; opacity: 0;    }
  }
  .smartnav-ripple-circle { animation: smartnav-ripple 200ms ease-out forwards; pointer-events: none; }

  @keyframes smartnav-path-draw {
    from { stroke-dashoffset: var(--path-len); }
    to   { stroke-dashoffset: 0; }
  }
  .smartnav-path-anim {
    animation: smartnav-path-draw 1s cubic-bezier(0.4,0,0.2,1) forwards;
    stroke-dasharray: var(--path-len);
    stroke-dashoffset: var(--path-len);
  }

  @keyframes smartnav-modal-in {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  .smartnav-modal { animation: smartnav-modal-in 180ms cubic-bezier(0.34,1.56,0.64,1) forwards; }

  @keyframes smartnav-stair-flash {
    0%   { opacity: 0;    transform: scale(0.7); }
    18%  { opacity: 1;    transform: scale(1.08); }
    70%  { opacity: 1;    transform: scale(1.0); }
    100% { opacity: 0;    transform: scale(0.9); }
  }
  .smartnav-stair-flash { animation: smartnav-stair-flash 900ms cubic-bezier(0.34,1.56,0.64,1) forwards; pointer-events: none; }

  @keyframes smartnav-arrived-pulse {
    0%   { r: 18; opacity: 0.9; }
    60%  { r: 62; opacity: 0.4; }
    100% { r: 90; opacity: 0;   }
  }
  .smartnav-arrived-pulse { animation: smartnav-arrived-pulse 1.1s ease-out forwards; pointer-events: none; }

  @keyframes smartnav-footstep {
    0%   { opacity: 0.7; transform: scale(1); }
    100% { opacity: 0;   transform: scale(1.8); }
  }
  .smartnav-footstep { animation: smartnav-footstep 600ms ease-out forwards; pointer-events: none; }

  @keyframes sc-leg-l  { 0%,100%{transform:rotate(28deg)}  50%{transform:rotate(-22deg)} }
  @keyframes sc-leg-r  { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(28deg)}  }
  @keyframes sc-arm-l  { 0%,100%{transform:rotate(-32deg)} 50%{transform:rotate(18deg)}  }
  @keyframes sc-arm-r  { 0%,100%{transform:rotate(18deg)}  50%{transform:rotate(-32deg)} }
  @keyframes sc-body   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-3px)} }
  @keyframes sc-head   { 0%,100%{transform:rotate(-6deg)}  50%{transform:rotate(4deg)}   }
  .sc-body  { animation: sc-body  0.55s ease-in-out infinite; }
  .sc-leg-l { transform-origin: 0 0;     animation: sc-leg-l 0.55s ease-in-out infinite; }
  .sc-leg-r { transform-origin: 0 0;     animation: sc-leg-r 0.55s ease-in-out infinite; }
  .sc-arm-l { transform-origin: 0 -2px;  animation: sc-arm-l 0.55s ease-in-out infinite; }
  .sc-arm-r { transform-origin: 0 -2px;  animation: sc-arm-r 0.55s ease-in-out infinite; }
  .sc-head  { transform-origin: 0 -20px; animation: sc-head 0.55s ease-in-out infinite; }

  @keyframes voicePulse {
    0%,100% { box-shadow: 0 0 8px rgba(30,120,255,0.4); }
    50%      { box-shadow: 0 0 22px rgba(30,120,255,0.8); }
  }

  @keyframes smartnav-stair-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes smartnav-walker-pulse {
    0%   { r: 10; opacity: 0.82; stroke-width: 3.5; }
    55%  { r: 36; opacity: 0.38; stroke-width: 2;   }
    100% { r: 62; opacity: 0;    stroke-width: 1;   }
  }
  .snwp-ring-1 { animation: smartnav-walker-pulse 1.55s ease-out infinite;           pointer-events: none; }
  .snwp-ring-2 { animation: smartnav-walker-pulse 1.55s ease-out infinite 0.52s;     pointer-events: none; }
  .snwp-ring-3 { animation: smartnav-walker-pulse 1.55s ease-out infinite 1.04s;     pointer-events: none; }

  @keyframes smartnav-path-active {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -48; }
  }
  .snpa-dash { animation: smartnav-path-active 0.55s linear infinite; pointer-events: none; }

  @keyframes smartnav-halo-pulse {
    0%,100% { opacity: 0.55; r: 22; }
    50%     { opacity: 0.80; r: 28; }
  }
  .snwp-halo { animation: smartnav-halo-pulse 0.9s ease-in-out infinite; pointer-events: none; }

  /* ── Responsive / Mobile ─────────────────────────────────────────── */
  @media (max-width: 768px) {
    .snav-header {
      grid-template-columns: auto 1fr !important;
      gap: 10px !important;
      padding: 0 12px !important;
      height: 54px !important;
    }
    .snav-clock { display: none !important; }
    .snav-layout {
      grid-template-columns: 1fr !important;
      height: calc(100dvh - 54px) !important;
      padding: 8px !important;
      gap: 8px !important;
    }
    .snav-left  { display: none !important; }
    .snav-right { display: none !important; }
    .snav-center { min-height: 0; }
    .snav-bottom-toolbar { flex-wrap: wrap; justify-content: center; gap: 4px !important; }
    .snav-floor-tabs { gap: 5px !important; }
    .snav-current-step-card { width: calc(100% - 28px) !important; left: 14px !important; bottom: 14px !important; }
  }
  @media (max-width: 480px) {
    .snav-header { height: 50px !important; }
    .snav-layout { height: calc(100dvh - 50px) !important; padding: 6px !important; }
    .snav-bottom-toolbar { padding: 4px 6px !important; }
  }
`;

const MAP_VIEWBOX = { w: 1672, h: 941 };
const FLOOR_VIEWBOX = { x: 0, y: 0, w: MAP_VIEWBOX.w, h: MAP_VIEWBOX.h };
const DEFAULT_MAP_ZOOM = 0.82;
const ZOOM_MIN = 0.72;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.12;

// These drawing bounds were calibrated from the floor-plan references.
// No floor-plan image assets are rendered on the map; everything below is vector-drawn.
const FLOOR_IMAGE_META = {
  1: { x1: 0, x2: MAP_VIEWBOX.w, y1: 0, y2: MAP_VIEWBOX.h, floorScale: 1.0 },
  2: { x1: 0, x2: MAP_VIEWBOX.w, y1: 0, y2: MAP_VIEWBOX.h, floorScale: 1.0 },
  3: { x1: 0, x2: MAP_VIEWBOX.w, y1: 0, y2: MAP_VIEWBOX.h, floorScale: 1.0 },
  4: { x1: 0, x2: MAP_VIEWBOX.w, y1: 0, y2: MAP_VIEWBOX.h, floorScale: 1.0 },
  5: { x1: 0, x2: MAP_VIEWBOX.w, y1: 0, y2: MAP_VIEWBOX.h, floorScale: 1.0 },
  6: { x1: 0, x2: MAP_VIEWBOX.w, y1: 0, y2: MAP_VIEWBOX.h, floorScale: 1.0 },
};

const ROOM_STYLE_META = {
  office:    { label: "Office",    icon: iconOffice,    color: ROOM_COLORS.office },
  classroom: { label: "Classroom", icon: iconClassroom, color: ROOM_COLORS.classroom },
  lab:       { label: "Lab",       icon: iconLab,       color: ROOM_COLORS.lab },
  facility:  { label: "Facility",  icon: iconFacility,  color: ROOM_COLORS.facility },
  comfort:   { label: "Restroom",  icon: iconRestroom,  color: ROOM_COLORS.comfort },
  stair:     { label: "Stairs",    icon: iconStairs,    color: ROOM_COLORS.stair },
  lobby:     { label: "Lobby",     icon: iconLobby,     color: ROOM_COLORS.lobby },
  corridor:  { label: "Corridor",  icon: iconRoute,     color: ROOM_COLORS.corridor },
  parking:   { label: "Parking",   icon: iconParking,   color: ROOM_COLORS.parking },
  storage:   { label: "Storage",   icon: iconStorage,   color: ROOM_COLORS.storage },
  utility:   { label: "Utility",   icon: iconUtility,   color: ROOM_COLORS.utility },
  special:   { label: "Special",   icon: iconSpecial,   color: ROOM_COLORS.special },
};

const CATEGORIES = [
  { key: "office", label: "Offices", icon: iconOffice },
  { key: "classroom", label: "Classrooms", icon: iconClassroom },
  { key: "lab", label: "Labs", icon: iconLab },
  { key: "facility", label: "Facilities", icon: iconFacility },
  { key: "special", label: "Special", icon: iconSpecial },
  { key: "comfort", label: "Restrooms", icon: iconRestroom },
  { key: "storage", label: "Storage", icon: iconStorage },
  { key: "utility", label: "Utility", icon: iconUtility },
];

function AssetIcon({ src, size = 16, color = "currentColor", style = {} }) {
  // Render SVGs as normal images instead of CSS masks.
  // CSS mask can fail in some local setups and shows the icon as a solid square.
  return (
    <img
      aria-hidden="true"
      src={src}
      alt=""
      draggable="false"
      style={{
        width: size,
        height: size,
        display: "inline-block",
        flex: "0 0 auto",
        objectFit: "contain",
        opacity: 0.95,
        ...style,
      }}
    />
  );
}

function iconForStep(step) {
  if (!step) return iconInfo;
  if (step.type === "start") return iconKiosk;
  if (step.type === "arrive") return iconPin;
  if (step.type === "up") return iconArrowUp;
  if (step.type === "down") return iconArrowDown;
  return iconArrowRight;
}

const SEARCH_ALIASES = {
  toilet: ["comfort room", "cr", "restroom"],
  toilets: ["comfort room", "cr", "restroom"],
  restroom: ["comfort room", "cr"],
  restrooms: ["comfort room", "cr"],
  bathroom: ["comfort room", "cr"],
  cashier: ["finance"],
  payment: ["finance"],
  pay: ["finance"],
  clinic: ["birthing clinic"],
  nurse: ["nursing", "clinic"],
  library: ["library"],
  principal: ["principal"],
  registrar: ["registrar"],
  records: ["records"],
  computer: ["computer lab", "cis computer"],
  canteen: ["canteen"],
  food: ["canteen", "dining", "kitchen"],
  stairs: ["stair", "stairs"],
  stair: ["stair", "stairs"],
};

function searchTermsFromQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const direct = [q];
  const words = q.split(/\s+/).filter(Boolean);
  words.forEach((word) => {
    const aliases = SEARCH_ALIASES[word];
    if (aliases) direct.push(...aliases);
  });
  return Array.from(new Set(direct));
}

function searchableRoomText(room) {
  const meta = ROOM_STYLE_META[room.type] ?? ROOM_STYLE_META.office;
  const extra = [];
  if (room.type === "comfort") extra.push("toilet restroom bathroom cr comfort room");
  if (room.name.toLowerCase().includes("finance")) extra.push("cashier payment pay billing");
  if (room.name.toLowerCase().includes("canteen")) extra.push("food dining eat cafeteria");
  if (room.name.toLowerCase().includes("clinic")) extra.push("nurse health medical");
  if (room.type === "lab") extra.push("laboratory lab");
  return `${room.name} ${room.type} ${meta.label} floor ${room.floor} f${room.floor} ${extra.join(" ")}`.toLowerCase();
}

// ─── Office Hours Data ────────────────────────────────────────────────────────
const OFFICE_HOURS = {
  f1_shs_principal:   { days: "Mon–Fri", hours: "7:30 AM – 5:00 PM" },
  f1_shs_faculty:     { days: "Mon–Fri", hours: "7:30 AM – 5:00 PM" },
  f1_finance:         { days: "Mon–Fri", hours: "8:00 AM – 5:00 PM" },
  f1_registrar:       { days: "Mon–Fri", hours: "8:00 AM – 5:00 PM" },
  f1_igs_faculty:     { days: "Mon–Fri", hours: "7:30 AM – 5:00 PM" },
  f1_discipline:      { days: "Mon–Fri", hours: "8:00 AM – 5:00 PM" },
  f1_birthing_clinic: { days: "Mon–Fri", hours: "8:00 AM – 5:00 PM" },
  f1_canteen:         { days: "Mon–Sat", hours: "6:30 AM – 5:30 PM" },
  f1_bookstore:       { days: "Mon–Fri", hours: "7:30 AM – 5:00 PM" },
  f2_ssc:             { days: "Mon–Fri", hours: "8:00 AM – 5:00 PM" },
};

const KIOSK_FLOOR = 1;
const DEFAULT_KIOSK_NODE = KIOSK_POSITIONS[KIOSK_FLOOR] ?? "f1_lobby_sc_door";

const STAIR_NODE_SUFFIX = {
  n00: "left",
  n06: "center",
  n14: "right",
  sc: "center",   // interior center-stair nodes (f{N}_sc) placed inside the stair block
};



function compactRoomName(name) {
  return name
    .replace("Comfort Room", "CR")
    .replace("College ", "")
    .replace("School Laboratory", "Lab")
    .replace("Electrical / Dressing Rm", "Electrical / Dressing");
}

function ordinal(n) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function zoomedViewBox(zoom = DEFAULT_MAP_ZOOM) {
  const safeZoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  const w = FLOOR_VIEWBOX.w / safeZoom;
  const h = FLOOR_VIEWBOX.h / safeZoom;
  const x = FLOOR_VIEWBOX.x + (FLOOR_VIEWBOX.w - w) / 2;
  const y = FLOOR_VIEWBOX.y + (FLOOR_VIEWBOX.h - h) / 2;
  return `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

// Per-floor viewBox: zooms into each floor's actual bounds so every floor
// fills its card at the same visual scale, with consistent padding.
function floorBoundsViewBox(floor, zoom = DEFAULT_MAP_ZOOM, pan = { x: 0, y: 0 }) {
  const bounds = floor.bounds;
  if (!bounds) return zoomedViewBox(zoom);
  const PAD = 60;
  const bx = bounds.x1 - PAD;
  const by = bounds.y1 - PAD;
  const bw = (bounds.x2 - bounds.x1) + PAD * 2;
  const bh = (bounds.y2 - bounds.y1) + PAD * 2;
  const safeZoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  const zw = bw / safeZoom;
  const zh = bh / safeZoom;
  const zx = bx + (bw - zw) / 2 - (pan?.x ?? 0);
  const zy = by + (bh - zh) / 2 - (pan?.y ?? 0);
  return `${zx.toFixed(1)} ${zy.toFixed(1)} ${zw.toFixed(1)} ${zh.toFixed(1)}`;
}

// Camera-follow viewBox: centres tightly on walker position during walk animation.
// zoom is the follow zoom multiplier (higher = more zoomed in).
const FOLLOW_ZOOM = 3.2;   // how much to zoom in while following
const FOLLOW_ASPECT = 16 / 9; // w:h ratio of the viewport
function walkerFollowViewBox(floor, wx, wy, zoom = DEFAULT_MAP_ZOOM) {
  const bounds = floor.bounds;
  if (!bounds || wx == null || wy == null) return floorBoundsViewBox(floor, zoom);
  const PAD = 60;
  const floorW = (bounds.x2 - bounds.x1) + PAD * 2;
  const floorH = (bounds.y2 - bounds.y1) + PAD * 2;
  // Tile dimensions at follow zoom
  const vw = floorW / FOLLOW_ZOOM;
  const vh = vw / FOLLOW_ASPECT;
  // Clamp so we don't pan outside the floor bounds
  const minX = bounds.x1 - PAD;
  const minY = bounds.y1 - PAD;
  const maxX = bounds.x2 + PAD;
  const maxY = bounds.y2 + PAD;
  const cx = clamp(wx, minX + vw / 2, maxX - vw / 2);
  const cy = clamp(wy, minY + vh / 2, maxY - vh / 2);
  return `${(cx - vw / 2).toFixed(1)} ${(cy - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
}

function stairKeyFromNodeId(nodeId = "") {
  if (nodeId.includes("elevator_a")) return "elevator_a";
  if (nodeId.includes("elevator_b")) return "elevator_b";
  const suffix = nodeId.split("_").at(-1);
  return STAIR_NODE_SUFFIX[suffix] ?? null;
}

function stairNameFromNodeId(nodeId = "") {
  if (nodeId.includes("elevator_a")) return "Elevator A";
  if (nodeId.includes("elevator_b")) return "Elevator B";
  const key = stairKeyFromNodeId(nodeId);
  if (!key) return "Stairs";
  return `${key.charAt(0).toUpperCase()}${key.slice(1)} Stairs`;
}

function getFloorById(floorId) {
  return FLOORS.find((floor) => floor.id === floorId) ?? FLOORS[0];
}

function mapPoint(node, options = {}) {
  if (!node) return { x: 0, y: 0 };
  const { useStairMarker = false } = options;
  const meta = FLOOR_IMAGE_META[node.floor] ?? FLOOR_IMAGE_META[1];

  if (BUILDING.coordinateMode === "image-pixel") {
    return { x: node.x, y: node.z };
  }

  const x = meta.x1 + (node.x / BUILDING.width) * (meta.x2 - meta.x1);
  const y = meta.y1 + (node.z / getFloorDepth(node.floor)) * (meta.y2 - meta.y1);
  return { x, y };
}

function roomRect(room) {
  if (BUILDING.coordinateMode === "image-pixel") {
    return { x: room.x, y: room.z, w: room.w, h: room.d };
  }
  const meta = FLOOR_IMAGE_META[room.floor] ?? FLOOR_IMAGE_META[1];
  return {
    x: meta.x1 + (room.x / BUILDING.width) * (meta.x2 - meta.x1),
    y: meta.y1 + (room.z / getFloorDepth(room.floor)) * (meta.y2 - meta.y1),
    w: (room.w / BUILDING.width) * (meta.x2 - meta.x1),
    h: (room.d / getFloorDepth(room.floor)) * (meta.y2 - meta.y1),
  };
}

function roomCenterNode(room) {
  if (!room) return null;
  return {
    id: `${room.id}_inside`,
    floor: room.floor,
    x: room.x + room.w / 2,
    z: room.z + room.d / 2,
    roomInside: true,
  };
}

function distanceForPath(path) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    const a = getNode(path[i - 1]);
    const b = getNode(path[i]);
    if (!a || !b) continue;
    total += Math.hypot(b.x - a.x, (b.floor - a.floor) * 8, b.z - a.z);
  }
  return total;
}

function routeFloorsFromPath(path) {
  const set = new Set();
  path.forEach((nodeId) => {
    const node = getNode(nodeId);
    if (node) set.add(node.floor);
  });
  return Array.from(set).sort((a, b) => a - b);
}

function floorChangesFromPath(path) {
  const changes = [];
  for (let i = 1; i < path.length; i += 1) {
    const prev = getNode(path[i - 1]);
    const curr = getNode(path[i]);
    if (!prev || !curr || prev.floor === curr.floor) continue;
    changes.push({
      fromFloor: prev.floor,
      toFloor: curr.floor,
      direction: curr.floor > prev.floor ? "up" : "down",
      fromNodeId: path[i - 1],
      toNodeId: path[i],
      stairName: stairNameFromNodeId(path[i - 1]),
      stairKey: stairKeyFromNodeId(path[i - 1]),
    });
  }
  return changes;
}

function routeSegmentsForFloor(path, floorId, destination = null) {
  const segments = [];
  let current = [];

  path.forEach((nodeId) => {
    const node = getNode(nodeId);
    if (!node) return;
    if (node.floor === floorId) {
      current.push({ ...node, id: nodeId });
      return;
    }
    if (current.length > 1) segments.push(current);
    current = [];
  });

  if (current.length > 1) segments.push(current);

  // Extend the visible blue line through the door and into the selected room,
  // instead of stopping at the corridor/door waypoint.
  const lastNode = path.length ? getNode(path[path.length - 1]) : null;
  const targetCenter = destination?.floor === floorId ? roomCenterNode(destination) : null;
  if (targetCenter && lastNode?.floor === floorId && segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const lastPoint = lastSegment[lastSegment.length - 1];
    const alreadyAtCenter = Math.abs((lastPoint?.x ?? 0) - targetCenter.x) < 0.01
      && Math.abs((lastPoint?.z ?? 0) - targetCenter.z) < 0.01;
    if (!alreadyAtCenter) segments[segments.length - 1] = [...lastSegment, targetCenter];
  }

  return segments;
}

function makePolyline(points, floorChangeEndpointIds = new Set()) {
  return points.map((node) => {
    const p = mapPoint(node, { useStairMarker: floorChangeEndpointIds.has(node.id) });
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

function routeDistanceMeters(route) {
  return Math.max(0, Math.round(distanceForPath(route) * 1.3));
}

function nearestRoomToNode(node, excludeRoomId = null) {
  if (!node) return null;
  const floor = getFloorById(node.floor);
  let best = null;
  let bestDist = Infinity;
  floor.rooms.forEach((room) => {
    if (room.id === excludeRoomId) return;
    const cx = room.x + room.w / 2;
    const cz = room.z + room.d / 2;
    const dist = Math.hypot(cx - node.x, cz - node.z);
    if (dist < bestDist) {
      best = room;
      bestDist = dist;
    }
  });
  return best;
}

function landmarkNearNode(nodeId, excludeRoomId = null) {
  const node = getNode(nodeId);
  const room = nearestRoomToNode(node, excludeRoomId);
  return room ? compactRoomName(room.name) : null;
}

function pathDirectionText(fromNodeId, toNodeId) {
  const a = getNode(fromNodeId);
  const b = getNode(toNodeId);
  if (!a || !b) return "Follow the highlighted hallway";
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (Math.abs(dx) > Math.abs(dz)) return dx >= 0 ? "Walk right along the hallway" : "Walk left along the hallway";
  return dz >= 0 ? "Move toward the lower hallway" : "Move toward the upper hallway";
}

function buildNavigationSteps(route, destination, startInfo = {}) {
  if (!destination || route.length === 0) return [];
  const changes = floorChangesFromPath(route);
  const steps = [];
  const startFloor = startInfo.floor ?? KIOSK_FLOOR;
  const startLabel = startInfo.type === "room" ? startInfo.label : "Start";

  // Step 1: Start
  steps.push({
    type: "start",
    floor: startFloor,
    title: `Start at ${startLabel}`,
    sub: `${ordinal(startFloor)} Floor · You are here`,
    icon: "●",
  });

  if (changes.length === 0) {
    // Same-floor route — just arrive directly
    steps.push({
      type: "arrive",
      floor: destination.floor,
      title: `Arrive at ${destination.name}`,
      sub: `${ROOM_STYLE_META[destination.type]?.label ?? "Room"} · ${ordinal(destination.floor)} Floor · Follow the blue path`,
      icon: "◆",
    });
    return steps;
  }

  // Collapse consecutive same-direction stair runs into a single step.
  // e.g. F1→F2→F3→F4→F5→F6 via the same staircase = one "Take Right Stairs to 6th Floor".
  const groupedChanges = [];
  changes.forEach((change) => {
    const last = groupedChanges[groupedChanges.length - 1];
    if (
      last &&
      last.direction === change.direction &&
      last.stairKey === change.stairKey &&
      last.toFloor === change.fromFloor
    ) {
      // Extend the existing group to cover this extra floor
      last.toFloor = change.toFloor;
    } else {
      groupedChanges.push({ ...change });
    }
  });

  groupedChanges.forEach((change) => {
    const spanning = change.toFloor !== change.fromFloor + (change.direction === "up" ? 1 : -1);
    const subLabel = spanning
      ? `${ordinal(change.fromFloor)} Floor → ${ordinal(change.toFloor)} Floor`
      : `${ordinal(change.fromFloor)} Floor → ${ordinal(change.toFloor)} Floor`;
    steps.push({
      type: change.direction,
      floor: change.fromFloor,
      nextFloor: change.toFloor,
      title: `Take ${change.stairName} to ${ordinal(change.toFloor)} Floor`,
      sub: subLabel,
      icon: change.direction === "up" ? "↑" : "↓",
    });
  });

  // Final: arrive
  steps.push({
    type: "arrive",
    floor: destination.floor,
    title: `Arrive at ${destination.name}`,
    sub: `${ROOM_STYLE_META[destination.type]?.label ?? "Room"} · ${ordinal(destination.floor)} Floor`,
    icon: "◆",
  });

  return steps;
}

function RouteArrow({ from, to, floorChangeEndpointIds }) {
  const p1 = mapPoint(from, { useStairMarker: floorChangeEndpointIds.has(from.id) });
  const p2 = mapPoint(to, { useStairMarker: floorChangeEndpointIds.has(to.id) });
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 86) return null;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const x = p1.x + dx * 0.62;
  const y = p1.y + dy * 0.62;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`} pointerEvents="none" opacity="0.95">
      <path d="M -7 -6 L 7 0 L -7 6" fill="none" stroke="#2563eb" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function CurrentStepCard({ step, index, total, onPrev, onNext, canPrev, canNext, onExit }) {
  if (!step) return null;
  return (
    <div style={S.currentStepCard}>
      <div style={S.currentStepTopline}>STEP {index + 1} OF {total}</div>
      <div style={S.currentStepTitle}>{step.title}</div>
      <div style={S.currentStepSub}>{step.sub}</div>
      <div style={S.currentStepActions}>
        <button type="button" style={S.currentStepButton} onClick={onPrev} disabled={!canPrev}>Back</button>
        <button type="button" style={{ ...S.currentStepButton, ...S.currentStepButtonPrimary }} onClick={onNext} disabled={!canNext}>Next</button>
        <button type="button" style={S.currentStepButtonGhost} onClick={onExit}>Overview</button>
      </div>
    </div>
  );
}




function MapMarker({ x, y, type, label, animOffset = 0 }) {
  const isStart = type === "start";
  const isDestination = type === "destination";
  const markerColor = isStart ? "#2563eb" : "#111827";
  const pulse = 12 + ((animOffset % 120) / 120) * 10;

  if (isDestination) {
    return (
      <g pointerEvents="none">
        <circle cx={x} cy={y} r="4.5" fill="#111827" opacity="0.20" />
        <image href={wayDestinationPin} x={x - 16} y={y - 42} width="32" height="42" opacity="0.98" />
        <g transform={`translate(${x + 18}, ${y - 26})`}>
          <rect width="56" height="21" rx="10.5" fill="rgba(255,255,255,0.94)" stroke="#111827" strokeWidth="1.2" />
          <text x="28" y="14.5" textAnchor="middle" fontSize="10.5" fill="#111827" fontWeight="850" letterSpacing="0.9">
            {label}
          </text>
        </g>
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      {isStart && <circle cx={x} cy={y} r={pulse} fill="none" stroke="#2563eb" strokeWidth="1.8" opacity="0.20" />}
      <image href={isStart ? wayStartDot : wayKioskDot} x={x - 14} y={y - 14} width="28" height="28" opacity="0.98" />
      <g transform={`translate(${x + 16}, ${y + 9})`}>
        <rect width="58" height="21" rx="10.5" fill="rgba(255,255,255,0.94)" stroke={markerColor} strokeWidth="1.2" />
        <text x="29" y="14.5" textAnchor="middle" fontSize="10.5" fill="#111827" fontWeight="850" letterSpacing="0.8">
          {label}
        </text>
      </g>
    </g>
  );
}

function WaypointLabel({ x, y, text, tone = "blue" }) {
  const isTransfer = tone === "purple";
  const isStair = tone === "orange";
  const stroke = isStair ? "#111827" : isTransfer ? "#2563eb" : "#2563eb";
  const icon = isStair ? wayStairsUp : isTransfer ? wayFloorTransfer : wayStartDot;
  return (
    <g pointerEvents="none">
      <image href={icon} x={x - 13} y={y - 13} width="26" height="26" opacity="0.98" />
      <g transform={`translate(${x + 17}, ${y - 12})`}>
        <rect width={Math.max(70, text.length * 7.2)} height="24" rx="12" fill="rgba(255,255,255,0.92)" stroke={stroke} strokeWidth="1.2" />
        <text x="12" y="16" fontSize="10.8" fill="#111827" fontWeight="850" letterSpacing="0.35">
          {text}
        </text>
      </g>
    </g>
  );
}


function getFloorDepth(floorId) {
  if (BUILDING.coordinateMode === "image-pixel") return BUILDING.depth;
  const floor = getFloorById(floorId);
  const roomDepth = Math.max(...floor.rooms.map((room) => room.z + room.d), BUILDING.depth);
  return roomDepth;
}

function roomFill(type, isDestination, isHovered) {
  if (isDestination) return "rgba(255,255,255,0.82)";
  const base = ROOM_COLORS[type] ?? ROOM_COLORS.office;
  const alpha = isHovered ? "0.92" : "0.78";
  return hexToRgba(base, alpha);
}

function hexToRgba(hex, alpha = "0.65") {
  const clean = String(hex).replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function splitLabel(label, width) {
  const words = label.split(/\s+/).filter(Boolean);
  const maxChars = Math.max(7, Math.floor(width / 12));
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

// ─── Floor 1 Architectural Detail Overlay ─────────────────────────────────────
// Column x grid (px, from buildingData.js calibration):
const F1_COL = [16, 132, 244, 355, 467, 578, 689, 852, 963, 1074, 1186, 1297, 1409, 1483, 1539, 1655];
// Row y grid:
const F1_ROW = { A: 222, B: 383, C: 479, D: 640 };
// Exit positions (x center of door gap, y = wall face)
const F1_EXITS = [
  { id: 'Exit 1', x: 244,  y: F1_ROW.D + 4,  dir: 'down',  labelDx: -28, labelDy: 28 },
  { id: 'Exit 2', x: 689,  y: F1_ROW.D + 4,  dir: 'down',  labelDx: -28, labelDy: 28 },
  { id: 'Exit 3', x: 771,  y: F1_ROW.D + 4,  dir: 'down',  labelDx:  10, labelDy: 28 },
  { id: 'Exit 4', x: 1597, y: F1_ROW.D + 4,  dir: 'down',  labelDx: -28, labelDy: 28 },
  { id: 'Exit 5', x: 244,  y: F1_ROW.A - 4,  dir: 'up',    labelDx: -28, labelDy: -38 },
  { id: 'Exit 6', x: 730,  y: F1_ROW.A - 4,  dir: 'up',    labelDx: -28, labelDy: -38 },
];

function Floor1Details() {
  // Structural column circles
  const colCircles = F1_COL.map((cx, i) => (
    <g key={`col-${i}`} pointerEvents="none">
      <circle cx={cx} cy={F1_ROW.A - 52} r={17} fill="white" stroke="rgba(50,50,80,0.72)" strokeWidth="2.2" />
      <text x={cx} y={F1_ROW.A - 46} textAnchor="middle" fontSize="14" fill="#1e293b" fontWeight="800" dy="4">{i + 1}</text>
    </g>
  ));

  // Row labels (left side)
  const rowLabels = Object.entries(F1_ROW).map(([label, y]) => (
    <g key={`row-${label}`} pointerEvents="none">
      <circle cx={F1_COL[0] - 42} cy={y} r={17} fill="white" stroke="rgba(50,50,80,0.72)" strokeWidth="2.2" />
      <text x={F1_COL[0] - 42} y={y + 5} textAnchor="middle" fontSize="14" fill="#1e293b" fontWeight="800">{label}</text>
    </g>
  ));

  // Structural grid lines (light, behind rooms)
  const gridLines = [];
  F1_COL.forEach((cx, i) => {
    gridLines.push(
      <line key={`vcol-${i}`} x1={cx} y1={F1_ROW.A} x2={cx} y2={F1_ROW.D}
        stroke="rgba(100,116,139,0.13)" strokeWidth="1.2" strokeDasharray="6 8" pointerEvents="none" />
    );
  });
  [F1_ROW.A, F1_ROW.B, F1_ROW.C, F1_ROW.D].forEach((ry, i) => {
    gridLines.push(
      <line key={`hrow-${i}`} x1={F1_COL[0]} y1={ry} x2={F1_COL[15]} y2={ry}
        stroke="rgba(100,116,139,0.20)" strokeWidth="1.8" pointerEvents="none" />
    );
  });

  // Structural outer wall (thick double-line)
  const wallX1 = F1_COL[0], wallX2 = F1_COL[15];
  const wallY1 = F1_ROW.A, wallY2 = F1_ROW.D;
  const wallW = wallX2 - wallX1, wallH = wallY2 - wallY1;

  // Inter-room wall lines (vertical partitions between rooms on same row)
  const northWalls = [F1_COL[1], F1_COL[1]+24, F1_COL[2], F1_COL[6], F1_COL[7], F1_COL[8], F1_COL[9], F1_COL[10], F1_COL[11], F1_COL[12], F1_COL[13], F1_COL[13]+28, F1_COL[13]+56, F1_COL[14]];
  // South wall positions updated to match revised room layout:
  // discipline(82)→771 | stair_mid(81)→852 | lobby_sc(81)→933 | class4(95)→1028 |
  // stair_center(95)→1123 | class6(96)→1219 | class7(95)→1314 | class8(95)→1409
  const southWalls = [F1_COL[1], F1_COL[2], F1_COL[3], F1_COL[4], F1_COL[5], F1_COL[6],
    771, 852, 933, 1028, 1123, 1219, 1314,
    F1_COL[12], F1_COL[13], F1_COL[13]+56, F1_COL[14]];

  const wallLines = [];
  northWalls.forEach((wx, i) => {
    wallLines.push(
      <line key={`nw-${i}`} x1={wx} y1={F1_ROW.A} x2={wx} y2={F1_ROW.B}
        stroke="rgba(71,85,105,0.45)" strokeWidth="3.5" strokeLinecap="square" pointerEvents="none" />
    );
  });
  southWalls.forEach((wx, i) => {
    wallLines.push(
      <line key={`sw-${i}`} x1={wx} y1={F1_ROW.C} x2={wx} y2={F1_ROW.D}
        stroke="rgba(71,85,105,0.45)" strokeWidth="3.5" strokeLinecap="square" pointerEvents="none" />
    );
  });

  // Dimension ticks top (column widths)
  const dimTicks = [];
  const colWidthsMm = [9400,9000,9000,9000,9000,9000,13100,9000,9000,9000,9000,9000,6000,4500,9400];
  for (let i = 0; i < F1_COL.length - 1; i++) {
    const mx = (F1_COL[i] + F1_COL[i + 1]) / 2;
    const ty = F1_ROW.A - 82;
    dimTicks.push(
      <g key={`dim-${i}`} pointerEvents="none">
        <line x1={F1_COL[i]+2} y1={ty+4} x2={F1_COL[i+1]-2} y2={ty+4} stroke="rgba(220,38,38,0.70)" strokeWidth="1.4" markerEnd="url(#dimArrow)" />
        <line x1={F1_COL[i]} y1={ty-6} x2={F1_COL[i]} y2={ty+14} stroke="rgba(220,38,38,0.55)" strokeWidth="1.2" />
        <line x1={F1_COL[i+1]} y1={ty-6} x2={F1_COL[i+1]} y2={ty+14} stroke="rgba(220,38,38,0.55)" strokeWidth="1.2" />
        <text x={mx} y={ty - 2} textAnchor="middle" fontSize="11" fill="rgba(220,38,38,0.88)" fontWeight="700">{(colWidthsMm[i]/1000).toFixed(colWidthsMm[i]%1000===0?0:1).replace('.0','')}k</text>
      </g>
    );
  }

  // Exit signs
  const exitSigns = F1_EXITS.map(exit => {
    const arrowUp = exit.dir === 'up';
    const ax = exit.x, ay = exit.y + (arrowUp ? -14 : 14);
    const aPoints = arrowUp
      ? `${ax},${ay - 16} ${ax - 10},${ay} ${ax + 10},${ay}`
      : `${ax},${ay + 16} ${ax - 10},${ay} ${ax + 10},${ay}`;
    return (
      <g key={exit.id} pointerEvents="none">
        {/* Arrow indicator */}
        <polygon points={aPoints} fill="rgba(220,38,38,0.85)" />
        {/* Exit badge */}
        <rect
          x={exit.x + exit.labelDx - 4}
          y={arrowUp ? exit.y - 80 : exit.y + 38}
          width="68" height="26" rx="13"
          fill="rgba(220,38,38,0.92)"
          stroke="white" strokeWidth="1.6"
        />
        <text
          x={exit.x + exit.labelDx + 30}
          y={arrowUp ? exit.y - 62 : exit.y + 56}
          textAnchor="middle" fontSize="11.5" fill="white" fontWeight="900" letterSpacing="0.6"
        >{exit.id.toUpperCase()}</text>
      </g>
    );
  });

  // Security Cluster box (in hallway, at center lobby south area)
  const scx = 730, scy = (F1_ROW.B + F1_ROW.C) / 2;
  const securityCluster = (
    <g key="security-cluster" pointerEvents="none">
      <rect x={scx - 28} y={scy - 22} width="56" height="44" rx="5"
        fill="rgba(241,245,249,0.96)" stroke="rgba(71,85,105,0.55)" strokeWidth="2" />
      <text x={scx} y={scy - 6} textAnchor="middle" fontSize="8.5" fill="#374151" fontWeight="800">SECURITY</text>
      <text x={scx} y={scy + 6} textAnchor="middle" fontSize="8.5" fill="#374151" fontWeight="800">CLUSTER</text>
    </g>
  );

  // CORRIDOR labels at south lobby areas
  const corridorLabels = [
    { x: 286, y: F1_ROW.D - 8 },
    { x: 1500, y: F1_ROW.D - 8 },
  ].map((pos, i) => (
    <g key={`corridor-${i}`} pointerEvents="none">
      <text x={pos.x} y={pos.y} textAnchor="middle" fontSize="10" fill="rgba(71,85,105,0.72)"
        fontWeight="800" letterSpacing="4">CORRIDOR</text>
    </g>
  ));

  // South exterior corridors/overhangs (the hatched area below the building in the plan)
  const exteriorCorridor = (
    <g key="ext-corridor" pointerEvents="none">
      {/* Left exterior corridor hatch */}
      <rect x={F1_COL[0]} y={F1_ROW.D} width={F1_COL[2] - F1_COL[0]} height={58} rx="0"
        fill="rgba(229,231,235,0.60)" stroke="rgba(100,116,139,0.30)" strokeWidth="1.5" />
      {/* Hatch lines */}
      {Array.from({length:6},(_,i)=>(
        <line key={`hatch-l-${i}`}
          x1={F1_COL[0]+4} y1={F1_ROW.D+i*10+8} x2={F1_COL[2]-4} y2={F1_ROW.D+i*10+8}
          stroke="rgba(100,116,139,0.22)" strokeWidth="1.2" />
      ))}
      {/* Right exterior corridor hatch */}
      <rect x={F1_COL[13]} y={F1_ROW.D} width={F1_COL[15] - F1_COL[13]} height={58} rx="0"
        fill="rgba(229,231,235,0.60)" stroke="rgba(100,116,139,0.30)" strokeWidth="1.5" />
      {Array.from({length:6},(_,i)=>(
        <line key={`hatch-r-${i}`}
          x1={F1_COL[13]+4} y1={F1_ROW.D+i*10+8} x2={F1_COL[15]-4} y2={F1_ROW.D+i*10+8}
          stroke="rgba(100,116,139,0.22)" strokeWidth="1.2" />
      ))}
      {/* Central south exterior (fountain/ramp area) */}
      <ellipse cx={(F1_COL[4]+F1_COL[6])/2} cy={F1_ROW.D+36} rx={76} ry={32}
        fill="rgba(219,234,254,0.45)" stroke="rgba(147,197,253,0.60)" strokeWidth="2" />
    </g>
  );

  // Parking area (right side, below D row)
  const parkingArea = (
    <g key="parking" pointerEvents="none">
      <rect x={F1_COL[7]} y={F1_ROW.D} width={F1_COL[12] - F1_COL[7]} height={68} rx="6"
        fill="rgba(229,231,235,0.72)" stroke="rgba(100,116,139,0.35)" strokeWidth="2" />
      {/* Parking stall lines */}
      {Array.from({length:9},(_,i) => {
        const px = F1_COL[7] + 14 + i * ((F1_COL[12]-F1_COL[7]-28)/9);
        return <line key={`pk-${i}`} x1={px} y1={F1_ROW.D+6} x2={px} y2={F1_ROW.D+62}
          stroke="rgba(100,116,139,0.35)" strokeWidth="1.8" />;
      })}
      <text x={(F1_COL[7]+F1_COL[12])/2} y={F1_ROW.D+42} textAnchor="middle"
        fontSize="18" fill="rgba(71,85,105,0.45)" fontWeight="900" letterSpacing="10">PARKING</text>
    </g>
  );

  // ── Hallway cross-tick marks (door positions on hallway walls)


  const hallTicks = [];
  const northDoorXs = [244, 355, 467, 578, 730, 852, 963, 1074, 1186, 1297, 1409];
  const southDoorXs = [355, 467, 578, 689, 771, 852, 963, 1074, 1186, 1297, 1409, 1539];
  northDoorXs.forEach((dx, i) => {
    hallTicks.push(
      <line key={`nt-${i}`} x1={dx} y1={F1_ROW.B - 2} x2={dx} y2={F1_ROW.B + 10}
        stroke="rgba(71,85,105,0.38)" strokeWidth="2.5" pointerEvents="none" />
    );
  });
  southDoorXs.forEach((dx, i) => {
    hallTicks.push(
      <line key={`st-${i}`} x1={dx} y1={F1_ROW.C - 10} x2={dx} y2={F1_ROW.C + 2}
        stroke="rgba(71,85,105,0.38)" strokeWidth="2.5" pointerEvents="none" />
    );
  });

  return (
    <g id="floor1-details">
      <defs>
        <marker id="dimArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(220,38,38,0.70)" />
        </marker>
      </defs>
      {gridLines}
      {wallLines}
      {hallTicks}
      {dimTicks}
      {colCircles}
      {rowLabels}
      {exteriorCorridor}
      {parkingArea}
      {securityCluster}
      {corridorLabels}
    </g>
  );
}

// ─── Room Info Modal ─────────────────────────────────────────────────────────
function RoomModal({ room, onNavigate, onClose, isSettingLocation, dbRoomData }) {
  if (!room) return null;
  const meta = ROOM_STYLE_META[room.type] ?? ROOM_STYLE_META.office;
  const hours = OFFICE_HOURS[room.id];
  const roomCode = room.id.toUpperCase().replace(/_/g, "-");
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(15,23,42,0.38)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        className="smartnav-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: 340,
          boxShadow: "0 24px 64px rgba(15,23,42,0.24), 0 8px 24px rgba(37,99,235,0.12)",
          overflow: "hidden",
          fontFamily: "inherit",
        }}
      >
        {/* Room photo (Feature: room photos) */}
        {dbRoomData?.photoUrl && (
          <div style={{ position: "relative", height: 140, overflow: "hidden" }}>
            <img
              src={dbRoomData.photoUrl}
              alt={room.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute", top: 10, right: 10,
                width: 28, height: 28, borderRadius: 999,
                border: "none", background: "rgba(0,0,0,0.45)",
                cursor: "pointer", display: "grid", placeItems: "center",
                fontSize: 14, color: "#fff", fontWeight: 900,
              }}
            >×</button>
          </div>
        )}

        {/* Color header strip */}
        <div style={{ background: meta.color, padding: "18px 20px 14px", position: "relative" }}>
          {!dbRoomData?.photoUrl && (
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute", top: 12, right: 12,
                width: 28, height: 28, borderRadius: 999,
                border: "none", background: "rgba(255,255,255,0.35)",
                cursor: "pointer", display: "grid", placeItems: "center",
                fontSize: 14, color: "#374151", fontWeight: 900,
              }}
            >×</button>
          )}
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#374151", opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
            {room.name}
          </div>
        </div>

        {/* Info body */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(37,99,235,0.08)", color: "#2563eb",
              fontSize: 11, fontWeight: 800,
            }}>Floor {room.floor}</span>
            <span style={{
              padding: "4px 10px", borderRadius: 999,
              background: "rgba(15,23,42,0.06)", color: "#374151",
              fontSize: 11, fontWeight: 800,
            }}>{roomCode}</span>
          </div>

          {/* DB description (Feature: persistent room database) */}
          {dbRoomData?.description && (
            <div style={{
              background: "rgba(239,246,255,1)", borderRadius: 10,
              padding: "10px 14px", marginBottom: 10,
              border: "1px solid rgba(147,197,253,0.5)",
            }}>
              <div style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.5 }}>{dbRoomData.description}</div>
            </div>
          )}

          {/* Office hours — from DB if available, else local fallback */}
          {(dbRoomData?.officeHours || hours) && (
            <div style={{
              background: "rgba(249,250,251,1)", borderRadius: 10,
              padding: "10px 14px", marginBottom: 14,
              border: "1px solid rgba(226,232,240,1)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Office Hours</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{dbRoomData?.officeHours ?? hours?.hours}</div>
              {(dbRoomData?.officeDays ?? hours?.days) && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{dbRoomData?.officeDays ?? hours?.days}</div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => { onNavigate(room); onClose(); }}
              style={{
                flex: 1,
                height: 40, borderRadius: 10,
                background: "#2563eb", color: "#fff",
                border: "none", fontWeight: 800, fontSize: 13,
                cursor: "pointer", letterSpacing: 0.3,
              }}
            >
              {isSettingLocation ? "📍 Set as Location" : "🧭 Navigate Here"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40, padding: "0 14px", borderRadius: 10,
                background: "transparent", color: "#475569",
                border: "1px solid rgba(226,232,240,1)",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rich Room Interior Drawings ─────────────────────────────────────────────
// ─── helper: small desk + chair unit ─────────────────────────────────────────
const DeskUnit = ({ x, y, dw = 18, dh = 7 }) => (
  <g>
    <rect x={x} y={y} width={dw} height={dh} rx="1" fill="rgba(217,170,110,0.55)" stroke="rgba(160,110,60,0.45)" strokeWidth="0.9" />
    <rect x={x + dw / 2 - 4} y={y + dh + 2} width={8} height={6} rx="1.5" fill="rgba(148,163,184,0.40)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.7" />
  </g>
);

// ─── helper: office desk + chair ─────────────────────────────────────────────
const OfficeDeskUnit = ({ x, y, w = 22, h = 10 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="1.5" fill="rgba(186,230,253,0.45)" stroke="rgba(56,189,248,0.40)" strokeWidth="0.8" />
    <rect x={x + 2} y={y + 2} width={w * 0.5} height={h - 4} rx="1" fill="rgba(255,255,255,0.50)" stroke="rgba(56,189,248,0.25)" strokeWidth="0.5" />
    <circle cx={x + w / 2} cy={y + h + 5} r={4} fill="rgba(100,116,139,0.35)" stroke="rgba(71,85,105,0.30)" strokeWidth="0.6" />
  </g>
);

// ─── helper: small beaker ────────────────────────────────────────────────────
const Beaker = ({ x, y, hue = 200 }) => {
  const c = `hsla(${hue},65%,52%,0.60)`, s = `hsla(${hue},65%,32%,0.65)`;
  return (
    <g>
      <rect x={x - 5} y={y - 14} width={10} height={14} rx="1" fill={c} stroke={s} strokeWidth="0.7" />
      <rect x={x - 5} y={y - 6} width={10} height={6} rx="0 0 1 1" fill={`hsla(${hue},65%,48%,0.38)`} />
      <path d={`M ${x-5} ${y-14} L ${x-7} ${y-18} L ${x+7} ${y-18} L ${x+5} ${y-14}`} fill="none" stroke={s} strokeWidth="0.7" />
    </g>
  );
};

// ─── helper: monitor ─────────────────────────────────────────────────────────
const Monitor = ({ x, y, mw = 16, mh = 11 }) => (
  <g>
    <rect x={x} y={y} width={mw} height={mh} rx="1.5" fill="rgba(15,23,42,0.70)" stroke="rgba(56,189,248,0.45)" strokeWidth="0.8" />
    <rect x={x + 2} y={y + 1.5} width={mw - 4} height={mh - 4} rx="0.8" fill="rgba(56,189,248,0.20)" />
    <line x1={x + mw / 2} y1={y + mh} x2={x + mw / 2} y2={y + mh + 3} stroke="rgba(100,116,139,0.55)" strokeWidth="1" />
    <rect x={x + mw / 2 - 3} y={y + mh + 2.5} width={6} height={1.5} rx="0.5" fill="rgba(100,116,139,0.45)" />
  </g>
);

function RoomInterior({ room, r }) {
  const n = room.name.toLowerCase();
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const tooSmall = r.w < 55 || r.h < 50;

  // ── CLASSROOM ───────────────────────────────────────────────────────────────
  if (room.type === "classroom" && !tooSmall) {
    const cols = Math.max(2, Math.floor((r.w - 24) / 30));
    const rows = Math.max(1, Math.floor((r.h - 36) / 26));
    const dw = 18, dh = 7;
    const gapX = (r.w - 24) / cols;
    const gapY = (r.h - 36) / (rows + 1);
    const desks = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++)
        desks.push(<DeskUnit key={`d-${row}-${col}`}
          x={r.x + 12 + gapX * col + gapX / 2 - dw / 2}
          y={r.y + 26 + gapY * (row + 1) - dh / 2} />);
    const tw = Math.min(40, r.w * 0.44);
    return (
      <g pointerEvents="none">
        {desks}
        <rect x={cx - tw / 2} y={r.y + 8} width={tw} height={8} rx="2" fill="rgba(120,80,40,0.35)" stroke="rgba(120,80,40,0.55)" strokeWidth="1.2" />
      </g>
    );
  }

  // ── COMPUTER / CIS LAB ──────────────────────────────────────────────────────
  if (!tooSmall && (n.includes("computer") || n.includes("cis") || n.includes("digital") || n.includes("multimedia") || n.includes("game dev") || n.includes("drawing"))) {
    const cols = Math.max(1, Math.floor((r.w - 16) / 40));
    const rows = Math.max(1, Math.floor((r.h - 20) / 32));
    const mw = 16, mh = 11;
    const gapX = (r.w - 16) / cols;
    const gapY = (r.h - 20) / (rows + 1);
    const monitors = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++)
        monitors.push(<Monitor key={`m-${row}-${col}`}
          x={r.x + 8 + gapX * col + gapX / 2 - mw / 2}
          y={r.y + 12 + gapY * (row + 1) - mh / 2} />);
    return <g pointerEvents="none">{monitors}</g>;
  }

  // ── SCIENCE / CHEMISTRY / BIO / PHYSICS / NURSING SKILLS / ANA-PHYSIO ──────
  if (!tooSmall && (n.includes("chem") || n.includes("bio") || n.includes("physics") || n.includes("science") || n.includes("nursing skill") || n.includes("ana-physio") || n.includes("glassware") || n.includes("demo room"))) {
    const count = Math.max(1, Math.floor(r.w / 56));
    const spacing = r.w / (count + 1);
    const items = [];
    const hues = [200, 120, 280, 30];
    for (let i = 0; i < count; i++)
      items.push(<Beaker key={i} x={r.x + spacing * (i + 1)} y={cy + 6} hue={hues[i % 4]} />);
    items.push(<rect key="bench" x={r.x + 10} y={cy + 4} width={r.w - 20} height={3} rx="1" fill="rgba(120,113,108,0.22)" stroke="rgba(120,113,108,0.28)" strokeWidth="0.5" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── CANTEEN / DINING ─────────────────────────────────────────────────────────
  if (!tooSmall && (n.includes("canteen") || n.includes("dining"))) {
    const items = [];
    const counterH = Math.min(18, r.h * 0.25);
    items.push(<rect key="counter" x={r.x + 6} y={r.y + 6} width={r.w - 12} height={counterH} rx="3" fill="rgba(251,191,36,0.28)" stroke="rgba(217,119,6,0.48)" strokeWidth="1" />);
    // Small bowl shapes on counter
    const bowlCount = Math.min(4, Math.floor((r.w - 20) / 28));
    for (let b = 0; b < bowlCount; b++) {
      const bx = r.x + 14 + b * ((r.w - 28) / Math.max(bowlCount - 1, 1));
      items.push(<ellipse key={`bowl-${b}`} cx={bx} cy={r.y + 6 + counterH / 2} rx={6} ry={4} fill="rgba(217,119,6,0.22)" stroke="rgba(217,119,6,0.42)" strokeWidth="0.7" />);
    }
    const tableCount = Math.min(3, Math.floor((r.w - 20) / 38));
    const tableY = r.y + 6 + counterH + 16;
    if (tableY + 14 < r.y + r.h - 6) {
      for (let t = 0; t < tableCount; t++) {
        const tx = r.x + 14 + t * ((r.w - 28) / tableCount) + (r.w - 28) / (tableCount * 2);
        items.push(<circle key={`tbl-${t}`} cx={tx} cy={tableY} r={9} fill="rgba(251,191,36,0.18)" stroke="rgba(217,119,6,0.42)" strokeWidth="0.8" />);
        [[0, -13], [0, 13]].forEach(([cdx, cdy], ci) =>
          items.push(<circle key={`ch-${t}-${ci}`} cx={tx + cdx} cy={tableY + cdy} r={3} fill="rgba(180,83,9,0.23)" stroke="rgba(180,83,9,0.38)" strokeWidth="0.6" />)
        );
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── HOT / COLD KITCHEN ────────────────────────────────────────────────────────
  if (!tooSmall && (n.includes("kitchen"))) {
    const isHot = n.includes("hot");
    const items = [];
    // Stove / prep counter along top wall
    items.push(<rect key="counter" x={r.x + 6} y={r.y + 6} width={r.w - 12} height={14} rx="2" fill="rgba(100,116,139,0.22)" stroke="rgba(100,116,139,0.38)" strokeWidth="0.8" />);
    // Burner circles (hot) or cutting-board lines (cold)
    const slots = Math.min(4, Math.floor((r.w - 20) / 22));
    for (let i = 0; i < slots; i++) {
      const sx = r.x + 13 + i * ((r.w - 26) / Math.max(slots - 1, 1));
      if (isHot) {
        items.push(<circle key={`b-${i}`} cx={sx} cy={r.y + 13} r={5} fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.50)" strokeWidth="0.8" />);
        items.push(<circle key={`bi-${i}`} cx={sx} cy={r.y + 13} r={2.5} fill="rgba(239,68,68,0.30)" />);
      } else {
        items.push(<rect key={`cb-${i}`} x={sx - 7} y={r.y + 8} width={14} height={9} rx="1" fill="rgba(226,232,240,0.50)" stroke="rgba(148,163,184,0.45)" strokeWidth="0.7" />);
      }
    }
    // Central prep table
    items.push(<rect key="table" x={r.x + 12} y={cy - 6} width={r.w - 24} height={12} rx="2" fill="rgba(226,232,240,0.35)" stroke="rgba(148,163,184,0.35)" strokeWidth="0.7" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── BOOKSTORE ────────────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("bookstore")) {
    const shelves = [];
    const shelfCount = Math.max(2, Math.floor(r.h / 28));
    const bookColors = ["rgba(239,68,68,0.55)", "rgba(37,99,235,0.55)", "rgba(34,197,94,0.55)", "rgba(245,158,11,0.55)", "rgba(168,85,247,0.55)", "rgba(20,184,166,0.55)"];
    for (let s = 0; s < shelfCount - 1; s++) {
      const sy = r.y + 10 + s * ((r.h - 16) / shelfCount);
      shelves.push(<rect key={`shelf-${s}`} x={r.x + 6} y={sy + 10} width={r.w - 12} height={2.5} rx="0.5" fill="rgba(120,113,108,0.40)" />);
      const bookCount = Math.floor((r.w - 14) / 14);
      for (let b = 0; b < bookCount; b++) {
        const bh = 8 + (b % 3) * 2;
        shelves.push(<rect key={`book-${s}-${b}`} x={r.x + 7 + b * 14} y={sy + 10 - bh} width={10} height={bh} rx="0.5" fill={bookColors[(s * 2 + b) % bookColors.length]} stroke="rgba(0,0,0,0.10)" strokeWidth="0.4" />);
      }
    }
    shelves.push(<rect key="counter" x={r.x + 8} y={cy - 5} width={Math.min(30, r.w - 16)} height={10} rx="2" fill="rgba(251,191,36,0.25)" stroke="rgba(217,119,6,0.40)" strokeWidth="0.8" />);
    return <g pointerEvents="none">{shelves}</g>;
  }

  // ── LIBRARY ──────────────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("library")) {
    const items = [];
    const bookColors = ["rgba(239,68,68,0.50)", "rgba(37,99,235,0.50)", "rgba(34,197,94,0.50)", "rgba(245,158,11,0.50)", "rgba(168,85,247,0.50)"];
    // Two shelf rows at top and bottom
    [[r.y + 8, true], [r.y + r.h - 22, false]].forEach(([sy, top], ri) => {
      items.push(<rect key={`shelf-${ri}`} x={r.x + 6} y={sy + (top ? 10 : 0)} width={r.w - 12} height={2.5} rx="0.5" fill="rgba(120,113,108,0.38)" />);
      const bookCount = Math.floor((r.w - 14) / 12);
      for (let b = 0; b < bookCount; b++) {
        const bh = 7 + (b % 3) * 2;
        const by = top ? sy + 10 - bh : sy - bh + 2;
        items.push(<rect key={`book-${ri}-${b}`} x={r.x + 7 + b * 12} y={by} width={8} height={bh} rx="0.5" fill={bookColors[(ri * 3 + b) % bookColors.length]} stroke="rgba(0,0,0,0.10)" strokeWidth="0.4" />);
      }
    });
    // Reading tables in center
    const tableCount = Math.min(2, Math.floor((r.w - 30) / 60));
    for (let t = 0; t < tableCount; t++) {
      const tx = r.x + 18 + t * ((r.w - 36) / Math.max(tableCount - 1, 1));
      items.push(<rect key={`tbl-${t}`} x={tx - 14} y={cy - 7} width={28} height={14} rx="2" fill="rgba(217,170,110,0.30)" stroke="rgba(160,110,60,0.35)" strokeWidth="0.8" />);
      [[-5, 0], [5, 0]].forEach(([cdx, cdy], ci) =>
        items.push(<circle key={`ch-${t}-${ci}`} cx={tx + cdx} cy={cy + cdy} r={4} fill="rgba(148,163,184,0.30)" stroke="rgba(100,116,139,0.30)" strokeWidth="0.5" />)
      );
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── OFFICE (generic — desk + chair grid) ─────────────────────────────────────
  if (!tooSmall && room.type === "office") {
    const items = [];
    const cols = Math.max(1, Math.floor((r.w - 16) / 36));
    const rows = Math.max(1, Math.floor((r.h - 20) / 28));
    const gapX = (r.w - 16) / cols;
    const gapY = (r.h - 20) / (rows + 1);
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++)
        items.push(<OfficeDeskUnit key={`od-${row}-${col}`}
          x={r.x + 8 + gapX * col + gapX / 2 - 11}
          y={r.y + 12 + gapY * (row + 1) - 5} />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── COMFORT ROOM (restroom) ───────────────────────────────────────────────────
  if (!tooSmall && room.type === "comfort") {
    const isMale = n.includes("male") && !n.includes("female");
    const items = [];
    const stallCount = Math.max(1, Math.floor((r.w - 16) / 24));
    const stallW = Math.min(18, (r.w - 16) / stallCount);
    for (let s = 0; s < stallCount; s++) {
      const sx = r.x + 8 + s * (stallW + 4);
      // Stall box
      items.push(<rect key={`stall-${s}`} x={sx} y={r.y + 8} width={stallW} height={r.h * 0.45} rx="1.5" fill="rgba(226,232,240,0.40)" stroke="rgba(148,163,184,0.45)" strokeWidth="0.8" />);
      // Toilet shape inside
      items.push(<ellipse key={`toilet-${s}`} cx={sx + stallW / 2} cy={r.y + 8 + r.h * 0.32} rx={stallW * 0.35} ry={stallW * 0.28} fill="rgba(255,255,255,0.60)" stroke="rgba(148,163,184,0.50)" strokeWidth="0.6" />);
    }
    // Sink row
    const sinkCount = Math.max(1, Math.floor((r.w - 16) / 20));
    for (let s = 0; s < sinkCount; s++) {
      const sx = r.x + 10 + s * ((r.w - 20) / Math.max(sinkCount - 1, 1));
      items.push(<rect key={`sink-${s}`} x={sx - 6} y={r.y + r.h - 22} width={12} height={10} rx="3" fill="rgba(186,230,253,0.45)" stroke="rgba(56,189,248,0.40)" strokeWidth="0.7" />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────────
  if (!tooSmall && room.type === "lobby") {
    const items = [];
    // Decorative floor tiles lf� grid of subtle squares
    const tileSize = 16;
    const tilesX = Math.floor((r.w - 8) / tileSize);
    const tilesY = Math.floor((r.h - 8) / tileSize);
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        if ((tx + ty) % 2 === 0) {
          items.push(<rect key={`tile-${tx}-${ty}`}
            x={r.x + 4 + tx * tileSize} y={r.y + 4 + ty * tileSize}
            width={tileSize - 1} height={tileSize - 1} rx="0.5"
            fill="rgba(251,191,36,0.08)" stroke="rgba(217,119,6,0.12)" strokeWidth="0.5" />);
        }
      }
    }
    // Central feature: small circular seating area or info point
    if (r.w > 70 && r.h > 70) {
      items.push(<circle key="feature" cx={cx} cy={cy} r={Math.min(14, r.w * 0.18)} fill="rgba(251,191,36,0.12)" stroke="rgba(217,119,6,0.28)" strokeWidth="1" />);
      items.push(<circle key="inner" cx={cx} cy={cy} r={Math.min(5, r.w * 0.06)} fill="rgba(217,119,6,0.18)" />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── STAIR ─────────────────────────────────────────────────────────────────────
  if (!tooSmall && room.type === "stair") {
    const items = [];
    const stepCount = Math.max(3, Math.floor(Math.min(r.w, r.h) / 14));
    const isH = r.w > r.h; // horizontal staircase
    for (let s = 0; s < stepCount; s++) {
      const t = s / stepCount;
      if (isH) {
        const sx = r.x + 4 + t * (r.w - 8);
        items.push(<rect key={s} x={sx} y={r.y + 6} width={(r.w - 8) / stepCount - 1} height={r.h - 12} rx="0.5"
          fill={`rgba(120,113,108,${0.10 + s * 0.04})`} stroke="rgba(120,113,108,0.28)" strokeWidth="0.5" />);
      } else {
        const sy = r.y + 4 + t * (r.h - 8);
        items.push(<rect key={s} x={r.x + 6} y={sy} width={r.w - 12} height={(r.h - 8) / stepCount - 1} rx="0.5"
          fill={`rgba(120,113,108,${0.10 + s * 0.04})`} stroke="rgba(120,113,108,0.28)" strokeWidth="0.5" />);
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── CHAPEL ────────────────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("chapel")) {
    const items = [];
    // Pews — rows of benches
    const pewCount = Math.max(2, Math.floor((r.h - 30) / 18));
    const pewW = r.w * 0.65;
    for (let p = 0; p < pewCount; p++) {
      const py = r.y + 22 + p * ((r.h - 30) / pewCount);
      items.push(<rect key={`pew-${p}`} x={cx - pewW / 2} y={py} width={pewW} height={7} rx="1" fill="rgba(120,80,40,0.28)" stroke="rgba(120,80,40,0.45)" strokeWidth="0.7" />);
    }
    // Altar
    items.push(<rect key="altar" x={cx - 14} y={r.y + 7} width={28} height={10} rx="2" fill="rgba(245,158,11,0.25)" stroke="rgba(217,119,6,0.45)" strokeWidth="0.8" />);
    // Cross
    items.push(<line key="cv" x1={cx} y1={r.y + 8} x2={cx} y2={r.y + 16} stroke="rgba(217,119,6,0.70)" strokeWidth="1.5" strokeLinecap="round" />);
    items.push(<line key="ch" x1={cx - 4} y1={r.y + 11} x2={cx + 4} y2={r.y + 11} stroke="rgba(217,119,6,0.70)" strokeWidth="1.5" strokeLinecap="round" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── MINI HOTEL ────────────────────────────────────────────────────────────────
  if (!tooSmall && (n.includes("mini hotel") || n.includes("hotel"))) {
    const items = [];
    // Hotel room grid — small beds
    const cols = Math.max(1, Math.floor((r.w - 14) / 38));
    const rows = Math.max(1, Math.floor((r.h - 14) / 36));
    const gapX = (r.w - 14) / cols;
    const gapY = (r.h - 14) / (rows + 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const bx = r.x + 7 + gapX * col + gapX / 2;
        const by = r.y + 10 + gapY * (row + 1);
        // Bed frame
        items.push(<rect key={`bed-${row}-${col}`} x={bx - 12} y={by - 8} width={24} height={16} rx="2" fill="rgba(186,230,253,0.35)" stroke="rgba(56,189,248,0.35)" strokeWidth="0.8" />);
        // Pillow
        items.push(<rect key={`pillow-${row}-${col}`} x={bx - 10} y={by - 7} width={9} height={7} rx="1.5" fill="rgba(255,255,255,0.60)" stroke="rgba(148,163,184,0.35)" strokeWidth="0.5" />);
        // Bedside table
        items.push(<rect key={`side-${row}-${col}`} x={bx + 13} y={by - 5} width={5} height={5} rx="0.5" fill="rgba(217,170,110,0.35)" stroke="rgba(160,110,60,0.30)" strokeWidth="0.5" />);
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── AMPHI-THEATER ─────────────────────────────────────────────────────────────
  if (!tooSmall && (n.includes("amphi") || n.includes("theater") || n.includes("theatre"))) {
    const items = [];
    // Arc rows of seats
    const arcCount = Math.max(2, Math.floor(r.h / 22));
    for (let a = 0; a < arcCount; a++) {
      const t = (a + 1) / (arcCount + 1);
      const rowY = r.y + 12 + t * (r.h - 20);
      const rowW = r.w * 0.3 + r.w * 0.65 * t; // widens toward back
      const seatCount = Math.max(2, Math.floor(rowW / 14));
      for (let s = 0; s < seatCount; s++) {
        const sx = cx - rowW / 2 + (s + 0.5) * (rowW / seatCount);
        items.push(<rect key={`seat-${a}-${s}`} x={sx - 4} y={rowY - 4} width={8} height={7} rx="1.5" fill="rgba(99,102,241,0.25)" stroke="rgba(79,70,229,0.35)" strokeWidth="0.5" />);
      }
    }
    // Stage at front
    items.push(<rect key="stage" x={cx - r.w * 0.25} y={r.y + 5} width={r.w * 0.5} height={10} rx="2" fill="rgba(245,158,11,0.22)" stroke="rgba(217,119,6,0.38)" strokeWidth="0.8" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── CONFERENCE ROOM ───────────────────────────────────────────────────────────
  if (!tooSmall && (n.includes("conference") || n.includes("conf room"))) {
    const items = [];
    // Long central table
    const tw = r.w * 0.70, th = r.h * 0.38;
    items.push(<rect key="table" x={cx - tw / 2} y={cy - th / 2} width={tw} height={th} rx="3" fill="rgba(217,170,110,0.30)" stroke="rgba(160,110,60,0.40)" strokeWidth="0.9" />);
    // Chairs around perimeter
    const chairsH = Math.max(2, Math.floor(tw / 16));
    const chairsV = Math.max(1, Math.floor(th / 16));
    for (let c = 0; c < chairsH; c++) {
      const cx2 = cx - tw / 2 + (c + 0.5) * (tw / chairsH);
      items.push(<rect key={`ct-${c}`} x={cx2 - 4} y={cy - th / 2 - 8} width={8} height={6} rx="1.5" fill="rgba(148,163,184,0.38)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.5" />);
      items.push(<rect key={`cb-${c}`} x={cx2 - 4} y={cy + th / 2 + 2} width={8} height={6} rx="1.5" fill="rgba(148,163,184,0.38)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.5" />);
    }
    for (let c = 0; c < chairsV; c++) {
      const cy2 = cy - th / 2 + (c + 0.5) * (th / chairsV);
      items.push(<rect key={`cl-${c}`} x={cx - tw / 2 - 8} y={cy2 - 4} width={6} height={8} rx="1.5" fill="rgba(148,163,184,0.38)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.5" />);
      items.push(<rect key={`cr-${c}`} x={cx + tw / 2 + 2} y={cy2 - 4} width={6} height={8} rx="1.5" fill="rgba(148,163,184,0.38)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.5" />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── PANTRY ─────────────────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("pantry")) {
    const items = [];
    // Shelving units on walls
    const shelfCount = 3;
    for (let s = 0; s < shelfCount; s++) {
      const sy = r.y + 8 + s * ((r.h - 16) / shelfCount);
      items.push(<rect key={`shelf-${s}`} x={r.x + 6} y={sy} width={r.w - 12} height={8} rx="1" fill="rgba(217,170,110,0.25)" stroke="rgba(160,110,60,0.35)" strokeWidth="0.7" />);
      // Small cans/boxes on shelf
      const items2 = Math.min(5, Math.floor((r.w - 16) / 14));
      for (let i = 0; i < items2; i++) {
        const ix = r.x + 10 + i * ((r.w - 20) / Math.max(items2 - 1, 1));
        items.push(<rect key={`can-${s}-${i}`} x={ix - 4} y={sy + 1} width={8} height={6} rx="1" fill={`hsla(${(s * 60 + i * 30) % 360},40%,60%,0.40)`} stroke="rgba(0,0,0,0.10)" strokeWidth="0.4" />);
      }
    }
    // Small table
    items.push(<rect key="table" x={cx - 10} y={cy + 6} width={20} height={10} rx="1.5" fill="rgba(217,170,110,0.28)" stroke="rgba(160,110,60,0.35)" strokeWidth="0.6" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── RADIO STATION ─────────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("radio")) {
    const items = [];
    // Mixing desk
    items.push(<rect key="desk" x={cx - 20} y={cy - 6} width={40} height={12} rx="2" fill="rgba(15,23,42,0.30)" stroke="rgba(56,189,248,0.40)" strokeWidth="0.9" />);
    // Fader sliders
    for (let f = 0; f < 5; f++) {
      const fx = cx - 16 + f * 8;
      items.push(<rect key={`fader-${f}`} x={fx - 1} y={cy - 4} width={2} height={8} rx="0.5" fill="rgba(100,116,139,0.50)" />);
      items.push(<rect key={`knob-${f}`} x={fx - 3} y={cy - 2 + (f % 3) * 1.5} width={6} height={3} rx="1" fill="rgba(56,189,248,0.50)" />);
    }
    // Microphone
    items.push(<circle key="mic" cx={cx - 22} cy={cy} r={5} fill="rgba(15,23,42,0.22)" stroke="rgba(56,189,248,0.50)" strokeWidth="0.8" />);
    items.push(<circle key="mic-g" cx={cx - 22} cy={cy} r={3} fill="rgba(56,189,248,0.20)" />);
    // On-air indicator
    items.push(<circle key="air" cx={cx + 24} cy={r.y + 10} r={4} fill="rgba(239,68,68,0.55)" stroke="rgba(185,28,28,0.55)" strokeWidth="0.7" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── MEDIA CENTER / ABCOM SOUND RECORDING ─────────────────────────────────────
  if (!tooSmall && (n.includes("media") || n.includes("abcom") || n.includes("sound") || n.includes("recording"))) {
    const items = [];
    // Large monitor at front
    items.push(<rect key="screen" x={cx - 18} y={r.y + 7} width={36} height={20} rx="2" fill="rgba(15,23,42,0.55)" stroke="rgba(56,189,248,0.40)" strokeWidth="0.8" />);
    items.push(<rect key="screen-inner" x={cx - 16} y={r.y + 9} width={32} height={16} rx="1" fill="rgba(56,189,248,0.15)" />);
    // Audience seats
    const rows2 = Math.max(1, Math.floor((r.h - 40) / 18));
    for (let row = 0; row < rows2; row++) {
      const rowY = r.y + 34 + row * 18;
      const seatCount = Math.max(2, Math.floor((r.w - 16) / 14));
      for (let s = 0; s < seatCount; s++) {
        const sx = r.x + 10 + (s + 0.5) * ((r.w - 20) / seatCount);
        items.push(<rect key={`seat-${row}-${s}`} x={sx - 4} y={rowY} width={8} height={7} rx="1.5" fill="rgba(99,102,241,0.22)" stroke="rgba(79,70,229,0.30)" strokeWidth="0.5" />);
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── SPEECH LAB ────────────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("speech")) {
    const items = [];
    // Booths along walls
    const boothCount = Math.max(2, Math.floor((r.w - 16) / 28));
    const bw = (r.w - 16) / boothCount - 2;
    for (let b = 0; b < boothCount; b++) {
      const bx = r.x + 8 + b * ((r.w - 16) / boothCount);
      items.push(<rect key={`booth-${b}`} x={bx} y={r.y + 8} width={bw} height={r.h * 0.42} rx="1.5" fill="rgba(226,232,240,0.30)" stroke="rgba(148,163,184,0.40)" strokeWidth="0.7" />);
      items.push(<Monitor key={`m-${b}`} x={bx + bw / 2 - 6} y={r.y + 12} mw={12} mh={8} />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── CBA SIMULATION / PE HALL / LECTURE ────────────────────────────────────────
  if (!tooSmall && (n.includes("cba sim") || n.includes("simulation") || n.includes("pe hall") || n.includes("lecture"))) {
    const items = [];
    // Simple rows of chairs/desks
    const rows = Math.max(2, Math.floor((r.h - 24) / 20));
    const cols = Math.max(2, Math.floor((r.w - 20) / 22));
    const gapX = (r.w - 20) / cols;
    const gapY = (r.h - 24) / (rows + 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sx = r.x + 10 + gapX * col + gapX / 2;
        const sy = r.y + 14 + gapY * (row + 1);
        items.push(<rect key={`c-${row}-${col}`} x={sx - 5} y={sy - 4} width={10} height={8} rx="1.5" fill="rgba(148,163,184,0.35)" stroke="rgba(100,116,139,0.30)" strokeWidth="0.5" />);
      }
    }
    if (n.includes("lecture") || n.includes("simulation")) {
      items.push(<rect key="podium" x={cx - 10} y={r.y + 6} width={20} height={8} rx="1.5" fill="rgba(120,80,40,0.28)" stroke="rgba(120,80,40,0.40)" strokeWidth="0.8" />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── ELECTRONICS LAB ───────────────────────────────────────────────────────────
  if (!tooSmall && n.includes("electronics")) {
    const items = [];
    const cols = Math.max(1, Math.floor((r.w - 14) / 38));
    const rows = Math.max(1, Math.floor((r.h - 18) / 28));
    const gapX = (r.w - 14) / cols;
    const gapY = (r.h - 18) / (rows + 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = r.x + 7 + gapX * col + gapX / 2;
        const wy = r.y + 10 + gapY * (row + 1);
        // Workbench
        items.push(<rect key={`bench-${row}-${col}`} x={wx - 13} y={wy - 5} width={26} height={10} rx="1" fill="rgba(100,116,139,0.22)" stroke="rgba(71,85,105,0.30)" strokeWidth="0.7" />);
        // Oscilloscope-like screen
        items.push(<rect key={`osc-${row}-${col}`} x={wx - 10} y={wy - 4} width={9} height={8} rx="0.8" fill="rgba(15,23,42,0.50)" stroke="rgba(56,189,248,0.35)" strokeWidth="0.5" />);
        items.push(<path key={`wave-${row}-${col}`} d={`M ${wx-9} ${wy} q 2,-3 4,0 q 2,3 4,0`} fill="none" stroke="rgba(34,197,94,0.70)" strokeWidth="0.7" />);
        // Component dots
        items.push(<circle key={`comp-${row}-${col}`} cx={wx + 5} cy={wy - 1} r={2} fill="rgba(245,158,11,0.50)" />);
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── GAME DEVELOPMENT LAB ──────────────────────────────────────────────────────
  if (!tooSmall && n.includes("game")) {
    const items = [];
    const cols = Math.max(1, Math.floor((r.w - 14) / 40));
    const rows = Math.max(1, Math.floor((r.h - 14) / 30));
    const gapX = (r.w - 14) / cols;
    const gapY = (r.h - 14) / (rows + 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = r.x + 7 + gapX * col + gapX / 2;
        const gy = r.y + 8 + gapY * (row + 1);
        items.push(<Monitor key={`m-${row}-${col}`} x={gx - 9} y={gy - 9} mw={18} mh={12} />);
        // Controller shape below monitor
        items.push(<rect key={`ctrl-${row}-${col}`} x={gx - 7} y={gy + 6} width={14} height={6} rx="3" fill="rgba(99,102,241,0.30)" stroke="rgba(79,70,229,0.40)" strokeWidth="0.5" />);
        items.push(<circle key={`btn1-${row}-${col}`} cx={gx - 2} cy={gy + 9} r={1.5} fill="rgba(239,68,68,0.55)" />);
        items.push(<circle key={`btn2-${row}-${col}`} cx={gx + 3} cy={gy + 9} r={1.5} fill="rgba(34,197,94,0.55)" />);
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── STORAGE / STOCK ROOM ──────────────────────────────────────────────────────
  if (!tooSmall && (room.type === "storage" || n.includes("stock") || n.includes("storage") || n.includes("supplies"))) {
    const items = [];
    const shelfCount = Math.max(2, Math.floor(r.h / 24));
    for (let s = 0; s < shelfCount; s++) {
      const sy = r.y + 6 + s * ((r.h - 10) / shelfCount);
      items.push(<rect key={`shelf-${s}`} x={r.x + 5} y={sy + 10} width={r.w - 10} height={3} rx="0.5" fill="rgba(120,113,108,0.35)" />);
      const boxCount = Math.max(2, Math.floor((r.w - 12) / 16));
      for (let b = 0; b < boxCount; b++) {
        const bx = r.x + 6 + b * ((r.w - 12) / boxCount);
        const bh = 6 + (b % 2) * 3;
        items.push(<rect key={`box-${s}-${b}`} x={bx} y={sy + 10 - bh} width={(r.w - 12) / boxCount - 1} height={bh} rx="0.5"
          fill={`hsla(${(s * 40 + b * 20) % 360},25%,65%,0.35)`} stroke="rgba(0,0,0,0.10)" strokeWidth="0.4" />);
      }
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── UTILITY / ELECTRICAL / JANITORIAL ─────────────────────────────────────────
  if (!tooSmall && (room.type === "utility" || n.includes("electrical") || n.includes("janitor"))) {
    const items = [];
    if (n.includes("electrical")) {
      // Breaker panel look
      items.push(<rect key="panel" x={cx - 14} y={cy - 16} width={28} height={32} rx="2" fill="rgba(51,65,85,0.28)" stroke="rgba(71,85,105,0.40)" strokeWidth="0.9" />);
      for (let b = 0; b < 6; b++) {
        const row = Math.floor(b / 2), col = b % 2;
        items.push(<rect key={`breaker-${b}`} x={cx - 11 + col * 12} y={cy - 12 + row * 10} width={10} height={6} rx="1" fill="rgba(245,158,11,0.30)" stroke="rgba(217,119,6,0.35)" strokeWidth="0.5" />);
      }
    } else {
      // Janitorial — mop bucket
      items.push(<rect key="bucket" x={cx - 7} y={cy - 8} width={14} height={16} rx="2" fill="rgba(226,232,240,0.35)" stroke="rgba(148,163,184,0.40)" strokeWidth="0.7" />);
      items.push(<line key="mop" x1={cx + 4} y1={cy + 8} x2={cx + 10} y2={cy - 14} stroke="rgba(120,113,108,0.50)" strokeWidth="1.2" strokeLinecap="round" />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  // ── BIRTHING CLINIC / MEDI-FERY ───────────────────────────────────────────────
  if (!tooSmall && (n.includes("birthing") || n.includes("clinic") || n.includes("medi") || n.includes("nursing"))) {
    const items = [];
    // Hospital bed
    items.push(<rect key="bed" x={cx - 16} y={cy - 10} width={32} height={18} rx="2" fill="rgba(186,230,253,0.38)" stroke="rgba(56,189,248,0.38)" strokeWidth="0.8" />);
    items.push(<rect key="pillow" x={cx - 14} y={cy - 9} width={11} height={8} rx="1.5" fill="rgba(255,255,255,0.60)" stroke="rgba(148,163,184,0.30)" strokeWidth="0.5" />);
    // IV stand
    items.push(<line key="iv" x1={cx + 20} y1={cy + 8} x2={cx + 20} y2={cy - 18} stroke="rgba(100,116,139,0.45)" strokeWidth="1.2" strokeLinecap="round" />);
    items.push(<circle key="ivbag" cx={cx + 20} cy={cy - 16} r={4} fill="rgba(186,230,253,0.50)" stroke="rgba(56,189,248,0.35)" strokeWidth="0.6" />);
    return <g pointerEvents="none">{items}</g>;
  }

  // ── PASER / FORE FRONT / ALUMNI (special) ─────────────────────────────────────
  if (!tooSmall && (n.includes("paser") || n.includes("fore front") || n.includes("alumni") || n.includes("club") || n.includes("ssc"))) {
    const items = [];
    // Seating arrangement — small circle table with chairs
    const tableR = Math.min(14, r.w * 0.2, r.h * 0.22);
    items.push(<circle key="table" cx={cx} cy={cy} r={tableR} fill="rgba(217,170,110,0.22)" stroke="rgba(160,110,60,0.35)" strokeWidth="0.9" />);
    const chairCount = Math.min(6, Math.max(4, Math.floor(tableR * 0.9)));
    for (let c = 0; c < chairCount; c++) {
      const angle = (c / chairCount) * Math.PI * 2;
      const chairR = tableR + 9;
      items.push(<circle key={`c-${c}`} cx={cx + Math.cos(angle) * chairR} cy={cy + Math.sin(angle) * chairR} r={4} fill="rgba(148,163,184,0.32)" stroke="rgba(100,116,139,0.30)" strokeWidth="0.5" />);
    }
    return <g pointerEvents="none">{items}</g>;
  }

  return null;
}

function FloorBlueprint({
  floor,
  route,
  destination,
  hoveredRoomId,
  onRoomClick,
  onRoomHover,
  kioskNodeId,
  animOffset,
  isLayered,
  isActiveFloor,
  mapZoom = DEFAULT_MAP_ZOOM,
  mapPan = { x: 0, y: 0 },
  simpleMode = false,
  routePreviewing = false,
  view3D = false,
  walkerState = null,
  walkT = 0,
  walkActive = false,
  stairFlashFloor = null,
  arrived = false,
  isSettingLocation = false,
}) {
  const routeSegments = useMemo(() => routeSegmentsForFloor(route, floor.id, destination), [route, floor.id, destination]);
  const floorChanges = useMemo(() => floorChangesFromPath(route), [route]);
  const destinationRect = destination?.floor === floor.id ? roomRect(destination) : null;
  // Ripple state: { x, y, key }
  const [ripple, setRipple] = useState(null);
  // Route animation key — forces CSS re-animation when route changes
  const routeAnimKey = useMemo(() => route.join(","), [route]);
  const kioskNode = getNode(kioskNodeId);
  const kioskPoint = kioskNode?.floor === floor.id ? mapPoint(kioskNode) : null;
  const meta = FLOOR_IMAGE_META[floor.id] ?? FLOOR_IMAGE_META[1];
  const floorBounds = floor.bounds ?? { x1: meta.x1, y1: meta.y1, x2: meta.x2, y2: meta.y2 };
  const buildingWidth = floorBounds.x2 - floorBounds.x1;
  const buildingHeight = floorBounds.y2 - floorBounds.y1;
  const floorDepth = getFloorDepth(floor.id);
  const fallbackHallTop = meta.y1 + ((floor.id <= 2 ? 8.5 : 7.5) / floorDepth) * (meta.y2 - meta.y1);
  const fallbackHallBottom = meta.y1 + ((floor.id <= 2 ? 11.5 : floor.id >= 5 ? 14 : 12.5) / floorDepth) * (meta.y2 - meta.y1);
  const hall = floor.hall ?? { x: floorBounds.x1, y: fallbackHallTop, w: buildingWidth, h: Math.max(34, fallbackHallBottom - fallbackHallTop) };
  const hallTop = hall.y;
  const hallHeight = hall.h;

  const activeStairs = useMemo(() => {
    const active = new Map();
    floorChanges.forEach((change) => {
      if (change.fromFloor === floor.id) {
        active.set(change.stairKey, { direction: change.direction, type: "exit", toFloor: change.toFloor });
      }
      if (change.toFloor === floor.id) {
        active.set(change.stairKey, { direction: change.direction, type: "enter", fromFloor: change.fromFloor });
      }
    });
    return active;
  }, [floorChanges, floor.id]);

  const floorChangeEndpointIds = useMemo(() => {
    const ids = new Set();
    floorChanges.forEach((change) => {
      ids.add(change.fromNodeId);
      ids.add(change.toNodeId);
    });
    return ids;
  }, [floorChanges]);

  const routeNodeIds = useMemo(() => new Set(route), [route]);

  const isFollowing = walkActive && walkerState && walkerState.floor === floor.id;
  const activeViewBox = isFollowing
    ? walkerFollowViewBox(floor, walkerState.x, walkerState.y, mapZoom)
    : floorBoundsViewBox(floor, mapZoom, mapPan);

  return (
    <svg
      viewBox={activeViewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ ...S.floorSvg, ...(view3D ? { filter: "drop-shadow(0 8px 18px rgba(15,23,42,0.22))" } : {}),
        transition: isFollowing ? "none" : "none" }}
      aria-label={`${floor.label} vector navigation map`}
      onClick={(e) => {
        // Convert screen coordinates to SVG coordinates for ripple
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
        setRipple({ x: svgPt.x, y: svgPt.y, key: Date.now() });
      }}
    >
      <defs>
        <filter id={`glow-${floor.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.37  0 1 0 0 0.65  0 0 1 0 0.98  0 0 0 1 0" result="colored" />
          <feMerge>
            <feMergeNode in="colored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Room drop-shadow filter — subtle elevation */}
        <filter id={`roomShadow-${floor.id}`} x="-8%" y="-8%" width="120%" height="120%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="2.5" floodColor="rgba(15,23,42,0.15)" />
        </filter>
        {/* Building shell shadow filter */}
        <filter id={`buildingShadow-${floor.id}`} x="-4%" y="-4%" width="112%" height="112%">
          <feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="rgba(15,23,42,0.18)" />
        </filter>
        <linearGradient id={`floorFill-${floor.id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#fcfbf8" />
          <stop offset="40%" stopColor="#f9f7f2" />
          <stop offset="100%" stopColor="#f3f0e8" />
        </linearGradient>
        <linearGradient id={`wallStroke-${floor.id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(120,113,108,0.55)" />
          <stop offset="30%" stopColor="rgba(71,85,105,0.68)" />
          <stop offset="70%" stopColor="rgba(71,85,105,0.68)" />
          <stop offset="100%" stopColor="rgba(120,113,108,0.55)" />
        </linearGradient>
        <pattern id={`grid-${floor.id}`} width="46" height="46" patternUnits="userSpaceOnUse">
          <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(168,162,158,0.10)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Transparent SVG: no large plate/background, only the real vector map is drawn. */}

      {/* Exterior shell and main corridor. */}
      <g pointerEvents="none">
        {/* Ambient drop shadow behind building */}
        <rect
          x={floorBounds.x1 + 6}
          y={floorBounds.y1 + 8}
          width={buildingWidth}
          height={buildingHeight}
          rx="18"
          fill="rgba(15,23,42,0.10)"
        />
        {/* Building body */}
        <rect
          x={floorBounds.x1}
          y={floorBounds.y1}
          width={buildingWidth}
          height={buildingHeight}
          rx="16"
          fill={`url(#floorFill-${floor.id})`}
          stroke={`url(#wallStroke-${floor.id})`}
          strokeWidth={floor.id === 1 ? "10" : "7"}
        />
        {/* Inner wall highlight — gives the thick wall a beveled look */}
        <rect
          x={floorBounds.x1 + 5}
          y={floorBounds.y1 + 5}
          width={buildingWidth - 10}
          height={buildingHeight - 10}
          rx="12"
          fill="none"
          stroke={floor.id === 1 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)"}
          strokeWidth="2.5"
        />
        {/* Inner shadow inset line */}
        <rect
          x={floorBounds.x1 + 8}
          y={floorBounds.y1 + 8}
          width={buildingWidth - 16}
          height={buildingHeight - 16}
          rx="9"
          fill="none"
          stroke={floor.id === 1 ? "rgba(100,116,139,0.20)" : "rgba(120,113,108,0.12)"}
          strokeWidth="1"
        />
        {/* Hallway — with subtle floor texture */}
        <rect
          x={hall.x}
          y={hallTop}
          width={hall.w}
          height={hallHeight}
          rx={floor.id === 1 ? "0" : "18"}
          fill={floor.id === 1 ? "rgba(236,241,247,0.92)" : "rgba(224,228,234,0.78)"}
          stroke={floor.id === 1 ? "rgba(71,85,105,0.32)" : "rgba(148,163,184,0.30)"}
          strokeWidth={floor.id === 1 ? "3" : "2"}
        />
        {/* Hallway center stripe — subtle dashed centerline like a corridor floor marking */}
        <line
          x1={hall.x + 20} y1={hallTop + hallHeight / 2}
          x2={hall.x + hall.w - 20} y2={hallTop + hallHeight / 2}
          stroke="rgba(148,163,184,0.18)"
          strokeWidth="2"
          strokeDasharray="18 12"
          strokeLinecap="round"
        />
        {/* Hallway edge highlight top */}
        <line
          x1={hall.x} y1={hallTop + 1}
          x2={hall.x + hall.w} y2={hallTop + 1}
          stroke="rgba(255,255,255,0.50)"
          strokeWidth="1.5"
        />
        {/* Hallway edge shadow bottom */}
        <line
          x1={hall.x} y1={hallTop + hallHeight - 1}
          x2={hall.x + hall.w} y2={hallTop + hallHeight - 1}
          stroke="rgba(71,85,105,0.14)"
          strokeWidth="1.5"
        />
        <text
          x={hall.x + hall.w / 2}
          y={hallTop + hallHeight / 2 + 7}
          textAnchor="middle"
          fontSize="20"
          letterSpacing="14"
          fill="rgba(100,116,139,0.20)"
          fontWeight="900"
        >
          HALLWAY
        </text>
      </g>

      {/* First floor exterior / parking footprint. */}
      {floor.id === 1 && BUILDING.coordinateMode !== "image-pixel" && (
        <g pointerEvents="none">
          <rect
            x={meta.x1 + buildingWidth * 0.02}
            y={meta.y2 + 22}
            width={buildingWidth * 0.55}
            height="74"
            rx="22"
            fill="rgba(255,255,255,0.78)"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="2"
          />
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={i}
              x1={meta.x1 + buildingWidth * 0.04}
              y1={meta.y2 + 32 + i * 8}
              x2={meta.x1 + buildingWidth * 0.53}
              y2={meta.y2 + 32 + i * 8}
              stroke="rgba(120,113,108,0.24)"
              strokeWidth="2"
            />
          ))}
          <rect
            x={meta.x1 + buildingWidth * 0.59}
            y={meta.y2 + 24}
            width={buildingWidth * 0.34}
            height="72"
            rx="10"
            fill="rgba(231,229,228,0.72)"
            stroke="rgba(148,163,184,0.25)"
            strokeWidth="2"
          />
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={i}
              x1={meta.x1 + buildingWidth * (0.61 + i * 0.03)}
              y1={meta.y2 + 24}
              x2={meta.x1 + buildingWidth * (0.61 + i * 0.03)}
              y2={meta.y2 + 96}
              stroke="rgba(120,113,108,0.20)"
              strokeWidth="2"
            />
          ))}
          <text
            x={meta.x1 + buildingWidth * 0.76}
            y={meta.y2 + 70}
            textAnchor="middle"
            fontSize="30"
            letterSpacing="18"
            fill="rgba(87,83,78,0.34)"
            fontWeight="900"
          >
            PARKING
          </text>
          <path
            d={`M ${meta.x1 + buildingWidth * 0.46} ${meta.y2 + 60} C ${meta.x1 + buildingWidth * 0.50} ${meta.y2 + 14}, ${meta.x1 + buildingWidth * 0.54} ${meta.y2 + 14}, ${meta.x1 + buildingWidth * 0.58} ${meta.y2 + 60}`}
            fill="none"
            stroke="rgba(120,113,108,0.28)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Floor 1 architectural detail overlay (column grid, exits, wall lines, parking, etc.) */}
      {floor.id === 1 && <Floor1Details />}

      {/* Room blocks are drawn from data, not floor-plan images. */}
      {floor.rooms.map((room) => {
        const r = roomRect(room);
        const isDestination = destination?.id === room.id;
        const isHovered = hoveredRoomId === room.id;
        const metaStyle = ROOM_STYLE_META[room.type] ?? ROOM_STYLE_META.office;
        const fill = simpleMode && !isDestination && !isHovered
          ? "rgba(255,255,255,0.50)"
          : roomFill(room.type, isDestination, isHovered);
        const label = compactRoomName(room.name);
        const labelLines = splitLabel(label, r.w);
        const centerX = r.x + r.w / 2;
        const centerY = r.y + r.h / 2;
        const hallMidY = hall.y + hall.h / 2;
        const isNorth = (r.y + r.h / 2) < hallMidY;
        const doorX = Math.min(Math.max(centerX, r.x + 20), r.x + r.w - 20);
        const doorY = isNorth ? r.y + r.h : r.y;
        const doorSign = isNorth ? -1 : 1;
        const showLabel = r.w > 42 && r.h > 28 && (!simpleMode || isDestination || isHovered);

        // ── Stair rooms: architectural floor-plan symbol ──
        // Parallel tread lines + center handrail + direction arrow
        if (room.type === 'stair') {
          const idSuffix = room.id.split('_stair_')[1] ?? '';
          const activeStairKey = idSuffix.startsWith('center') ? 'center' : idSuffix || null;
          const isActiveStair = activeStairKey ? activeStairs.get(activeStairKey) : null;

          const bgFill    = isActiveStair ? "rgba(219,234,254,0.96)" : isHovered ? "rgba(237,240,245,0.99)" : "rgba(230,233,240,0.95)";
          const borderClr = isActiveStair ? "rgba(37,99,235,0.85)"   : "rgba(51,65,85,0.70)";
          const treadClr  = isActiveStair ? "rgba(37,99,235,0.50)"   : "rgba(51,65,85,0.42)";
          const railClr   = isActiveStair ? "rgba(37,99,235,0.80)"   : "rgba(30,41,59,0.72)";
          const arrowClr  = isActiveStair ? "#1d4ed8"                : "#1e293b";

          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          const pad = 5;

          // Tread lines — drawn perpendicular to the long axis
          // so they always read as steps regardless of orientation
          const isH = r.w > r.h;
          const treadCount = isH
            ? Math.max(4, Math.floor((r.h - pad * 2) / 12))
            : Math.max(4, Math.floor((r.w - pad * 2) / 12));
          const treadLines = [];

          if (isH) {
            // Horizontal stair: treads are vertical lines (columns of steps)
            const step = (r.w - pad * 2) / treadCount;
            for (let i = 1; i < treadCount; i++) {
              const lx = r.x + pad + i * step;
              treadLines.push(
                <line key={i}
                  x1={lx} y1={r.y + pad}
                  x2={lx} y2={r.y + r.h - pad}
                  stroke={treadClr} strokeWidth="1.8" strokeLinecap="round"
                  pointerEvents="none" />
              );
            }
          } else {
            // Vertical stair: treads are horizontal lines (rows of steps)
            const step = (r.h - pad * 2) / treadCount;
            for (let i = 1; i < treadCount; i++) {
              const ly = r.y + pad + i * step;
              treadLines.push(
                <line key={i}
                  x1={r.x + pad} y1={ly}
                  x2={r.x + r.w - pad} y2={ly}
                  stroke={treadClr} strokeWidth="1.8" strokeLinecap="round"
                  pointerEvents="none" />
              );
            }
          }

          // Center handrail — runs along the long axis
          const railEl = isH
            ? <line x1={cx} y1={r.y + pad} x2={cx} y2={r.y + r.h - pad}
                stroke={railClr} strokeWidth="2.5" strokeLinecap="round" pointerEvents="none" />
            : <line x1={r.x + pad} y1={cy} x2={r.x + r.w - pad} y2={cy}
                stroke={railClr} strokeWidth="2.5" strokeLinecap="round" pointerEvents="none" />;

          // Handrail end-cap dots
          const cap1cx = isH ? cx : r.x + pad + 3;
          const cap1cy = isH ? r.y + pad + 3 : cy;
          const cap2cx = isH ? cx : r.x + r.w - pad - 3;
          const cap2cy = isH ? r.y + r.h - pad - 3 : cy;

          // Direction arrow — points along the "up" direction
          const arrowDir = isActiveStair?.direction ?? 'up';
          const aFromX = isH ? r.x + r.w - pad - 4 : cx + 2;
          const aFromY = isH ? cy : r.y + r.h - pad - 4;
          const aToX   = isH ? r.x + pad + 4 : cx + 2;
          const aToY   = isH ? cy : r.y + pad + 4;
          const adx = aToX - aFromX, ady = aToY - aFromY;
          const alen = Math.hypot(adx, ady) || 1;
          const au = adx / alen, av = ady / alen;
          const ah = 8;
          const ax1 = aToX - ah * au + ah * 0.42 * (-av);
          const ay1 = aToY - ah * av + ah * 0.42 * au;
          const ax2 = aToX - ah * au - ah * 0.42 * (-av);
          const ay2 = aToY - ah * av - ah * 0.42 * au;

          return (
            <g key={room.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onRoomClick(room)}
              onMouseEnter={() => onRoomHover(room.id)}
              onMouseLeave={() => onRoomHover(null)}>

              {/* Drop shadow */}
              <rect x={r.x + 2} y={r.y + 3} width={r.w} height={r.h} rx="4"
                fill="rgba(15,23,42,0.09)" pointerEvents="none" />

              {/* Background */}
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="4"
                fill={bgFill} stroke={borderClr}
                strokeWidth={isActiveStair ? 2.5 : 2.0} />

              {/* Tread lines */}
              {treadLines}

              {/* Center handrail */}
              {railEl}

              {/* Handrail end-cap dots */}
              <circle cx={cap1cx} cy={cap1cy} r="3.2"
                fill={bgFill} stroke={railClr} strokeWidth="1.8" pointerEvents="none" />
              <circle cx={cap2cx} cy={cap2cy} r="3.2"
                fill={bgFill} stroke={railClr} strokeWidth="1.8" pointerEvents="none" />

              {/* Direction arrow */}
              <line x1={aFromX} y1={aFromY} x2={aToX} y2={aToY}
                stroke={arrowClr} strokeWidth="2.0" strokeLinecap="round"
                pointerEvents="none" opacity="0.85" />
              <polygon points={`${aToX},${aToY} ${ax1},${ay1} ${ax2},${ay2}`}
                fill={arrowClr} pointerEvents="none" opacity="0.85" />

              {/* UP / DN text near arrowhead */}
              <text
                x={isH ? aToX + 10 : aToX + 9}
                y={isH ? aToY + 11 : aToY + 13}
                fontSize="8.5" fontWeight="800" letterSpacing="0.2"
                fill={arrowClr}
                stroke="rgba(255,255,255,0.90)" strokeWidth="2.5" paintOrder="stroke"
                pointerEvents="none">
                {arrowDir === 'down' ? 'DN' : 'UP'}
              </text>

              {/* Active-route up/down icon */}
              {isActiveStair && (
                <image
                  href={isActiveStair.direction === 'down' ? wayStairsDown : wayStairsUp}
                  x={r.x + r.w - 22} y={r.y + r.h - 24} width="18" height="18" opacity="0.92" />
              )}
            </g>
          );
        }
        return (
          <g key={room.id}
            style={{ cursor: "pointer" }}
            onClick={() => onRoomClick(room)}
            onMouseEnter={() => onRoomHover(room.id)}
            onMouseLeave={() => onRoomHover(null)}
          >
            {/* Room drop shadow */}
            <rect
              x={r.x + 2}
              y={r.y + 3}
              width={r.w}
              height={r.h}
              rx={floor.id === 1 ? "4" : "9"}
              fill="rgba(15,23,42,0.07)"
              pointerEvents="none"
            />
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={floor.id === 1 ? "4" : "9"}
              fill={fill}
              stroke={isDestination ? "#111827" : isHovered ? metaStyle.color : floor.id === 1 ? "rgba(51,65,85,0.62)" : "rgba(148,163,184,0.48)"}
              strokeWidth={isDestination ? 3.2 : isHovered ? 3.2 : floor.id === 1 ? 3.0 : 2.2}
              pointerEvents="none"
            />
            {/* Top-edge highlight — lit surface feel */}
            <rect
              x={r.x + 2}
              y={r.y + 1}
              width={Math.max(0, r.w - 4)}
              height={Math.min(6, r.h * 0.08)}
              rx={floor.id === 1 ? "3" : "8"}
              fill="rgba(255,255,255,0.45)"
              pointerEvents="none"
            />
            {/* Inner inset border */}
            <rect
              x={r.x + 4}
              y={r.y + 4}
              width={Math.max(0, r.w - 8)}
              height={Math.max(0, r.h - 8)}
              rx={floor.id === 1 ? "2" : "6"}
              fill="none"
              stroke={floor.id === 1 ? "rgba(71,85,105,0.14)" : "rgba(100,116,139,0.10)"}
              strokeWidth="1"
              pointerEvents="none"
            />
            {/* Location-pick mode: green highlight overlay */}
            {isSettingLocation && (
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx={floor.id === 1 ? "4" : "9"}
                fill={isHovered ? "rgba(34,197,94,0.22)" : "rgba(34,197,94,0.08)"}
                stroke={isHovered ? "rgba(22,163,74,0.90)" : "rgba(34,197,94,0.50)"}
                strokeWidth={isHovered ? 3.5 : 2.0}
                strokeDasharray={isHovered ? "0" : "6 4"}
                pointerEvents="none"
              />
            )}
            {/* Rich room interior drawings */}
            {!simpleMode && !isDestination && <RoomInterior room={room} r={r} />}
            {showLabel && (
              <g pointerEvents="none">
                <rect
                  x={centerX - Math.min(r.w * 0.44, 58)}
                  y={r.y + 5}
                  width={Math.min(r.w * 0.88, 116)}
                  height={labelLines.length * 14 + 6}
                  rx="4"
                  fill="rgba(255,255,255,0.78)"
                />
                {labelLines.map((line, idx) => (
                  <text
                    key={idx}
                    x={centerX}
                    y={r.y + 16 + idx * 14}
                    textAnchor="middle"
                    fontSize={Math.min(13, Math.max(10, r.w / 11))}
                    fill={isDestination ? "#1d4ed8" : "#1e293b"}
                    fontWeight="900"
                    stroke="rgba(255,255,255,0.92)"
                    strokeWidth="2.5"
                    paintOrder="stroke"
                  >
                    {line}
                  </text>
                ))}
              </g>
            )}
            <path
              d={`M ${doorX - 14} ${doorY} L ${doorX - 2} ${doorY} M ${doorX + 14} ${doorY} L ${doorX + 2} ${doorY}`}
              stroke="rgba(120,113,108,0.78)"
              strokeWidth="6"
              strokeLinecap="round"
              pointerEvents="none"
            />
            <path
              d={`M ${doorX + 2} ${doorY} Q ${doorX + 18} ${doorY + doorSign * 16} ${doorX + 18} ${doorY + doorSign * 34}`}
              fill="none"
              stroke="rgba(120,113,108,0.50)"
              strokeWidth="2.2"
              strokeLinecap="round"
              pointerEvents="none"
            />
            {(isDestination || isHovered) && (
              <g pointerEvents="none">
                <rect
                  x={centerX - 118}
                  y={Math.max(18, r.y - 48)}
                  width="236"
                  height="38"
                  rx="15"
                  fill="rgba(255,255,255,0.96)"
                  stroke={isDestination ? "#111827" : metaStyle.color}
                  strokeWidth="2"
                />
                <text x={centerX} y={Math.max(18, r.y - 48) + 25} textAnchor="middle" fill="#1f2937" fontWeight="900" fontSize="16">
                  {label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Corridor nodes and route graph anchors are subtle, but route waypoints stay detailed. */}
      {!simpleMode && floor.nodes.filter((node) => !node.roomId).map((node) => {
        const p = mapPoint(node);
        const active = routeNodeIds.has(node.id);
        return (
          <circle
            key={node.id}
            cx={p.x}
            cy={p.y}
            r={active ? 4.5 : 2.4}
            fill={active ? "#2563eb" : "rgba(120,113,108,0.16)"}
            stroke={active ? "#ffffff" : "transparent"}
            strokeWidth="1.8"
            pointerEvents="none"
          />
        );
      })}

      {/* Route path on this floor. */}
      {routeSegments.map((segment, index) => {
        // Estimate total path length for stroke-dashoffset animation
        let pathLen = 0;
        for (let i = 1; i < segment.length; i++) {
          const pa = mapPoint(segment[i - 1], { useStairMarker: floorChangeEndpointIds.has(segment[i - 1].id) });
          const pb = mapPoint(segment[i], { useStairMarker: floorChangeEndpointIds.has(segment[i].id) });
          pathLen += Math.hypot(pb.x - pa.x, pb.y - pa.y);
        }
        const pathLenStr = Math.ceil(pathLen + 20);
        return (
        <g key={`route-${floor.id}-${index}`} pointerEvents="none">
          <polyline
            points={makePolyline(segment, floorChangeEndpointIds)}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={routePreviewing ? "18" : "14"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={routePreviewing ? "0.26" : "0.18"}
            filter={`url(#glow-${floor.id})`}
          />
          {/* Animated draw — appears on route change, draws from start to end over 1s */}
          <polyline
            key={`draw-${routeAnimKey}-${index}`}
            points={makePolyline(segment, floorChangeEndpointIds)}
            fill="none"
            stroke="#2563eb"
            strokeWidth={routePreviewing ? "7" : "5"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="smartnav-path-anim"
            style={{ "--path-len": pathLenStr }}
          />
          <polyline
            points={makePolyline(segment, floorChangeEndpointIds)}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 18"
            strokeDashoffset={-animOffset}
            opacity="0.35"
          />
          {/* Active-walk pulse dash — brighter moving dashes while walker is on this floor */}
          {walkActive && walkerState && walkerState.floor === floor.id && (
            <polyline
              points={makePolyline(segment, floorChangeEndpointIds)}
              fill="none"
              stroke="#93c5fd"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="14 34"
              className="snpa-dash"
              opacity="0.72"
            />
          )}
          {segment.slice(0, -1).map((node, pointIndex) => (
            <RouteArrow
              key={`arrow-${node.id}-${pointIndex}`}
              from={node}
              to={segment[pointIndex + 1]}
              floorChangeEndpointIds={floorChangeEndpointIds}
            />
          ))}
          {segment.slice(1, -1).map((node, pointIndex) => {
            if (pointIndex % 2 !== 0) return null;
            const p = mapPoint(node, { useStairMarker: floorChangeEndpointIds.has(node.id) });
            return <circle key={node.id} cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />;
          })}
        </g>
        );
      })}

      {/* Floor-change waypoint tags. */}
      {floorChanges.map((change) => {
        const fromNode = getNode(change.fromNodeId);
        const toNode = getNode(change.toNodeId);
        if (fromNode?.floor === floor.id) {
          const p = mapPoint({ ...fromNode, id: change.fromNodeId }, { useStairMarker: true });
          return (
            <WaypointLabel
              key={`exit-${change.fromNodeId}-${change.toNodeId}`}
              x={p.x}
              y={p.y - 48}
              text={`${change.direction === "up" ? "UP" : "DOWN"} TO F${change.toFloor}`}
              tone="orange"
            />
          );
        }
        if (toNode?.floor === floor.id) {
          const p = mapPoint({ ...toNode, id: change.toNodeId }, { useStairMarker: true });
          return (
            <WaypointLabel
              key={`enter-${change.fromNodeId}-${change.toNodeId}`}
              x={p.x}
              y={p.y + 52}
              text={`ENTER F${change.toFloor}`}
              tone="purple"
            />
          );
        }
        return null;
      })}

      {/* Start and destination markers. */}
      {kioskPoint && <MapMarker x={kioskPoint.x} y={kioskPoint.y} type="start" label="START" animOffset={animOffset} />}
      {destinationRect && (
        <MapMarker
          x={destinationRect.x + destinationRect.w / 2}
          y={destinationRect.y + destinationRect.h / 2}
          type="destination"
          label="DEST"
          animOffset={animOffset}
        />
      )}

      {/* 3D isometric wall extrusions when 3D mode is on */}
      {view3D && (() => {
        const D = 56; // slab extrusion depth in SVG units
        const bx = floorBounds.x1, by = floorBounds.y1, bw = buildingWidth, bh = buildingHeight;
        const activeFloor = isActiveFloor;

        // East face (right wall)
        const eastFill   = activeFloor ? "rgba(37,99,235,0.28)"  : "rgba(71,85,105,0.32)";
        const eastPts    = `${bx+bw},${by} ${bx+bw+D},${by+D} ${bx+bw+D},${by+bh+D} ${bx+bw},${by+bh}`;
        // South face (bottom wall) — darkest, most in shadow
        const southFill  = activeFloor ? "rgba(15,23,42,0.42)"   : "rgba(15,23,42,0.32)";
        const southPts   = `${bx},${by+bh} ${bx+bw},${by+bh} ${bx+bw+D},${by+bh+D} ${bx+D},${by+bh+D}`;
        // Corner pillar
        const cornerFill = "rgba(15,23,42,0.55)";
        const cornerPts  = `${bx+bw},${by+bh} ${bx+bw+D},${by+bh+D} ${bx+bw+D},${by+bh+D} ${bx+bw},${by+bh}`;

        // Window columns on east face — evenly spaced vertical strips
        const colCount = 6;
        const winW = 18, winH = bh * 0.28;
        const colSpacingY = D / (colCount + 1);
        const winStrips = Array.from({ length: colCount }, (_, i) => {
          const t = (i + 1) / (colCount + 1);
          const wx = bx + bw + t * D;
          const wy = by + t * D + bh * 0.18;
          return (
            <rect key={i}
              x={wx - winW / 2} y={wy}
              width={winW} height={winH}
              rx="4"
              fill={activeFloor ? "rgba(147,197,253,0.30)" : "rgba(186,230,253,0.18)"}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1"
            />
          );
        });
        // Horizontal cornice line on east face top edge
        const corniceY   = by + D * 0.05;
        const cornicePts = `${bx+bw},${by} ${bx+bw+D},${by+D} ${bx+bw+D},${by+D+12} ${bx+bw},${by+12}`;

        return (
          <g pointerEvents="none">
            {/* South face */}
            <polygon points={southPts} fill={southFill} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {/* East face */}
            <polygon points={eastPts}  fill={eastFill}  stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Cornice strip at top of east face */}
            <polygon points={cornicePts}
              fill={activeFloor ? "rgba(59,130,246,0.40)" : "rgba(100,116,139,0.38)"}
              strokeWidth="0" />
            {/* Window strips on east face */}
            {winStrips}
            {/* Corner accent */}
            <line
              x1={bx+bw} y1={by} x2={bx+bw+D} y2={by+D}
              stroke={activeFloor ? "rgba(96,165,250,0.60)" : "rgba(148,163,184,0.45)"}
              strokeWidth="2.5" strokeLinecap="round" />
            <line
              x1={bx+bw} y1={by+bh} x2={bx+bw+D} y2={by+bh+D}
              stroke="rgba(30,41,59,0.60)" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      })()}

      <g pointerEvents="none">
        <rect x="28" y="146" width="206" height="68" rx="18" fill="rgba(255,255,255,0.94)" stroke="rgba(120,113,108,0.24)" />
        <text x="58" y="190" fill="#1f2937" fontSize="44" fontWeight="900">{floor.id}</text>
        <text x="112" y="179" fill="#57534e" fontSize="18" fontWeight="900">{floor.label}</text>
        {view3D && <text x="112" y="200" fill="#2563eb" fontSize="12" fontWeight="800">3D VIEW</text>}
        {!view3D && FLOOR_IMAGE_META[floor.id]?.note && (
          <text x="112" y="200" fill="#2563eb" fontSize="12" fontWeight="800">larger ground footprint</text>
        )}
      </g>

      {/* Walker pulse rings + halo — radiate outward continuously while walking */}
      {walkActive && walkerState && walkerState.floor === floor.id && !walkerState.isOnStairs && (
        <g pointerEvents="none">
          {/* Soft ground halo — breathes under the walker */}
          <circle cx={walkerState.x} cy={walkerState.y} r="22"
            fill="rgba(37,99,235,0.18)"
            className="snwp-halo" />
          {/* Three staggered expanding rings */}
          <circle cx={walkerState.x} cy={walkerState.y} r="10"
            fill="none" stroke="#2563eb" strokeWidth="3.5"
            className="snwp-ring-1" />
          <circle cx={walkerState.x} cy={walkerState.y} r="10"
            fill="none" stroke="#3b82f6" strokeWidth="2.8"
            className="snwp-ring-2" />
          <circle cx={walkerState.x} cy={walkerState.y} r="10"
            fill="none" stroke="#93c5fd" strokeWidth="2.0"
            className="snwp-ring-3" />
        </g>
      )}

      {/* Walking figure — only on the floor the walker is currently on */}
      {walkerState && walkerState.floor === floor.id && (
        <WalkingFigure
          x={walkerState.x} y={walkerState.y}
          angle={walkerState.angle}
          walkT={walkT}
          isOnStairs={walkerState.isOnStairs}
          arrived={arrived}
        />
      )}

      {/* Arrived pulse rings — burst at destination when walk finishes */}
      {arrived && destinationRect && floor.id === destination?.floor && (
        <g pointerEvents="none">
          <circle
            key={`arrived-pulse-${floor.id}`}
            cx={destinationRect.x + destinationRect.w / 2}
            cy={destinationRect.y + destinationRect.h / 2}
            r="18"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            className="smartnav-arrived-pulse"
          />
          <circle
            key={`arrived-pulse2-${floor.id}`}
            cx={destinationRect.x + destinationRect.w / 2}
            cy={destinationRect.y + destinationRect.h / 2}
            r="18"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            style={{ animationDelay: "200ms" }}
            className="smartnav-arrived-pulse"
          />
        </g>
      )}

      {/* Stair floor-change flash badge — briefly shows "Floor N" when ascending/descending */}
      {stairFlashFloor && stairFlashFloor.floor === floor.id && (
        <g className="smartnav-stair-flash" pointerEvents="none"
          transform={`translate(${walkerState?.x ?? (floorBounds.x1 + buildingWidth/2)},${walkerState?.y ?? (floorBounds.y1 + buildingHeight/2)})`}>
          <rect x={-52} y={-22} width={104} height={44} rx={22}
            fill="rgba(37,99,235,0.92)" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
          <text x={0} y={-4} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.8)" fontWeight="700">NOW ON</text>
          <text x={0} y={14} textAnchor="middle" fontSize="15" fill="white" fontWeight="900">FLOOR {stairFlashFloor.floor}</text>
        </g>
      )}

      {/* Tap ripple — brief expanding circle at tap point */}
      {ripple && (
        <circle
          key={ripple.key}
          cx={ripple.x}
          cy={ripple.y}
          r="0"
          fill="none"
          stroke="rgba(37,99,235,0.60)"
          strokeWidth="3"
          className="smartnav-ripple-circle"
          pointerEvents="none"
          onAnimationEnd={() => setRipple(null)}
        />
      )}
    </svg>
  );
}


function FloorPlane({
  children,
  floorId,
  isLayered,
  isActiveFloor,
  isHoveredLayer,
  index,
  total,
  role,
  onSelect,
  onHover,
  view3D = false,
}) {
  const meta = FLOOR_IMAGE_META[floorId] ?? FLOOR_IMAGE_META[1];
  const stacked = isLayered;
  const isPeekLayer = stacked && !isActiveFloor && !isHoveredLayer;
  const isPreviewLayer = stacked && !isActiveFloor && isHoveredLayer;
  const stackWidth = isActiveFloor
    ? "min(100%, 1440px)"
    : isPreviewLayer
      ? "min(96%, 1320px)"
      : "min(92%, 1240px)";
  const scale = stacked
    ? (isActiveFloor ? 1.0 : isPreviewLayer ? 0.93 : 0.86)
    : Math.min(meta.floorScale * 1.14, 1.18);
  const opacity = isPeekLayer ? 0.72 : isPreviewLayer ? 0.9 : 1;
  const layerGap = total >= 4 ? 18 : total === 3 ? 23 : 30;
  const layerTop = stacked
    ? (isActiveFloor ? 0 : 12 + index * layerGap)
    : 0;
  const clipPath = "none";
  const zIndex = isActiveFloor ? total + 30 : isPreviewLayer ? total + 20 : total - index;

  // 3D isometric transform — use translateZ so perspective foreshortening reads correctly
  const Z_STEP = 110; // px of real Z-depth per floor in 3D space
  let transform3D = "";
  if (view3D && stacked) {
    // Higher floors get more Z (toward viewer = lower on screen after rotateX looking-down)
    // Floors are sorted ascending so index 0 = floor 1 (ground) should appear at the front.
    const zShift = (total - 1 - index) * Z_STEP;
    transform3D = `translateX(-50%) translateY(-50%) translateZ(${zShift}px) scale(${isActiveFloor ? 1.0 : isPreviewLayer ? 0.97 : 0.93})`;
  } else if (view3D && !stacked) {
    // Single floor 3D: just scale, camera wrapper does the tilt
    transform3D = `scale(${scale})`;
  }

  return (
    <div
      role={stacked ? "button" : undefined}
      tabIndex={stacked ? 0 : undefined}
      onClick={stacked ? onSelect : undefined}
      onMouseEnter={stacked ? () => onHover?.(true) : undefined}
      onMouseLeave={stacked ? (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onHover?.(false);
      } : undefined}
      onFocus={stacked ? () => onHover?.(true) : undefined}
      onBlur={stacked ? (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onHover?.(false);
      } : undefined}
      onKeyDown={stacked ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      } : undefined}
      aria-label={stacked ? `Open Floor ${floorId} layer` : undefined}
      style={{
        ...S.floorPlane,
        position: stacked ? "absolute" : "relative",
        top: stacked ? (view3D ? "50%" : `${layerTop}%`) : undefined,
        left: stacked ? "50%" : undefined,
        width: stacked ? stackWidth : S.floorPlane.width,
        opacity,
        zIndex,
        cursor: stacked ? "pointer" : "default",
        clipPath,
        outline: "none",
        transform: view3D
          ? transform3D
          : stacked
            ? `translateX(-50%) translateY(${index * 6}px) scale(${scale})`
            : `scale(${scale})`,
        boxShadow: "none",
        transformStyle: view3D ? "preserve-3d" : undefined,
        filter: view3D && stacked
          ? isActiveFloor
            // Active floor: blue glow to pop it out
            ? `drop-shadow(0 0 18px rgba(37,99,235,0.55)) drop-shadow(0 ${12 + index * 4}px ${24 + index * 8}px rgba(15,23,42,${0.18 + index * 0.06}))`
            // Inactive floors: progressively darker shadow + desaturate
            : `drop-shadow(0 ${8 + index * 4}px ${16 + index * 8}px rgba(15,23,42,${0.12 + index * 0.05}))`
          : isActiveFloor
            ? "drop-shadow(0 30px 38px rgba(37,99,235,0.16)) drop-shadow(0 14px 24px rgba(87,83,78,0.16))"
            : isPreviewLayer
              ? "drop-shadow(0 24px 30px rgba(87,83,78,0.16))"
              : "drop-shadow(0 18px 22px rgba(87,83,78,0.12))",
        // Inactive floors in 3D layered: dim + desaturate
        ...(view3D && stacked && !isActiveFloor ? {
          opacity: isPeekLayer ? 0.45 : 0.78,
        } : { opacity }),
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, filter 0.3s ease",
      }}
    >
      {stacked && (
        <div style={{ ...S.layerGuideBadge, ...(isActiveFloor ? S.layerGuideBadgeActive : {}) }}>
          <span style={S.layerGuideNumber}>F{floorId}</span>
          <span>{role ?? "ROUTE FLOOR"}</span>
          {!isActiveFloor && <span style={S.layerHint}>{isPreviewLayer ? "tap to open" : "hover / tap"}</span>}
        </div>
      )}
      {/* 3D slab underside — rotates 90° to form a visible bottom face of the floor slab */}
      {view3D && stacked && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 4,
          right: 4,
          height: 72,
          background: isActiveFloor
            ? "linear-gradient(180deg, rgba(37,99,235,0.58) 0%, rgba(15,23,42,0.80) 100%)"
            : "linear-gradient(180deg, rgba(71,85,105,0.45) 0%, rgba(15,23,42,0.68) 100%)",
          borderRadius: "0 0 10px 10px",
          transform: "rotateX(-90deg)",
          transformOrigin: "top center",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 18,
          boxShadow: "inset 0 -10px 28px rgba(0,0,0,0.45)",
        }}>
          <span style={{
            fontSize: 30, fontWeight: 900, letterSpacing: 2,
            color: isActiveFloor ? "rgba(147,197,253,0.50)" : "rgba(255,255,255,0.22)",
            fontFamily: "Inter, system-ui, sans-serif",
            userSelect: "none",
          }}>F{floorId}</span>
        </div>
      )}
      {/* Single-floor 3D: simple bottom-edge depth strip */}
      {view3D && !stacked && (
        <div style={{
          position: "absolute",
          bottom: 0, left: 4, right: 4,
          height: 32,
          background: "linear-gradient(180deg, rgba(37,99,235,0.40) 0%, rgba(15,23,42,0.65) 100%)",
          borderRadius: "0 0 10px 10px",
          transform: "rotateX(-90deg)",
          transformOrigin: "top center",
          pointerEvents: "none",
        }} />
      )}
      <div style={S.floorGlassEdge} />
      {children}
      {stacked && !isActiveFloor && (
        <div style={S.layerPeekLabel}>
          F{floorId} · tap to open
        </div>
      )}
    </div>
  );
}

// ─── Walking / Climbing figure ───────────────────────────────────────────────
// walkT: real elapsed seconds (from walkProgress * totalMs / 1000) — smooth limb phase
// isOnStairs: true when traversing a stair segment
function WalkingFigure({ x, y, angle, walkT, isOnStairs, arrived }) {
  if (arrived) {
    // Arrived: stand upright, arms raised in celebration
    return (
      <g transform={`translate(${x},${y})`} pointerEvents="none">
        <ellipse cx={0} cy={22} rx={16} ry={5} fill="rgba(15,23,42,0.18)" />
        {/* Legs together */}
        <rect x={-5} y={6} width={4} height={14} rx={2} fill="#1d4ed8" />
        <rect x={1}  y={6} width={4} height={14} rx={2} fill="#1d4ed8" />
        {/* Body */}
        <ellipse cx={0} cy={0} rx={9} ry={11} fill="#2563eb" />
        {/* Arms raised */}
        <rect x={-18} y={-16} width={5} height={14} rx={2.5} fill="#3b82f6"
          transform="rotate(-55,-13,-9)" />
        <rect x={13}  y={-16} width={5} height={14} rx={2.5} fill="#3b82f6"
          transform="rotate(55,15,-9)" />
        {/* Head */}
        <circle cx={0} cy={-17} r={8} fill="#fbbf24" />
        {/* Star burst */}
        {[0,60,120,180,240,300].map(deg => (
          <line key={deg}
            x1={Math.cos(deg*Math.PI/180)*11} y1={-17+Math.sin(deg*Math.PI/180)*11}
            x2={Math.cos(deg*Math.PI/180)*17} y2={-17+Math.sin(deg*Math.PI/180)*17}
            stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        ))}
      </g>
    );
  }

  if (isOnStairs) {
    // Stair-climb posture: figure always faces upward on the map (angle locked)
    // Real step rhythm: one step every 0.55 seconds
    const STEP_PERIOD = 0.55;
    const phase = ((walkT % STEP_PERIOD) / STEP_PERIOD) * Math.PI * 2;
    const bob     = Math.sin(phase) * 3.5;
    const nod     = Math.sin(phase) * 5;      // head nod
    const lean    = -22;                       // forward lean degrees
    const leftLeg  = Math.sin(phase) * 38;
    const rightLeg = Math.sin(phase + Math.PI) * 38;
    // Arms reach up alternately — one grabs imaginary handrail
    const leftArm  = -55 + Math.sin(phase) * 30;
    const rightArm =  55 + Math.sin(phase + Math.PI) * 30;
    // Step flash: brief bright dot under the leading foot
    const stepFlash = Math.sin(phase) > 0.7;

    return (
      <g transform={`translate(${x},${y + bob})`} pointerEvents="none">
        {/* Ground shadow — smaller on stairs */}
        <ellipse cx={0} cy={22} rx={10} ry={3.5} fill="rgba(15,23,42,0.22)" />
        {/* Step-flash footprint */}
        {stepFlash && <ellipse cx={-5} cy={20} rx={5} ry={2.5} fill="rgba(37,99,235,0.35)" className="smartnav-footstep" />}
        <g transform={`rotate(${lean},0,0)`}>
          {/* Left leg with knee bend */}
          <g transform={`rotate(${leftLeg},-3,6)`}>
            <rect x={-6} y={6}  width={5} height={13} rx={2.5} fill="#1d4ed8" />
            <g transform={`translate(-3.5,19) rotate(${leftLeg > 0 ? -34 : 0})`}>
              <rect x={-2.5} y={0} width={5} height={9} rx={2.5} fill="#1e40af" />
              {/* Foot */}
              <rect x={-5} y={8} width={9} height={3.5} rx={1.5} fill="#1e3a8a" />
            </g>
          </g>
          {/* Right leg with knee bend */}
          <g transform={`rotate(${rightLeg},3,6)`}>
            <rect x={1} y={6} width={5} height={13} rx={2.5} fill="#1d4ed8" />
            <g transform={`translate(3.5,19) rotate(${rightLeg > 0 ? -34 : 0})`}>
              <rect x={-2.5} y={0} width={5} height={9} rx={2.5} fill="#1e40af" />
              <rect x={-4} y={8} width={9} height={3.5} rx={1.5} fill="#1e3a8a" />
            </g>
          </g>
          {/* Body */}
          <ellipse cx={0} cy={0} rx={9} ry={11} fill="#2563eb" />
          {/* Left arm — reaches up for handrail */}
          <g transform={`rotate(${leftArm},-9,-2)`}>
            <rect x={-13} y={-4} width={5} height={13} rx={2.5} fill="#3b82f6" />
            {/* Hand dot */}
            <circle cx={-10.5} cy={9} r={3} fill="#60a5fa" />
          </g>
          {/* Right arm */}
          <g transform={`rotate(${rightArm},9,-2)`}>
            <rect x={8} y={-4} width={5} height={13} rx={2.5} fill="#3b82f6" />
            <circle cx={10.5} cy={9} r={3} fill="#60a5fa" />
          </g>
          {/* Head with nod */}
          <g transform={`rotate(${nod},0,-17)`}>
            <circle cx={0} cy={-17} r={8} fill="#fbbf24" />
            {/* Face dots */}
            <circle cx={-2.5} cy={-18} r={1.2} fill="rgba(120,53,15,0.7)" />
            <circle cx={2.5}  cy={-18} r={1.2} fill="rgba(120,53,15,0.7)" />
          </g>
          {/* STAIRS badge */}
          <g transform="translate(12,-26)">
            <rect x={0} y={-8} width={38} height={15} rx={7.5} fill="rgba(245,158,11,0.94)" />
            <text x={19} y={5} textAnchor="middle" fontSize="8.5" fill="white" fontWeight="900" letterSpacing="0.4">STAIRS</text>
          </g>
        </g>
      </g>
    );
  }

  // Normal walking — real-time limb phase from walkT
  // One stride cycle every 0.45 seconds
  const STRIDE = 0.45;
  const phase   = ((walkT % STRIDE) / STRIDE) * Math.PI * 2;
  const bob     = Math.abs(Math.sin(phase)) * 2.5;   // body bobs up on each step
  const legSwing = Math.sin(phase) * 22;
  const armSwing = Math.sin(phase) * 28;
  const nod      = Math.sin(phase) * 4;

  return (
    <g transform={`translate(${x},${y - bob}) rotate(${angle + 90})`} pointerEvents="none">
      {/* Footstep flash on ground */}
      {Math.sin(phase) > 0.82 && (
        <ellipse cx={-5} cy={22} rx={5} ry={2} fill="rgba(37,99,235,0.28)" className="smartnav-footstep" />
      )}
      {/* Ground shadow */}
      <ellipse cx={0} cy={20} rx={14} ry={4.5} fill="rgba(15,23,42,0.18)" />
      {/* Left leg */}
      <g transform={`rotate(${legSwing},-2.5,6)`}>
        <rect x={-6} y={6} width={5} height={13} rx={2.5} fill="#1d4ed8" />
        {/* Knee bend on backswing */}
        <g transform={`translate(-3.5,19) rotate(${legSwing < -8 ? 22 : 0})`}>
          <rect x={-2.5} y={0} width={5} height={9} rx={2.5} fill="#1e40af" />
          <rect x={-5} y={8} width={9} height={3.5} rx={1.5} fill="#1e3a8a" />
        </g>
      </g>
      {/* Right leg */}
      <g transform={`rotate(${-legSwing},2.5,6)`}>
        <rect x={1} y={6} width={5} height={13} rx={2.5} fill="#1d4ed8" />
        <g transform={`translate(3.5,19) rotate(${-legSwing < -8 ? 22 : 0})`}>
          <rect x={-2.5} y={0} width={5} height={9} rx={2.5} fill="#1e40af" />
          <rect x={-4} y={8} width={9} height={3.5} rx={1.5} fill="#1e3a8a" />
        </g>
      </g>
      {/* Body */}
      <ellipse cx={0} cy={0} rx={9} ry={11} fill="#2563eb" />
      {/* Left arm */}
      <g transform={`rotate(${-armSwing},-11,-3)`}>
        <rect x={-14} y={-3} width={5} height={12} rx={2.5} fill="#3b82f6" />
        <circle cx={-11.5} cy={9} r={2.8} fill="#60a5fa" />
      </g>
      {/* Right arm */}
      <g transform={`rotate(${armSwing},11,-3)`}>
        <rect x={9} y={-3} width={5} height={12} rx={2.5} fill="#3b82f6" />
        <circle cx={11.5} cy={9} r={2.8} fill="#60a5fa" />
      </g>
      {/* Head with travel nod */}
      <g transform={`rotate(${nod},0,-17)`}>
        <circle cx={0} cy={-17} r={8} fill="#fbbf24" />
        <circle cx={-2.5} cy={-18} r={1.2} fill="rgba(120,53,15,0.7)" />
        <circle cx={2.5}  cy={-18} r={1.2} fill="rgba(120,53,15,0.7)" />
      </g>
      {/* Direction arrow above head */}
      <polygon points="0,-33 -5,-25 5,-25" fill="#2563eb" opacity="0.82" />
    </g>
  );
}

function SearchBox({ search, setSearch, results, onSelect }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  const groupedResults = useMemo(() => {
    return results.reduce((groups, room) => {
      const key = room.floor;
      if (!groups[key]) groups[key] = [];
      groups[key].push(room);
      return groups;
    }, {});
  }, [results]);

  return (
    <div style={S.searchWrap} ref={boxRef}>
      <div style={S.searchBar}>
        <AssetIcon src={iconSearch} size={19} style={S.searchIcon} />
        <input
          style={S.searchInput}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search rooms, labs, offices..."
        />
        {search && (
          <button
            type="button"
            style={S.searchClear}
            onClick={() => {
              setSearch("");
              setOpen(false);
            }}
          >
            ×
          </button>
        )}
      </div>
      {open && search.trim() && (
        <div style={S.searchDropdown}>
          {results.length === 0 ? (
            <div style={S.emptySearch}>No matching room found.</div>
          ) : (
            Object.entries(groupedResults).sort((a, b) => Number(a[0]) - Number(b[0])).map(([floorId, rooms]) => (
              <div key={floorId}>
                <div style={S.searchGroupHeader}>{ordinal(Number(floorId))} Floor</div>
                {rooms.map((room) => {
                  const meta = ROOM_STYLE_META[room.type] ?? ROOM_STYLE_META.office;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      style={S.searchItem}
                      onClick={() => {
                        onSelect(room);
                        setOpen(false);
                      }}
                    >
                      <span style={{ ...S.searchColor, background: meta.color }} />
                      <span style={S.searchTextBlock}>
                        <span style={S.searchName}>{room.name}</span>
                        <span style={S.searchMeta}><AssetIcon src={meta.icon} size={13} style={S.searchMetaIcon} /> {meta.label} · Floor {room.floor}</span>
                      </span>
                      <span style={S.floorMini}>F{room.floor}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RouteSteps({ route, destination, steps, activeStepIndex, navMode, onStepClick, onPrev, onNext, onStartStep, onOverview, bare = false }) {
  const changes = useMemo(() => floorChangesFromPath(route), [route]);
  const distanceMeters = routeDistanceMeters(route);

  const stepTypeStyle = (type) => {
    if (type === "start") return S.stepStart;
    if (type === "arrive") return S.stepArrive;
    if (type === "up") return S.stepUp;
    if (type === "down") return S.stepDown;
    return {};
  };

  if (!destination) {
    if (bare) return null;
    return (
      <div style={S.stepsCard}>
        <div style={S.panelTitle}>ROUTE</div>
        <div style={S.noRoute}>Choose a destination to generate a route.</div>
      </div>
    );
  }
  if (route.length === 0) {
    const errorBlock = (
      <div style={{
        background: "rgba(239,68,68,0.08)", borderRadius: 10,
        padding: "12px 14px", border: "1px solid rgba(239,68,68,0.18)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", marginBottom: 4 }}>
          ⚠ Route unavailable
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
          No path found to <strong>{destination.name}</strong>. This room may not be reachable from your current location.
        </div>
      </div>
    );
    if (bare) return errorBlock;
    return (
      <div style={S.stepsCard}>
        <div style={S.panelTitle}>ROUTE</div>
        {errorBlock}
      </div>
    );
  }

  const navigateBtn = (
    <button
      type="button"
      style={{ ...S.stepModeButton, ...(navMode === "step" ? S.stepModeButtonActive : {}) }}
      onClick={navMode === "step" ? onOverview : onStartStep}
    >
      {navMode === "step" ? "Overview" : "Navigate"}
    </button>
  );

  const timeline = (
    <>
      <div style={S.stepsTimeline}>
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex && navMode === "step";
          const isLast = index === steps.length - 1;
          return (
            <button
              key={`${step.title}-${index}`}
              type="button"
              style={{ ...S.timelineStep, ...(isActive ? S.timelineStepActive : {}) }}
              onClick={() => onStepClick(index)}
            >
              <div style={S.timelineLeft}>
                <div style={{ ...S.timelineDot, ...stepTypeStyle(step.type) }}>
                  <AssetIcon src={iconForStep(step)} size={13} />
                </div>
                {!isLast && <div style={{ ...S.timelineLine, ...(isActive ? S.timelineLineActive : {}) }} />}
              </div>
              <div style={S.timelineContent}>
                <div style={{ ...S.timelineTitle, ...(isActive ? S.timelineTitleActive : {}) }}>{step.title}</div>
                <div style={S.timelineSub}>{step.sub}</div>
              </div>
              {isActive && <div style={S.timelineActivePip} />}
            </button>
          );
        })}
      </div>
      {navMode === "step" && (
        <div style={S.stepControlRow}>
          <button type="button" style={S.stepControlButton} onClick={onPrev} disabled={activeStepIndex <= 0}>← Back</button>
          <span style={S.stepCounter}>{activeStepIndex + 1} / {steps.length}</span>
          <button type="button" style={{ ...S.stepControlButton, ...S.stepControlButtonPrimary }} onClick={onNext} disabled={activeStepIndex >= steps.length - 1}>Next →</button>
        </div>
      )}
    </>
  );

  if (bare) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#64748b", textTransform: "uppercase" }}>Directions</span>
          {navigateBtn}
        </div>
        {timeline}
      </>
    );
  }

  return (
    <div style={S.stepsCard}>
      <div style={S.routeHeaderRow}>
        <div>
          <div style={S.panelTitle}>ROUTE</div>
          <div style={S.routeSummaryMini}>{distanceMeters}m · {changes.length} floor change{changes.length === 1 ? "" : "s"}</div>
        </div>
        {navigateBtn}
      </div>
      {timeline}
    </div>
  );
}


// ─── Voice Assistant Hook ──────────────────────────────────────────────────────
// Uses Web Speech API — SpeechSynthesis (TTS) + SpeechRecognition (STT)
// Female voice, speaks navigation steps and listens for room name commands.

function useVoiceAssistant({ destination, activeStep, activeStepIndex, arrived, allRooms, onNavigateTo, onReset }) {
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const lastSpokenStep = useRef(-1);
  const lastSpokenDest = useRef(null);

  const getFemaleVoice = () => {
    const voices = synthRef.current.getVoices();
    return (
      voices.find(v => v.name === 'Google UK English Female') ||
      voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang)) ||
      voices.find(v => /zira|samantha|karen|moira|fiona|victoria|allison|susan|kate/i.test(v.name)) ||
      voices.find(v => /en/i.test(v.lang)) ||
      voices[0] || null
    );
  };

  const speak = (text) => {
    if (!voiceOn || !text) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.voice = getFemaleVoice();
    utt.rate = 0.95;
    utt.pitch = 1.1;
    utt.volume = 1;
    synthRef.current.speak(utt);
  };

  useEffect(() => {
    if (!destination) { lastSpokenDest.current = null; lastSpokenStep.current = -1; return; }
    if (destination.id === lastSpokenDest.current) return;
    lastSpokenDest.current = destination.id;
    lastSpokenStep.current = -1;
    speak(`Route set. Navigating to ${destination.name}.`);
  }, [destination?.id, voiceOn]);

  useEffect(() => {
    if (!activeStep || activeStepIndex === lastSpokenStep.current) return;
    lastSpokenStep.current = activeStepIndex;
    const text = activeStep.sub ? `${activeStep.title}. ${activeStep.sub}` : activeStep.title;
    speak(text);
  }, [activeStepIndex, activeStep?.title, voiceOn]);

  useEffect(() => {
    if (!arrived || !destination) return;
    speak(`You have arrived at ${destination.name}. Enjoy your visit!`);
  }, [arrived, voiceOn]);

  useEffect(() => {
    if (!voiceOn) synthRef.current.cancel();
  }, [voiceOn]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceStatus('Speech recognition not supported.'); return; }
    if (recognitionRef.current) recognitionRef.current.abort();
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    recognitionRef.current = rec;
    rec.onstart = () => { setListening(true); setVoiceStatus('Listening\u2026'); setTranscript(''); };
    rec.onresult = (e) => {
      const said = Array.from(e.results[0]).map(alt => alt.transcript.toLowerCase().trim()).join(' ');
      setTranscript(said);
      handleVoiceCommand(said);
    };
    rec.onerror = (e) => {
      setListening(false);
      setVoiceStatus(e.error === 'no-speech' ? 'No speech detected. Try again.' : `Mic error: ${e.error}`);
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  const stopListening = () => { recognitionRef.current?.abort(); setListening(false); setVoiceStatus(''); };

  const handleVoiceCommand = (said) => {
    if (/\b(clear|reset|cancel|stop navigation)\b/.test(said)) {
      onReset(); speak('Navigation cleared.'); setVoiceStatus('Navigation cleared.'); return;
    }
    const cmdMatch = said.match(/(?:navigate to|go to|find|where is|take me to|directions to)\s+(.+)/);
    const query = (cmdMatch ? cmdMatch[1] : said).toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const scored = allRooms.map(r => {
      const name = r.name.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const qTokens = query.split(' ').filter(Boolean);
      const nTokens = name.split(' ').filter(Boolean);
      const overlap = qTokens.filter(t => nTokens.some(n => n.includes(t) || t.includes(n))).length;
      return { room: r, score: overlap / Math.max(qTokens.length, 1) };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    if (scored.length > 0) {
      const match = scored[0].room;
      setVoiceStatus(`Navigating to ${match.name}`);
      speak(`Sure! Navigating to ${match.name}.`);
      onNavigateTo(match);
    } else {
      setVoiceStatus(`Couldn\'t find: "${query}"`);
      speak(`Sorry, I couldn\'t find ${query}. Please try again.`);
    }
  };

  return { voiceOn, setVoiceOn, listening, transcript, voiceStatus, speak, startListening, stopListening };
}

export default function SmartNav() {
  const [activeFloor, setActiveFloor] = useState(1);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("lab");
  const [hoveredRoomId, setHoveredRoomId] = useState(null);
  const [viewMode, setViewMode] = useState("single");
  const [hoveredLayerFloor, setHoveredLayerFloor] = useState(null);
  const [pinnedLayerFloor, setPinnedLayerFloor] = useState(null);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [simpleMode, setSimpleMode] = useState(false);
  const [navMode, setNavMode] = useState("overview");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [routePreviewing, setRoutePreviewing] = useState(false);
  const [animOffset, setAnimOffset] = useState(0);
  const [startNodeId, setStartNodeId] = useState(DEFAULT_KIOSK_NODE);
  const [startLocation, setStartLocation] = useState({
    type: "kiosk",
    label: "You are here",
    floor: KIOSK_FLOOR,
    nodeId: DEFAULT_KIOSK_NODE,
  });
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [view3D, setView3D] = useState(false);
  // Room info modal state
  const [modalRoom, setModalRoom] = useState(null);

  // ── Feature: persistent room database ─────────────────────────────────────
  // Fetches room metadata (photos, descriptions, office hours) from your API.
  // Set window.__SMARTNAV_API_BASE__ before mounting to enable, e.g.:
  //   window.__SMARTNAV_API_BASE__ = 'http://localhost:8080';
  const SMARTNAV_API_BASE = typeof window !== "undefined"
    ? (window.__SMARTNAV_API_BASE__ ?? "")
    : "";
  const [dbRooms, setDbRooms] = useState([]);
  useEffect(() => {
    if (!SMARTNAV_API_BASE) return;
    fetch(`${SMARTNAV_API_BASE}/api/rooms`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setDbRooms(data); })
      .catch(() => {});
  }, [SMARTNAV_API_BASE]);
  const roomDbMap = useMemo(() => {
    const map = new Map();
    dbRooms.forEach((r) => map.set(r.roomId ?? r.room_id, r));
    return map;
  }, [dbRooms]);

  // ── Feature: kiosk "You Are Here" floor picker ────────────────────────────
  const [kioskPickerOpen, setKioskPickerOpen] = useState(false);

  const selectKioskFloor = (floor) => {
    const nodeId = KIOSK_POSITIONS[floor] ?? DEFAULT_KIOSK_NODE;
    setStartNodeId(nodeId);
    setStartLocation({ type: "kiosk", label: `Floor ${floor} – Start`, floor, nodeId });
    setKioskPickerOpen(false);
    if (destination) {
      const nextRoute = findPath(nodeId, getNearestNodeForRoom(destination.id));
      setRoute(nextRoute);
    }
  };

  // Inject CSS animations once
  useEffect(() => {
    if (document.getElementById("smartnav-anim-styles")) return;
    const el = document.createElement("style");
    el.id = "smartnav-anim-styles";
    el.textContent = RIPPLE_STYLE;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // Walk animation state
  const [walkActive, setWalkActive] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0); // 0..1
  const [walkT, setWalkT] = useState(0);               // real elapsed seconds for limb phase
  const [arrived, setArrived] = useState(false);
  const [stairFlashFloor, setStairFlashFloor] = useState(null); // { floor } when floor changes
  const walkRafRef = useRef(null);
  const walkStartRef = useRef(null);
  const lastStairFloor = useRef(null); // track last known floor to detect transitions

  // 2D map pan state
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const mapShellRef = useRef(null);
  const isPanning2D = useRef(false);
  const panStart2D = useRef({ px: 0, py: 0, x: 0, y: 0 });
  const lastTouchDist2D = useRef(null);
  const touch2DHasMoved = useRef(false);
  const TAP_THRESHOLD = 8; // px — movement below this is treated as a tap, not a pan

  // 3D camera state — slightly shallower angle exposes more slab faces
  const ISO_ROT_X = 50;
  const ISO_ROT_Z = 38;
  const [camRotX, setCamRotX] = useState(ISO_ROT_X);
  const [camRotZ, setCamRotZ] = useState(ISO_ROT_Z);
  const [cam3DZoom, setCam3DZoom] = useState(0.72);
  const [importantOnly, setImportantOnly] = useState(true);
  const [filterFloor, setFilterFloor] = useState(null); // null = all floors
  const isDragging3D = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const camRef = useRef({ rotX: ISO_ROT_X, rotZ: ISO_ROT_Z });
  // Inertia: track drag velocity and damp on mouse-up
  const velRef = useRef({ vx: 0, vy: 0 });
  const inertiaRaf = useRef(null);

  const resetCamera = () => { setCamRotX(ISO_ROT_X); setCamRotZ(ISO_ROT_Z); setCam3DZoom(0.72); };
  const setIsometric = () => { setCamRotX(ISO_ROT_X); setCamRotZ(ISO_ROT_Z); };

  const stopInertia = () => {
    if (inertiaRaf.current) { cancelAnimationFrame(inertiaRaf.current); inertiaRaf.current = null; }
  };
  const startInertia = () => {
    stopInertia();
    const tick = () => {
      velRef.current.vx *= 0.92;
      velRef.current.vy *= 0.92;
      if (Math.abs(velRef.current.vx) < 0.02 && Math.abs(velRef.current.vy) < 0.02) return;
      setCamRotZ((z) => z + velRef.current.vx);
      setCamRotX((x) => Math.max(10, Math.min(82, x + velRef.current.vy)));
      inertiaRaf.current = requestAnimationFrame(tick);
    };
    inertiaRaf.current = requestAnimationFrame(tick);
  };

  const handle3DMouseDown = (e) => {
    if (!view3D) return;
    stopInertia();
    isDragging3D.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velRef.current = { vx: 0, vy: 0 };
    camRef.current = { rotX: camRotX, rotZ: camRotZ };
    e.preventDefault();
  };
  const handle3DMouseMove = (e) => {
    if (!isDragging3D.current || !view3D) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velRef.current = { vx: dx * 0.35, vy: dy * 0.35 };
    setCamRotZ((z) => z + dx * 0.35);
    setCamRotX((x) => Math.max(10, Math.min(82, x + dy * 0.35)));
  };
  const handle3DMouseUp = () => { isDragging3D.current = false; startInertia(); };
  const handle3DWheel = (e) => {
    if (!view3D) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.07 : 0.07;
    setCam3DZoom((z) => Math.max(0.28, Math.min(2.2, z + delta)));
  };
  // Touch support
  const lastTouchDist = useRef(null);
  const handle3DTouchStart = (e) => {
    if (!view3D) return;
    stopInertia();
    velRef.current = { vx: 0, vy: 0 };
    if (e.touches.length === 1) {
      isDragging3D.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging3D.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  };
  const handle3DTouchMove = (e) => {
    if (!view3D) return;
    if (e.touches.length === 1 && isDragging3D.current) {
      const dx = e.touches[0].clientX - lastPointer.current.x;
      const dy = e.touches[0].clientY - lastPointer.current.y;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      velRef.current = { vx: dx * 0.35, vy: dy * 0.35 };
      setCamRotZ((z) => z + dx * 0.35);
      setCamRotX((x) => Math.max(10, Math.min(82, x + dy * 0.35)));
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - lastTouchDist.current) * 0.004;
      setCam3DZoom((z) => Math.max(0.28, Math.min(2.2, z + delta)));
      lastTouchDist.current = dist;
    }
    e.preventDefault();
  };
  const handle3DTouchEnd = () => { isDragging3D.current = false; lastTouchDist.current = null; startInertia(); };

  // ── 2D pan + scroll-to-zoom ───────────────────────────────────────────────
  // Convert a screen-pixel delta to SVG-coordinate delta for the current floor + zoom.
  const pixelToSVGDelta = (dxPx, dyPx) => {
    const el = mapShellRef.current;
    if (!el) return { dx: 0, dy: 0 };
    const rect = el.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    const curFloor = getFloorById(activeFloor);
    const bounds = curFloor?.bounds;
    const PAD = 60;
    const bw = bounds ? (bounds.x2 - bounds.x1) + PAD * 2 : 1672;
    const bh = bounds ? (bounds.y2 - bounds.y1) + PAD * 2 : 941;
    const safeZoom = clamp(mapZoom, ZOOM_MIN, ZOOM_MAX);
    const vbW = bw / safeZoom;
    const vbH = bh / safeZoom;
    const scale = Math.max(vbW / w, vbH / h);
    return { dx: dxPx * scale, dy: dyPx * scale };
  };

  const handle2DPointerDown = (e) => {
    if (view3D) return;
    isPanning2D.current = true;
    const cx = e.clientX ?? 0;
    const cy = e.clientY ?? 0;
    panStart2D.current = { px: cx, py: cy, x: mapPan.x, y: mapPan.y };
    e.currentTarget?.setPointerCapture?.(e.pointerId);
  };

  const handle2DPointerMove = (e) => {
    if (view3D || !isPanning2D.current) return;
    const dpx = e.clientX - panStart2D.current.px;
    const dpy = e.clientY - panStart2D.current.py;
    const { dx, dy } = pixelToSVGDelta(dpx, dpy);
    setMapPan({ x: panStart2D.current.x - dx, y: panStart2D.current.y - dy });
  };

  const handle2DPointerUp = () => { isPanning2D.current = false; };

  const handle2DWheel = (e) => {
    if (view3D) return;
    e.preventDefault();
    if (e.deltaY < 0) setMapZoom((z) => Number(clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX).toFixed(2)));
    else setMapZoom((z) => Number(clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX).toFixed(2)));
  };

  const handle2DTouchStart = (e) => {
    if (view3D) return;
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      lastTouchDist2D.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      isPanning2D.current = false;
      touch2DHasMoved.current = false;
    } else if (e.touches.length === 1) {
      isPanning2D.current = false; // don't commit to pan yet — wait for movement
      touch2DHasMoved.current = false;
      panStart2D.current = { px: e.touches[0].clientX, py: e.touches[0].clientY, x: mapPan.x, y: mapPan.y };
      lastTouchDist2D.current = null;
    }
  };

  const handle2DTouchMove = (e) => {
    if (view3D) return;
    e.preventDefault();
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (lastTouchDist2D.current != null) {
        const delta = (dist - lastTouchDist2D.current) * 0.006;
        setMapZoom((z) => Number(clamp(z + delta, ZOOM_MIN, ZOOM_MAX).toFixed(2)));
      }
      lastTouchDist2D.current = dist;
    } else if (e.touches.length === 1) {
      const dpx = e.touches[0].clientX - panStart2D.current.px;
      const dpy = e.touches[0].clientY - panStart2D.current.py;
      if (!isPanning2D.current) {
        // Only commit to pan once the finger moves beyond the tap threshold
        if (Math.hypot(dpx, dpy) > TAP_THRESHOLD) {
          isPanning2D.current = true;
          touch2DHasMoved.current = true;
        } else {
          return;
        }
      }
      const { dx, dy } = pixelToSVGDelta(dpx, dpy);
      setMapPan({ x: panStart2D.current.x - dx, y: panStart2D.current.y - dy });
    }
  };

  const handle2DTouchEnd = (e) => {
    const wasTap = !touch2DHasMoved.current && !isPanning2D.current;
    isPanning2D.current = false;
    touch2DHasMoved.current = false;
    lastTouchDist2D.current = null;
    // If the finger didn't move, treat it as a tap by dispatching a click
    // on the element that was originally touched.
    if (wasTap && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const target = document.elementFromPoint(t.clientX, t.clientY);
      if (target) target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: t.clientX, clientY: t.clientY }));
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => setAnimOffset((value) => (value + 2) % 1000), 60);
    return () => window.clearInterval(id);
  }, []);

  const searchResults = useMemo(() => {
    const terms = searchTermsFromQuery(search);
    if (!terms.length) return [];
    return ALL_ROOMS
      .map((room) => {
        const haystack = searchableRoomText(room);
        const score = terms.reduce((total, term) => total + (haystack.includes(term) ? (term === search.trim().toLowerCase() ? 4 : 2) : 0), 0);
        return { room, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.room.floor - b.room.floor || a.room.name.localeCompare(b.room.name))
      .map((item) => item.room)
      .slice(0, 18);
  }, [search]);

  const routeFloors = useMemo(() => routeFloorsFromPath(route), [route]);
  const isMultiFloor = routeFloors.length > 1;

  const routeDistance = useMemo(() => distanceForPath(route), [route]);
  const floorChanges = useMemo(() => floorChangesFromPath(route), [route]);
  const routeMeters = useMemo(() => routeDistanceMeters(route), [route]);

  // Walking time: sum actual 2D path distances from getPathPoints(), then divide
  // by ~80 px/sec walking speed + 15 sec penalty per floor change.
  const eta = useMemo(() => {
    if (!destination || route.length === 0) return null;
    const pts = getPathPoints(route);
    let totalPx = 0;
    for (let i = 1; i < pts.length; i++) {
      totalPx += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    }
    const totalSec = totalPx / 80 + floorChanges.length * 15;
    return Math.max(1, Math.round(totalSec / 60));
  }, [destination, route, floorChanges]);
  const startNode = useMemo(() => getNode(startNodeId), [startNodeId]);
  const startFloor = startNode?.floor ?? startLocation.floor ?? KIOSK_FLOOR;
  const navSteps = useMemo(() => buildNavigationSteps(route, destination, startLocation), [route, destination, startLocation]);
  const activeStep = navSteps[activeStepIndex] ?? null;

  // ── Voice Assistant ──────────────────────────────────────────────────────────
  // Use refs for callbacks so the hook isn't affected by definition order
  const navigateToRef = useRef(null);
  const clearRouteRef = useRef(null);
  const voice = useVoiceAssistant({
    destination,
    activeStep,
    activeStepIndex,
    arrived,
    allRooms: ALL_ROOMS,
    onNavigateTo: (room) => navigateToRef.current?.(room),
    onReset: () => clearRouteRef.current?.(),
  });

  const selectedLayerFloor = useMemo(() => {
    if (viewMode !== "layered" || routeFloors.length === 0) return activeFloor;
    if (pinnedLayerFloor && routeFloors.includes(pinnedLayerFloor)) return pinnedLayerFloor;
    if (activeFloor && routeFloors.includes(activeFloor)) return activeFloor;
    if (destination && routeFloors.includes(destination.floor)) return destination.floor;
    return routeFloors[routeFloors.length - 1] ?? activeFloor;
  }, [activeFloor, destination, pinnedLayerFloor, routeFloors, viewMode]);

  const shownFloors = useMemo(() => {
    if (viewMode === "layered" && routeFloors.length > 0) {
      const rest = routeFloors
        .filter((floorId) => floorId !== selectedLayerFloor)
        .sort((a, b) => b - a);
      return [selectedLayerFloor, ...rest];
    }
    return [activeFloor];
  }, [activeFloor, routeFloors, selectedLayerFloor, viewMode]);

  useEffect(() => {
    if (isMultiFloor) {
      setViewMode("layered");
      if (!pinnedLayerFloor && destination) setPinnedLayerFloor(destination.floor);
    }
  }, [destination, isMultiFloor, pinnedLayerFloor]);

  useEffect(() => {
    if (!activeStep || navMode !== "step") return;
    const focusFloor = activeStep.nextFloor ?? activeStep.floor;
    if (!focusFloor) return;
    setActiveFloor(focusFloor);
    if (routeFloors.includes(focusFloor)) setPinnedLayerFloor(focusFloor);
    setViewMode(routeFloors.length > 1 ? "layered" : "single");
  }, [activeStep, navMode, routeFloors]);

  useEffect(() => {
    if (!routePreviewing) return undefined;
    const id = window.setTimeout(() => setRoutePreviewing(false), 3600);
    return () => window.clearTimeout(id);
  }, [routePreviewing]);


  const navigateTo = (room) => {
    const routeStartNode = startNodeId;
    const endNode = getNearestNodeForRoom(room.id);
    const nextRoute = routeStartNode && endNode ? findPath(routeStartNode, endNode) : [];
    const nextRouteFloors = routeFloorsFromPath(nextRoute);
    setDestination(room);
    setRoute(nextRoute);
    setActiveFloor(room.floor);
    setPinnedLayerFloor(nextRouteFloors.length > 1 ? room.floor : null);
    setHoveredLayerFloor(null);
    setSearch("");
    setActiveCategory(null);
    setActiveStepIndex(0);
    setNavMode(nextRoute.length ? "step" : "overview");
    setRoutePreviewing(Boolean(nextRoute.length));
    setMapZoom(DEFAULT_MAP_ZOOM);
    setMapPan({ x: 0, y: 0 });
    setViewMode(nextRoute.length && nextRouteFloors.length > 1 ? "layered" : "single");
  };

  const setUserLocation = (room) => {
    const nodeId = getNearestNodeForRoom(room.id);
    if (!nodeId) return;

    const nextRoute = destination ? findPath(nodeId, getNearestNodeForRoom(destination.id)) : [];
    const nextRouteFloors = routeFloorsFromPath(nextRoute);

    setStartNodeId(nodeId);
    setStartLocation({
      type: "room",
      label: room.name,
      floor: room.floor,
      roomId: room.id,
      nodeId,
    });
    setIsSettingLocation(false);
    setActiveFloor(destination ? destination.floor : room.floor);
    setPinnedLayerFloor(nextRouteFloors.length > 1 ? (destination?.floor ?? room.floor) : null);
    setHoveredLayerFloor(null);
    setSearch("");
    setRoute(nextRoute);
    setActiveStepIndex(0);
    setNavMode(destination && nextRoute.length ? "step" : "overview");
    setRoutePreviewing(Boolean(destination && nextRoute.length));
    setViewMode(nextRoute.length && nextRouteFloors.length > 1 ? "layered" : "single");
  };

  const resetUserLocation = () => {
    const nextRoute = destination ? findPath(DEFAULT_KIOSK_NODE, getNearestNodeForRoom(destination.id)) : [];
    const nextRouteFloors = routeFloorsFromPath(nextRoute);
    setStartNodeId(DEFAULT_KIOSK_NODE);
    setStartLocation({
      type: "kiosk",
      label: "You are here",
      floor: KIOSK_FLOOR,
      nodeId: DEFAULT_KIOSK_NODE,
    });
    setIsSettingLocation(false);
    setRoute(nextRoute);
    setActiveFloor(destination ? destination.floor : KIOSK_FLOOR);
    setPinnedLayerFloor(nextRouteFloors.length > 1 ? (destination?.floor ?? KIOSK_FLOOR) : null);
    setHoveredLayerFloor(null);
    setActiveStepIndex(0);
    setNavMode(destination && nextRoute.length ? "step" : "overview");
    setViewMode(nextRoute.length && nextRouteFloors.length > 1 ? "layered" : "single");
  };

  const handleRoomAction = (room) => {
    if (isSettingLocation) {
      // In location-setting mode: set location immediately on first tap — no modal needed
      setUserLocation(room);
    } else {
      setModalRoom(room);
    }
  };

  const clearRoute = () => {
    setDestination(null);
    setRoute([]);
    setActiveFloor(startFloor);
    setPinnedLayerFloor(null);
    setHoveredLayerFloor(null);
    setActiveStepIndex(0);
    setNavMode("overview");
    setRoutePreviewing(false);
    setViewMode("single");
    stopWalk();
  };

  // Bind voice callback refs now that both functions are defined
  navigateToRef.current = navigateTo;
  clearRouteRef.current = clearRoute;

  const zoomIn = () => setMapZoom((value) => Number(clamp(value + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX).toFixed(2)));
  const zoomOut = () => setMapZoom((value) => Number(clamp(value - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX).toFixed(2)));
  const resetZoom = () => { setMapZoom(DEFAULT_MAP_ZOOM); setMapPan({ x: 0, y: 0 }); };

  // Walk animation helpers
  // Build walk points — each point tagged with floor
  const walkPoints = useMemo(() => {
    if (!route.length) return [];
    return route.map(nodeId => {
      const node = getNode(nodeId);
      if (!node) return null;
      const changes = floorChangesFromPath(route);
      const changeFromSet = new Set(changes.map(c => c.fromNodeId));
      const p = mapPoint({ ...node, id: nodeId }, { useStairMarker: changeFromSet.has(nodeId) });
      return { x: p.x, y: p.y, floor: node.floor };
    }).filter(Boolean);
  }, [route]);

  // Per-segment time table — stair segments run at 42 px/sec, walking at 180 px/sec
  // A segment is a stair segment ONLY if its two endpoints are on different floors.
  const walkTimeTable = useMemo(() => {
    const NORMAL_SPEED = 180;
    const STAIR_SPEED  = 42;
    const segs = [];
    let t = 0;
    for (let i = 1; i < walkPoints.length; i++) {
      const a = walkPoints[i - 1], b = walkPoints[i];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      // A segment is a stair segment ONLY when its endpoints are on different floors
      const isStair = a.floor !== b.floor;
      const speed = isStair ? STAIR_SPEED : NORMAL_SPEED;
      const dur = (dist / speed) * 1000;
      segs.push({ dist, tStart: t, tEnd: t + dur, duration: dur, isStair });
      t += dur;
    }
    return { segments: segs, totalMs: t };
  }, [walkPoints]);

  const startWalk = () => {
    if (!walkPoints.length) return;
    setWalkActive(true);
    setWalkProgress(0);
    setWalkT(0);
    setArrived(false);
    setStairFlashFloor(null);
    lastStairFloor.current = null;
    walkStartRef.current = null;
    const totalMs = walkTimeTable.totalMs;
    const tick = (ts) => {
      if (!walkStartRef.current) walkStartRef.current = ts;
      const elapsed = ts - walkStartRef.current;
      const prog = Math.min(elapsed / totalMs, 1);
      const tSec = elapsed / 1000;
      setWalkProgress(prog);
      setWalkT(tSec);
      if (prog < 1) {
        walkRafRef.current = requestAnimationFrame(tick);
      } else {
        setWalkActive(false);
        setArrived(true);
        setStairFlashFloor(null);
        walkRafRef.current = null;
        // Auto-clear arrived celebration after 2.5s
        setTimeout(() => setArrived(false), 2500);
      }
    };
    walkRafRef.current = requestAnimationFrame(tick);
  };

  const stopWalk = () => {
    if (walkRafRef.current) { cancelAnimationFrame(walkRafRef.current); walkRafRef.current = null; }
    setWalkActive(false);
    setWalkProgress(0);
    setWalkT(0);
    setArrived(false);
    setStairFlashFloor(null);
    lastStairFloor.current = null;
  };

  // Interpolated walker position — uses time-based progress via walkTimeTable
  const walkerState = useMemo(() => {
    const { segments, totalMs } = walkTimeTable;
    if (!walkPoints.length || !segments.length || totalMs === 0) return null;
    const currentMs = walkProgress * totalMs;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (currentMs <= seg.tEnd || i === segments.length - 1) {
        const t = seg.duration > 0 ? Math.min((currentMs - seg.tStart) / seg.duration, 1) : 1;
        const a = walkPoints[i], b = walkPoints[i + 1] ?? walkPoints[i];
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        // On stair segments the two map-points share the same XY (same staircase,
        // different floor), so atan2(0,0)=0 would snap the character to face right.
        // Instead, look ahead to the next walking segment for the travel direction,
        // or fall back to the previous segment if there is none ahead.
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let angle;
        if (Math.hypot(dx, dy) < 1) {
          // Zero-displacement segment — find nearest non-zero segment for direction
          let found = false;
          for (let j = i + 1; j < segments.length; j++) {
            const na = walkPoints[j], nb = walkPoints[j + 1] ?? walkPoints[j];
            const ndx = nb.x - na.x, ndy = nb.y - na.y;
            if (Math.hypot(ndx, ndy) >= 1) {
              angle = Math.atan2(ndy, ndx) * 180 / Math.PI;
              found = true;
              break;
            }
          }
          if (!found) {
            for (let j = i - 1; j >= 0; j--) {
              const na = walkPoints[j], nb = walkPoints[j + 1] ?? walkPoints[j];
              const ndx = nb.x - na.x, ndy = nb.y - na.y;
              if (Math.hypot(ndx, ndy) >= 1) {
                angle = Math.atan2(ndy, ndx) * 180 / Math.PI;
                found = true;
                break;
              }
            }
          }
          if (!found) angle = 0;
        } else {
          angle = Math.atan2(dy, dx) * 180 / Math.PI;
        }
        const floorAtSeg = t < 0.5 ? a.floor : b.floor;
        return {
          x, y, angle, floor: floorAtSeg, isOnStairs: seg.isStair,
          stairFromFloor: seg.isStair ? a.floor : null,
          stairToFloor:   seg.isStair ? b.floor : null,
          segProgress:    t,
        };
      }
    }
    return null;
  }, [walkProgress, walkPoints, walkTimeTable]);

  // Auto-follow walking figure floor in layered view
  useEffect(() => {
    if (!walkActive || !walkerState || viewMode !== "layered") return;
    const wFloor = walkerState.floor;
    if (wFloor && routeFloors.includes(wFloor)) {
      setActiveFloor(wFloor);
      setPinnedLayerFloor(wFloor);
    }
  }, [walkActive, walkerState, viewMode, routeFloors]);

  // Stair floor-change flash: fires briefly when walker transitions to a new floor
  useEffect(() => {
    if (!walkActive || !walkerState) return;
    const wFloor = walkerState.floor;
    if (lastStairFloor.current !== null && lastStairFloor.current !== wFloor) {
      setStairFlashFloor({ floor: wFloor });
      const t = setTimeout(() => setStairFlashFloor(null), 1100);
      return () => clearTimeout(t);
    }
    lastStairFloor.current = wFloor;
  }, [walkActive, walkerState?.floor]);

  const IMPORTANT_TYPES = new Set(["office", "classroom", "lab", "facility", "comfort", "lobby", "special", "parking"]);
  const UNIMPORTANT_NAME_PATTERNS = /pipe\s*chase|pipechase|electrical\s*\/\s*dressing|dressing\s*rm|janitor|stock\s*room|stockroom/i;

  const activeFloorRooms = useMemo(() => {
    let pool = activeCategory ? ALL_ROOMS.filter((room) => room.type === activeCategory) : ALL_ROOMS;
    if (importantOnly) {
      pool = pool.filter((room) => IMPORTANT_TYPES.has(room.type) && !UNIMPORTANT_NAME_PATTERNS.test(room.name));
    }
    if (filterFloor !== null) {
      pool = pool.filter((room) => room.floor === filterFloor);
    }
    return [...pool]
      .sort((a, b) => (a.floor === activeFloor ? -1 : b.floor === activeFloor ? 1 : a.floor - b.floor) || a.name.localeCompare(b.name))
      .slice(0, 70);
  }, [activeCategory, activeFloor, importantOnly, filterFloor]);

  // Which floor numbers actually have rooms for the current category+importantOnly filter
  const floorsWithRooms = useMemo(() => {
    let pool = activeCategory ? ALL_ROOMS.filter((room) => room.type === activeCategory) : ALL_ROOMS;
    if (importantOnly) {
      pool = pool.filter((room) => IMPORTANT_TYPES.has(room.type) && !UNIMPORTANT_NAME_PATTERNS.test(room.name));
    }
    return new Set(pool.map((room) => room.floor));
  }, [activeCategory, importantOnly]);

  const goToStep = (index) => {
    if (!navSteps.length) return;
    const safeIndex = clamp(index, 0, navSteps.length - 1);
    setActiveStepIndex(safeIndex);
    setNavMode("step");
    const step = navSteps[safeIndex];
    const focusFloor = step.nextFloor ?? step.floor;
    if (focusFloor) {
      setActiveFloor(focusFloor);
      if (routeFloors.includes(focusFloor)) setPinnedLayerFloor(focusFloor);
    }
  };

  const currentFloor = getFloorById(activeFloor);
  const getRouteLayerRole = (floorId) => {
    if (!destination) return "ROUTE FLOOR";
    if (floorId === startFloor && floorId === destination.floor) return "START + DESTINATION";
    if (floorId === startFloor) return "START FLOOR";
    if (floorId === destination.floor) return "DESTINATION FLOOR";
    return "TRANSFER FLOOR";
  };

  return (
    <div style={S.root} className="snav-root">
      {/* Room info modal */}
      {modalRoom && (
        <RoomModal
          room={modalRoom}
          isSettingLocation={isSettingLocation}
          dbRoomData={roomDbMap.get(modalRoom?.id)}
          onNavigate={(room) => {
            if (isSettingLocation) setUserLocation(room);
            else navigateTo(room);
            setModalRoom(null);
          }}
          onClose={() => setModalRoom(null)}
        />
      )}
      <header style={S.header} className="snav-header">
        <div style={S.brandBlock}>
          <img src={campusLogo} alt="Campus Pathfinder" style={S.logo} />
          <div>
            <div style={S.brandTitle}>GORDON COLLEGE</div>
            <div style={S.brandSub}>Campus Navigator</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Voice status toast */}
          {voice.voiceStatus ? (
            <div style={S.voiceToast}>{voice.voiceStatus}</div>
          ) : null}

          {/* Mic button */}
          <button
            title={voice.listening ? 'Stop listening' : 'Voice command'}
            onClick={voice.listening ? voice.stopListening : voice.startListening}
            style={{ ...S.voiceBtn, ...(voice.listening ? S.voiceBtnActive : {}) }}
          >
            {voice.listening ? '🎙️' : '🎤'}
          </button>

          {/* TTS on/off toggle */}
          <button
            title={voice.voiceOn ? 'Mute voice guidance' : 'Unmute voice guidance'}
            onClick={() => voice.setVoiceOn(v => !v)}
            style={{ ...S.voiceBtn, opacity: voice.voiceOn ? 1 : 0.45 }}
          >
            {voice.voiceOn ? '🔊' : '🔇'}
          </button>


        </div>
      </header>

      <main style={S.layout} className="snav-layout">
        <aside style={S.leftPanel} className="snav-left">
          {/* Destination + Location combined card */}
          <div style={S.destinationCard}>
            <div style={S.panelTitle}>DESTINATION</div>
            {destination ? (
              <>
                <div style={S.destinationName}>{destination.name}</div>
                <div style={S.destinationMeta}>
                  <span style={S.destFloorBadge}>{ordinal(destination.floor)} Floor</span>
                  <span style={S.destTypeBadge}>{ROOM_STYLE_META[destination.type]?.label ?? "Room"}</span>
                </div>
                {eta && (
                  <div style={S.destStats}>
                    <div style={S.destStatItem}><span style={S.destStatLabel}>Distance</span><span style={S.destStatValue}>{routeMeters}m</span></div>
                    <div style={S.destStatDivider} />
                    <div style={S.destStatItem}><span style={S.destStatLabel}>Est. time</span><span style={S.destStatValue}>~{eta} min</span></div>
                    <div style={S.destStatDivider} />
                    <div style={S.destStatItem}><span style={S.destStatLabel}>Floors</span><span style={S.destStatValue}>{routeFloors.length || 1}</span></div>
                  </div>
                )}
                <button type="button" style={S.clearRouteButton} onClick={clearRoute}>
                  <AssetIcon src={iconClose} size={13} /> Clear Route
                </button>
                {/* Walk animation button */}
                {route.length > 0 && (
                  walkActive ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, flex: 1 }}>
                          {walkerState?.isOnStairs ? "🪜 Climbing stairs…" : "▶ Walking…"} {Math.round(walkProgress * 100)}%
                        </span>
                        <button type="button" onClick={stopWalk}
                          style={{ height: 26, padding: "0 10px", borderRadius: 7, border: `1px solid ${BORDER}`, background: "#fff", color: "#dc2626", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                          ■ Stop
                        </button>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: BORDER, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${walkProgress * 100}%`, background: walkerState?.isOnStairs ? "#f59e0b" : BLUE, borderRadius: 2, transition: "width 0.1s linear" }} />
                      </div>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={startWalk}
                      style={{ width: "100%", height: 34, marginTop: 8, borderRadius: 9, border: `1px solid rgba(37,99,235,0.30)`, background: "rgba(239,246,255,0.90)", color: BLUE, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                      ▶ Walk Route
                    </button>
                  )
                )}
              </>
            ) : (
              <div style={S.noRoute}>Search or tap any room on the map to navigate.</div>
            )}
          </div>

          {/* Location card */}
          <div style={{ ...S.locationCard, ...(isSettingLocation ? S.locationCardActive : {}) }}>
            <div style={S.panelTitle}>YOUR LOCATION</div>
            <div style={S.locationRow}>
              <div style={S.locationDot} />
              <div>
                <div style={S.locationName}>{startLocation.label}</div>
                <div style={S.locationMeta}>{ordinal(startLocation.floor)} Floor {isSettingLocation ? "· Tap a room to reposition" : ""}</div>
              </div>
            </div>
            <div style={S.locationActions}>
              <button
                type="button"
                style={{ ...S.setLocationButton, ...(isSettingLocation ? S.setLocationButtonActive : {}) }}
                onClick={() => setIsSettingLocation((value) => !value)}
              >
                {isSettingLocation ? "Cancel" : "Change"}
              </button>
              <button
                type="button"
                style={S.resetLocationButton}
                onClick={resetUserLocation}
                disabled={startLocation.type === "kiosk"}
              >
                Reset
              </button>
            </div>

            {/* Feature: kiosk "You Are Here" floor picker */}
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setKioskPickerOpen((v) => !v)}
                style={{
                  width: "100%", height: 30, borderRadius: 8,
                  border: "1px solid rgba(37,99,235,0.25)",
                  background: kioskPickerOpen ? "#2563eb" : "rgba(239,246,255,0.9)",
                  color: kioskPickerOpen ? "#fff" : "#2563eb",
                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                📍 {kioskPickerOpen ? "Close" : "Select Your Starting Floor"}
              </button>
              {kioskPickerOpen && (
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6].map((floor) => {
                    const active = startLocation.type === "kiosk" && startLocation.floor === floor;
                    return (
                      <button
                        key={floor}
                        type="button"
                        onClick={() => selectKioskFloor(floor)}
                        style={{
                          flex: 1, minWidth: 32, height: 34, borderRadius: 8,
                          border: active ? "2px solid #2563eb" : "1px solid rgba(0,0,0,0.1)",
                          background: active ? "#2563eb" : "#fff",
                          color: active ? "#fff" : "#374151",
                          fontWeight: 800, fontSize: 12, cursor: "pointer",
                        }}
                      >
                        {floor}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Floors in route */}
          <div style={S.floorRouteCard}>
            <div style={S.panelTitle}>FLOORS IN ROUTE</div>
            <div style={S.floorRouteRow}>
              {(routeFloors.length ? routeFloors : [startFloor]).map((floorId) => (
                <button
                  key={floorId}
                  type="button"
                  style={{ ...S.routeFloorChip, ...(activeFloor === floorId ? S.routeFloorChipActive : {}) }}
                  onClick={() => {
                    setActiveFloor(floorId);
                    if (routeFloors.includes(floorId)) setPinnedLayerFloor(floorId);
                  }}
                >
                  <span style={S.routeFloorNum}>{floorId}</span>
                  <span style={S.routeFloorLabel}>{ordinal(floorId)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Map view + legend combined */}
          <div style={S.mapViewCard}>
            <div style={S.panelTitle}>VIEW</div>
            <div style={S.viewToggleRow}>
              <button
                type="button"
                style={{ ...S.viewToggleBtn, ...(viewMode === "layered" ? S.viewToggleBtnActive : {}), ...(!route.length ? { opacity: 0.4 } : {}) }}
                onClick={() => {
                  setViewMode("layered");
                  if (routeFloors.includes(activeFloor)) setPinnedLayerFloor(activeFloor);
                  else if (destination) setPinnedLayerFloor(destination.floor);
                }}
                disabled={!route.length}
              >
                <AssetIcon src={iconLayers} size={14} />
                <span>Layered</span>
              </button>
              <button
                type="button"
                style={{ ...S.viewToggleBtn, ...(viewMode === "single" ? S.viewToggleBtnActive : {}) }}
                onClick={() => setViewMode("single")}
              >
                <AssetIcon src={iconSingleFloor} size={14} />
                <span>Single</span>
              </button>
              <button
                type="button"
                style={{ ...S.viewToggleBtn, ...(view3D ? S.viewToggleBtnActive : {}) }}
                onClick={() => {
                  setView3D((v) => !v);
                  setViewMode("single");
                }}
              >
                <AssetIcon src={iconFloor} size={14} />
                <span>3D</span>
              </button>
              <button
                type="button"
                style={{ ...S.viewToggleBtn, ...(simpleMode ? S.viewToggleBtnActive : {}) }}
                onClick={() => setSimpleMode((value) => !value)}
              >
                <AssetIcon src={iconSimpleView} size={14} />
                <span>Simple</span>
              </button>
            </div>
            <div style={S.legendStrip}>
              {[
                { color: "#22c55e", label: "Start" },
                { color: "#ef4444", label: "Dest." },
                { color: "#60a5fa", label: "Path" },
                { color: "#f59e0b", label: "Stairs" },
                { color: "#a855f7", label: "Transfer" },
              ].map(({ color, label }) => (
                <div key={label} style={S.legendPill}>
                  <span style={{ ...S.legendDot, background: color }} />
                  <span style={S.legendPillLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section style={S.centerPanel} className="snav-center">
          <div style={S.floorTabs} className="snav-floor-tabs">
            {FLOORS.map((floor) => (
              <button
                key={floor.id}
                type="button"
                style={{ ...S.floorTab, ...(activeFloor === floor.id ? S.floorTabActive : {}), ...(routeFloors.includes(floor.id) ? S.floorTabRoute : {}) }}
                onClick={() => {
                  setActiveFloor(floor.id);
                  if (routeFloors.includes(floor.id)) {
                    setPinnedLayerFloor(floor.id);
                    if (viewMode === "layered") setHoveredLayerFloor(null);
                  }
                }}
              >
                <span style={S.floorTabNumber}>{floor.id}</span>
                <span>{floor.label}</span>
              </button>
            ))}
          </div>

          <div
            ref={mapShellRef}
            className="snav-map-shell"
            style={{
              ...S.mapShell,
              cursor: view3D ? "default" : (isPanning2D.current ? "grabbing" : "grab"),
              perspective: "none",
              perspectiveOrigin: "50% 38%",
            }}
            onPointerDown={(e) => { if (!view3D) handle2DPointerDown(e); }}
            onPointerMove={(e) => { if (!view3D) handle2DPointerMove(e); }}
            onPointerUp={(e) => { if (!view3D) handle2DPointerUp(e); }}
            onPointerLeave={(e) => { if (!view3D) handle2DPointerUp(e); }}
            onWheel={(e) => { if (!view3D) handle2DWheel(e); }}
            onTouchStart={(e) => { if (!view3D) handle2DTouchStart(e); }}
            onTouchMove={(e) => { if (!view3D) handle2DTouchMove(e); }}
            onTouchEnd={(e) => { if (!view3D) handle2DTouchEnd(e); }}
          >
            <div style={S.followBanner}><AssetIcon src={iconRoute} size={16} /> {isSettingLocation ? "Set location: tap your current room, office, or nearby area." : floorChanges.length ? "Follow the blue path. Tap any floor layer to open it." : "Same-floor route: follow the blue hallway path. No stairs needed."}</div>
            {false && view3D && (
              <div style={S.cam3DHint}>
                <span>⟳ Drag to orbit</span>
                <span>⊕ Scroll to zoom</span>
                <span style={{ opacity: 0.7 }}>Tilt {Math.round(camRotX)}° · Spin {Math.round(camRotZ % 360)}°</span>
                <button type="button" style={S.cam3DResetBtn} onClick={setIsometric}>ISO</button>
                <button type="button" style={S.cam3DResetBtn} onClick={resetCamera}>Reset</button>
              </div>
            )}
            {viewMode === "layered" && routeFloors.length > 1 && (
              <div style={S.layerQuickNav}>
                <span style={S.layerQuickTitle}>Route layers</span>
                {[...routeFloors].sort((a, b) => a - b).map((floorId) => (
                  <button
                    key={floorId}
                    type="button"
                    style={{ ...S.layerQuickButton, ...(selectedLayerFloor === floorId ? S.layerQuickButtonActive : {}) }}
                    onClick={() => {
                      setActiveFloor(floorId);
                      setPinnedLayerFloor(floorId);
                    }}
                  >
                    F{floorId}
                  </button>
                ))}
              </div>
            )}
            {false && destination && navMode === "step" && (
              <CurrentStepCard
                step={activeStep}
                index={activeStepIndex}
                total={navSteps.length}
                onPrev={() => goToStep(activeStepIndex - 1)}
                onNext={() => goToStep(activeStepIndex + 1)}
                canPrev={activeStepIndex > 0}
                canNext={activeStepIndex < navSteps.length - 1}
                onExit={() => setNavMode("overview")}
              />
            )}

            {view3D ? (
              <div style={S.real3DCanvasWrap}>
                <BlueprintIsometric embedded route={route} destination={destination} startNodeId={startNodeId} />
              </div>
            ) : (
              <>
                {/* 2D / SVG map wrapper */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transformStyle: "preserve-3d",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: "none",
                    transition: "transform 0.18s ease-out",
                    pointerEvents: "auto",
                  }}>
                    <div style={{ ...S.mapStack, ...(viewMode === "layered" ? S.mapStackLayered : {}) }}>
                      {shownFloors.map((floorId, index) => {
                        const floor = getFloorById(floorId);
                        const isSelectedFloor = viewMode === "layered" ? floorId === selectedLayerFloor : floorId === activeFloor;
                        const isHoveredLayer = hoveredLayerFloor === floorId;
                        return (
                          <FloorPlane
                            key={floor.id}
                            floorId={floor.id}
                            index={index}
                            total={shownFloors.length}
                            isLayered={viewMode === "layered"}
                            isActiveFloor={isSelectedFloor}
                            isHoveredLayer={isHoveredLayer}
                            role={getRouteLayerRole(floorId)}
                            view3D={false}
                            onSelect={() => {
                              setActiveFloor(floorId);
                              if (routeFloors.includes(floorId)) setPinnedLayerFloor(floorId);
                            }}
                            onHover={(isHovering) => setHoveredLayerFloor(isHovering ? floorId : null)}
                          >
                            <FloorBlueprint
                              floor={floor}
                              route={route}
                              destination={destination}
                              hoveredRoomId={hoveredRoomId}
                              onRoomClick={handleRoomAction}
                              onRoomHover={setHoveredRoomId}
                              kioskNodeId={startNodeId}
                              animOffset={animOffset}
                              isLayered={viewMode === "layered"}
                              isActiveFloor={isSelectedFloor}
                              mapZoom={mapZoom}
                              mapPan={mapPan}
                              simpleMode={simpleMode}
                              routePreviewing={routePreviewing}
                              view3D={false}
                              walkerState={walkActive || arrived ? walkerState : null}
                              walkT={walkT}
                              walkActive={walkActive}
                              stairFlashFloor={stairFlashFloor}
                              arrived={arrived}
                              isSettingLocation={isSettingLocation}
                            />
                          </FloorPlane>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}


            {/* Location-pick mode overlay banner */}
            {isSettingLocation && (
              <div style={{
                position: "absolute",
                top: 14,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 99,
                background: "rgba(22,163,74,0.95)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 4px 20px rgba(22,163,74,0.40)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                animation: "smartnav-modal-in 200ms ease-out forwards",
              }}>
                <span style={{ fontSize: 16 }}>📍</span>
                Tap any room to set your location
                <span style={{ opacity: 0.75, fontSize: 11 }}>— or press Cancel</span>
              </div>
            )}

            {/* Immersive 3D stair-climb overlay — appears while walker traverses a stair segment */}
            {walkActive && walkerState?.isOnStairs && walkerState.stairFromFloor != null && (
              <StairClimbOverlay
                fromFloor={walkerState.stairFromFloor}
                toFloor={walkerState.stairToFloor}
                direction={walkerState.stairToFloor > walkerState.stairFromFloor ? "up" : "down"}
                progress={walkerState.segProgress}
              />
            )}
          </div>

          <div style={S.bottomToolbar} className="snav-bottom-toolbar">
            <div style={S.toolbarGroup}>
              <button style={S.toolButton} type="button" onClick={zoomOut} disabled={mapZoom <= ZOOM_MIN + 0.001}><AssetIcon src={iconMinus} size={14} /></button>
              <button style={S.zoomLevelButton} type="button" onClick={resetZoom}>{Math.round(mapZoom * 100)}%</button>
              <button style={S.toolButton} type="button" onClick={zoomIn} disabled={mapZoom >= ZOOM_MAX - 0.001}><AssetIcon src={iconPlus} size={14} /></button>
            </div>
            <div style={S.toolbarDivider} />
            <button
              style={{ ...S.toolButton, ...(viewMode === "layered" ? S.toolButtonActive : {}) }}
              type="button"
              onClick={() => {
                setViewMode("layered");
                if (routeFloors.includes(activeFloor)) setPinnedLayerFloor(activeFloor);
              }}
              disabled={!route.length}
            ><AssetIcon src={iconLayers} size={14} /> Layers</button>
            <button style={{ ...S.toolButton, ...(viewMode === "single" ? S.toolButtonActive : {}) }} type="button" onClick={() => setViewMode("single")}><AssetIcon src={iconFocus} size={14} /> Focus</button>
            <button
              style={{ ...S.toolButton, ...(view3D ? S.toolButtonActive : {}) }}
              type="button"
              onClick={() => {
                setView3D((v) => !v);
                setViewMode("single");
              }}
            ><AssetIcon src={iconFloor} size={14} /> 3D</button>
            {view3D && (
              <button style={S.toolButton} type="button" onClick={resetCamera}>
                <AssetIcon src={iconReset} size={14} /> Reset Cam
              </button>
            )}
            <div style={S.toolbarDivider} />
            <button
              style={S.toolButton}
              type="button"
              onClick={() => {
                setActiveFloor(startFloor);
                setPinnedLayerFloor(null);
                setHoveredLayerFloor(null);
                resetZoom();
              }}
            ><AssetIcon src={iconReset} size={14} /> Reset</button>
          </div>
        </section>

        <aside style={S.rightPanel} className="snav-right">
          <div style={S.unifiedNavPanel}>
            {/* ── Search bar ──────────────────────────────────────────── */}
            <div style={S.unifiedSearchBar}>
              <AssetIcon src={iconSearch} size={16} style={{ flexShrink: 0, opacity: 0.50 }} />
              <input
                style={S.unifiedSearchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms, labs, offices…"
              />
              {search && (
                <button type="button" style={S.searchClear} onClick={() => setSearch("")}>×</button>
              )}
            </div>

            {/* ── Content area ────────────────────────────────────────── */}
            <div style={S.unifiedScrollArea}>
              {search.trim() ? (
                /* ── State 1: Search results ─────────────────────────── */
                searchResults.length === 0 ? (
                  <div style={S.emptySearch}>No matching room found.</div>
                ) : (
                  searchResults.map((room) => {
                    const meta = ROOM_STYLE_META[room.type] ?? ROOM_STYLE_META.office;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        style={S.searchItem}
                        onClick={() => {
                          if (isSettingLocation) setUserLocation(room);
                          else navigateTo(room);
                          setSearch("");
                        }}
                        onMouseEnter={() => setHoveredRoomId(room.id)}
                        onMouseLeave={() => setHoveredRoomId(null)}
                      >
                        <span style={{ ...S.searchColor, background: meta.color }} />
                        <span style={S.searchTextBlock}>
                          <span style={S.searchName}>{room.name}</span>
                          <span style={S.searchMeta}>
                            <AssetIcon src={meta.icon} size={13} style={S.searchMetaIcon} />
                            {meta.label} · Floor {room.floor}
                          </span>
                        </span>
                        <span style={S.floorMini}>F{room.floor}</span>
                      </button>
                    );
                  })
                )
              ) : destination ? (
                /* ── State 2: Navigating / Directions ───────────────── */
                <>
                  {/* Destination summary */}
                  <div style={S.unifiedDestBlock}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.destinationName}>{destination.name}</div>
                      <div style={S.destinationMeta}>
                        <span style={S.destFloorBadge}>{ordinal(destination.floor)} Floor</span>
                        <span style={S.destTypeBadge}>{ROOM_STYLE_META[destination.type]?.label ?? "Room"}</span>
                      </div>
                    </div>
                    <button type="button" style={S.unifiedClearBtn} onClick={clearRoute}>
                      <AssetIcon src={iconClose} size={12} />
                    </button>
                  </div>
                  {eta && (
                    <div style={{ ...S.destStats, margin: "0 0 10px" }}>
                      <div style={S.destStatItem}><span style={S.destStatLabel}>Distance</span><span style={S.destStatValue}>{routeMeters}m</span></div>
                      <div style={S.destStatDivider} />
                      <div style={S.destStatItem}><span style={S.destStatLabel}>Est. time</span><span style={S.destStatValue}>~{eta} min</span></div>
                      <div style={S.destStatDivider} />
                      <div style={S.destStatItem}><span style={S.destStatLabel}>Floors</span><span style={S.destStatValue}>{routeFloors.length || 1}</span></div>
                    </div>
                  )}
                  {/* Walk button */}
                  {route.length > 0 && (
                    walkActive ? (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, flex: 1 }}>
                            {walkerState?.isOnStairs ? "🪜 Climbing stairs…" : "▶ Walking…"} {Math.round(walkProgress * 100)}%
                          </span>
                          <button type="button" onClick={stopWalk}
                            style={{ height: 26, padding: "0 10px", borderRadius: 7, border: `1px solid ${BORDER}`, background: "#fff", color: "#dc2626", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                            ■ Stop
                          </button>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: BORDER, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${walkProgress * 100}%`, background: walkerState?.isOnStairs ? "#f59e0b" : BLUE, borderRadius: 2, transition: "width 0.1s linear" }} />
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={startWalk}
                        style={{ width: "100%", height: 34, marginBottom: 10, borderRadius: 9, border: `1px solid rgba(37,99,235,0.30)`, background: "rgba(239,246,255,0.90)", color: BLUE, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                        ▶ Walk Route
                      </button>
                    )
                  )}
                  {/* Route timeline */}
                  <RouteSteps
                    bare
                    route={route}
                    destination={destination}
                    steps={navSteps}
                    activeStepIndex={activeStepIndex}
                    navMode={navMode}
                    onStepClick={goToStep}
                    onPrev={() => goToStep(activeStepIndex - 1)}
                    onNext={() => goToStep(activeStepIndex + 1)}
                    onStartStep={() => goToStep(0)}
                    onOverview={() => setNavMode("overview")}
                  />
                </>
              ) : (
                /* ── State 3: Browse / Find Nearby ──────────────────── */
                <>
                  <div style={S.findNearbyHeader}>
                    <span style={S.findNearbyTitle}>Find Nearby</span>
                    <button
                      type="button"
                      onClick={() => setImportantOnly((v) => !v)}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      title={importantOnly ? "Important rooms only — click to show all" : "All rooms — click to show important only"}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: importantOnly ? BLUE : "#64748b", whiteSpace: "nowrap" }}>
                        {importantOnly ? "Key rooms" : "All rooms"}
                      </span>
                      <span style={{ position: "relative", display: "inline-flex", width: 28, height: 16, borderRadius: 999, background: importantOnly ? BLUE : "#cbd5e1", transition: "background 0.2s", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 2, left: importantOnly ? 14 : 2, width: 12, height: 12, borderRadius: 999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.22)", transition: "left 0.2s" }} />
                      </span>
                    </button>
                  </div>
                  <div style={S.findNearbyGrid}>
                    {CATEGORIES.map((category) => {
                      const isActive = activeCategory === category.key;
                      return (
                        <button
                          key={category.key}
                          type="button"
                          style={{ ...S.findNearbyCard, ...(isActive ? S.findNearbyCardActive : {}) }}
                          onClick={() => setActiveCategory(activeCategory === category.key ? null : category.key)}
                        >
                          <span style={{ ...S.findNearbyIcon, background: isActive ? "rgba(255,255,255,0.22)" : ROOM_COLORS[category.key] ?? "#eef4fb" }}>
                            <AssetIcon src={category.icon} size={20} style={isActive ? { filter: "brightness(0) invert(1)", opacity: 0.9 } : {}} />
                          </span>
                          <span style={{ ...S.findNearbyLabel, color: isActive ? "#fff" : TEXT1 }}>{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {activeCategory && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: TEXT3, textTransform: "uppercase" }}>
                          {CATEGORIES.find(c => c.key === activeCategory)?.label}
                        </div>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[null, 1, 2, 3, 4, 5, 6].map((f) => {
                            // Hide floor pills that have no rooms
                            if (f !== null && !floorsWithRooms.has(f)) return null;
                            return (
                              <button
                                key={f ?? "all"}
                                type="button"
                                onClick={() => setFilterFloor(filterFloor === f ? null : f)}
                                style={{
                                  height: 20, minWidth: 20, padding: "0 5px",
                                  borderRadius: 999,
                                  border: "1px solid",
                                  borderColor: filterFloor === f ? BLUE : "rgba(0,0,0,0.12)",
                                  background: filterFloor === f ? BLUE : "rgba(255,255,255,0.7)",
                                  color: filterFloor === f ? "#fff" : TEXT2,
                                  fontSize: 9, fontWeight: 700,
                                  cursor: "pointer", lineHeight: 1,
                                }}
                              >
                                {f === null ? "All" : f}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {activeFloorRooms.map((room) => {
                        const meta = ROOM_STYLE_META[room.type] ?? ROOM_STYLE_META.office;
                        return (
                          <button
                            key={room.id}
                            type="button"
                            style={S.roomListItem}
                            onClick={() => handleRoomAction(room)}
                            onMouseEnter={() => setHoveredRoomId(room.id)}
                            onMouseLeave={() => setHoveredRoomId(null)}
                          >
                            <span style={{ ...S.roomDot, background: meta.color }} />
                            <span style={S.roomListText}>{room.name}</span>
                            <span style={S.roomFloorChip}>F{room.floor}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={S.legendItem}>
      <span style={{ ...S.legendDot, background: color }} />
      <span>{label}</span>
    </div>
  );
}

// ─── Stair Climb Overlay ──────────────────────────────────────────────────────
// Renders an immersive 3D-perspective staircase over the map area when the
// walking figure enters a stair segment between floors.
function StairClimbOverlay({ fromFloor, toFloor, direction, progress }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const SPEED = direction === "up" ? 1.8 : -1.8;
    const STEP_H = 44;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      offsetRef.current = (offsetRef.current + SPEED + STEP_H * 20) % (STEP_H * 20);
      ctx.clearRect(0, 0, W, H);
      drawStairCanvas(ctx, W, H, offsetRef.current, direction);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [direction]);

  const isAscending = direction === "up";
  const climbPct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  const opacity = progress < 0.08
    ? progress / 0.08
    : progress > 0.88
      ? (1 - progress) / 0.12
      : 1;

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 50,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transition: "opacity 0.15s ease",
      animation: "smartnav-stair-overlay-in 0.25s ease-out both",
      borderRadius: "inherit",
    }}>
      {/* Dark atmospheric background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 60%, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.96) 100%)",
        backdropFilter: "blur(2px)",
      }} />

      {/* 3D stair canvas */}
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}
        width={640} height={400} />

      {/* Vignette over canvas */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background: [
          "radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(15,23,42,0.6) 100%)",
          "linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, transparent 22%, transparent 68%, rgba(15,23,42,0.75) 100%)",
        ].join(","),
      }} />

      {/* Header */}
      <div style={{
        position:"absolute", top:0, left:0, right:0,
        padding:"10px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"linear-gradient(to bottom, rgba(15,23,42,0.88) 0%, transparent 100%)",
        zIndex:2,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M3 21h4v-4h4v-4h4v-4h4V3"
              stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.6, color:"#f59e0b", textTransform:"uppercase" }}>
            {isAscending ? "Ascending" : "Descending"} Staircase
          </span>
        </div>
        <div style={{
          fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.65)",
          background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
          padding:"3px 10px", borderRadius:20,
        }}>{climbPct}%</div>
      </div>

      {/* Center: floor badges + climber */}
      <div style={{
        position:"relative", zIndex:10,
        display:"flex", flexDirection:"column", alignItems:"center", gap:6,
        marginBottom:20,
      }}>
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.14)",
          borderRadius:22, padding:"10px 22px", backdropFilter:"blur(8px)",
        }}>
          <StairFloorPill floor={fromFloor} label="From" active={false} />
          <span style={{ fontSize:22, color: isAscending ? "#34d399" : "#f87171", fontWeight:900 }}>
            {isAscending ? "↑" : "↓"}
          </span>
          <StairFloorPill floor={toFloor} label="Arriving" active />
        </div>
        <StairClimberFigure direction={direction} />
      </div>

      {/* Footer progress */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"10px 20px 14px",
        background:"linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 100%)",
        zIndex:2,
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between",
          fontSize:10, fontWeight:700, letterSpacing:1, color:"rgba(255,255,255,0.4)",
          textTransform:"uppercase", marginBottom:5,
        }}>
          <span>Stair progress</span>
          <span>Floor {fromFloor} → {toFloor}</span>
        </div>
        <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
          <div style={{
            height:"100%", width:`${climbPct}%`, borderRadius:2,
            background: isAscending
              ? "linear-gradient(90deg,#f59e0b 0%,#fde68a 100%)"
              : "linear-gradient(90deg,#60a5fa 0%,#93c5fd 100%)",
            transition:"width 0.12s linear",
          }} />
        </div>
      </div>
    </div>
  );
}

function StairFloorPill({ floor, label, active }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
      <div style={{
        width:46, height:46, borderRadius:13,
        background: active
          ? "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"
          : "rgba(255,255,255,0.08)",
        border:`2px solid ${active ? "#fde68a" : "rgba(255,255,255,0.12)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20, fontWeight:900,
        color: active ? "#1c1917" : "rgba(255,255,255,0.4)",
        boxShadow: active ? "0 4px 18px rgba(245,158,11,0.45)" : "none",
      }}>{floor}</div>
      <span style={{
        fontSize:9, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase",
        color: active ? "#fde68a" : "rgba(255,255,255,0.32)",
      }}>{label}</span>
    </div>
  );
}

function StairClimberFigure({ direction }) {
  const tilt = direction === "up" ? "rotate(-14,0,0)" : "rotate(12,0,0)";
  const arrowPts = direction === "up" ? "0,-46 -6,-38 6,-38" : "0,28 -6,20 6,20";
  const arrowFill = direction === "up" ? "#34d399" : "#f87171";
  return (
    <svg width={58} height={78} viewBox="-22,-54 44,80"
      style={{ filter:"drop-shadow(0 4px 14px rgba(0,0,0,0.65))", marginTop:2 }}>
      <g transform={tilt} className="sc-body">
        {/* Torso */}
        <rect x={-5} y={-22} width={10} height={18} rx={4} fill="#f59e0b" />
        {/* Backpack */}
        <rect x={5} y={-20} width={7} height={12} rx={3} fill="#d97706" />
        <circle cx={8.5} cy={-14} r={2.5} fill="#b45309" />
        {/* Left leg */}
        <g transform="translate(-3,-5)" className="sc-leg-l">
          <rect x={-3} y={0} width={6} height={18} rx={3} fill="#fbbf24" />
          <rect x={-3} y={14} width={8} height={7} rx={3} fill="#92400e" />
        </g>
        {/* Right leg */}
        <g transform="translate(3,-5)" className="sc-leg-r">
          <rect x={-3} y={0} width={6} height={18} rx={3} fill="#fbbf24" />
          <rect x={-3} y={14} width={8} height={7} rx={3} fill="#92400e" />
        </g>
        {/* Left arm */}
        <g transform="translate(-5,-20)" className="sc-arm-l">
          <rect x={-2.5} y={0} width={5} height={13} rx={2.5} fill="#fbbf24" />
        </g>
        {/* Right arm */}
        <g transform="translate(5,-20)" className="sc-arm-r">
          <rect x={-2.5} y={0} width={5} height={13} rx={2.5} fill="#fbbf24" />
        </g>
        {/* Head */}
        <g className="sc-head">
          <circle cx={0} cy={-30} r={9} fill="#fbbf24" />
          <circle cx={-2.5} cy={-31} r={1.3} fill="rgba(120,53,15,0.75)" />
          <circle cx={2.5}  cy={-31} r={1.3} fill="rgba(120,53,15,0.75)" />
          <ellipse cx={10} cy={-28} rx={2} ry={3} fill="rgba(96,165,250,0.8)"
            transform="rotate(15,10,-28)" />
        </g>
      </g>
      <polygon points={arrowPts} fill={arrowFill} opacity={0.9} />
    </svg>
  );
}

function drawStairCanvas(ctx, W, H, offset, direction) {
  const VP       = { x: W / 2, y: H * 0.35 };
  const N_STEPS  = 18;
  const STEP_H   = 44;
  const SPREAD   = 0.72;
  const ease     = (v) => Math.pow(v, 1.6);
  const dir      = direction === "up" ? 1 : -1;

  for (let i = 0; i < N_STEPS; i++) {
    const t  = ((i       / (N_STEPS - 1)) + (offset / (STEP_H * N_STEPS)) * dir + 1) % 1;
    const t2 = (((i + 1) / (N_STEPS - 1)) + (offset / (STEP_H * N_STEPS)) * dir + 1) % 1;
    const te = ease(t), te2 = ease(t2);

    const y  = VP.y + te  * (H - VP.y) * 1.05;
    const y2 = VP.y + te2 * (H - VP.y) * 1.05;
    if (y2 < VP.y - 2) continue;

    const hw  = (W / 2) * SPREAD * te;
    const hw2 = (W / 2) * SPREAD * te2;
    const xl  = VP.x - hw,  xr  = VP.x + hw;
    const xl2 = VP.x - hw2, xr2 = VP.x + hw2;

    const alpha = Math.min(te * 1.5, 1);

    // Tread face
    ctx.beginPath();
    ctx.moveTo(xl, y); ctx.lineTo(xr, y);
    ctx.lineTo(xr2, y2); ctx.lineTo(xl2, y2);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? "rgba(241,245,249,0.22)" : "rgba(30,41,59,0.55)";
    ctx.globalAlpha = alpha * 0.9;
    ctx.fill();

    // Top edge highlight
    ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr, y);
    ctx.strokeStyle = "rgba(100,116,139,0.6)";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * 0.8;
    ctx.stroke();

    // Riser
    if (te2 > te) {
      ctx.beginPath();
      ctx.moveTo(xl, y); ctx.lineTo(xr, y);
      ctx.lineTo(xr, y - (y2 - y) * 0.18);
      ctx.lineTo(xl, y - (y2 - y) * 0.18);
      ctx.closePath();
      ctx.fillStyle = "rgba(51,65,85,0.7)";
      ctx.globalAlpha = alpha * 0.55;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Handrails
  ["left", "right"].forEach((side) => {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, te = ease(t);
      const y = VP.y + te * (H - VP.y) * 1.05;
      const hw = (W / 2) * SPREAD * te;
      const x = side === "left" ? VP.x - hw - 2 : VP.x + hw + 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(148,163,184,0.55)";
    ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;

    // Balusters
    for (let i = 0; i <= 24; i += 3) {
      const t = i / 24, te = ease(t);
      const y  = VP.y + te * (H - VP.y) * 1.05;
      const hw = (W / 2) * SPREAD * te;
      const x = side === "left" ? VP.x - hw - 2 : VP.x + hw + 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + te * 24);
      ctx.strokeStyle = "rgba(100,116,139,0.5)";
      ctx.lineWidth = Math.max(te * 1.8, 0.5);
      ctx.globalAlpha = te * 0.8; ctx.stroke(); ctx.globalAlpha = 1;
    }
  });

  // Vanishing-point glow
  const grd = ctx.createRadialGradient(VP.x, VP.y, 0, VP.x, VP.y, W * 0.4);
  grd.addColorStop(0, "rgba(245,158,11,0.18)");
  grd.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.7; ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
}

const GLASS_BG = "rgba(255,255,255,0.72)";
const GLASS_BORDER = "rgba(255,255,255,0.56)";
const GLASS_SHADOW = "0 8px 32px rgba(10,22,40,0.08), inset 0 1px 0 rgba(255,255,255,0.90), 0 1px 3px rgba(0,0,0,0.04)";
const BLUR = "blur(28px) saturate(160%)";
const PANEL = GLASS_BG;
const BORDER = GLASS_BORDER;
const BLUE = "#1a6cf6";
const TEXT1 = "#0a1628";
const TEXT2 = "#5a6e8a";
const TEXT3 = "#8a9db8";

const S = {
  // ── Layout ──────────────────────────────────────────────────────────────
  root: {
    minHeight: "100dvh",
    width: "100%",
    background: "linear-gradient(160deg, #bcd5f2 0%, #d8e9fb 30%, #cce0f8 65%, #c4d6f0 100%)",
    color: TEXT1,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    height: 62,
    display: "grid",
    gridTemplateColumns: "240px minmax(280px, 540px) 200px",
    alignItems: "center",
    gap: 16,
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.50)",
    background: "rgba(255,255,255,0.62)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    boxShadow: "0 1px 0 rgba(10,22,40,0.06), inset 0 1px 0 rgba(255,255,255,0.90)",
    zIndex: 30,
  },
  brandBlock: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    objectFit: "contain",
    flexShrink: 0,
  },
  brandTitle: { fontSize: 14, fontWeight: 700, letterSpacing: 0.2, color: TEXT1 },
  brandSub: { fontSize: 11, fontWeight: 500, color: TEXT2, marginTop: 1 },
  clockBox: {
    justifySelf: "end",
    textAlign: "right",
    padding: "7px 14px",
    borderRadius: 999,
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    boxShadow: GLASS_SHADOW,
  },
  clockMain: { fontSize: 12, fontWeight: 700, color: TEXT1 },
  clockSub: { fontSize: 10, fontWeight: 500, color: TEXT2, marginTop: 1 },

  // ── Voice Assistant ────────────────────────────────────────────────────────
  voiceBtn: {
    width: 38, height: 38,
    borderRadius: 10,
    border: `1px solid ${GLASS_BORDER}`,
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    boxShadow: GLASS_SHADOW,
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  voiceBtnActive: {
    background: 'rgba(30,120,255,0.18)',
    border: '1px solid rgba(30,120,255,0.55)',
    boxShadow: '0 0 12px rgba(30,120,255,0.45)',
    animation: 'voicePulse 1.2s ease-in-out infinite',
  },
  voiceToast: {
    maxWidth: 220,
    padding: '6px 12px',
    borderRadius: 20,
    background: 'rgba(10,22,40,0.88)',
    border: '1px solid rgba(30,120,255,0.35)',
    color: '#7dd4fc',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.03em',
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxShadow: '0 0 12px rgba(30,120,255,0.2)',
  },

  // ── Search ───────────────────────────────────────────────────────────────
  searchWrap: { position: "relative", width: "100%", zIndex: 20 },
  searchBar: {
    height: 40,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 16px",
    borderRadius: 999,
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    boxShadow: GLASS_SHADOW,
  },
  searchIcon: { color: TEXT3, flexShrink: 0 },
  searchInput: {
    flex: 1,
    height: "100%",
    border: 0,
    outline: 0,
    background: "transparent",
    color: TEXT1,
    fontSize: 14,
    fontWeight: 500,
  },
  searchClear: {
    width: 24,
    height: 24,
    borderRadius: 999,
    border: "none",
    background: "rgba(0,0,0,0.09)",
    color: TEXT2,
    fontSize: 14,
    lineHeight: 1,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  searchDropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 48,
    zIndex: 40,
    maxHeight: 440,
    overflow: "auto",
    padding: 6,
    borderRadius: 24,
    background: "rgba(255,255,255,0.88)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    boxShadow: "0 24px 60px rgba(10,22,40,0.18)",
  },
  searchGroupHeader: {
    padding: "8px 10px 4px",
    color: TEXT3,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  searchItem: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "10px 1fr 40px",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 16,
    border: "1px solid transparent",
    background: "transparent",
    color: TEXT1,
    cursor: "pointer",
    textAlign: "left",
    minHeight: 48,
  },
  searchColor: { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  searchTextBlock: { display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 },
  searchName: { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  searchMeta: { display: "flex", alignItems: "center", gap: 5, color: TEXT3, fontSize: 11, fontWeight: 500 },
  searchMetaIcon: { opacity: 0.7 },
  floorMini: { fontSize: 11, fontWeight: 700, color: BLUE, padding: "3px 9px", borderRadius: 999, background: "rgba(26,108,246,0.10)" },
  emptySearch: { padding: "14px 10px", color: TEXT3, fontSize: 13 },

  // ── Main layout ──────────────────────────────────────────────────────────
  layout: {
    height: "calc(100dvh - 62px)",
    display: "grid",
    gridTemplateColumns: "224px minmax(0,1fr) 252px",
    gap: 12,
    padding: 12,
  },
  leftPanel: { display: "flex", flexDirection: "column", gap: 8, minWidth: 0, overflow: "auto" },
  rightPanel: { display: "flex", flexDirection: "column", gap: 8, minWidth: 0, overflow: "hidden" },
  centerPanel: { position: "relative", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 },

  // ── Cards (shared shell) ─────────────────────────────────────────────────
  card: {
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    padding: "14px 16px",
    boxShadow: GLASS_SHADOW,
  },
  panelTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: TEXT3,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  noRoute: { color: TEXT3, fontSize: 13, lineHeight: 1.55 },

  // ── Destination card ─────────────────────────────────────────────────────
  destinationCard: {
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    padding: "14px 16px",
    boxShadow: GLASS_SHADOW,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: 700,
    color: TEXT1,
    lineHeight: 1.3,
    marginBottom: 8,
  },
  destinationMeta: { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  destFloorBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: BLUE,
    background: "rgba(26,108,246,0.10)",
    padding: "3px 10px",
    borderRadius: 999,
  },
  destTypeBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: TEXT2,
    background: "rgba(0,0,0,0.06)",
    padding: "3px 10px",
    borderRadius: 999,
  },
  destStats: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 12,
    background: "rgba(255,255,255,0.50)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.70)",
    overflow: "hidden",
  },
  destStatItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "7px 6px",
    gap: 2,
  },
  destStatLabel: { fontSize: 9, fontWeight: 700, color: TEXT3, textTransform: "uppercase", letterSpacing: 0.4 },
  destStatValue: { fontSize: 13, fontWeight: 700, color: TEXT1 },
  destStatDivider: { width: 1, height: 28, background: "rgba(0,0,0,0.07)", flexShrink: 0 },
  clearRouteButton: {
    width: "100%",
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(254,242,242,0.78)",
    color: "#dc2626",
    fontWeight: 600,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
  },

  // ── Location card ─────────────────────────────────────────────────────────
  locationCard: {
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    padding: "14px 16px",
    boxShadow: GLASS_SHADOW,
  },
  locationCardActive: {
    border: "1px solid rgba(26,108,246,0.40)",
    background: "rgba(225,240,255,0.78)",
  },
  locationRow: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#22c55e",
    marginTop: 5,
    flexShrink: 0,
    boxShadow: "0 0 0 3px rgba(34,197,94,0.18)",
  },
  locationName: { fontSize: 13, fontWeight: 600, color: TEXT1, lineHeight: 1.3 },
  locationMeta: { fontSize: 11, color: TEXT2, marginTop: 2, lineHeight: 1.4 },
  locationActions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 },
  setLocationButton: {
    height: 32,
    borderRadius: 999,
    border: "1px solid rgba(26,108,246,0.30)",
    background: "rgba(255,255,255,0.72)",
    color: BLUE,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  setLocationButtonActive: { background: BLUE, color: "#ffffff", border: `1px solid ${BLUE}`, boxShadow: `0 4px 14px rgba(26,108,246,0.28)` },
  resetLocationButton: {
    height: 32,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.65)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },

  // ── Floors in route ───────────────────────────────────────────────────────
  floorRouteCard: {
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    padding: "14px 16px",
    boxShadow: GLASS_SHADOW,
  },
  floorRouteRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  routeFloorChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 32,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.72)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  routeFloorChipActive: {
    background: TEXT1,
    border: `1px solid ${TEXT1}`,
    color: "#ffffff",
    boxShadow: "0 4px 14px rgba(10,22,40,0.22)",
  },
  routeFloorNum: { fontWeight: 800, fontSize: 14 },
  routeFloorLabel: { fontSize: 11, opacity: 0.75 },

  // ── Map view + legend card ────────────────────────────────────────────────
  mapViewCard: {
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    padding: "14px 16px",
    boxShadow: GLASS_SHADOW,
  },
  viewToggleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 },
  viewToggleBtn: {
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.68)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 11,
    cursor: "pointer",
  },
  viewToggleBtnActive: {
    background: BLUE,
    border: `1px solid ${BLUE}`,
    color: "#ffffff",
    boxShadow: `0 4px 14px rgba(26,108,246,0.28)`,
  },
  legendStrip: { display: "flex", flexDirection: "column", gap: 7 },
  legendPill: { display: "flex", alignItems: "center", gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  legendPillLabel: { fontSize: 12, color: TEXT2, fontWeight: 500 },

  // kept for LegendItem component compatibility
  legendItem: { display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 12, margin: "6px 0" },

  // ── Floor tabs (center panel top) ─────────────────────────────────────────
  floorTabs: { display: "flex", gap: 6, alignItems: "center", overflowX: "auto", paddingBottom: 2 },
  floorTab: {
    height: 38,
    padding: "0 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.58)",
    background: "rgba(255,255,255,0.60)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    color: TEXT2,
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  floorTabActive: {
    background: "rgba(10,22,40,0.86)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#ffffff",
    boxShadow: "0 4px 18px rgba(10,22,40,0.22)",
  },
  floorTabRoute: { border: "1px solid rgba(26,108,246,0.40)", color: BLUE },
  floorTabNumber: {
    width: 22,
    height: 22,
    borderRadius: 8,
    background: "rgba(255,255,255,0.16)",
    display: "grid",
    placeItems: "center",
    fontSize: 13,
    fontWeight: 800,
  },

  // ── Map shell ─────────────────────────────────────────────────────────────
  mapShell: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    border: "1px solid rgba(255,255,255,0.56)",
    borderRadius: 24,
    overflow: "hidden",
    background: "linear-gradient(180deg, #e6f0fa 0%, #dae7f6 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92), 0 8px 32px rgba(10,22,40,0.09)",
  },
  followBanner: {
    position: "absolute",
    left: 14,
    top: 12,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.82)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: "1px solid rgba(255,255,255,0.70)",
    color: TEXT2,
    fontSize: 12,
    fontWeight: 600,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  layerQuickNav: {
    position: "absolute",
    right: 14,
    top: 12,
    zIndex: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.82)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: "1px solid rgba(255,255,255,0.70)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  layerQuickTitle: { fontSize: 10, fontWeight: 700, color: TEXT3, marginRight: 2, letterSpacing: 0.4 },
  layerQuickButton: {
    width: 30,
    height: 26,
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.85)",
    color: "#475569",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  layerQuickButtonActive: {
    background: BLUE,
    border: `1px solid ${BLUE}`,
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(37,99,235,0.22)",
  },
  mapStack: {
    position: "absolute",
    inset: "46px 4px 6px 4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  mapStackLayered: {
    display: "block",
    inset: "62px 4px 8px 4px",
    overflow: "visible",
  },
  mapStack3DSingle: { transformStyle: "preserve-3d" },
  mapStack3DLayered: {
    transformStyle: "preserve-3d",
    display: "block",
    inset: "54px 4px 8px 4px",
    overflow: "visible",
  },
  cam3DHint: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 12,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.80)",
    backdropFilter: "blur(8px)",
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: 700,
    pointerEvents: "none",
    userSelect: "none",
  },
  cam3DResetBtn: {
    pointerEvents: "auto",
    height: 24,
    padding: "0 9px",
    borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(255,255,255,0.12)",
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },

  // ── Floor plane ───────────────────────────────────────────────────────────
  floorPlane: {
    position: "relative",
    width: "min(100%, 1380px)",
    aspectRatio: "1672 / 670",
    borderRadius: 16,
    transformOrigin: "50% 50%",
    transition: "top 320ms ease, width 320ms ease, transform 400ms cubic-bezier(0.34,1.56,0.64,1), opacity 280ms ease, filter 280ms ease",
    background: "transparent",
  },
  floorGlassEdge: { display: "none" },
  layerGuideBadge: {
    position: "absolute",
    left: 14,
    top: 12,
    zIndex: 4,
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "6px 10px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.92)",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
    color: "#475569",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.3,
    pointerEvents: "none",
  },
  layerGuideBadgeActive: {
    background: "rgba(239,246,255,0.96)",
    border: "1px solid rgba(37,99,235,0.28)",
    color: BLUE,
  },
  layerGuideNumber: {
    width: 26,
    height: 22,
    borderRadius: 7,
    display: "grid",
    placeItems: "center",
    background: "rgba(37,99,235,0.09)",
    fontSize: 12,
    fontWeight: 900,
  },
  layerHint: {
    marginLeft: 3,
    padding: "3px 6px",
    borderRadius: 999,
    background: "rgba(37,99,235,0.07)",
    color: BLUE,
    fontSize: 10,
  },
  layerPeekLabel: {
    position: "absolute",
    right: 14,
    top: 12,
    zIndex: 4,
    padding: "5px 9px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.90)",
    border: `1px solid ${BORDER}`,
    color: "#64748b",
    fontSize: 11,
    fontWeight: 800,
    pointerEvents: "none",
  },
  floorSvg: { width: "100%", height: "100%", display: "block", borderRadius: 14, overflow: "hidden" },

  // ── Bottom toolbar ────────────────────────────────────────────────────────
  bottomToolbar: {
    alignSelf: "center",
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 7px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.80)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: "1px solid rgba(255,255,255,0.65)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.90)",
  },
  toolbarGroup: { display: "flex", alignItems: "center", gap: 3 },
  toolbarDivider: { width: 1, height: 20, background: "rgba(0,0,0,0.08)", margin: "0 3px" },
  toolButton: {
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.07)",
    background: "rgba(255,255,255,0.82)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  toolButtonActive: {
    background: BLUE,
    border: `1px solid ${BLUE}`,
    color: "#ffffff",
    boxShadow: `0 4px 12px rgba(26,108,246,0.28)`,
  },
  zoomLevelButton: {
    height: 30,
    minWidth: 52,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(26,108,246,0.22)",
    background: "rgba(26,108,246,0.09)",
    color: BLUE,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },

  // ── Route steps (right panel) ─────────────────────────────────────────────
  stepsCard: {
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    padding: "14px 16px",
    overflow: "hidden",
    boxShadow: GLASS_SHADOW,
  },
  routeHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 },
  routeSummaryMini: { color: TEXT3, fontSize: 11, fontWeight: 600, marginTop: -4 },
  stepModeButton: {
    height: 28,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.75)",
    color: TEXT2,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  stepModeButtonActive: { background: BLUE, color: "#ffffff", border: `1px solid ${BLUE}`, boxShadow: `0 4px 12px rgba(26,108,246,0.28)` },

  // Timeline styles
  stepsTimeline: { display: "flex", flexDirection: "column", gap: 0 },
  timelineStep: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "28px 1fr auto",
    gap: 0,
    alignItems: "stretch",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  timelineStepActive: {},
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 2,
    gap: 0,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "rgba(26,108,246,0.09)",
    color: BLUE,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 10,
    background: "rgba(0,0,0,0.09)",
    margin: "2px 0",
  },
  timelineLineActive: { background: BLUE, opacity: 0.4 },
  timelineContent: {
    padding: "2px 0 14px 10px",
    minWidth: 0,
  },
  timelineTitle: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: TEXT2,
    lineHeight: 1.35,
  },
  timelineTitleActive: { color: BLUE, fontWeight: 700 },
  timelineSub: {
    display: "block",
    fontSize: 11,
    color: TEXT3,
    marginTop: 2,
    lineHeight: 1.4,
  },
  timelineActivePip: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: BLUE,
    alignSelf: "center",
    marginRight: 2,
    marginLeft: 4,
    flexShrink: 0,
  },

  stepStart: { background: "rgba(34,197,94,0.10)", color: "#16a34a" },
  stepArrive: { background: "rgba(239,68,68,0.10)", color: "#dc2626" },
  stepUp: { background: "rgba(245,158,11,0.10)", color: "#d97706" },
  stepDown: { background: "rgba(168,85,247,0.10)", color: "#7c3aed" },

  stepControlRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(0,0,0,0.08)",
  },
  stepControlButton: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.75)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  stepControlButtonPrimary: { background: BLUE, color: "#ffffff", border: `1px solid ${BLUE}`, boxShadow: `0 4px 12px rgba(26,108,246,0.28)` },
  stepCounter: { minWidth: 42, textAlign: "center", color: BLUE, fontWeight: 700, fontSize: 12 },

  // ── Directory (right panel) ───────────────────────────────────────────────
  categoryPills: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 10,
  },
  categoryPill: {
    width: "100%",
    height: 30,
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.07)",
    background: "rgba(255,255,255,0.72)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  categoryPillActive: {
    background: TEXT1,
    border: `1px solid ${TEXT1}`,
    color: "#ffffff",
    boxShadow: "0 4px 14px rgba(10,22,40,0.22)",
  },
  categoryCount: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 700,
    color: TEXT3,
  },
  iconOnDark: { filter: "brightness(0) invert(1)", opacity: 0.9 },
  roomList: { maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, paddingRight: 2 },
  roomListItem: {
    width: "100%",
    minHeight: 32,
    display: "grid",
    gridTemplateColumns: "8px 1fr 30px",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "rgba(255,255,255,0.70)",
    color: TEXT2,
    cursor: "pointer",
    textAlign: "left",
  },
  roomDot: { width: 8, height: 8, borderRadius: 999 },
  roomListText: { fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  roomFloorChip: { justifySelf: "end", color: BLUE, fontSize: 10, fontWeight: 700 },

  // ── Current step card (floating on map) ───────────────────────────────────
  currentStepCard: {
    position: "absolute",
    left: 14,
    bottom: 14,
    zIndex: 10,
    width: 300,
    padding: "14px 16px",
    borderRadius: 24,
    background: "rgba(255,255,255,0.90)",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: "1px solid rgba(255,255,255,0.80)",
    boxShadow: `0 12px 40px rgba(26,108,246,0.14), 0 6px 20px rgba(0,0,0,0.08)`,
  },
  currentStepTopline: { color: BLUE, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" },
  currentStepTitle: { color: TEXT1, fontSize: 15, fontWeight: 700, lineHeight: 1.3 },
  currentStepSub: { color: TEXT2, fontSize: 12, lineHeight: 1.45, marginTop: 4 },
  currentStepActions: { display: "flex", gap: 7, marginTop: 12 },
  currentStepButton: {
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.82)",
    color: TEXT2,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  currentStepButtonPrimary: { background: BLUE, color: "#ffffff", border: `1px solid ${BLUE}`, boxShadow: `0 4px 12px rgba(26,108,246,0.28)` },
  currentStepButtonGhost: {
    height: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid transparent",
    background: "transparent",
    color: BLUE,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    marginLeft: "auto",
  },

  // ── Unified Search + Navigate panel (right column) ───────────────────────
  unifiedNavPanel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: GLASS_BG,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${GLASS_BORDER}`,
    borderRadius: 22,
    boxShadow: GLASS_SHADOW,
    overflow: "hidden",
  },
  unifiedSearchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderBottom: `1px solid ${GLASS_BORDER}`,
    flexShrink: 0,
  },
  unifiedSearchInput: {
    flex: 1,
    height: 36,
    border: 0,
    outline: 0,
    background: "transparent",
    color: TEXT1,
    fontSize: 14,
    fontWeight: 500,
  },
  unifiedScrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  unifiedDestBlock: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  unifiedClearBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(254,242,242,0.78)",
    color: "#dc2626",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    marginTop: 2,
  },
  findNearbyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  findNearbyTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: TEXT1,
    letterSpacing: 0.1,
  },
  findNearbyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 7,
    marginBottom: 4,
  },
  findNearbyCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
    padding: "12px 8px",
    borderRadius: 16,
    border: `1px solid ${GLASS_BORDER}`,
    background: "rgba(255,255,255,0.60)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  findNearbyCardActive: {
    background: TEXT1,
    border: `1px solid ${TEXT1}`,
    boxShadow: "0 4px 14px rgba(10,22,40,0.22)",
  },
  findNearbyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  findNearbyLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: TEXT1,
    textAlign: "center",
    lineHeight: 1.2,
  },

  real3DCanvasWrap: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    borderRadius: 26,
    background: "#e8ebf0",
    zIndex: 1,
  },

  // ── Legacy / unused (kept for safety) ─────────────────────────────────────
  brandBlock: { display: "flex", alignItems: "center", gap: 12 },
  stepsList: { display: "flex", flexDirection: "column", gap: 10 },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    background: "rgba(37,99,235,0.08)",
    color: BLUE,
    display: "grid",
    placeItems: "center",
  },
  stepTitle: { display: "block", color: TEXT1, fontWeight: 600, fontSize: 12, lineHeight: 1.3 },
  stepSub: { display: "block", color: TEXT3, fontSize: 11, marginTop: 2 },
  metricRow: { display: "flex", justifyContent: "space-between", color: TEXT2, fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,0.07)" },
  metricsCard: { background: GLASS_BG, backdropFilter: BLUR, WebkitBackdropFilter: BLUR, border: `1px solid ${GLASS_BORDER}`, borderRadius: 22, padding: "14px 16px", boxShadow: GLASS_SHADOW },
};