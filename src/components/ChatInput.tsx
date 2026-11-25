"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@cloudflare/kumo";
import {
  Paperclip,
  X,
  File,
  PaperPlaneRight,
  CircleNotch,
} from "@phosphor-icons/react";
import type { Attachment } from "@/lib/types";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILES } from "@/lib/constants";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  attachments: Attachment[];
  onAttachmentAdd: (attachment: Attachment) => void;
  onAttachmentRemove: (index: number) => void;
  onSubmit: () => void;
  disabled: boolean;
  loading: boolean;
};

export function ChatInput({
  value,
  onChange,
  attachments,
  onAttachmentAdd,
  onAttachmentRemove,
  onSubmit,
  disabled,
  loading,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !disabled && !loading && (value.trim().length > 0 || attachments.length > 0);
  const canAttach = !disabled && attachments.length < MAX_FILES;

  // Grow with the content instead of using a fixed two-row box.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    } else if (e.key === "Escape") {
      onChange("");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    const file = files[0];

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.name}`);
    } else if (file.size > MAX_FILE_SIZE) {
      setError(`File is larger than 10 MB: ${file.name}`);
    } else {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      onAttachmentAdd({
        filename: file.name,
        mimeType: file.type,
        data: base64,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-shrink-0 space-y-2 pb-[env(safe-area-inset-bottom)]">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl bg-kumo-recessed p-2">
          {attachments.map((att, index) => (
            <div
              key={index}
              className="flex max-w-full items-center gap-1.5 rounded-lg bg-kumo-base px-2 py-1 text-sm ring ring-kumo-line"
            >
              {att.mimeType.startsWith("image/") ? (
                <img
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt={att.filename}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <File weight="fill" className="h-4 w-4 shrink-0 text-kumo-strong" />
              )}
              <span className="max-w-[140px] truncate text-kumo-default">
                {att.filename}
              </span>
              <button
                type="button"
                onClick={() => onAttachmentRemove(index)}
                className="rounded p-1 text-kumo-strong transition-colors hover:bg-kumo-tint hover:text-kumo-default"
                aria-label={`Remove ${att.filename}`}
              >
                <X weight="bold" className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="px-1 text-xs text-kumo-danger" role="alert">
          {error}
        </p>
      )}

      {/* Composer */}
      <div className="flex items-end gap-1.5 rounded-2xl border border-kumo-line bg-kumo-base p-1.5 shadow-sm transition-colors focus-within:border-kumo-brand focus-within:ring-1 focus-within:ring-kumo-brand">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={ACCEPTED_FILE_TYPES.join(",")}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAttach}
          aria-label={
            attachments.length >= MAX_FILES
              ? `Maximum ${MAX_FILES} file attached`
              : "Attach a file"
          }
          className="h-9 w-9 flex-shrink-0 rounded-xl p-0"
        >
          <Paperclip weight="bold" className="h-5 w-5" />
        </Button>

        <textarea
          id="chat-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Sign in to chat" : "Type a message…"}
          disabled={disabled}
          rows={1}
          className="max-h-40 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-snug text-kumo-default placeholder:text-kumo-subtle focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <Button
          variant="primary"
          size="sm"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Send message"
          className="h-9 w-9 flex-shrink-0 rounded-xl p-0"
        >
          {loading ? (
            <CircleNotch weight="bold" className="h-5 w-5 animate-spin" />
          ) : (
            <PaperPlaneRight weight="fill" className="h-5 w-5" />
          )}
        </Button>
      </div>

      <p className="hidden text-center text-[11px] text-kumo-subtle sm:block">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
