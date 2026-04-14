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
      return <PaperPlaneTilt weight="bold" className="h-3.5 w-3.5 text-kumo-link" />;
    case "response":
      return <CheckCircle weight="bold" className="h-3.5 w-3.5 text-kumo-success" />;
    case "blocked":
      return <XCircle weight="bold" className="h-3.5 w-3.5 text-kumo-danger" />;
    case "error":
      return <Warning weight="bold" className="h-3.5 w-3.5 text-kumo-warning" />;
    case "streaming":
      return <CircleNotch weight="bold" className="h-3.5 w-3.5 text-kumo-brand animate-spin" />;
  }
}

function AttachmentIcon({ type }: { type?: string }) {
  if (!type) return null;
  if (type === "image") {
    return <Image weight="fill" className="h-3 w-3 text-kumo-strong" />;
  }
  return <File weight="fill" className="h-3 w-3 text-kumo-strong" />;
}

function getEventLabel(type: AIGatewayEvent["type"]): string {
  switch (type) {
    case "request":
      return "Request";
    case "response":
      return "Response";
    case "blocked":
      return "Blocked";
    case "error":
      return "Error";
    case "streaming":
      return "Streaming...";
  }
}

function getPillStyles(type: AIGatewayEvent["type"]): {
  pillBg: string;
  iconBg: string;
  border: string;
} {
  switch (type) {
    case "request":
      return {
        pillBg: "bg-kumo-tint",
        iconBg: "bg-kumo-base ring-1 ring-kumo-line",
        border: "border-kumo-line",
      };
    case "response":
      return {
        pillBg: "bg-kumo-success-tint",
        iconBg: "bg-kumo-success-tint ring-1 ring-kumo-success/30",
        border: "border-kumo-success/30",
      };
    case "blocked":
      return {
        pillBg: "bg-kumo-danger-tint",
        iconBg: "bg-kumo-danger-tint ring-1 ring-kumo-danger/30",
        border: "border-kumo-danger/30",
      };
    case "error":
      return {
        pillBg: "bg-kumo-warning-tint",
        iconBg: "bg-kumo-warning-tint ring-1 ring-kumo-warning/30",
        border: "border-kumo-warning/30",
      };
    case "streaming":
      return {
        pillBg: "bg-kumo-info-tint",
        iconBg: "bg-kumo-info-tint ring-1 ring-kumo-brand/30",
        border: "border-kumo-brand/30",
      };
  }
}

function TimelinePill({
  event,
  isLast,
}: {
  event: AIGatewayEvent;
  isLast: boolean;
}) {
  const { pillBg, iconBg, border } = getPillStyles(event.type);
  const label = getEventLabel(event.type);

  const isBlocked = event.type === "blocked";
  const isError = event.type === "error";
  const isResponse = event.type === "response";
  const isRequest = event.type === "request";
  const isStreaming = event.type === "streaming";

  return (
    <div className="flex items-start gap-3">
      {/* Timestamp column */}
      <div className="w-16 pt-2 text-right">
        <span className="text-xs text-kumo-subtle font-mono">
          {formatTime(event.timestamp)}
        </span>
      </div>

      {/* Pill column with connector */}
      <div className="relative flex-1 pb-3">
        {/* Vertical connector line */}
        {!isLast && (
          <div className="absolute left-[11px] top-6 bottom-0 w-px bg-kumo-line" />
        )}

        {/* Pill content row */}
        <div className="relative flex items-start gap-2">
          {/* Icon dot (sits on the timeline) */}
          <div
            className={`z-10 flex-shrink-0 rounded-full p-1 ${iconBg}`}
          >
            <EventIcon type={event.type} />
          </div>

          {/* Pill body */}
          <div
            className={`flex-1 rounded-lg border ${border} ${pillBg} px-3 py-2`}
          >
            {/* Label row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-kumo-default">
                {label}
              </span>
              {isRequest && event.hasAttachment && (
                <span className="flex items-center gap-0.5">
                  <AttachmentIcon type={event.attachmentType} />
                </span>
              )}
            </div>

            {/* Request: prompt preview */}
            {isRequest && event.promptPreview && (
              <p className="text-sm text-kumo-subtle mt-1 truncate">
                &ldquo;{event.promptPreview}&rdquo;
              </p>
            )}

            {/* Response/Blocked/Streaming: badges */}
            {(isResponse || isBlocked || isStreaming) && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {event.model && (
                  <Badge variant="blue-subtle" className="text-xs">
                    {event.model.length > 20
                      ? event.model.slice(0, 20) + "..."
                      : event.model}
                  </Badge>
                )}
                {event.provider && (
                  <Badge variant="neutral-subtle" className="text-xs">
                    {event.provider}
                  </Badge>
                )}
                {event.httpStatus && (
                  <Badge
                    variant={isBlocked ? "red" : "green"}
                    className="text-xs"
                  >
                    {event.httpStatus}
                  </Badge>
                )}
              </div>
            )}

            {/* Blocked: block reason */}
            {isBlocked && event.blockReason && (
              <p className="text-sm text-kumo-danger mt-1.5 break-words">
                {event.blockReason}
              </p>
            )}

            {/* Error: message */}
            {isError && (
              <p className="text-sm text-kumo-warning mt-1">
                Network error or timeout
              </p>
            )}
          </div>
        </div>
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

  // Events in reverse chronological order (newest first)
  const sortedEvents = events.slice().reverse();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-kumo-line bg-kumo-recessed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-base text-kumo-default">AI Gateway</span>
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
        <div className="text-sm font-medium text-kumo-strong mb-2">Current Route</div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-kumo-strong w-14">Model:</span>
            {info.model ? (
              <Badge variant="blue" className="text-xs max-w-[280px] truncate">
                {info.model}
              </Badge>
            ) : (
              <span className="text-kumo-subtle">N/A</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-kumo-strong w-14">Provider:</span>
            {info.provider ? (
              <Badge variant="neutral" className="text-xs">{info.provider}</Badge>
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

      {/* Activity Log - Timeline */}
      <div className="flex-1 overflow-y-auto bg-kumo-base">
        {events.length === 0 ? (
          <p className="p-4 text-base text-kumo-subtle text-center">
            No activity yet. Send a message to see AI Gateway events.
          </p>
        ) : (
          <div className="p-3">
            {sortedEvents.map((event, index) => (
              <TimelinePill
                key={event.id}
                event={event}
                isLast={index === sortedEvents.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
