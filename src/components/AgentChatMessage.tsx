"use client";

import { useState } from "react";
import {
  Wrench,
  CheckCircle,
  XCircle,
  CircleNotch,
  ShieldCheck,
  CaretDown,
  CaretRight,
  Brain,
} from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import { getToolApproval } from "@cloudflare/ai-chat/react";
import { SenderLabel } from "./SenderLabel";
import { MessageBubble } from "./MessageBubble";
import { MarkdownContent } from "./MarkdownContent";

type ToolPart = {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  toolCallId?: string;
  approval?: { id: string; approved?: boolean };
};

type AgentChatMessageProps = {
  message: UIMessage;
  isStreaming?: boolean;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
};

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

function ReasoningPart({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="my-2"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex items-center gap-1.5 text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
        <Brain weight="bold" className="h-3.5 w-3.5" />
        Reasoning
      </summary>
      <div className="mt-1 pl-5 text-sm text-kumo-strong border-l-2 border-kumo-line">
        <MarkdownContent text={text} />
      </div>
    </details>
  );
}

function ToolPartView({
  part,
  onApprove,
  onDeny,
}: {
  part: ToolPart;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}) {
  const name = getToolName(part);
  const state = part.state ?? "input-available";
  const approval = getToolApproval(part as never) ?? part.approval;
  const isRunning = state === "input-streaming" || state === "input-available";
  const needsApproval = state === "approval-requested";
  const isComplete = state === "output-available";
  const hasError = state === "output-error";

  let borderClass = "border-kumo-line";
  if (hasError) borderClass = "border-kumo-danger/40";
  else if (needsApproval) borderClass = "border-kumo-warning/50";

  return (
    <div className={`my-2 rounded-lg border bg-kumo-canvas p-3 ${borderClass}`}>
      <div className="flex items-center gap-2 text-sm">
        <Wrench weight="bold" className="h-4 w-4 shrink-0 text-kumo-brand" />
        <span className="min-w-0 truncate font-medium text-kumo-default">
          {name}
        </span>
        {part.toolCallId && (
          <span className="hidden text-xs font-mono text-kumo-subtle sm:inline">
            {part.toolCallId.slice(0, 8)}...
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {isRunning && (
            <CircleNotch weight="bold" className="h-4 w-4 text-kumo-brand animate-spin" />
          )}
          {needsApproval && (
            <ShieldCheck weight="bold" className="h-4 w-4 text-kumo-warning" />
          )}
          {isComplete && <CheckCircle weight="fill" className="h-4 w-4 text-kumo-success" />}
          {hasError && <XCircle weight="fill" className="h-4 w-4 text-kumo-danger" />}
        </div>
      </div>

      {needsApproval && approval && (
        <div className="mt-3 rounded-md border border-kumo-warning/40 bg-kumo-warning-tint p-2.5">
          <div className="mb-2 text-sm text-kumo-default">
            This tool requires your approval to run.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onApprove?.(approval.id)}
              className="min-h-9 rounded-md bg-kumo-brand px-3 text-sm font-medium text-kumo-inverse transition-colors hover:bg-kumo-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring"
            >
              Approve
            </button>
            <button
              onClick={() => onDeny?.(approval.id)}
              className="min-h-9 rounded-md bg-kumo-base px-3 text-sm font-medium text-kumo-default ring ring-kumo-line transition-colors hover:bg-kumo-recessed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {part.input !== undefined && part.input !== null && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Input
          </summary>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded bg-kumo-base p-2 text-xs">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        </details>
      )}

      {isComplete && part.output !== undefined && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Output
          </summary>
          <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded bg-kumo-base p-2 text-xs">
            {typeof part.output === "string"
              ? part.output
              : JSON.stringify(part.output, null, 2)}
          </pre>
        </details>
      )}

      {hasError && part.errorText && (
        <div className="mt-2 rounded bg-kumo-danger-tint p-2 text-sm text-kumo-danger">
          {part.errorText}
        </div>
      )}
    </div>
  );
}

export function AgentChatMessage({
  message,
  isStreaming,
  onApprove,
  onDeny,
}: AgentChatMessageProps) {
  const isUser = message.role === "user";

  const hasContent = message.parts.some((part) => {
    if (part.type === "text") {
      return Boolean((part as { text?: string }).text?.trim());
    }
    if (part.type === "reasoning") {
      return Boolean((part as { text?: string }).text?.trim());
    }
    return asToolPart(part) !== null;
  });

  if (!hasContent) return null;

  const hasText = message.parts.some(
    (part) =>
      part.type === "text" && Boolean((part as { text?: string }).text?.trim())
  );
  const hasToolParts = message.parts.some((part) => asToolPart(part) !== null);

  return (
    <div className={`my-3 ${isUser ? "text-right" : "text-left"}`}>
      <SenderLabel isUser={isUser} />
      <MessageBubble isUser={isUser}>
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            const text = (part as { text?: string }).text;
            if (!text?.trim()) return null;
            return (
              <MarkdownContent
                key={index}
                text={text}
                isStreaming={isStreaming && !isUser}
              />
            );
          }

          if (part.type === "reasoning") {
            const text = (part as { text?: string }).text;
            if (!text?.trim()) return null;
            return <ReasoningPart key={index} text={text} />;
          }

          const toolPart = asToolPart(part);
          if (toolPart) {
            return (
              <ToolPartView
                key={index}
                part={toolPart}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            );
          }

          if (part.type === "step-start") {
            return (
              <div key={index} className="my-2 border-t border-kumo-line opacity-30" />
            );
          }

          return null;
        })}

        {!isUser && !isStreaming && hasToolParts && !hasText && (
          <p className="mt-2 text-sm text-kumo-subtle">
            The agent ran a tool but did not return a text response.
          </p>
        )}
      </MessageBubble>
    </div>
  );
}
