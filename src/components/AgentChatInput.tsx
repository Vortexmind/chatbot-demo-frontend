"use client";

import { useCallback, useRef, useEffect } from "react";
import { PaperPlaneRight, CircleNotch } from "@phosphor-icons/react";

type AgentChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function AgentChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
}: AgentChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && !loading && value.trim()) {
          onSubmit();
        }
      }
    },
    [disabled, loading, value, onSubmit]
  );

  const canSubmit = !disabled && !loading && value.trim().length > 0;

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border border-kumo-line bg-kumo-base px-4 py-3 focus-within:border-kumo-accent focus-within:ring-1 focus-within:ring-kumo-accent">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Chat disabled..." : "Type a message..."}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent text-kumo-default placeholder:text-kumo-subtle focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="flex-shrink-0 rounded-full bg-kumo-accent p-2 text-white transition-colors hover:bg-kumo-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <CircleNotch weight="bold" className="h-5 w-5 animate-spin" />
        ) : (
          <PaperPlaneRight weight="fill" className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
