import React from 'react';
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  MapPinned, Search, Building2, Layers3, School,
  Info, Map, LogOut, ChevronRight, X, Clock,
  Users, Tag, Edit3, Save, Plus, Trash2, Move, List,
  Megaphone, BarChart2, ToggleLeft, ToggleRight,
  EyeOff, Eye, ImagePlus, Images, Menu,
  RefreshCw, ArrowLeft, ArrowRight, Repeat2, RotateCcw,
  MapPin, Glasses,
} from "lucide-react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "./App.css";

import floor1 from "./assets/floor1.jpg";
import floor2 from "./assets/floor2.jpg";
import floor3 from "./assets/floor3.jpg";
import floor4 from "./assets/floor4.jpg";
import floor5 from "./assets/floor5.jpg";
import floor6 from "./assets/floor6.jpg";
import announceBg from "./assets/announce.jpg";
import clickSound from "./assets/click.mp4";

// Floor 6 Street View images
import sv6Front1 from "./assets/floor6-sv/front1.jpg";
import sv6Back1  from "./assets/floor6-sv/back1.jpg";
import sv6Front2 from "./assets/floor6-sv/front2.jpg";
import sv6Back2  from "./assets/floor6-sv/back2.jpg";
import sv6Front3 from "./assets/floor6-sv/front3.jpg";
import sv6Back3  from "./assets/floor6-sv/back3.jpg";
import sv6Front4 from "./assets/floor6-sv/front4.jpg";
import sv6Back4  from "./assets/floor6-sv/back4.jpg";
import sv6Front5 from "./assets/floor6-sv/front5.jpg";
import sv6Back5  from "./assets/floor6-sv/back5.jpg";
import sv6Front6 from "./assets/floor6-sv/front6.jpg";
import sv6Back6  from "./assets/floor6-sv/back6.jpg";

// Floor 1 Street View — left view (position 4 only)
import sv1Left4 from "./assets/floor1-sv/left4.png";
import sv1Left5 from "./assets/floor1-sv/left5.png";
import sv1Right5 from "./assets/floor1-sv/right5.png";

// Floor 1 Street View images
import sv1Front1 from "./assets/floor1-sv/front1.png";
import sv1Back1  from "./assets/floor1-sv/back1.png";
import sv1Front2 from "./assets/floor1-sv/front2.png";
import sv1Back2  from "./assets/floor1-sv/back2.png";
import sv1Front3 from "./assets/floor1-sv/front3.png";
import sv1Back3  from "./assets/floor1-sv/back3.png";
import sv1Front4 from "./assets/floor1-sv/front4.png";
import sv1Back4  from "./assets/floor1-sv/back4.png";
import sv1Front5 from "./assets/floor1-sv/front5.png";
import sv1Back5  from "./assets/floor1-sv/back5.png";
import sv1Front6 from "./assets/floor1-sv/front6.png";
import sv1Back6  from "./assets/floor1-sv/back6.png";

/* =========================
   ROOM DETAIL DATA
========================= */
const roomDetails = {
  "Clinic":         { dept: "Health Services",     capacity: 10,  hours: "Mon–Fri 7AM–5PM",   desc: "Provides basic medical assistance and first aid to students and staff." },
  "Bookstore":      { dept: "Student Affairs",      capacity: 30,  hours: "Mon–Fri 8AM–4PM",   desc: "Sells textbooks, school supplies, and Gordon College merchandise." },
  "Registrar":      { dept: "Academic Affairs",     capacity: 15,  hours: "Mon–Fri 8AM–5PM",   desc: "Handles enrollment, grades, and official academic records." },
  "Canteen":        { dept: "Food Services",         capacity: 120, hours: "Mon–Sat 6AM–6PM",   desc: "Main student dining area with a variety of food stalls and vendors." },
  "Guidance":       { dept: "Student Services",      capacity: 8,   hours: "Mon–Fri 8AM–5PM",   desc: "Counseling and student support services." },
  "Classroom":      { dept: "Academic",              capacity: 40,  hours: "By Schedule",        desc: "Standard lecture classroom with projector and whiteboard." },
  "Lobby":          { dept: "Facilities",            capacity: 50,  hours: "Open 24/7",          desc: "Main building lobby and reception area." },
  "Corridor":       { dept: "Facilities",            capacity: null,hours: "Open 24/7",          desc: "Main hallway connecting rooms on this floor." },
  "Faculty Office": { dept: "Academic Affairs",     capacity: 20,  hours: "Mon–Fri 8AM–5PM",   desc: "Faculty workroom and consultation area." },
  "Research Office":{ dept: "Research & Dev",        capacity: 12,  hours: "Mon–Fri 8AM–5PM",   desc: "Office for research faculty and graduate students." },
  "AVR Room":       { dept: "Audio-Visual",          capacity: 60,  hours: "By Reservation",    desc: "Audio-visual room equipped for presentations and screenings." },
  "Library":        { dept: "Library Services",      capacity: 80,  hours: "Mon–Sat 7AM–6PM",   desc: "Main campus library with print and digital resources." },
  "Supply Office":  { dept: "Administration",        capacity: 5,   hours: "Mon–Fri 8AM–4PM",   desc: "Distributes office and classroom supplies to departments." },
  "Computer Lab":   { dept: "IT Department",         capacity: 40,  hours: "Mon–Fri 7AM–7PM",   desc: "Computer laboratory with internet access for students." },
  "VR Room":        { dept: "IT Department",         capacity: 10,  hours: "By Reservation",    desc: "Virtual reality lab for immersive learning experiences." },
  "Network Lab":    { dept: "IT Department",         capacity: 25,  hours: "Mon–Fri 8AM–5PM",   desc: "Networking lab for IT and computer science students." },
  "Research Room":  { dept: "Research & Dev",        capacity: 20,  hours: "By Reservation",    desc: "Dedicated space for research projects and collaborative work." },
  "Lecture Hall":   { dept: "Academic",              capacity: 150, hours: "By Schedule",        desc: "Large lecture hall for big classes, seminars, and events." },
  "Kitchen Lab":    { dept: "HRM Department",        capacity: 30,  hours: "By Schedule",        desc: "Fully-equipped culinary laboratory for HRM students." },
};

/* =========================
   DEFAULT FLOOR DATA
========================= */
const defaultFloors = [
  { id: 1, name: "1st Floor", image: floor1, extraImages: [], locations: ["Clinic","Bookstore","Registrar","Canteen","Guidance"],
    pins: [{ name:"Clinic",x:0.6,y:0.4 },{ name:"Bookstore",x:0.3,y:0.25 },{ name:"Registrar",x:0.85,y:0.35 },{ name:"Canteen",x:0.75,y:0.55 }] },
  { id: 2, name: "2nd Floor", image: floor2, extraImages: [], locations: ["Classroom","Lobby","Corridor"],
    pins: [{ name:"Classroom",x:0.2,y:0.3 },{ name:"Lobby",x:0.5,y:0.4 }] },
  { id: 3, name: "3rd Floor", image: floor3, extraImages: [], locations: ["Faculty Office","Research Office","AVR Room"],
    pins: [{ name:"Faculty Office",x:0.2,y:0.25 },{ name:"AVR Room",x:0.8,y:0.3 }] },
  { id: 4, name: "4th Floor", image: floor4, extraImages: [], locations: ["Library","Clinic","Supply Office"],
    pins: [{ name:"Library",x:0.5,y:0.4 },{ name:"Clinic",x:0.3,y:0.5 }] },
  { id: 5, name: "5th Floor", image: floor5, extraImages: [], locations: ["Computer Lab","VR Room","Network Lab"],
    pins: [{ name:"Computer Lab",x:0.2,y:0.3 },{ name:"VR Room",x:0.6,y:0.35 }] },
  { id: 6, name: "6th Floor", image: floor6, extraImages: [], locations: ["Research Room","Lecture Hall","Kitchen Lab"],
    pins: [{ name:"Research Room",x:0.3,y:0.25 },{ name:"Lecture Hall",x:0.6,y:0.5 }] },
];

/* Seeded analytics */
const seedAnalytics = {
  "Registrar":312,"Library":289,"Canteen":274,"Computer Lab":198,
  "Guidance":165,"Clinic":143,"Bookstore":121,"AVR Room":98,
  "Faculty Office":87,"Lecture Hall":76,"Classroom":71,"VR Room":54,
  "Network Lab":49,"Kitchen Lab":44,"Research Room":38,
  "Research Office":31,"Supply Office":27,"Lobby":22,"Corridor":14,
};

/* ── Stock-chart animation helper ── */
function generateSparkPath(width, height, points, seed) {
  const pts = [];
  let v = seed % 40 + 30;
  for (let i = 0; i < points; i++) {
    v += (Math.sin(i * 0.7 + seed) * 8) + (Math.random() * 10 - 5);
    v = Math.max(5, Math.min(height - 5, v));
    pts.push([Math.round((i / (points - 1)) * width), Math.round(v)]);
  }
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fill = `${d} L${width},${height} L0,${height} Z`;
  return { line: d, fill };
}

const normalize = (t) => t.toLowerCase().trim();

/* ── Animated sparkline component ── */
function Sparkline({ value, max, index, name }) {
  const [paths, setPaths] = useState(() => generateSparkPath(120, 32, 18, index * 7));
  const [trend, setTrend] = useState(Math.random() > 0.5 ? "up" : "down");
  const [liveVal, setLiveVal] = useState(Math.max(15, Math.min(50, value)));
  const frameRef = useRef(null);

  useEffect(() => {
    let tick = 0;
    const animate = () => {
      tick++;
      if (tick % 120 === 0) {
        setPaths(generateSparkPath(120, 32, 18, index * 7 + tick));
        const delta = Math.floor(Math.random() * 5) - 2;
        setLiveVal(v => Math.max(15, Math.min(50, v + delta)));
        setTrend(Math.random() > 0.45 ? "up" : "down");
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [index]);

  const color = trend === "up" ? "#40e0a0" : "#ff6b6b";
  const pct = Math.round((liveVal / max) * 100);

  return (
    <div className="pf-spark-row">
      <div className="pf-spark-meta">
        <span className="pf-spark-rank">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}</span>
        <span className="pf-spark-name">{name}</span>
        <span className="pf-spark-trend" style={{ color }}>{trend === "up" ? "▲" : "▼"}</span>
        <span className="pf-spark-val" style={{ color }}>{liveVal.toLocaleString()}</span>
      </div>
      <div className="pf-spark-chart">
        <svg width="120" height="32" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={`sg${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={paths.fill} fill={`url(#sg${index})`} />
          <path d={paths.line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="pf-spark-bar-bg">
          <div className="pf-spark-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        </div>
      </div>
    </div>
  );
}

export default function App({ userRole = "student", username = "User", onLogout, onOpenMap, onOpenForum }) {
  const [floors, setFloors] = useState(defaultFloors);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle

  // Pin editor (admin)
  const [editMode, setEditMode] = useState(false);
  const [draggingPin, setDraggingPin] = useState(null);
  const [newPinName, setNewPinName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Panels
  const [showPinsPanel, setShowPinsPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Floor map visibility (admin can disable per floor)
  const [hiddenFloors, setHiddenFloors] = useState({}); // { floorId: true }

  // Extra images per floor (admin only) — stored as data URLs for now
  const [showImagesPanel, setShowImagesPanel] = useState(false);
  const extraImageInputRef = useRef(null);

  // Room statuses
  const [roomStatuses, setRoomStatuses] = useState({});

  // Room details editable by admin
  const [roomDetailsState, setRoomDetailsState] = useState(roomDetails);
  const [editingRoomInfo, setEditingRoomInfo] = useState(false);
  const [roomDetailDraft, setRoomDetailDraft] = useState({ dept: "", capacity: "", hours: "", desc: "" });

  // Announcement
  const [announcement, setAnnouncement] = useState("Welcome to Gordon College! Check the map for room locations and availability.");
  const [editingAnnounce, setEditingAnnounce] = useState(false);
  const [announceDraft, setAnnounceDraft] = useState("");
  const [showAnnounce, setShowAnnounce] = useState(true);

  // Analytics
  const [searchCounts, setSearchCounts] = useState(seedAnalytics);

  // Map viewer image index (for extra images)
  const [mapImageIndex, setMapImageIndex] = useState(0);

  // Street View (Floor 6 beta)
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewPos, setStreetViewPos] = useState(0);
  const [streetViewDir, setStreetViewDir] = useState("front");
  const [svCrossfading, setSvCrossfading] = useState(false);
  const [svPrevSrc, setSvPrevSrc] = useState(null);
  // SV pins: keyed by "pos-dir" e.g. "0-front"
  const [svPins, setSvPins] = useState({});
  const [svEditMode, setSvEditMode] = useState(false);
  const [svDraggingPin, setSvDraggingPin] = useState(null);
  const [svNewPinName, setSvNewPinName] = useState("");
  const [svSaving, setSvSaving] = useState(false);
  const [svSaveMsg, setSvSaveMsg] = useState("");
  const [svSelectedDot, setSvSelectedDot] = useState(null); // { key, index }
  const [svEditingDot, setSvEditingDot] = useState(false); // admin editing mode for info panel
  const svImageRef = useRef(null);
  const svWrapRef = useRef(null);
  const [svZoom, setSvZoom] = useState(1.4);
  const [svPan, setSvPan] = useState({ x: 0, y: 0 });
  const [svIsDragging, setSvIsDragging] = useState(false);
  const [svDragStart, setSvDragStart] = useState({ x: 0, y: 0 });
  const [svPanStart, setSvPanStart] = useState({ x: 0, y: 0 });
  const svLastTouchDist = useRef(null);
  const svDragDeltaX = useRef(0);
  const svDirRef = useRef("front");
  const svCurrentSrcRef = useRef(null);
  const SV_MIN_ZOOM = 1.0;
  const SV_MAX_ZOOM = 4.0;

  // Street View — left/right sidebar + voice assistant
  const [svSidebarOpen, setSvSidebarOpen] = useState(true);
  const [svVoiceActive, setSvVoiceActive] = useState(false);
  const svSpeakRef = useRef(null);

  // Street View — walk animation direction & pending pin placement
  const [svWalkDir, setSvWalkDir] = useState(null); // "forward" | "backward" | null
  const [svPendingPin, setSvPendingPin] = useState(null); // { x, y } awaiting name
  const [svPendingName, setSvPendingName] = useState("");

  const floor6StreetView = [
    { front: sv6Front1, back: sv6Back1, label: "Position 1" },
    { front: sv6Front2, back: sv6Back2, label: "Position 2" },
    { front: sv6Front3, back: sv6Back3, label: "Position 3" },
    { front: sv6Front4, back: sv6Back4, label: "Position 4" },
    { front: sv6Front5, back: sv6Back5, label: "Position 5" },
    { front: sv6Front6, back: sv6Back6, label: "Position 6" },
  ];

  const floor1StreetView = [
    { front: sv1Front1, back: sv1Back1, label: "Main Entrance" },
    { front: sv1Front2, back: sv1Back2, label: "Lobby" },
    { front: sv1Front3, back: sv1Back3, label: "Corridor A" },
    { front: sv1Front4, back: sv1Back4, label: "Corridor B", left: sv1Left4 },
    { front: sv1Front5, back: sv1Back5, label: "Near Canteen", left: sv1Left5, right: sv1Right5 },
    { front: sv1Front6, back: sv1Back6, label: "Exit Wing" },
  ];

  // Light/dark mode
  const [lightMode, setLightMode] = useState(false);

  // Profile editor
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ displayName: username || "", role: userRole, gender: "Male", contact: "", bio: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState("");

  // Current time for clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Collapsible sidebar trays
  const [openTrays, setOpenTrays] = useState({ search: true, floors: true, locations: true, pinEditor: true });
  const toggleTray = (key) => setOpenTrays(prev => ({ ...prev, [key]: !prev[key] }));

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [pinnedTab, setPinnedTab] = useState("current");
  const [pinnedCollapsed, setPinnedCollapsed] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [simpleUIMode, setSimpleUIMode] = useState(false);
  const clickAudioRef = useRef(null);

  // Map image loading
  const [mapImageLoaded, setMapImageLoaded] = useState(false);

  // Map pan/zoom
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mapDragging, setMapDragging] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const lastTouchPos = useRef(null);
  const mapViewportRef = useRef(null);
  const mapImageRef = useRef(null);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSound);
    clickAudioRef.current.preload = "auto";
    clickAudioRef.current.volume = 0.18;
  }, []);

  useEffect(() => {
    if (!clickAudioRef.current) return;
    clickAudioRef.current.muted = !soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!soundEnabled) return;
      const button = event.target.closest("button");
      if (!button) return;
      if (!clickAudioRef.current) return;
      clickAudioRef.current.currentTime = 0;
      void clickAudioRef.current.play().catch(() => {});
    };
    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, [soundEnabled]);

  useEffect(() => {
    document.body.style.background = lightMode ? "#f5f0e8" : "#080c14";
    document.body.style.color = lightMode ? "#2d3a28" : "#e2e8f0";
  }, [lightMode]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      try {
        const snap = await getDoc(doc(db, "userProfiles", username));
        if (snap.exists()) {
          const data = snap.data();
          setProfileDraft({
            displayName: data.displayName || username,
            role: data.role || userRole,
            gender: data.gender || "Male",
            contact: data.contact || "",
            bio: data.bio || "",
          });
        } else {
          setProfileDraft({ displayName: username, role: userRole, contact: "", bio: "" });
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    loadProfile();
  }, [username, userRole]);

  // Load all Firestore data
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "campusMap", "pins"));
        if (snap.exists()) {
          const data = snap.data();
          setFloors(prev => prev.map(f => ({
            ...f,
            pins: data[`floor_${f.id}`] || f.pins,
            locations: data[`floor_${f.id}`]
              ? [...new Set([...f.locations, ...data[`floor_${f.id}`].map(p => p.name)])]
              : f.locations,
          })));
        }
      } catch (e) { console.error(e); }
      try {
        const snap = await getDoc(doc(db, "campusMap", "statuses"));
        if (snap.exists()) setRoomStatuses(snap.data());
      } catch (e) { console.error(e); }
      try {
        const snap = await getDoc(doc(db, "campusMap", "announcement"));
        if (snap.exists() && snap.data().text) setAnnouncement(snap.data().text);
      } catch (e) { console.error(e); }
      try {
        const snap = await getDoc(doc(db, "campusMap", "analytics"));
        if (snap.exists()) setSearchCounts(prev => ({ ...prev, ...snap.data() }));
      } catch (e) { console.error(e); }
      try {
        const snap = await getDoc(doc(db, "campusMap", "hiddenFloors"));
        if (snap.exists()) setHiddenFloors(snap.data() || {});
      } catch (e) { console.error(e); }
      try {
        const snap = await getDoc(doc(db, "campusMap", "svPins"));
        if (snap.exists()) setSvPins(snap.data() || {});
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const currentFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloor) || floors[0],
    [selectedFloor, floors]
  );

  const isMapHidden = hiddenFloors[selectedFloor] === true;

  // All images for current floor (main + extras)
  const allFloorImages = useMemo(() => {
    return [currentFloor.image, ...(currentFloor.extraImages || [])];
  }, [currentFloor]);

  const getStatus = (name) => roomStatuses[name] || "Open";

  /* SEARCH */
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return currentFloor.locations;
    const q = normalize(searchTerm);
    return currentFloor.locations.filter(loc => normalize(loc).includes(q));
  }, [searchTerm, currentFloor]);

  const matchingFloors = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = normalize(searchTerm);
    return floors.map(f => ({ ...f, matches: f.locations.filter(l => normalize(l).includes(q)) })).filter(f => f.matches.length > 0);
  }, [searchTerm, floors]);

  const saveProfile = async () => {
    if (!username) return;
    setProfileSaving(true);
    setProfileSavedMsg("");
    try {
      const payload = {
        username,
        displayName: profileDraft.displayName || username,
        role: userRole,
        gender: profileDraft.gender || "Male",
        contact: profileDraft.contact || "",
        bio: profileDraft.bio || "",
      };
      await setDoc(doc(db, "userProfiles", username), payload);
      setProfileSavedMsg("Profile saved.");
    } catch (e) {
      console.error("Failed to save profile:", e);
      setProfileSavedMsg("Unable to save profile.");
    }
    setProfileSaving(false);
  };

  /* ANALYTICS TRACK */
  const trackRoom = useCallback(async (name) => {
    setSearchCounts(prev => {
      const updated = { ...prev, [name]: (prev[name] || 0) + 1 };
      setDoc(doc(db, "campusMap", "analytics"), updated).catch(() => {});
      return updated;
    });
  }, []);

  /* MAP — MOUSE */
  const centerView = useCallback(() => { setPosition({ x: 0, y: 0 }); setScale(1); setMapImageIndex(0); }, []);
  const handleMapMouseDown = (e) => { if (editMode) return; setMapDragging(true); setScrollEnabled(true); lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const handleMapMouseMove = (e) => { if (!mapDragging) return; const dx = e.clientX - lastMouse.current.x; const dy = e.clientY - lastMouse.current.y; setPosition(p => ({ x: p.x + dx, y: p.y + dy })); lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const handleMapMouseUp = () => setMapDragging(false);
  const handleWheel = (e) => { if (!scrollEnabled) return; e.preventDefault(); setScale(p => Math.min(3, Math.max(0.5, p - e.deltaY * 0.0025))); };

  /* MAP — TOUCH */
  const handleTouchStart = (e) => {
    if (editMode) return;
    if (e.touches.length === 1) {
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTouchDist.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
      lastTouchPos.current = null;
    }
  };
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (editMode) return;
    if (e.touches.length === 1 && lastTouchPos.current) {
      const dx = e.touches[0].clientX - lastTouchPos.current.x;
      const dy = e.touches[0].clientY - lastTouchPos.current.y;
      setPosition(p => ({ x: p.x + dx, y: p.y + dy }));
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setScale(p => Math.min(3, Math.max(0.5, p + (dist - lastTouchDist.current) * 0.008)));
      lastTouchDist.current = dist;
    }
  };
  const handleTouchEnd = () => { lastTouchPos.current = null; lastTouchDist.current = null; };

  const goToFloor = (id) => {
    setSelectedFloor(id);
    setMapImageLoaded(false);
    centerView();
    setSearchTerm("");
    setSelectedLocation(null);
    setDetailRoom(null);
    setSidebarOpen(false);
  };

  /* ROOM DETAIL */
  const openDetail = (name) => {
    setSelectedLocation(name);
    setDetailRoom(name);
    setEditingRoomInfo(false);
    const info = roomDetailsState[name] || { dept: "Unknown", capacity: "", hours: "", desc: "No description available." };
    setRoomDetailDraft({
      dept: info.dept || "",
      capacity: info.capacity != null ? String(info.capacity) : "",
      hours: info.hours || "",
      desc: info.desc || "",
    });
    trackRoom(name);
  };
  const closeDetail = () => { setDetailRoom(null); setEditingRoomInfo(false); };

  /* STATUS TOGGLE (admin) */
  const toggleStatus = async (name) => {
    const next = getStatus(name) === "Open" ? "Closed" : "Open";
    const updated = { ...roomStatuses, [name]: next };
    setRoomStatuses(updated);
    try { await setDoc(doc(db, "campusMap", "statuses"), updated); } catch (e) { console.error(e); }
  };

  const saveRoomDetails = async (name) => {
    const updatedInfo = {
      dept: roomDetailDraft.dept || "Unknown",
      capacity: roomDetailDraft.capacity ? Number(roomDetailDraft.capacity) : null,
      hours: roomDetailDraft.hours || "—",
      desc: roomDetailDraft.desc || "No description available.",
    };
    const updated = { ...roomDetailsState, [name]: updatedInfo };
    setRoomDetailsState(updated);
    setEditingRoomInfo(false);
    try { await setDoc(doc(db, "campusMap", "roomDetails"), updated); } catch (e) { console.error(e); }
  };

  /* FLOOR VISIBILITY TOGGLE (admin) */
  const toggleFloorVisibility = async (floorId) => {
    const updated = { ...hiddenFloors, [floorId]: !hiddenFloors[floorId] };
    setHiddenFloors(updated);
    try { await setDoc(doc(db, "campusMap", "hiddenFloors"), updated); } catch (e) { console.error(e); }
  };

  /* ANNOUNCEMENT (admin) */
  const saveAnnouncement = async () => {
    setAnnouncement(announceDraft);
    setEditingAnnounce(false);
    try { await setDoc(doc(db, "campusMap", "announcement"), { text: announceDraft }); } catch (e) { console.error(e); }
  };

  /* PIN EDITOR */
  const handlePinDragStart = (e, floorId, pinIdx) => { e.stopPropagation(); setDraggingPin({ floorId, pinIdx }); };
  const handleEditorMouseMove = useCallback((e) => {
    if (!draggingPin || !mapImageRef.current) return;
    const r = mapImageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setFloors(prev => prev.map(f => {
      if (f.id !== draggingPin.floorId) return f;
      const pins = [...f.pins];
      pins[draggingPin.pinIdx] = { ...pins[draggingPin.pinIdx], x, y };
      return { ...f, pins };
    }));
  }, [draggingPin]);
  const handleEditorMouseUp = useCallback(() => setDraggingPin(null), []);

  const addPin = () => {
    if (!newPinName.trim()) return;
    const name = newPinName.trim();
    setFloors(prev => prev.map(f => f.id !== selectedFloor ? f : {
      ...f,
      pins: [...f.pins, { name, x: 0.5, y: 0.5 }],
      locations: f.locations.includes(name) ? f.locations : [...f.locations, name],
    }));
    setNewPinName("");
  };
  const deletePin = (pinIdx) => {
    setFloors(prev => prev.map(f => {
      if (f.id !== selectedFloor) return f;
      const del = f.pins[pinIdx]?.name;
      const pins = f.pins.filter((_, i) => i !== pinIdx);
      return { ...f, pins, locations: f.locations.filter(l => l !== del || pins.some(p => p.name === l)) };
    }));
  };
  const savePins = async () => {
    setSaving(true);
    try {
      const data = {};
      floors.forEach(f => { data[`floor_${f.id}`] = f.pins; });
      await setDoc(doc(db, "campusMap", "pins"), data);
      setSaveMsg("Saved!");
    } catch (e) { setSaveMsg("Save failed."); }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  /* STREET VIEW PINS */
  const svKey = (pos, dir) => `${selectedFloor}-${pos}-${dir}`;
  const currentSvPins = svPins[svKey(streetViewPos, streetViewDir)] || [];

  // Click on image to drop a pending pin
  const svHandleImageClick = useCallback((e) => {
    if (!svEditMode || svIsDragging || svDraggingPin !== null) return;
    if (Math.abs(svDragDeltaX.current) > 5) return;
    if (!svWrapRef.current) return;
    const r = svWrapRef.current.getBoundingClientRect();
    // Reverse pan+zoom transform to get true image-space coords
    const wrapCx = r.width / 2;
    const wrapCy = r.height / 2;
    const clickX = e.clientX - r.left;
    const clickY = e.clientY - r.top;
    const imageX = (clickX - wrapCx - svPan.x) / svZoom + wrapCx;
    const imageY = (clickY - wrapCy - svPan.y) / svZoom + wrapCy;
    const x = Math.min(1, Math.max(0, imageX / r.width));
    const y = Math.min(1, Math.max(0, imageY / r.height));
    setSvPendingPin({ x, y });
    setSvPendingName("");
  }, [svEditMode, svIsDragging, svDraggingPin, svPan, svZoom]);

  // Confirm pending pin with name
  const svConfirmPin = () => {
    if (!svPendingPin || !svPendingName.trim()) return;
    const key = svKey(streetViewPos, streetViewDir);
    setSvPins(prev => ({ ...prev, [key]: [...(prev[key] || []), { name: svPendingName.trim(), x: svPendingPin.x, y: svPendingPin.y, openTime: "", closeTime: "" }] }));
    setSvPendingPin(null);
    setSvPendingName("");
  };

  const svUpdateDotInfo = (key, index, field, value) => {
    setSvPins(prev => {
      const pins = [...(prev[key] || [])];
      pins[index] = { ...pins[index], [field]: value };
      return { ...prev, [key]: pins };
    });
  };

  const svCancelPending = () => { setSvPendingPin(null); setSvPendingName(""); };

  const svDeletePin = (idx) => {
    const key = svKey(streetViewPos, streetViewDir);
    setSvPins(prev => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== idx) }));
  };
  const svHandleMouseDown = (e, idx) => {
    if (!svEditMode) return;
    e.stopPropagation();
    setSvDraggingPin(idx);
  };
  const svHandleMouseMove = useCallback((e) => {
    if (svDraggingPin === null || !svImageRef.current) return;
    const r = svImageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const key = svKey(streetViewPos, streetViewDir);
    setSvPins(prev => {
      const pins = [...(prev[key] || [])];
      pins[svDraggingPin] = { ...pins[svDraggingPin], x, y };
      return { ...prev, [key]: pins };
    });
  }, [svDraggingPin, streetViewPos, streetViewDir]);
  const svHandleMouseUp = useCallback(() => setSvDraggingPin(null), []);
  const svSavePins = async () => {
    setSvSaving(true);
    try {
      await setDoc(doc(db, "campusMap", "svPins"), svPins);
      setSvSaveMsg("Saved!");
    } catch (e) { setSvSaveMsg("Save failed."); }
    setSvSaving(false);
    setTimeout(() => setSvSaveMsg(""), 2500);
  };

  /* STREET VIEW VOICE ASSISTANT */
  const svSpeak = (text) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1.1;
    utt.volume = 0.65;
    // Wait for voices to load (needed in some browsers)
    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer female English voices
      const female = voices.find(v =>
        v.lang.startsWith("en") && /female|zira|samantha|victoria|karen|moira|tessa|fiona|allison|ava|susan|linda/i.test(v.name)
      ) || voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
      if (female) utt.voice = female;
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      assignVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { assignVoice(); window.speechSynthesis.onvoiceschanged = null; };
    }
    setSvVoiceActive(true);
    utt.onend = () => setSvVoiceActive(false);
    utt.onerror = () => setSvVoiceActive(false);
    window.speechSynthesis.speak(utt);
  };

  const svNavigateToPin = (pinKey, pinIndex, svData) => {
    const [, posStr, dir] = pinKey.split("-");
    const targetPos = parseInt(posStr);
    const targetDir = dir;
    const pin = (svPins[pinKey] || [])[pinIndex];
    if (!pin) return;

    const steps = targetPos - streetViewPos;
    const side = pin.x < 0.5 ? "left" : "right";

    // Build voice line ONLY — do NOT auto-navigate
    let line = "";
    if (steps === 0 && targetDir === streetViewDir) {
      line = `You're already here. The ${pin.name} is on your ${side}.`;
    } else if (steps === 0) {
      const lookDir = targetDir === "back" ? "backward" : targetDir === "left" ? "left" : targetDir === "right" ? "right" : "forward";
      line = `Turn ${lookDir}. The ${pin.name} is on your ${side}.`;
    } else {
      const moveDir = steps > 0 ? "forward" : "backward";
      const count = Math.abs(steps);
      const stepWord = count === 1 ? "step" : "steps";
      const lookDir = targetDir === "back" ? "backward" : targetDir === "left" ? "left" : targetDir === "right" ? "right" : "forward";
      if (targetDir === "front") {
        line = `Go ${moveDir} ${count} ${stepWord}. The ${pin.name} is on your ${side}.`;
      } else {
        line = `Go ${moveDir} ${count} ${stepWord}, then look ${lookDir}. The ${pin.name} is on your ${side}.`;
      }
    }

    svSpeak(line);
  };
  const svClampPan = useCallback((x, y, zoom) => {
    if (!svWrapRef.current) return { x, y };
    const wrap = svWrapRef.current.getBoundingClientRect();
    const maxX = (wrap.width  * (zoom - 1)) / 2;
    const maxY = (wrap.height * (zoom - 1)) / 2;
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }, []);

  const svResetView = useCallback(() => { setSvZoom(1.4); setSvPan({ x: 0, y: 0 }); }, []);

  // Keep ref in sync so drag handlers can read direction without stale closure
  useEffect(() => { svDirRef.current = streetViewDir; }, [streetViewDir]);

  const svOnMouseDown = useCallback((e) => {
    // Always reset drag delta so click guard in svHandleImageClick works correctly
    svDragDeltaX.current = 0;
    if (svEditMode) return;
    e.preventDefault();
    setSvIsDragging(true);
    setSvDragStart({ x: e.clientX, y: e.clientY });
    setSvPan(p => { setSvPanStart(p); return p; });
  }, [svEditMode]);

  const svOnMouseMove = useCallback((e) => {
    if (!svIsDragging || svEditMode) return;
    const dx = e.clientX - svDragStart.x;
    const dy = e.clientY - svDragStart.y;
    svDragDeltaX.current = dx;
    // Allow pan to go slightly past edge horizontally (for drag-to-flip feel)
    const newX = svPanStart.x + dx;
    const newY = svPanStart.y + dy;
    if (!svWrapRef.current) return;
    const wrap = svWrapRef.current.getBoundingClientRect();
    const maxX = (wrap.width * (svZoom - 1)) / 2;
    const maxY = (wrap.height * (svZoom - 1)) / 2;
    // Clamp Y normally, allow X to go 120px past edge for momentum feel
    setSvPan({
      x: Math.min(maxX + 120, Math.max(-maxX - 120, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY)),
    });
  }, [svIsDragging, svEditMode, svDragStart, svPanStart, svZoom]);

  const svFlipWithMomentum = useCallback((deltaX) => {
    const THRESHOLD = window.innerWidth * 0.28;
    if (Math.abs(deltaX) < THRESHOLD) {
      setSvPan(p => svClampPan(p.x, p.y, svZoom));
      return;
    }
    const currentDir = svDirRef.current;
    // Determine available neighbours based on current dir
    // dragging left (negative deltaX) = turn left/back
    // dragging right (positive deltaX) = turn right/front
    let newDir = null;
    if (currentDir === "front") {
      // drag right → look left (natural head turn), drag left → look right
      const svData = selectedFloor === 1 ? floor1StreetView : floor6StreetView;
      const pos = svData[streetViewPos];
      if (deltaX > 0) newDir = pos.left ? "left" : null;
      else newDir = pos.right ? "right" : null;
    } else if (currentDir === "left") {
      // from left view: drag left → back to front
      if (deltaX < 0) newDir = "front";
    } else if (currentDir === "right") {
      // from right view: drag right → back to front
      if (deltaX > 0) newDir = "front";
    } else if (currentDir === "back") {
      newDir = null;
    }

    if (!newDir) {
      setSvPan(p => svClampPan(p.x, p.y, svZoom));
      return;
    }
    const overshoot = (Math.abs(deltaX) - THRESHOLD) * Math.sign(deltaX);
    setSvPrevSrc(svCurrentSrcRef.current);
    setSvCrossfading(true);
    setStreetViewDir(newDir);
    setSvPan(p => ({ x: -overshoot * 0.4, y: p.y }));
    setTimeout(() => setSvCrossfading(false), 420);
  }, [svZoom, svClampPan, streetViewPos, selectedFloor]);

  const svOnMouseUp = useCallback(() => {
    if (svIsDragging) {
      svFlipWithMomentum(svDragDeltaX.current);
    }
    setSvIsDragging(false);
  }, [svIsDragging, svFlipWithMomentum]);

  const svOnWheel = useCallback((e) => {
    e.preventDefault();
    setSvZoom(prev => {
      const next = Math.min(SV_MAX_ZOOM, Math.max(SV_MIN_ZOOM, prev - e.deltaY * 0.001));
      setSvPan(p => svClampPan(p.x, p.y, next));
      return next;
    });
  }, [svClampPan]);

  const svOnTouchStart = useCallback((e) => {
    svDragDeltaX.current = 0;
    if (svEditMode) return;
    if (e.touches.length === 1) {
      setSvIsDragging(true);
      setSvDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setSvPan(p => { setSvPanStart(p); return p; });
    } else if (e.touches.length === 2) {
      svLastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, [svEditMode]);

  const svOnTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && svIsDragging && !svEditMode) {
      const dx = e.touches[0].clientX - svDragStart.x;
      const dy = e.touches[0].clientY - svDragStart.y;
      svDragDeltaX.current = dx;
      if (!svWrapRef.current) return;
      const wrap = svWrapRef.current.getBoundingClientRect();
      const maxX = (wrap.width * (svZoom - 1)) / 2;
      const maxY = (wrap.height * (svZoom - 1)) / 2;
      setSvPan({
        x: Math.min(maxX + 120, Math.max(-maxX - 120, svPanStart.x + dx)),
        y: Math.min(maxY, Math.max(-maxY, svPanStart.y + dy)),
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (svLastTouchDist.current) {
        const delta = dist - svLastTouchDist.current;
        setSvZoom(prev => {
          const next = Math.min(SV_MAX_ZOOM, Math.max(SV_MIN_ZOOM, prev + delta * 0.005));
          setSvPan(p => svClampPan(p.x, p.y, next));
          return next;
        });
      }
      svLastTouchDist.current = dist;
    }
  }, [svIsDragging, svEditMode, svDragStart, svPanStart, svZoom, svClampPan]);

  const svOnTouchEnd = useCallback(() => {
    if (svIsDragging) {
      svFlipWithMomentum(svDragDeltaX.current);
    }
    setSvIsDragging(false);
    svLastTouchDist.current = null;
  }, [svIsDragging, svFlipWithMomentum]);

  // Must come AFTER svOnWheel is defined above
  useEffect(() => {
    const el = svWrapRef.current;
    if (!el || !streetViewOpen) return;
    el.addEventListener("wheel", svOnWheel, { passive: false });
    return () => el.removeEventListener("wheel", svOnWheel);
  }, [streetViewOpen, svOnWheel]);

  /* EXTRA IMAGES (admin) */
  const handleExtraImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFloors(prev => prev.map(f => f.id !== selectedFloor ? f : {
          ...f,
          extraImages: [...(f.extraImages || []), ev.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const removeExtraImage = (imgIdx) => {
    setFloors(prev => prev.map(f => f.id !== selectedFloor ? f : {
      ...f,
      extraImages: (f.extraImages || []).filter((_, i) => i !== imgIdx),
    }));
    setMapImageIndex(0);
  };

  const isAdmin = userRole === "admin";
  const allPinsGrouped = useMemo(() => floors.map(f => ({ floorName: f.name, floorId: f.id, pins: f.pins })), [floors]);
  const analyticsRanked = useMemo(() => Object.entries(searchCounts).sort((a, b) => b[1] - a[1]).slice(0, 10), [searchCounts]);
  const analyticsMax = analyticsRanked[0]?.[1] || 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; font-family: 'DM Sans', sans-serif; color: #e2e8f0; overflow: hidden; }

        /* ── LAYOUT ── */
        .pf-app { display: grid; grid-template-columns: 300px 1fr; height: 100vh; overflow: hidden; position: relative; }
        .pf-app::before { content:''; position:fixed; inset:0; background-image: linear-gradient(rgba(30,120,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(30,120,255,0.05) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; z-index:0; }

        /* ── SIMPLE UI MODE ── */
        .pf-app.simple-ui::before { background-image: none; background: #0a1a2e; }
        .pf-app.simple-ui::after { content:''; position:fixed; inset:0; background: none; }
        .pf-app.simple-ui { --bg-primary: #152941; }
        .pf-app.simple-ui .pf-sidebar { background: #182f47; border-right-color: rgba(30,120,255,0.08); }
        .pf-app.simple-ui .pf-sidebar::after { opacity: 0; }
        .pf-app.simple-ui .pf-topbar { background: #0d2238; backdrop-filter: none; }
        .pf-app.simple-ui .pf-main-grid { grid-template-columns: 1fr; }
        .pf-app.simple-ui .pf-map-panel { width: 100%; }
        .pf-app.simple-ui .pf-map-viewport { backdrop-filter: none; }
        .pf-app.simple-ui .pf-brand-icon { box-shadow: none; }
        .pf-app.simple-ui .pf-modal { backdrop-filter: none; }
        .pf-app.simple-ui .pf-zoom-btn { backdrop-filter: none; }
        .pf-app.simple-ui .pf-floor-chip { backdrop-filter: none; }
        .pf-app.simple-ui .pf-minimap { backdrop-filter: none; }
        .pf-app.simple-ui .pf-img-switcher { backdrop-filter: none; }
        .pf-app.simple-ui .pf-pin-label { backdrop-filter: none; }
        .pf-app.simple-ui [style*="box-shadow"] { box-shadow: none !important; }
        .pf-app.simple-ui [style*="filter"] { filter: none !important; }

        /* ── SIDEBAR ── */
        .pf-sidebar { background:rgba(8,12,20,0.97); border-right:1px solid rgba(30,120,255,0.15); display:flex; flex-direction:column; overflow:hidden; position:relative; z-index:10; }
        .pf-sidebar::after { content:''; position:absolute; top:-100px; left:-100px; width:300px; height:300px; background:radial-gradient(circle,rgba(30,120,255,0.1),transparent 70%); pointer-events:none; }
        .pf-sidebar-inner { display:flex; flex-direction:column; height:100%; overflow-y:auto; padding:20px 16px; gap:12px; scrollbar-width:thin; scrollbar-color:rgba(30,120,255,0.3) transparent; -webkit-overflow-scrolling: touch; }

        .pf-brand { display:flex; align-items:center; gap:12px; padding:8px 4px 16px; border-bottom:1px solid rgba(255,255,255,0.06); opacity:0; transform:translateY(-10px); transition:all 0.5s ease; }
        .pf-brand.show { opacity:1; transform:translateY(0); }
        .pf-brand-icon { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#1e78ff,#0fb8ff); display:grid; place-items:center; flex-shrink:0; box-shadow:0 4px 16px rgba(30,120,255,0.4); }
        .pf-brand-text { display:flex; flex-direction:column; gap:4px; }
        .pf-brand-title-row { display:flex; align-items:center; gap:8px; }
        .pf-brand-text h1, .pf-brand-text p { margin:0; }
        .pf-brand-text h1 { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:0.06em; color:#fff; line-height:1; }
        .pf-brand-text p { font-size:11px; color:#4a6080; }
        .pf-brand-clock { display:flex; align-items:center; gap:6px; font-size:10px; color:#7fb3ff; font-weight:500; }

        .pf-panel { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:14px; opacity:0; transform:translateX(-12px); transition:all 0.5s ease; }
        .pf-panel.show { opacity:1; transform:translateX(0); }
        .pf-panel:nth-child(2){transition-delay:0.1s} .pf-panel:nth-child(3){transition-delay:0.2s} .pf-panel:nth-child(4){transition-delay:0.3s} .pf-panel:nth-child(5){transition-delay:0.4s}
        .pf-panel-title { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#1e78ff; margin-bottom:12px; }

        /* ── SEARCH ── */
        .pf-search-box { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px 12px; transition:border-color 0.2s,box-shadow 0.2s; }
        .pf-search-box:focus-within { border-color:#1e78ff; box-shadow:0 0 0 3px rgba(30,120,255,0.1); }
        .pf-search-box input { border:none; outline:none; background:transparent; color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:14px; width:100%; }
        .pf-search-box input::placeholder { color:#3d5070; }
        .pf-clear-btn { background:none; border:none; color:#4a6080; cursor:pointer; display:flex; align-items:center; transition:color 0.2s; }
        .pf-clear-btn:hover { color:#e2e8f0; }
        .pf-search-results { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
        .pf-result-card { width:100%; text-align:left; border:1px solid rgba(30,120,255,0.2); border-radius:10px; padding:10px 12px; background:rgba(30,120,255,0.07); color:#e2e8f0; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; transition:background 0.2s,border-color 0.2s; display:flex; align-items:center; justify-content:space-between; }
        .pf-result-card:hover { background:rgba(30,120,255,0.15); border-color:rgba(30,120,255,0.4); }
        .pf-result-card strong { display:block; font-size:13px; color:#fff; }
        .pf-result-card span { color:#4a6080; font-size:12px; margin-top:2px; display:block; }

        /* ── FLOORS ── */
        .pf-floor-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .pf-floor-btn-wrap { position:relative; }
        .pf-floor-btn { width:100%; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 8px; cursor:pointer; background:rgba(255,255,255,0.04); color:#8899b0; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; transition:all 0.2s ease; position:relative; }
        .pf-floor-btn:hover { background:rgba(30,120,255,0.1); border-color:rgba(30,120,255,0.3); color:#fff; }
        .pf-floor-btn.active { background:linear-gradient(135deg,rgba(30,120,255,0.3),rgba(15,184,255,0.2)); border-color:#1e78ff; color:#fff; box-shadow:0 2px 12px rgba(30,120,255,0.25); }
        .pf-floor-btn.hidden-floor { opacity:0.45; border-style:dashed; }
        .pf-floor-hidden-badge { position:absolute; top:4px; right:6px; font-size:9px; color:#ff7070; font-weight:700; letter-spacing:0.05em; }
        .pf-floor-toggle-btn { position:absolute; bottom:4px; right:5px; background:none; border:none; cursor:pointer; padding:2px; color:#4a6080; transition:color 0.2s; display:flex; align-items:center; }
        .pf-floor-toggle-btn:hover { color:#fff; }

        /* ── LOCATIONS ── */
        .pf-location-list { display:flex; flex-direction:column; gap:6px; max-height:180px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(30,120,255,0.2) transparent; -webkit-overflow-scrolling: touch; }
        .pf-location-item { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); padding:9px 12px; border-radius:10px; font-size:13px; color:#8899b0; cursor:pointer; transition:all 0.2s ease; justify-content:space-between; }
        .pf-location-item:hover { background:rgba(30,120,255,0.08); border-color:rgba(30,120,255,0.2); color:#e2e8f0; }
        .pf-location-item.active { background:rgba(30,120,255,0.15); border-color:rgba(30,120,255,0.4); color:#fff; }
        .pf-location-left { display:flex; align-items:center; gap:8px; }
        .pf-location-dot { width:7px; height:7px; border-radius:50%; background:#1e78ff; flex-shrink:0; }
        .pf-location-item.active .pf-location-dot { box-shadow:0 0 8px #1e78ff; animation:pfPulse 1.5s ease infinite; }
        @keyframes pfPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.4)}}
        .pf-info-btn { background:none; border:none; color:#4a6080; cursor:pointer; display:flex; align-items:center; transition:color 0.2s; padding:2px; border-radius:4px; }
        .pf-info-btn:hover { color:#1e78ff; }
        .pf-loc-status { font-size:10px; font-weight:700; letter-spacing:0.06em; padding:2px 7px; border-radius:10px; flex-shrink:0; }
        .pf-loc-status.open  { background:rgba(30,220,120,0.12); color:#40e0a0; border:1px solid rgba(30,220,120,0.2); }
        .pf-loc-status.closed{ background:rgba(255,60,60,0.12);  color:#ff7070; border:1px solid rgba(255,60,60,0.2); }

        /* ── EDITOR BAR ── */
        .pf-editor-bar { background:rgba(255,170,30,0.05); border:1px solid rgba(255,170,30,0.2); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:10px; opacity:0; transform:translateX(-12px); transition:all 0.5s 0.5s ease; }
        .pf-editor-bar.show { opacity:1; transform:translateX(0); }
        .pf-editor-title { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#ffaa30; }
        .pf-editor-add { display:flex; gap:6px; }
        .pf-editor-input { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 10px; color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:border-color 0.2s; }
        .pf-editor-input:focus { border-color:#ffaa30; }
        .pf-editor-input::placeholder { color:#3d5070; }
        .pf-add-btn { background:rgba(255,170,30,0.15); border:1px solid rgba(255,170,30,0.3); border-radius:8px; padding:8px 12px; color:#ffaa30; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s; white-space:nowrap; }
        .pf-add-btn:hover { background:rgba(255,170,30,0.25); }
        .pf-editor-hint { font-size:11px; color:#4a6080; line-height:1.5; }
        .pf-save-row { display:flex; align-items:center; gap:8px; }
        .pf-save-btn { flex:1; background:linear-gradient(135deg,#ffaa30,#ff7700); border:none; border-radius:10px; padding:10px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:opacity 0.2s; }
        .pf-save-btn:hover { opacity:0.9; } .pf-save-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .pf-save-msg { font-size:12px; color:#40e0a0; font-weight:600; }
        .pf-pin-list { display:flex; flex-direction:column; gap:5px; max-height:140px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(255,170,30,0.2) transparent; -webkit-overflow-scrolling: touch; }
        .pf-pin-list-item { display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:6px 10px; font-size:12px; color:#8899b0; }
        .pf-pin-list-name { display:flex; align-items:center; gap:6px; }
        .pf-pin-list-dot { width:6px; height:6px; border-radius:50%; background:#ffaa30; flex-shrink:0; }
        .pf-pin-del-btn { background:none; border:none; color:#4a6080; cursor:pointer; display:flex; align-items:center; transition:color 0.2s; padding:2px; }
        .pf-pin-del-btn:hover { color:#ff6b6b; }

        /* ── LOGOUT ── */
        .pf-logout-btn { margin-top:auto; display:flex; align-items:center; gap:8px; background:rgba(255,60,60,0.06); border:1px solid rgba(255,60,60,0.15); border-radius:12px; padding:11px 14px; color:#ff6b6b; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; width:100%; transition:all 0.2s; }
        .pf-logout-btn:hover { background:rgba(255,60,60,0.12); border-color:rgba(255,60,60,0.3); }

        /* ── MAIN ── */
        .pf-main { display:flex; flex-direction:column; overflow:hidden; position:relative; z-index:5; }
        .pf-main-grid { display:grid; grid-template-columns: minmax(0,1.8fr) minmax(300px,1fr); gap:14px; align-items:start; }
        .pf-map-panel { min-height:520px; }
        .pf-right-panel { display:flex; flex-direction:column; gap:12px; }
        .pf-pinned-panel { display:flex; flex-direction:column; gap:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:10px 16px; }
        .pf-pinned-header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .pf-pin-tabs { display:flex; gap:6px; margin-bottom:6px; }
        .pf-pin-tab { flex:1; border:1px solid rgba(255,255,255,0.1); border-radius:999px; padding:8px 10px; background:rgba(255,255,255,0.04); color:#8899b0; font-size:12px; cursor:pointer; transition:all 0.2s; }
        .pf-pin-tab.active { background:rgba(30,120,255,0.15); border-color:rgba(30,120,255,0.25); color:#e2e8f0; }
        .pf-pinned-list { display:flex; flex-direction:column; gap:12px; max-height:calc(72vh - 120px); overflow:auto; }
        .pf-pinned-item { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border:1px solid rgba(255,255,255,0.1); border-radius:14px; background:rgba(255,255,255,0.035); cursor:pointer; transition:background 0.2s; }
        .pf-pinned-item:hover { background:rgba(30,120,255,0.12); }
        .pf-pinned-name { font-size:13px; font-weight:600; color:#e2e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pf-pinned-floor { font-size:11px; color:#4a6080; white-space:nowrap; }
        .pf-pinned-floor-label { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#4a90ff; margin-top:14px; margin-bottom:6px; }
        .pf-pinned-empty { padding:14px; border:1px dashed rgba(255,255,255,0.1); border-radius:12px; color:#4a6080; font-size:12px; text-align:center; }
        .pf-pin-collapse-btn { margin-left:auto; border:none; background:rgba(255,255,255,0.06); color:#7fb3ff; border-radius:999px; padding:7px 12px; font-size:11px; cursor:pointer; transition:background 0.2s; }
        .pf-pin-collapse-btn:hover { background:rgba(30,120,255,0.18); }
        .pf-pinned-panel.collapsed { padding:12px; max-height:52px; overflow:hidden; }
        .pf-pinned-panel.collapsed .pf-pinned-list,
        .pf-pinned-panel.collapsed .pf-pin-tabs { display:none; }

        @media (max-width: 1080px) {
          .pf-main-grid { grid-template-columns: 1fr; }
          .pf-right-panel { width: 100%; }
          .pf-pinned-panel { max-width: 100%; }
        }

        /* ── ANNOUNCEMENT ── */
        .pf-announce { position:relative; overflow:hidden; flex-shrink:0; min-height:72px; display:flex; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); }
        .pf-announce-bg { position:absolute; inset:0; background-image:url("${announceBg}"); background-size:cover; background-position:center; filter:brightness(0.28) saturate(0.6); }
        .pf-announce-overlay { position:absolute; inset:0; background:linear-gradient(90deg,rgba(8,12,20,0.9) 0%,rgba(8,12,20,0.55) 100%); }
        .pf-announce-content { position:relative; z-index:2; display:flex; align-items:center; gap:12px; padding:14px 24px; width:100%; }
        .pf-announce-icon { width:34px; height:34px; border-radius:10px; background:rgba(255,215,64,0.12); border:1px solid rgba(255,215,64,0.25); display:grid; place-items:center; color:#ffd740; flex-shrink:0; }
        .pf-announce-text { flex:1; font-size:13px; color:#d8e4f0; line-height:1.5; min-width:0; }
        .pf-announce-label { font-size:10px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:#ffd740; margin-bottom:3px; }
        .pf-announce-edit-input { flex:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,215,64,0.35); border-radius:8px; padding:8px 12px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; min-width:0; }
        .pf-announce-edit-input:focus { border-color:#ffd740; box-shadow:0 0 0 3px rgba(255,215,64,0.1); }
        .pf-announce-btns { display:flex; gap:6px; flex-shrink:0; }
        .pf-announce-btn { background:rgba(255,215,64,0.12); border:1px solid rgba(255,215,64,0.25); border-radius:8px; padding:7px 12px; color:#ffd740; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap; display:flex; align-items:center; gap:5px; }
        .pf-announce-btn:hover { background:rgba(255,215,64,0.22); }
        .pf-announce-btn.cancel { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); color:#8899b0; }
        .pf-announce-close { background:none; border:none; color:#4a6080; cursor:pointer; display:flex; align-items:center; flex-shrink:0; transition:color 0.2s; padding:4px; }
        .pf-announce-close:hover { color:#e2e8f0; }

        /* ── TOPBAR ── */
        .pf-topbar { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(8,12,20,0.7); backdrop-filter:blur(12px); flex-shrink:0; opacity:0; transform:translateY(-10px); transition:all 0.5s 0.15s ease; gap:8px; }
        .pf-topbar.show { opacity:1; transform:translateY(0); }
        .pf-topbar-left { display:flex; align-items:center; gap:10px; min-width:0; }
        .pf-topbar-left h2 { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:0.05em; color:#fff; line-height:1; white-space:nowrap; }
        .pf-topbar-left p { font-size:10px; color:#4a6080; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pf-topbar-right { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end; flex-shrink:0; }
        .pf-badge { display:flex; align-items:center; gap:6px; background:rgba(30,120,255,0.1); border:1px solid rgba(30,120,255,0.25); border-radius:20px; padding:5px 12px; font-size:12px; color:#7fb3ff; font-weight:500; white-space:nowrap; }
        .pf-badge-dot { width:6px; height:6px; border-radius:50%; background:#1e78ff; animation:pfPulse 2s ease infinite; }
        .pf-icon-btn { display:flex; align-items:center; gap:5px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:7px 11px; background:rgba(255,255,255,0.04); color:#8899b0; font-family:'DM Sans',sans-serif; font-size:12px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .pf-icon-btn:hover { background:rgba(255,255,255,0.08); color:#fff; border-color:rgba(255,255,255,0.2); }
        .pf-icon-btn.danger { border-color:rgba(255,120,30,0.3); color:#ffaa60; background:rgba(255,120,30,0.07); }
        .pf-icon-btn.danger:hover { background:rgba(255,120,30,0.15); border-color:rgba(255,120,30,0.5); }
        .pf-icon-btn.accent { border-color:rgba(30,120,255,0.35); color:#7fb3ff; background:rgba(30,120,255,0.1); }
        .pf-icon-btn.accent:hover { background:rgba(30,120,255,0.18); color:#fff; border-color:rgba(30,120,255,0.55); }
        .pf-icon-btn.maps-highlight { border-color:#6cff75; background:linear-gradient(135deg, #65f96b 0%, #36d632 100%); color:#072b03; box-shadow:0 6px 16px rgba(108,255,117,0.25); }
        .pf-icon-btn.maps-highlight:hover { background:linear-gradient(135deg, #72ff7b 0%, #3bdd3d 100%); color:#052204; border-color:#72ff7b; }
        .pf-modal-overlay { position:fixed; inset:0; background:rgba(7,9,24,0.72); display:flex; align-items:center; justify-content:center; z-index:200; padding:22px; }
        .pf-modal { width:min(480px,100%); background:rgba(10,16,32,0.92); backdrop-filter:blur(28px); border:1px solid rgba(255,255,255,0.14); border-radius:22px; box-shadow:0 30px 90px rgba(8,12,26,0.52); overflow:hidden; }
        .pf-modal-header { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:24px 24px 18px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .pf-modal-header h3 { margin:0; font-size:20px; color:#f8fbff; letter-spacing:0.01em; }
        .pf-modal-header p { margin:6px 0 0; font-size:13px; color:#a7b7d4; line-height:1.5; max-width:calc(100% - 60px); }
        .pf-modal-close { border:none; background:rgba(255,255,255,0.08); color:#fff; width:38px; height:38px; border-radius:14px; font-size:18px; cursor:pointer; transition:all 0.2s; }
        .pf-modal-close:hover { background:rgba(255,255,255,0.16); transform:scale(1.02); }
        .pf-modal-body { padding:18px 24px 0; display:flex; flex-direction:column; gap:20px; }
        .pf-field { display:flex; flex-direction:column; gap:10px; }
        .pf-field label { font-size:13px; color:#c5d0e0; font-weight:700; letter-spacing:0.01em; }
        .pf-input, .pf-select, .pf-detail-textarea { width:100%; min-width:0; border-radius:16px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.16); color:#f1f5fb; padding:14px 16px; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:all 0.2s; box-shadow: inset 0 1px 2px rgba(255,255,255,0.08); }
        .pf-input::placeholder, .pf-select::placeholder, .pf-detail-textarea::placeholder { color:rgba(255,255,255,0.45); }
        .pf-input:focus, .pf-select:focus, .pf-detail-textarea:focus { border-color:#74a2ff; box-shadow:0 0 0 4px rgba(66,105,255,0.12); }
        .pf-select { appearance:none; -webkit-appearance:none; -moz-appearance:none; cursor:pointer; background-image: radial-gradient(circle at right 16px center, rgba(255,255,255,0.45), rgba(255,255,255,0.18) 8px, transparent 9px), linear-gradient(135deg, transparent 50%, #f1f5fb 50%), linear-gradient(45deg, transparent 50%, #f1f5fb 50%); background-position: right 16px center, right 12px center, right 8px center; background-size: 24px 24px, 6px 6px, 6px 6px; background-repeat: no-repeat; padding-right:48px; }
        .pf-select option { background:rgba(10,16,32,0.98); color:#f1f5fb; }
        .pf-detail-textarea { min-height:110px; resize:vertical; padding:14px 16px; }
        .pf-modal-actions { display:flex; gap:12px; padding:18px 24px 22px; justify-content:flex-end; background:rgba(255,255,255,0.02); }
        .pf-submit-btn { border:none; background:linear-gradient(135deg,#5a88ff,#3d5cff); color:#fff; padding:13px 22px; border-radius:16px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; box-shadow:0 14px 30px rgba(46,74,255,0.16); transition:transform 0.2s, filter 0.2s; }
        .pf-submit-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.05); }
        .pf-submit-btn:disabled { opacity:0.65; cursor:default; }
        .pf-success { color:#8ff2a3; font-size:13px; }
        .pf-cancel-btn { border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.05); color:#dbe2f4; padding:12px 18px; border-radius:16px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; transition:all 0.2s; }
        .pf-cancel-btn:hover { background:rgba(255,255,255,0.10); }
        .pf-cancel-btn:hover { background:rgba(255,255,255,0.08); }
        .pf-detail-textarea { min-height:100px; resize:vertical; width:100%; border-radius:12px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:13px; padding:10px 12px; outline:none; }
        .pf-detail-textarea:focus { border-color:#1e78ff; box-shadow:0 0 0 3px rgba(30,120,255,0.1); }
        .pf-menu-btn { display:none; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px; color:#8899b0; cursor:pointer; transition:all 0.2s; flex-shrink:0; }
        .pf-menu-btn:hover { color:#fff; background:rgba(30,120,255,0.12); border-color:rgba(30,120,255,0.3); }

        /* ── MAP AREA ── */
        .pf-map-area { flex:1; padding:10px 16px; display:flex; flex-direction:column; gap:10px; overflow:hidden; min-height:0; }
        .pf-map-viewport { flex:1; overflow:hidden; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); position:relative; min-height:0; opacity:0; transition:opacity 0.6s 0.3s ease; touch-action:none; }
        .pf-map-viewport.show { opacity:1; }
        .pf-map-viewport.grab { cursor:grab; } .pf-map-viewport.grab:active { cursor:grabbing; }
        .pf-map-viewport.edit-mode { cursor:crosshair; border-color:rgba(255,170,30,0.4); }
        .pf-map-viewport::before,.pf-map-viewport::after { content:''; position:absolute; width:20px; height:20px; z-index:5; pointer-events:none; }
        .pf-map-viewport::before { top:12px;left:12px;border-top:2px solid rgba(30,120,255,0.5);border-left:2px solid rgba(30,120,255,0.5);border-radius:4px 0 0 0; }
        .pf-map-viewport::after  { bottom:12px;right:12px;border-bottom:2px solid rgba(30,120,255,0.5);border-right:2px solid rgba(30,120,255,0.5);border-radius:0 0 4px 0; }
        .pf-map-transform { width:fit-content; height:fit-content; transform-origin:top left; }
        .pf-map-card { position:relative; }
        .pf-floor-image { display:block; max-height:calc(100vh - 280px); max-width:100%; border-radius:12px; user-select:none; pointer-events:none; }
        .pf-pin-layer { position:absolute; inset:0; }

        /* ── MAP HIDDEN STATE ── */
        .pf-map-hidden-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; background:rgba(8,12,20,0.92); border-radius:16px; z-index:20; }
        .pf-map-hidden-icon { width:56px; height:56px; border-radius:16px; background:rgba(255,60,60,0.1); border:1px solid rgba(255,60,60,0.2); display:grid; place-items:center; color:#ff7070; }
        .pf-map-hidden-text { font-size:15px; font-weight:600; color:#ff7070; }
        .pf-map-hidden-sub { font-size:12px; color:#4a6080; }

        /* ── IMAGE SWITCHER ── */
        .pf-img-switcher { position:absolute; bottom:60px; left:50%; transform:translateX(-50%); z-index:12; display:flex; gap:6px; align-items:center; background:rgba(8,12,20,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:6px 10px; backdrop-filter:blur(8px); }
        .pf-img-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.2); cursor:pointer; transition:all 0.2s; border:none; padding:0; }
        .pf-img-dot.active { background:#1e78ff; box-shadow:0 0 6px rgba(30,120,255,0.7); }
        .pf-img-label { font-size:10px; color:#4a6080; font-weight:600; letter-spacing:0.06em; }

        /* ── PINS ── */
        .pf-map-pin { position:absolute; transform:translate(-50%,-100%); background:transparent; border:none; cursor:pointer; padding:0; display:flex; flex-direction:column; align-items:center; transition:transform 0.15s ease; z-index:10; }
        .pf-map-pin:hover { transform:translate(-50%,-100%) scale(1.2); }
        .pf-map-pin:hover .pf-pin-label { opacity:1; transform:translateY(0); }
        .pf-map-pin.edit-pin { cursor:grab; } .pf-map-pin.edit-pin:active { cursor:grabbing; }
        .pf-pin-icon { width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:linear-gradient(135deg,#1e78ff,#0fb8ff); display:grid; place-items:center; box-shadow:0 4px 14px rgba(30,120,255,0.5); border:2px solid rgba(255,255,255,0.3); flex-shrink:0; transition:background 0.2s; }
        .pf-pin-icon.active    { background:linear-gradient(135deg,#ff6b35,#ff3366); box-shadow:0 4px 14px rgba(255,60,60,0.5); }
        .pf-pin-icon.closed-pin{ background:linear-gradient(135deg,#ff3366,#aa0033); box-shadow:0 4px 14px rgba(200,0,50,0.5); }
        .pf-pin-icon.edit      { background:linear-gradient(135deg,#ffaa30,#ff7700); box-shadow:0 4px 14px rgba(255,150,30,0.5); }
        .pf-pin-dot { width:6px; height:6px; border-radius:50%; background:#fff; transform:rotate(45deg); }
        .pf-pin-label { background:rgba(8,12,20,0.9); border:1px solid rgba(30,120,255,0.3); color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; padding:4px 8px; border-radius:6px; white-space:nowrap; opacity:0; transform:translateY(4px); transition:all 0.2s ease; pointer-events:none; margin-top:4px; backdrop-filter:blur(8px); }
        .pf-pin-delete { position:absolute; top:-6px; right:-22px; width:18px; height:18px; border-radius:50%; background:#ff3366; border:none; cursor:pointer; display:grid; place-items:center; color:#fff; font-size:10px; z-index:20; opacity:0; transition:opacity 0.2s; }
        .pf-map-pin:hover .pf-pin-delete { opacity:1; }

        /* ── ZOOM + MINIMAP ── */
        .pf-zoom-controls { position:absolute; bottom:16px; right:16px; display:flex; flex-direction:column; gap:4px; z-index:10; }
        .pf-map-reset-btn, .pf-map-edit-btn { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:#e2e8f0; padding:8px 11px; font-size:12px; cursor:pointer; z-index:10; transition:all 0.2s; }
        .pf-map-reset-btn:hover, .pf-map-edit-btn:hover { background:rgba(255,255,255,0.15); border-color:rgba(30,120,255,0.25); }
        .pf-map-edit-btn.danger { border-color:rgba(255,110,80,0.25); background:rgba(255,80,40,0.12); color:#ffb07a; }
        .pf-map-edit-btn.danger:hover { background:rgba(255,80,40,0.18); }
        .pf-zoom-btn { width:32px; height:32px; border-radius:8px; background:rgba(8,12,20,0.85); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; font-size:18px; cursor:pointer; display:grid; place-items:center; backdrop-filter:blur(8px); transition:all 0.2s; font-family:monospace; line-height:1; }
        .pf-zoom-btn:hover { background:rgba(30,120,255,0.2); border-color:rgba(30,120,255,0.4); }
        .pf-floor-chip { position:absolute; top:14px; left:14px; background:rgba(8,12,20,0.85); border:1px solid rgba(30,120,255,0.3); border-radius:8px; padding:5px 12px; font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:0.08em; color:#7fb3ff; backdrop-filter:blur(8px); z-index:10; }
        .pf-floor-chip.edit-mode-chip { border-color:rgba(255,170,30,0.5); color:#ffcc60; background:rgba(30,20,0,0.9); }
        .pf-minimap { position:absolute; bottom:16px; left:16px; width:150px; border-radius:10px; overflow:hidden; border:1px solid rgba(30,120,255,0.3); background:rgba(8,12,20,0.9); z-index:10; backdrop-filter:blur(8px); box-shadow:0 4px 20px rgba(0,0,0,0.5); }
        .pf-minimap-label { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#4a6080; padding:5px 8px 3px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .pf-minimap-map { position:relative; width:100%; overflow:hidden; }
        .pf-minimap-img { width:100%; display:block; opacity:0.7; pointer-events:none; }
        .pf-minimap-pin { position:absolute; width:6px; height:6px; border-radius:50%; background:#1e78ff; transform:translate(-50%,-50%); box-shadow:0 0 6px rgba(30,120,255,0.8); }
        .pf-minimap-pin.active-pin { background:#ff6b35; box-shadow:0 0 6px rgba(255,107,53,0.8); }
        .pf-minimap-viewport { position:absolute; border:1.5px solid rgba(30,120,255,0.7); border-radius:3px; pointer-events:none; background:rgba(30,120,255,0.08); }

        /* ── INFO STRIP ── */
        .pf-info-strip { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; flex-shrink:0; opacity:0; transform:translateY(10px); transition:all 0.5s 0.4s ease; }
        .pf-info-strip.show { opacity:1; transform:translateY(0); }
        .pf-info-tile { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:8px 12px; display:flex; align-items:center; gap:8px; }
        .pf-tile-icon { width:28px; height:28px; border-radius:8px; background:rgba(30,120,255,0.12); display:grid; place-items:center; flex-shrink:0; color:#1e78ff; }
        .pf-tile-label { font-size:9px; color:#4a6080; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; }
        .pf-tile-value { font-size:12px; font-weight:600; color:#e2e8f0; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* ── DRAWER ── */
        .pf-drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:100; backdrop-filter:blur(4px); opacity:0; transition:opacity 0.3s ease; pointer-events:none; }
        .pf-drawer-overlay.open { opacity:1; pointer-events:all; }
        .pf-drawer { position:fixed; top:0; right:0; height:100vh; width:360px; background:#0d1220; border-left:1px solid rgba(30,120,255,0.2); z-index:101; display:flex; flex-direction:column; transform:translateX(100%); transition:transform 0.35s cubic-bezier(0.4,0,0.2,1); box-shadow:-8px 0 40px rgba(0,0,0,0.5); overflow-y:auto; -webkit-overflow-scrolling:touch; }
        .pf-drawer.open { transform:translateX(0); }
        .pf-drawer-header { padding:24px 24px 16px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; justify-content:space-between; align-items:flex-start; flex-shrink:0; }
        .pf-drawer-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:0.04em; color:#fff; line-height:1.1; }
        .pf-drawer-dept { font-size:12px; color:#4a6080; margin-top:4px; letter-spacing:0.05em; }
        .pf-drawer-close { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; width:32px; height:32px; display:grid; place-items:center; cursor:pointer; color:#8899b0; transition:all 0.2s; flex-shrink:0; }
        .pf-drawer-close:hover { background:rgba(255,60,60,0.15); border-color:rgba(255,60,60,0.3); color:#ff6b6b; }
        .pf-drawer-body { flex:1; padding:20px 24px; overflow-y:auto; display:flex; flex-direction:column; gap:16px; -webkit-overflow-scrolling:touch; }
        .pf-status-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:600; letter-spacing:0.05em; }
        .pf-status-pill.open   { background:rgba(30,220,120,0.1); border:1px solid rgba(30,220,120,0.25); color:#40e0a0; }
        .pf-status-pill.closed { background:rgba(255,60,60,0.1);  border:1px solid rgba(255,60,60,0.25);  color:#ff7070; }
        .pf-status-dot { width:6px; height:6px; border-radius:50%; background:currentColor; animation:pfPulse 2s ease infinite; }
        .pf-detail-desc { font-size:14px; color:#8899b0; line-height:1.65; }
        .pf-detail-textarea { min-height:100px; resize:vertical; width:100%; border-radius:12px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:13px; padding:10px 12px; outline:none; }
        .pf-detail-textarea:focus { border-color:#1e78ff; box-shadow:0 0 0 3px rgba(30,120,255,0.1); }
        .pf-detail-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .pf-detail-stat { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:12px; display:flex; align-items:flex-start; gap:10px; }
        .pf-detail-stat-icon { width:28px; height:28px; border-radius:8px; background:rgba(30,120,255,0.1); display:grid; place-items:center; color:#1e78ff; flex-shrink:0; }
        .pf-detail-stat-label { font-size:10px; color:#4a6080; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; }
        .pf-detail-stat-val { font-size:13px; font-weight:600; color:#e2e8f0; margin-top:3px; }
        .pf-drawer-floor-badge { display:flex; align-items:center; gap:8px; background:rgba(30,120,255,0.07); border:1px solid rgba(30,120,255,0.2); border-radius:10px; padding:10px 14px; font-size:12px; color:#7fb3ff; }

        .pf-status-toggle-row { display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:12px 16px; }
        .pf-status-toggle-label { font-size:13px; font-weight:500; color:#8899b0; }
        .pf-toggle-btn { display:flex; align-items:center; gap:7px; background:none; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:6px 14px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; transition:all 0.2s; }
        .pf-toggle-btn.open   { color:#40e0a0; border-color:rgba(30,220,120,0.35); background:rgba(30,220,120,0.08); }
        .pf-toggle-btn.closed { color:#ff7070; border-color:rgba(255,60,60,0.35);   background:rgba(255,60,60,0.08); }
        .pf-toggle-btn:hover { opacity:0.8; }

        /* ── SLIDE PANELS ── */
        .pf-slide-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(6px); opacity:0; transition:opacity 0.3s ease; pointer-events:none; z-index:200; }
        .pf-slide-overlay.open { opacity:1; pointer-events:all; }
        .pf-slide-panel { position:fixed; top:0; right:0; height:100vh; width:400px; max-width:100vw; background:#0d1220; border-left:1px solid rgba(30,120,255,0.25); display:flex; flex-direction:column; transform:translateX(100%); transition:transform 0.35s cubic-bezier(0.4,0,0.2,1); box-shadow:-8px 0 40px rgba(0,0,0,0.6); z-index:201; }
        .pf-slide-panel.open { transform:translateX(0); }
        .pf-slide-header { padding:22px 24px 16px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
        .pf-slide-title { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:0.04em; color:#fff; }
        .pf-slide-sub { font-size:12px; color:#4a6080; margin-top:3px; }
        .pf-slide-close { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; width:32px; height:32px; display:grid; place-items:center; cursor:pointer; color:#8899b0; transition:all 0.2s; }
        .pf-slide-close:hover { background:rgba(255,60,60,0.15); border-color:rgba(255,60,60,0.3); color:#ff6b6b; }
        .pf-slide-body { flex:1; overflow-y:auto; padding:16px 24px; display:flex; flex-direction:column; gap:16px; scrollbar-width:thin; scrollbar-color:rgba(30,120,255,0.2) transparent; -webkit-overflow-scrolling:touch; }

        /* ── PINS PANEL ── */
        .pf-pins-floor-label { font-size:10px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:#1e78ff; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
        .pf-pins-floor-label::after { content:''; flex:1; height:1px; background:rgba(30,120,255,0.15); }
        .pf-pins-grid { display:flex; flex-direction:column; gap:6px; }
        .pf-pins-card { display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 14px; cursor:pointer; transition:all 0.2s; }
        .pf-pins-card:hover { background:rgba(30,120,255,0.08); border-color:rgba(30,120,255,0.25); }
        .pf-pins-card-icon { width:32px; height:32px; border-radius:8px; flex-shrink:0; background:rgba(30,120,255,0.12); display:grid; place-items:center; color:#1e78ff; }
        .pf-pins-card-icon.closed { background:rgba(255,60,60,0.1); color:#ff7070; }
        .pf-pins-card-name { font-size:13px; font-weight:500; color:#e2e8f0; }
        .pf-pins-card-floor { font-size:11px; color:#4a6080; margin-top:2px; }
        .pf-pins-status-dot { width:7px; height:7px; border-radius:50%; margin-left:auto; flex-shrink:0; }
        .pf-pins-status-dot.open   { background:#40e0a0; box-shadow:0 0 6px #40e0a0; }
        .pf-pins-status-dot.closed { background:#ff7070; box-shadow:0 0 6px #ff7070; }

        /* ── ANALYTICS (stock chart style) ── */
        .pf-analytics-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
        .pf-analytics-ticker { font-size:10px; font-weight:700; letter-spacing:0.12em; color:#4a6080; }
        .pf-analytics-live { display:flex; align-items:center; gap:5px; font-size:10px; color:#40e0a0; font-weight:600; }
        .pf-analytics-live-dot { width:5px; height:5px; border-radius:50%; background:#40e0a0; animation:pfPulse 1.5s ease infinite; }

        .pf-spark-row { display:flex; flex-direction:column; gap:5px; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; transition:background 0.2s; }
        .pf-spark-row:hover { background:rgba(30,120,255,0.05); border-color:rgba(30,120,255,0.15); }
        .pf-spark-meta { display:flex; align-items:center; gap:8px; }
        .pf-spark-rank { font-size:13px; flex-shrink:0; width:24px; }
        .pf-spark-name { font-size:13px; font-weight:500; color:#e2e8f0; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pf-spark-trend { font-size:10px; font-weight:700; flex-shrink:0; }
        .pf-spark-val { font-size:12px; font-weight:700; flex-shrink:0; font-family:monospace; }
        .pf-spark-chart { display:flex; flex-direction:column; gap:4px; }
        .pf-spark-bar-bg { height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
        .pf-spark-bar-fill { height:100%; border-radius:2px; transition:width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .pf-analytics-note { font-size:11px; color:#3d5070; text-align:center; margin-top:4px; line-height:1.6; }

        /* ── EXTRA IMAGES PANEL ── */
        .pf-images-floor-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .pf-images-floor-name { font-size:13px; font-weight:600; color:#e2e8f0; }
        .pf-images-floor-count { font-size:11px; color:#4a6080; }
        .pf-images-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .pf-images-thumb { position:relative; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); aspect-ratio:4/3; background:rgba(255,255,255,0.03); }
        .pf-images-thumb img { width:100%; height:100%; object-fit:cover; display:block; opacity:0.85; }
        .pf-images-thumb-del { position:absolute; top:5px; right:5px; width:22px; height:22px; border-radius:50%; background:rgba(255,30,30,0.85); border:none; cursor:pointer; display:grid; place-items:center; color:#fff; font-size:11px; transition:opacity 0.2s; opacity:0; }
        .pf-images-thumb:hover .pf-images-thumb-del { opacity:1; }
        .pf-images-thumb-label { position:absolute; bottom:0; left:0; right:0; padding:4px 7px; background:rgba(8,12,20,0.8); font-size:9px; color:#4a6080; font-weight:600; letter-spacing:0.08em; }
        .pf-images-main-badge { position:absolute; top:5px; left:5px; background:rgba(30,120,255,0.85); border-radius:5px; padding:2px 6px; font-size:9px; color:#fff; font-weight:700; letter-spacing:0.05em; }
        .pf-images-upload-btn { grid-column:1/-1; border:2px dashed rgba(255,170,30,0.3); border-radius:10px; padding:16px; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; background:rgba(255,170,30,0.04); transition:all 0.2s; }
        .pf-images-upload-btn:hover { border-color:rgba(255,170,30,0.6); background:rgba(255,170,30,0.08); }
        .pf-images-upload-btn span { font-size:12px; color:#ffaa30; font-weight:600; }
        .pf-images-upload-btn small { font-size:10px; color:#4a6080; }
        .pf-images-placeholder { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:20px; border:1px dashed rgba(255,255,255,0.07); border-radius:10px; }
        .pf-images-placeholder span { font-size:12px; color:#4a6080; }

        /* ── MOBILE OVERLAY SIDEBAR ── */
        .pf-mobile-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:50; backdrop-filter:blur(4px); }
        .pf-mobile-overlay.open { display:block; }

        /* ── COLLAPSIBLE TRAY ── */
        .pf-panel-toggle { cursor:pointer; user-select:none; justify-content:space-between; margin-bottom:0 !important; }
        .pf-panel-toggle:hover { opacity:0.8; }
        .pf-panel .pf-search-box,.pf-panel .pf-search-results,.pf-panel .pf-floor-grid,.pf-panel .pf-location-list { margin-top:10px; }
        .pf-tray-chevron { font-size:16px; font-weight:300; color:#4a6080; transform:rotate(-90deg); display:inline-block; transition:transform 0.25s ease, color 0.2s; line-height:1; margin-left:auto; }
        .pf-tray-chevron.open { transform:rotate(90deg); color:#1e78ff; }
        .pf-tray-chevron-gold.open { color:#ffaa30; }
        .pf-editor-title.pf-panel-toggle { justify-content:space-between; cursor:pointer; user-select:none; }
        .pf-editor-title.pf-panel-toggle:hover { opacity:0.8; }
        .pf-editor-bar > .pf-panel-toggle { margin-bottom:0 !important; }

        /* ── BOTTOM BUTTONS ── */
        .pf-bottom-btns { margin-top:auto; display:flex; flex-direction:column; gap:6px; }
        .pf-settings-btn { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:11px 14px; color:#8899b0; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; width:100%; transition:all 0.2s; }
        .pf-settings-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:#e2e8f0; }

        /* ── SETTINGS TRAY ── */
        .pf-settings-tray { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.09); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:12px; }
        .pf-settings-tray-title { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#4a6080; }
        .pf-settings-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .pf-settings-label { display:flex; align-items:center; gap:8px; font-size:13px; color:#8899b0; }

        /* Toggle switch */
        .pf-mode-toggle { width:44px; height:24px; border-radius:12px; border:none; cursor:pointer; position:relative; transition:background 0.3s; flex-shrink:0; padding:0; }
        .pf-mode-toggle.dark { background:rgba(255,255,255,0.12); }
        .pf-mode-toggle.light { background:#5a8a4a; }
        .pf-mode-toggle-knob { position:absolute; top:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:left 0.3s cubic-bezier(0.4,0,0.2,1); box-shadow:0 1px 4px rgba(0,0,0,0.3); }
        .pf-mode-toggle.dark .pf-mode-toggle-knob { left:3px; }
        .pf-mode-toggle.light .pf-mode-toggle-knob { left:23px; }

        /* Light mode overrides for new elements */
        .pf-light .pf-tray-chevron { color:#9aae90; }
        .pf-light .pf-tray-chevron.open { color:#5a8a4a; }
        .pf-light .pf-settings-btn { background:rgba(255,255,255,0.45); border:1px solid rgba(100,130,90,0.18); color:#6a7e60; }
        .pf-light .pf-settings-btn:hover { background:rgba(255,255,255,0.75); color:#2d3a28; }
        .pf-light .pf-settings-tray { background:rgba(255,255,255,0.45); border:1px solid rgba(100,130,90,0.15); }
        .pf-light .pf-settings-tray-title { color:#8a9e80; }
        .pf-light .pf-settings-label { color:#6a7e60; }
        .pf-light .pf-mode-toggle.dark { background:rgba(100,130,90,0.18); }

        /* ── LIGHT MODE ── */
        .pf-light { --lbg: #f5f0e8; --lbg2: #ede8dc; --lborder: rgba(100,130,90,0.18); --ltext: #2d3a28; --ltext2: #5a6b52; --ltext3: #8a9e80; --laccent: #5a8a4a; --laccent2: #3d6b30; --laccent-glow: rgba(90,138,74,0.25); --lpanel: rgba(90,138,74,0.06); --lcard: rgba(255,255,255,0.65); }

        /* Reset body + grid background in light mode */
        .pf-light ~ * body, body:has(.pf-light) { background: #f5f0e8 !important; color: #2d3a28 !important; }
        .pf-light::before { background-image: linear-gradient(rgba(90,138,74,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(90,138,74,0.07) 1px,transparent 1px); }

        /* Sidebar */
        .pf-light .pf-sidebar { background: rgba(237,232,220,0.98); border-right: 1px solid rgba(100,130,90,0.18); }
        .pf-light .pf-sidebar::after { background: radial-gradient(circle,rgba(90,138,74,0.1),transparent 70%); }
        .pf-light .pf-brand { border-bottom: 1px solid rgba(100,130,90,0.15); }
        .pf-light .pf-brand-text h1 { color: #2d3a28; }
        .pf-light .pf-brand-text p { color: #7a8e70; }
        .pf-light .pf-brand-clock { color: #5a8a4a; }
        .pf-light .pf-panel { background: rgba(255,255,255,0.55); border: 1px solid rgba(100,130,90,0.15); }
        .pf-light .pf-panel-title { color: #5a8a4a; }

        /* Search */
        .pf-light .pf-search-box { background: rgba(255,255,255,0.7); border: 1px solid rgba(100,130,90,0.2); }
        .pf-light .pf-search-box:focus-within { border-color: #5a8a4a; box-shadow: 0 0 0 3px rgba(90,138,74,0.12); }
        .pf-light .pf-search-box input { color: #2d3a28; }
        .pf-light .pf-search-box input::placeholder { color: #9aae90; }
        .pf-light .pf-clear-btn { color: #8a9e80; }
        .pf-light .pf-clear-btn:hover { color: #2d3a28; }
        .pf-light .pf-result-card { border: 1px solid rgba(90,138,74,0.25); background: rgba(90,138,74,0.06); color: #2d3a28; }
        .pf-light .pf-result-card:hover { background: rgba(90,138,74,0.14); border-color: rgba(90,138,74,0.4); }
        .pf-light .pf-result-card strong { color: #2d3a28; }
        .pf-light .pf-result-card span { color: #7a8e70; }

        /* Floors */
        .pf-light .pf-floor-btn { background: rgba(255,255,255,0.5); border: 1px solid rgba(100,130,90,0.15); color: #6a7e60; }
        .pf-light .pf-floor-btn:hover { background: rgba(90,138,74,0.1); border-color: rgba(90,138,74,0.3); color: #2d3a28; }
        .pf-light .pf-floor-btn.active { background: linear-gradient(135deg,rgba(90,138,74,0.28),rgba(61,107,48,0.18)); border-color: #5a8a4a; color: #2d3a28; box-shadow: 0 2px 12px rgba(90,138,74,0.2); }

        /* Locations */
        .pf-light .pf-location-item { background: rgba(255,255,255,0.5); border: 1px solid rgba(100,130,90,0.12); color: #6a7e60; }
        .pf-light .pf-location-item:hover { background: rgba(90,138,74,0.08); border-color: rgba(90,138,74,0.22); color: #2d3a28; }
        .pf-light .pf-location-item.active { background: rgba(90,138,74,0.13); border-color: rgba(90,138,74,0.38); color: #2d3a28; }
        .pf-light .pf-location-dot { background: #5a8a4a; }
        .pf-light .pf-location-item.active .pf-location-dot { box-shadow: 0 0 8px #5a8a4a; }
        .pf-light .pf-info-btn { color: #8a9e80; }
        .pf-light .pf-info-btn:hover { color: #5a8a4a; }

        /* Logout */
        .pf-light .pf-logout-btn { background: rgba(220,60,60,0.05); border: 1px solid rgba(220,60,60,0.15); color: #c04040; }
        .pf-light .pf-logout-btn:hover { background: rgba(220,60,60,0.1); border-color: rgba(220,60,60,0.28); }

        /* Main + topbar */
        .pf-light .pf-topbar { background: rgba(237,232,220,0.88); border-bottom: 1px solid rgba(100,130,90,0.15); }
        .pf-light .pf-topbar-left h2 { color: #2d3a28; }
        .pf-light .pf-topbar-left p { color: #8a9e80; }
        .pf-light .pf-badge { background: rgba(90,138,74,0.1); border: 1px solid rgba(90,138,74,0.25); color: #4a7a3a; }
        .pf-light .pf-badge-dot { background: #5a8a4a; }
        .pf-light .pf-icon-btn { background: rgba(255,255,255,0.55); border: 1px solid rgba(100,130,90,0.18); color: #6a7e60; }
        .pf-light .pf-icon-btn:hover { background: rgba(255,255,255,0.85); color: #2d3a28; border-color: rgba(90,138,74,0.3); }
        .pf-light .pf-icon-btn.accent { background: rgba(90,138,74,0.1); border-color: rgba(90,138,74,0.3); color: #4a7a3a; }
        .pf-light .pf-icon-btn.accent:hover { background: rgba(90,138,74,0.18); color: #2d3a28; }
        .pf-light .pf-icon-btn.danger { border-color: rgba(200,100,20,0.3); color: #c06020; background: rgba(200,100,20,0.07); }
        .pf-light .pf-icon-btn.danger:hover { background: rgba(200,100,20,0.14); }

        /* Announcement */
        .pf-light .pf-announce-overlay { background: linear-gradient(90deg,rgba(237,232,220,0.88) 0%,rgba(237,232,220,0.5) 100%); }
        .pf-light .pf-announce-text { color: #4a5e42; }
        .pf-light .pf-announce-label { color: #b08030; }
        .pf-light .pf-announce-icon { background: rgba(176,128,48,0.1); border: 1px solid rgba(176,128,48,0.22); color: #b08030; }
        .pf-light .pf-announce-close { color: #9aae90; }
        .pf-light .pf-announce-close:hover { color: #2d3a28; }
        .pf-light .pf-announce-btn { background: rgba(176,128,48,0.1); border: 1px solid rgba(176,128,48,0.22); color: #9a6a10; }
        .pf-light .pf-announce-btn:hover { background: rgba(176,128,48,0.2); }
        .pf-light .pf-announce-btn.cancel { background: rgba(100,130,90,0.06); border-color: rgba(100,130,90,0.14); color: #8a9e80; }

        /* Map viewport */
        .pf-light .pf-map-viewport { background: rgba(255,255,255,0.4); border: 1px solid rgba(100,130,90,0.15); }
        .pf-light .pf-map-viewport::before { border-top: 2px solid rgba(90,138,74,0.45); border-left: 2px solid rgba(90,138,74,0.45); }
        .pf-light .pf-map-viewport::after  { border-bottom: 2px solid rgba(90,138,74,0.45); border-right: 2px solid rgba(90,138,74,0.45); }
        .pf-light .pf-floor-chip { background: rgba(237,232,220,0.9); border: 1px solid rgba(90,138,74,0.3); color: #4a7a3a; }
        .pf-light .pf-zoom-btn { background: rgba(237,232,220,0.9); border: 1px solid rgba(100,130,90,0.18); color: #2d3a28; }
        .pf-light .pf-zoom-btn:hover { background: rgba(90,138,74,0.12); border-color: rgba(90,138,74,0.35); }
        .pf-light .pf-pin-icon { background: linear-gradient(135deg,#5a8a4a,#3d8a30); box-shadow: 0 4px 14px rgba(90,138,74,0.4); }
        .pf-light .pf-pin-label { background: rgba(237,232,220,0.95); border: 1px solid rgba(90,138,74,0.25); color: #2d3a28; }
        .pf-light .pf-minimap { background: rgba(237,232,220,0.95); border: 1px solid rgba(90,138,74,0.25); }
        .pf-light .pf-minimap-label { color: #7a8e70; border-bottom: 1px solid rgba(100,130,90,0.1); }
        .pf-light .pf-minimap-pin { background: #5a8a4a; box-shadow: 0 0 6px rgba(90,138,74,0.8); }
        .pf-light .pf-minimap-viewport { border-color: rgba(90,138,74,0.65); background: rgba(90,138,74,0.07); }
        .pf-light .pf-img-switcher { background: rgba(237,232,220,0.9); border: 1px solid rgba(100,130,90,0.18); }
        .pf-light .pf-img-dot.active { background: #5a8a4a; box-shadow: 0 0 6px rgba(90,138,74,0.7); }
        .pf-light .pf-img-label { color: #8a9e80; }

        /* Info strip */
        .pf-light .pf-info-tile { background: rgba(255,255,255,0.55); border: 1px solid rgba(100,130,90,0.13); }
        .pf-light .pf-tile-icon { background: rgba(90,138,74,0.1); color: #5a8a4a; }
        .pf-light .pf-tile-label { color: #8a9e80; }
        .pf-light .pf-tile-value { color: #2d3a28; }

        /* Drawer */
        .pf-light .pf-drawer { background: #ede8dc; border-left: 1px solid rgba(90,138,74,0.2); }
        .pf-light .pf-drawer-header { border-bottom: 1px solid rgba(100,130,90,0.12); }
        .pf-light .pf-drawer-title { color: #2d3a28; }
        .pf-light .pf-drawer-dept { color: #7a8e70; }
        .pf-light .pf-drawer-close { background: rgba(255,255,255,0.4); border: 1px solid rgba(100,130,90,0.18); color: #6a7e60; }
        .pf-light .pf-drawer-close:hover { background: rgba(200,60,60,0.1); border-color: rgba(200,60,60,0.25); color: #c04040; }
        .pf-light .pf-detail-desc { color: #6a7e60; }
        .pf-light .pf-detail-stat { background: rgba(255,255,255,0.5); border: 1px solid rgba(100,130,90,0.12); }
        .pf-light .pf-detail-stat-icon { background: rgba(90,138,74,0.1); color: #5a8a4a; }
        .pf-light .pf-detail-stat-label { color: #8a9e80; }
        .pf-light .pf-detail-stat-val { color: #2d3a28; }
        .pf-light .pf-drawer-floor-badge { background: rgba(90,138,74,0.07); border: 1px solid rgba(90,138,74,0.2); color: #4a7a3a; }
        .pf-light .pf-status-toggle-row { background: rgba(255,255,255,0.5); border: 1px solid rgba(100,130,90,0.12); }
        .pf-light .pf-status-toggle-label { color: #6a7e60; }

        /* Slide panels */
        .pf-light .pf-slide-panel { background: #ede8dc; border-left: 1px solid rgba(90,138,74,0.22); }
        .pf-light .pf-slide-header { border-bottom: 1px solid rgba(100,130,90,0.12); }
        .pf-light .pf-slide-title { color: #2d3a28; }
        .pf-light .pf-slide-sub { color: #8a9e80; }
        .pf-light .pf-slide-close { background: rgba(255,255,255,0.4); border: 1px solid rgba(100,130,90,0.18); color: #6a7e60; }
        .pf-light .pf-slide-close:hover { background: rgba(200,60,60,0.1); border-color: rgba(200,60,60,0.25); color: #c04040; }

        /* Pins panel */
        .pf-light .pf-pins-floor-label { color: #5a8a4a; }
        .pf-light .pf-pins-floor-label::after { background: rgba(90,138,74,0.15); }
        .pf-light .pf-pins-card { background: rgba(255,255,255,0.5); border: 1px solid rgba(100,130,90,0.12); }
        .pf-light .pf-pins-card:hover { background: rgba(90,138,74,0.08); border-color: rgba(90,138,74,0.25); }
        .pf-light .pf-pins-card-icon { background: rgba(90,138,74,0.1); color: #5a8a4a; }
        .pf-light .pf-pins-card-name { color: #2d3a28; }
        .pf-light .pf-pins-card-floor { color: #8a9e80; }

        /* Analytics */
        .pf-light .pf-analytics-ticker { color: #8a9e80; }
        .pf-light .pf-spark-row { background: rgba(255,255,255,0.45); border: 1px solid rgba(100,130,90,0.1); }
        .pf-light .pf-spark-row:hover { background: rgba(90,138,74,0.06); border-color: rgba(90,138,74,0.18); }
        .pf-light .pf-spark-name { color: #2d3a28; }
        .pf-light .pf-spark-bar-bg { background: rgba(100,130,90,0.1); }
        .pf-light .pf-analytics-note { color: #9aae90; }

        /* Admin editor bar */
        .pf-light .pf-editor-bar { background: rgba(176,128,48,0.05); border: 1px solid rgba(176,128,48,0.2); }
        .pf-light .pf-editor-input { background: rgba(255,255,255,0.6); border: 1px solid rgba(100,130,90,0.18); color: #2d3a28; }
        .pf-light .pf-editor-input:focus { border-color: #b08030; }
        .pf-light .pf-editor-input::placeholder { color: #9aae90; }
        .pf-light .pf-editor-hint { color: #8a9e80; }
        .pf-light .pf-pin-list-item { background: rgba(255,255,255,0.45); border: 1px solid rgba(100,130,90,0.1); color: #6a7e60; }

        /* Images panel */
        .pf-light .pf-images-floor-name { color: #2d3a28; }
        .pf-light .pf-images-floor-count { color: #8a9e80; }
        .pf-light .pf-images-thumb { border: 1px solid rgba(100,130,90,0.15); background: rgba(255,255,255,0.4); }
        .pf-light .pf-images-thumb-label { background: rgba(237,232,220,0.88); color: #8a9e80; }
        .pf-light .pf-images-placeholder { border: 1px dashed rgba(100,130,90,0.2); }
        .pf-light .pf-images-placeholder span { color: #9aae90; }

        /* Mobile overlay */
        .pf-light.pf-app + .pf-mobile-overlay { background: rgba(200,195,185,0.6); }

        /* Walk-forward animation */
        .pf-sv-walk-out-fwd {
          animation: svWalkOutFwd 0.38s cubic-bezier(0.4,0,0.2,1) forwards;
          z-index: 1;
        }
        .pf-sv-walk-in-fwd {
          animation: svWalkInFwd 0.38s cubic-bezier(0.4,0,0.2,1) forwards;
          z-index: 2;
        }
        @keyframes svWalkOutFwd {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.13); }
        }
        @keyframes svWalkInFwd {
          from { opacity: 0; transform: scale(1.13); }
          to   { opacity: 1; transform: scale(1); }
        }
        .pf-sv-walk-out-bwd {
          animation: svWalkOutBwd 0.38s cubic-bezier(0.4,0,0.2,1) forwards;
          z-index: 1;
        }
        .pf-sv-walk-in-bwd {
          animation: svWalkInBwd 0.38s cubic-bezier(0.4,0,0.2,1) forwards;
          z-index: 2;
        }
        @keyframes svWalkOutBwd {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.89); }
        }
        @keyframes svWalkInBwd {
          from { opacity: 0; transform: scale(0.89); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* Hotspot portals */
        .pf-sv-hotspot {
          position: absolute; left: 50%; transform: translateX(-50%);
          z-index: 8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .pf-sv-hotspot-fwd { bottom: 18%; }
        .pf-sv-hotspot-bwd { top: 18%; }
        .pf-sv-hotspot-inner {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(30,120,255,0.15);
          border: 2px solid rgba(30,120,255,0.4);
          display: grid; place-items: center;
          color: rgba(255,255,255,0.7);
          box-shadow: 0 0 20px rgba(30,120,255,0.3), 0 0 40px rgba(30,120,255,0.1);
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
          animation: hotspotPulse 2.4s ease-in-out infinite;
        }
        .pf-sv-hotspot:hover .pf-sv-hotspot-inner {
          background: rgba(30,120,255,0.35);
          box-shadow: 0 0 28px rgba(30,120,255,0.6);
          transform: scale(1.1);
          animation: none;
        }
        @keyframes hotspotPulse {
          0%,100% { box-shadow: 0 0 20px rgba(30,120,255,0.3); opacity: 0.7; }
          50%      { box-shadow: 0 0 32px rgba(30,120,255,0.6); opacity: 1; }
        }

        /* Minimap overlay */
        .pf-sv-minimap {
          position: absolute; bottom: 220px; right: 14px; z-index: 12;
          width: 130px; height: 80px;
          border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(30,120,255,0.3);
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          pointer-events: none;
        }
        .pf-sv-minimap-img {
          width: 100%; height: 100%; object-fit: cover;
          opacity: 0.55; filter: brightness(0.7) saturate(0.5);
          display: block;
        }
        .pf-sv-minimap-dot {
          position: absolute; transform: translate(-50%, -50%);
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transition: all 0.3s;
        }
        .pf-sv-minimap-dot.active {
          background: #1e78ff; width: 10px; height: 10px;
          box-shadow: 0 0 8px rgba(30,120,255,0.9);
        }
        .pf-sv-minimap-label {
          position: absolute; bottom: 4px; right: 6px;
          font-size: 11px; color: #7fb3ff; font-weight: 700;
        }

        /* SV pin base */
        .pf-sv-pin {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center;
          cursor: pointer; z-index: 12;
          pointer-events: auto;
        }
        .pf-sv-pin-icon {
          position: relative;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 38%, #5ab4ff, #1a6fff 60%, #0a3bbf);
          box-shadow:
            0 0 0 3px rgba(100,180,255,0.25),
            0 0 10px rgba(30,120,255,0.7),
            0 0 22px rgba(30,120,255,0.4),
            inset 0 1px 3px rgba(255,255,255,0.45);
          display: grid; place-items: center;
          flex-shrink: 0;
          animation: svPinShine 2.4s ease-in-out infinite;
        }
        .pf-sv-pin-icon::before {
          content: '';
          position: absolute;
          top: 3px; left: 5px;
          width: 7px; height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.55);
          filter: blur(1px);
        }
        .pf-sv-pin-icon.edit {
          background: radial-gradient(circle at 38% 38%, #ffcc60, #ff8800 60%, #cc5500);
          box-shadow:
            0 0 0 3px rgba(255,180,60,0.25),
            0 0 10px rgba(255,140,0,0.7),
            0 0 22px rgba(255,100,0,0.4),
            inset 0 1px 3px rgba(255,255,255,0.35);
        }
        @keyframes svPinShine {
          0%, 100% { box-shadow: 0 0 0 3px rgba(100,180,255,0.25), 0 0 10px rgba(30,120,255,0.7), 0 0 22px rgba(30,120,255,0.4), inset 0 1px 3px rgba(255,255,255,0.45); }
          50%       { box-shadow: 0 0 0 5px rgba(100,180,255,0.35), 0 0 18px rgba(30,120,255,0.9), 0 0 36px rgba(30,120,255,0.55), inset 0 1px 3px rgba(255,255,255,0.45); }
        }
        .pf-sv-pin-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 4px rgba(255,255,255,0.9);
        }
        .pf-sv-pin-label {
          background: rgba(6,10,24,0.88);
          border: 1px solid rgba(30,120,255,0.35);
          color: #c8dfff;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 600;
          padding: 3px 8px; border-radius: 6px;
          white-space: nowrap;
          margin-top: 5px;
          pointer-events: none;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
          opacity: 0; transform: translateY(4px);
          transition: opacity 0.18s, transform 0.18s;
        }
        .pf-sv-pin:hover .pf-sv-pin-label { opacity: 1; transform: translateY(0); }
        .pf-sv-pin-del {
          position: absolute; top: -8px; right: -8px;
          width: 16px; height: 16px;
          background: rgba(220,30,30,0.85); border: none;
          border-radius: 50%; color: #fff;
          font-size: 11px; line-height: 1;
          cursor: pointer; display: grid; place-items: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .pf-sv-pin-del:hover { background: #ff2020; }

        /* Pending pin */
        .pf-sv-pin-pending { z-index: 15; }
        .pf-sv-pin-pending .pf-sv-pin-dot {
          animation: pendingPulse 0.9s ease-in-out infinite;
          background: #ffb340 !important;
          box-shadow: 0 0 10px rgba(255,179,64,0.8) !important;
        }
        @keyframes pendingPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.6); opacity: 0.6; }
        }
        .pf-sv-pin-name-popup {
          position: absolute; left: 16px; top: -8px;
          display: flex; align-items: center; gap: 4px;
          background: rgba(6,10,20,0.96);
          border: 1px solid rgba(30,120,255,0.4);
          border-radius: 10px; padding: 6px 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          min-width: 200px; white-space: nowrap;
          animation: tutSlideUp 0.2s ease;
        }
        .pf-sv-pin-name-input {
          background: transparent; border: none; outline: none;
          color: #e0eaff; font-size: 13px;
          font-family: 'DM Sans', sans-serif; width: 130px;
        }
        .pf-sv-pin-name-input::placeholder { color: #3d5070; }
        .pf-sv-pin-confirm-btn {
          background: rgba(30,120,255,0.2); border: 1px solid rgba(30,120,255,0.4);
          color: #7fb3ff; border-radius: 6px; width: 24px; height: 24px;
          font-size: 12px; cursor: pointer; display: grid; place-items: center;
          transition: background 0.15s;
        }
        .pf-sv-pin-confirm-btn:hover:not(:disabled) { background: rgba(30,120,255,0.4); color: #fff; }
        .pf-sv-pin-confirm-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pf-sv-pin-cancel-btn {
          background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.25);
          color: #ff7070; border-radius: 6px; width: 24px; height: 24px;
          font-size: 12px; cursor: pointer; display: grid; place-items: center;
          transition: background 0.15s;
        }
        .pf-sv-pin-cancel-btn:hover { background: rgba(255,80,80,0.25); }

        /* Floating left/right arrows on image */
        .pf-sv-float-arrow {
          position: absolute; top: 50%; z-index: 8;
          transform: translateY(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; border-radius: 14px;
          padding: 14px 10px;
          cursor: pointer; font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          backdrop-filter: blur(6px);
          pointer-events: auto;
        }
        .pf-sv-float-arrow:hover {
          background: rgba(30,120,255,0.45);
          border-color: rgba(30,120,255,0.7);
          transform: translateY(-50%) scale(1.08);
        }
        .pf-sv-float-arrow-left { left: 18px; }
        .pf-sv-float-arrow-right { right: 18px; }

        /* Side view nav button in bottom bar */
        .pf-sv-nav-btn-side {
          background: rgba(30,120,255,0.12);
          border-color: rgba(30,120,255,0.3);
          color: #7fb3ff;
          padding: 10px 16px;
          font-size: 12px;
        }
        .pf-sv-nav-btn-side.active {
          background: rgba(30,120,255,0.28);
          border-color: rgba(30,120,255,0.6);
          color: #fff;
        }
        .pf-sv-nav-btn-side:hover:not(:disabled) {
          background: rgba(30,120,255,0.35);
          border-color: rgba(30,120,255,0.7);
        }
        .pf-sv-sidebar {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 240px;
          background: linear-gradient(180deg, rgba(6,10,20,0.97) 0%, rgba(4,8,18,0.97) 100%);
          border-right: 1px solid rgba(30,120,255,0.15);
          z-index: 20;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          backdrop-filter: blur(12px);
        }
        .pf-sv-sidebar.open { transform: translateX(0); }

        .pf-sv-sidebar-header {
          display: flex; align-items: center; gap: 8px;
          padding: 56px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
          color: #7fb3ff; text-transform: uppercase;
        }
        .pf-sv-sidebar-toggle {
          margin-left: auto; background: none; border: none;
          color: #4a6080; cursor: pointer; padding: 2px;
          display: grid; place-items: center;
          transition: color 0.2s;
        }
        .pf-sv-sidebar-toggle:hover { color: #7fb3ff; }

        .pf-sv-sidebar-list {
          flex: 1; overflow-y: auto; padding: 10px 10px;
          scrollbar-width: thin; scrollbar-color: rgba(30,120,255,0.2) transparent;
        }
        .pf-sv-sidebar-empty {
          font-size: 12px; color: #3d5070; text-align: center;
          padding: 24px 12px; line-height: 1.6;
        }
        .pf-sv-sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          border: 1px solid transparent;
          cursor: pointer; margin-bottom: 6px;
          transition: background 0.18s, border-color 0.18s;
          background: rgba(255,255,255,0.03);
        }
        .pf-sv-sidebar-item:hover {
          background: rgba(30,120,255,0.1);
          border-color: rgba(30,120,255,0.25);
        }
        .pf-sv-sidebar-item.active {
          background: rgba(30,120,255,0.15);
          border-color: rgba(30,120,255,0.4);
        }
        .pf-sv-sidebar-item-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          background: rgba(30,120,255,0.5);
          box-shadow: 0 0 6px rgba(30,120,255,0.4);
        }
        .pf-sv-sidebar-item.active .pf-sv-sidebar-item-dot {
          background: #1e78ff;
          box-shadow: 0 0 10px rgba(30,120,255,0.8);
        }
        .pf-sv-sidebar-item-info { flex: 1; min-width: 0; }
        .pf-sv-sidebar-item-name {
          font-size: 13px; font-weight: 600; color: #ccd6e8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .pf-sv-sidebar-item-loc {
          font-size: 10px; color: #3d5070; line-height: 1.4;
        }
        .pf-sv-sidebar-item-voice {
          font-size: 11px; color: #2a4060;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .pf-sv-sidebar-item:hover .pf-sv-sidebar-item-voice { color: #1e78ff; }

        /* Sidebar tab (collapse toggle floating on edge) */
        .pf-sv-sidebar-tab {
          position: absolute; top: 50%; left: 0;
          transform: translateY(-50%);
          z-index: 21;
          width: 22px; height: 48px; border-radius: 0 10px 10px 0;
          background: rgba(10,18,36,0.95);
          border: 1px solid rgba(30,120,255,0.2);
          border-left: none;
          color: #4a6080; cursor: pointer;
          display: grid; place-items: center;
          transition: left 0.3s cubic-bezier(0.4,0,0.2,1), color 0.2s, background 0.2s;
        }
        .pf-sv-sidebar-tab.open { left: 240px; }
        .pf-sv-sidebar-tab:hover { background: rgba(30,120,255,0.2); color: #7fb3ff; }

        /* Voice active bar */
        .pf-sv-voice-bar {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px;
          border-top: 1px solid rgba(30,120,255,0.15);
          font-size: 11px; color: #4a90d9;
          background: rgba(30,120,255,0.06);
        }
        .pf-sv-voice-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #1e78ff;
          animation: voicePulse 0.8s ease-in-out infinite;
        }
        .pf-sv-voice-dot:nth-child(2) { animation-delay: 0.15s; }
        .pf-sv-voice-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes voicePulse {
          0%,100% { transform: scaleY(0.5); opacity: 0.4; }
          50%      { transform: scaleY(1.4); opacity: 1; }
        }
        @media (max-width: 860px) {
          body { overflow: auto; }
          .pf-app { grid-template-columns: 1fr; height: auto; min-height: 100vh; overflow: visible; }

          .pf-sidebar {
            position: fixed;
            top: 0; left: 0;
            height: 100vh;
            width: 290px;
            z-index: 60;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
            overflow: hidden;
          }
          .pf-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 8px 0 40px rgba(0,0,0,0.6);
          }
          .pf-sidebar-inner {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          .pf-main {
            height: auto;
            min-height: 100vh;
            overflow: visible;
          }

          .pf-menu-btn { display: flex; }

          .pf-map-area {
            padding: 8px;
            height: 60vw;
            min-height: 280px;
            max-height: 420px;
            overflow: hidden;
          }
          .pf-map-viewport { min-height: 0; }
          .pf-floor-image { max-height: 100%; max-width: 100%; }

          .pf-info-strip { grid-template-columns: 1fr 1fr; }
          .pf-info-strip .pf-info-tile:last-child { display: none; }

          .pf-topbar { padding: 10px 12px; }
          .pf-topbar-left h2 { font-size: 20px; }
          .pf-topbar-right .pf-badge { display: none; }
          .pf-topbar-right { gap: 4px; }
          .pf-icon-btn { padding: 6px 8px; font-size: 11px; gap: 3px; }

          .pf-drawer { width: 100vw; max-width: 100vw; }
          .pf-slide-panel { width: 100vw; max-width: 100vw; }

          .pf-minimap { display: none; }
          .pf-announce-content { padding: 10px 14px; gap: 8px; }

          .pf-mobile-scroll-area {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: contain;
          }
        }

        @media (max-width: 480px) {
          .pf-topbar-right .pf-icon-btn:not(.accent):not(.danger) { display: none; }
          .pf-map-area { height: 55vw; min-height: 240px; max-height: 340px; }
          .pf-info-strip { grid-template-columns: 1fr 1fr; gap: 6px; }
          .pf-floor-image { max-height: 100%; }
        }

        /* ── STREET VIEW ── */
        .pf-sv-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: #000;
          display: flex; flex-direction: column;
          animation: svOverlayIn 0.3s ease;
          cursor: default;
        }
        @keyframes svOverlayIn { from { opacity: 0 } to { opacity: 1 } }

        /* Clock in topbar */
        .pf-topbar-clock {
          font-size: 13px; font-weight: 700; letter-spacing: 0.06em;
          color: rgba(255,255,255,0.45);
          font-variant-numeric: tabular-nums;
          padding: 0 4px;
        }
        .pf-light .pf-topbar-clock { color: rgba(40,60,30,0.5); }

        /* Map image shimmer while loading */
        .pf-floor-image.loading {
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .pf-floor-image {
          transition: opacity 0.4s ease;
        }

        /* Street View shortcut button in drawer */
        .pf-drawer-sv-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; margin-top: 14px;
          padding: 11px 16px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(30,120,255,0.15), rgba(30,120,255,0.08));
          border: 1px solid rgba(30,120,255,0.3);
          color: #7fb3ff; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .pf-drawer-sv-btn:hover {
          background: linear-gradient(135deg, rgba(30,120,255,0.3), rgba(30,120,255,0.18));
          border-color: rgba(30,120,255,0.6);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(30,120,255,0.25);
        }

        .pf-sv-topbar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%);
        }
        .pf-sv-badge {
          display: flex; align-items: center; gap: 8px;
          background: rgba(30,120,255,0.18); border: 1px solid rgba(30,120,255,0.35);
          border-radius: 20px; padding: 5px 14px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: #7fb3ff;
        }
        .pf-sv-beta-tag {
          background: linear-gradient(90deg,#ff6b35,#ff3b8a);
          color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
          padding: 2px 6px; border-radius: 8px; margin-left: 4px;
        }
        .pf-sv-close {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18);
          color: #fff; border-radius: 50%; width: 36px; height: 36px;
          display: grid; place-items: center; cursor: pointer; font-size: 18px; line-height: 1;
          transition: background 0.2s;
        }
        .pf-sv-close:hover { background: rgba(220,50,50,0.35); border-color: rgba(220,50,50,0.5); }

        .pf-sv-image-wrap {
          flex: 1; position: relative; overflow: hidden;
          cursor: grab;
        }
        .pf-sv-image-wrap.sv-dragging { cursor: grabbing; }
        .pf-sv-image-wrap.sv-edit { cursor: crosshair; }
        /* All overlay UI on top of image-wrap must reset cursor */
        .pf-sv-topbar, .pf-sv-topbar *,
        .pf-sv-edit-toggle, .pf-sv-editor-bar, .pf-sv-editor-bar *,
        .pf-sv-sidebar, .pf-sv-sidebar *,
        .pf-sv-sidebar-tab,
        .pf-sv-bottombar, .pf-sv-bottombar *,
        .pf-sv-minimap,
        .pf-sv-dir-badge,
        .pf-sv-zoom-hint,
        .pf-sv-float-arrow, .pf-sv-hotspot,
        .pf-sv-pin-name-popup, .pf-sv-pin-name-popup * {
          cursor: default;
        }
        .pf-sv-close, .pf-sv-edit-toggle, .pf-sv-editor-save-btn,
        .pf-sv-nav-btn, .pf-sv-pos-dot, .pf-sv-flip-btn,
        .pf-sv-zoom-reset, .pf-sv-float-arrow, .pf-sv-hotspot,
        .pf-sv-sidebar-toggle, .pf-sv-sidebar-item, .pf-sv-sidebar-tab,
        .pf-sv-pin-confirm-btn, .pf-sv-pin-cancel-btn, .pf-sv-pin-del {
          cursor: pointer !important;
        }
        .pf-sv-image {
          width: 100%; height: 100%; object-fit: cover;
          user-select: none; pointer-events: none;
          transform-origin: center center;
          will-change: transform, opacity;
          position: absolute; inset: 0;
        }
        .pf-sv-image-out {
          animation: svFadeOut 0.42s ease forwards;
          z-index: 1;
        }
        .pf-sv-image-in {
          animation: svFadeIn2 0.42s ease forwards;
          z-index: 2;
        }
        @keyframes svFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes svFadeIn2 {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .pf-sv-zoom-hint {
          position: absolute; bottom: 145px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.4);
          font-size: 10px; padding: 3px 12px; border-radius: 10px;
          pointer-events: none; letter-spacing: 0.06em; white-space: nowrap;
        }
        .pf-sv-zoom-reset {
          position: absolute; bottom: 148px; right: 12px; z-index: 10;
          background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7); border-radius: 12px; padding: 4px 10px;
          font-size: 11px; cursor: pointer; transition: all 0.2s;
        }
        .pf-sv-zoom-reset:hover { background: rgba(30,120,255,0.35); color: #fff; }

        /* Direction flip button (front/back) */
        .pf-sv-flip-btn {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.25);
          color: #fff; border-radius: 50%; width: 48px; height: 48px;
          display: grid; place-items: center; cursor: pointer; font-size: 20px;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          z-index: 5;
        }
        .pf-sv-flip-btn:hover { background: rgba(30,120,255,0.4); transform: translate(-50%,-50%) scale(1.1); }

        /* Direction label */
        .pf-sv-dir-badge {
          position: absolute; top: 70px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px; padding: 4px 14px; font-size: 11px; color: #aac8ff;
          letter-spacing: 0.08em; font-weight: 600; pointer-events: none;
          z-index: 5;
        }

        .pf-sv-bottombar {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
          padding: 24px 20px 20px;
          display: flex; flex-direction: column; gap: 14px; align-items: center;
        }

        /* Position indicator dots */
        .pf-sv-positions {
          display: flex; gap: 8px; align-items: center;
        }
        .pf-sv-pos-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.3);
          transition: all 0.2s;
          cursor: pointer;
        }
        .pf-sv-pos-dot.active {
          background: #1e78ff; border-color: #7fb3ff;
          box-shadow: 0 0 8px rgba(30,120,255,0.7);
          width: 10px; height: 10px;
        }
        .pf-sv-pos-label {
          font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 0.06em;
        }

        /* Navigate arrows */
        .pf-sv-nav {
          display: flex; gap: 12px; align-items: center;
        }
        .pf-sv-nav-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
          color: #fff; border-radius: 28px; padding: 10px 22px;
          cursor: pointer; font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
          transition: all 0.2s;
        }
        .pf-sv-nav-btn:hover:not(:disabled) {
          background: rgba(30,120,255,0.3); border-color: rgba(30,120,255,0.6);
          transform: translateY(-1px); box-shadow: 0 4px 16px rgba(30,120,255,0.3);
        }
        .pf-sv-nav-btn:disabled { opacity: 0.28; cursor: not-allowed; }
        .pf-sv-nav-pos-info {
          font-size: 12px; color: rgba(255,255,255,0.45); min-width: 70px; text-align: center;
        }

        /* Street View trigger button (on the map) */
        .pf-sv-trigger {
          position: absolute; bottom: 56px; right: 14px; z-index: 12;
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg,rgba(30,120,255,0.22),rgba(30,120,255,0.1));
          border: 1px solid rgba(30,120,255,0.45); color: #7fb3ff;
          border-radius: 20px; padding: 8px 16px; cursor: pointer;
          font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
          backdrop-filter: blur(8px);
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(30,120,255,0.2);
          animation: svPulse 2.5s infinite;
        }
        .pf-sv-trigger:hover {
          background: linear-gradient(135deg,rgba(30,120,255,0.4),rgba(30,120,255,0.2));
          border-color: rgba(30,120,255,0.7); color: #b0d0ff;
          transform: translateY(-1px); box-shadow: 0 6px 24px rgba(30,120,255,0.35);
        }
        @keyframes svPulse {
          0%,100% { box-shadow: 0 4px 16px rgba(30,120,255,0.2); }
          50%      { box-shadow: 0 4px 24px rgba(30,120,255,0.45); }
        }
        .pf-sv-trigger-beta {
          background: linear-gradient(90deg,#ff6b35,#ff3b8a);
          color: #fff; font-size: 9px; padding: 1px 5px; border-radius: 6px; margin-left: 2px;
        }

        /* ── STREET VIEW PINS ── */
        /* ── STREET VIEW DOTS (replaces pins) ── */
        .pf-sv-dot {
          position: absolute; transform: translate(-50%, -50%);
          cursor: pointer; z-index: 20; user-select: none;
        }
        .pf-sv-dot-circle {
          width: 14px; height: 14px; border-radius: 50%;
          background: rgba(30,120,255,0.85);
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 0 0 3px rgba(30,120,255,0.25), 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .pf-sv-dot:hover .pf-sv-dot-circle,
        .pf-sv-dot.selected .pf-sv-dot-circle {
          transform: scale(1.35);
          box-shadow: 0 0 0 5px rgba(30,120,255,0.3), 0 2px 12px rgba(30,120,255,0.5);
          background: #1e78ff;
        }
        .pf-sv-dot.edit-dot { cursor: grab; }
        .pf-sv-dot.edit-dot:active { cursor: grabbing; }
        .pf-sv-dot.edit-dot .pf-sv-dot-circle { background: rgba(255,170,48,0.85); border-color: #ffaa30; box-shadow: 0 0 0 3px rgba(255,170,48,0.25); }
        .pf-sv-dot.voice-active .pf-sv-dot-circle {
          background: #00e5ff; border-color: #fff;
          animation: svDotGlow 1s ease-in-out infinite;
        }
        @keyframes svDotGlow {
          0%,100% { box-shadow: 0 0 0 3px rgba(0,229,255,0.2), 0 0 12px rgba(0,229,255,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(0,229,255,0.35), 0 0 22px rgba(0,229,255,0.65); }
        }
        .pf-sv-dot-del {
          position: absolute; top: -6px; right: -6px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #e53e3e; color: #fff; border: none;
          font-size: 10px; line-height: 1; cursor: pointer;
          display: grid; place-items: center; z-index: 21;
        }

        /* Info panel — slides in from right */
        .pf-sv-info-panel {
          position: absolute; top: 60px; right: 0; bottom: 0;
          width: 220px; z-index: 25;
          background: rgba(6,10,18,0.92);
          border-left: 1px solid rgba(30,120,255,0.2);
          backdrop-filter: blur(16px);
          display: flex; flex-direction: column;
          animation: svInfoIn 0.2s ease;
          overflow: hidden;
        }
        @keyframes svInfoIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .pf-sv-info-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .pf-sv-info-name {
          font-size: 14px; font-weight: 700; color: #e8f0ff;
          flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pf-sv-info-close {
          background: none; border: none; color: rgba(255,255,255,0.4);
          cursor: pointer; font-size: 16px; line-height: 1; padding: 2px;
          transition: color 0.2s; flex-shrink: 0;
        }
        .pf-sv-info-close:hover { color: #fff; }
        .pf-sv-info-body { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .pf-sv-info-row {
          display: flex; flex-direction: column; gap: 4px;
        }
        .pf-sv-info-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.35); text-transform: uppercase;
        }
        .pf-sv-info-value {
          font-size: 13px; color: #c8d8f0; font-weight: 500;
        }
        .pf-sv-info-value.empty { color: rgba(255,255,255,0.2); font-style: italic; font-size: 12px; }
        .pf-sv-info-input {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          color: #fff; border-radius: 8px; padding: 5px 9px; font-size: 12px;
          outline: none; width: 100%; transition: border-color 0.2s;
        }
        .pf-sv-info-input:focus { border-color: rgba(30,120,255,0.5); }
        .pf-sv-info-edit-btn {
          margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 5px;
          background: rgba(30,120,255,0.12); border: 1px solid rgba(30,120,255,0.3);
          color: #7fb3ff; border-radius: 10px; padding: 5px 10px;
          font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .pf-sv-info-edit-btn:hover { background: rgba(30,120,255,0.25); }
        .pf-sv-info-save-btn {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          background: rgba(30,200,100,0.15); border: 1px solid rgba(30,200,100,0.35);
          color: #40e090; border-radius: 10px; padding: 5px 10px;
          font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 4px;
        }
        .pf-sv-info-save-btn:hover { background: rgba(30,200,100,0.25); }
        /* SV edit toggle button */
        .pf-sv-edit-toggle {
          position: absolute; top: 60px; right: 16px; z-index: 30;
          display: flex; align-items: center; gap: 6px;
          background: rgba(8,12,20,0.8); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.7); border-radius: 20px; padding: 6px 14px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          backdrop-filter: blur(8px); transition: all 0.2s;
        }
        .pf-sv-edit-toggle.active {
          background: rgba(255,170,48,0.18); border-color: rgba(255,170,48,0.45); color: #ffaa30;
        }
        /* SV pin editor toolbar */
        .pf-sv-editor-bar {
          position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
          z-index: 30; display: flex; align-items: center; gap: 8px;
          background: rgba(8,12,20,0.88); border: 1px solid rgba(255,170,48,0.35);
          border-radius: 24px; padding: 7px 14px;
          backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .pf-sv-editor-input {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; border-radius: 14px; padding: 5px 12px;
          font-size: 12px; outline: none; width: 140px;
        }
        .pf-sv-editor-input::placeholder { color: rgba(255,255,255,0.35); }
        .pf-sv-editor-input:focus { border-color: rgba(255,170,48,0.5); }
        .pf-sv-editor-add-btn {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,170,48,0.18); border: 1px solid rgba(255,170,48,0.4);
          color: #ffaa30; border-radius: 14px; padding: 5px 12px;
          font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .pf-sv-editor-add-btn:hover { background: rgba(255,170,48,0.3); }
        .pf-sv-editor-save-btn {
          display: flex; align-items: center; gap: 5px;
          background: rgba(30,120,255,0.2); border: 1px solid rgba(30,120,255,0.45);
          color: #7fb3ff; border-radius: 14px; padding: 5px 12px;
          font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .pf-sv-editor-save-btn:hover { background: rgba(30,120,255,0.35); }
        .pf-sv-editor-hint { font-size: 10px; color: rgba(255,170,48,0.6); white-space: nowrap; }
      `}</style>

      {/* Mobile sidebar overlay */}
      <div className={`pf-mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className={`pf-app${lightMode ? " pf-light" : ""}${simpleUIMode ? " simple-ui" : ""}`}>

        {/* SIDEBAR */}
        <aside className={`pf-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
          <div className="pf-sidebar-inner">
            <div className={`pf-brand ${mounted ? "show" : ""}`}>
              <div className="pf-brand-icon"><School size={20} color="#fff" /></div>
              <div className="pf-brand-text">
                <div className="pf-brand-title-row">
                  <h1>PATHFINDER</h1>
                  <div className="pf-brand-clock">
                    <Clock size={10} />
                    {currentTime.toLocaleTimeString()}
                  </div>
                </div>
                <p>Gordon College Navigation</p>
              </div>
            </div>

            {/* Search */}
            <div className={`pf-panel ${mounted ? "show" : ""}`}>
              <div className="pf-panel-title pf-panel-toggle" onClick={() => toggleTray("search")}>
                <Search size={13} /><span>Search</span>
                <span className={`pf-tray-chevron ${openTrays.search ? "open" : ""}`}>‹</span>
              </div>
              {openTrays.search && (
                <>
                  <div className="pf-search-box">
                    <Search size={14} color="#4a6080" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === "Escape" && (setSearchTerm(""), setSelectedLocation(null))}
                      placeholder="Search rooms, offices..." />
                    {searchTerm && <button className="pf-clear-btn" onClick={() => { setSearchTerm(""); setSelectedLocation(null); }}><X size={14} /></button>}
                  </div>
                  {searchTerm && matchingFloors.length > 0 && (
                    <div className="pf-search-results">
                      {matchingFloors.map(f => (
                        <button key={f.id} className="pf-result-card" onClick={() => goToFloor(f.id)}>
                          <div><strong>{f.name}</strong><span>{f.matches.join(", ")}</span></div>
                          <ChevronRight size={14} color="#4a6080" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Floors */}
            <div className={`pf-panel ${mounted ? "show" : ""}`}>
              <div className="pf-panel-title pf-panel-toggle" onClick={() => toggleTray("floors")}>
                <Layers3 size={13} /><span>Floors</span>
                <span className={`pf-tray-chevron ${openTrays.floors ? "open" : ""}`}>‹</span>
              </div>
              {openTrays.floors && (
                <div className="pf-floor-grid">
                  {floors.map(f => (
                    <div key={f.id} className="pf-floor-btn-wrap">
                      <button
                        className={`pf-floor-btn ${selectedFloor === f.id ? "active" : ""} ${hiddenFloors[f.id] ? "hidden-floor" : ""}`}
                        onClick={() => goToFloor(f.id)}
                      >
                        {f.name}
                        {hiddenFloors[f.id] && <span className="pf-floor-hidden-badge">HIDDEN</span>}
                      </button>
                      {isAdmin && (
                        <button
                          className="pf-floor-toggle-btn"
                          title={hiddenFloors[f.id] ? "Show floor map" : "Hide floor map"}
                          onClick={e => { e.stopPropagation(); toggleFloorVisibility(f.id); }}
                        >
                          {hiddenFloors[f.id] ? <Eye size={11} /> : <EyeOff size={11} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Locations */}
            <div className={`pf-panel ${mounted ? "show" : ""}`}>
              <div className="pf-panel-title pf-panel-toggle" onClick={() => toggleTray("locations")}>
                <Building2 size={13} /><span>Locations · {currentFloor.name}</span>
                <span className={`pf-tray-chevron ${openTrays.locations ? "open" : ""}`}>‹</span>
              </div>
              {openTrays.locations && (
                <div className="pf-location-list">
                  {filteredLocations.map((loc, i) => {
                    const st = getStatus(loc);
                    return (
                      <div key={i} className={`pf-location-item ${selectedLocation === loc ? "active" : ""}`}
                        onClick={() => { setSelectedLocation(loc); openDetail(loc); setSidebarOpen(false); const pin = currentFloor.pins.find(p => p.name === loc); if (pin) { setPosition({ x: -(pin.x - 0.5) * 300, y: -(pin.y - 0.5) * 200 }); setScale(1.8); } }}>
                        <div className="pf-location-left"><div className="pf-location-dot" /><span>{loc}</span></div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span className={`pf-loc-status ${st.toLowerCase()}`}>{st}</span>
                          <button className="pf-info-btn" onClick={e => { e.stopPropagation(); openDetail(loc); setSidebarOpen(false); }}><Info size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin pin editor */}
            {isAdmin && (
              <div className={`pf-editor-bar ${mounted ? "show" : ""}`}>
                <div className="pf-editor-title pf-panel-toggle" onClick={() => toggleTray("pinEditor")}>
                  <Edit3 size={13} /> Pin Editor
                  <span className={`pf-tray-chevron pf-tray-chevron-gold ${openTrays.pinEditor ? "open" : ""}`}>‹</span>
                </div>
                {openTrays.pinEditor && (
                  <>
                    <div className="pf-editor-add">
                      <input className="pf-editor-input" placeholder="New pin name…" value={newPinName}
                        onChange={e => setNewPinName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addPin()} />
                      <button className="pf-add-btn" onClick={addPin}><Plus size={13} /> Add</button>
                    </div>
                    {currentFloor.pins.length > 0 && (
                      <div className="pf-pin-list">
                        {currentFloor.pins.map((pin, i) => (
                          <div key={i} className="pf-pin-list-item">
                            <div className="pf-pin-list-name"><div className="pf-pin-list-dot" /><span>{pin.name}</span></div>
                            <button className="pf-pin-del-btn" onClick={() => deletePin(i)}><Trash2 size={13} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="pf-editor-hint">{editMode ? "🟠 Edit mode ON — drag pins to reposition." : "Enable edit mode to drag pins on the map."}</p>
                    <div className="pf-save-row">
                      <button className="pf-save-btn" onClick={savePins} disabled={saving}><Save size={13} />{saving ? "Saving…" : "Save to Firestore"}</button>
                      {saveMsg && <span className="pf-save-msg">{saveMsg}</span>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom buttons: Settings + Sign Out */}
            <div className="pf-bottom-btns">
              <button className="pf-settings-btn" onClick={() => setShowSettings(v => !v)}>
                <span style={{fontSize:15}}>⚙️</span><span>Settings</span>
              </button>
              {onLogout && <button className="pf-logout-btn" onClick={onLogout}><LogOut size={14} /><span>Sign Out</span></button>}
            </div>

            {/* Settings tray */}
            {showSettings && (
              <div className="pf-settings-tray">
                <div className="pf-settings-tray-title">⚙️ Settings</div>
                <div className="pf-settings-row">
                  <div className="pf-settings-label">
                    <span style={{fontSize:15}}>⚡</span>
                    <span>{simpleUIMode ? "Simple UI: On" : "Simple UI: Off"}</span>
                  </div>
                  <button className={`pf-mode-toggle ${simpleUIMode ? "light" : "dark"}`} onClick={() => setSimpleUIMode(v => !v)}>
                    <span className="pf-mode-toggle-knob" />
                  </button>
                </div>
                <div className="pf-settings-row">
                  <div className="pf-settings-label">
                    <span style={{fontSize:15}}>{lightMode ? "☀️" : "🌙"}</span>
                    <span>{lightMode ? "Light Mode" : "Dark Mode"}</span>
                  </div>
                  <button className={`pf-mode-toggle ${lightMode ? "light" : "dark"}`} onClick={() => setLightMode(v => !v)}>
                    <span className="pf-mode-toggle-knob" />
                  </button>
                </div>
                <div className="pf-settings-row">
                  <div className="pf-settings-label">
                    <span style={{fontSize:15}}>{soundEnabled ? "🔊" : "🔇"}</span>
                    <span>{soundEnabled ? "Button Sound" : "Button Sound Off"}</span>
                  </div>
                  <button className={`pf-mode-toggle ${soundEnabled ? "light" : "dark"}`} onClick={() => setSoundEnabled(v => !v)}>
                    <span className="pf-mode-toggle-knob" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <main className="pf-main pf-mobile-scroll-area">

          {/* ANNOUNCEMENT BANNER */}
          {showAnnounce && !simpleUIMode && (
            <div className="pf-announce">
              <div className="pf-announce-bg" />
              <div className="pf-announce-overlay" />
              <div className="pf-announce-content">
                <div className="pf-announce-icon"><Megaphone size={16} /></div>
                {editingAnnounce ? (
                  <>
                    <input className="pf-announce-edit-input" value={announceDraft} onChange={e => setAnnounceDraft(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveAnnouncement()} autoFocus />
                    <div className="pf-announce-btns">
                      <button className="pf-announce-btn" onClick={saveAnnouncement}><Save size={12} />Save</button>
                      <button className="pf-announce-btn cancel" onClick={() => setEditingAnnounce(false)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pf-announce-text">
                      <div className="pf-announce-label">Announcement</div>
                      {announcement}
                    </div>
                    {isAdmin && (
                      <button className="pf-announce-btn" onClick={() => { setAnnounceDraft(announcement); setEditingAnnounce(true); }}>
                        <Edit3 size={12} />Edit
                      </button>
                    )}
                    <button className="pf-announce-close" onClick={() => setShowAnnounce(false)}><X size={15} /></button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TOPBAR */}
          <div className={`pf-topbar ${mounted ? "show" : ""}`}>
            <div className="pf-topbar-left">
              {/* Mobile hamburger */}
              <button className="pf-menu-btn" onClick={() => setSidebarOpen(v => !v)}>
                <Menu size={18} />
              </button>
              <div>
                <h2>{currentFloor.name}</h2>
                <p>{editMode ? "🟠 Pin edit mode — drag pins to move" : "Drag · Scroll/Pinch to zoom · Tap pins"}</p>
              </div>
            </div>
            <div className="pf-topbar-right">
              <div className="pf-topbar-clock">
                {currentTime.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
              </div>
              <button
                className="pf-icon-btn accent"
                onClick={() => setProfileOpen(true)}
                aria-label="Open profile editor"
              >
                <Users size={13} />
                <span style={{ marginLeft: 6 }}>{profileDraft.displayName || username}</span>
              </button>
              {onOpenMap && <button className="pf-icon-btn maps-highlight" onClick={onOpenMap}><Map size={13} />Maps</button>}
{onOpenForum && <button className="pf-icon-btn accent" onClick={onOpenForum}>💬 Forum</button>}
<button className="pf-icon-btn accent" onClick={() => setShowPinsPanel(true)}><List size={13} />Pins</button>
              <button className="pf-icon-btn accent" onClick={() => setShowAnalytics(true)}><BarChart2 size={13} />Stats</button>
              {isAdmin && (
                <>
                  <button className="pf-icon-btn accent" onClick={() => setShowImagesPanel(true)}><Images size={13} />Photos</button>
                </>
              )}
            </div>
          </div>

          {/* MAP AREA */}
          <div className="pf-main-grid">
            <div className="pf-map-panel">
              <div className="pf-map-area">
                <div
                  ref={mapViewportRef}
                  className={`pf-map-viewport ${mounted ? "show" : ""} ${editMode ? "edit-mode" : "grab"}`}
                  onMouseDown={handleMapMouseDown}
                  onMouseMove={e => { handleMapMouseMove(e); if (editMode) handleEditorMouseMove(e); }}
                  onMouseUp={() => { handleMapMouseUp(); handleEditorMouseUp(); }}
                  onMouseLeave={() => { handleMapMouseUp(); handleEditorMouseUp(); setScrollEnabled(false); }}
                  onWheel={handleWheel}
                  onDoubleClick={!editMode ? centerView : undefined}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Map hidden overlay */}
                  {isMapHidden && (
                    <div className="pf-map-hidden-overlay">
                      <div className="pf-map-hidden-icon"><EyeOff size={24} /></div>
                      <div className="pf-map-hidden-text">Floor Map Hidden</div>
                      <div className="pf-map-hidden-sub">This floor map is currently disabled</div>
                      {isAdmin && (
                        <button className="pf-icon-btn accent" style={{marginTop:8}} onClick={() => toggleFloorVisibility(selectedFloor)}>
                          <Eye size={13} /> Re-enable
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`pf-floor-chip ${editMode ? "edit-mode-chip" : ""}`}>{editMode ? "✏ EDIT MODE" : currentFloor.name}</div>
                  <div className="pf-zoom-controls">
                    <button className="pf-zoom-btn" onClick={() => setScale(s => Math.min(s + 0.25, 3))}>+</button>
                    <button className="pf-zoom-btn" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}>−</button>
                  </div>
                  <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 10, zIndex: 10 }}>
                    {isAdmin && (
                      <button className={`pf-map-edit-btn ${editMode ? "danger" : ""}`} onClick={() => setEditMode(v => !v)}>
                        <Move size={13} />{editMode ? "Exit Edit" : "Edit Pins"}
                      </button>
                    )}
                    <button className="pf-map-reset-btn" onClick={centerView}><Map size={13} />Reset</button>
                  </div>
                  <div className="pf-minimap">
                    <div className="pf-minimap-label">Floor Map</div>
                    <div className="pf-minimap-map">
                      <img src={allFloorImages[mapImageIndex] || currentFloor.image} className="pf-minimap-img" alt="minimap" draggable={false} />
                      {!isMapHidden && currentFloor.pins.map((pin, i) => (
                        <div key={i} className={`pf-minimap-pin ${selectedLocation === pin.name ? "active-pin" : ""}`}
                          style={{ left:`${pin.x*100}%`, top:`${pin.y*100}%` }} />
                      ))}
                      {(() => {
                        if (!mapViewportRef.current) return null;
                        const vw = mapViewportRef.current.clientWidth, vh = mapViewportRef.current.clientHeight;
                        const iW = Math.min(100,(vw/scale)/vw*100), iH = Math.min(100,(vh/scale)/vh*100);
                        const iL = Math.max(0,Math.min(100-iW,(-position.x/scale)/vw*100));
                        const iT = Math.max(0,Math.min(100-iH,(-position.y/scale)/vh*100));
                        return <div className="pf-minimap-viewport" style={{left:`${iL}%`,top:`${iT}%`,width:`${iW}%`,height:`${iH}%`}} />;
                      })()}
                    </div>
                  </div>

                  {/* Image switcher dots (if multiple images) */}
                  {allFloorImages.length > 1 && !isMapHidden && (
                    <div className="pf-img-switcher">
                      <span className="pf-img-label">IMG</span>
                      {allFloorImages.map((_, idx) => (
                        <button key={idx} className={`pf-img-dot ${mapImageIndex === idx ? "active" : ""}`}
                          onClick={e => { e.stopPropagation(); setMapImageIndex(idx); centerView(); }} />
                      ))}
                    </div>
                  )}

                  <div className="pf-map-transform" style={{ transform:`translate(${position.x}px,${position.y}px) scale(${scale})` }}>
                    <div className="pf-map-card">
                      <img ref={mapImageRef} src={allFloorImages[mapImageIndex] || currentFloor.image}
                        className={`pf-floor-image${mapImageLoaded ? "" : " loading"}`}
                        alt={currentFloor.name} draggable={false}
                        onLoad={() => setMapImageLoaded(true)} />
                      {!isMapHidden && (
                        <div className="pf-pin-layer">
                          {currentFloor.pins.map((pin, i) => {
                            const st = getStatus(pin.name);
                            return (
                              <button key={i} className={`pf-map-pin ${editMode ? "edit-pin" : ""}`}
                                style={{ left:`${pin.x*100}%`, top:`${pin.y*100}%` }}
                                onMouseDown={editMode ? e => { e.stopPropagation(); handlePinDragStart(e, currentFloor.id, i); } : undefined}
                                onClick={!editMode ? () => openDetail(pin.name) : undefined}>
                                <div className={`pf-pin-icon ${editMode ? "edit" : st==="Closed" ? "closed-pin" : selectedLocation===pin.name ? "active" : ""}`}>
                                  <div className="pf-pin-dot" />
                                </div>
                                {editMode && <button className="pf-pin-delete" onClick={e => { e.stopPropagation(); deletePin(i); }}>×</button>}
                                <div className="pf-pin-label">{pin.name}{st==="Closed" ? " 🔴" : ""}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Street View trigger — Floor 6 only */}
                  {(selectedFloor === 1 || selectedFloor === 6) && !isMapHidden && (
                    <button className="pf-sv-trigger" onClick={e => { e.stopPropagation(); setStreetViewPos(0); setStreetViewDir("front"); setStreetViewOpen(true); }}>
                      <Glasses size={15} />
                      Street View
                      <span className="pf-sv-trigger-beta">BETA</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!simpleUIMode && (
            <aside className={`pf-right-panel ${pinnedCollapsed ? "collapsed" : ""}`}>
              <div className={`pf-panel pf-pinned-panel ${mounted ? "show" : ""} ${pinnedCollapsed ? "collapsed" : ""}`}>
                <div className="pf-pinned-header">
                  <div className="pf-panel-title"><MapPinned size={13} /><span>Pinned Areas</span></div>
                  <button className="pf-pin-collapse-btn" onClick={() => setPinnedCollapsed(v => !v)}>
                    {pinnedCollapsed ? "Expand" : "Collapse"}
                  </button>
                </div>
                {!pinnedCollapsed && (
                  <>
                    <div className="pf-pin-tabs">
                      <button className={`pf-pin-tab ${pinnedTab === "current" ? "active" : ""}`} onClick={() => setPinnedTab("current")}>This Floor</button>
                      <button className={`pf-pin-tab ${pinnedTab === "all" ? "active" : ""}`} onClick={() => setPinnedTab("all")}>All Floors</button>
                    </div>
                    <div className="pf-pinned-list">
                      {pinnedTab === "current" ? (
                        currentFloor.pins.length > 0 ? currentFloor.pins.map((pin, i) => {
                          const st = getStatus(pin.name);
                          return (
                            <button key={i} className="pf-pinned-item" onClick={() => openDetail(pin.name)}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth:0 }}>
                                <span className="pf-pinned-name">{pin.name}</span>
                                <span className="pf-pinned-floor">{currentFloor.name}</span>
                              </div>
                              <span className={`pf-loc-status ${st.toLowerCase()}`}>{st}</span>
                            </button>
                          );
                        }) : <div className="pf-pinned-empty">No pinned areas on this floor.</div>
                      ) : (
                        allPinsGrouped.map(group => group.pins.length > 0 && (
                          <div key={group.floorId}>
                            <div className="pf-pinned-floor-label">{group.floorName}</div>
                            {group.pins.map((pin, i) => {
                              const st = getStatus(pin.name);
                              return (
                                <button key={i} className="pf-pinned-item" onClick={() => { goToFloor(group.floorId); setSelectedLocation(pin.name); openDetail(pin.name); }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth:0 }}>
                                    <span className="pf-pinned-name">{pin.name}</span>
                                    <span className="pf-pinned-floor">{group.floorName}</span>
                                  </div>
                                  <span className={`pf-loc-status ${st.toLowerCase()}`}>{st}</span>
                                </button>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </aside>
               )}
          </div>

          {!simpleUIMode && (
          <div className={`pf-info-strip ${mounted ? "show" : ""}`}>
              <div className="pf-info-tile"><div className="pf-tile-icon"><Layers3 size={15}/></div><div><div className="pf-tile-label">Floor</div><div className="pf-tile-value">{currentFloor.name}</div></div></div>
              <div className="pf-info-tile"><div className="pf-tile-icon"><MapPinned size={15}/></div><div><div className="pf-tile-label">Selected</div><div className="pf-tile-value">{selectedLocation||"—"}</div></div></div>
              <div className="pf-info-tile"><div className="pf-tile-icon"><Info size={15}/></div><div><div className="pf-tile-label">Zoom</div><div className="pf-tile-value">{Math.round(scale*100)}%</div></div></div>
            </div>
          )}
        </main>

        {profileOpen && (
          <div className="pf-modal-overlay" onClick={() => setProfileOpen(false)}>
            <div className="pf-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={e => e.stopPropagation()}>
              <div className="pf-modal-header">
                <div>
                  <h3 id="profile-modal-title">Profile Editor</h3>
                  <p>Update your account display name, contact, and bio. Changes save to Firebase.</p>
                </div>
                <button className="pf-modal-close" onClick={() => setProfileOpen(false)}>×</button>
              </div>
              <div className="pf-modal-body">
                <div className="pf-field">
                  <label>Display Name</label>
                  <input
                    className="pf-input"
                    value={profileDraft.displayName}
                    onChange={e => setProfileDraft(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="pf-field">
                  <label>Contact</label>
                  <input
                    className="pf-input"
                    value={profileDraft.contact}
                    onChange={e => setProfileDraft(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="Phone, email, or department"
                  />
                </div>
                <div className="pf-field">
                  <label>Gender</label>
                  <select
                    className="pf-select"
                    value={profileDraft.gender}
                    onChange={e => setProfileDraft(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="pf-field">
                  <label>Bio</label>
                  <textarea
                    className="pf-detail-textarea"
                    value={profileDraft.bio}
                    onChange={e => setProfileDraft(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="A short profile note"
                  />
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: "#8899b0" }}>
                  Role: <strong>{userRole}</strong>
                </div>
              </div>
              <div className="pf-modal-actions">
                <button className="pf-submit-btn" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
                <button className="pf-cancel-btn" onClick={() => setProfileOpen(false)}>Close</button>
              </div>
              {profileSavedMsg && <div className="pf-success" style={{ margin: "0 24px 18px" }}>{profileSavedMsg}</div>}
            </div>
          </div>
        )}

        {/* ROOM DETAIL DRAWER */}
        <div className={`pf-drawer-overlay ${detailRoom ? "open" : ""}`} onClick={closeDetail} />
        <div className={`pf-drawer ${detailRoom ? "open" : ""}`}>
          {detailRoom && (() => {
            const info = roomDetailsState[detailRoom] || { dept:"Unknown", capacity:null, hours:"—", desc:"No description available." };
            const floor = floors.find(f => f.locations.includes(detailRoom));
            const st = getStatus(detailRoom);
            return (
              <>
                <div className="pf-drawer-header">
                  <div><div className="pf-drawer-title">{detailRoom}</div><div className="pf-drawer-dept">{info.dept}</div></div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {isAdmin && !editingRoomInfo && (
                      <button className="pf-announce-btn" onClick={() => setEditingRoomInfo(true)}><Edit3 size={12}/> Edit details</button>
                    )}
                    {isAdmin && editingRoomInfo && (
                      <button className="pf-announce-btn cancel" onClick={() => setEditingRoomInfo(false)}>Cancel edit</button>
                    )}
                    <button className="pf-drawer-close" onClick={closeDetail}><X size={16}/></button>
                  </div>
                </div>
                <div className="pf-drawer-body">
                  <div className={`pf-status-pill ${st.toLowerCase()}`}><div className="pf-status-dot"/>{st}</div>
                  {isAdmin && (
                    <div className="pf-status-toggle-row">
                      <span className="pf-status-toggle-label">Room Status</span>
                      <button className={`pf-toggle-btn ${st.toLowerCase()}`} onClick={() => toggleStatus(detailRoom)}>
                        {st==="Open" ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                        Mark {st==="Open" ? "Closed" : "Open"}
                      </button>
                    </div>
                  )}
                  {!editingRoomInfo ? (
                    <>
                      <p className="pf-detail-desc">{info.desc}</p>
                      <div className="pf-detail-stats">
                        <div className="pf-detail-stat"><div className="pf-detail-stat-icon"><Users size={15}/></div><div><div className="pf-detail-stat-label">Capacity</div><div className="pf-detail-stat-val">{info.capacity?`${info.capacity} pax`:"—"}</div></div></div>
                        <div className="pf-detail-stat"><div className="pf-detail-stat-icon"><Clock size={15}/></div><div><div className="pf-detail-stat-label">Hours</div><div className="pf-detail-stat-val" style={{fontSize:"12px"}}>{info.hours}</div></div></div>
                        <div className="pf-detail-stat"><div className="pf-detail-stat-icon"><Tag size={15}/></div><div><div className="pf-detail-stat-label">Department</div><div className="pf-detail-stat-val" style={{fontSize:"12px"}}>{info.dept}</div></div></div>
                        <div className="pf-detail-stat"><div className="pf-detail-stat-icon"><Layers3 size={15}/></div><div><div className="pf-detail-stat-label">Location</div><div className="pf-detail-stat-val">{floor?.name||"—"}</div></div></div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      <input
                        className="pf-editor-input"
                        value={roomDetailDraft.dept}
                        onChange={e => setRoomDetailDraft(d => ({ ...d, dept: e.target.value }))}
                        placeholder="Department"
                      />
                      <input
                        className="pf-editor-input"
                        value={roomDetailDraft.capacity}
                        onChange={e => setRoomDetailDraft(d => ({ ...d, capacity: e.target.value }))}
                        placeholder="Capacity"
                      />
                      <input
                        className="pf-editor-input"
                        value={roomDetailDraft.hours}
                        onChange={e => setRoomDetailDraft(d => ({ ...d, hours: e.target.value }))}
                        placeholder="Hours"
                      />
                      <textarea
                        className="pf-detail-textarea"
                        value={roomDetailDraft.desc}
                        onChange={e => setRoomDetailDraft(d => ({ ...d, desc: e.target.value }))}
                        placeholder="Description"
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="pf-save-btn" onClick={() => saveRoomDetails(detailRoom)}><Save size={13}/> Save details</button>
                        <button className="pf-announce-btn cancel" onClick={() => setEditingRoomInfo(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {floor && (
                    <div className="pf-drawer-floor-badge"><MapPinned size={14}/><span>Located on <strong>{floor.name}</strong> · {currentFloor.pins.find(p=>p.name===detailRoom)?"Pin visible on map":"No pin on current view"}</span></div>
                  )}
                  {(floor?.id === 1 || floor?.id === 6) && (
                    <button className="pf-drawer-sv-btn" onClick={() => { closeDetail(); setSelectedFloor(floor.id); setStreetViewPos(0); setStreetViewDir("front"); setStreetViewOpen(true); }}>
                      <Glasses size={14} /> View in Street View
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* VIEW PINS PANEL */}
        <div className={`pf-slide-overlay ${showPinsPanel ? "open" : ""}`} onClick={() => setShowPinsPanel(false)} />
        <div className={`pf-slide-panel ${showPinsPanel ? "open" : ""}`}>
          <div className="pf-slide-header">
            <div><div className="pf-slide-title"><MapPin size={16} style={{display:"inline",verticalAlign:"middle",marginRight:6}} />Pinned Areas</div><div className="pf-slide-sub">All named pins across every floor</div></div>
            <button className="pf-slide-close" onClick={() => setShowPinsPanel(false)}><X size={16}/></button>
          </div>
          <div className="pf-slide-body">
            {allPinsGrouped.map(group => group.pins.length > 0 && (
              <div key={group.floorId}>
                <div className="pf-pins-floor-label">{group.floorName}</div>
                <div className="pf-pins-grid">
                  {group.pins.map((pin, i) => {
                    const st = getStatus(pin.name);
                    return (
                      <div key={i} className="pf-pins-card" onClick={() => { goToFloor(group.floorId); setSelectedLocation(pin.name); setShowPinsPanel(false); }}>
                        <div className={`pf-pins-card-icon ${st==="Closed"?"closed":""}`}><MapPinned size={15}/></div>
                        <div><div className="pf-pins-card-name">{pin.name}</div><div className="pf-pins-card-floor">{group.floorName}</div></div>
                        <div className={`pf-pins-status-dot ${st.toLowerCase()}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ANALYTICS PANEL — visible to all users, stock-chart style */}
        <div className={`pf-slide-overlay ${showAnalytics ? "open" : ""}`} onClick={() => setShowAnalytics(false)} />
        <div className={`pf-slide-panel ${showAnalytics ? "open" : ""}`}>
          <div className="pf-slide-header">
            <div>
              <div className="pf-slide-title">📊 Room Analytics</div>
              <div className="pf-slide-sub">Live activity · Most visited rooms</div>
            </div>
            <button className="pf-slide-close" onClick={() => setShowAnalytics(false)}><X size={16}/></button>
          </div>
          <div className="pf-slide-body">
            <div className="pf-analytics-header">
              <span className="pf-analytics-ticker">PATHFINDER · GCNAV</span>
              <span className="pf-analytics-live"><span className="pf-analytics-live-dot"/>LIVE</span>
            </div>
            {analyticsRanked.map(([name, count], i) => (
              <Sparkline key={name} value={count} max={analyticsMax} index={i} name={name} />
            ))}
            <p className="pf-analytics-note">Live animated view · Counts increment as rooms are viewed · Synced to Firestore</p>
          </div>
        </div>

        {/* EXTRA IMAGES PANEL (admin only) */}
        {isAdmin && (
          <>
            <div className={`pf-slide-overlay ${showImagesPanel ? "open" : ""}`} onClick={() => setShowImagesPanel(false)} />
            <div className={`pf-slide-panel ${showImagesPanel ? "open" : ""}`}>
              <div className="pf-slide-header">
                <div>
                  <div className="pf-slide-title"><span style={{fontSize:20}}>🖼</span> Floor Photos</div>
                  <div className="pf-slide-sub">Manage images per floor</div>
                </div>
                <button className="pf-slide-close" onClick={() => setShowImagesPanel(false)}><X size={16}/></button>
              </div>
              <div className="pf-slide-body">
                {floors.map(f => (
                  <div key={f.id}>
                    <div className="pf-images-floor-header">
                      <span className="pf-images-floor-name">{f.name}</span>
                      <span className="pf-images-floor-count">{1 + (f.extraImages?.length || 0)} image{(f.extraImages?.length || 0) > 0 ? "s" : ""}</span>
                    </div>
                    <div className="pf-images-grid">
                      {/* Main image (always shown, not deletable) */}
                      <div className="pf-images-thumb">
                        <img src={f.image} alt={`${f.name} main`} />
                        <span className="pf-images-main-badge">MAIN</span>
                        <div className="pf-images-thumb-label">Main Map</div>
                      </div>
                      {/* Extra images */}
                      {(f.extraImages || []).map((src, idx) => (
                        <div key={idx} className="pf-images-thumb">
                          <img src={src} alt={`${f.name} extra ${idx+1}`} />
                          <button className="pf-images-thumb-del" onClick={() => {
                            setFloors(prev => prev.map(fl => fl.id !== f.id ? fl : {
                              ...fl, extraImages: fl.extraImages.filter((_,i) => i !== idx),
                            }));
                            if (selectedFloor === f.id) setMapImageIndex(0);
                          }}>×</button>
                          <div className="pf-images-thumb-label">Photo {idx + 1}</div>
                        </div>
                      ))}
                      {/* Placeholder notice if no extras */}
                      {(!f.extraImages || f.extraImages.length === 0) && (
                        <div className="pf-images-placeholder">
                          <ImagePlus size={20} color="#3d5070" />
                          <span>No extra photos yet</span>
                        </div>
                      )}
                      {/* Upload button (only for selected floor for now) */}
                      {selectedFloor === f.id && (
                        <label className="pf-images-upload-btn">
                          <ImagePlus size={18} color="#ffaa30" />
                          <span>Add Photo</span>
                          <small>JPG, PNG · Will appear as extra map view</small>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display:"none" }}
                            onChange={handleExtraImageUpload}
                          />
                        </label>
                      )}
                      {selectedFloor !== f.id && (
                        <div className="pf-images-upload-btn" style={{opacity:0.4,cursor:"default"}}>
                          <ImagePlus size={16} color="#4a6080" />
                          <small style={{color:"#3d5070"}}>Switch to {f.name} to add photos</small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STREET VIEW OVERLAY — Floor 6 Beta */}
        {streetViewOpen && (() => {
          const svData = selectedFloor === 1 ? floor1StreetView : floor6StreetView;
          const pos = svData[streetViewPos];
          const imgSrc =
            streetViewDir === "front" ? pos.front
            : streetViewDir === "back" ? pos.back
            : streetViewDir === "left" ? (pos.left || pos.front)
            : (pos.right || pos.front);

          // Keep ref in sync for crossfade
          svCurrentSrcRef.current = imgSrc;

          // Collect all sv pins for current floor for sidebar
          const allFloorPins = Object.entries(svPins).filter(([key]) => key.startsWith(`${selectedFloor}-`));

          // Walk animation navigate — forward punch / backward pull
          const navigate = (dir) => {
            const walkType = dir > 0 ? "forward" : "backward";
            setSvWalkDir(walkType);
            setSvPrevSrc(imgSrc);
            setSvCrossfading(true);
            setTimeout(() => {
              setStreetViewPos(p => p + dir);
              svResetView();
            }, 160); // halfway through animation
            setTimeout(() => { setSvCrossfading(false); setSvWalkDir(null); }, 380);
          };

          // Turn crossfade (left/right/flip — no walk animation)
          const crossfadeTo = (applyChange) => {
            setSvPrevSrc(imgSrc);
            setSvCrossfading(true);
            setSvWalkDir(null);
            applyChange();
            svResetView();
            setTimeout(() => setSvCrossfading(false), 420);
          };

          const flipDir = () => crossfadeTo(() => setStreetViewDir(d => d === "front" ? "back" : "front"));

          return (
            <div className="pf-sv-overlay"
              onMouseMove={e => { svHandleMouseMove(e); svOnMouseMove(e); }}
              onMouseUp={e => { svHandleMouseUp(); svOnMouseUp(); }}
              onMouseLeave={e => { svHandleMouseUp(); svOnMouseUp(); }}
            >

              {/* Left sidebar — pin navigator */}
              <div className={`pf-sv-sidebar ${svSidebarOpen ? "open" : ""}`}>
                <div className="pf-sv-sidebar-header">
                  <MapPin size={13} color="#7fb3ff" />
                  <span>Pinned Locations</span>
                  <button className="pf-sv-sidebar-toggle" onClick={() => setSvSidebarOpen(v => !v)}>
                    {svSidebarOpen ? <ChevronRight size={14} /> : <ArrowRight size={14} />}
                  </button>
                </div>
                <div className="pf-sv-sidebar-list">
                  {allFloorPins.length === 0 && (
                    <div className="pf-sv-sidebar-empty">No pins on this floor yet.</div>
                  )}
                  {allFloorPins.map(([key, pins]) => {
                    const [, posStr, dir] = key.split("-");
                    const posIdx = parseInt(posStr);
                    const posLabel = svData[posIdx]?.label || `Position ${posIdx + 1}`;
                    return pins.map((pin, i) => {
                      const isActive = streetViewPos === posIdx && streetViewDir === dir;
                      return (
                        <div
                          key={`${key}-${i}`}
                          className={`pf-sv-sidebar-item ${isActive ? "active" : ""}`}
                          onClick={() => svNavigateToPin(key, i, svData)}
                        >
                          <div className="pf-sv-sidebar-item-dot" />
                          <div className="pf-sv-sidebar-item-info">
                            <div className="pf-sv-sidebar-item-name">{pin.name}</div>
                            <div className="pf-sv-sidebar-item-loc">
                              {posLabel} · {dir === "front" ? "Forward" : dir === "back" ? "Backward" : dir === "left" ? "Left" : "Right"}
                              · {pin.x < 0.5 ? "Left side" : "Right side"}
                            </div>
                          </div>
                          <div className="pf-sv-sidebar-item-voice" title="Navigate here">
                            {svVoiceActive && isActive ? "🔊" : "▶"}
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
                {/* Voice active indicator */}
                {svVoiceActive && (
                  <div className="pf-sv-voice-bar">
                    <div className="pf-sv-voice-dot" /><div className="pf-sv-voice-dot" /><div className="pf-sv-voice-dot" />
                    <span>Speaking…</span>
                  </div>
                )}
              </div>

              {/* Sidebar collapse tab */}
              <button
                className={`pf-sv-sidebar-tab ${svSidebarOpen ? "open" : ""}`}
                onClick={() => setSvSidebarOpen(v => !v)}
                title={svSidebarOpen ? "Collapse" : "Pin Navigator"}
              >
                {svSidebarOpen ? <ArrowLeft size={13} /> : <MapPin size={13} />}
              </button>

              {/* Top bar */}
              <div className="pf-sv-topbar">
                <div className="pf-sv-badge">
                  <Glasses size={15} color="#7fb3ff" />
                  <span>{selectedFloor === 1 ? "1st" : "6th"} Floor · Street View</span>
                  <span className="pf-sv-beta-tag">BETA</span>
                </div>
                <button className="pf-sv-close" onClick={() => { setStreetViewOpen(false); setSvEditMode(false); svResetView(); }}><X size={16} /></button>
              </div>

              {/* Admin: Edit Pins toggle */}
              {isAdmin && (
                <button className={`pf-sv-edit-toggle ${svEditMode ? "active" : ""}`} onClick={() => setSvEditMode(v => !v)}>
                  <MapPin size={13} />{svEditMode ? "Exit Pin Edit" : "Edit Pins"}
                </button>
              )}

              {/* Admin: Pin editor toolbar */}
              {isAdmin && svEditMode && (
                <div className="pf-sv-editor-bar">
                  <span className="pf-sv-editor-hint" style={{flex:1}}>
                    {svPendingPin ? "Type a name and press Enter to confirm" : "Click anywhere on the image to place a pin"}
                  </span>
                  <button className="pf-sv-editor-save-btn" onClick={svSavePins} disabled={svSaving}>{svSaving ? "Saving…" : <><Save size={12} /> Save</>}</button>
                  {svSaveMsg && <span className="pf-sv-editor-hint" style={{color:"#40e090"}}>{svSaveMsg}</span>}
                </div>
              )}

              {/* Image + pins */}
              <div
                ref={svWrapRef}
                className={`pf-sv-image-wrap${svIsDragging ? " sv-dragging" : ""}${svEditMode ? " sv-edit" : ""}`}
                style={{ touchAction: "none" }}
                onMouseDown={svOnMouseDown}
                onTouchStart={svOnTouchStart}
                onTouchMove={svOnTouchMove}
                onTouchEnd={svOnTouchEnd}
                onClick={svHandleImageClick}
              >
                {/* Outgoing image — walk animation or crossfade */}
                {svCrossfading && svPrevSrc && (
                  <img
                    src={svPrevSrc}
                    className={`pf-sv-image ${svWalkDir === "forward" ? "pf-sv-walk-out-fwd" : svWalkDir === "backward" ? "pf-sv-walk-out-bwd" : "pf-sv-image-out"}`}
                    alt="previous"
                    draggable={false}
                    style={{ transform: `translate(${svPan.x}px, ${svPan.y}px) scale(${svZoom})` }}
                  />
                )}
                <img
                  ref={svImageRef}
                  key={`${selectedFloor}-${streetViewPos}-${streetViewDir}`}
                  src={imgSrc}
                  className={`pf-sv-image${svCrossfading ? (svWalkDir === "forward" ? " pf-sv-walk-in-fwd" : svWalkDir === "backward" ? " pf-sv-walk-in-bwd" : " pf-sv-image-in") : ""}`}
                  alt={`Floor ${selectedFloor} ${streetViewDir} view at ${pos.label}`}
                  draggable={false}
                  style={{ transform: `translate(${svPan.x}px, ${svPan.y}px) scale(${svZoom})` }}
                />

                {/* Pins locked to image via same transform */}
                <div style={{
                  position:"absolute", inset:0,
                  transform:`translate(${svPan.x}px,${svPan.y}px) scale(${svZoom})`,
                  transformOrigin:"center center",
                  pointerEvents: "none",
                  zIndex: 10,
                }}>
                  {currentSvPins.map((pin, i) => (
                    <div key={i} className={`pf-sv-pin ${svEditMode ? "edit-pin" : ""}`}
                      style={{ left:`${pin.x*100}%`, top:`${pin.y*100}%`, pointerEvents:"auto" }}
                      onMouseDown={e => { e.stopPropagation(); svHandleMouseDown(e, i); }}
                      onClick={e => {
                        e.stopPropagation();
                        if (svDraggingPin !== null) return;
                        if (!svEditMode) {
                          setSvSidebarOpen(true);
                          setSvSelectedDot({ key: svKey(streetViewPos, streetViewDir), index: i });
                          svSpeak(`${pin.name} is on your ${pin.x < 0.5 ? "left" : "right"}.`);
                        }
                      }}>
                      <div className={`pf-sv-pin-icon ${svEditMode ? "edit" : ""}`}>
                        <div className="pf-sv-pin-dot" />
                      </div>
                      {svEditMode && <button className="pf-sv-pin-del" onClick={e => { e.stopPropagation(); svDeletePin(i); }}>×</button>}
                      <div className="pf-sv-pin-label">{pin.name}</div>
                    </div>
                  ))}

                  {/* Pending (unconfirmed) pin */}
                  {svPendingPin && (
                    <div className="pf-sv-pin pf-sv-pin-pending"
                      style={{ left:`${svPendingPin.x*100}%`, top:`${svPendingPin.y*100}%`, pointerEvents:"auto" }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="pf-sv-pin-icon pf-sv-pin-pending-icon">
                        <div className="pf-sv-pin-dot" />
                      </div>
                      <div className="pf-sv-pin-name-popup" onClick={e => e.stopPropagation()}>
                        <input
                          className="pf-sv-pin-name-input"
                          placeholder="Name this pin…"
                          value={svPendingName}
                          autoFocus
                          onChange={e => setSvPendingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") svConfirmPin();
                            if (e.key === "Escape") svCancelPending();
                          }}
                        />
                        <button className="pf-sv-pin-confirm-btn" onClick={svConfirmPin} disabled={!svPendingName.trim()}>✓</button>
                        <button className="pf-sv-pin-cancel-btn" onClick={svCancelPending}>✕</button>
                      </div>
                    </div>
                  )}
                </div>


              </div>

              {/* UI overlays — outside image-wrap so they don't shift with zoom/pan */}
              {/* Hotspot portals */}
              {!svEditMode && !svPendingPin && (
                <>
                  {streetViewPos < svData.length - 1 && (streetViewDir === "front") && (
                    <div className="pf-sv-hotspot pf-sv-hotspot-fwd" onClick={() => navigate(1)} title="Go forward">
                      <div className="pf-sv-hotspot-inner">
                        <ArrowRight size={14} style={{transform:"rotate(-90deg)"}} />
                      </div>
                    </div>
                  )}
                  {streetViewPos > 0 && (streetViewDir === "front") && (
                    <div className="pf-sv-hotspot pf-sv-hotspot-bwd" onClick={() => navigate(-1)} title="Go back">
                      <div className="pf-sv-hotspot-inner">
                        <ArrowRight size={14} style={{transform:"rotate(90deg)"}} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Minimap overlay */}
              <div className="pf-sv-minimap">
                <img src={selectedFloor === 1 ? floor1 : floor6} className="pf-sv-minimap-img" alt="minimap" draggable={false} />
                {svData.map((_, i) => (
                  <div
                    key={i}
                    className={`pf-sv-minimap-dot ${streetViewPos === i ? "active" : ""}`}
                    style={{
                      left: `${10 + (i / (svData.length - 1)) * 80}%`,
                      top: "50%",
                    }}
                  />
                ))}
                <div className="pf-sv-minimap-label">
                  {streetViewDir === "front" ? "▲" : streetViewDir === "back" ? "▼" : streetViewDir === "left" ? "◄" : "►"}
                </div>
              </div>

              {/* Direction badge */}
              <div className="pf-sv-dir-badge">
                {streetViewDir === "front" ? "FORWARD"
                  : streetViewDir === "back" ? "BACKWARD"
                  : streetViewDir === "left" ? "LOOKING LEFT"
                  : "LOOKING RIGHT"} · {pos.label}
              </div>
              <button className="pf-sv-flip-btn" onClick={flipDir} title="Flip direction"><Repeat2 size={20} /></button>
              {(Math.abs(svZoom - 1.4) > 0.05 || Math.abs(svPan.x) > 2 || Math.abs(svPan.y) > 2) && (
                <button className="pf-sv-zoom-reset" onClick={svResetView}><RotateCcw size={11} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> Reset</button>
              )}
              <div className="pf-sv-zoom-hint">DRAG TO TURN · SCROLL TO ZOOM · PINCH</div>

              {/* Floating side arrows */}
              {pos.left && streetViewDir !== "left" && (
                <button
                  className="pf-sv-float-arrow pf-sv-float-arrow-left"
                  onClick={() => crossfadeTo(() => setStreetViewDir("left"))}
                  title="Look left"
                >
                  <ArrowLeft size={20} />
                  <span>Left</span>
                </button>
              )}
              {pos.right && streetViewDir !== "right" && (
                <button
                  className="pf-sv-float-arrow pf-sv-float-arrow-right"
                  onClick={() => crossfadeTo(() => setStreetViewDir("right"))}
                  title="Look right"
                >
                  <ArrowRight size={20} />
                  <span>Right</span>
                </button>
              )}
              {streetViewDir === "left" && (
                <button
                  className="pf-sv-float-arrow pf-sv-float-arrow-right"
                  onClick={() => crossfadeTo(() => setStreetViewDir("front"))}
                  title="Look forward"
                >
                  <ArrowRight size={20} />
                  <span>Forward</span>
                </button>
              )}
              {streetViewDir === "right" && (
                <button
                  className="pf-sv-float-arrow pf-sv-float-arrow-left"
                  onClick={() => crossfadeTo(() => setStreetViewDir("front"))}
                  title="Look forward"
                >
                  <ArrowLeft size={20} />
                  <span>Forward</span>
                </button>
              )}

              {/* Bottom bar */}
              <div className="pf-sv-bottombar">
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <span className="pf-sv-pos-label">POSITION</span>
                  <div className="pf-sv-positions">
                    {svData.map((_, i) => (
                      <div key={i} className={`pf-sv-pos-dot ${streetViewPos === i ? "active" : ""}`}
                        onClick={() => { if (streetViewPos !== i) navigate(i - streetViewPos); }}
                        title={svData[i].label} />
                    ))}
                  </div>
                  <span className="pf-sv-pos-label">{pos.label}</span>
                </div>
                <div className="pf-sv-nav">
                  <button className="pf-sv-nav-btn" disabled={streetViewPos === 0} onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  {/* Left view button */}
                  {pos.left && (
                    <button
                      className={`pf-sv-nav-btn pf-sv-nav-btn-side ${streetViewDir === "left" ? "active" : ""}`}
                      onClick={() => crossfadeTo(() => setStreetViewDir(streetViewDir === "left" ? "front" : "left"))}
                    >
                      <ArrowLeft size={14} />
                      {streetViewDir === "left" ? "Front" : "Left"}
                    </button>
                  )}
                  <span className="pf-sv-nav-pos-info">{streetViewPos + 1} / {svData.length}</span>
                  {/* Right view button */}
                  {pos.right && (
                    <button
                      className={`pf-sv-nav-btn pf-sv-nav-btn-side ${streetViewDir === "right" ? "active" : ""}`}
                      onClick={() => crossfadeTo(() => setStreetViewDir(streetViewDir === "right" ? "front" : "right"))}
                    >
                      {streetViewDir === "right" ? "Front" : "Right"}
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button className="pf-sv-nav-btn" disabled={streetViewPos === svData.length - 1} onClick={() => navigate(1)}>
                    Forward <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </>
  );
}