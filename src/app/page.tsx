"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";

type Attachment = {
  filename: string;
  mimeType: string;
  data: string;
};

type Message = {
  sender: "user" | "bot";
  text: string;
  attachments?: Attachment[];
};

const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 1;

type AIGatewayInfo = {
  model: string | null;
  provider: string | null;
  debug: string | null;
};

type ErrorResponse = {
  success: boolean;
  error?: Array<{ code: number; message: string }>;
};

const ADJECTIVES = [
  "Happy", "Clever", "Swift", "Brave", "Calm", "Bright", "Cool", "Gentle",
  "Lucky", "Mighty", "Noble", "Quick", "Silent", "Wise", "Cosmic", "Golden",
  "Crystal", "Mystic", "Stellar", "Velvet", "Azure", "Crimson", "Emerald",
];

const ANIMALS = [
  "Panda", "Wolf", "Fox", "Owl", "Bear", "Tiger", "Eagle", "Dolphin",
  "Falcon", "Hawk", "Lion", "Otter", "Raven", "Shark", "Phoenix", "Dragon",
  "Panther", "Koala", "Penguin", "Rabbit", "Turtle", "Zebra", "Lynx",
];

function generateRandomUsername(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${animal}${number}`;
}

function getRandomUsernames(count: number): string[] {
  const usernames = new Set<string>();
  while (usernames.size < count) {
    usernames.add(generateRandomUsername());
  }
  return Array.from(usernames);
}

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
  textarea: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "100%",
    color: "#000",
    outlineColor: "#0070f3",
    resize: "vertical" as const,
    minHeight: "80px",
    fontFamily: "inherit",
  },
  label: {
    fontWeight: "bold" as const,
    display: "block",
    marginBottom: "0.5rem",
  },
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  dialogTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    fontWeight: "bold" as const,
  },
  suggestionButton: {
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    backgroundColor: "#f0f4f8",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
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
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [dialogUsername, setDialogUsername] = useState("");
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aigInfo, setAigInfo] = useState<AIGatewayInfo>({ model: null, provider: null, debug: null });
  const [aigHighlight, setAigHighlight] = useState(false);
  const [aigError, setAigError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const hasUsername = username.trim().length > 0;
  const hasInput = input.trim().length > 0 || attachments.length > 0;
  const canSubmit = hasUsername && hasInput && !loading;

  useEffect(() => {
    const storedUsername = localStorage.getItem("chatbot_username");
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setSuggestedUsernames(getRandomUsernames(4));
      setShowUsernameDialog(true);
    }
  }, []);

  useEffect(() => {
    if (!showUsernameDialog) {
      textareaRef.current?.focus();
    }
  }, [showUsernameDialog]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUsernameSubmit = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    localStorage.setItem("chatbot_username", trimmedName);
    setUsername(trimmedName);
    setShowUsernameDialog(false);
    setDialogUsername("");
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    } else if (e.key === "Escape") {
      setInput("");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    const currentCount = attachments.length;

    for (let i = 0; i < files.length && currentCount + newAttachments.length < MAX_FILES; i++) {
      const file = files[i];

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        alert(`File type not supported: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large (max 10MB): ${file.name}`);
        continue;
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        filename: file.name,
        mimeType: file.type,
        data: base64,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput && attachments.length === 0) return;

    const currentAttachments = [...attachments];
    setMessages((prev) => [...prev, { sender: "user", text: trimmedInput, attachments: currentAttachments.length > 0 ? currentAttachments : undefined }]);
    setInput("");
    setAttachments([]);
    setLoading(true);
    setAigError(false);

    try {
      const requestBody: { prompt: string; username: string; attachments?: Attachment[] } = {
        prompt: trimmedInput,
        username: username.trim(),
      };
      if (currentAttachments.length > 0) {
        requestBody.attachments = currentAttachments;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-JWT-Assertion": getCookie("CF_Authorization") || "",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const model = response.headers.get("cf-aig-model");
      const provider = response.headers.get("cf-aig-provider");

      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json() as ErrorResponse;
        const errorInfo = errorData.error?.[0];
        const debugMsg = errorInfo ? `Error ${errorInfo.code}: ${errorInfo.message}` : `HTTP ${response.status}`;
        setAigInfo({ model, provider, debug: debugMsg });
        setAigError(true);
        setAigHighlight(true);
        setTimeout(() => setAigHighlight(false), 1500);
        setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I'm unable to process your request at this time. Please try again later." }]);
        return;
      }

      const hasChanged = model !== aigInfo.model || provider !== aigInfo.provider;
      setAigInfo({ model, provider, debug: null });
      if (hasChanged) {
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
      {showUsernameDialog && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h2 style={styles.dialogTitle}>Welcome! What&apos;s your name?</h2>
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              Enter a username to start chatting
            </p>
            <input
              type="text"
              value={dialogUsername}
              onChange={(e) => setDialogUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUsernameSubmit(dialogUsername)}
              placeholder="Enter your username"
              style={{ ...styles.input, marginBottom: "1rem" }}
              autoFocus
            />
            <p style={{ marginBottom: "0.5rem", color: "#666", fontSize: "0.9rem" }}>
              Or pick a suggested username:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {suggestedUsernames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleUsernameSubmit(name)}
                  style={styles.suggestionButton}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e0e7ef")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f0f4f8")}
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleUsernameSubmit(dialogUsername)}
              disabled={!dialogUsername.trim()}
              style={{
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: dialogUsername.trim() ? "pointer" : "not-allowed",
                opacity: dialogUsername.trim() ? 1 : 0.5,
                width: "100%",
              }}
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

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
          backgroundColor: aigError ? "#fee2e2" : aigHighlight ? "#fff3cd" : "#f0f4f8",
          borderRadius: "6px",
          fontSize: "0.85rem",
          color: aigError ? "#991b1b" : "#333",
          border: `1px solid ${aigError ? "#dc2626" : aigHighlight ? "#ffc107" : "#ddd"}`,
          transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
        }}
      >
        <strong>AI Gateway Info</strong>
        <div style={{ marginTop: "0.5rem" }}>
          <div><span style={{ color: aigError ? "#b91c1c" : "#666" }}>Model:</span> {aigInfo.model || "N/A"}</div>
          <div><span style={{ color: aigError ? "#b91c1c" : "#666" }}>Provider:</span> {aigInfo.provider || "N/A"}</div>
          <div><span style={{ color: aigError ? "#b91c1c" : "#666" }}>Debug:</span> {aigInfo.debug || "N/A"}</div>
        </div>
      </div>

      <div
        style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "1rem", height: "300px", overflowY: "auto", marginBottom: "1rem", backgroundColor: "#f9f9f9" }}
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.sender === "user" ? "right" : "left", margin: "0.5rem 0" }}>
            <strong>{msg.sender === "user" ? username : "Bot"}:</strong>
            {msg.attachments && msg.attachments.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "0.5rem 0", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                {msg.attachments.map((att, attIndex) => (
                  <div key={attIndex} style={{ display: "inline-block" }}>
                    {att.mimeType.startsWith("image/") ? (
                      <img
                        src={`data:${att.mimeType};base64,${att.data}`}
                        alt={att.filename}
                        style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    ) : (
                      <div style={{ padding: "0.5rem", backgroundColor: "#e5e7eb", borderRadius: "4px", fontSize: "0.8rem" }}>
                        📄 {att.filename}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="markdown-content">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "#444", fontStyle: "italic" }}>Bot is typing...</div>}
        <div ref={chatEndRef} />
      </div>

      {username && (
        <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#666" }}>
          Chatting as: <strong>{username}</strong>{" "}
          <button
            type="button"
            onClick={() => {
              setSuggestedUsernames(getRandomUsernames(4));
              setDialogUsername(username);
              setShowUsernameDialog(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#0070f3",
              cursor: "pointer",
              fontSize: "0.9rem",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Change
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label htmlFor="chat-input" style={styles.label}>Your message</label>

        {attachments.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.5rem", backgroundColor: "#f0f4f8", borderRadius: "4px" }}>
            {attachments.map((att, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                }}
              >
                {att.mimeType.startsWith("image/") ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.data}`}
                    alt={att.filename}
                    style={{ width: "24px", height: "24px", objectFit: "cover", borderRadius: "2px" }}
                  />
                ) : (
                  <span>📄</span>
                )}
                <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.filename}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0.25rem",
                    fontSize: "1rem",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={hasUsername ? "Type a message and press Enter (Shift+Enter for new line)" : "Please enter your username first"}
            ref={textareaRef}
            disabled={!hasUsername}
            style={{ ...styles.textarea, backgroundColor: hasUsername ? "#fff" : "#f5f5f5", flex: 1 }}
            rows={3}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={ACCEPTED_FILE_TYPES.join(",")}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!hasUsername || attachments.length >= MAX_FILES}
            title={attachments.length >= MAX_FILES ? `Max ${MAX_FILES} files` : "Attach file"}
            style={{
              padding: "0.75rem",
              fontSize: "1.25rem",
              backgroundColor: "#f0f4f8",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: hasUsername && attachments.length < MAX_FILES ? "pointer" : "not-allowed",
              opacity: hasUsername && attachments.length < MAX_FILES ? 1 : 0.5,
            }}
          >
            📎
          </button>
        </div>

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
