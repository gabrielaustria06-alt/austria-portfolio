import { useState } from "react";
import SmartNav from "./components/SmartNav.jsx";
import React from 'react';
import campusLogo from "./assets/logo.png";

// Lazy import legacy app
const getLegacyApp = () => import("./App.jsx");

export default function AppSelector() {
  const [mode, setMode] = useState(null); // null | "legacy" | "smart"
  const [LegacyApp, setLegacyApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(null);

  const selectLegacy = async () => {
    setLoading(true);
    const mod = await getLegacyApp();
    setLegacyApp(() => mod.default);
    setMode("legacy");
    setLoading(false);
  };

  const selectSmart = () => setMode("smart");

  if (mode === "smart") return <SmartNav />;
  if (mode === "legacy" && LegacyApp) return <LegacyApp />;

  return (
    <div style={s.root}>
      {/* Animated background grid */}
      <div style={s.grid} />
      <div style={s.gridFade} />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          ...s.particle,
          left: `${(i * 37 + 11) % 100}%`,
          top:  `${(i * 53 + 7)  % 100}%`,
          animationDelay: `${i * 0.4}s`,
          animationDuration: `${3 + (i % 4)}s`,
          width:  i % 3 === 0 ? 4 : 2,
          height: i % 3 === 0 ? 4 : 2,
          opacity: 0.15 + (i % 5) * 0.08,
        }} />
      ))}

      {/* Header */}
      <div style={s.header}>
        <img src={campusLogo} alt="Campus Pathfinder" style={s.logoImg} />

        <div style={s.headerTitle}>GORDON COLLEGE</div>

        <h1 className="as-pf-title">
          <span className="as-accent">P</span><span className="as-shimmer">ATH</span><span className="as-accent">F</span><span className="as-shimmer">INDER</span>
        </h1>

        <div style={s.headerDivider} />
        <div style={s.headerSub}>Campus Navigation System</div>
      </div>

      {/* Version cards */}
      <div style={s.cards}>

        {/* Smart Nav card */}
        <div
          style={{
            ...s.card, ...s.cardSmart,
            ...(hovering === 'smart' ? s.cardHover : {}),
          }}
          onMouseEnter={() => setHovering('smart')}
          onMouseLeave={() => setHovering(null)}
          onClick={selectSmart}
        >
          <div style={s.cardBadge}>NEW</div>
          <div style={s.cardGlow} />

          <div style={s.cardIconWrap}>
            <div style={s.cardIcon3D}>
              <span style={{ fontSize: 52 }}>🗺️</span>
            </div>
          </div>

          <div style={s.cardContent}>
            <div style={s.cardTitle}>Smart Navigation</div>
            <div style={s.cardVersion}>Version 2.0</div>
            <div style={s.cardDesc}>
              3D interactive campus map with real-time pathfinding,
              and instant room search across all 6 floors.
            </div>

            <div style={s.featureList}>
              {[
                '🏗️  3D Building View',
                '📍  Live Route Guidance',
                '🔍  Instant Room Search',
                '🪜  Multi-Floor Navigation',
                '⭐  Category Browsing',
              ].map((f, i) => (
                <div key={i} style={s.feature}>{f}</div>
              ))}
            </div>
          </div>

          <button style={{ ...s.launchBtn, ...s.launchBtnSmart }}>
            Launch Smart Nav →
          </button>
        </div>

        {/* Divider */}
        <div style={s.orDivider}>
          <div style={s.orLine} />
          <div style={s.orText}>OR</div>
          <div style={s.orLine} />
        </div>

        {/* Legacy card */}
        <div
          style={{
            ...s.card, ...s.cardLegacy,
            ...(hovering === 'legacy' ? s.cardHoverLegacy : {}),
          }}
          onMouseEnter={() => setHovering('legacy')}
          onMouseLeave={() => setHovering(null)}
          onClick={selectLegacy}
        >
          <div style={s.cardBadgeLegacy}>LEGACY</div>

          <div style={s.cardIconWrap}>
            <div style={s.cardIcon3D}>
              <span style={{ fontSize: 52 }}>🗂️</span>
            </div>
          </div>

          <div style={s.cardContent}>
            <div style={{ ...s.cardTitle, color: '#c8a878' }}>Campus Map</div>
            <div style={{ ...s.cardVersion, color: 'rgba(200,168,120,0.6)' }}>Version 1.0</div>
            <div style={s.cardDesc}>
              The original floor-by-floor campus map with room statuses, 
              street view navigation, and admin tools.
            </div>

            <div style={s.featureList}>
              {[
                '🗺️  Floor Plan Maps',
                '🥽  Street View (Beta)',
                '📌  Room Status Tracker',
                '🔊  Voice Assistant',
                '⚙️  Admin Controls',
              ].map((f, i) => (
                <div key={i} style={{ ...s.feature, color: 'rgba(200,168,120,0.7)' }}>{f}</div>
              ))}
            </div>
          </div>

          <button style={{ ...s.launchBtn, ...s.launchBtnLegacy }} disabled={loading}>
            {loading ? 'Loading…' : 'Use Legacy App →'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        Gordon College · Campus Navigation System · All Rights Reserved · {' '}
        <a
          href="https://www.instagram.com/iigabxo/"
          target="_blank"
          rel="noopener noreferrer"
          style={s.footerLink}
        >
          iigabxo
        </a>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #04080e; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes gridMove {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.4;  transform: scale(1.5); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes royalBlueShimmer {
          0%,100% { background-position: 0% 50%;   filter: drop-shadow(0 0 8px  rgba(30,120,255,0.5)); }
          50%      { background-position: 100% 50%; filter: drop-shadow(0 0 18px rgba(30,120,255,0.9)); }
        }
        @keyframes silverShimmer {
          0%,100% { background-position: 0% 50%;   filter: drop-shadow(0 0 8px  rgba(255,255,255,0.35)); }
          50%      { background-position: 100% 50%; filter: drop-shadow(0 0 16px rgba(255,255,255,0.7));  }
        }

        .as-pf-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(28px, 4vw, 44px);
          line-height: 1;
          letter-spacing: 0.12em;
          margin: 0;
          text-align: center;
          animation: slideUp 0.7s ease 0.15s both;
        }
        .as-accent {
          background: linear-gradient(135deg, #1e78ff 0%, #4da6ff 25%, #1e78ff 50%, #0a5ccc 75%, #1e78ff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: royalBlueShimmer 3s ease-in-out infinite;
        }
        .as-shimmer {
          background: linear-gradient(135deg, #e8e8e8 0%, #ffffff 25%, #e8e8e8 50%, #c0c0c0 75%, #e8e8e8 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: silverShimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh', background: '#04080e',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Rajdhani', sans-serif",
    padding: '40px 20px', position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: `
      linear-gradient(rgba(30,120,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30,120,255,0.06) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    animation: 'gridMove 4s linear infinite',
  },
  gridFade: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'radial-gradient(ellipse at center, transparent 20%, #04080e 75%)',
  },
  particle: {
    position: 'absolute', zIndex: 2,
    borderRadius: '50%', background: '#1e78ff',
    animation: 'pulse 3s ease-in-out infinite',
  },
  header: {
    position: 'relative', zIndex: 5,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4, marginBottom: 48,
    animation: 'slideUp 0.6s ease both',
  },
  logoImg: {
    width: 140,
    height: 140,
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 32, fontWeight: 900,
    fontFamily: "'Orbitron', sans-serif",
    letterSpacing: '0.25em', color: '#ffffff',
    textShadow: '0 0 40px rgba(30,120,255,0.5)',
    margin: 0,
  },
  headerDivider: {
    width: 60, height: 2,
    background: 'linear-gradient(90deg, transparent, #1e78ff, transparent)',
  },
  headerSub: {
    fontSize: 13, letterSpacing: '0.3em',
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
  },
  cards: {
    position: 'relative', zIndex: 5,
    display: 'flex', alignItems: 'center', gap: 0,
    flexWrap: 'wrap', justifyContent: 'center',
    animation: 'slideUp 0.7s ease 0.1s both',
  },
  card: {
    position: 'relative', width: 320,
    borderRadius: 20, padding: '32px 28px',
    cursor: 'pointer', overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  cardSmart: {
    background: 'linear-gradient(145deg, rgba(6,16,36,0.98), rgba(8,20,48,0.98))',
    border: '1px solid rgba(30,120,255,0.35)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(30,120,255,0.15)',
  },
  cardLegacy: {
    background: 'linear-gradient(145deg, rgba(20,14,8,0.98), rgba(28,18,8,0.98))',
    border: '1px solid rgba(200,168,120,0.2)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
  },
  cardHover: {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 60px rgba(30,120,255,0.25), 0 0 0 1px rgba(30,120,255,0.4)',
  },
  cardHoverLegacy: {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 60px rgba(200,168,120,0.15)',
  },
  cardGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 180, height: 180, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,120,255,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  cardBadge: {
    position: 'absolute', top: 16, right: 16,
    background: 'linear-gradient(90deg, #1e78ff, #00d4ff)',
    color: '#fff', fontSize: 10, fontWeight: 800,
    letterSpacing: '0.15em', padding: '3px 10px',
    borderRadius: 20,
  },
  cardBadgeLegacy: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(200,168,120,0.15)',
    border: '1px solid rgba(200,168,120,0.3)',
    color: '#c8a878', fontSize: 10, fontWeight: 800,
    letterSpacing: '0.15em', padding: '3px 10px',
    borderRadius: 20,
  },
  cardIconWrap: {
    display: 'flex', justifyContent: 'center',
    animation: 'float 3s ease-in-out infinite',
  },
  cardIcon3D: {
    width: 90, height: 90, borderRadius: 24,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { display: 'flex', flexDirection: 'column', gap: 8 },
  cardTitle: {
    fontSize: 22, fontWeight: 800,
    fontFamily: "'Orbitron', sans-serif",
    color: '#ffffff', letterSpacing: '0.05em',
  },
  cardVersion: { fontSize: 11, letterSpacing: '0.15em', color: 'rgba(100,160,255,0.6)' },
  cardDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.6,
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 },
  feature: { fontSize: 12, color: 'rgba(180,210,255,0.65)', letterSpacing: '0.02em' },
  launchBtn: {
    padding: '13px 20px', borderRadius: 12,
    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
    letterSpacing: '0.05em', cursor: 'pointer',
    border: 'none', transition: 'all 0.2s',
  },
  launchBtnSmart: {
    background: 'linear-gradient(135deg, #1e78ff, #0fb8ff)',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(30,120,255,0.4)',
  },
  launchBtnLegacy: {
    background: 'rgba(200,168,120,0.12)',
    border: '1px solid rgba(200,168,120,0.25)',
    color: '#c8a878',
  },
  orDivider: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12, padding: '0 24px',
  },
  orLine: {
    width: 1, height: 60,
    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
  },
  orText: {
    fontSize: 11, letterSpacing: '0.2em',
    color: 'rgba(255,255,255,0.2)', fontWeight: 700,
  },
  footer: {
    position: 'relative', zIndex: 5,
    marginTop: 48, fontSize: 11,
    letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
  },
  footerLink: {
    color: '#1e78ff',
    textDecoration: 'none',
    textShadow: '0 0 8px rgba(30,120,255,0.8), 0 0 20px rgba(30,120,255,0.4)',
    letterSpacing: '0.08em',
    transition: 'text-shadow 0.2s',
  },
};