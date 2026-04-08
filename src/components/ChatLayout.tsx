import { CloudflareLogo, Link } from "@cloudflare/kumo";
import type { ReactNode } from "react";
import { DarkModeToggle } from "./DarkModeToggle";

type ChatLayoutProps = {
  children: ReactNode;
  isDarkMode: boolean;
  onDarkModeToggle: (isDark: boolean) => void;
};

export function ChatLayout({ children, isDarkMode, onDarkModeToggle }: ChatLayoutProps) {
  return (
    <main className="min-h-screen bg-kumo-canvas p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-kumo-default">
              Well-behaved chatbot
            </h1>
            <div className="flex items-center gap-4">
              <DarkModeToggle isDark={isDarkMode} onToggle={onDarkModeToggle} />
              <CloudflareLogo variant="glyph" className="h-10 w-10" />
            </div>
          </div>
          <p className="text-sm text-kumo-strong">
            Built with{" "}
            <Link href="https://developers.cloudflare.com/workers-ai/">
              Cloudflare Workers AI
            </Link>{" "}
            and{" "}
            <Link href="https://developers.cloudflare.com/ai-gateway/">
              Cloudflare AI Gateway
            </Link>
            .<br />
            Styled with{" "}
            <Link href="https://github.com/cloudflare/kumo">
              Kumo
            </Link>
            , Cloudflare's design system.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
