"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";

type Message = {
  sender: "user" | "bot";
  text: string;
};

type AIGatewayInfo = {
  model: string | null;
  provider: string | null;
};

const styles = {
  main: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
    maxWidth: "640px",
    margin: "0 auto",
    color: "#000",
    backgroundColor: "#fff",
  },
  link: {
    color: "#0070f3",
    textDecoration: "none",
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "100%",
    color: "#000",
    outlineColor: "#0070f3",
  },
  label: {
    fontWeight: "bold" as const,
    display: "block",
    marginBottom: "0.5rem",
  },
} as const;

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aigInfo, setAigInfo] = useState<AIGatewayInfo>({ model: null, provider: null });
  const [aigHighlight, setAigHighlight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hasUsername = username.trim().length > 0;
  const hasInput = input.trim().length > 0;
  const canSubmit = hasUsername && hasInput && !loading;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setMessages((prev) => [...prev, { sender: "user", text: trimmedInput }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-JWT-Assertion": getCookie("CF_Authorization") || "",
        },
        credentials: "include",
        body: JSON.stringify({ prompt: trimmedInput, username: username.trim() }),
      });

      const model = response.headers.get("cf-aig-model");
      const provider = response.headers.get("cf-aig-provider");
      if (model !== aigInfo.model || provider !== aigInfo.provider) {
        setAigInfo({ model, provider });
        setAigHighlight(true);
        setTimeout(() => setAigHighlight(false), 1500);
      }

      const data = await response.json() as { response?: string };
      setMessages((prev) => [...prev, { sender: "bot", text: data.response || "No response received." }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "❌ Error: Could not reach chatbot." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Well-behaved chatbot</h1>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.9rem", color: "#555" }}>
        <span>
          Built with{" "}
          <a href="https://developers.cloudflare.com/workers-ai/" style={styles.link}>Cloudflare Workers AI</a>
          {" "}and{" "}
          <a href="https://developers.cloudflare.com/ai-gateway/" style={styles.link}>Cloudflare AI Gateway</a>.
        </span>
        <img src="cf-logo-v-rgb.png" alt="Cloudflare logo" width={48} height={48} style={{ marginLeft: "1rem" }} />
      </div>

      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          backgroundColor: aigHighlight ? "#fff3cd" : "#f0f4f8",
          borderRadius: "6px",
          fontSize: "0.85rem",
          color: "#333",
          border: `1px solid ${aigHighlight ? "#ffc107" : "#ddd"}`,
          transition: "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        <strong>AI Gateway Info</strong>
        <div style={{ marginTop: "0.5rem" }}>
          <div><span style={{ color: "#666" }}>Model:</span> {aigInfo.model || "N/A"}</div>
          <div><span style={{ color: "#666" }}>Provider:</span> {aigInfo.provider || "N/A"}</div>
        </div>
      </div>

      <div
        style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "1rem", height: "300px", overflowY: "auto", marginBottom: "1rem", backgroundColor: "#f9f9f9" }}
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.sender === "user" ? "right" : "left", margin: "0.5rem 0" }}>
            <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong>
            <div className="markdown-content">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "#444", fontStyle: "italic" }}>Bot is typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="username-input" style={styles.label}>Username</label>
        <input
          id="username-input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name to start chatting"
          style={{ ...styles.input, backgroundColor: "#fff" }}
        />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label htmlFor="chat-input" style={styles.label}>Your message</label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setInput("")}
          placeholder={hasUsername ? "Type a message and press Enter" : "Please enter your username first"}
          ref={inputRef}
          disabled={!hasUsername}
          style={{ ...styles.input, backgroundColor: hasUsername ? "#fff" : "#f5f5f5" }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.5,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}
