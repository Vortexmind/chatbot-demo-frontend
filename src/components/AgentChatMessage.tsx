"use client";

import { Wrench, CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react";
import { isToolUIPart, getToolName } from "ai";
import type { UIMessage } from "ai";
import { SenderLabel } from "./SenderLabel";
import { MessageBubble } from "./MessageBubble";
import { MarkdownContent } from "./MarkdownContent";

type AgentChatMessageProps = {
  message: UIMessage;
  isStreaming?: boolean;
  isError?: boolean;
};

export function AgentChatMessage({ message, isStreaming, isError }: AgentChatMessageProps) {
  const isUser = message.role === "user";

  // Extract text content from parts
  const textParts = message.parts.filter(p => p.type === "text") as Array<{ type: "text"; text: string }>;
  const toolParts = message.parts.filter(p => isToolUIPart(p));

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
          if (isToolUIPart(part)) {
            return (
              <ToolInvocationPart
                key={index}
                toolName={getToolName(part)}
                state={part.state}
                input={part.input}
                output={"output" in part ? part.output : undefined}
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
  input?: unknown;
  output?: unknown;
};

function ToolInvocationPart({ toolName, state, input, output }: ToolInvocationPartProps) {
  // AI SDK v6 states: input-streaming, input-available, output-available, output-error
  const isRunning = state === "input-streaming" || state === "input-available";
  const isComplete = state === "output-available";
  const hasError = state === "output-error" || (isComplete && output === undefined);

  return (
    <div className={`my-2 p-3 rounded-lg bg-kumo-canvas border ${hasError ? "border-kumo-danger-subtle" : "border-kumo-line"}`}>
      <div className="flex items-center gap-2 text-sm">
        <Wrench weight="bold" className="h-4 w-4 text-kumo-accent" />
        <span className="font-medium text-kumo-default">{toolName}</span>

        {isRunning && (
          <CircleNotch weight="bold" className="h-4 w-4 text-kumo-accent animate-spin ml-auto" />
        )}
        {isComplete && output !== undefined && (
          <CheckCircle weight="fill" className="h-4 w-4 text-green-500 ml-auto" />
        )}
        {hasError && (
          <XCircle weight="fill" className="h-4 w-4 text-red-500 ml-auto" />
        )}
      </div>

      {/* Show input for debugging (collapsed by default) */}
      {input !== undefined && input !== null && typeof input === "object" && Object.keys(input as Record<string, unknown>).length > 0 ? (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Input
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto">
            {JSON.stringify(input, null, 2)}
          </pre>
        </details>
      ) : null}

      {/* Show output if available */}
      {isComplete && output !== undefined && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Output
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto max-h-32">
            {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
