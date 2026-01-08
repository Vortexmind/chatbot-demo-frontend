"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  sender: "user" | "bot";
  text: string;
};

type BotResponse = {
  response: string;
};

type AIGatewayInfo = {
  model: string | null;
  provider: string | null;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aigInfo, setAigInfo] = useState<AIGatewayInfo>({ model: null, provider: null });
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://chatbot-demo-worker.homesecurity.rocks/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: trimmed }),
        }
      );

      const model = response.headers.get("cf-aig-model");
      const provider = response.headers.get("cf-aig-provider");
      setAigInfo({ model, provider });

      const data: BotResponse = await response.json();
      const botMessage: Message = {
        sender: "bot",
        text: data.response || "No response received.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Error: Could not reach chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setInput("");
    }
  };

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "640px",
        margin: "0 auto",
        color: "#000", // default text color
        backgroundColor: "#fff", // page background
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Well-behaved chatbot
      </h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          fontSize: "0.9rem",
          fontFamily: "system-ui, sans-serif",
          color: "#555",
        }}
      >
        <span>
          Built with{" "}
          <a
            href="https://developers.cloudflare.com/workers-ai/"
            style={{
              color: "#0070f3",
              textDecoration: "none",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Cloudflare Workers AI
          </a>{" "}
          and{" "}
          <a
            href="https://developers.cloudflare.com/ai-gateway/"
            style={{
              color: "#0070f3",
              textDecoration: "none",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Cloudflare AI Gateway
          </a>
          .
        </span>
        <div style={{ marginLeft: "1rem" }}>
          <img
            src="cf-logo-v-rgb.png"
            alt="Cloudflare logo"
            width={48}
            height={48}
            style={{ display: "block" }}
          />
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "1rem",
          height: "300px",
          overflowY: "auto",
          marginBottom: "1rem",
          backgroundColor: "#f9f9f9",
          color: "#000", // ensure visible text
          fontSize: "1rem",
        }}
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "0.5rem 0",
              color: "#000", // explicitly set readable text color
            }}
          >
            <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong>{" "}
            <span>{msg.text}</span>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#444", fontStyle: "italic" }}>
            Bot is typing...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label="Chat message form"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <label htmlFor="chat-input" style={{ fontWeight: "bold" }}>
          Your message
        </label>
        <input
          id="chat-input"
          name="chat"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message and press Enter"
          ref={inputRef}
          aria-required="true"
          aria-label="Chat input"
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            color: "#000", // input text color
            backgroundColor: "#fff",
            outlineColor: "#0070f3",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            opacity: input.trim() && !loading ? 1 : 0.5,
            transition: "opacity 0.2s ease-in-out",
          }}
          aria-disabled={!input.trim() || loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      {(aigInfo.model || aigInfo.provider) && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#f0f4f8",
            borderRadius: "6px",
            fontSize: "0.85rem",
            color: "#333",
            border: "1px solid #ddd",
          }}
        >
          <strong>AI Gateway Info</strong>
          <div style={{ marginTop: "0.5rem" }}>
            {aigInfo.model && (
              <div>
                <span style={{ color: "#666" }}>Model:</span> {aigInfo.model}
              </div>
            )}
            {aigInfo.provider && (
              <div>
                <span style={{ color: "#666" }}>Provider:</span> {aigInfo.provider}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
