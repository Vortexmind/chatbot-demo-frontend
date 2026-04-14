import type { ReactNode } from "react";

type MessageBubbleProps = {
  isUser: boolean;
  isError?: boolean;
  children: ReactNode;
};

/**
 * Message container with consistent styling for user/bot/error states.
 * - User messages: brand color background
 * - Bot messages: base background with ring border
 * - Error messages: danger-tinted background with danger ring
 */
export function MessageBubble({ isUser, isError, children }: MessageBubbleProps) {
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
    <div
      className={`inline-block px-4 py-2.5 rounded-lg max-w-[85%] ${getBubbleClasses()}`}
    >
      {children}
    </div>
  );
}
