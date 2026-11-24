"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { Badge, Button } from "@cloudflare/kumo";
import {
  CircleNotch,
  Robot,
  Trash,
  WifiSlash,
  XCircle,
} from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { AGENT_HOST, AGENT_NAME } from "@/lib/constants";
import type { AIGatewayEvent } from "@/lib/types";
import { AgentChatInput } from "./AgentChatInput";
import { AgentChatMessage } from "./AgentChatMessage";
import { MessageBubble } from "./MessageBubble";
import { SenderLabel } from "./SenderLabel";

type ConnectionState = "connecting" | "connected" | "error";

type AgentChatTabProps = {
  onEvent?: (event: Omit<AIGatewayEvent, "id" | "timestamp">) => string;
  onEventUpdate?: (id: string, updates: Partial<AIGatewayEvent>) => void;
};

type ToolPart = {
  type: string;
  toolName?: string;
  state?: string;
};

const ROOM_KEY = "chatbot_agent_room";

const EXAMPLE_PROMPTS = [
  "What's the weather in Paris?",
  "What timezone am I in?",
  "What is 5000 * 3?",
  "How does AI Gateway authentication work?",
];

function getOrCreateRoom(): string {
  if (typeof window === "undefined") return "default";
  let room = window.sessionStorage.getItem(ROOM_KEY);
  if (!room) {
    room = crypto.randomUUID();
    window.sessionStorage.setItem(ROOM_KEY, room);
  }
  return room;
}

function asToolPart(part: UIMessage["parts"][number]): ToolPart | null {
  if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
    return part as unknown as ToolPart;
  }
  return null;
}

function getToolName(part: ToolPart): string {
  if (part.toolName) return part.toolName;
  return part.type.startsWith("tool-") ? part.type.slice(5) : "tool";
}

function getActiveTool(messages: UIMessage[]): string | null {
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  if (!last) return null;
  for (const part of last.parts) {
    const toolPart = asToolPart(part);
    if (
      toolPart &&
      (toolPart.state === "input-streaming" ||
        toolPart.state === "input-available")
    ) {
      return getToolName(toolPart);
    }
  }
  return null;
}

function hasAssistantContent(message: UIMessage | undefined): boolean {
  if (!message || message.role !== "assistant") return false;
  return message.parts.some((part) => {
    if (part.type === "text" || part.type === "reasoning") {
      return Boolean((part as { text?: string }).text?.trim());
    }
    return asToolPart(part) !== null;
  });
}

function isAssistantComplete(message: UIMessage | undefined): boolean {
  if (!message || message.role !== "assistant") return false;
  const hasText = message.parts.some(
    (part) => part.type === "text" && Boolean((part as { text?: string }).text?.trim())
  );
  const hasPendingTool = message.parts.some((part) => {
    const toolPart = asToolPart(part);
    return (
      toolPart &&
      ["input-streaming", "input-available", "approval-requested"].includes(
        toolPart.state ?? ""
      )
    );
  });
  return hasText && !hasPendingTool;
}

export function AgentChatTab({ onEvent, onEventUpdate }: AgentChatTabProps) {
  const [input, setInput] = useState("");
  const [room, setRoom] = useState<string>(() => getOrCreateRoom());
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const requestEventRef = useRef<string | null>(null);
  const finalizedRef = useRef(false);

  const agent = useAgent({
    agent: AGENT_NAME,
    name: room,
    ...(AGENT_HOST ? { host: AGENT_HOST } : {}),
  });

  useEffect(() => {
    let mounted = true;
    setConnection("connecting");
    setConnectionError(null);

    agent.ready
      .then(() => {
        if (mounted) setConnection("connected");
      })
      .catch((err: Error) => {
        if (mounted) {
          setConnection("error");
          setConnectionError(err?.message || "Failed to connect to the agent");
        }
      });

    return () => {
      mounted = false;
    };
  }, [agent.ready]);

  const {
    messages,
    sendMessage,
    clearHistory,
    addToolApprovalResponse,
    status,
    error: chatError,
    isStreaming: isChatStreaming,
    isServerStreaming,
    isRecovering,
  } = useAgentChat({
    agent,
    credentials: "include",
    onToolCall: async ({ toolCall, addToolOutput }) => {
      if (toolCall.toolName === "getUserTimezone") {
        addToolOutput({
          toolCallId: toolCall.toolCallId,
          output: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            localTime: new Date().toLocaleTimeString(),
          },
        });
      }
    },
  });

  const isBusy =
    status === "submitted" ||
    status === "streaming" ||
    isChatStreaming ||
    isServerStreaming ||
    isRecovering;
  const activeTool = isBusy ? getActiveTool(messages) : null;
  const lastMessage = messages[messages.length - 1];
  const showTyping = isBusy && !hasAssistantContent(lastMessage);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  useEffect(() => {
    const eventId = requestEventRef.current;
    if (!eventId) return;

    if (status === "streaming") {
      onEventUpdate?.(eventId, { type: "streaming" });
      return;
    }

    if (status === "error" || chatError) {
      const err = chatError as
        | { statusCode?: number; message?: string; responseBody?: string }
        | undefined;
      const details = `${err?.message ?? ""} ${err?.responseBody ?? ""}`;
      const blocked =
        err?.statusCode === 424 ||
        /424|DLP|guardrail|blocked/i.test(details);
      onEventUpdate?.(
        eventId,
        blocked
          ? {
              type: "blocked",
              httpStatus: 424,
              blockReason: "Blocked by AI Gateway policy",
            }
          : { type: "error" }
      );
      requestEventRef.current = null;
      return;
    }

    if (
      status === "ready" &&
      !isChatStreaming &&
      !isServerStreaming &&
      !isRecovering &&
      !finalizedRef.current
    ) {
      const lastAssistant = [...messages]
        .reverse()
        .find((message) => message.role === "assistant");
      if (isAssistantComplete(lastAssistant)) {
        const meta = (lastAssistant?.metadata ?? {}) as {
          model?: string;
          provider?: string;
          gateway?: string;
        };
        onEventUpdate?.(eventId, {
          type: "response",
          model: meta.model ?? "gemma-4-26b-a4b-it",
          provider: meta.provider ?? "workers-ai",
          httpStatus: 200,
        });
        finalizedRef.current = true;
        requestEventRef.current = null;
      }
    }
  }, [
    status,
    messages,
    onEventUpdate,
    chatError,
    isChatStreaming,
    isServerStreaming,
    isRecovering,
  ]);

  const startRequest = useCallback(
    (prompt: string) => {
      finalizedRef.current = false;
      requestEventRef.current =
        onEvent?.({
          type: "request",
          promptPreview:
            prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
          source: "agent",
        }) ?? null;
    },
    [onEvent]
  );

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isBusy || connection !== "connected") return;
    startRequest(trimmed);
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isBusy, connection, sendMessage, startRequest]);

  const handleExample = useCallback(
    (prompt: string) => {
      if (isBusy || connection !== "connected") return;
      startRequest(prompt);
      sendMessage({ text: prompt });
    },
    [isBusy, connection, sendMessage, startRequest]
  );

  const handleNewChat = useCallback(() => {
    clearHistory();
    const nextRoom = crypto.randomUUID();
    window.sessionStorage.setItem(ROOM_KEY, nextRoom);
    setRoom(nextRoom);
    setInput("");
    requestEventRef.current = null;
    finalizedRef.current = false;
  }, [clearHistory]);

  if (connection === "error") {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center max-w-md">
          <WifiSlash weight="light" className="h-16 w-16 text-kumo-subtle mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-kumo-default mb-2">
            Agent unavailable
          </h2>
          <p className="text-kumo-strong mb-4">
            Could not connect to the agent backend. Check that the agent Worker is
            deployed and that the `/agents/*` route is active.
          </p>
          {connectionError && (
            <p className="text-sm text-kumo-subtle mb-4 font-mono bg-kumo-canvas p-2 rounded">
              {connectionError}
            </p>
          )}
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry connection
          </Button>
        </div>
      </div>
    );
  }

  if (connection === "connecting") {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center">
          <CircleNotch
            weight="bold"
            className="h-12 w-12 text-kumo-accent mx-auto mb-4 animate-spin"
          />
          <h2 className="text-xl font-semibold text-kumo-default mb-2">
            Connecting to agent
          </h2>
          <p className="text-kumo-strong">Opening the WebSocket connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 py-3 px-4 border-b border-kumo-line bg-kumo-canvas/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Robot weight="bold" className="h-4 w-4 text-kumo-accent" />
          <span className="text-sm text-kumo-strong">Agent Chat</span>
          <Badge variant="neutral-subtle" className="text-xs">
            Workers AI + AI Gateway
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="green" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Connected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="gap-1 text-kumo-strong hover:text-kumo-default"
          >
            <Trash weight="bold" className="h-4 w-4" />
            New chat
          </Button>
        </div>
      </div>

      {isBusy && (
        <div className="flex-shrink-0 py-2 px-4 bg-kumo-canvas/80 border-b border-kumo-line flex items-center gap-2">
          <CircleNotch
            weight="bold"
            className="h-3.5 w-3.5 text-kumo-accent animate-spin"
          />
          <span className="text-sm text-kumo-strong">
            {status === "submitted"
              ? "Sending..."
              : activeTool
                ? `Using ${activeTool}...`
                : "Agent is thinking..."}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 px-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-kumo-subtle max-w-md">
              <Robot weight="light" className="h-14 w-14 mx-auto mb-3" />
              <p className="text-lg mb-2 text-kumo-strong">Agent Chat</p>
              <p className="text-sm mb-4">
                This agent streams from Workers AI through AI Gateway and can call
                server tools, browser tools, and approval-gated tools.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExample(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: UIMessage, index) => (
              <AgentChatMessage
                key={message.id}
                message={message}
                isStreaming={
                  isBusy &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                }
                onApprove={(id) =>
                  addToolApprovalResponse({ id, approved: true })
                }
                onDeny={(id) =>
                  addToolApprovalResponse({ id, approved: false })
                }
              />
            ))}
            {showTyping && (
              <div className="my-3 text-left">
                <SenderLabel isUser={false} />
                <MessageBubble isUser={false}>
                  <span className="inline-flex items-center gap-2 text-sm text-kumo-strong">
                    <CircleNotch
                      weight="bold"
                      className="h-4 w-4 text-kumo-accent animate-spin"
                    />
                    Agent is thinking...
                  </span>
                </MessageBubble>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {chatError && (
        <div className="flex-shrink-0 mx-4 mb-2 p-3 rounded-lg border border-kumo-danger-subtle bg-kumo-danger-tint text-sm flex items-start gap-2">
          <XCircle weight="fill" className="h-4 w-4 text-kumo-danger mt-0.5" />
          <div>
            <p className="font-medium text-kumo-default">
              Agent request blocked or failed
            </p>
            <p className="text-kumo-strong">
              AI Gateway may have blocked this request via a guardrail or DLP
              policy.
            </p>
            <details className="mt-1">
              <summary className="text-xs text-kumo-subtle cursor-pointer">
                Details
              </summary>
              <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                {chatError.message}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 border-t border-kumo-line p-4">
        <AgentChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={connection !== "connected"}
          loading={isBusy}
        />
      </div>
    </div>
  );
}
