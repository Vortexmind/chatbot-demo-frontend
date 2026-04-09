"use client";

import { useRef, useEffect } from "react";
import { Surface, Loader } from "@cloudflare/kumo";
import { ChatCircle } from "@phosphor-icons/react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/lib/types";

type ChatMessageListProps = {
  messages: Message[];
  username: string;
  loading: boolean;
};

export function ChatMessageList({
  messages,
  username,
  loading,
}: ChatMessageListProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isEmpty = messages.length === 0;
  
  // Check if any message is currently streaming (don't show "Bot is typing..." during streaming)
  const isStreaming = messages.some((msg) => msg.isStreaming);
  const showTypingIndicator = loading && !isStreaming;

  return (
    <Surface className="flex-1 min-h-[200px] overflow-y-auto rounded-lg p-4 bg-kumo-recessed ring ring-kumo-line">
      {isEmpty && !loading ? (
        <div className="h-full flex flex-col items-center justify-center text-center py-12">
          <ChatCircle weight="light" className="h-16 w-16 text-kumo-subtle mb-4" />
          <p className="text-kumo-strong text-sm">
            Send a message to get started
          </p>
          <p className="text-kumo-subtle text-xs mt-1">
            Or try one of the demo scenarios below
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} username={username} />
          ))}
          {showTypingIndicator && (
            <div className="flex items-center gap-2 text-kumo-strong italic my-2">
              <Loader size="sm" />
              <span>Bot is typing...</span>
            </div>
          )}
        </>
      )}
      <div ref={chatEndRef} />
    </Surface>
  );
}
