"use client";

import { Badge, Button } from "@cloudflare/kumo";
import {
  Trash,
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Warning,
  Image,
  File,
  CircleNotch,
} from "@phosphor-icons/react";
import type { AIGatewayEvent, AIGatewayInfo } from "@/lib/types";

type AIGatewayDrawerProps = {
  events: AIGatewayEvent[];
  onClear: () => void;
  info: AIGatewayInfo;
  isError: boolean;
  isHighlighted: boolean;
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
      className={`flex items-start gap-2 py-2 px-3 text-xs ${
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
            <span className="text-kumo-default truncate max-w-[180px]">
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
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {event.model && (
              <Badge variant="blue-subtle" className="text-[10px]">
                {event.model.length > 25 ? event.model.slice(0, 25) + "..." : event.model}
              </Badge>
            )}
            {event.provider && (
              <Badge variant="neutral-subtle" className="text-[10px]">{event.provider}</Badge>
            )}
            {event.httpStatus && (
              <Badge variant={isBlocked ? "red" : "green"} className="text-[10px]">
                {event.httpStatus}
              </Badge>
            )}
          </div>
        )}
        {isBlocked && event.blockReason && (
          <p className="text-kumo-danger mt-1 break-words">{event.blockReason}</p>
        )}
        {isError && (
          <p className="text-kumo-warning mt-1">Network error or timeout</p>
        )}
      </div>
    </div>
  );
}

export function AIGatewayDrawer({
  events,
  onClear,
  info,
  isError,
  isHighlighted,
}: AIGatewayDrawerProps) {
  const requestCount = events.filter((e) => e.type === "request").length;
  const blockedCount = events.filter((e) => e.type === "blocked").length;

  // Determine current route status styling
  let statusBgClass = "bg-kumo-recessed";
  let statusBorderClass = "border-kumo-line";
  let statusTextClass = "text-kumo-default";

  if (isError) {
    statusBgClass = "bg-kumo-danger-tint";
    statusBorderClass = "border-kumo-danger";
    statusTextClass = "text-kumo-danger";
  } else if (isHighlighted) {
    statusBgClass = "bg-kumo-warning-tint";
    statusBorderClass = "border-kumo-warning";
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-kumo-line bg-kumo-recessed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-kumo-default">AI Gateway</span>
            <Badge variant="neutral-subtle">{requestCount} requests</Badge>
            {blockedCount > 0 && (
              <Badge variant="red">{blockedCount} blocked</Badge>
            )}
          </div>
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              aria-label="Clear activity log"
            >
              <Trash weight="bold" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Current Route Status */}
      <div
        className={`flex-shrink-0 p-3 border-b transition-colors duration-300 ${statusBgClass} ${statusBorderClass}`}
      >
        <div className="text-xs font-medium text-kumo-strong mb-2">Current Route</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-kumo-strong w-14">Model:</span>
            {info.model ? (
              <Badge variant="blue" className="text-[10px] max-w-[250px] truncate">
                {info.model}
              </Badge>
            ) : (
              <span className="text-kumo-subtle">N/A</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-kumo-strong w-14">Provider:</span>
            {info.provider ? (
              <Badge variant="neutral" className="text-[10px]">{info.provider}</Badge>
            ) : (
              <span className="text-kumo-subtle">N/A</span>
            )}
          </div>
          {info.debug && (
            <div className="flex items-start gap-2">
              <span className="text-kumo-strong w-14">Debug:</span>
              <span className={`${statusTextClass} break-words`}>{info.debug}</span>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="flex-1 overflow-y-auto bg-kumo-base">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-kumo-subtle text-center">
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
    </div>
  );
}
