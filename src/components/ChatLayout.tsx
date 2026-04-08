import { CloudflareLogo, Link } from "@cloudflare/kumo";
import type { ReactNode } from "react";

type ChatLayoutProps = {
  children: ReactNode;
};

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <main className="min-h-screen bg-kumo-canvas p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-kumo-default">
              Well-behaved chatbot
            </h1>
            <CloudflareLogo variant="glyph" className="h-10 w-10" />
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
            .
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
