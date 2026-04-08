"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@cloudflare/kumo";
import {
  ChatLayout,
  UsernameDialog,
  AIGatewayPanel,
  AIGatewayActivityPanel,
  ChatMessageList,
  ChatInput,
  PresetPrompts,
} from "@/components";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import type { Message, Attachment, AIGatewayInfo, ErrorResponse, AIGatewayEvent } from "@/lib/types";

// Generate unique IDs for events
let eventIdCounter = 0;
function generateEventId(): string {
  return `event-${Date.now()}-${++eventIdCounter}`;
}

// Parse SSE data from AI Gateway streaming response
// Format: data: {"choices":[{"delta":{"content":"token"}}]}
function parseSSEData(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  const jsonStr = line.slice(6);
  if (jsonStr === "[DONE]") return null;
  try {
    const data = JSON.parse(jsonStr);
    return data.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aigInfo, setAigInfo] = useState<AIGatewayInfo>({
    model: null,
    provider: null,
    debug: null,
  });
  const [aigHighlight, setAigHighlight] = useState(false);
  const [aigError, setAigError] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [aigEvents, setAigEvents] = useState<AIGatewayEvent[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Ref to track streaming event ID for updating it when complete
  const streamingEventIdRef = useRef<string | null>(null);

  const hasUsername = username.trim().length > 0;

  // Load username and dark mode preference from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("chatbot_username");
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      setShowUsernameDialog(true);
    }

    const storedDarkMode = localStorage.getItem("chatbot_dark_mode");
    if (storedDarkMode === "true") {
      setIsDarkMode(true);
      document.documentElement.setAttribute("data-mode", "dark");
    }
  }, []);

  const handleDarkModeToggle = useCallback((isDark: boolean) => {
    setIsDarkMode(isDark);
    localStorage.setItem("chatbot_dark_mode", isDark.toString());
    if (isDark) {
      document.documentElement.setAttribute("data-mode", "dark");
    } else {
      document.documentElement.removeAttribute("data-mode");
    }
  }, []);

  const addEvent = useCallback((event: Omit<AIGatewayEvent, "id" | "timestamp">) => {
    const newEvent = {
      ...event,
      id: generateEventId(),
      timestamp: new Date(),
    };
    setAigEvents((prev) => [...prev, newEvent]);
    return newEvent.id;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<AIGatewayEvent>) => {
    setAigEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      )
    );
  }, []);

  const clearEvents = useCallback(() => {
    setAigEvents([]);
  }, []);

  const handleUsernameSubmit = (name: string) => {
    localStorage.setItem("chatbot_username", name);
    setUsername(name);
    setShowUsernameDialog(false);
  };

  const handleChangeUsername = () => {
    setShowUsernameDialog(true);
  };

  const handlePresetClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleAttachmentAdd = (attachment: Attachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && attachments.length === 0) return;

    const currentAttachments = [...attachments];
    
    // Determine attachment type for event logging
    let attachmentType: string | undefined;
    if (currentAttachments.length > 0) {
      const mimeType = currentAttachments[0].mimeType;
      if (mimeType.startsWith("image/")) {
        attachmentType = "image";
      } else {
        attachmentType = "document";
      }
    }

    // Log request event
    addEvent({
      type: "request",
      promptPreview: trimmedInput.slice(0, 50) + (trimmedInput.length > 50 ? "..." : ""),
      hasAttachment: currentAttachments.length > 0,
      attachmentType,
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: trimmedInput,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      },
    ]);
    setInput("");
    setAttachments([]);
    setLoading(true);
    setAigError(false);

    try {
      const requestBody: {
        prompt: string;
        username: string;
        attachments?: Attachment[];
        stream: boolean;
      } = {
        prompt: trimmedInput,
        username: username.trim(),
        stream: true, // Enable streaming
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

      // Handle error responses (non-streaming JSON)
      if (response.status >= 400 && response.status < 500) {
        const errorData = (await response.json()) as ErrorResponse;
        const errorInfo = errorData.error?.[0];
        const debugMsg = errorInfo
          ? `Error ${errorInfo.code}: ${errorInfo.message}`
          : `HTTP ${response.status}`;

        // Log blocked event
        addEvent({
          type: "blocked",
          model,
          provider,
          httpStatus: response.status,
          blockReason: errorInfo?.message || debugMsg,
        });

        setAigInfo({ model, provider, debug: debugMsg });
        setAigError(true);
        setAigHighlight(true);
        setTimeout(() => setAigHighlight(false), 1500);

        // Create a blocked message with structured info
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Sorry, I'm unable to process your request at this time.",
            blocked: {
              httpStatus: response.status,
              code: errorInfo?.code,
              message: errorInfo?.message,
            },
          },
        ]);
        return;
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get("content-type") || "";
      const isStreaming = contentType.includes("text/event-stream");

      if (isStreaming && response.body) {
        // Log streaming event
        const streamEventId = addEvent({
          type: "streaming",
          model,
          provider,
          httpStatus: response.status,
        });
        streamingEventIdRef.current = streamEventId;

        // Update AI Gateway info
        const hasChanged = model !== aigInfo.model || provider !== aigInfo.provider;
        setAigInfo({ model, provider, debug: null });
        if (hasChanged) {
          setAigHighlight(true);
          setTimeout(() => setAigHighlight(false), 1500);
        }

        // Add a placeholder streaming message
        const streamingMessageIndex = messages.length + 1; // +1 for the user message we just added
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "", isStreaming: true },
        ]);

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines from buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              const token = parseSSEData(trimmedLine);
              if (token) {
                fullText += token;
                // Update the streaming message with accumulated text
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (lastIndex >= 0 && newMessages[lastIndex].sender === "bot") {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      text: fullText,
                      isStreaming: true,
                    };
                  }
                  return newMessages;
                });
              }
            }
          }

          // Process any remaining data in buffer
          if (buffer.trim()) {
            const token = parseSSEData(buffer.trim());
            if (token) {
              fullText += token;
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Finalize the message (remove streaming flag)
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0 && newMessages[lastIndex].sender === "bot") {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              text: fullText || "No response received.",
              isStreaming: false,
            };
          }
          return newMessages;
        });

        // Update the streaming event to a response event
        if (streamingEventIdRef.current) {
          updateEvent(streamingEventIdRef.current, { type: "response" });
          streamingEventIdRef.current = null;
        }

      } else {
        // Non-streaming response (fallback)
        addEvent({
          type: "response",
          model,
          provider,
          httpStatus: response.status,
        });

        const hasChanged = model !== aigInfo.model || provider !== aigInfo.provider;
        setAigInfo({ model, provider, debug: null });
        if (hasChanged) {
          setAigHighlight(true);
          setTimeout(() => setAigHighlight(false), 1500);
        }

        const data = (await response.json()) as { response?: string };
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.response || "No response received." },
        ]);
      }
    } catch {
      // Log error event
      addEvent({
        type: "error",
      });

      // If we were streaming, update the event
      if (streamingEventIdRef.current) {
        updateEvent(streamingEventIdRef.current, { type: "error" });
        streamingEventIdRef.current = null;
      }

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Could not reach chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatLayout
      isDarkMode={isDarkMode}
      onDarkModeToggle={handleDarkModeToggle}
    >
      <UsernameDialog
        open={showUsernameDialog}
        initialUsername={username}
        onSubmit={handleUsernameSubmit}
      />

      <AIGatewayActivityPanel events={aigEvents} onClear={clearEvents} />

      <AIGatewayPanel
        info={aigInfo}
        isError={aigError}
        isHighlighted={aigHighlight}
      />

      <ChatMessageList
        messages={messages}
        username={username}
        loading={loading}
        onPresetClick={handlePresetClick}
      />

      {/* Username display and change button */}
      {hasUsername && (
        <div className="mb-4 text-sm text-kumo-strong">
          Chatting as: <span className="font-medium text-kumo-default">{username}</span>{" "}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleChangeUsername}
            className="text-kumo-link underline"
          >
            Change
          </Button>
        </div>
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        attachments={attachments}
        onAttachmentAdd={handleAttachmentAdd}
        onAttachmentRemove={handleAttachmentRemove}
        onSubmit={handleSubmit}
        disabled={!hasUsername}
        loading={loading}
      />

      {/* Preset prompts below the input when there are messages */}
      {messages.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-kumo-strong mb-2">Try these prompts:</p>
          <PresetPrompts onSelect={handlePresetClick} />
        </div>
      )}
    </ChatLayout>
  );
}
