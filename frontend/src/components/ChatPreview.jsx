import React, { useEffect, useRef, useState } from "react";
import { SYSTEM_PROMPT } from "../constants/systemPrompt";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const KEY = import.meta.env.VITE_API_KEY;

export default function ChatPreview({ inputRef, interactive = true, onRequestFullscreen }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);      // [{role:'user'|'assistant', content:string}]
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted]   = useState(false);    // 👈 for preview→chat animation
  const [inputHidden, setInputHidden] = useState(false);
  const isPreview = !interactive;

  // keep autofocus behavior for full screen
  const localRef = useRef(null);
  const effectiveRef = inputRef || localRef;

  const chatRef = useRef(null);
  const aiIndexRef = useRef(null); // index of the placeholder assistant message we stream into

  // focus input on mount / when fullscreen opens
  useEffect(() => {
    if (isPreview) return;
    effectiveRef.current?.focus();
  }, [effectiveRef, isPreview]);

  // hide the floating input in fullscreen when user scrolls up / away from bottom
  useEffect(() => {
    if (isPreview) return;
    const el = chatRef.current;
    if (!el) return;

    const onScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = remaining < 160; // show when near bottom
      setInputHidden(!nearBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [isPreview]);

  // scroll helpers
  const scrollToBottom = (smooth = true) => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };
  useEffect(() => { scrollToBottom(false); }, []);
  useEffect(() => { scrollToBottom(true); }, [messages, isLoading]);

  const triggerFullscreen = () => {
    if (onRequestFullscreen) onRequestFullscreen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPreview) {
      triggerFullscreen();
      return;
    }
    if (!input.trim() || isLoading) return;

    if (!started) setStarted(true); // 👈 triggers preview→chat animation first send

    const userMessage = input.trim();
    setInput("");

    // Add user + assistant placeholder in a single update (avoids race conditions)
    setMessages(prev => {
      const next = [...prev, { role: "user", content: userMessage }, { role: "assistant", content: "" }];
      aiIndexRef.current = next.length - 1; // last item is the placeholder
      return next;
    });

    // Demo/no-API path
    if (!API_BASE) {
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => {
          const idx = aiIndexRef.current;
          const updated = [...prev];
          updated[idx] = { role: "assistant", content: "Fullscreen is safe + smooth ✨" };
          return updated;
        });
        // graceful typing fade-out (3s show + 1s fade)
        setTimeout(() => {
          const typingEl = document.querySelector(".typing");
          if (typingEl) {
            typingEl.classList.add("fade-out");
            setTimeout(() => setIsLoading(false), 1000);
          } else {
            setIsLoading(false);
          }
        }, 3000);
      }, 450);
      return;
    }

    // Real API (streaming)
    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(KEY ? { "x-api-key": KEY } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          system_prompt: SYSTEM_PROMPT
        }),
      });

      // If the backend doesn't stream, just parse json and finish
      if (!res.body || typeof res.body.getReader !== "function") {
        const data = await res.json().catch(() => ({}));
        const text = data?.reply ?? "…";
        setMessages(prev => {
          const idx = aiIndexRef.current;
          const updated = [...prev];
          updated[idx] = { role: "assistant", content: text };
          return updated;
        });
        return;
      }

      // Streaming reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            // Expecting { token?: string, done?: boolean }
            if (data.token && !data.done) {
              full += data.token;
              setMessages(prev => {
                const idx = aiIndexRef.current;
                const updated = [...prev];
                updated[idx] = { role: "assistant", content: full };
                return updated;
              });
            }
          } catch {
            // ignore keep-alives / invalid lines
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const idx = aiIndexRef.current;
        const updated = [...prev];
        updated[idx] = { role: "assistant", content: "Error: Something went wrong." };
        return updated;
      });
    } finally {
      // make the typing dots linger + fade out smoothly
      setTimeout(() => {
        const typingEl = document.querySelector(".typing");
        if (typingEl) {
          typingEl.classList.add("fade-out");
          setTimeout(() => setIsLoading(false), 1000); // wait for fade-out anim
        } else {
          setIsLoading(false);
        }
      }, 3000); // show typing for ~3 seconds total
    }
  };

  const previewHandlers = isPreview
    ? {
        role: "button",
        tabIndex: 0,
        onClick: triggerFullscreen,
        onKeyDown: (evt) => {
          if (evt.key === "Enter" || evt.key === " ") {
            evt.preventDefault();
            triggerFullscreen();
          }
        },
        "aria-label": "Open the immersive chat view",
      }
    : {};

  return (
    <div className={`chat-wrap ${started ? "started" : ""} ${isPreview ? "preview-only" : ""}`} {...previewHandlers}>
      <div className="glass chat" ref={chatRef}>
        {/* Preview bubbles (animate out on first send) */}
        {messages.length === 0 && (
          <div className="samples">
            <div className="msg bot">Hi! I’m Ailo — ask me anything.</div>
            <div className="msg user">Go full screen!</div>
            <div className="msg bot">Click here or press “F”.</div>
          </div>
        )}

        {/* Real messages (skip empty assistant placeholder so no blank bubble) */}
        {messages.map((m, i) => {
          if (m.role === "assistant" && !m.content.trim()) return null;
          const enterOnlyFirst = started && i === 0; // only first real message pops
          return (
            <div
              key={i}
              className={`msg ${m.role === "user" ? "user" : "bot"} ${enterOnlyFirst ? "msg-enter" : ""}`}
            >
              {m.content}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="typing" aria-live="polite">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
      </div>

      {/* Input */}
      {isPreview ? (
        <div className="input preview-input" aria-hidden="true">
          <span>Tap to chat with Ailo</span>
        </div>
      ) : (
        <form
          className={`input ${inputHidden ? "input-hidden" : ""}`}
          onSubmit={handleSubmit}
          aria-label="Message Ailo"
          onFocus={() => setInputHidden(false)}
        >
          <input
            ref={effectiveRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
