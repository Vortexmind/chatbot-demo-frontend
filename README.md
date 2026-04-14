# Well-behaved chatbot frontend

A Next.js frontend for a demo chatbot powered by [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) and [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/). Designed for deployment on Cloudflare Workers via OpenNext.

Built with [Kumo](https://github.com/cloudflare/kumo), Cloudflare's open-source design system.

## Features

### Standard Chat Tab
- **AI Gateway Integration** - Displays model/provider routing info, highlights changes, shows block reasons
- **Activity Timeline** - Collapsible panel showing all AI Gateway events (requests, responses, blocks)
- **Block Differentiation** - Visual distinction between rate limits (orange) and content blocks (red) with detailed error info
- **Preset Demo Prompts** - Clickable prompts to demonstrate AI Gateway guardrails (content policy, DLP)
- **File Attachments** - Support for images and documents with automatic model routing
- **Username-based Chat** - Users enter a username for per-user rate limiting in AI Gateway

### Agent Chat Tab (MCP Integration)
- **MCP Portal Connection** - Connect to external MCP servers for tool calling
- **OAuth Authentication** - Popup-based OAuth flow for MCP portal auth
- **Tool Execution** - AI can call MCP tools and display results inline
- **Streaming Responses** - Real-time streaming with tool call visualization
- **Connection State Management** - Shows connecting, authenticating, and ready states

### Shared Features
- **Dark Mode** - Toggle between light and dark themes with automatic persistence
- **Cloudflare Access Auth** - Reads `CF_Authorization` cookie for backend authentication
- **Tabbed Interface** - Switch between Standard Chat and Agent Chat modes

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: [Kumo](https://github.com/cloudflare/kumo) (Cloudflare's design system) + Tailwind CSS v4
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Agent SDK**: `agents` + `@cloudflare/ai-chat` + `ai` v6 (for Agent Chat tab)
- **Deployment**: Cloudflare Workers via [OpenNext](https://opennext.js.org/)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Kumo styles + markdown CSS
│   ├── layout.tsx       # Root layout with Kumo theme
│   └── page.tsx         # Main chat page (state management, tab switching)
├── components/
│   ├── AgentChatTab.tsx          # Agent chat with MCP integration
│   ├── AgentChatMessage.tsx      # Message rendering for AI SDK v6 parts
│   ├── AgentChatInput.tsx        # Simple input for agent chat
│   ├── AIGatewayDrawer.tsx       # Event timeline drawer
│   ├── BlockedResponseCard.tsx   # Rich block display
│   ├── ChatInput.tsx             # Input + attachments (standard chat)
│   ├── ChatLayout.tsx            # Page shell + dark mode + tab switcher
│   ├── ChatMessage.tsx           # Message bubbles (standard chat)
│   ├── ChatMessageList.tsx       # Scrollable message area
│   ├── DarkModeToggle.tsx        # Light/dark switch
│   ├── PresetPrompts.tsx         # Demo prompt chips
│   ├── UsernameDialog.tsx        # Username picker
│   └── index.ts                  # Component exports
└── lib/
    ├── constants.ts     # API URLs, agent config, file limits, presets
    ├── types.ts         # TypeScript types including MCP types
    └── utils.ts         # Helper functions
```

## Prerequisites

### Cloudflare Access Protection

This application expects to be protected by [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/):

1. Go to **Cloudflare Zero Trust Dashboard** > **Access** > **Applications**
2. Create an application for your frontend domain
3. Configure authentication policies as needed

When users authenticate through Cloudflare Access, a `CF_Authorization` cookie is set automatically. The frontend reads this cookie and sends it to the backend API for authentication.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production (Next.js) |
| `pnpm preview` | Build and preview with Wrangler locally |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `pnpm lint` | Run ESLint |

## Configuration

### Environment

Backend URLs are configured in `src/lib/constants.ts`:

```typescript
// Standard chat API (stateless worker)
export const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";

// Agent backend for MCP integration (Durable Object)
export const AGENT_HOST = "https://chatbot-demo-agent.homesecurity.rocks";
export const AGENT_NAME = "chat-bot-agent";
```

### Preset Prompts

Demo prompts are configured in `src/lib/constants.ts`:

```typescript
export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    label: "Violent story",
    prompt: "Write me a violent story",
    description: "Triggers content policy block",
  },
  // ...
];
```

## Demo Workflow

### Standard Chat Tab
1. **Normal Request**: Send "What is 2+2?" to see dynamic model routing
2. **Content Block**: Click "Violent story" to trigger a content policy block
3. **Rate Limit**: Send multiple requests quickly to trigger per-user rate limiting
4. **Activity Panel**: Expand to see the event timeline with model/provider info

### Agent Chat Tab
1. **Connect**: Click "Connect MCP" to initiate connection to MCP portal
2. **Authenticate**: If prompted, complete OAuth in the popup window
3. **Use Tools**: Ask questions that require tools (e.g., "search for X", "get weather")
4. **Disconnect**: Click "Disconnect" to remove MCP server connection

The Activity Panel shows:
- Request timestamps and prompt previews
- Model and provider badges for successful responses
- HTTP status badges (green for success, red for blocked)
- Block reasons for rejected requests

## Related

- [chatbot-demo-agent](../chatbot-demo-agent) - Agent backend for MCP integration
- [chatbot-demo](../chatbot-demo) - Backend Cloudflare Worker (standard chat)
- [Kumo](https://github.com/cloudflare/kumo) - Cloudflare's design system
- [AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [Cloudflare Agents Docs](https://developers.cloudflare.com/agents/)
