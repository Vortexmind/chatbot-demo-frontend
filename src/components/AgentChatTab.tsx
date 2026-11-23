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
} from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { AGENT_HOST, AGENT_NAME } from "@/lib/constants";
import { AgentChatInput } from "./AgentChatInput";
import { AgentChatMessage } from "./AgentChatMessage";

type ConnectionState = "connecting" | "connected" | "error";

const EXAMPLE_PROMPTS = [
  "What's the weather in Paris?",
  "What timezone am I in?",
  "What is 5000 * 3?",
  "How does AI Gateway authentication work?",
];

export function AgentChatTab() {
  const [input, setInput] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const agent = useAgent({
    agent: AGENT_NAME,
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

  const isStreaming = status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || connection !== "connected") return;
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isStreaming, connection, sendMessage]);

  const handleExample = useCallback(
    (prompt: string) => {
      if (isStreaming || connection !== "connected") return;
      sendMessage({ text: prompt });
    },
    [isStreaming, connection, sendMessage]
  );

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
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearHistory()}
              className="gap-1 text-kumo-strong hover:text-kumo-default"
            >
              <Trash weight="bold" className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

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
                  isStreaming &&
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
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-kumo-line p-4">
        <AgentChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={connection !== "connected"}
          loading={isStreaming}
        />
      </div>
    </div>
  );
}
