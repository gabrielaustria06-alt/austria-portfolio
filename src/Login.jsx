import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import "./App.css";
import SmartNav from "./components/SmartNav.jsx";
import backgroundImg from "./assets/backgroundlogin.png";
import pathfinderCover from "./assets/pathfindercover.png";
import financeVideo from "./assets/finance.mov";
import testingVideo from "./assets/testing.mov";

// Hardcoded accounts
const ACCOUNTS = [
  { username: "202411682", password: "153269", role: "student" },
  { username: "Gab", password: "153269", role: "admin" },
  { username: "w", password: "w", role: "admin" },
  { username: "guest", password: "guest", role: "student" },
];

export default function Login({
  onLogin,
  announcement = "Welcome to Gordon College! Check the map for room locations and availability.",
}) {
  const [role, setRole] = useState("student");
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [adminAccessAllowed, setAdminAccessAllowed] = useState(false);
  const [adminCodeMode, setAdminCodeMode] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [smartNavOpen, setSmartNavOpen] = useState(false);

  // Tutorial flow state
  const [tutorialStep, setTutorialStep] = useState(null); // null | "newbie" | "welcome" | "loading" | "video"
  const [selectedDestination, setSelectedDestination] = useState(null); // "finance" | "testing"
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);

  const loadStudentAccounts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "studentAccounts"));
      const students = snapshot.docs
        .map((doc) => doc.data())
        .filter((account) => account.role === "student");
      setRegisteredStudents(students);
    } catch (e) {
      console.error("Failed to load student accounts:", e);
      setRegisteredStudents([]);
    }
  };

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);

    const savedTheme = localStorage.getItem("login-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    loadStudentAccounts();
  }, []);

  // Auto-show tutorial on first ever login
  const triggerTutorialIfNew = () => {
    const seen = localStorage.getItem("pf_tutorial_seen");
    if (!seen) setTutorialStep("newbie");
  };

  const openTutorialManually = () => {
    setTutorialStep("newbie");
    setSelectedDestination(null);
    setVideoEnded(false);
    setLoadingProgress(0);
  };

  const closeTutorial = () => {
    localStorage.setItem("pf_tutorial_seen", "true");
    setTutorialStep(null);
    setSelectedDestination(null);
    setVideoEnded(false);
    setLoadingProgress(0);
    // If there's a pending login (user just logged in and got tutorial), proceed
    const pending = sessionStorage.getItem("pf_pending_login");
    if (pending) {
      sessionStorage.removeItem("pf_pending_login");
      const { role, username } = JSON.parse(pending);
      setTransitioning(true);
      setTimeout(() => onLogin(role, username), 320);
    }
  };

  const pickDestination = (dest) => {
    setSelectedDestination(dest);
    setTutorialStep("loading");
    setLoadingProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setTutorialStep("video");
          setVideoPlaying(true);
          setVideoEnded(false);
          setVideoProgress(0);
          setVideoSpeed(5);
        }, 400);
      }
      setLoadingProgress(Math.min(p, 100));
    }, 120);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
    else { videoRef.current.play(); setVideoPlaying(true); }
  };

  const rewind10 = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const setSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setVideoSpeed(speed);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    setVideoProgress(videoRef.current.currentTime);
    setVideoDuration(videoRef.current.duration || 0);
  };

  const handleScrub = (e) => {
    if (!videoRef.current || !videoDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoDuration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const destLabel = selectedDestination === "finance" ? "Finance Office" : "Testing Area";

  useEffect(() => {
    localStorage.setItem("login-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (mode === "register" && role === "admin") {
      setRole("student");
    }
  }, [mode, role]);

  const isValidStudentUsername = (value) => /^\d{9}$/.test(value);
  const isValidPassword = (value) => /^[A-Za-z0-9]{4,12}$/.test(value);
  const isValidAdminCode = (value) => /^\d{4}$/.test(value) && value === "1532";

  const requestAdminAccess = () => {
    if (mode === "register") {
      setError("Higher user access is not available during registration.");
      setAdminCodeMode(false);
      return;
    }
    // ADMIN CODE DISABLED FOR NOW - Uncomment setAdminCodeMode(true) and comment out direct access below to re-enable
    setRole("admin");
    setAdminCodeMode(false);
    setError("");
    // setAdminCodeMode(true);
  };

  const verifyAdminCode = () => {
    if (isValidAdminCode(adminCode)) {
      setAdminAccessAllowed(true);
      setRole("admin");
      setAdminCodeMode(false);
      setAdminCode("");
      setSuccess("Admin access granted.");
      setError("");
    } else {
      setError("Incorrect admin access code.");
      setSuccess("");
    }
  };

  const handleLogin = () => {
    if (!username || !password) {
      setError("Please enter your credentials.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    setTimeout(() => {
      const match = ACCOUNTS.find(
        (a) =>
          a.username === username &&
          a.password === password &&
          a.role === role
      ) || (role === "student" && registeredStudents.find(
        (a) => a.username === username && a.password === password && a.role === "student"
      ));

      if (match) {
        const seen = localStorage.getItem("pf_tutorial_seen");
        if (!seen) {
          setLoading(false);
          setTutorialStep("newbie");
          // store match so we can login after tutorial
          sessionStorage.setItem("pf_pending_login", JSON.stringify({ role: match.role, username: match.username }));
          return;
        }
        setTransitioning(true);
        setTimeout(() => onLogin(match.role, match.username), 320);
      } else {
        setError("Invalid username, password, or role. Please try again.");
        setLoading(false);
      }
    }, 800);
  };

  const handleRegister = async () => {
    if (role !== "student") {
      setError("Admin accounts cannot be registered. Use a hardcoded admin login.");
      return;
    }

    if (!username || !password || !confirmPassword) {
      setError("Please complete all fields to register.");
      setSuccess("");
      return;
    }

    if (!isValidStudentUsername(username)) {
      setError("Student username must be exactly 9 digits. Use student ID.");
      setSuccess("");
      return;
    }

    if (!isValidPassword(password)) {
      setError("Password must be 4-12 letters or numbers only.");
      setSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }

    const duplicate = ACCOUNTS.concat(registeredStudents).find(
      (a) => a.username === username
    );
    if (duplicate) {
      setError("This username is already taken. Choose a different one.");
      setSuccess("");
      return;
    }

    const newStudent = { username, password, role: "student" };
    try {
      await setDoc(doc(db, "studentAccounts", username), newStudent);
      setRegisteredStudents((prev) => [...prev, newStudent]);
      setError("");
      setSuccess("Registration complete. Please sign in.");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch (e) {
      console.error("Failed to save student account:", e);
      setError("Unable to save registration. Please try again later.");
      setSuccess("");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else handleRegister();
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (smartNavOpen) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#080c14", overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setSmartNavOpen(false)}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 9999,
            padding: "10px 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(8,12,20,0.88)",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 700,
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            backdropFilter: "blur(10px)",
          }}
        >
          ← Back to Login
        </button>

        <SmartNav />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pf-login-root {
          --bg: #080c14;
          --grid-line: rgba(30, 120, 255, 0.03);
          --orb1: #1e78ff;
          --orb2: #0ff0a0;
          --orb3: #7b4fff;
          --text: #ffffff;
          --muted: #8899b0;
          --subtle: #3d5070;
          --accent: #1e78ff;
          --accent-2: #0fb8ff;
          --announcement-bg: rgba(30, 120, 255, 0.08);
          --announcement-border: rgba(30, 120, 255, 0.18);
          --announcement-text: #e7f3ff;
          --toggle-bg: rgba(255,255,255,0.08);
          --toggle-border: rgba(255,255,255,0.12);
          --role-bg: rgba(255,255,255,0.05);
          --role-border: rgba(255,255,255,0.07);
          --input-bg: rgba(255,255,255,0.05);
          --input-border: rgba(255,255,255,0.1);
          --input-focus-bg: rgba(30,120,255,0.06);
          --placeholder: #3d5070;
          --divider: rgba(30,120,255,0.3);
          --button-shadow: rgba(30,120,255,0.35);
          --button-shadow-hover: rgba(30,120,255,0.45);

          min-height: 100vh;
          display: flex;
          background: linear-gradient(rgba(8, 12, 20, 0.4), rgba(8, 12, 20, 0.4)), url('${backgroundImg}');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          overflow: hidden;
          position: relative;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.35s ease, filter 0.35s ease, opacity 0.35s ease, background 0.3s ease;
        }

        .pf-login-root.light {
          --bg: linear-gradient(135deg, #f5eedf 0%, #ebe2cb 100%);
          --grid-line: rgba(47, 107, 79, 0.08);
          --orb1: #7ea77d;
          --orb2: #d7c49d;
          --orb3: #5d8a68;
          --text: #1f3a2b;
          --muted: #5f6f63;
          --subtle: #7e897f;
          --accent: #2f6b4f;
          --accent-2: #7ea77d;
          --announcement-bg: rgba(47, 107, 79, 0.08);
          --announcement-border: rgba(47, 107, 79, 0.18);
          --announcement-text: #2a4735;
          --toggle-bg: rgba(255,255,255,0.65);
          --toggle-border: rgba(47,107,79,0.16);
          --role-bg: rgba(255,255,255,0.45);
          --role-border: rgba(47,107,79,0.10);
          --input-bg: rgba(255,255,255,0.68);
          --input-border: rgba(47,107,79,0.14);
          --input-focus-bg: rgba(47,107,79,0.08);
          --placeholder: #8a9487;
          --divider: rgba(47,107,79,0.18);
          --button-shadow: rgba(47,107,79,0.22);
          --button-shadow-hover: rgba(47,107,79,0.28);
          background: linear-gradient(rgba(245, 238, 223, 0.75), rgba(235, 226, 203, 0.75)), url('${backgroundImg}');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .pf-login-root.transitioning {
          transform: translateX(-24px);
          filter: blur(2px);
          opacity: 0.12;
        }

        .pf-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        .pf-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          pointer-events: none;
        }

        .pf-orb-1 {
          width: 500px;
          height: 500px;
          background: var(--orb1);
          top: -120px;
          left: -100px;
          animation: orbFloat1 8s ease-in-out infinite;
        }

        .pf-orb-2 {
          width: 400px;
          height: 400px;
          background: var(--orb2);
          bottom: -80px;
          right: -80px;
          animation: orbFloat2 10s ease-in-out infinite;
        }

        .pf-orb-3 {
          width: 260px;
          height: 260px;
          background: var(--orb3);
          top: 50%;
          right: 15%;
          animation: orbFloat3 7s ease-in-out infinite;
        }

        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(40px, 30px); }
        }

        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(-30px, -40px); }
        }

        @keyframes orbFloat3 {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }

        .pf-theme-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 5;
          border: 1px solid var(--toggle-border);
          background: var(--toggle-bg);
          color: var(--text);
          padding: 10px 14px;
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .pf-theme-toggle:hover {
          transform: translateY(-1px);
          opacity: 0.94;
        }

        .pf-brand-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 64px;
          position: relative;
          z-index: 2;
        }

        .pf-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 20px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s 0.1s ease, transform 0.6s 0.1s ease;
        }

        .pf-eyebrow.show {
          opacity: 1;
          transform: translateY(0);
        }

        .pf-logo-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(80px, 11vw, 130px);
          line-height: 0.92;
          color: var(--text);
          letter-spacing: 0.01em;
          margin: 0 0 24px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s 0.2s ease, transform 0.7s 0.2s ease, color 0.3s ease;
        }

        .pf-logo-title .accent-letter {
          background: linear-gradient(135deg, #1e78ff 0%, #4da6ff 25%, #1e78ff 50%, #0a5ccc 75%, #1e78ff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: royalBlueShimmer 3s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(30, 120, 255, 0.5));
        }

        .pf-logo-title .shimmer-letter {
          background: linear-gradient(135deg, #e8e8e8 0%, #ffffff 25%, #e8e8e8 50%, #c0c0c0 75%, #e8e8e8 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: silverShimmer 3s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
        }

        @keyframes royalBlueShimmer {
          0%, 100% {
            background-position: 0% 50%;
            filter: drop-shadow(0 0 8px rgba(30, 120, 255, 0.5));
          }
          50% {
            background-position: 100% 50%;
            filter: drop-shadow(0 0 16px rgba(30, 120, 255, 0.8));
          }
        }

        @keyframes silverShimmer {
          0%, 100% {
            background-position: 0% 50%;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
          }
          50% {
            background-position: 100% 50%;
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.7));
          }
        }

        .pf-logo-title.show {
          opacity: 1;
          transform: translateY(0);
        }

        .pf-tagline {
          font-size: 16px;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.7;
          max-width: 380px;
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s 0.35s ease, transform 0.6s 0.35s ease, color 0.3s ease;
        }

        .pf-tagline.show {
          opacity: 1;
          transform: translateY(0);
        }

        .pf-stats {
          display: flex;
          gap: 40px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s 0.5s ease, transform 0.6s 0.5s ease;
        }

        .pf-stats.show {
          opacity: 1;
          transform: translateY(0);
        }

        .pf-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: var(--text);
          line-height: 1;
        }

        .pf-stat-label {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
          letter-spacing: 0.05em;
        }

        .pf-divider-v {
          width: 1px;
          background: linear-gradient(to bottom, transparent, var(--divider), transparent);
          margin: 40px 0;
          align-self: stretch;
          position: relative;
          z-index: 2;
        }

        .pf-form-panel {
          width: 440px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          position: relative;
          z-index: 2;
        }

        .pf-card {
          width: 100%;
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.7s 0.3s ease, transform 0.7s 0.3s ease;
        }

        .pf-card.show {
          opacity: 1;
          transform: translateX(0);
        }

        .pf-card-header {
          margin-bottom: 20px;
        }

        .pf-card-header h2 {
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 6px;
        }

        .pf-card-header p {
          font-size: 14px;
          color: var(--muted);
          margin: 0;
        }

        .pf-announcement {
          background: var(--announcement-bg);
          border: 1px solid var(--announcement-border);
          padding: 14px 16px;
          border-radius: 14px;
          color: var(--announcement-text);
          margin-bottom: 24px;
          font-size: 14px;
          line-height: 1.55;
          backdrop-filter: blur(10px);
        }

        .pf-announcement strong {
          color: var(--text);
        }

        .pf-role-toggle {
          display: flex;
          gap: 0;
          background: var(--role-bg);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          border: 1px solid var(--role-border);
          backdrop-filter: blur(10px);
        }

        .pf-role-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .pf-role-btn.active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 4px 20px var(--button-shadow);
        }

        .pf-role-icon {
          font-size: 16px;
        }

        .pf-field {
          margin-bottom: 16px;
        }

        .pf-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .pf-input-wrap {
          position: relative;
        }

        .pf-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
          opacity: 0.65;
        }

        .pf-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 12px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, color 0.2s;
          box-sizing: border-box;
        }

        .pf-input::placeholder {
          color: var(--placeholder);
        }

        .pf-input:focus {
          border-color: var(--accent);
          background: var(--input-focus-bg);
          box-shadow: 0 0 0 3px rgba(30,120,255,0.12);
        }

        .pf-login-root.light .pf-input:focus {
          box-shadow: 0 0 0 3px rgba(47,107,79,0.14);
        }

        .pf-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 60, 60, 0.1);
          border: 1px solid rgba(255,60,60,0.25);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #ff7070;
          margin-bottom: 16px;
        }
        .pf-success {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(56, 211, 123, 0.12);
          border: 1px solid rgba(56, 211, 123, 0.25);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #38d37b;
          margin-bottom: 16px;
        }

        .pf-submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 6px 24px var(--button-shadow);
          margin-top: 4px;
        }

        .pf-submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 10px 32px var(--button-shadow-hover);
        }

        .pf-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .pf-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .pf-btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          animation: shimmer 1.6s ease infinite;
        }

        @keyframes shimmer {
          to { transform: translateX(100%); }
        }

        .pf-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pf-footer-note {
          text-align: center;
          font-size: 12px;
          color: var(--subtle);
          margin-top: 24px;
          line-height: 1.6;
        }

        .pf-footer-note span {
          color: var(--accent);
        }

        .pf-social-link {
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
        }

        .pf-social-link a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }

        .pf-social-link a:hover {
          text-decoration: underline;
        }

        .pf-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .pf-modal {
          width: min(420px, 100%);
          background: rgba(8, 12, 20, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          animation: modalPop 0.25s ease;
        }

        .pf-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 24px 24px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pf-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #fff;
        }

        .pf-modal-header p {
          margin: 4px 0 0;
          color: #9aa8c2;
          font-size: 13px;
          line-height: 1.5;
        }

        .pf-modal-close {
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: 12px;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pf-modal-close:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .pf-modal-body {
          padding: 20px 24px;
        }

        .pf-modal-actions {
          display: flex;
          gap: 10px;
          padding: 18px 24px 24px;
          justify-content: flex-end;
          background: rgba(255, 255, 255, 0.02);
        }

        .pf-cancel-btn {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: transparent;
          color: #e2e8f0;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          transition: background 0.2s, border-color 0.2s;
        }

        .pf-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
        }

        @keyframes modalPop {
          from { transform: translateY(-12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 860px) {
          .pf-brand-panel {
            display: none;
          }

          .pf-divider-v {
            display: none;
          }

          .pf-login-root {
            justify-content: center;
          }

          .pf-form-panel {
            width: 100%;
            max-width: 420px;
            padding-top: 90px;
          }

          .pf-theme-toggle {
            top: 16px;
            right: 16px;
          }
        }
      `}</style>

      <div className={`pf-login-root ${theme} ${transitioning ? "transitioning" : ""}`}>
        <div className="pf-grid-bg" />
        <div className="pf-orb pf-orb-1" />
        <div className="pf-orb pf-orb-2" />
        <div className="pf-orb pf-orb-3" />

        <button className="pf-theme-toggle" style={{ right: "auto", left: 20 }} onClick={openTutorialManually}>
          ▶ Tutorial
        </button>
        <button className="pf-theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

        {/* Left branding panel */}
        <div className="pf-brand-panel">
          <p className={`pf-eyebrow ${mounted ? "show" : ""}`}>
            Gordon College · Olongapo City
          </p>

          <h1 className={`pf-logo-title ${mounted ? "show" : ""}`}>
            <span className="accent-letter">P</span><span className="shimmer-letter">ATH</span>
            <br />
            <span className="accent-letter">F</span><span className="shimmer-letter">INDER</span>
          </h1>

          <p className={`pf-tagline ${mounted ? "show" : ""}`}>
            A smart campus navigation system for Gordon College. Find classrooms,
            offices, labs, and more in just a few clicks.
          </p>

          <div className={`pf-stats ${mounted ? "show" : ""}`}>
            <div>
              <div className="pf-stat-num">6</div>
              <div className="pf-stat-label">Floor Maps</div>
            </div>
            <div>
              <div className="pf-stat-num">30+</div>
              <div className="pf-stat-label">Locations</div>
            </div>
            <div>
              <div className="pf-stat-num">1</div>
              <div className="pf-stat-label">Campus</div>
            </div>
          </div>
        </div>

        <div className="pf-divider-v" />

        {/* Right form panel */}
        <div className="pf-form-panel">
          <div className={`pf-card ${mounted ? "show" : ""}`}>
            <div className="pf-card-header">
              <h2>Welcome back</h2>
              <p>Sign in to start navigating your campus</p>
            </div>

            <div className="pf-announcement">
              <strong>Announcement:</strong>{" "}
              {announcement ||
                "Campus navigation now includes lab building updates and new access points. Check the map after signing in for the latest route guidance."}
            </div>

            {/* Role toggle */}
            <div className="pf-role-toggle">
              <button
                className={`pf-role-btn ${role === "student" ? "active" : ""}`}
                onClick={() => {
                  setRole("student");
                  setAdminCodeMode(false);
                }}
              >
                Student
              </button>

              <button
                className={`pf-role-btn ${role === "admin" ? "active" : ""}`}
                onClick={requestAdminAccess}
              >
                Admin
              </button>
            </div>
            {mode === "register" && (
              <p style={{ fontSize: 13, color: "var(--subtle)", marginTop: -6, marginBottom: 18 }}>
                Student registration only. Higher accounts must use a hardcoded login.
              </p>
            )}

            {/* Username */}
            <div className="pf-field">
              <label>Username</label>
              <div className="pf-input-wrap">
                <span className="pf-input-icon">👤</span>
                <input
                  className="pf-input"
                  type="text"
                  placeholder={
                    mode === "register"
                      ? "9-digit student username"
                      : role === "student"
                      ? "e.g. 202411682"
                      : "Admin username"
                  }
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Password */}
            <div className="pf-field">
              <label>Password</label>
              <div className="pf-input-wrap">
                <span className="pf-input-icon">🔒</span>
                <input
                  className="pf-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="pf-field">
                <label>Confirm Password</label>
                <div className="pf-input-wrap">
                  <span className="pf-input-icon">🔒</span>
                  <input
                    className="pf-input"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            )}

            {error && <div className="pf-error">{error}</div>}
            {success && <div className="pf-success">{success}</div>}

            <button
              className="pf-submit-btn"
              type="button"
              onClick={() => setSmartNavOpen(true)}
              style={{
                marginBottom: 12,
                background: "linear-gradient(135deg, #00c9a7 0%, #0fb8ff 100%)",
              }}
            >
              <div className="pf-btn-shimmer" />
              Open Smart Navigation →
            </button>

            <button
              className="pf-submit-btn"
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading && <span className="pf-spinner" />}
              <div className="pf-btn-shimmer" />
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Registering..."
                : mode === "login"
                ? "Sign In →"
                : "Create Account →"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 8 }}>
              <span style={{ fontSize: 13, color: "var(--subtle)" }}>
                {mode === "login"
                  ? "New here?"
                  : "Already registered?"}
              </span>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 0,
                }}
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setConfirmPassword("");
                }}
              >
                {mode === "login" ? "Create an account" : "Back to sign in"}
              </button>
            </div>

            <p className="pf-footer-note">
              Gordon College Campus Navigation System
              <br />
              <span>© 2026 PATHFINDER</span> · All rights reserved
            </p>

            <p className="pf-social-link">
              <a
                href="https://www.instagram.com/iigabxo/"
                target="_blank"
                rel="noreferrer"
              >
                @iigabxo
              </a>
            </p>
          </div>
        </div>
      </div>

      {adminCodeMode && (
        <div className="pf-modal-overlay" onClick={() => setAdminCodeMode(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pf-modal-header">
              <div>
                <h3>4 Digit Code Required</h3>
                <p>Enter the 4-digit access code to enable login.</p>
              </div>
              <button className="pf-modal-close" onClick={() => setAdminCodeMode(false)}>×</button>
            </div>
            <div className="pf-modal-body">
              <div className="pf-field">
                <label>Access code</label>
                <div className="pf-input-wrap">
                  <input
                    className="pf-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") verifyAdminCode();
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="pf-modal-actions">
              <button className="pf-submit-btn" onClick={verifyAdminCode}>Unlock</button>
              <button className="pf-cancel-btn" onClick={() => setAdminCodeMode(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================
          TUTORIAL MODALS
      ============================================================ */}
      {tutorialStep && (<>
        <style>{`
          .pf-tut-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.72);
            backdrop-filter: blur(6px);
            z-index: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: tutFadeIn 0.3s ease;
          }
          @keyframes tutFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .pf-tut-card {
            background: linear-gradient(160deg, #0d1422 0%, #080c14 100%);
            border: 1px solid rgba(30,120,255,0.18);
            border-radius: 24px;
            box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,120,255,0.06);
            overflow: hidden;
            width: min(480px, 100%);
            animation: tutSlideUp 0.35s cubic-bezier(0.16,1,0.3,1);
          }
          @keyframes tutSlideUp {
            from { transform: translateY(24px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          .pf-tut-newbie-body {
            padding: 52px 44px 44px;
            text-align: center;
          }
          .pf-tut-icon {
            font-size: 48px;
            margin-bottom: 20px;
            display: block;
            animation: tutBounce 2s ease-in-out infinite;
          }
          @keyframes tutBounce {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-8px); }
          }
          .pf-tut-newbie-body h2 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 34px;
            letter-spacing: 0.04em;
            color: #fff;
            margin: 0 0 10px;
          }
          .pf-tut-newbie-body p {
            font-size: 15px;
            color: #8899b0;
            line-height: 1.6;
            margin: 0 0 36px;
          }
          .pf-tut-newbie-btns {
            display: flex;
            gap: 12px;
          }
          .pf-tut-btn-yes {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #1e78ff 0%, #0fb8ff 100%);
            color: #fff;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 8px 28px rgba(30,120,255,0.35);
            transition: transform 0.15s, box-shadow 0.15s;
            position: relative;
            overflow: hidden;
          }
          .pf-tut-btn-yes::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
            transform: translateX(-100%);
            animation: shimmer 1.8s ease infinite;
          }
          .pf-tut-btn-yes:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(30,120,255,0.45); }
          .pf-tut-btn-no {
            flex: 1;
            padding: 14px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 14px;
            background: rgba(255,255,255,0.05);
            color: #8899b0;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
          }
          .pf-tut-btn-no:hover { background: rgba(255,255,255,0.09); color: #fff; border-color: rgba(255,255,255,0.2); }

          /* Welcome popup */
          .pf-tut-welcome-cover {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
            opacity: 0.88;
          }
          .pf-tut-welcome-body {
            padding: 32px 36px 36px;
          }
          .pf-tut-welcome-body h2 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 28px;
            letter-spacing: 0.06em;
            color: #fff;
            margin: 0 0 6px;
          }
          .pf-tut-welcome-body p {
            font-size: 14px;
            color: #8899b0;
            margin: 0 0 28px;
            line-height: 1.55;
          }
          .pf-tut-dest-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #1e78ff;
            margin-bottom: 14px;
          }
          .pf-tut-dest-cards {
            display: flex;
            gap: 12px;
          }
          .pf-tut-dest-card {
            flex: 1;
            padding: 20px 16px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            cursor: pointer;
            text-align: center;
            transition: border-color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s;
            position: relative;
            overflow: hidden;
          }
          .pf-tut-dest-card::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.25s;
          }
          .pf-tut-dest-card.finance::before { background: radial-gradient(ellipse at 50% 0%, rgba(30,120,255,0.14) 0%, transparent 70%); }
          .pf-tut-dest-card.testing::before { background: radial-gradient(ellipse at 50% 0%, rgba(15,184,255,0.14) 0%, transparent 70%); }
          .pf-tut-dest-card:hover::before { opacity: 1; }
          .pf-tut-dest-card:hover {
            border-color: rgba(30,120,255,0.4);
            background: rgba(30,120,255,0.07);
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(30,120,255,0.18);
          }
          .pf-tut-dest-card-icon { font-size: 30px; margin-bottom: 10px; display: block; }
          .pf-tut-dest-card-name {
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 4px;
          }
          .pf-tut-dest-card-sub {
            font-size: 12px;
            color: #5a7090;
          }
          .pf-tut-dest-card-arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(30,120,255,0.15);
            color: #1e78ff;
            font-size: 13px;
            margin-top: 12px;
          }

          /* Loading screen */
          .pf-tut-loading-body {
            padding: 56px 44px 52px;
            text-align: center;
          }
          .pf-tut-route-text {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 13px;
            letter-spacing: 0.18em;
            color: #1e78ff;
            text-transform: uppercase;
            margin-bottom: 18px;
          }
          .pf-tut-loading-title {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 30px;
            letter-spacing: 0.04em;
            color: #fff;
            margin: 0 0 8px;
          }
          .pf-tut-loading-sub {
            font-size: 14px;
            color: #5a7090;
            margin: 0 0 36px;
          }
          .pf-tut-progress-track {
            height: 4px;
            background: rgba(255,255,255,0.07);
            border-radius: 99px;
            overflow: hidden;
            margin-bottom: 12px;
          }
          .pf-tut-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #1e78ff, #0fb8ff);
            border-radius: 99px;
            transition: width 0.12s ease;
            box-shadow: 0 0 12px rgba(30,120,255,0.5);
          }
          .pf-tut-progress-pct {
            font-size: 12px;
            color: #3d5070;
            font-variant-numeric: tabular-nums;
          }
          .pf-tut-loading-dots {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin-top: 28px;
          }
          .pf-tut-loading-dots span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #1e78ff;
            animation: dotPulse 1.2s ease-in-out infinite;
          }
          .pf-tut-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
          .pf-tut-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes dotPulse {
            0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
            40%          { transform: scale(1.2); opacity: 1; }
          }

          /* Video player */
          .pf-tut-video-card {
            background: #000;
            border: 1px solid rgba(30,120,255,0.15);
            border-radius: 24px;
            overflow: hidden;
            width: min(780px, 96vw);
            animation: tutSlideUp 0.35s cubic-bezier(0.16,1,0.3,1);
          }
          .pf-tut-video-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            background: rgba(8,12,20,0.95);
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .pf-tut-video-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #1e78ff;
          }
          .pf-tut-video-badge-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #1e78ff;
            box-shadow: 0 0 8px #1e78ff;
            animation: liveBlink 1.4s ease-in-out infinite;
          }
          @keyframes liveBlink {
            0%,100% { opacity: 1; }
            50%      { opacity: 0.3; }
          }
          .pf-tut-video-close {
            background: rgba(255,255,255,0.07);
            border: none;
            color: #8899b0;
            width: 30px;
            height: 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
          }
          .pf-tut-video-close:hover { background: rgba(255,80,80,0.15); color: #ff7070; }
          .pf-tut-video-wrap {
            position: relative;
            background: #000;
            cursor: pointer;
          }
          .pf-tut-video-wrap video {
            width: 100%;
            display: block;
            max-height: 420px;
            object-fit: contain;
          }
          .pf-tut-play-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.35);
            opacity: 0;
            transition: opacity 0.2s;
          }
          .pf-tut-video-wrap:hover .pf-tut-play-overlay { opacity: 1; }
          .pf-tut-play-icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(30,120,255,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #fff;
            backdrop-filter: blur(4px);
          }
          .pf-tut-video-controls {
            padding: 14px 20px 20px;
            background: rgba(8,12,20,0.98);
          }
          .pf-tut-scrub-track {
            height: 5px;
            background: rgba(255,255,255,0.1);
            border-radius: 99px;
            cursor: pointer;
            margin-bottom: 14px;
            position: relative;
            overflow: hidden;
          }
          .pf-tut-scrub-fill {
            height: 100%;
            background: linear-gradient(90deg, #1e78ff, #0fb8ff);
            border-radius: 99px;
            pointer-events: none;
            transition: width 0.1s linear;
          }
          .pf-tut-ctrl-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .pf-tut-ctrl-btn {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.09);
            color: #ccd6e8;
            padding: 8px 14px;
            border-radius: 10px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
            white-space: nowrap;
          }
          .pf-tut-ctrl-btn:hover { background: rgba(30,120,255,0.15); color: #fff; border-color: rgba(30,120,255,0.3); }
          .pf-tut-ctrl-btn.active { background: rgba(30,120,255,0.22); color: #4da6ff; border-color: rgba(30,120,255,0.4); }
          .pf-tut-time {
            font-size: 12px;
            color: #3d5070;
            font-variant-numeric: tabular-nums;
            margin-left: auto;
          }
          .pf-tut-continue-wrap {
            padding: 0 20px 20px;
            background: rgba(8,12,20,0.98);
          }
          .pf-tut-continue-btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #1e78ff 0%, #0fb8ff 100%);
            color: #fff;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 8px 28px rgba(30,120,255,0.35);
            transition: transform 0.15s, box-shadow 0.15s, opacity 0.3s;
            position: relative;
            overflow: hidden;
            animation: tutSlideUp 0.4s cubic-bezier(0.16,1,0.3,1);
          }
          .pf-tut-continue-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transform: translateX(-100%);
            animation: shimmer 1.6s ease infinite;
          }
          .pf-tut-continue-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(30,120,255,0.45); }
        `}</style>

        <div className="pf-tut-overlay">

          {/* POPUP 1 — Are you new? */}
          {tutorialStep === "newbie" && (
            <div className="pf-tut-card">
              <div className="pf-tut-newbie-body">
                <span className="pf-tut-icon">🎓</span>
                <h2>Are you new to Gordon College?</h2>
                <p>Take a quick virtual tour of the campus before you dive in. We'll walk you through key locations.</p>
                <div className="pf-tut-newbie-btns">
                  <button className="pf-tut-btn-yes" onClick={() => setTutorialStep("welcome")}>
                    Yes, show me around →
                  </button>
                  <button className="pf-tut-btn-no" onClick={closeTutorial}>
                    No thanks
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* POPUP 2 — Welcome + destination picker */}
          {tutorialStep === "welcome" && (
            <div className="pf-tut-card">
              <img className="pf-tut-welcome-cover" src={pathfinderCover} alt="Pathfinder Campus" />
              <div className="pf-tut-welcome-body">
                <h2>Welcome to Gordon College Pathfinder</h2>
                <p>Your smart campus navigation system. Pick a destination below and we'll walk you through getting there from the lobby.</p>
                <div className="pf-tut-dest-label">Choose your destination</div>
                <div className="pf-tut-dest-cards">
                  <div className="pf-tut-dest-card finance" onClick={() => pickDestination("finance")}>
                    <span className="pf-tut-dest-card-icon">🏦</span>
                    <div className="pf-tut-dest-card-name">Finance Office</div>
                    <div className="pf-tut-dest-card-sub">Lobby → Finance</div>
                    <div className="pf-tut-dest-card-arrow">→</div>
                  </div>
                  <div className="pf-tut-dest-card testing" onClick={() => pickDestination("testing")}>
                    <span className="pf-tut-dest-card-icon">🧪</span>
                    <div className="pf-tut-dest-card-name">Testing Area</div>
                    <div className="pf-tut-dest-card-sub">Lobby → Testing Area</div>
                    <div className="pf-tut-dest-card-arrow">→</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POPUP 3 — Cinematic loading */}
          {tutorialStep === "loading" && (
            <div className="pf-tut-card">
              <div className="pf-tut-loading-body">
                <div className="pf-tut-route-text">Pathfinder Navigation</div>
                <div className="pf-tut-loading-title">Preparing lobby → {destLabel}</div>
                <div className="pf-tut-loading-sub">Loading walking route...</div>
                <div className="pf-tut-progress-track">
                  <div className="pf-tut-progress-bar" style={{ width: `${loadingProgress}%` }} />
                </div>
                <div className="pf-tut-progress-pct">{Math.round(loadingProgress)}%</div>
                <div className="pf-tut-loading-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {/* POPUP 4 — Video player */}
          {tutorialStep === "video" && (
            <div className="pf-tut-video-card">
              {/* Top bar */}
              <div className="pf-tut-video-topbar">
                <div className="pf-tut-video-badge">
                  <div className="pf-tut-video-badge-dot" />
                  Lobby → {destLabel}
                </div>
                <button className="pf-tut-video-close" onClick={closeTutorial}>✕</button>
              </div>

              {/* Video */}
              <div className="pf-tut-video-wrap" onClick={togglePlayPause}>
                <video
                  ref={videoRef}
                  src={selectedDestination === "finance" ? financeVideo : testingVideo}
                  autoPlay
                  muted
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={(e) => { e.target.playbackRate = 5; handleVideoTimeUpdate(); }}
                  onEnded={() => { setVideoPlaying(false); setVideoEnded(true); }}
                />
                <div className="pf-tut-play-overlay">
                  <div className="pf-tut-play-icon">
                    {videoPlaying ? "⏸" : "▶"}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="pf-tut-video-controls">
                {/* Scrub bar */}
                <div
                  className="pf-tut-scrub-track"
                  onClick={handleScrub}
                >
                  <div
                    className="pf-tut-scrub-fill"
                    style={{ width: videoDuration ? `${(videoProgress / videoDuration) * 100}%` : "0%" }}
                  />
                </div>

                {/* Control row */}
                <div className="pf-tut-ctrl-row">
                  <button className="pf-tut-ctrl-btn" onClick={togglePlayPause}>
                    {videoPlaying ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button className="pf-tut-ctrl-btn" onClick={rewind10}>
                    ⏪ −10s
                  </button>
                  <button className={`pf-tut-ctrl-btn ${videoSpeed === 0.5 ? "active" : ""}`} onClick={() => setSpeed(0.5)}>🐢 0.5×</button>
                  <button className={`pf-tut-ctrl-btn ${videoSpeed === 1 ? "active" : ""}`} onClick={() => setSpeed(1)}>1×</button>
                  <button className={`pf-tut-ctrl-btn ${videoSpeed === 5 ? "active" : ""}`} onClick={() => setSpeed(5)}>⚡ 5×</button>
                  <button className={`pf-tut-ctrl-btn ${videoSpeed === 10 ? "active" : ""}`} onClick={() => setSpeed(10)}>🚀 10×</button>
                  <span className="pf-tut-time">
                    {formatTime(videoProgress)} / {formatTime(videoDuration)}
                  </span>
                </div>
              </div>

              {/* Continue button — appears when video ends */}
              {videoEnded && (
                <div className="pf-tut-continue-wrap">
                  <button className="pf-tut-continue-btn" onClick={closeTutorial}>
                    Continue to Application →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </>)}
    </>
  );
}