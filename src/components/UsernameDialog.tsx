"use client";

import { Dialog, Button, Input } from "@cloudflare/kumo";
import { useState, useEffect } from "react";
import { getRandomUsernames } from "@/lib/utils";

type UsernameDialogProps = {
  open: boolean;
  initialUsername?: string;
  onSubmit: (username: string) => void;
};

export function UsernameDialog({ open, initialUsername = "", onSubmit }: UsernameDialogProps) {
  const [username, setUsername] = useState(initialUsername);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSuggestions(getRandomUsernames(4));
      setUsername(initialUsername);
    }
  }, [open, initialUsername]);

  const handleSubmit = (name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <Dialog.Root open={open}>
      <Dialog className="p-6">
        <Dialog.Title className="text-2xl font-semibold text-kumo-default mb-2">
          Welcome! What&apos;s your name?
        </Dialog.Title>
        <Dialog.Description className="text-base text-kumo-strong mb-4">
          Enter a username to start chatting
        </Dialog.Description>

        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(username)}
          placeholder="Enter your username"
          className="mb-4"
          autoFocus
        />

        <p className="text-base text-kumo-strong mb-2">Or pick a suggested username:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((name) => (
            <Button
              key={name}
              variant="secondary"
              size="sm"
              onClick={() => handleSubmit(name)}
            >
              {name}
            </Button>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => handleSubmit(username)}
          disabled={!username.trim()}
        >
          Start Chatting
        </Button>
      </Dialog>
    </Dialog.Root>
  );
}
