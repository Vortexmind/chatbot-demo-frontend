"use client";

import { Switch } from "@cloudflare/kumo";
import { Moon, Sun } from "@phosphor-icons/react";

type DarkModeToggleProps = {
  isDark: boolean;
  onToggle: (isDark: boolean) => void;
};

export function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Sun
        weight={isDark ? "regular" : "fill"}
        className={`h-4 w-4 ${isDark ? "text-kumo-subtle" : "text-kumo-warning"}`}
      />
      <Switch
        checked={isDark}
        onCheckedChange={onToggle}
        aria-label="Toggle dark mode"
      />
      <Moon
        weight={isDark ? "fill" : "regular"}
        className={`h-4 w-4 ${isDark ? "text-kumo-link" : "text-kumo-subtle"}`}
      />
    </div>
  );
}
