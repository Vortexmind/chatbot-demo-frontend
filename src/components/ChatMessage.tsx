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
    <div className={`my-3 ${isUser ? "text-right" : "text-left"}`}>
      {/* Sender label with icon */}
      <SenderLabel isUser={isUser} username={username} />

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
      <MessageBubble isUser={isUser} isError={isError}>
        <MarkdownContent text={message.text} isStreaming={message.isStreaming} />
      </MessageBubble>
    </div>
  );
}
