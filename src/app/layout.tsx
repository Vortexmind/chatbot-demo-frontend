import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Well-behaved chatbot",
  description:
    "Well-behaved chatbot, built on Cloudflare Workers AI and Cloudflare AI Gateway",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

// Applies the stored theme before first paint so dark mode never flashes light.
const themeBootstrap = `try{if(localStorage.getItem("chatbot_dark_mode")==="true"){document.documentElement.setAttribute("data-mode","dark")}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="kumo" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
