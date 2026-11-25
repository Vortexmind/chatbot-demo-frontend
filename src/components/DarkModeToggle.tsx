"use client";

import { Switch } from "@cloudflare/kumo";
import { Moon, Sun } from "@phosphor-icons/react";

type DarkModeToggleProps = {
  isDark: boolean;
  onToggle: (isDark: boolean) => void;
};

export function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Sun
        weight={isDark ? "regular" : "fill"}
        className={`hidden h-4 w-4 sm:block ${
          isDark ? "text-kumo-subtle" : "text-kumo-warning"
        }`}
      />
      <Switch
        checked={isDark}
        onCheckedChange={onToggle}
        aria-label="Toggle dark mode"
      />
      <Moon
        weight={isDark ? "fill" : "regular"}
        className={`hidden h-4 w-4 sm:block ${
          isDark ? "text-kumo-link" : "text-kumo-subtle"
        }`}
      />
    </div>
  );
}
