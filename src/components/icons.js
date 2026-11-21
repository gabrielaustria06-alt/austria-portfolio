// SVG data URI icons — replaces the missing ../assets/*.svg imports in SmartNav
// Each is a valid SVG data URI rendered as <img src={...} />

const ic = (path) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${path}%3C/svg%3E`;

const icBlue = (path) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231a6cf6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E${path}%3C/svg%3E`;

// ── Lucide-style icon paths ────────────────────────────────────────────────
export const iconSearch = ic("%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E");
export const iconOffice = ic("%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M9 9h6M9 13h6M9 17h4'/%3E");
export const iconClassroom = ic("%3Cpath d='M22 10v6M2 10l10-5 10 5-10 5z'/%3E%3Cpath d='M6 12v5c3 3 9 3 12 0v-5'/%3E");
export const iconLab = ic("%3Cpath d='M10 2v8L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 10V2'/%3E%3Cpath d='M8.5 2h7'/%3E%3Cpath d='M7 16h10'/%3E");
export const iconFacility = ic("%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9,22 9,12 15,12 15,22'/%3E");
export const iconRestroom = ic("%3Ccircle cx='12' cy='5' r='2'/%3E%3Cpath d='M12 10v4m0 0-2 4m2-4 2 4M9 10h6'/%3E");
export const iconStairs = ic("%3Cpath d='M19 4H9a2 2 0 0 0-2 2v4H5a2 2 0 0 0-2 2v8h7v-4h4V12h5V4z'/%3E");
export const iconLobby = ic("%3Crect x='3' y='12' width='18' height='9' rx='1'/%3E%3Cpath d='M3 12l9-9 9 9'/%3E%3Crect x='9' y='17' width='6' height='4'/%3E");
export const iconParking = ic("%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M9 17V7h4a3 3 0 0 1 0 6H9'/%3E");
export const iconStorage = ic("%3Crect x='2' y='7' width='20' height='14' rx='2'/%3E%3Cpath d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/%3E");
export const iconUtility = ic("%3Cpath d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/%3E");
export const iconSpecial = ic("%3Cpolygon points='12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26'/%3E");
export const iconRoute = ic("%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M12 2a7 7 0 1 0 7 7'/%3E%3Cpath d='M22 12 12 2l-2 10 10-10-2 10z'/%3E");
export const iconLayers = ic("%3Cpolygon points='12,2 2,7 12,12 22,7'/%3E%3Cpolyline points='2,17 12,22 22,17'/%3E%3Cpolyline points='2,12 12,17 22,12'/%3E");
export const iconFloor = ic("%3Crect x='3' y='3' width='18' height='5' rx='1'/%3E%3Crect x='3' y='10' width='18' height='5' rx='1'/%3E%3Crect x='3' y='17' width='18' height='4' rx='1'/%3E");
export const iconSingleFloor = ic("%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E");
export const iconSimpleView = ic("%3Crect x='3' y='3' width='7' height='7'/%3E%3Crect x='14' y='3' width='7' height='7'/%3E%3Crect x='14' y='14' width='7' height='7'/%3E%3Crect x='3' y='14' width='7' height='7'/%3E");
export const iconReset = ic("%3Cpath d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'/%3E%3Cpath d='M3 3v5h5'/%3E");
export const iconFocus = ic("%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2'/%3E");
export const iconPlus = ic("%3Cpath d='M12 5v14M5 12h14'/%3E");
export const iconMinus = ic("%3Cpath d='M5 12h14'/%3E");
export const iconPin = ic("%3Cpath d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E");
export const iconKiosk = ic("%3Crect x='2' y='3' width='20' height='14' rx='2'/%3E%3Cpath d='M8 21h8M12 17v4'/%3E");
export const iconArrowRight = ic("%3Cpath d='M5 12h14M12 5l7 7-7 7'/%3E");
export const iconArrowUp = ic("%3Cpath d='M12 19V5M5 12l7-7 7 7'/%3E");
export const iconArrowDown = ic("%3Cpath d='M12 5v14M19 12l-7 7-7-7'/%3E");
export const iconClose = ic("%3Cpath d='M18 6 6 18M6 6l12 12'/%3E");
export const iconInfo = ic("%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 16v-4M12 8h.01'/%3E");
export const iconLogoGc = ic("%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/%3E%3Cpath d='M13 17H11v-6h2v6zm0-8h-2V7h2v2z' fill='%23555' stroke='none'/%3E");

// ── Waypoint markers (used inside SVG <image> elements on the map) ─────────
export const wayStartDot =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='10' fill='%2322c55e' stroke='white' stroke-width='3'/%3E%3Ccircle cx='14' cy='14' r='4' fill='white'/%3E%3C/svg%3E";

export const wayDestinationPin =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 42'%3E%3Cpath d='M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26S32 28 32 16C32 7.16 24.84 0 16 0z' fill='%23ef4444'/%3E%3Ccircle cx='16' cy='16' r='7' fill='white'/%3E%3C/svg%3E";

export const wayKioskDot =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='10' fill='%231a6cf6' stroke='white' stroke-width='3'/%3E%3Ccircle cx='14' cy='14' r='4' fill='white'/%3E%3C/svg%3E";

export const wayStairsUp = icBlue("%3Cpath d='M12 19V5M5 12l7-7 7 7'/%3E");
export const wayStairsDown = icBlue("%3Cpath d='M12 5v14M19 12l-7 7-7-7'/%3E");
export const wayFloorTransfer = icBlue("%3Cpath d='M7 16V8m0 0-3 3m3-3 3 3M17 8v8m0 0 3-3m-3 3-3-3'/%3E");
