"use client";

import { CloudflareLogo, Link, Button, Badge } from "@cloudflare/kumo";
import { Sidebar, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { DarkModeToggle } from "./DarkModeToggle";

type ChatLayoutProps = {
  children: ReactNode;
  isDarkMode: boolean;
  onDarkModeToggle: (isDark: boolean) => void;
  username?: string;
  onChangeUsername?: () => void;
  isDrawerOpen: boolean;
  onDrawerToggle: () => void;
  drawerContent?: ReactNode;
  blockedCount?: number;
  onNewChat?: () => void;
};

export function ChatLayout({
  children,
  isDarkMode,
  onDarkModeToggle,
  username,
  onChangeUsername,
  isDrawerOpen,
  onDrawerToggle,
  drawerContent,
  blockedCount = 0,
  onNewChat,
}: ChatLayoutProps) {
  return (
    <main className="h-screen bg-kumo-canvas flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-kumo-line bg-kumo-base px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Title stack */}
            <div className="flex items-center gap-3">
              <CloudflareLogo variant="glyph" className="h-10 w-10 flex-shrink-0" />
              <div className="space-y-0.5">
                <h1 className="text-2xl font-semibold text-kumo-default">
                  Well-behaved chatbot
                </h1>
                {username && (
                  <p className="text-sm text-kumo-strong">
                    Chatting as{" "}
                    <span className="font-medium text-kumo-default">{username}</span>
                    {onChangeUsername && (
                      <>
                        <span className="mx-1.5 text-kumo-subtle">·</span>
                        <button
                          type="button"
                          onClick={onChangeUsername}
                          className="text-kumo-link underline hover:text-kumo-link-hover"
                        >
                          Change
                        </button>
                      </>
                    )}
                  </p>
                )}
                <p className="text-sm text-kumo-strong">
                  <Link href="https://developers.cloudflare.com/workers-ai/" className="text-kumo-link hover:underline">
                    Workers AI
                  </Link>
                  <span className="mx-1">+</span>
                  <Link href="https://developers.cloudflare.com/ai-gateway/" className="text-kumo-link hover:underline">
                    AI Gateway
                  </Link>
                  <span className="mx-1.5 text-kumo-subtle">|</span>
                  <Link href="https://github.com/cloudflare/kumo" className="text-kumo-link hover:underline">
                    Kumo
                  </Link>
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {onNewChat && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewChat}
                  className="gap-1"
                >
                  <ArrowCounterClockwise weight="bold" className="h-4 w-4" />
                  <span className="hidden sm:inline">New chat</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDrawerToggle}
                className="gap-1"
              >
                <Sidebar weight="bold" className="h-4 w-4" />
                <span className="hidden sm:inline">AI Gateway</span>
                {blockedCount > 0 && (
                  <Badge variant="red" className="ml-1">
                    {blockedCount}
                  </Badge>
                )}
              </Button>
              <DarkModeToggle isDark={isDarkMode} onToggle={onDarkModeToggle} />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat column */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            isDrawerOpen ? "mr-0" : ""
          }`}
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-2xl h-full flex flex-col">
              {children}
            </div>
          </div>
        </div>

        {/* AI Gateway Drawer */}
        <div
          className={`flex-shrink-0 border-l border-kumo-line bg-kumo-base transition-all duration-300 overflow-hidden ${
            isDrawerOpen ? "w-[28rem]" : "w-0"
          }`}
        >
          {isDrawerOpen && (
            <div className="w-[28rem] h-full flex flex-col overflow-hidden">
              {drawerContent}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
