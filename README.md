# Well-behaved chatbot frontend

A Next.js frontend for a demo chatbot powered by [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) and [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/). Designed for deployment on Cloudflare Workers via OpenNext.

Built with [Kumo](https://github.com/cloudflare/kumo), Cloudflare's open-source design system.

## Features

- **AI Gateway Integration** - Displays model/provider routing info, highlights changes, shows block reasons
- **Activity Timeline** - Collapsible panel showing all AI Gateway events (requests, responses, blocks)
- **Block Differentiation** - Visual distinction between rate limits (orange) and content blocks (red) with detailed error info
- **Preset Demo Prompts** - Clickable prompts covering guardrails, DLP, routing, coding, translation, and creative writing
- **File Attachments** - Support for images and documents with automatic model routing
- **Access identity** - Uses the email from the Cloudflare Access token for display and AI Gateway attribution
- **Dark Mode** - Toggle between light and dark themes with automatic persistence
- **Cloudflare Access Auth** - Reads the `CF_Authorization` cookie for backend authentication and identity display
- **Agent Chat** - Second tab backed by a Workers AI agent with server tools, browser tools, approval-gated tools, and Cloudflare docs search
- **Architecture Tab** - Interactive React Flow diagram of the standard and agent request paths, with clickable components and manual step navigation

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: [Kumo](https://github.com/cloudflare/kumo) (Cloudflare's design system) + Tailwind CSS v4
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Agent SDK**: `agents` + `@cloudflare/ai-chat` + `ai` v7
- **Deployment**: Cloudflare Workers via [OpenNext](https://opennext.js.org/)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Kumo styles + markdown CSS
│   ├── layout.tsx       # Root layout with Kumo theme
│   └── page.tsx         # Main chat page (state, streaming, drawer)
├── components/
│   ├── AgentChatTab.tsx          # Agent tab with useAgent/useAgentChat
│   ├── AgentChatMessage.tsx      # Tool parts and approval UI
│   ├── AgentChatInput.tsx        # Agent input
│   ├── AIGatewayDrawer.tsx       # Event timeline drawer
│   ├── ChatInput.tsx             # Input + attachments
│   ├── ChatLayout.tsx            # Page shell + dark mode + drawer
│   ├── ChatMessage.tsx           # Message bubbles
│   ├── ChatMessageList.tsx       # Scrollable message area
│   ├── DarkModeToggle.tsx        # Light/dark switch
│   ├── PresetPrompts.tsx         # Demo prompt chips
│   ├── UsernameDialog.tsx        # Username picker
│   └── index.ts                  # Component exports
└── lib/
    ├── constants.ts     # API URL, file limits, presets
    ├── types.ts         # TypeScript types
    └── utils.ts         # Helper functions
```

## Prerequisites

### Cloudflare Access Protection

This application expects to be protected by [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/):

1. Go to **Cloudflare Zero Trust Dashboard** > **Access** > **Applications**
2. Create an application for your frontend domain
3. Configure authentication policies as needed

When users authenticate through Cloudflare Access, a `CF_Authorization` cookie is set automatically. The frontend reads this cookie, decodes the email for display, and sends the token to the backend API for authentication.

Because that cookie is readable from JavaScript, `next.config.mjs` applies a Content-Security-Policy and the standard hardening headers to every route. If you add a new backend origin, add it to `connect-src` there.

`wrangler.json` sets `workers_dev: false` and `preview_urls: false`, and declares the custom domain explicitly. Cloudflare Access only applies to the custom domain, so leaving the `workers.dev` hostname enabled would serve the UI to the open internet.

The backend sends the verified Access email to AI Gateway as `cf-aig-metadata` keys `user_id` and `user`, so the AI Gateway User Insights dashboard attributes requests and spend to the signed-in user. The agent Worker derives that email from the verified token; the browser never sends it.

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
| `pnpm check` | Full validation: OpenNext build, tsc, wrangler dry-run |
| `pnpm lint` | Run ESLint |
| `pnpm cf-typegen` | Regenerate Cloudflare Worker types |

## Configuration

### Environment

Backend URLs are configured in `src/lib/constants.ts`:

```typescript
// Chat API (stateless worker)
export const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";

// Agent backend. Empty in production so the browser connects same-origin
// under /agents/*. Set NEXT_PUBLIC_AGENT_HOST for local development.
export const AGENT_HOST = process.env.NEXT_PUBLIC_AGENT_HOST || "";
export const AGENT_NAME = "ChatAgent";
```

For local agent development, run the agent Worker on port 8787 and start the frontend with `NEXT_PUBLIC_AGENT_HOST=http://localhost:8787 pnpm dev`.

### Preset Prompts

Demo prompts are configured in `src/lib/constants.ts`:

```typescript
export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    label: "Violent intent",
    prompt: "I want to punch someone",
    description: "Triggers content policy block",
  },
  // ...
];
```

## Demo Workflow

1. **Normal Request**: Send "What is 2+2?" to see dynamic model routing
2. **Content Block**: Click "Violent intent" to trigger a content policy block
3. **Rate Limit**: Send multiple requests quickly to trigger per-user rate limiting
4. **Activity Panel**: Expand to see the event timeline with model/provider info

The Activity Panel shows:
- Request timestamps and prompt previews
- Model and provider badges for successful responses
- HTTP status badges (green for success, red for blocked)
- Block reasons for rejected requests

### Agent tab

1. **Server tool**: Ask "What's the weather in Paris?"
2. **Browser tool**: Ask "What timezone am I in?"
3. **Approval tool**: Ask "What is 5000 * 3?" and approve the calculation
4. **Docs search**: Ask a Cloudflare product question to trigger `searchCloudflareDocs`

The agent is served same-origin under `/agents/*`, so the existing Cloudflare Access application protects it. Conversation history is scoped to the browser session, so closing the browser starts a fresh conversation.

## Related

- [chatbot-demo-agent](../chatbot-demo-agent) - Workers AI agent backend
- [chatbot-demo](../chatbot-demo) - Backend Cloudflare Worker
- [Kumo](https://github.com/cloudflare/kumo) - Cloudflare's design system
- [AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
