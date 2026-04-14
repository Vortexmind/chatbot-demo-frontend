"use client";

import { Wrench, CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { SenderLabel } from "./SenderLabel";
import { MessageBubble } from "./MessageBubble";
import { MarkdownContent } from "./MarkdownContent";

type AgentChatMessageProps = {
  message: UIMessage;
  isStreaming?: boolean;
  isError?: boolean;
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

export function AgentChatMessage({ message, isStreaming, isError }: AgentChatMessageProps) {
  const isUser = message.role === "user";

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

  // Combine all text parts into a single string
  const combinedText = textParts
    .map(p => p.text)
    .filter(Boolean)
    .join("\n");

  return (
    <div className={`my-3 ${isUser ? "text-right" : "text-left"}`}>
      {/* Sender label with icon */}
      <SenderLabel isUser={isUser} />

      {/* Message bubble */}
      <MessageBubble isUser={isUser} isError={isError}>
        {/* Text content */}
        {hasTextContent && (
          <MarkdownContent text={combinedText} isStreaming={isStreaming && !isUser} />
        )}

        {/* Tool invocations */}
        {toolParts.map((part, index) => {
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

          return null;
        })}
      </MessageBubble>
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
  const hasError = isComplete && result === undefined;

  return (
    <div className={`my-2 p-3 rounded-lg bg-kumo-canvas border ${hasError ? "border-kumo-danger-subtle" : "border-kumo-line"}`}>
      <div className="flex items-center gap-2 text-sm">
        <Wrench weight="bold" className="h-4 w-4 text-kumo-accent" />
        <span className="font-medium text-kumo-default">{toolName}</span>

        {isRunning && (
          <CircleNotch weight="bold" className="h-4 w-4 text-kumo-accent animate-spin ml-auto" />
        )}
        {isComplete && result !== undefined && (
          <CheckCircle weight="fill" className="h-4 w-4 text-green-500 ml-auto" />
        )}
        {hasError && (
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
