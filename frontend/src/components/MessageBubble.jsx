import ailoLogo from "../assets/ailo-logo.png";

export default function MessageBubble({ role = "user", text, time }) {
  const isUser = role === "user";

  const bubbleStyle = {
    background: isUser
      ? "linear-gradient(180deg, rgba(240,170,199,0.30), rgba(240,170,199,0.12))"
      : "linear-gradient(180deg, rgba(30,40,85,0.55), rgba(10,16,40,0.35))",
    color: "#f7f8ff",
    padding: "12px 16px",
    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    border: isUser
      ? "1px solid rgba(240,170,199,0.4)"
      : "1px solid rgba(255,255,255,0.22)",
    boxShadow: isUser
      ? "0 22px 50px rgba(240,170,199,0.25)"
      : "0 18px 48px rgba(6,10,25,0.45)",
    maxWidth: "72%",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    backdropFilter: "blur(18px)",
    lineHeight: 1.45,
  };

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", padding: "8px 12px", gap: 8 }}>
      {!isUser && (
        <img src={ailoLogo} alt="Ailo bot" style={{ width: 28, height: 28, borderRadius: 12, alignSelf: "flex-end" }} />
      )}
      <div style={bubbleStyle}>
        {text}
        {time && (
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7, textAlign: isUser ? "right" : "left" }}>
            {time}
          </div>
        )}
      </div>
      {isUser && <div aria-hidden style={{ width: 28, height: 28 }} />}
    </div>
  );
}
