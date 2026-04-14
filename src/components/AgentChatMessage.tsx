"use client";

import { CloudflareLogo } from "@cloudflare/kumo";
import { User, Wrench, CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";

type AgentChatMessageProps = {
  message: UIMessage;
};

// Helper to check if a part is a tool-related part
function isToolPart(part: UIMessage["parts"][number]): part is UIMessage["parts"][number] & {
  toolName: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
} {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export function AgentChatMessage({ message }: AgentChatMessageProps) {
  const isUser = message.role === "user";

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
          if (part.type === "text") {
            return (
              <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }

          if (isToolPart(part)) {
            // Extract tool name from type (e.g., "tool-search" -> "search") or use toolName
            const toolName = part.type === "dynamic-tool" 
              ? part.toolName 
              : part.type.replace(/^tool-/, "");
            
            return (
              <ToolInvocationPart
                key={index}
                toolName={toolName}
                state={part.state}
                args={part.input}
                result={part.output}
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
