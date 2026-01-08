# Well-behaved chatbot frontend

A Next.js frontend for a demo chatbot powered by [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) and [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/). Designed for deployment on Cloudflare Pages via OpenNext.

## Features

- **Username-based chat** - Users must enter a username before chatting
- **AI Gateway info display** - Shows the model and provider used for each response, with highlight animation when values change
- **Cloudflare Access authentication** - Reads `CF_Authorization` cookie and passes it as `CF-Access-JWT-Assertion` header to the backend
- **Auto-scroll chat** - Conversation automatically scrolls to the latest message
- **Responsive design** - Clean, accessible UI with keyboard support (Escape to clear input)

## Prerequisites

### Cloudflare Access Protection

This application expects to be protected by [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/). You must configure an Access policy for your application separately:

1. Go to **Cloudflare Zero Trust Dashboard** > **Access** > **Applications**
2. Create an application for your frontend domain
3. Configure authentication policies as needed

When users authenticate through Cloudflare Access, a `CF_Authorization` cookie is set automatically. The frontend reads this cookie and sends it to the backend API for authentication.

## Getting Started

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```