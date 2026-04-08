"use client";

import { useState } from "react";
import { Surface, Badge, Button } from "@cloudflare/kumo";
import {
  CaretDown,
  CaretUp,
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Warning,
  Image,
  File,
  Trash,
  CircleNotch,
} from "@phosphor-icons/react";
import type { AIGatewayEvent } from "@/lib/types";

type AIGatewayActivityPanelProps = {
  events: AIGatewayEvent[];
  onClear: () => void;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function EventIcon({ type }: { type: AIGatewayEvent["type"] }) {
  switch (type) {
    case "request":
      return <PaperPlaneTilt weight="bold" className="h-4 w-4 text-kumo-link" />;
    case "response":
      return <CheckCircle weight="bold" className="h-4 w-4 text-kumo-success" />;
    case "blocked":
      return <XCircle weight="bold" className="h-4 w-4 text-kumo-danger" />;
    case "error":
      return <Warning weight="bold" className="h-4 w-4 text-kumo-warning" />;
    case "streaming":
      return <CircleNotch weight="bold" className="h-4 w-4 text-kumo-brand animate-spin" />;
  }
}

function AttachmentIcon({ type }: { type?: string }) {
  if (!type) return null;
  if (type === "image") {
    return <Image weight="fill" className="h-3 w-3 text-kumo-strong" />;
  }
  return <File weight="fill" className="h-3 w-3 text-kumo-strong" />;
}

function EventRow({ event }: { event: AIGatewayEvent }) {
  const isBlocked = event.type === "blocked";
  const isError = event.type === "error";
  const isResponse = event.type === "response";
  const isStreaming = event.type === "streaming";

  return (
    <div
      className={`flex items-start gap-2 py-2 px-2 rounded text-xs ${
        isBlocked
          ? "bg-kumo-danger-tint"
          : isError
          ? "bg-kumo-warning-tint"
          : isStreaming
          ? "bg-kumo-info-tint"
          : "hover:bg-kumo-tint"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <EventIcon type={event.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-kumo-subtle">{formatTime(event.timestamp)}</span>
          {event.type === "request" && event.promptPreview && (
            <span className="text-kumo-default truncate max-w-[150px]">
              &ldquo;{event.promptPreview}&rdquo;
            </span>
          )}
          {isStreaming && (
            <span className="text-kumo-link">Streaming response...</span>
          )}
          {event.hasAttachment && (
            <span className="flex items-center gap-0.5">
              <AttachmentIcon type={event.attachmentType} />
            </span>
          )}
        </div>
        {(isResponse || isBlocked || isStreaming) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {event.model && (
              <Badge variant="blue-subtle">{event.model}</Badge>
            )}
            {event.provider && (
              <Badge variant="neutral-subtle">{event.provider}</Badge>
            )}
            {event.httpStatus && (
              <Badge variant={isBlocked ? "red" : "green"}>
                {event.httpStatus}
              </Badge>
            )}
          </div>
        )}
        {isBlocked && event.blockReason && (
          <p className="text-kumo-danger mt-1">{event.blockReason}</p>
        )}
        {isError && (
          <p className="text-kumo-warning mt-1">Network error or timeout</p>
        )}
      </div>
    </div>
  );
}

export function AIGatewayActivityPanel({
  events,
  onClear,
}: AIGatewayActivityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const requestCount = events.filter((e) => e.type === "request").length;
  const blockedCount = events.filter((e) => e.type === "blocked").length;

  return (
    <Surface className="mb-4 rounded-lg ring ring-kumo-line overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-kumo-recessed hover:bg-kumo-tint transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-kumo-default">
            AI Gateway Activity
          </span>
          <Badge variant="neutral-subtle">{requestCount} requests</Badge>
          {blockedCount > 0 && (
            <Badge variant="red">{blockedCount} blocked</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="Clear activity log"
            >
              <Trash weight="bold" className="h-4 w-4" />
            </Button>
          )}
          {isExpanded ? (
            <CaretUp weight="bold" className="h-4 w-4 text-kumo-strong" />
          ) : (
            <CaretDown weight="bold" className="h-4 w-4 text-kumo-strong" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="max-h-48 overflow-y-auto bg-kumo-base">
          {events.length === 0 ? (
            <p className="p-3 text-sm text-kumo-subtle text-center">
              No activity yet. Send a message to see AI Gateway events.
            </p>
          ) : (
            <div className="divide-y divide-kumo-line">
              {events
                .slice()
                .reverse()
                .map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}
