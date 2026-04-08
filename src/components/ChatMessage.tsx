import ReactMarkdown from "react-markdown";
import { File } from "@phosphor-icons/react";
import type { Message } from "@/lib/types";
import { BlockedResponseCard } from "./BlockedResponseCard";

type ChatMessageProps = {
  message: Message;
  username: string;
};

function StreamingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-kumo-brand animate-pulse ml-0.5 align-middle" />
  );
}

export function ChatMessage({ message, username }: ChatMessageProps) {
  const isUser = message.sender === "user";

  // If this is a blocked response, render the BlockedResponseCard
  if (message.blocked) {
    return (
      <div className="my-2 text-left">
        <span className="font-semibold text-kumo-default">Bot:</span>
        <BlockedResponseCard blocked={message.blocked} />
      </div>
    );
  }

  return (
    <div className={`my-2 ${isUser ? "text-right" : "text-left"}`}>
      <span className="font-semibold text-kumo-default">
        {isUser ? username : "Bot"}:
      </span>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div
          className={`flex flex-wrap gap-2 my-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          {message.attachments.map((att, index) => (
            <div key={index} className="inline-block">
              {att.mimeType.startsWith("image/") ? (
                <img
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt={att.filename}
                  className="max-w-[150px] max-h-[150px] rounded border border-kumo-line"
                />
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-kumo-recessed rounded text-sm">
                  <File weight="fill" className="h-4 w-4 text-kumo-strong" />
                  <span className="text-kumo-default">{att.filename}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message text */}
      <div
        className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
          isUser
            ? "bg-kumo-brand text-kumo-inverse"
            : "bg-kumo-base text-kumo-default ring ring-kumo-line"
        }`}
      >
        <div className="markdown-content">
          <ReactMarkdown>{message.text}</ReactMarkdown>
          {message.isStreaming && <StreamingCursor />}
        </div>
      </div>
    </div>
  );
}
