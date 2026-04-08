"use client";

import { useRef, useEffect } from "react";
import { Surface, Loader } from "@cloudflare/kumo";
import { ChatMessage } from "./ChatMessage";
import { PresetPrompts } from "./PresetPrompts";
import type { Message } from "@/lib/types";

type ChatMessageListProps = {
  messages: Message[];
  username: string;
  loading: boolean;
  onPresetClick: (prompt: string) => void;
};

export function ChatMessageList({
  messages,
  username,
  loading,
  onPresetClick,
}: ChatMessageListProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isEmpty = messages.length === 0;

  return (
    <Surface className="h-80 overflow-y-auto rounded-lg p-4 mb-4 bg-kumo-recessed ring ring-kumo-line">
      {isEmpty && !loading ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <p className="text-kumo-strong mb-4">
            Start a conversation or try one of these:
          </p>
          <PresetPrompts onSelect={onPresetClick} centered />
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} username={username} />
          ))}
          {loading && (
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
