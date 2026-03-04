import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import ChatPreview from "./components/ChatPreview.jsx";
import ChatHistory from "./components/ChatHistory.jsx";
import Splash from "./components/Splash.jsx";
import logo from "./assets/ailo-logo.png"; // ✅ for homepage logo
import Info from "./components/Info.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/info" element={<Info />} />
    </Routes>
  );
}

// Your original UI moved into Home
function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFS, setIsFS] = useState(false);
  const [view, setView] = useState("home"); // "home" | "history"
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const openInfoPage = () => {
    navigate("/info");
  };

  const enterFull = () => setIsFS(true);
  const exitFull  = () => setIsFS(false);
  const goHome = () => setView("home");
  const goHistory = () => setView("history");

  useEffect(() => {
    document.body.classList.toggle("is-fs", isFS);
    if (isFS && inputRef.current) setTimeout(() => inputRef.current?.focus(), 60);
  }, [isFS]);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (e.key.toLowerCase() === "f") (isFS ? exitFull() : enterFull());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFS]);

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;

  if (isFS) {
    return (
      <div className="fs-overlay" role="dialog" aria-modal="true" aria-label="Full screen chat">
        <div className="fs-body">
          <div className="fs-content glass">
            <ChatPreview inputRef={inputRef} />
          </div>
        </div>
        <div className="close-below">
          <button className="close-fullscreen" onClick={exitFull} aria-label="Exit full screen" type="button">✕</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <div className="page-actions" role="group" aria-label="Primary Ailo actions">
        <button className="btn btn-primary" type="button" onClick={goHistory}>Chat history</button>
        <button className="btn btn-outline" type="button" onClick={enterFull}>Chat with Ailo</button>
        </div>
        {view === "home" && (
          <div className="badge-ribbon" aria-label="Ailo highlights">
            <span className="badge">No login required</span>
            <span className="badge">Zero-setup</span>
            <span className="badge">Export chats</span>
          </div>
        )}
        {view === "history" ? (
          <ChatHistory onBack={goHome} />
        ) : (
          <>
            <section className="hero">
              <article className="glass hero-card hero-about">
                <div className="hero-text">
                  <div className="hero-logo-card">
                    <img src={logo} alt="Ailo Logo" className="ailo-logo" />
                  <button className="hero-info-link" type="button" onClick={openInfoPage}>
                      Tap for more info
                    </button>
                  </div>
                  <div className="hero-copy">
                    <h1>Meet Ailo — your friendly AI chatbot.</h1>
                  <p>Simple, fast, and privacy-minded. Ask questions, get answers, and keep your focus.</p>
                  </div>
                </div>
              </article>

              <aside className="glass hero-card hero-chat" id="try">
                <ChatPreview interactive={false} onRequestFullscreen={enterFull} />
              </aside>
            </section>
          </>
        )}
      </div>
      {view === "home" && <div className="demo-tag">Ailo Demo</div>}
    </>
  );
}
