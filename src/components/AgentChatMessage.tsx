"use client";

import { CloudflareLogo } from "@cloudflare/kumo";
import { User, Wrench, CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";

type AgentChatMessageProps = {
  message: UIMessage;
};

// Helper to check if a part is a static tool part (AI SDK v6 uses 'tool-${toolName}' pattern)
function isStaticToolPart(part: UIMessage["parts"][number]): part is UIMessage["parts"][number] & {
  type: `tool-${string}`;
  toolInvocation: {
    toolName: string;
    toolCallId: string;
    state: string;
    args?: unknown;
    result?: unknown;
  };
} {
  return part.type.startsWith("tool-");
}

// Helper to check for dynamic tool part (MCP tools)
function isDynamicToolPart(part: UIMessage["parts"][number]): part is UIMessage["parts"][number] & {
  type: "dynamic-tool";
  toolName: string;
  toolCallId: string;
  state: string;
  args?: unknown;
  result?: unknown;
} {
  return part.type === "dynamic-tool";
}

export function AgentChatMessage({ message }: AgentChatMessageProps) {
  const isUser = message.role === "user";
  
  // Debug: log message structure in development
  if (process.env.NODE_ENV === "development") {
    console.log("AgentChatMessage:", { role: message.role, parts: message.parts });
  }

  // Extract text content from parts
  const textParts = message.parts.filter(p => p.type === "text") as Array<{ type: "text"; text: string }>;
  const toolParts = message.parts.filter(p => p.type.startsWith("tool-") || p.type === "dynamic-tool");
  
  // Check if we have any displayable content
  const hasTextContent = textParts.some(p => p.text && p.text.trim().length > 0);
  const hasToolContent = toolParts.length > 0;
  
  // If no content at all, don't render empty bubble
  if (!hasTextContent && !hasToolContent) {
    return null;
  }

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-kumo-accent flex items-center justify-center">
          <CloudflareLogo variant="glyph" className="h-5 w-5 text-white" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-kumo-accent text-white rounded-br-md"
            : "bg-kumo-base border border-kumo-line text-kumo-default rounded-bl-md"
        }`}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text" && part.text && part.text.trim()) {
            return (
              <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }

          // Handle AI SDK v6 static tool invocations (type: 'tool-${toolName}')
          if (isStaticToolPart(part)) {
            const { toolInvocation } = part;
            return (
              <ToolInvocationPart
                key={index}
                toolName={toolInvocation.toolName}
                state={toolInvocation.state}
                args={toolInvocation.args}
                result={toolInvocation.result}
              />
            );
          }

          // Handle dynamic tool invocations (MCP tools)
          if (isDynamicToolPart(part)) {
            return (
              <ToolInvocationPart
                key={index}
                toolName={part.toolName}
                state={part.state}
                args={part.args}
                result={part.result}
              />
            );
          }

          // Skip other part types (reasoning, source, file, etc.)
          return null;
        })}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-kumo-strong flex items-center justify-center">
          <User weight="bold" className="h-4 w-4 text-kumo-canvas" />
        </div>
      )}
    </div>
  );
}

type ToolInvocationPartProps = {
  toolName: string;
  state: string;
  args?: unknown;
  result?: unknown;
};

function ToolInvocationPart({ toolName, state, args, result }: ToolInvocationPartProps) {
  // AI SDK v6 states: input-streaming, input-available, output-available, etc.
  const isRunning = state === "input-streaming" || state === "input-available";
  const isComplete = state === "output-available";

  return (
    <div className="my-2 p-3 rounded-lg bg-kumo-canvas border border-kumo-line">
      <div className="flex items-center gap-2 text-sm">
        <Wrench weight="bold" className="h-4 w-4 text-kumo-accent" />
        <span className="font-medium text-kumo-default">{toolName}</span>
        
        {isRunning && (
          <CircleNotch weight="bold" className="h-4 w-4 text-kumo-accent animate-spin ml-auto" />
        )}
        {isComplete && result !== undefined && (
          <CheckCircle weight="fill" className="h-4 w-4 text-green-500 ml-auto" />
        )}
        {isComplete && result === undefined && (
          <XCircle weight="fill" className="h-4 w-4 text-red-500 ml-auto" />
        )}
      </div>

      {/* Show args for debugging (collapsed by default) */}
      {args !== undefined && args !== null && typeof args === "object" && Object.keys(args as Record<string, unknown>).length > 0 ? (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Arguments
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </details>
      ) : null}

      {/* Show result if available */}
      {isComplete && result !== undefined && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Result
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto max-h-32">
            {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
