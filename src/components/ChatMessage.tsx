import ReactMarkdown from "react-markdown";
import { File, Robot, UserCircle } from "@phosphor-icons/react";
import type { Message } from "@/lib/types";

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
  const isError = !!message.blocked;

  // Determine the message bubble styling
  // - User messages: brand color
  // - Bot error/blocked messages: red-tinted background
  // - Normal bot messages: base background with ring
  const getBubbleClasses = () => {
    if (isUser) {
      return "bg-kumo-brand text-kumo-inverse";
    }
    if (isError) {
      return "bg-kumo-danger-tint text-kumo-default ring ring-kumo-danger-subtle";
    }
    return "bg-kumo-base text-kumo-default ring ring-kumo-line";
  };

  return (
    <div className={`my-3 ${isUser ? "text-right" : "text-left"}`}>
      {/* Sender label with icon */}
      <div
        className={`flex items-center gap-1.5 mb-1 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {isUser ? (
          <>
            <span className="font-semibold text-sm text-kumo-default">{username}</span>
            <UserCircle weight="fill" className="h-5 w-5 text-kumo-strong" />
          </>
        ) : (
          <>
            <Robot weight="fill" className="h-5 w-5 text-kumo-strong" />
            <span className="font-semibold text-sm text-kumo-default">Bot</span>
          </>
        )}
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div
          className={`flex flex-wrap gap-2 mb-2 ${
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
                <div className="flex items-center gap-1 px-2 py-1 bg-kumo-recessed rounded text-base">
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
        className={`inline-block px-4 py-2.5 rounded-lg max-w-[85%] ${getBubbleClasses()}`}
      >
        <div className="markdown-content">
          <ReactMarkdown>{message.text}</ReactMarkdown>
          {message.isStreaming && <StreamingCursor />}
        </div>
      </div>
    </div>
  );
}
