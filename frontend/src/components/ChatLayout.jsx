import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import ChatInput from "./ChatInput.jsx";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function ChatLayout() {
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "Hi! I’m Ailo. How can I help today?", ts: Date.now() },
  ]);
  const [loading, setLoading] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (userText) => {
    const userMsg = { id: crypto.randomUUID(), role: "user", text: userText, ts: Date.now() };
    const botId = crypto.randomUUID();
    const botPlaceholder = { id: botId, role: "bot", text: "", ts: Date.now(), streaming: true };

    setMessages((m) => [...m, userMsg, botPlaceholder]);

    const updateBot = (updater) => {
      setMessages((m) =>
        m.map((msg) => (msg.id === botId ? { ...msg, ...updater(msg) } : msg))
      );
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Server error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let doneStreaming = false;

      while (!doneStreaming) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");

          if (!rawEvent.startsWith("data:")) continue;
          const payload = rawEvent.replace(/^data:\s*/, "");
          if (!payload) continue;

          let parsed;
          try {
            parsed = JSON.parse(payload);
          } catch (err) {
            continue;
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          if (parsed.token) {
            updateBot((msg) => ({ text: (msg.text ?? "") + parsed.token }));
          }

          if (parsed.done) {
            doneStreaming = true;
            break;
          }
        }
      }

      updateBot((msg) => ({ streaming: false, ts: Date.now() }));
    } catch (error) {
      console.error(error);
      updateBot(() => ({
        text: "Sorry, something went wrong reaching the server.",
        streaming: false,
        ts: Date.now(),
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        display: "grid",
        gridTemplateRows: "1fr auto",
        height: "calc(100vh - 120px)",
        background: "linear-gradient(180deg,#fff9fb 0%,#ffeef6 55%,#ffe1ea 100%)",
        border: "1px solid rgba(255,122,162,0.25)",
        borderRadius: 28,
        boxShadow: "0 30px 80px rgba(255,122,162,0.25)",
        overflow: "hidden",
      }}
    >
      <div
        ref={scroller}
        role="list"
        style={{
          overflowY: "auto",
          padding: "20px 24px 8px",
          scrollBehavior: "smooth",
          background:
            "radial-gradient(circle at top,#fffdfd 0%,rgba(255,255,255,0) 60%)",
        }}
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            text={m.text}
            time={new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          />
        ))}
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </section>
  );
}
