import React, { useEffect, useState } from "react";
import logo from "../assets/ailo-logo.png"; 

export default function Splash({ onDone }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowWelcome(true), 200);   // fade in "Welcome to Ailo"
    const t2 = setTimeout(() => setShowLogo(true), 600);      // fade in logo after
    const t3 = setTimeout(() => onDone?.(), 4000);            // exit splash after a few seconds

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="splash" role="dialog" aria-label="Ailo is loading">
      <div className="splash-aurora" />

      {showWelcome && (
        <h2 className="splash-welcome">welcome to...</h2>
      )}

      {showLogo && (
        <img className="splash-logo" src={logo} alt="Ailo logo" />
      )}
    </div>
  );
}
