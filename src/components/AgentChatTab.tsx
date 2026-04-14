"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { Button, Badge } from "@cloudflare/kumo";
import { Plug, PlugsConnected, CircleNotch, Warning, WifiSlash } from "@phosphor-icons/react";
import { AGENT_HOST, AGENT_NAME } from "@/lib/constants";
import type { MCPServerState } from "@/lib/types";
import { AgentChatMessage } from "./AgentChatMessage";
import { AgentChatInput } from "./AgentChatInput";
import type { UIMessage } from "ai";

// MCP servers state from the agents SDK
type MCPServersState = {
  servers: Record<string, {
    name: string;
    state: string;
    server_url?: string;
    error?: string | null;
  }>;
  tools: Array<{
    name: string;
    description?: string;
    serverId: string;
  }>;
};

type AgentConnectionState = "connecting" | "connected" | "error";

export function AgentChatTab() {
  // Agent WebSocket connection state
  const [agentConnectionState, setAgentConnectionState] = useState<AgentConnectionState>("connecting");
  const [agentError, setAgentError] = useState<string | null>(null);

  // MCP portal state
  const [mcpState, setMcpState] = useState<MCPServerState>("disconnected");
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [toolCount, setToolCount] = useState(0);

  // Chat state
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to the agent via WebSocket
  // CF Access JWT is sent automatically via cookies (credentials: include)
  // Use onMcpUpdate (not onStateUpdate) for MCP server state changes
  const agent = useAgent({
    host: AGENT_HOST,
    agent: AGENT_NAME,
    onMcpUpdate: (state: MCPServersState) => {
      // Update MCP state when agent broadcasts MCP server updates
      const servers = Object.values(state?.servers || {});
      if (servers.length > 0) {
        const server = servers[0];
        if (server.state === "ready") {
          setMcpState("ready");
          setMcpError(null);
        } else if (server.state === "authenticating") {
          setMcpState("authenticating");
        } else if (server.state === "error") {
          setMcpState("error");
          setMcpError(server.error || "Connection failed");
        } else if (server.state === "discovering") {
          setMcpState("connecting");
        }
      } else {
        // No servers means disconnected
        setMcpState("disconnected");
        setToolCount(0);
      }
      // Update tool count
      setToolCount(state?.tools?.length || 0);
    },
  });

  // Track agent connection state via the ready promise
  useEffect(() => {
    if (!agent?.ready) {
      setAgentConnectionState("connecting");
      return;
    }

    let mounted = true;

    // Wait for the agent to be ready
    agent.ready
      .then(async () => {
        if (mounted) {
          setAgentConnectionState("connected");
          setAgentError(null);
          
          // Check if MCP is already authenticated from a previous session
          try {
            const state = await agent.call("getMcpState") as MCPServersState;
            const servers = Object.values(state?.servers || {});
            if (servers.length > 0 && servers[0].state === "ready") {
              setMcpState("ready");
              setMcpError(null);
              setToolCount(state?.tools?.length || 0);
            }
          } catch {
            // Ignore errors when checking initial MCP state
          }
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          setAgentConnectionState("error");
          setAgentError(err?.message || "Failed to connect to agent");
        }
      });

    return () => {
      mounted = false;
    };
  }, [agent?.ready]);

  // Chat hook for AI conversations
  // Skip initial messages fetch to avoid errors when agent isn't reachable
  const {
    messages,
    sendMessage,
    clearHistory,
    isStreaming,
  } = useAgentChat({
    agent,
    getInitialMessages: null, // Skip initial fetch - we'll load messages after connection
    credentials: "include", // Send cookies for CF Access
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle MCP connection
  const handleConnect = useCallback(async () => {
    if (!agent || agentConnectionState !== "connected") return;
    
    setMcpState("connecting");
    setMcpError(null);

    try {
      const result = await agent.call("connectMcpPortal") as {
        state: string;
        id?: string;
        authUrl?: string;
      };

      if (result.state === "authenticating" && result.authUrl) {
        setMcpState("authenticating");
        
        // Open OAuth popup
        const popup = window.open(
          result.authUrl,
          "mcp-auth",
          "width=600,height=700,left=200,top=100"
        );

        // Poll for popup close (OAuth callback will close it)
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Refresh MCP state after OAuth completes
            refreshMcpState();
          }
        }, 500);
      } else if (result.state === "ready") {
        setMcpState("ready");
        refreshMcpState();
      }
    } catch (err) {
      setMcpState("error");
      setMcpError(err instanceof Error ? err.message : "Connection failed");
    }
  }, [agent, agentConnectionState]);

  // Refresh MCP state from agent
  const refreshMcpState = useCallback(async () => {
    if (!agent || agentConnectionState !== "connected") return;

    try {
      const state = await agent.call("getMcpState") as MCPServersState;
      const servers = Object.values(state?.servers || {});
      
      if (servers.length > 0 && servers[0].state === "ready") {
        setMcpState("ready");
        setMcpError(null);
      }
      setToolCount(state?.tools?.length || 0);
    } catch {
      // Ignore refresh errors
    }
  }, [agent, agentConnectionState]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (!agent || agentConnectionState !== "connected") return;

    try {
      await agent.call("disconnectMcpPortal");
      setMcpState("disconnected");
      setToolCount(0);
    } catch (err) {
      setMcpError(err instanceof Error ? err.message : "Disconnect failed");
    }
  }, [agent, agentConnectionState]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || agentConnectionState !== "connected") return;
    
    sendMessage({ text: trimmed });
    setInput("");
  }, [input, isStreaming, sendMessage, agentConnectionState]);

  // Retry agent connection
  const handleRetryConnection = useCallback(() => {
    // Force a page reload to reconnect
    window.location.reload();
  }, []);

  // Render agent connection error state
  if (agentConnectionState === "error") {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center max-w-md">
          <WifiSlash weight="light" className="h-16 w-16 text-kumo-subtle mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-kumo-default mb-2">
            Agent Unavailable
          </h2>
          <p className="text-kumo-strong mb-4">
            Unable to connect to the AI agent backend. This could be because the service is not deployed yet or is temporarily unavailable.
          </p>
          {agentError && (
            <p className="text-sm text-kumo-subtle mb-4 font-mono bg-kumo-canvas p-2 rounded">
              {agentError}
            </p>
          )}
          <Button variant="secondary" onClick={handleRetryConnection}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // Render connecting state
  if (agentConnectionState === "connecting") {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center">
          <CircleNotch weight="bold" className="h-12 w-12 text-kumo-accent mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-kumo-default mb-2">
            Connecting to Agent
          </h2>
          <p className="text-kumo-strong">
            Establishing WebSocket connection...
          </p>
        </div>
      </div>
    );
  }

  // Connection status UI for MCP
  const renderMcpConnectionStatus = () => {
    switch (mcpState) {
      case "disconnected":
        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleConnect}
            className="gap-1.5"
          >
            <Plug weight="bold" className="h-4 w-4" />
            Connect MCP Portal
          </Button>
        );
      
      case "connecting":
      case "authenticating":
        return (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="gap-1.5"
          >
            <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
            {mcpState === "authenticating" ? "Authenticating..." : "Connecting..."}
          </Button>
        );
      
      case "ready":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="green" className="gap-1">
              <PlugsConnected weight="bold" className="h-3 w-3" />
              MCP Connected
              {toolCount > 0 && (
                <span className="ml-1 opacity-75">({toolCount} tools)</span>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-kumo-strong hover:text-kumo-default"
            >
              Disconnect
            </Button>
          </div>
        );
      
      case "error":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="red" className="gap-1">
              <Warning weight="bold" className="h-3 w-3" />
              Connection Error
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConnect}
            >
              Retry
            </Button>
            {mcpError && (
              <span className="text-sm text-kumo-subtle">{mcpError}</span>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* MCP Connection Status Bar */}
      <div className="flex-shrink-0 py-3 px-4 border-b border-kumo-line bg-kumo-canvas/50 flex items-center justify-between">
        <span className="text-sm text-kumo-strong">
          Agent Chat with MCP Tools
        </span>
        {renderMcpConnectionStatus()}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-kumo-subtle">
              <p className="text-lg mb-2">Agent Chat</p>
              <p className="text-sm">
                {mcpState === "ready"
                  ? "MCP tools are connected. Start chatting to use them."
                  : "Connect to the MCP portal to enable external tools, or just start chatting."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: UIMessage) => (
              <AgentChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-kumo-line p-4">
        <AgentChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={agentConnectionState !== "connected"}
          loading={isStreaming}
        />
        {messages.length > 0 && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearHistory()}
              className="text-kumo-subtle hover:text-kumo-strong"
            >
              Clear history
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
