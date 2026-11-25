"use client";

import { CloudflareLogo, Button, Badge, Tabs } from "@cloudflare/kumo";
import {
  Sidebar,
  ArrowCounterClockwise,
  Robot,
  ChatCircle,
  Graph,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { MobileSheet } from "./MobileSheet";
import { useIsDesktop } from "@/lib/useMediaQuery";
import type { ChatTab } from "@/lib/types";

type ChatLayoutProps = {
  children: ReactNode;
  isDarkMode: boolean;
  onDarkModeToggle: (isDark: boolean) => void;
  username?: string;
  isDrawerOpen: boolean;
  onDrawerToggle: () => void;
  drawerContent?: ReactNode;
  blockedCount?: number;
  onNewChat?: () => void;
  activeTab?: ChatTab;
  onTabChange?: (tab: ChatTab) => void;
  wide?: boolean;
};

const TAB_ICON_CLASS = "h-4 w-4";

export function ChatLayout({
  children,
  isDarkMode,
  onDarkModeToggle,
  username,
  isDrawerOpen,
  onDrawerToggle,
  drawerContent,
  blockedCount = 0,
  onNewChat,
  activeTab = "agent",
  onTabChange,
  wide = false,
}: ChatLayoutProps) {
  const isDesktop = useIsDesktop();

  const tabs = [
    {
      value: "agent",
      label: (
        <span className="flex items-center justify-center gap-1.5">
          <Robot weight={activeTab === "agent" ? "fill" : "regular"} className={TAB_ICON_CLASS} />
          <span>Agent</span>
        </span>
      ),
      className: "flex-1 justify-center px-2",
    },
    {
      value: "standard",
      label: (
        <span className="flex items-center justify-center gap-1.5">
          <ChatCircle
            weight={activeTab === "standard" ? "fill" : "regular"}
            className={TAB_ICON_CLASS}
          />
          <span>Standard</span>
        </span>
      ),
      className: "flex-1 justify-center px-2",
    },
    {
      value: "architecture",
      label: (
        <span className="flex items-center justify-center gap-1.5">
          <Graph
            weight={activeTab === "architecture" ? "fill" : "regular"}
            className={TAB_ICON_CLASS}
          />
          <span>Architecture</span>
        </span>
      ),
      className: "flex-1 justify-center px-2",
    },
  ];

  const tabSwitcher = onTabChange ? (
    <Tabs
      tabs={tabs}
      value={activeTab}
      onValueChange={(value) => onTabChange(value as ChatTab)}
      className="w-full"
      listClassName="w-full"
    />
  ) : null;

  const drawerToggleButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDrawerToggle}
      aria-label="Toggle AI Gateway activity panel"
      aria-expanded={isDrawerOpen}
      className="h-9 gap-1 px-2"
    >
      <Sidebar weight="bold" className="h-4 w-4" />
      <span className="hidden sm:inline">AI Gateway</span>
      {blockedCount > 0 && (
        <Badge variant="red" className="ml-0.5">
          {blockedCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-kumo-canvas">
      <header className="z-20 flex-shrink-0 border-b border-kumo-line bg-kumo-base">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
          {/* Identity */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <CloudflareLogo
              variant="glyph"
              className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold leading-tight text-kumo-default sm:text-base">
                Well-behaved chatbot
              </h1>
              <p className="truncate text-xs leading-tight text-kumo-strong">
                {username ? (
                  <>
                    Chatting as{" "}
                    <span className="font-medium text-kumo-default">
                      {username}
                    </span>
                  </>
                ) : (
                  "Workers AI + AI Gateway"
                )}
              </p>
            </div>
          </div>

          {/* Inline tabs on large screens */}
          {tabSwitcher && (
            <div className="hidden w-80 flex-shrink-0 lg:block">
              {tabSwitcher}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1">
            {onNewChat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewChat}
                aria-label="Start a new chat"
                className="h-9 gap-1 px-2"
              >
                <ArrowCounterClockwise weight="bold" className="h-4 w-4" />
                <span className="hidden sm:inline">New chat</span>
              </Button>
            )}
            {drawerToggleButton}
            <DarkModeToggle isDark={isDarkMode} onToggle={onDarkModeToggle} />
          </div>
        </div>

        {/* Tabs on phones and tablets */}
        {tabSwitcher && (
          <div className="border-t border-kumo-line/70 px-3 py-2 lg:hidden">
            {tabSwitcher}
          </div>
        )}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={
              wide
                ? "min-h-0 min-w-0 flex-1 overflow-hidden p-2 sm:p-3"
                : "min-h-0 min-w-0 flex-1 overflow-hidden px-3 pt-3 sm:px-6 sm:pt-4"
            }
          >
            <div
              className={`mx-auto flex h-full w-full min-w-0 flex-col ${
                wide ? "max-w-none" : "max-w-3xl"
              }`}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Inline panel on desktop */}
        {drawerContent && isDrawerOpen && (
          <aside className="hidden w-[26rem] flex-shrink-0 flex-col border-l border-kumo-line bg-kumo-base lg:flex">
            {drawerContent}
          </aside>
        )}
      </div>

      {/* Bottom sheet on mobile and tablet */}
      {drawerContent && !isDesktop && (
        <MobileSheet
          open={isDrawerOpen}
          onOpenChange={(open) => {
            if (!open) onDrawerToggle();
          }}
          title="AI Gateway activity"
        >
          {drawerContent}
        </MobileSheet>
      )}
    </main>
  );
}
