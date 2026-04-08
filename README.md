# Well-behaved chatbot frontend

A Next.js frontend for a demo chatbot powered by [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) and [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/). Designed for deployment on Cloudflare Workers via OpenNext.

Built with [Kumo](https://github.com/cloudflare/kumo), Cloudflare's open-source design system.

## Features

- **AI Gateway Integration** - Displays model/provider routing info, highlights changes, shows block reasons
- **Activity Timeline** - Collapsible panel showing all AI Gateway events (requests, responses, blocks)
- **Block Differentiation** - Visual distinction between rate limits (orange) and content blocks (red) with detailed error info
- **Preset Demo Prompts** - Clickable prompts to demonstrate AI Gateway guardrails (content policy, DLP)
- **Dark Mode** - Toggle between light and dark themes with automatic persistence
- **File Attachments** - Support for images and documents with automatic model routing
- **Username-based Chat** - Users enter a username for per-user rate limiting in AI Gateway
- **Cloudflare Access Auth** - Reads `CF_Authorization` cookie for backend authentication

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: [Kumo](https://github.com/cloudflare/kumo) (Cloudflare's design system) + Tailwind CSS v4
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Deployment**: Cloudflare Workers via [OpenNext](https://opennext.js.org/)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Kumo styles + markdown CSS
│   ├── layout.tsx       # Root layout with Kumo theme
│   └── page.tsx         # Main chat page (state management)
├── components/
│   ├── AIGatewayActivityPanel.tsx  # Event timeline
│   ├── AIGatewayPanel.tsx          # Model/provider display
│   ├── BlockedResponseCard.tsx     # Rich block display
│   ├── ChatInput.tsx               # Input + attachments
│   ├── ChatLayout.tsx              # Page shell + dark mode
│   ├── ChatMessage.tsx             # Message bubbles
│   ├── ChatMessageList.tsx         # Scrollable message area
│   ├── DarkModeToggle.tsx          # Light/dark switch
│   ├── PresetPrompts.tsx           # Demo prompt chips
│   ├── UsernameDialog.tsx          # Username picker
│   └── index.ts                    # Component exports
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

The backend API URL is configured in `src/lib/constants.ts`:

```typescript
export const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";
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

1. **Normal Request**: Send "What is 2+2?" to see dynamic model routing
2. **Content Block**: Click "Violent story" to trigger a content policy block
3. **Rate Limit**: Send multiple requests quickly to trigger per-user rate limiting
4. **Activity Panel**: Expand to see the event timeline with model/provider info

The Activity Panel shows:
- Request timestamps and prompt previews
- Model and provider badges for successful responses
- HTTP status badges (green for success, red for blocked)
- Block reasons for rejected requests

## Related

- [chatbot-demo](../chatbot-demo) - Backend Cloudflare Worker
- [Kumo](https://github.com/cloudflare/kumo) - Cloudflare's design system
- [AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
