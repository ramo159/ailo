import React from "react";

export default function Footer() {
  return (
    <footer className="footer-nav" aria-label="Site footer">
      <ul className="footer-list">
        <li>© {new Date().getFullYear()} Ailo.</li>
      </ul>
    </footer>
  );
}
