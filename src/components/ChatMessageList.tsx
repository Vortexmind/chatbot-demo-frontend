"use client";

import { useCallback, useEffect, useRef } from "react";
import { Loader } from "@cloudflare/kumo";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track whether the reader is parked at the bottom so streaming tokens do not
  // yank the viewport away while they scroll back through the conversation.
  const stickToBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }, []);

  const isStreaming = messages.some((msg) => msg.isStreaming);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, loading, isStreaming]);

  const isEmpty = messages.length === 0;
  const showTypingIndicator = loading && !isStreaming;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
      >
        {isEmpty && !loading ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
            <div className="mb-3 rounded-full bg-kumo-recessed p-3">
              <ChatCircle weight="light" className="h-7 w-7 text-kumo-subtle" />
            </div>
            <p className="text-sm font-medium text-kumo-default">
              Send a message to get started
            </p>
            <p className="mt-1 text-xs text-kumo-subtle">
              Or try one of the demo scenarios below
            </p>
            <p className="mt-5 text-[11px] text-kumo-subtle">
              Built with{" "}
              <a
                href="https://developers.cloudflare.com/workers-ai/"
                className="text-kumo-link hover:underline"
              >
                Workers AI
              </a>{" "}
              +{" "}
              <a
                href="https://developers.cloudflare.com/ai-gateway/"
                className="text-kumo-link hover:underline"
              >
                AI Gateway
              </a>{" "}
              ·{" "}
              <a
                href="https://github.com/cloudflare/kumo"
                className="text-kumo-link hover:underline"
              >
                Kumo
              </a>
            </p>
          </div>
        ) : (
          <div className="pb-2">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} username={username} />
            ))}
            {showTypingIndicator && (
              <div className="flex items-center gap-2 py-2 text-sm text-kumo-strong">
                <Loader size="sm" />
                <span>Bot is typing…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
