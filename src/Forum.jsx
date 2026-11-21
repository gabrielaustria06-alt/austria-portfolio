import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, deleteDoc, doc,
} from "firebase/firestore";

/* ── helpers ── */
const fmt = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

const ROLE_META = {
  student: { label: "Student", icon: "🎓", color: "#40c8e0", bg: "rgba(64,200,224,0.12)", border: "rgba(64,200,224,0.25)" },
  admin:   { label: "Admin",   icon: "🛡️", color: "#ffaa30", bg: "rgba(255,170,48,0.12)",  border: "rgba(255,170,48,0.25)"  },
};

export default function Forum({ userRole, username = "User", onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "student" | "admin"
  const [deleteTarget, setDeleteTarget] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const isAdmin = userRole === "admin";

  /* ── realtime listener ── */
  useEffect(() => {
    const q = query(collection(db, "forum_messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* ── auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "forum_messages"), {
        text,
        role: userRole,
        username,
        createdAt: serverTimestamp(),
      });
      setInput("");
      textareaRef.current?.focus();
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, "forum_messages", deleteTarget)); } catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const filtered = filter === "all" ? messages : messages.filter((m) => m.role === filter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        * { box-sizing: border-box; }

        .fr-root {
          min-height: 100vh;
          background: #080c14;
          display: flex;
          flex-direction: column;
          font-family: 'DM Sans', sans-serif;
          color: #c8d8ec;
          position: relative;
          overflow: hidden;
        }

        /* grid bg */
        .fr-grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(30,120,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,120,255,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 30%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }
        .fr-orb-a {
          position: fixed; width: 420px; height: 420px;
          background: #1e78ff; border-radius: 50%; filter: blur(100px);
          opacity: 0.1; top: -140px; left: -80px; pointer-events: none; z-index: 0;
        }
        .fr-orb-b {
          position: fixed; width: 300px; height: 300px;
          background: #0ff0a0; border-radius: 50%; filter: blur(90px);
          opacity: 0.07; bottom: 0; right: -60px; pointer-events: none; z-index: 0;
        }

        /* topbar */
        .fr-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 60px;
          border-bottom: 1px solid rgba(30,120,255,0.12);
          background: rgba(8,12,20,0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 20;
          flex-shrink: 0;
        }
        .fr-topbar-left {
          display: flex; align-items: center; gap: 14px;
        }
        .fr-back-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(30,120,255,0.1);
          border: 1px solid rgba(30,120,255,0.2);
          color: #1e78ff;
          padding: 7px 14px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
          letter-spacing: 0.02em;
        }
        .fr-back-btn:hover { background: rgba(30,120,255,0.18); }
        .fr-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px; letter-spacing: 0.08em; color: #fff;
        }
        .fr-title span { color: #1e78ff; }
        .fr-badge {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 10px; border-radius: 20px;
        }
        .fr-live-dot {
          display: inline-block; width: 7px; height: 7px;
          background: #40e0a0; border-radius: 50%;
          margin-right: 6px; animation: frPulse 1.4s ease-in-out infinite;
        }
        @keyframes frPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }

        .fr-topbar-right {
          display: flex; align-items: center; gap: 8px;
        }
        .fr-role-pill {
          font-size: 12px; font-weight: 600; padding: 5px 12px;
          border-radius: 20px; display: flex; align-items: center; gap: 6px;
        }

        /* filter bar */
        .fr-filter-bar {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          background: rgba(8,12,20,0.7);
          backdrop-filter: blur(8px);
          position: sticky;
          top: 60px;
          z-index: 10;
          flex-shrink: 0;
        }
        .fr-filter-btn {
          padding: 6px 16px; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: #8899b0;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
        }
        .fr-filter-btn:hover { border-color: rgba(30,120,255,0.3); color: #c8d8ec; }
        .fr-filter-btn.active {
          background: rgba(30,120,255,0.15);
          border-color: rgba(30,120,255,0.4);
          color: #fff;
        }
        .fr-filter-count {
          background: rgba(255,255,255,0.08);
          color: #8899b0; font-size: 11px; font-weight: 600;
          padding: 1px 7px; border-radius: 10px; min-width: 22px; text-align: center;
        }
        .fr-filter-btn.active .fr-filter-count { background: rgba(30,120,255,0.25); color: #1e78ff; }

        /* messages area */
        .fr-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px 0 16px;
          display: flex; flex-direction: column; gap: 4px;
          z-index: 1;
          position: relative;
        }
        .fr-messages::-webkit-scrollbar { width: 4px; }
        .fr-messages::-webkit-scrollbar-track { background: transparent; }
        .fr-messages::-webkit-scrollbar-thumb { background: rgba(30,120,255,0.2); border-radius: 4px; }

        /* date divider */
        .fr-date-divider {
          display: flex; align-items: center; gap: 12px;
          padding: 8px 24px; margin: 8px 0;
        }
        .fr-date-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .fr-date-text { font-size: 11px; color: #3d5070; letter-spacing: 0.08em; font-weight: 600; text-transform: uppercase; }

        /* message bubble */
        .fr-msg-row {
          display: flex; align-items: flex-end; gap: 10px;
          padding: 2px 24px;
          animation: frMsgIn 0.25s ease forwards;
        }
        @keyframes frMsgIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
        .fr-msg-row.mine { flex-direction: row-reverse; }
        .fr-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
          border: 2px solid;
        }
        .fr-bubble-wrap { max-width: 62%; display: flex; flex-direction: column; gap: 4px; }
        .fr-msg-row.mine .fr-bubble-wrap { align-items: flex-end; }
        .fr-bubble-meta {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; color: #3d5070; letter-spacing: 0.02em;
          padding: 0 4px;
        }
        .fr-msg-row.mine .fr-bubble-meta { flex-direction: row-reverse; }
        .fr-meta-name { font-weight: 600; }
        .fr-meta-role {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 1px 7px; border-radius: 10px;
        }
        .fr-bubble {
          padding: 10px 14px; border-radius: 16px;
          font-size: 14.5px; line-height: 1.55;
          word-break: break-word; position: relative;
          border: 1px solid;
          transition: box-shadow 0.2s;
        }
        .fr-bubble:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .fr-bubble.mine {
          background: linear-gradient(135deg, rgba(30,120,255,0.22), rgba(30,120,255,0.12));
          border-color: rgba(30,120,255,0.3);
          color: #e8f2ff;
          border-bottom-right-radius: 4px;
        }
        .fr-bubble.other {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          color: #c8d8ec;
          border-bottom-left-radius: 4px;
        }
        .fr-delete-btn {
          position: absolute; top: 6px; right: 8px;
          background: rgba(255,60,60,0.1); border: none;
          color: #ff6b6b; font-size: 11px; padding: 2px 7px;
          border-radius: 8px; cursor: pointer; opacity: 0;
          transition: opacity 0.15s; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 4px;
        }
        .fr-bubble:hover .fr-delete-btn { opacity: 1; }
        .fr-delete-btn:hover { background: rgba(255,60,60,0.22); }

        /* empty state */
        .fr-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 12px;
          color: #3d5070; padding: 40px;
        }
        .fr-empty-icon { font-size: 48px; line-height: 1; opacity: 0.5; }
        .fr-empty-text { font-size: 15px; font-weight: 500; }
        .fr-empty-sub { font-size: 13px; opacity: 0.7; }

        /* input bar */
        .fr-input-bar {
          display: flex; align-items: flex-end; gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid rgba(30,120,255,0.12);
          background: rgba(8,12,20,0.9);
          backdrop-filter: blur(12px);
          position: sticky; bottom: 0;
          z-index: 10;
          flex-shrink: 0;
        }
        .fr-textarea-wrap {
          flex: 1; position: relative;
        }
        .fr-textarea {
          width: 100%;
          min-height: 46px; max-height: 140px;
          resize: none; overflow-y: auto;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; color: #e8f2ff;
          font-family: 'DM Sans', sans-serif; font-size: 14.5px;
          padding: 12px 16px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.5;
        }
        .fr-textarea::placeholder { color: #3d5070; }
        .fr-textarea:focus {
          border-color: #1e78ff;
          box-shadow: 0 0 0 3px rgba(30,120,255,0.12);
        }
        .fr-textarea::-webkit-scrollbar { width: 3px; }
        .fr-textarea::-webkit-scrollbar-thumb { background: rgba(30,120,255,0.2); border-radius: 3px; }
        .fr-hint {
          position: absolute; bottom: 10px; right: 14px;
          font-size: 11px; color: #2a3a55; pointer-events: none;
        }
        .fr-send-btn {
          width: 46px; height: 46px; border-radius: 14px;
          border: none; flex-shrink: 0;
          background: linear-gradient(135deg, #1e78ff, #0fb8ff);
          color: #fff; font-size: 18px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(30,120,255,0.35);
        }
        .fr-send-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(30,120,255,0.45); }
        .fr-send-btn:active:not(:disabled) { transform: translateY(0); }
        .fr-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .fr-send-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          border-radius: 50%; animation: frSpin 0.7s linear infinite;
        }
        @keyframes frSpin { to { transform: rotate(360deg); } }

        /* confirm delete modal */
        .fr-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          animation: frFadeIn 0.15s ease;
        }
        @keyframes frFadeIn { from{opacity:0} to{opacity:1} }
        .fr-modal {
          background: #0f1520; border: 1px solid rgba(255,60,60,0.2);
          border-radius: 20px; padding: 28px 32px; max-width: 360px; width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          animation: frSlideUp 0.2s ease;
        }
        @keyframes frSlideUp { from{transform:translateY(16px);opacity:0} to{transform:none;opacity:1} }
        .fr-modal h3 { margin: 0 0 8px; font-size: 17px; color: #fff; font-weight: 600; }
        .fr-modal p { margin: 0 0 24px; font-size: 14px; color: #8899b0; line-height: 1.5; }
        .fr-modal-btns { display: flex; gap: 10px; }
        .fr-modal-cancel {
          flex: 1; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: #8899b0; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          transition: background 0.2s;
        }
        .fr-modal-cancel:hover { background: rgba(255,255,255,0.05); }
        .fr-modal-confirm {
          flex: 1; padding: 10px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #ff3c3c, #ff6b6b);
          color: #fff; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 16px rgba(255,60,60,0.3); transition: opacity 0.2s;
        }
        .fr-modal-confirm:hover { opacity: 0.88; }

        @media (max-width: 600px) {
          .fr-topbar { padding: 0 14px; }
          .fr-filter-bar { padding: 10px 14px; gap: 6px; }
          .fr-messages { padding: 16px 0 12px; }
          .fr-msg-row { padding: 2px 14px; }
          .fr-bubble-wrap { max-width: 80%; }
          .fr-input-bar { padding: 10px 12px; }
          .fr-title { font-size: 20px; }
        }
      `}</style>

      <div className="fr-root">
        <div className="fr-grid-bg" />
        <div className="fr-orb-a" />
        <div className="fr-orb-b" />

        {/* Top bar */}
        <div className="fr-topbar">
          <div className="fr-topbar-left">
            <button className="fr-back-btn" onClick={onBack}>
              ← Back
            </button>
            <div className="fr-title">
              <span>P</span>ATH<span>F</span>INDER · <span style={{ color: "#40c8e0" }}>FORUM</span>
            </div>
          </div>
          <div className="fr-topbar-right">
            <span
              className="fr-role-pill"
              style={{
                background: ROLE_META[userRole]?.bg,
                border: `1px solid ${ROLE_META[userRole]?.border}`,
                color: ROLE_META[userRole]?.color,
              }}
            >
              {ROLE_META[userRole]?.icon} {ROLE_META[userRole]?.label}
            </span>
            <span style={{ fontSize: 13, color: "#3d5070" }}>
              <span className="fr-live-dot" />
              {messages.length} msg{messages.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="fr-filter-bar">
          {[
            { key: "all", label: "All Messages", icon: "💬" },
            { key: "student", label: "Students", icon: "🎓" },
            { key: "admin", label: "Admin", icon: "🛡️" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              className={`fr-filter-btn ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {icon} {label}
              <span className="fr-filter-count">
                {key === "all"
                  ? messages.length
                  : messages.filter((m) => m.role === key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="fr-messages">
          {filtered.length === 0 ? (
            <div className="fr-empty">
              <div className="fr-empty-icon">💬</div>
              <div className="fr-empty-text">
                {filter === "all" ? "No messages yet." : `No messages from ${filter}s yet.`}
              </div>
              <div className="fr-empty-sub">Be the first to start the conversation!</div>
            </div>
          ) : (
            filtered.map((msg, i) => {
              const isMine = msg.role === userRole;
              const meta = ROLE_META[msg.role] || ROLE_META.student;
              const canDelete = isAdmin || isMine;
              /* date divider */
              const showDate =
                i === 0 ||
                (msg.createdAt &&
                  filtered[i - 1]?.createdAt &&
                  msg.createdAt.toDate?.().toDateString() !==
                    filtered[i - 1].createdAt.toDate?.().toDateString());

              return (
                <div key={msg.id}>
                  {showDate && msg.createdAt && (
                    <div className="fr-date-divider">
                      <div className="fr-date-line" />
                      <div className="fr-date-text">
                        {msg.createdAt.toDate?.().toLocaleDateString("en-PH", {
                          weekday: "long", month: "long", day: "numeric",
                        }) || "Today"}
                      </div>
                      <div className="fr-date-line" />
                    </div>
                  )}
                  <div className={`fr-msg-row ${isMine ? "mine" : ""}`}>
                    {/* Avatar */}
                    <div
                      className="fr-avatar"
                      style={{ background: meta.bg, borderColor: meta.border, fontSize: 18 }}
                      title={`${msg.username} (${meta.label})`}
                    >
                      {meta.icon}
                    </div>
                    {/* Bubble */}
                    <div className="fr-bubble-wrap">
                      <div className="fr-bubble-meta">
                        <span className="fr-meta-name" style={{ color: meta.color }}>
                          {isMine ? "You" : msg.username || meta.label}
                        </span>
                        <span
                          className="fr-meta-role"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
                          {meta.label}
                        </span>
                        <span>{fmt(msg.createdAt)}</span>
                      </div>
                      <div className={`fr-bubble ${isMine ? "mine" : "other"}`}>
                        {msg.text}
                        {canDelete && (
                          <button
                            className="fr-delete-btn"
                            onClick={() => setDeleteTarget(msg.id)}
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="fr-input-bar">
          <div className="fr-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="fr-textarea"
              rows={1}
              placeholder={`Message as ${ROLE_META[userRole]?.label}… (Enter to send)`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
              }}
            />
            <span className="fr-hint">⏎ send · ⇧⏎ newline</span>
          </div>
          <button
            className="fr-send-btn"
            onClick={send}
            disabled={!input.trim() || sending}
            title="Send message"
          >
            {sending ? <div className="fr-send-spinner" /> : "➤"}
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fr-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="fr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete message?</h3>
            <p>This action cannot be undone. The message will be permanently removed from the forum.</p>
            <div className="fr-modal-btns">
              <button className="fr-modal-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="fr-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
