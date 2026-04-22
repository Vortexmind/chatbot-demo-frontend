"use client";

import { useState } from "react";
import {
  Wrench,
  CheckCircle,
  XCircle,
  CircleNotch,
  Brain,
  ShieldCheck,
  File,
  Link,
  CaretDown,
  CaretRight,
  Bug,
} from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import {
  getToolPartState,
  getToolInput,
  getToolOutput,
  getToolApproval,
} from "@cloudflare/ai-chat/react";
import { SenderLabel } from "./SenderLabel";
import { MessageBubble } from "./MessageBubble";
import { MarkdownContent } from "./MarkdownContent";

// Type definitions for better type safety
type ToolPartState =
  | "loading"
  | "streaming"
  | "waiting-approval"
  | "approved"
  | "complete"
  | "error"
  | "denied";

type ApprovalInfo = {
  id: string;
  approved?: boolean;
};

type AgentChatMessageProps = {
  message: UIMessage;
  isStreaming?: boolean;
  isError?: boolean;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
};

// Fallback type checks in case AI SDK functions fail
function isToolPartFallback(part: UIMessage["parts"][number]): boolean {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function getToolNameFallback(part: UIMessage["parts"][number]): string {
  if (part.type === "dynamic-tool") {
    return (part as { toolName?: string }).toolName ?? "unknown";
  }
  if (part.type.startsWith("tool-")) {
    return part.type.slice(5);
  }
  return "unknown";
}

// Safe wrapper for AI SDK functions
function safeIsToolPart(part: UIMessage["parts"][number]): boolean {
  try {
    return isToolUIPart(part);
  } catch {
    return isToolPartFallback(part);
  }
}

function safeGetToolName(part: UIMessage["parts"][number]): string {
  // Only call getToolName if it's actually a tool part
  if (safeIsToolPart(part)) {
    try {
      // The AI SDK's getToolName expects a tool part, so we need to cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getToolName(part as any);
    } catch {
      return getToolNameFallback(part);
    }
  }
  return getToolNameFallback(part);
}

function safeGetToolPartState(part: UIMessage["parts"][number]): ToolPartState {
  try {
    return getToolPartState(part);
  } catch {
    // Fallback: check the state property directly
    const stateProp = (part as { state?: string }).state;
    switch (stateProp) {
      case "input-streaming":
        return "streaming";
      case "input-available":
        return "loading";
      case "approval-requested":
        return "waiting-approval";
      case "output-available":
        return "complete";
      case "output-error":
        return "error";
      default:
        return "loading";
    }
  }
}

function safeGetToolInput(part: UIMessage["parts"][number]): unknown {
  try {
    return getToolInput(part);
  } catch {
    return (part as { input?: unknown }).input;
  }
}

function safeGetToolOutput(part: UIMessage["parts"][number]): unknown {
  try {
    return getToolOutput(part);
  } catch {
    return (part as { output?: unknown }).output;
  }
}

function safeGetToolApproval(part: UIMessage["parts"][number]): ApprovalInfo | undefined {
  try {
    return getToolApproval(part);
  } catch {
    return (part as { approval?: ApprovalInfo }).approval;
  }
}

function safeGetErrorText(part: UIMessage["parts"][number]): string | undefined {
  return (part as { errorText?: string }).errorText;
}

function safeGetToolCallId(part: UIMessage["parts"][number]): string | undefined {
  return (part as { toolCallId?: string }).toolCallId;
}

// Check if a text part is streaming using part.state (AI SDK v6)
function isTextPartStreaming(
  part: UIMessage["parts"][number],
  fallbackIsStreaming: boolean,
  isLastTextPart: boolean
): boolean {
  if (part.type === "text") {
    const textState = (part as { state?: "streaming" | "done" }).state;
    if (textState !== undefined) {
      return textState === "streaming";
    }
  }
  // Fallback to global isStreaming for parts without state
  return fallbackIsStreaming && isLastTextPart;
}

export function AgentChatMessage({
  message,
  isStreaming,
  isError,
  onApprove,
  onDeny,
}: AgentChatMessageProps) {
  const [showDebug, setShowDebug] = useState(false);
  const isUser = message.role === "user";

  // Check if we have any displayable content
  const hasContent = message.parts.some((part) => {
    if (part.type === "text") {
      return (part as { text?: string }).text?.trim();
    }
    if (part.type === "reasoning") {
      return (part as { text?: string }).text?.trim();
    }
    if (safeIsToolPart(part)) {
      return true;
    }
    // File and source parts count as content
    if (part.type === "file" || part.type === "source-url" || part.type === "source-document") {
      return true;
    }
    return false;
  });

  // If no content at all, don't render empty bubble
  if (!hasContent) {
    return null;
  }

  // Find the index of the last text part to apply streaming cursor
  const lastTextPartIndex = message.parts.reduce((lastIdx, part, idx) => {
    if (part.type === "text" && (part as { text?: string }).text?.trim()) {
      return idx;
    }
    return lastIdx;
  }, -1);

  // Track unknown part types for debugging
  const unknownPartTypes: string[] = [];

  return (
    <div className={`my-3 ${isUser ? "text-right" : "text-left"}`}>
      <SenderLabel isUser={isUser} />

      <MessageBubble isUser={isUser} isError={isError}>
        {message.parts.map((part, index) => {
          // Text parts
          if (part.type === "text") {
            const textPart = part as { text?: string };
            if (!textPart.text?.trim()) return null;

            const isLastTextPart = index === lastTextPartIndex;
            const partIsStreaming = isTextPartStreaming(
              part,
              isStreaming ?? false,
              isLastTextPart
            );

            return (
              <MarkdownContent
                key={index}
                text={textPart.text}
                isStreaming={partIsStreaming && !isUser}
              />
            );
          }

          // Reasoning parts (collapsible)
          if (part.type === "reasoning") {
            const reasoningPart = part as { text?: string };
            if (!reasoningPart.text?.trim()) return null;

            return (
              <details key={index} className="my-2">
                <summary className="flex items-center gap-1.5 text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
                  <Brain weight="bold" className="h-3.5 w-3.5" />
                  Reasoning
                </summary>
                <div className="mt-1 pl-5 text-sm text-kumo-strong border-l-2 border-kumo-line">
                  <MarkdownContent text={reasoningPart.text} />
                </div>
              </details>
            );
          }

          // Tool invocation parts (static and dynamic)
          if (safeIsToolPart(part)) {
            return (
              <ToolInvocationPart
                key={index}
                part={part}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            );
          }

          // Step boundaries
          if (part.type === "step-start") {
            return (
              <div
                key={index}
                className="my-2 border-t border-kumo-line opacity-30"
              />
            );
          }

          // File parts - show placeholder
          if (part.type === "file") {
            const filePart = part as { filename?: string; mediaType?: string };
            return (
              <div
                key={index}
                className="my-2 p-2 rounded bg-kumo-canvas border border-kumo-line flex items-center gap-2 text-sm text-kumo-strong"
              >
                <File weight="bold" className="h-4 w-4 text-kumo-accent" />
                <span>{filePart.filename ?? "File attachment"}</span>
                {filePart.mediaType && (
                  <span className="text-xs text-kumo-subtle">
                    ({filePart.mediaType})
                  </span>
                )}
              </div>
            );
          }

          // Source URL parts - show placeholder
          if (part.type === "source-url") {
            const sourcePart = part as { url?: string; title?: string };
            return (
              <div
                key={index}
                className="my-1 flex items-center gap-1.5 text-xs text-kumo-subtle"
              >
                <Link weight="bold" className="h-3 w-3" />
                <span>{sourcePart.title ?? sourcePart.url ?? "Source"}</span>
              </div>
            );
          }

          // Source document parts - show placeholder
          if (part.type === "source-document") {
            const docPart = part as { title?: string; filename?: string };
            return (
              <div
                key={index}
                className="my-1 flex items-center gap-1.5 text-xs text-kumo-subtle"
              >
                <File weight="bold" className="h-3 w-3" />
                <span>{docPart.title ?? docPart.filename ?? "Document source"}</span>
              </div>
            );
          }

          // Track unknown part types for debug panel
          if (!unknownPartTypes.includes(part.type)) {
            unknownPartTypes.push(part.type);
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `[AgentChatMessage] Unknown part type: "${part.type}"`,
                part
              );
            }
          }

          return null;
        })}

        {/* Debug panel (collapsible) - only in development */}
        {process.env.NODE_ENV === "development" && !isUser && (
          <div className="mt-3 pt-2 border-t border-kumo-line border-dashed">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-1 text-xs text-kumo-subtle hover:text-kumo-strong"
            >
              {showDebug ? (
                <CaretDown weight="bold" className="h-3 w-3" />
              ) : (
                <CaretRight weight="bold" className="h-3 w-3" />
              )}
              <Bug weight="bold" className="h-3 w-3" />
              Debug
            </button>
            {showDebug && (
              <div className="mt-2 text-xs">
                <div className="font-mono bg-kumo-base p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                  <div className="text-kumo-subtle mb-1">
                    Message ID: {message.id}
                  </div>
                  <div className="text-kumo-subtle mb-1">
                    Role: {message.role}
                  </div>
                  <div className="text-kumo-subtle mb-1">
                    Parts ({message.parts.length}):
                  </div>
                  {message.parts.map((part, i) => (
                    <div key={i} className="ml-2 mb-1">
                      <span className="text-kumo-accent">[{i}]</span>{" "}
                      <span className="text-kumo-default">{part.type}</span>
                      {safeIsToolPart(part) && (
                        <span className="text-kumo-subtle">
                          {" "}
                          → {safeGetToolName(part)} ({safeGetToolPartState(part)})
                        </span>
                      )}
                      {part.type === "text" && (
                        <span className="text-kumo-subtle">
                          {" "}
                          [{((part as { text?: string }).text?.length ?? 0)} chars]
                          {(part as { state?: string }).state && (
                            <> state={`"${(part as { state?: string }).state}"`}</>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                  {unknownPartTypes.length > 0 && (
                    <div className="mt-2 text-amber-500">
                      Unknown types: {unknownPartTypes.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </MessageBubble>
    </div>
  );
}

type ToolInvocationPartProps = {
  part: UIMessage["parts"][number];
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
};

function ToolInvocationPart({ part, onApprove, onDeny }: ToolInvocationPartProps) {
  const toolName = safeGetToolName(part);
  const state = safeGetToolPartState(part);
  const input = safeGetToolInput(part);
  const output = safeGetToolOutput(part);
  const errorText = safeGetErrorText(part);
  const approval = safeGetToolApproval(part);
  const toolCallId = safeGetToolCallId(part);

  // Determine visual state
  const isRunning = state === "loading" || state === "streaming";
  const isComplete = state === "complete";
  const hasError = state === "error";
  const needsApproval = state === "waiting-approval";
  const wasApproved = state === "approved";
  const wasDenied = state === "denied";

  // Border color based on state
  let borderClass = "border-kumo-line";
  if (hasError || wasDenied) {
    borderClass = "border-kumo-danger-subtle";
  } else if (needsApproval) {
    borderClass = "border-amber-400";
  } else if (wasApproved) {
    borderClass = "border-green-400";
  }

  return (
    <div className={`my-2 p-3 rounded-lg bg-kumo-canvas border ${borderClass}`}>
      <div className="flex items-center gap-2 text-sm">
        <Wrench weight="bold" className="h-4 w-4 text-kumo-accent" />
        <span className="font-medium text-kumo-default">{toolName}</span>
        {toolCallId && (
          <span className="text-xs text-kumo-subtle font-mono">
            {toolCallId.slice(0, 8)}...
          </span>
        )}

        {/* Status indicators */}
        <div className="ml-auto flex items-center gap-1">
          {isRunning && (
            <CircleNotch
              weight="bold"
              className="h-4 w-4 text-kumo-accent animate-spin"
            />
          )}
          {needsApproval && (
            <ShieldCheck weight="bold" className="h-4 w-4 text-amber-500" />
          )}
          {(isComplete || wasApproved) && (
            <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />
          )}
          {(hasError || wasDenied) && (
            <XCircle weight="fill" className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Approval UI */}
      {needsApproval && approval && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
          <div className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            This tool requires your approval to execute.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onApprove?.(approval.id)}
              className="px-3 py-1 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onDeny?.(approval.id)}
              className="px-3 py-1 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* Show approval status after decision */}
      {wasApproved && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          Approved and executing...
        </div>
      )}
      {wasDenied && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          Execution denied by user.
        </div>
      )}

      {/* Show input (collapsed by default) */}
      {input !== undefined &&
        input !== null &&
        typeof input === "object" &&
        Object.keys(input as Record<string, unknown>).length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
              Input
            </summary>
            <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          </details>
        )}

      {/* Show output if available */}
      {isComplete && output !== undefined && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Output
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
            {typeof output === "string"
              ? output
              : JSON.stringify(output, null, 2)}
          </pre>
        </details>
      )}

      {/* Show error text */}
      {hasError && errorText && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm text-red-700 dark:text-red-300">
          {errorText}
        </div>
      )}
    </div>
  );
}
