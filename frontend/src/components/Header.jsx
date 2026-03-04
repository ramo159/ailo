import React from "react";

export default function Header({ connected = false }){
  return (
    <>
      <div className="brand">
        <h1>Ailo</h1>
      </div>
      <div className="status" title={connected ? "Online" : "Demo (no backend configured)"}>
        <span className={`dot ${connected ? "ok" : "off"}`} />
        <span className="label">{connected ? "Online" : "Demo"}</span>
      </div>
    </>
  );
}
