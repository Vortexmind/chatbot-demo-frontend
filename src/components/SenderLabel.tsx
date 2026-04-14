import { Robot, UserCircle } from "@phosphor-icons/react";

type SenderLabelProps = {
  isUser: boolean;
  username?: string;
  align?: "left" | "right";
};

/**
 * Displays the sender name with an icon above message bubbles.
 * Used by both Standard Chat and Agent Chat for consistent sender identification.
 */
export function SenderLabel({ isUser, username, align }: SenderLabelProps) {
  const alignment = align ?? (isUser ? "right" : "left");
  const justifyClass = alignment === "right" ? "justify-end" : "justify-start";

  return (
    <div className={`flex items-center gap-1.5 mb-1 ${justifyClass}`}>
      {isUser ? (
        <>
          <span className="font-semibold text-sm text-kumo-default">
            {username || "You"}
          </span>
          <UserCircle weight="fill" className="h-5 w-5 text-kumo-strong" />
        </>
      ) : (
        <>
          <Robot weight="fill" className="h-5 w-5 text-kumo-strong" />
          <span className="font-semibold text-sm text-kumo-default">Bot</span>
        </>
      )}
    </div>
  );
}
