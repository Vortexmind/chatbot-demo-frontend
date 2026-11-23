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
  if (hasError) borderClass = "border-kumo-danger-subtle";
  else if (needsApproval) borderClass = "border-amber-400";

  return (
    <div className={`my-2 p-3 rounded-lg bg-kumo-canvas border ${borderClass}`}>
      <div className="flex items-center gap-2 text-sm">
        <Wrench weight="bold" className="h-4 w-4 text-kumo-accent" />
        <span className="font-medium text-kumo-default">{name}</span>
        {part.toolCallId && (
          <span className="text-xs text-kumo-subtle font-mono">
            {part.toolCallId.slice(0, 8)}...
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {isRunning && (
            <CircleNotch weight="bold" className="h-4 w-4 text-kumo-accent animate-spin" />
          )}
          {needsApproval && (
            <ShieldCheck weight="bold" className="h-4 w-4 text-amber-500" />
          )}
          {isComplete && <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />}
          {hasError && <XCircle weight="fill" className="h-4 w-4 text-red-500" />}
        </div>
      </div>

      {needsApproval && approval && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
          <div className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            This tool requires your approval to run.
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

      {part.input !== undefined && part.input !== null && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Input
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        </details>
      )}

      {isComplete && part.output !== undefined && (
        <details className="mt-2">
          <summary className="text-xs text-kumo-subtle cursor-pointer hover:text-kumo-strong">
            Output
          </summary>
          <pre className="mt-1 text-xs bg-kumo-base p-2 rounded overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
            {typeof part.output === "string"
              ? part.output
              : JSON.stringify(part.output, null, 2)}
          </pre>
        </details>
      )}

      {hasError && part.errorText && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm text-red-700 dark:text-red-300">
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
