import { File } from "@phosphor-icons/react";
import type { Message } from "@/lib/types";
import { SenderLabel } from "./SenderLabel";
import { MessageBubble } from "./MessageBubble";
import { MarkdownContent } from "./MarkdownContent";

type ChatMessageProps = {
  message: Message;
  username: string;
};

export function ChatMessage({ message, username }: ChatMessageProps) {
  const isUser = message.sender === "user";
  const isError = !!message.blocked;

  return (
    <div className={`my-2.5 ${isUser ? "text-right" : "text-left"}`}>
      {/* Sender label with icon */}
      <SenderLabel isUser={isUser} username={username} />

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div
          className={`mb-2 flex flex-wrap gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          {message.attachments.map((att, index) => (
            <div key={index} className="inline-block">
              {att.mimeType.startsWith("image/") ? (
                <img
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt={att.filename}
                  className="max-h-[160px] max-w-[min(220px,70vw)] rounded-lg border border-kumo-line object-cover"
                />
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg bg-kumo-recessed px-2.5 py-1.5 text-sm">
                  <File weight="fill" className="h-4 w-4 shrink-0 text-kumo-strong" />
                  <span className="max-w-[180px] truncate text-kumo-default">
                    {att.filename}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message text */}
      <MessageBubble isUser={isUser} isError={isError}>
        <MarkdownContent text={message.text} isStreaming={message.isStreaming} />
      </MessageBubble>
    </div>
  );
}
