import { useEffect, useRef, useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + "px";
  }, [value]);

  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        padding: 20,
        borderTop: "1px solid rgba(255,122,162,0.25)",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Type a message…"
        rows={1}
        style={{
          resize: "none",
          width: "100%",
          padding: "12px 14px",
          borderRadius: 18,
          border: "1px solid rgba(31,42,68,0.15)",
          background: "#fff",
          color: "var(--ink)",
          fontSize: 15,
          lineHeight: 1.4,
          boxShadow: "inset 0 2px 6px rgba(31,42,68,0.05)",
        }}
        disabled={disabled}
      />
      <button
        onClick={send}
        disabled={disabled}
        style={{
          padding: "0 28px",
          borderRadius: 999,
          border: "none",
          background: disabled ? "rgba(255,122,162,0.35)" : "var(--brand)",
          color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontSize: 15,
          transition: "transform .1s ease",
        }}
      >
        Send
      </button>
    </div>
  );
}
