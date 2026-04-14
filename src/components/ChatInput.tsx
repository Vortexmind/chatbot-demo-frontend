"use client";

import { useRef } from "react";
import { Button, InputArea, Loader } from "@cloudflare/kumo";
import { Paperclip, X, File, PaperPlaneRight } from "@phosphor-icons/react";
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

  const canSubmit = !disabled && !loading && (value.trim() || attachments.length > 0);
  const canAttach = !disabled && attachments.length < MAX_FILES;

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
    if (!files) return;

    for (let i = 0; i < files.length && attachments.length < MAX_FILES; i++) {
      const file = files[i];

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        alert(`File type not supported: ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large (max 10MB): ${file.name}`);
        continue;
      }

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
    <div className="space-y-2">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-kumo-recessed rounded">
          {attachments.map((att, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-kumo-base rounded ring ring-kumo-line text-base"
            >
              {att.mimeType.startsWith("image/") ? (
                <img
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt={att.filename}
                  className="w-6 h-6 object-cover rounded"
                />
              ) : (
                <File weight="fill" className="h-4 w-4 text-kumo-strong" />
              )}
              <span className="max-w-[100px] truncate text-kumo-default">
                {att.filename}
              </span>
              <button
                type="button"
                onClick={() => onAttachmentRemove(index)}
                className="p-0.5 hover:bg-kumo-tint rounded"
                aria-label={`Remove ${att.filename}`}
              >
                <X weight="bold" className="h-3 w-3 text-kumo-strong" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row: attach button, textarea, send button */}
      <div className="flex gap-2 items-end">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={ACCEPTED_FILE_TYPES.join(",")}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="base"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAttach}
          aria-label={
            attachments.length >= MAX_FILES
              ? `Max ${MAX_FILES} files`
              : "Attach file"
          }
          className="flex-shrink-0"
        >
          <Paperclip weight="bold" className="h-5 w-5" />
        </Button>

        <InputArea
          id="chat-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Please enter your username first"
              : "Type a message... (Enter to send, Shift+Enter for new line)"
          }
          disabled={disabled}
          rows={2}
          className="flex-1"
        />

        <Button
          variant="primary"
          size="base"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Send message"
          className="flex-shrink-0"
        >
          {loading ? (
            <Loader size="sm" className="text-kumo-inverse" />
          ) : (
            <PaperPlaneRight weight="fill" className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
