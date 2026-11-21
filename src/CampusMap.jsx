import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, MapPinned, Plus, Trash2, School, Navigation,
  X, Save, Map, Locate, RouteOff, ChevronRight,
  AlertCircle, CheckCircle2, Clock, Milestone,
} from "lucide-react";

const CAMPUS_LAT = 14.83275208776674;
const CAMPUS_LNG = 120.28219841788867;
const DEFAULT_ZOOM = 18;
const OSRM = "https://router.project-osrm.org/route/v1/walking";

const defaultMarkers = [
  { id: 1, lat: 14.83275208776674, lng: 120.28219841788867, label: "Gordon College Main" },
  { id: 2, lat: 14.832950,          lng: 120.282050,          label: "Main Gate" },
  { id: 3, lat: 14.832580,          lng: 120.282380,          label: "Gymnasium" },
  { id: 4, lat: 14.832400,          lng: 120.281900,          label: "Parking Area" },
];

/* ── helpers ── */
const deg2rad = d => d * Math.PI / 180;
const haversine = (a, b) => {
  const R = 6371000;
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};
const fmtDist = m => m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
const fmtTime = s => s < 60 ? `${Math.round(s)}s` : `${Math.round(s/60)} min`;

export default function CampusMap({ userRole = "student", onBack }) {
  const mapRef        = useRef(null);
  const leafletMap    = useRef(null);
  const markersRef    = useRef({});
  const tempMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);   // live location dot
  const routeLineRef  = useRef(null);   // drawn route polyline
  const watchIdRef    = useRef(null);   // geolocation watchId
  const accuracyRef   = useRef(null);   // accuracy circle

  const [mounted,        setMounted]        = useState(false);
  const [mapReady,       setMapReady]       = useState(false);
  const [markers,        setMarkers]        = useState(defaultMarkers);
  const [tileStyle,      setTileStyle]      = useState("street");
  const [addMode,        setAddMode]        = useState(false);
  const [pendingPin,     setPendingPin]     = useState(null);
  const [pinLabel,       setPinLabel]       = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);

  /* navigation state */
  const [locPerm,      setLocPerm]      = useState("idle");   // idle | requesting | granted | denied
  const [userPos,      setUserPos]      = useState(null);     // { lat, lng, accuracy }
  const [navTarget,    setNavTarget]    = useState(null);     // marker object
  const [route,        setRoute]        = useState(null);     // { coords, distance, duration, steps }
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError,   setRouteError]   = useState("");
  const [navActive,    setNavActive]    = useState(false);    // turn-by-turn panel open
  const [currentStep,  setCurrentStep]  = useState(0);

  const isAdmin = userRole === "admin";

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  /* ── Load Leaflet ── */
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const initMap = () => {
      if (leafletMap.current || !mapRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [CAMPUS_LAT, CAMPUS_LNG], zoom: DEFAULT_ZOOM,
        zoomControl: false, attributionControl: true,
      });
      const street    = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 22 });
      const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "© Esri", maxZoom: 22 });
      street.addTo(map);
      map._streetLayer = street; map._satelliteLayer = satellite;
      leafletMap.current = map;
      setMapReady(true);
      map.on("click", (e) => {
        if (!addMode) return;
        setPendingPin({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    };
    if (window.L) { initMap(); }
    else {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = initMap;
      document.body.appendChild(s);
    }
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, []);

  /* ── re-bind click for addMode ── */
  useEffect(() => {
    const map = leafletMap.current; if (!map) return;
    map.off("click");
    map.on("click", (e) => { if (addMode) setPendingPin({ lat: e.latlng.lat, lng: e.latlng.lng }); });
  }, [addMode]);

  /* ── tile toggle ── */
  useEffect(() => {
    const map = leafletMap.current; if (!map || !map._streetLayer) return;
    if (tileStyle === "satellite") { map.removeLayer(map._streetLayer); map._satelliteLayer.addTo(map); }
    else { map.removeLayer(map._satelliteLayer); map._streetLayer.addTo(map); }
  }, [tileStyle]);

  /* ── sync destination markers ── */
  useEffect(() => {
    const map = leafletMap.current; if (!map || !mapReady) return;
    const L = window.L;
    Object.keys(markersRef.current).forEach(id => {
      if (!markers.find(m => m.id === +id)) { map.removeLayer(markersRef.current[id]); delete markersRef.current[id]; }
    });
    markers.forEach(m => {
      if (markersRef.current[m.id]) return;
      const isNav = navTarget?.id === m.id;
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:28px;height:44px;">
            <div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
              background:${isNav ? "linear-gradient(135deg,#40e0a0,#1e78ff)" : "linear-gradient(135deg,#1e78ff,#0fb8ff)"};
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 4px 14px ${isNav ? "rgba(64,224,160,0.6)" : "rgba(30,120,255,0.55)"};
              border:2px solid rgba(255,255,255,0.35);cursor:pointer;">
              <div style="width:7px;height:7px;border-radius:50%;background:#fff;transform:rotate(45deg)"></div>
            </div>
            <div style="position:absolute;top:34px;left:50%;transform:translateX(-50%);
              background:rgba(8,12,20,0.92);border:1px solid rgba(30,120,255,0.35);
              color:#e2e8f0;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;
              padding:3px 8px;border-radius:6px;white-space:nowrap;backdrop-filter:blur(8px);pointer-events:none;">
              ${m.label}
            </div>
          </div>`,
        iconSize: [28, 44], iconAnchor: [14, 28],
      });
      const lm = L.marker([m.lat, m.lng], { icon, draggable: isAdmin })
        .addTo(map)
        .on("click", () => setSelectedMarker(m))
        .on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          setMarkers(prev => prev.map(mk => mk.id === m.id ? { ...mk, lat, lng } : mk));
        });
      markersRef.current[m.id] = lm;
    });
  }, [markers, mapReady, navTarget]);

  /* ── pending pin preview ── */
  useEffect(() => {
    const map = leafletMap.current; if (!map || !mapReady) return;
    const L = window.L;
    if (tempMarkerRef.current) { map.removeLayer(tempMarkerRef.current); tempMarkerRef.current = null; }
    if (pendingPin) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#ffaa30,#ff7700);box-shadow:0 4px 14px rgba(255,150,30,0.6);border:2px solid rgba(255,255,255,0.4);"></div>`,
        iconSize: [26, 26], iconAnchor: [13, 26],
      });
      tempMarkerRef.current = L.marker([pendingPin.lat, pendingPin.lng], { icon }).addTo(map);
    }
  }, [pendingPin, mapReady]);

  /* ── live user location dot ── */
  useEffect(() => {
    const map = leafletMap.current; if (!map || !mapReady || !userPos) return;
    const L = window.L;
    const icon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(30,120,255,0.2);animation:locPulse 2s ease infinite;"></div>
          <div style="position:absolute;inset:3px;border-radius:50%;background:#1e78ff;border:2px solid #fff;box-shadow:0 0 10px rgba(30,120,255,0.8);"></div>
        </div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    } else {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    }
    // accuracy circle
    if (accuracyRef.current) map.removeLayer(accuracyRef.current);
    accuracyRef.current = L.circle([userPos.lat, userPos.lng], {
      radius: userPos.accuracy, color: "#1e78ff", fillColor: "#1e78ff",
      fillOpacity: 0.06, weight: 1, opacity: 0.3,
    }).addTo(map);
  }, [userPos, mapReady]);

  /* ── draw/clear route line ── */
  useEffect(() => {
    const map = leafletMap.current; if (!map || !mapReady) return;
    const L = window.L;
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (!route) return;
    // Animated dashed route line
    routeLineRef.current = L.polyline(route.coords, {
      color: "#1e78ff", weight: 5, opacity: 0.85,
      dashArray: "10, 6", lineCap: "round", lineJoin: "round",
    }).addTo(map);
    // Fit map to show full route
    const bounds = L.latLngBounds(route.coords);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [route, mapReady]);

  /* ── re-fetch route when user moves (if nav active) ── */
  useEffect(() => {
    if (!navActive || !userPos || !navTarget) return;
    fetchRoute(userPos, navTarget);
    // find closest step
    if (route?.steps) {
      let minDist = Infinity, minIdx = 0;
      route.steps.forEach((step, i) => {
        const d = haversine(userPos, { lat: step.lat, lng: step.lng });
        if (d < minDist) { minDist = d; minIdx = i; }
      });
      setCurrentStep(minIdx);
    }
  }, [userPos]);

  /* ── REQUEST GEOLOCATION ── */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocPerm("denied"); return; }
    setLocPerm("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocPerm("granted");
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        leafletMap.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 18, { duration: 1.2 });
        // Start watching
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
          () => {},
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
      },
      (err) => {
        setLocPerm(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── FETCH ROUTE via OSRM ── */
  const fetchRoute = useCallback(async (from, to) => {
    setRouteLoading(true); setRouteError("");
    try {
      const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&annotations=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Routing service unavailable");
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");
      const r = data.routes[0];
      const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      // Parse turn-by-turn steps
      const steps = r.legs[0].steps.map(s => ({
        instruction: s.maneuver.type === "arrive" ? `Arrive at ${to.label}` : formatManeuver(s),
        distance: s.distance,
        duration: s.duration,
        lat: s.maneuver.location[1],
        lng: s.maneuver.location[0],
      }));
      setRoute({ coords, distance: r.distance, duration: r.duration, steps });
      setCurrentStep(0);
    } catch (e) {
      setRouteError(e.message || "Could not fetch route. Check your connection.");
    }
    setRouteLoading(false);
  }, []);

  const formatManeuver = (step) => {
    const t = step.maneuver.type;
    const m = step.maneuver.modifier;
    const road = step.name ? `onto ${step.name}` : "";
    if (t === "turn") return `Turn ${m} ${road}`.trim();
    if (t === "depart") return `Head ${m || "forward"} ${road}`.trim();
    if (t === "continue") return `Continue ${road}`.trim();
    if (t === "roundabout") return `Enter roundabout ${road}`.trim();
    if (t === "fork") return `Keep ${m} at fork ${road}`.trim();
    return `${t}${m ? ` ${m}` : ""} ${road}`.trim();
  };

  /* ── NAVIGATE TO ── */
  const navigateTo = async (marker) => {
    setNavTarget(marker);
    setSelectedMarker(null);
    setNavActive(true);
    setCurrentStep(0);
    if (locPerm !== "granted" || !userPos) {
      // Request location first, then route
      if (!navigator.geolocation) { setLocPerm("denied"); return; }
      setLocPerm("requesting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocPerm("granted");
          const from = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setUserPos(from);
          if (!watchIdRef.current) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
              () => {},
              { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
            );
          }
          fetchRoute(from, marker);
        },
        () => setLocPerm("denied"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      fetchRoute(userPos, marker);
    }
  };

  /* ── STOP NAVIGATION ── */
  const stopNav = () => {
    setNavActive(false); setNavTarget(null); setRoute(null);
    setCurrentStep(0); setRouteError("");
    if (routeLineRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  };

  /* ── other actions ── */
  const confirmPin = () => {
    if (!pendingPin || !pinLabel.trim()) return;
    setMarkers(prev => [...prev, { id: Date.now(), ...pendingPin, label: pinLabel.trim() }]);
    setPendingPin(null); setPinLabel(""); setAddMode(false);
  };
  const cancelPin   = () => { setPendingPin(null); setPinLabel(""); };
  const deleteMarker = (id) => { setMarkers(prev => prev.filter(m => m.id !== id)); if (selectedMarker?.id === id) setSelectedMarker(null); if (navTarget?.id === id) stopNav(); };
  const flyTo       = (lat, lng) => leafletMap.current?.flyTo([lat, lng], 19, { duration: 1 });
  const recenter    = () => {
    if (userPos) { leafletMap.current?.flyTo([userPos.lat, userPos.lng], 18, { duration: 1 }); }
    else { leafletMap.current?.flyTo([CAMPUS_LAT, CAMPUS_LNG], DEFAULT_ZOOM, { duration: 1 }); }
  };

  const distToTarget = userPos && navTarget
    ? haversine(userPos, navTarget)
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes locPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(2.2);opacity:0} }
        @keyframes fadeInDown { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }

        .cm-root { width:100vw; height:100vh; background:#080c14; font-family:'DM Sans',sans-serif; color:#e2e8f0; display:flex; flex-direction:column; overflow:hidden; position:relative; }
        .cm-root::before { content:''; position:fixed; inset:0; background-image:linear-gradient(rgba(30,120,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(30,120,255,0.04) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; z-index:0; }

        /* TOPBAR */
        .cm-topbar { position:relative; z-index:20; display:flex; align-items:center; justify-content:space-between; padding:14px 24px; background:rgba(8,12,20,0.92); border-bottom:1px solid rgba(30,120,255,0.15); backdrop-filter:blur(16px); flex-shrink:0; opacity:0; transform:translateY(-12px); transition:opacity 0.5s ease,transform 0.5s ease; }
        .cm-topbar.show { opacity:1; transform:translateY(0); }
        .cm-topbar-left { display:flex; align-items:center; gap:14px; }
        .cm-back-btn { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 14px; color:#8899b0; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; }
        .cm-back-btn:hover { background:rgba(30,120,255,0.12); border-color:rgba(30,120,255,0.3); color:#fff; }
        .cm-brand { display:flex; align-items:center; gap:10px; }
        .cm-brand-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#1e78ff,#0fb8ff); display:grid; place-items:center; box-shadow:0 4px 14px rgba(30,120,255,0.4); flex-shrink:0; }
        .cm-brand-text h1 { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:0.06em; color:#fff; line-height:1; }
        .cm-brand-text p { font-size:11px; color:#4a6080; margin-top:2px; }
        .cm-topbar-right { display:flex; align-items:center; gap:8px; }

        /* BUTTONS */
        .cm-btn { display:flex; align-items:center; gap:6px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 13px; background:rgba(255,255,255,0.04); color:#8899b0; font-family:'DM Sans',sans-serif; font-size:12px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .cm-btn:hover { background:rgba(255,255,255,0.08); color:#fff; border-color:rgba(255,255,255,0.2); }
        .cm-btn.accent { border-color:rgba(30,120,255,0.35); color:#7fb3ff; background:rgba(30,120,255,0.1); }
        .cm-btn.accent:hover { background:rgba(30,120,255,0.2); color:#fff; }
        .cm-btn.green { border-color:rgba(64,224,160,0.35); color:#40e0a0; background:rgba(64,224,160,0.08); }
        .cm-btn.green:hover { background:rgba(64,224,160,0.18); color:#fff; }
        .cm-btn.warn { border-color:rgba(255,170,30,0.35); color:#ffaa30; background:rgba(255,170,30,0.08); }
        .cm-btn.warn:hover { background:rgba(255,170,30,0.18); color:#fff; }
        .cm-btn.warn.active { background:rgba(255,170,30,0.2); border-color:rgba(255,170,30,0.6); color:#ffcc60; }
        .cm-btn.danger { border-color:rgba(255,60,60,0.3); color:#ff7070; background:rgba(255,60,60,0.07); }
        .cm-btn.danger:hover { background:rgba(255,60,60,0.15); }
        .cm-btn:disabled { opacity:0.45; cursor:not-allowed; }

        .cm-tile-toggle { display:flex; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; }
        .cm-tile-btn { padding:8px 13px; background:transparent; border:none; color:#8899b0; font-family:'DM Sans',sans-serif; font-size:12px; cursor:pointer; transition:all 0.2s; white-space:nowrap; display:flex; align-items:center; gap:5px; }
        .cm-tile-btn.active { background:rgba(30,120,255,0.2); color:#7fb3ff; }
        .cm-tile-btn:hover:not(.active) { background:rgba(255,255,255,0.06); color:#e2e8f0; }

        /* BODY */
        .cm-body { flex:1; display:flex; overflow:hidden; position:relative; z-index:1; opacity:0; transition:opacity 0.6s 0.2s ease; }
        .cm-body.show { opacity:1; }

        /* SIDEBAR */
        .cm-sidebar { width:280px; flex-shrink:0; background:rgba(8,12,20,0.96); border-right:1px solid rgba(30,120,255,0.12); display:flex; flex-direction:column; overflow:hidden; }
        .cm-sidebar-inner { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; scrollbar-width:thin; scrollbar-color:rgba(30,120,255,0.3) transparent; }
        .cm-section { display:flex; flex-direction:column; gap:8px; }
        .cm-section-title { font-size:10px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:#1e78ff; display:flex; align-items:center; gap:6px; }
        .cm-section-title::after { content:''; flex:1; height:1px; background:rgba(30,120,255,0.15); }

        /* LOCATION PERMISSION CARD */
        .cm-loc-card { background:rgba(30,120,255,0.07); border:1px solid rgba(30,120,255,0.2); border-radius:12px; padding:13px; display:flex; flex-direction:column; gap:9px; }
        .cm-loc-card.denied { background:rgba(255,60,60,0.07); border-color:rgba(255,60,60,0.2); }
        .cm-loc-card.granted { background:rgba(64,224,160,0.07); border-color:rgba(64,224,160,0.2); }
        .cm-loc-title { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#7fb3ff; display:flex; align-items:center; gap:6px; }
        .cm-loc-title.denied { color:#ff7070; }
        .cm-loc-title.granted { color:#40e0a0; }
        .cm-loc-body { font-size:12px; color:#4a6080; line-height:1.55; }
        .cm-loc-acc { font-size:11px; color:#4a6080; font-family:monospace; }

        /* MARKER LIST */
        .cm-marker-item { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 12px; cursor:pointer; transition:all 0.2s; }
        .cm-marker-item:hover { background:rgba(30,120,255,0.08); border-color:rgba(30,120,255,0.2); }
        .cm-marker-item.active { background:rgba(30,120,255,0.14); border-color:rgba(30,120,255,0.4); }
        .cm-marker-item.navigating { background:rgba(64,224,160,0.08); border-color:rgba(64,224,160,0.3); }
        .cm-marker-dot { width:10px; height:10px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); flex-shrink:0; background:linear-gradient(135deg,#1e78ff,#0fb8ff); box-shadow:0 2px 8px rgba(30,120,255,0.5); }
        .cm-marker-dot.nav { background:linear-gradient(135deg,#40e0a0,#1e78ff); box-shadow:0 2px 8px rgba(64,224,160,0.5); }
        .cm-marker-info { flex:1; min-width:0; }
        .cm-marker-name { font-size:13px; font-weight:500; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cm-marker-coords { font-size:10px; color:#3d5070; margin-top:2px; font-family:monospace; }
        .cm-marker-actions { display:flex; gap:4px; flex-shrink:0; }
        .cm-marker-nav { background:rgba(64,224,160,0.1); border:1px solid rgba(64,224,160,0.25); border-radius:7px; padding:4px 8px; color:#40e0a0; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:4px; }
        .cm-marker-nav:hover { background:rgba(64,224,160,0.22); }
        .cm-marker-del { background:none; border:none; color:#3d5070; cursor:pointer; display:flex; align-items:center; transition:color 0.2s; padding:3px; }
        .cm-marker-del:hover { color:#ff6b6b; }

        /* ADD PIN FORM */
        .cm-pin-form { background:rgba(255,170,30,0.06); border:1px solid rgba(255,170,30,0.2); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:9px; }
        .cm-pin-form-title { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#ffaa30; display:flex; align-items:center; gap:6px; }
        .cm-pin-coords { font-size:11px; color:#4a6080; font-family:monospace; padding:6px 10px; background:rgba(255,255,255,0.04); border-radius:6px; }
        .cm-pin-input { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:9px 11px; color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:border-color 0.2s; }
        .cm-pin-input:focus { border-color:#ffaa30; }
        .cm-pin-input::placeholder { color:#3d5070; }
        .cm-pin-form-btns { display:flex; gap:7px; }
        .cm-confirm-btn { flex:1; background:linear-gradient(135deg,#ffaa30,#ff7700); border:none; border-radius:8px; padding:9px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:opacity 0.2s; }
        .cm-confirm-btn:hover { opacity:0.88; } .cm-confirm-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .cm-cancel-btn { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:9px 14px; color:#8899b0; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; }

        /* MAP */
        .cm-map-wrap { flex:1; position:relative; overflow:hidden; }
        .cm-map { width:100%; height:100%; }
        .leaflet-container { background:#080c14 !important; }
        .leaflet-control-attribution { background:rgba(8,12,20,0.85) !important; color:#3d5070 !important; font-size:10px !important; border-top:1px solid rgba(255,255,255,0.06) !important; }
        .leaflet-control-attribution a { color:#4a6080 !important; }

        /* ZOOM */
        .cm-zoom { position:absolute; bottom:20px; right:20px; z-index:10; display:flex; flex-direction:column; gap:4px; }
        .cm-zoom-btn { width:34px; height:34px; border-radius:9px; background:rgba(8,12,20,0.9); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; font-size:20px; cursor:pointer; display:grid; place-items:center; backdrop-filter:blur(10px); transition:all 0.2s; font-family:monospace; line-height:1; box-shadow:0 4px 16px rgba(0,0,0,0.4); }
        .cm-zoom-btn:hover { background:rgba(30,120,255,0.22); border-color:rgba(30,120,255,0.45); }

        /* HUD chips */
        .cm-add-hud { position:absolute; top:14px; left:50%; transform:translateX(-50%); z-index:10; background:rgba(255,170,30,0.14); border:1px solid rgba(255,170,30,0.4); border-radius:10px; padding:9px 18px; font-size:13px; font-weight:600; color:#ffcc60; backdrop-filter:blur(10px); pointer-events:none; display:flex; align-items:center; gap:8px; box-shadow:0 4px 20px rgba(255,170,30,0.15); animation:fadeInDown 0.3s ease; }
        .cm-campus-badge { position:absolute; top:14px; left:14px; z-index:10; background:rgba(8,12,20,0.88); border:1px solid rgba(30,120,255,0.3); border-radius:8px; padding:6px 13px; font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:0.08em; color:#7fb3ff; backdrop-filter:blur(8px); display:flex; align-items:center; gap:7px; }

        /* NAV STATUS CHIP (top center of map) */
        .cm-nav-chip { position:absolute; top:14px; left:50%; transform:translateX(-50%); z-index:10; background:rgba(13,18,32,0.95); border:1px solid rgba(64,224,160,0.4); border-radius:12px; padding:10px 18px; display:flex; align-items:center; gap:10px; backdrop-filter:blur(12px); box-shadow:0 4px 24px rgba(64,224,160,0.15); animation:fadeInDown 0.3s ease; white-space:nowrap; }
        .cm-nav-chip-dot { width:8px; height:8px; border-radius:50%; background:#40e0a0; box-shadow:0 0 8px #40e0a0; animation:locPulse 2s ease infinite; flex-shrink:0; }
        .cm-nav-chip-label { font-size:13px; font-weight:600; color:#e2e8f0; }
        .cm-nav-chip-dist { font-size:12px; color:#40e0a0; font-weight:600; }
        .cm-nav-chip-stop { background:none; border:1px solid rgba(255,60,60,0.3); border-radius:7px; padding:4px 10px; color:#ff7070; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s; margin-left:4px; }
        .cm-nav-chip-stop:hover { background:rgba(255,60,60,0.15); }

        /* SELECTED MARKER CARD */
        .cm-detail-card { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:10; background:rgba(13,18,32,0.97); border:1px solid rgba(30,120,255,0.3); border-radius:14px; padding:16px 18px; min-width:260px; max-width:340px; backdrop-filter:blur(12px); box-shadow:0 8px 32px rgba(0,0,0,0.5); animation:slideUp 0.25s ease; }
        .cm-detail-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
        .cm-detail-name { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:0.04em; color:#fff; line-height:1.1; }
        .cm-detail-close { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:7px; width:28px; height:28px; display:grid; place-items:center; cursor:pointer; color:#8899b0; transition:all 0.2s; }
        .cm-detail-close:hover { background:rgba(255,60,60,0.15); color:#ff6b6b; }
        .cm-detail-coords { font-size:11px; color:#3d5070; font-family:monospace; margin-bottom:12px; }
        .cm-detail-actions { display:flex; gap:7px; }
        .cm-nav-btn { flex:1; background:linear-gradient(135deg,rgba(64,224,160,0.2),rgba(30,120,255,0.2)); border:1px solid rgba(64,224,160,0.4); border-radius:9px; padding:10px; color:#40e0a0; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; }
        .cm-nav-btn:hover { background:linear-gradient(135deg,rgba(64,224,160,0.3),rgba(30,120,255,0.3)); box-shadow:0 4px 16px rgba(64,224,160,0.2); }
        .cm-fly-btn { flex:1; background:rgba(30,120,255,0.12); border:1px solid rgba(30,120,255,0.3); border-radius:9px; padding:10px; color:#7fb3ff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; }
        .cm-fly-btn:hover { background:rgba(30,120,255,0.22); color:#fff; }

        /* TURN-BY-TURN PANEL */
        .cm-nav-panel { position:absolute; bottom:0; left:0; right:0; z-index:15; background:rgba(8,12,20,0.97); border-top:1px solid rgba(64,224,160,0.25); backdrop-filter:blur(16px); transform:translateY(100%); transition:transform 0.35s cubic-bezier(0.4,0,0.2,1); max-height:55vh; display:flex; flex-direction:column; }
        .cm-nav-panel.open { transform:translateY(0); }
        .cm-nav-panel-header { padding:14px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
        .cm-nav-panel-title { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:0.04em; color:#fff; display:flex; align-items:center; gap:8px; }
        .cm-nav-panel-meta { display:flex; gap:12px; margin-top:3px; }
        .cm-nav-meta-chip { display:flex; align-items:center; gap:5px; font-size:12px; color:#4a6080; }
        .cm-nav-meta-chip span { color:#e2e8f0; font-weight:600; }
        .cm-nav-panel-body { flex:1; overflow-y:auto; padding:12px 20px; display:flex; flex-direction:column; gap:6px; scrollbar-width:thin; scrollbar-color:rgba(64,224,160,0.2) transparent; }
        .cm-step { display:flex; align-items:flex-start; gap:12px; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); transition:all 0.2s; }
        .cm-step.current { background:rgba(64,224,160,0.08); border-color:rgba(64,224,160,0.3); }
        .cm-step.done { opacity:0.4; }
        .cm-step-num { width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:10px; font-weight:700; flex-shrink:0; margin-top:1px; background:rgba(255,255,255,0.07); color:#8899b0; }
        .cm-step.current .cm-step-num { background:rgba(64,224,160,0.2); color:#40e0a0; }
        .cm-step.done .cm-step-num { background:rgba(30,120,255,0.15); color:#1e78ff; }
        .cm-step-info { flex:1; }
        .cm-step-text { font-size:13px; color:#e2e8f0; line-height:1.4; }
        .cm-step.done .cm-step-text { color:#4a6080; }
        .cm-step-dist { font-size:11px; color:#4a6080; margin-top:3px; }

        /* LOADING SPINNER */
        .cm-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.2); border-top-color:#40e0a0; border-radius:50%; animation:spin 0.7s linear infinite; }

        /* RESPONSIVE */
        @media (max-width:860px) {
          .cm-sidebar { display:none; }
          .cm-topbar-right .cm-tile-toggle { display:none; }
          .cm-detail-card { width:calc(100vw - 32px); max-width:none; }
          .cm-nav-panel { max-height:60vh; }
        }
      `}</style>

      <div className="cm-root">

        {/* TOPBAR */}
        <div className={`cm-topbar ${mounted ? "show" : ""}`}>
          <div className="cm-topbar-left">
            <button className="cm-back-btn" onClick={onBack}><ArrowLeft size={14} /> Floor Maps</button>
            <div className="cm-brand">
              <div className="cm-brand-icon"><School size={17} color="#fff" /></div>
              <div className="cm-brand-text"><h1>CAMPUS MAP</h1><p>Gordon College · Olongapo City</p></div>
            </div>
          </div>
          <div className="cm-topbar-right">
            <div className="cm-tile-toggle">
              <button className={`cm-tile-btn ${tileStyle === "street" ? "active" : ""}`} onClick={() => setTileStyle("street")}><Map size={12} /> Street</button>
              <button className={`cm-tile-btn ${tileStyle === "satellite" ? "active" : ""}`} onClick={() => setTileStyle("satellite")}>🛰 Satellite</button>
            </div>
            {/* Location button */}
            {locPerm === "idle" && (
              <button className="cm-btn accent" onClick={requestLocation}><Locate size={13} /> Share Location</button>
            )}
            {locPerm === "requesting" && (
              <button className="cm-btn accent" disabled><div className="cm-spinner" /> Locating…</button>
            )}
            {locPerm === "granted" && (
              <button className="cm-btn green" onClick={recenter}><Locate size={13} /> My Location</button>
            )}
            {(locPerm === "denied" || locPerm === "error") && (
              <button className="cm-btn danger" onClick={requestLocation}><AlertCircle size={13} /> Location Denied</button>
            )}
            <button className="cm-btn accent" onClick={recenter}><Navigation size={13} /> Recenter</button>
            {navActive && <button className="cm-btn danger" onClick={stopNav}><RouteOff size={13} /> Stop Nav</button>}
            {isAdmin && (
              <button className={`cm-btn warn ${addMode ? "active" : ""}`} onClick={() => { setAddMode(v => !v); setPendingPin(null); setPinLabel(""); }}>
                <Plus size={13} /> {addMode ? "Cancel Add" : "Add Pin"}
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className={`cm-body ${mounted ? "show" : ""}`}>

          {/* SIDEBAR */}
          <aside className="cm-sidebar">
            <div className="cm-sidebar-inner">

              {/* Location status card */}
              <div className={`cm-loc-card ${locPerm === "denied" ? "denied" : locPerm === "granted" ? "granted" : ""}`}>
                <div className={`cm-loc-title ${locPerm === "denied" ? "denied" : locPerm === "granted" ? "granted" : ""}`}>
                  {locPerm === "granted" ? <CheckCircle2 size={13} /> : locPerm === "denied" ? <AlertCircle size={13} /> : <Locate size={13} />}
                  {locPerm === "granted" ? "Location Active" : locPerm === "denied" ? "Location Denied" : locPerm === "requesting" ? "Requesting…" : "Location Off"}
                </div>
                {locPerm === "idle" && <div className="cm-loc-body">Enable location to get walking directions to any pin on the map.</div>}
                {locPerm === "denied" && <div className="cm-loc-body">Please allow location access in your browser settings and try again.</div>}
                {locPerm === "granted" && userPos && (
                  <>
                    <div className="cm-loc-acc">📍 {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</div>
                    <div className="cm-loc-acc">Accuracy: ±{Math.round(userPos.accuracy)} m</div>
                  </>
                )}
                {locPerm !== "granted" && locPerm !== "requesting" && (
                  <button className="cm-btn accent" style={{justifyContent:"center"}} onClick={requestLocation}><Locate size={12} /> Enable Location</button>
                )}
              </div>

              {/* Active nav summary */}
              {navActive && navTarget && route && (
                <div style={{background:"rgba(64,224,160,0.07)",border:"1px solid rgba(64,224,160,0.25)",borderRadius:12,padding:12,display:"flex",flexDirection:"column",gap:7}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#40e0a0",display:"flex",alignItems:"center",gap:6}}>
                    <Navigation size={12}/> Navigating To
                  </div>
                  <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{navTarget.label}</div>
                  <div style={{display:"flex",gap:12}}>
                    <div style={{fontSize:12,color:"#4a6080"}}>Distance <span style={{color:"#40e0a0",fontWeight:600}}>{fmtDist(route.distance)}</span></div>
                    <div style={{fontSize:12,color:"#4a6080"}}>ETA <span style={{color:"#40e0a0",fontWeight:600}}>{fmtTime(route.duration)}</span></div>
                  </div>
                  <button className="cm-btn danger" style={{justifyContent:"center",padding:"7px"}} onClick={stopNav}><RouteOff size={12}/> Stop Navigation</button>
                </div>
              )}

              {/* Add pin form */}
              {isAdmin && pendingPin && (
                <div className="cm-pin-form">
                  <div className="cm-pin-form-title"><MapPinned size={13} /> New Pin</div>
                  <div className="cm-pin-coords">{pendingPin.lat.toFixed(6)}, {pendingPin.lng.toFixed(6)}</div>
                  <input className="cm-pin-input" placeholder="Pin label (e.g. Main Gate)…" value={pinLabel} onChange={e => setPinLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmPin()} autoFocus />
                  <div className="cm-pin-form-btns">
                    <button className="cm-confirm-btn" onClick={confirmPin} disabled={!pinLabel.trim()}><Save size={13} /> Save Pin</button>
                    <button className="cm-cancel-btn" onClick={cancelPin}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Markers list */}
              <div className="cm-section">
                <div className="cm-section-title">Pinned Locations</div>
                {markers.map(m => (
                  <div key={m.id} className={`cm-marker-item ${navTarget?.id === m.id ? "navigating" : selectedMarker?.id === m.id ? "active" : ""}`}
                    onClick={() => { setSelectedMarker(m); flyTo(m.lat, m.lng); }}>
                    <div className={`cm-marker-dot ${navTarget?.id === m.id ? "nav" : ""}`} />
                    <div className="cm-marker-info">
                      <div className="cm-marker-name">{m.label}</div>
                      <div className="cm-marker-coords">{m.lat.toFixed(5)}, {m.lng.toFixed(5)}</div>
                    </div>
                    <div className="cm-marker-actions">
                      <button className="cm-marker-nav" onClick={e => { e.stopPropagation(); navigateTo(m); }} title="Navigate here">
                        <Navigation size={11} /> Go
                      </button>
                      {isAdmin && (
                        <button className="cm-marker-del" onClick={e => { e.stopPropagation(); deleteMarker(m.id); }}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:11,color:"#3d5070",lineHeight:1.6,paddingTop:4}}>
                {isAdmin
                  ? 'Click "Add Pin", then tap the map to place a marker. Drag existing pins to reposition.'
                  : 'Tap any pin or click "Go" to get walking directions from your location.'}
              </div>
            </div>
          </aside>

          {/* MAP */}
          <div className="cm-map-wrap">
            <div ref={mapRef} className="cm-map" />

            {/* Campus badge */}
            <div className="cm-campus-badge"><School size={13} /> Gordon College</div>

            {/* Add mode HUD */}
            {addMode && !pendingPin && <div className="cm-add-hud">📍 Click anywhere on the map to place a pin</div>}

            {/* Active nav chip */}
            {navActive && navTarget && !routeLoading && route && (
              <div className="cm-nav-chip">
                <div className="cm-nav-chip-dot" />
                <div>
                  <div className="cm-nav-chip-label">→ {navTarget.label}</div>
                  <div className="cm-nav-chip-dist">{fmtDist(route.distance)} · {fmtTime(route.duration)}</div>
                </div>
                <button className="cm-nav-chip-stop" onClick={stopNav}>✕</button>
              </div>
            )}
            {routeLoading && (
              <div className="cm-add-hud" style={{borderColor:"rgba(64,224,160,0.4)",background:"rgba(64,224,160,0.1)",color:"#40e0a0"}}>
                <div className="cm-spinner" /> Calculating route…
              </div>
            )}
            {routeError && (
              <div className="cm-add-hud" style={{borderColor:"rgba(255,60,60,0.4)",background:"rgba(255,60,60,0.1)",color:"#ff7070",pointerEvents:"auto"}}>
                <AlertCircle size={14} /> {routeError}
                <button style={{background:"none",border:"none",color:"#ff7070",cursor:"pointer",marginLeft:4}} onClick={() => setRouteError("")}>✕</button>
              </div>
            )}

            {/* Zoom */}
            <div className="cm-zoom">
              <button className="cm-zoom-btn" onClick={() => leafletMap.current?.zoomIn()}>+</button>
              <button className="cm-zoom-btn" onClick={() => leafletMap.current?.zoomOut()}>−</button>
            </div>

            {/* Selected marker detail card */}
            {selectedMarker && !navActive && (
              <div className="cm-detail-card">
                <div className="cm-detail-header">
                  <div className="cm-detail-name">{selectedMarker.label}</div>
                  <button className="cm-detail-close" onClick={() => setSelectedMarker(null)}><X size={14} /></button>
                </div>
                <div className="cm-detail-coords">{selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}</div>
                <div className="cm-detail-actions">
                  <button className="cm-nav-btn" onClick={() => navigateTo(selectedMarker)}>
                    <Navigation size={14} /> Navigate Here
                  </button>
                  <button className="cm-fly-btn" onClick={() => flyTo(selectedMarker.lat, selectedMarker.lng)}>
                    <MapPinned size={13} /> Fly To
                  </button>
                  {isAdmin && (
                    <button className="cm-btn danger" style={{padding:"10px 12px"}} onClick={() => deleteMarker(selectedMarker.id)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TURN-BY-TURN PANEL */}
            <div className={`cm-nav-panel ${navActive && route ? "open" : ""}`}>
              <div className="cm-nav-panel-header">
                <div>
                  <div className="cm-nav-panel-title">
                    <Navigation size={16} color="#40e0a0" /> Directions to {navTarget?.label}
                  </div>
                  {route && (
                    <div className="cm-nav-panel-meta">
                      <div className="cm-nav-meta-chip"><Milestone size={11} /><span>{fmtDist(route.distance)}</span></div>
                      <div className="cm-nav-meta-chip"><Clock size={11} /><span>{fmtTime(route.duration)}</span></div>
                      {distToTarget != null && <div className="cm-nav-meta-chip">📍 <span>{fmtDist(distToTarget)} away</span></div>}
                    </div>
                  )}
                </div>
                <button className="cm-btn danger" style={{padding:"7px 12px"}} onClick={stopNav}><RouteOff size={13} /> End</button>
              </div>
              <div className="cm-nav-panel-body">
                {route?.steps.map((step, i) => (
                  <div key={i} className={`cm-step ${i === currentStep ? "current" : i < currentStep ? "done" : ""}`}>
                    <div className="cm-step-num">
                      {i < currentStep ? "✓" : i + 1}
                    </div>
                    <div className="cm-step-info">
                      <div className="cm-step-text">{step.instruction}</div>
                      {step.distance > 0 && <div className="cm-step-dist">{fmtDist(step.distance)}</div>}
                    </div>
                    {i === currentStep && <ChevronRight size={16} color="#40e0a0" style={{flexShrink:0,marginTop:2}} />}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}