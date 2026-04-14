"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChatLayout,
  UsernameDialog,
  AIGatewayDrawer,
  ChatMessageList,
  ChatInput,
  PresetPrompts,
  AgentChatTab,
} from "@/components";
import { API_URL } from "@/lib/constants";
import { getCookie } from "@/lib/utils";
import type { Message, Attachment, AIGatewayInfo, ErrorResponse, AIGatewayEvent, ChatTab } from "@/lib/types";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("standard");
  
  // Ref to track streaming event ID for updating it when complete
  const streamingEventIdRef = useRef<string | null>(null);
  // Ref to track current aigInfo for comparison in submitMessage
  const aigInfoRef = useRef<AIGatewayInfo>(aigInfo);

  const hasUsername = username.trim().length > 0;
  const blockedCount = aigEvents.filter((e) => e.type === "blocked").length;

  // Keep aigInfoRef in sync
  useEffect(() => {
    aigInfoRef.current = aigInfo;
  }, [aigInfo]);

  // Load username, dark mode, and drawer preferences from localStorage on mount
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

    const storedDrawer = localStorage.getItem("chatbot_drawer_open");
    if (storedDrawer === "true") {
      setIsDrawerOpen(true);
    }

    const storedTab = localStorage.getItem("chatbot_active_tab") as ChatTab | null;
    if (storedTab === "standard" || storedTab === "agent") {
      setActiveTab(storedTab);
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

  const handleDrawerToggle = useCallback(() => {
    setIsDrawerOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem("chatbot_drawer_open", newValue.toString());
      return newValue;
    });
  }, []);

  const handleTabChange = useCallback((tab: ChatTab) => {
    setActiveTab(tab);
    localStorage.setItem("chatbot_active_tab", tab);
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

  const handleAttachmentAdd = (attachment: Attachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // New chat: reset everything
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setAigEvents([]);
    setAigInfo({ model: null, provider: null, debug: null });
    setAigError(false);
    setAigHighlight(false);
    setInput("");
    setAttachments([]);
  }, []);

  // Core submission logic extracted so it can be called with a prompt directly
  const submitMessage = useCallback(async (promptText: string, messageAttachments: Attachment[]) => {
    const trimmedInput = promptText.trim();
    if (!trimmedInput && messageAttachments.length === 0) return;

    // Determine attachment type for event logging
    let attachmentType: string | undefined;
    if (messageAttachments.length > 0) {
      const mimeType = messageAttachments[0].mimeType;
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
      hasAttachment: messageAttachments.length > 0,
      attachmentType,
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: trimmedInput,
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
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
        stream: true,
      };
      if (messageAttachments.length > 0) {
        requestBody.attachments = messageAttachments;
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
        // Use a simple, clean message in the chat - details are in the debug panel
        const isRateLimit = response.status === 429;
        const chatText = isRateLimit
          ? "Sorry, too many requests. Please try again later."
          : "Sorry, I can't help with that.";

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: chatText,
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
        const currentInfo = aigInfoRef.current;
        const hasChanged = model !== currentInfo.model || provider !== currentInfo.provider;
        setAigInfo({ model, provider, debug: null });
        if (hasChanged) {
          setAigHighlight(true);
          setTimeout(() => setAigHighlight(false), 1500);
        }

        // Add a placeholder streaming message
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

        const currentInfo = aigInfoRef.current;
        const hasChanged = model !== currentInfo.model || provider !== currentInfo.provider;
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

      // Use a simple, clean error message in the chat - details are in the debug panel
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong. Please try again.", blocked: { httpStatus: 0 } },
      ]);
    } finally {
      setLoading(false);
    }
  }, [username, addEvent, updateEvent]);

  // Handle submit from input (uses current input state and attachments)
  const handleSubmit = useCallback(() => {
    submitMessage(input.trim(), [...attachments]);
  }, [input, attachments, submitMessage]);

  // Handle preset click: auto-send the prompt immediately
  const handlePresetClick = useCallback((prompt: string) => {
    if (loading) return;
    submitMessage(prompt, []);
  }, [loading, submitMessage]);

  // Drawer content
  const drawerContent = (
    <AIGatewayDrawer
      events={aigEvents}
      onClear={clearEvents}
      info={aigInfo}
      isError={aigError}
      isHighlighted={aigHighlight}
    />
  );

  return (
    <ChatLayout
      isDarkMode={isDarkMode}
      onDarkModeToggle={handleDarkModeToggle}
      username={hasUsername ? username : undefined}
      onChangeUsername={handleChangeUsername}
      isDrawerOpen={isDrawerOpen}
      onDrawerToggle={handleDrawerToggle}
      drawerContent={drawerContent}
      blockedCount={blockedCount}
      onNewChat={activeTab === "standard" ? handleNewChat : undefined}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <UsernameDialog
        open={showUsernameDialog}
        initialUsername={username}
        onSubmit={handleUsernameSubmit}
      />

      {activeTab === "standard" ? (
        <>
          {/* Chat messages - flex-1 to fill available space */}
          <ChatMessageList
            messages={messages}
            username={username}
            loading={loading}
          />

          {/* Preset prompts above input */}
          <div className="mt-4 mb-2">
            <PresetPrompts onSelect={handlePresetClick} disabled={loading || !hasUsername} />
          </div>

          {/* Chat input */}
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
        </>
      ) : (
        <AgentChatTab />
      )}
    </ChatLayout>
  );
}
