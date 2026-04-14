# Agent Guidelines for chatbot-demo-frontend

This is a Next.js 16 frontend deployed on Cloudflare Workers via OpenNext. It provides a tabbed chat interface with both a standard stateless API chat and an agent-based MCP-enabled chat.

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

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Kumo styles, Tailwind, markdown-content class
│   ├── layout.tsx       # Root layout with Kumo theme provider
│   └── page.tsx         # Main page with tab state and both chat implementations
├── components/
│   ├── AgentChatTab.tsx          # Agent chat container with useAgent/useAgentChat
│   ├── AgentChatMessage.tsx      # Renders AI SDK v6 message parts
│   ├── AgentChatInput.tsx        # Simple text input for agent chat
│   ├── AIGatewayDrawer.tsx       # Activity timeline drawer
│   ├── BlockedResponseCard.tsx   # Blocked response display
│   ├── ChatInput.tsx             # Input with file attachments (standard)
│   ├── ChatLayout.tsx            # Page shell with tabs and dark mode
│   ├── ChatMessage.tsx           # Message bubble (standard chat)
│   ├── ChatMessageList.tsx       # Scrollable message list
│   ├── DarkModeToggle.tsx        # Theme toggle
│   ├── PresetPrompts.tsx         # Demo prompt chips
│   ├── UsernameDialog.tsx        # Username entry modal
│   └── index.ts                  # Barrel exports
└── lib/
    ├── constants.ts     # API_URL, AGENT_HOST, AGENT_NAME, presets
    ├── types.ts         # All TypeScript types
    └── utils.ts         # Helper functions
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
import { PaperPlaneTilt, Plug, PlugsConnected } from "@phosphor-icons/react";
import { useAgent, useAgentChat } from "@cloudflare/ai-chat/react";
import type { UIMessage } from "ai";
```

### Naming Conventions
- **Components**: PascalCase (`AgentChatTab.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAgent`, `useAgentChat`)
- **Types**: PascalCase (`MCPServerState`, `ChatTab`)
- **Constants**: SCREAMING_SNAKE_CASE (`AGENT_HOST`, `API_URL`)
- **Functions**: camelCase (`handleSend`, `formatTime`)

## Key Components

### AgentChatTab.tsx
Main container for agent chat functionality:
- Uses `useAgent()` for WebSocket connection to agent backend
- Uses `useAgentChat()` for AI SDK chat integration
- Manages MCP connection state via `onMcpUpdate` callback
- Handles OAuth popup flow for MCP authentication

```typescript
const agent = useAgent({
  agent: AGENT_NAME,
  host: AGENT_HOST,
  onMcpUpdate: useCallback((data: { servers: Record<string, MCPServerInfo> }) => {
    // Handle MCP state changes
  }, []),
});

const { messages, input, handleInputChange, handleSubmit, isLoading } = useAgentChat({
  agent,
});
```

### AgentChatMessage.tsx
Renders AI SDK v6 message parts:
- User messages: plain text
- Assistant messages: iterates over `message.parts` array
- Part types: `text`, `tool-{toolName}` (static), `dynamic-tool` (MCP)
- Uses `markdown-content` CSS class for styling

```typescript
{message.parts?.map((part, i) => {
  if (part.type === "text") {
    return <ReactMarkdown key={i}>{part.text}</ReactMarkdown>;
  }
  if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
    return <ToolCallDisplay key={i} part={part} />;
  }
})}
```

### ChatLayout.tsx
Page shell with:
- Tab switcher (Standard / Agent)
- Dark mode toggle
- Kumo Page component wrapper

## Types (src/lib/types.ts)

### MCP Types
```typescript
export type MCPServerState = "disconnected" | "connecting" | "authenticating" | "ready" | "error";

export type MCPServerInfo = {
  id: string;
  name: string;
  state: MCPServerState;
  authUrl?: string;
  error?: string;
};

export type ChatTab = "standard" | "agent";
```

## Key Patterns

### Agent Connection with MCP
```typescript
const [mcpState, setMcpState] = useState<MCPServerState>("disconnected");
const [authUrl, setAuthUrl] = useState<string | null>(null);

const agent = useAgent({
  agent: AGENT_NAME,
  host: AGENT_HOST,
  onMcpUpdate: useCallback((data) => {
    const servers = Object.values(data.servers);
    if (servers.length === 0) {
      setMcpState("disconnected");
    } else {
      const server = servers[0];
      setMcpState(server.state);
      if (server.state === "authenticating" && server.authUrl) {
        setAuthUrl(server.authUrl);
      }
    }
  }, []),
});
```

### OAuth Popup Flow
```typescript
const handleConnect = async () => {
  setMcpState("connecting");
  const result = await agent.connectMcpPortal();
  
  if (result.state === "authenticating" && result.authUrl) {
    setAuthUrl(result.authUrl);
    setMcpState("authenticating");
    // Open popup
    window.open(result.authUrl, "mcp-auth", "width=600,height=700");
  }
};
```

### Message Part Rendering (AI SDK v6)
```typescript
// Static tools use "tool-{toolName}" pattern
// MCP dynamic tools use "dynamic-tool" type
const isToolPart = part.type.startsWith("tool-") || part.type === "dynamic-tool";
```

### Markdown Styling
Use `markdown-content` class (defined in globals.css) for rendered markdown:
```tsx
<div className="markdown-content">
  <ReactMarkdown>{text}</ReactMarkdown>
</div>
```

**Note**: Do NOT use Tailwind `prose` classes; they cause white-on-white text issues.

## Common Gotchas

1. **AGENT_NAME must be kebab-case**: The agent backend converts `ChatBotAgent` to `chat-bot-agent`
2. **MCP state via onMcpUpdate**: NOT onStateUpdate; message type is `CF_AGENT_MCP_SERVERS`
3. **AI SDK v6 part types**: Static tools are `tool-{name}`, MCP tools are `dynamic-tool`
4. **Markdown styling**: Use `markdown-content` class, not `prose` (causes visibility issues)
5. **OAuth popup**: User may close manually; handle both successful auth and cancel states

## Constants (src/lib/constants.ts)

```typescript
// Standard chat backend (stateless Worker)
export const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";

// Agent backend (Durable Object with MCP)
export const AGENT_HOST = "https://chatbot-demo-agent.homesecurity.rocks";
export const AGENT_NAME = "chat-bot-agent";
```

## Common Tasks

### Adding new components
1. Create component in `src/components/`
2. Add `"use client"` if it uses hooks or browser APIs
3. Export from `src/components/index.ts`

### Modifying agent connection
Edit `AgentChatTab.tsx`:
- `useAgent()` options for connection config
- `onMcpUpdate` callback for state handling
- RPC calls like `agent.connectMcpPortal()`

### Styling markdown content
Edit `src/app/globals.css`:
- `.markdown-content` class for markdown rendering
- Avoid Tailwind prose utilities

### Adding new tab
1. Add to `ChatTab` type in `types.ts`
2. Add tab button in `ChatLayout.tsx`
3. Add conditional rendering in `page.tsx`
