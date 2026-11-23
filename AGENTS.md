# Agent Guidelines for chatbot-demo-frontend

This is a Next.js 16 frontend deployed on Cloudflare Workers via OpenNext. It provides a chat interface backed by the stateless `chatbot-demo` Worker API, with an AI Gateway activity drawer and file attachments.

## Build, Test, and Development Commands

### Development
```bash
pnpm dev         # Start Next.js development server on port 3000
```

### Build & Preview
```bash
pnpm build       # Build for production (Next.js only)
pnpm preview     # Build with OpenNext and preview with Wrangler locally
```

### Deployment
```bash
pnpm deploy      # Build with OpenNext and deploy to Cloudflare Workers
```

### Linting & Type Checking
```bash
pnpm lint        # Run ESLint
pnpm check       # Full check: OpenNext build + tsc + wrangler deploy --dry-run
```

### Type Generation
```bash
pnpm cf-typegen  # Generate Cloudflare Worker types for env.d.ts
```

### Build toolchain
- CI uses pnpm 9.10.0 and Node 24 (`.nvmrc`).
- Keep `packages: ["."]` in `pnpm-workspace.yaml`; pnpm 9 rejects the file without it.
- Keep `@opennextjs/cloudflare` at 1.20.12 or later for Next.js 16.4 (`preview-props.json` inlining). 1.20.18 requires `wrangler` 4.148 or later.

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Kumo styles, Tailwind, markdown-content class
│   ├── layout.tsx       # Root layout with Kumo theme provider
│   └── page.tsx         # Main page: state, submit logic, streaming, drawer
├── components/
│   ├── AIGatewayDrawer.tsx       # Activity timeline drawer
│   ├── ChatInput.tsx             # Input with file attachments
│   ├── ChatLayout.tsx            # Page shell, dark mode, drawer
│   ├── ChatMessage.tsx           # Message bubble
│   ├── ChatMessageList.tsx       # Scrollable message list
│   ├── DarkModeToggle.tsx        # Theme toggle
│   ├── MarkdownContent.tsx       # Markdown renderer + streaming cursor
│   ├── MessageBubble.tsx         # Shared bubble styling
│   ├── PresetPrompts.tsx         # Demo prompt chips
│   ├── SenderLabel.tsx           # Sender name and icon
│   ├── StreamingCursor.tsx       # Streaming indicator
│   ├── UsernameDialog.tsx        # Username entry modal
│   └── index.ts                  # Barrel exports
└── lib/
    ├── constants.ts     # API_URL, file limits, presets
    ├── types.ts         # All TypeScript types
    └── utils.ts         # Cookie and username helpers
```

## Code Style Guidelines

### Formatting
- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Always use semicolons
- **Line endings**: LF (Unix-style)

### Component Patterns
- Use functional components with hooks
- Use `"use client"` directive for client components
- Prefer named exports for components
- Use TypeScript for all files

### Import Style
```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input } from "@cloudflare/kumo";
import { PaperPlaneRight } from "@phosphor-icons/react";
```

### Naming Conventions
- **Components**: PascalCase (`ChatInput.tsx`)
- **Types**: PascalCase (`AIGatewayEvent`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_URL`, `PRESET_PROMPTS`)
- **Functions**: camelCase (`handleSend`, `formatTime`)

## Key Components

### page.tsx
Owns the chat state and the request lifecycle:
- Reads the `CF_Authorization` cookie and sends it as `CF-Access-JWT-Assertion`
- POSTs to `API_URL` with `{ prompt, username, attachments?, stream: true }`
- Parses the SSE stream and appends tokens to the last bot message
- Records AI Gateway events (request, streaming, response, blocked, error)
- Persists username, dark mode, and drawer state in localStorage

### ChatLayout.tsx
Page shell with the header, dark mode toggle, AI Gateway drawer button, and the scrollable content column.

### AIGatewayDrawer.tsx
Timeline of AI Gateway events, current model/provider route, and block reasons.

### ChatInput.tsx
Textarea, attachment picker, and send button. Enforces `ACCEPTED_FILE_TYPES`, `MAX_FILE_SIZE`, and `MAX_FILES`.

## Types (src/lib/types.ts)

```typescript
export type Message = {
  sender: "user" | "bot";
  text: string;
  attachments?: Attachment[];
  blocked?: BlockInfo;
  isStreaming?: boolean;
};

export type AIGatewayEvent = {
  id: string;
  type: "request" | "response" | "blocked" | "error" | "streaming";
  timestamp: Date;
  promptPreview?: string;
  model?: string | null;
  provider?: string | null;
  httpStatus?: number;
  blockReason?: string;
  hasAttachment?: boolean;
  attachmentType?: string;
};
```

## Key Patterns

### Streaming response handling
The backend returns `text/event-stream` when `stream: true`. The page reads the body with a `ReadableStream` reader, buffers partial lines, and parses `data: {"choices":[{"delta":{"content":"..."}}]}` frames.

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    const token = parseSSEData(line.trim());
    if (token) fullText += token;
  }
}
```

### Blocked responses
HTTP 4xx responses return JSON, not a stream. The page maps them to a friendly bot message and records the block in the drawer. `429` is treated as a rate limit.

### Markdown Styling
Use the `markdown-content` class (defined in `globals.css`) for rendered markdown:
```tsx
<div className="markdown-content">
  <ReactMarkdown>{text}</ReactMarkdown>
</div>
```

**Note**: Do NOT use Tailwind `prose` classes; they cause white-on-white text issues.

## Common Gotchas

1. **CF Access cookie**: The backend expects `CF-Access-JWT-Assertion`; the frontend reads it from the `CF_Authorization` cookie
2. **Streaming vs JSON**: Errors are always JSON even when `stream: true`, so check `response.status` before reading the body
3. **Markdown styling**: Use `markdown-content`, not `prose`
4. **Attachments**: Only the first attachment is sent to the backend
5. **API hostname**: `API_URL` is a dashboard-level custom domain on the `chatbot-demo` Worker, not the `name` in its `wrangler.jsonc`

## Constants (src/lib/constants.ts)

```typescript
// Chat backend (stateless Worker)
export const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";
```

## Common Tasks

### Adding new components
1. Create component in `src/components/`
2. Add `"use client"` if it uses hooks or browser APIs
3. Export from `src/components/index.ts`

### Adding a new demo prompt
Add an entry to `PRESET_PROMPTS` in `src/lib/constants.ts` with `label`, `prompt`, and optional `description`.

### Styling markdown content
Edit `src/app/globals.css`:
- `.markdown-content` class for markdown rendering
- Avoid Tailwind prose utilities
