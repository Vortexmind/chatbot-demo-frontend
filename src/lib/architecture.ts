import { MarkerType, type Edge, type Node } from "@xyflow/react";

export type ArchitectureIcon =
  | "browser"
  | "frontend"
  | "access"
  | "waf"
  | "worker"
  | "agent"
  | "durable"
  | "gateway"
  | "guardrails"
  | "router"
  | "workers-ai"
  | "observability";

export type ArchitectureTone = "neutral" | "blue" | "violet" | "orange" | "green";

export type ArchitectureNodeData = {
  title: string;
  subtitle: string;
  icon: ArchitectureIcon;
  tone: ArchitectureTone;
  badges?: string[];
  active?: boolean;
  dimmed?: boolean;
  details: {
    summary: string;
    bullets: string[];
    docs?: { label: string; href: string };
  };
};

export type ArchitectureFlowNode = Node<ArchitectureNodeData, "architecture">;
export type ArchitectureLaneData = {
  label: string;
  active?: boolean;
  dimmed?: boolean;
};
export type ArchitectureLaneNode = Node<ArchitectureLaneData, "lane">;
export type ArchitectureNode = ArchitectureFlowNode | ArchitectureLaneNode;

export type FlowId = "standard" | "agent" | "observability";

export type FlowDefinition = {
  id: FlowId;
  label: string;
  color: string;
  nodeIds: string[];
};

export type ArchitectureEdgeData = {
  flows: FlowId[];
};

export type ArchitectureEdge = Edge<ArchitectureEdgeData>;

export const FLOWS: FlowDefinition[] = [
  {
    id: "standard",
    label: "Standard chat",
    color: "#3b82f6",
    nodeIds: [
      "browser",
      "access",
      "frontend",
      "standard-worker",
      "gateway-access",
      "gateway",
      "guardrails",
      "router",
      "workers-ai",
    ],
  },
  {
    id: "agent",
    label: "Agent chat",
    color: "#8b5cf6",
    nodeIds: [
      "browser",
      "access",
      "frontend",
      "agent-worker",
      "agent-do",
      "gateway-access",
      "gateway",
      "guardrails",
      "router",
      "workers-ai",
    ],
  },
  {
    id: "observability",
    label: "Logs and insights",
    color: "#f59e0b",
    nodeIds: ["gateway", "observability"],
  },
];

export const architectureNodes: ArchitectureNode[] = [
  {
    id: "lane-edge",
    type: "lane",
    position: { x: -40, y: 20 },
    style: { width: 540, height: 700, pointerEvents: "none" },
    data: { label: "Client and edge" },
    selectable: false,
    draggable: false,
    connectable: false,
    zIndex: -1,
  },
  {
    id: "lane-app",
    type: "lane",
    position: { x: 500, y: 20 },
    style: { width: 720, height: 700, pointerEvents: "none" },
    data: { label: "Application" },
    selectable: false,
    draggable: false,
    connectable: false,
    zIndex: -1,
  },
  {
    id: "lane-ai",
    type: "lane",
    position: { x: 1220, y: 20 },
    style: { width: 780, height: 760, pointerEvents: "none" },
    data: { label: "AI platform" },
    selectable: false,
    draggable: false,
    connectable: false,
    zIndex: -1,
  },
  {
    id: "browser",
    type: "architecture",
    position: { x: 0, y: 260 },
    data: {
      title: "User browser",
      subtitle: "Chat UI",
      icon: "browser",
      tone: "neutral",
      badges: ["Access session"],
      details: {
        summary:
          "The user opens the demo and authenticates through Cloudflare Access before any chat request is sent.",
        bullets: [
          "Access sets a session cookie and issues a signed JWT.",
          "The browser sends the JWT to the app and agent endpoints.",
          "Chat responses stream back into the UI.",
        ],
      },
    },
  },
  {
    id: "access",
    type: "architecture",
    position: { x: 250, y: 260 },
    data: {
      title: "Cloudflare Access",
      subtitle: "Identity at the edge",
      icon: "access",
      tone: "blue",
      badges: ["SSO", "JWT"],
      details: {
        summary:
          "Cloudflare Access verifies the user's identity before requests reach the application.",
        bullets: [
          "Protects the frontend hostname.",
          "Issues a signed JWT containing the user's email.",
          "The same identity is used for AI Gateway attribution.",
        ],
        docs: {
          label: "Access documentation",
          href: "https://developers.cloudflare.com/cloudflare-one/access-controls/",
        },
      },
    },
  },
  {
    id: "waf",
    type: "architecture",
    position: { x: 250, y: 500 },
    data: {
      title: "WAF and bot rules",
      subtitle: "Zone protection",
      icon: "waf",
      tone: "orange",
      badges: ["Managed rules", "Gateway skip"],
      details: {
        summary:
          "The zone's WAF and bot rules inspect requests before they reach the app.",
        bullets: [
          "Managed rules and custom bot rules apply to the app hostnames.",
          "The AI Gateway custom hostname has a scoped skip rule so server-to-server calls are not blocked.",
          "The skip is limited to the gateway hostname.",
        ],
        docs: {
          label: "WAF documentation",
          href: "https://developers.cloudflare.com/waf/",
        },
      },
    },
  },
  {
    id: "frontend",
    type: "architecture",
    position: { x: 520, y: 260 },
    data: {
      title: "Next.js frontend",
      subtitle: "Workers and OpenNext",
      icon: "frontend",
      tone: "blue",
      badges: ["App Router", "Access identity"],
      details: {
        summary:
          "The demo UI runs as a Next.js app deployed on Cloudflare Workers with OpenNext.",
        bullets: [
          "Renders the chat tabs, preset prompts, and this diagram.",
          "Sends the Access JWT to the chat Worker.",
          "Shows the AI Gateway activity drawer.",
        ],
        docs: {
          label: "Next.js on Workers",
          href: "https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/",
        },
      },
    },
  },
  {
    id: "standard-worker",
    type: "architecture",
    position: { x: 770, y: 100 },
    data: {
      title: "Standard chat Worker",
      subtitle: "REST chat endpoint",
      icon: "worker",
      tone: "blue",
      badges: ["JWT check", "Service token"],
      details: {
        summary:
          "The standard chat Worker validates the Access JWT and calls AI Gateway.",
        bullets: [
          "Extracts the verified email from the Access JWT.",
          "Calls the AI Gateway custom domain with a service token.",
          "Sends user_id, user, and routing metadata with every request.",
        ],
      },
    },
  },
  {
    id: "agent-worker",
    type: "architecture",
    position: { x: 770, y: 420 },
    data: {
      title: "Agent Worker",
      subtitle: "WebSocket agent",
      icon: "agent",
      tone: "violet",
      badges: ["/agents/*", "Tools"],
      details: {
        summary:
          "The agent Worker streams responses over WebSocket and exposes tools to the model.",
        bullets: [
          "Routes /agents/* to a per-room agent.",
          "Streams model output back to the browser.",
          "Provides weather, timezone, and docs-search tools.",
        ],
        docs: {
          label: "Agents documentation",
          href: "https://developers.cloudflare.com/agents/",
        },
      },
    },
  },
  {
    id: "agent-do",
    type: "architecture",
    position: { x: 1000, y: 420 },
    data: {
      title: "Chat agent Durable Object",
      subtitle: "Per-room state",
      icon: "durable",
      tone: "violet",
      badges: ["Per room", "SQLite"],
      details: {
        summary:
          "Each chat room gets its own Durable Object instance with isolated state.",
        bullets: [
          "One instance per room identifier.",
          "Stores the chat history in SQLite.",
          "Calls AI Gateway for each model turn.",
        ],
        docs: {
          label: "Durable Objects",
          href: "https://developers.cloudflare.com/durable-objects/",
        },
      },
    },
  },
  {
    id: "gateway-access",
    type: "architecture",
    position: { x: 1000, y: 260 },
    data: {
      title: "AI Gateway Access",
      subtitle: "Service token",
      icon: "access",
      tone: "blue",
      badges: ["Service Auth", "No cf.user_id"],
      details: {
        summary:
          "Cloudflare Access protects the AI Gateway custom domain.",
        bullets: [
          "The Worker authenticates with a service token.",
          "Service tokens do not populate cf.user_id.",
          "The Worker sends user attribution in cf-aig-metadata instead.",
        ],
        docs: {
          label: "AI Gateway Access",
          href: "https://developers.cloudflare.com/ai-gateway/configuration/cloudflare-access/",
        },
      },
    },
  },
  {
    id: "gateway",
    type: "architecture",
    position: { x: 1240, y: 260 },
    data: {
      title: "AI Gateway",
      subtitle: "Control plane for AI traffic",
      icon: "gateway",
      tone: "orange",
      badges: ["Custom domain", "Logs", "Cache"],
      details: {
        summary:
          "AI Gateway provides one endpoint and one control plane for model traffic.",
        bullets: [
          "A single custom domain serves every provider.",
          "Caching, rate limits, logs, and spend controls live here.",
          "Only model traffic is forwarded upstream.",
        ],
        docs: {
          label: "AI Gateway documentation",
          href: "https://developers.cloudflare.com/ai-gateway/",
        },
      },
    },
  },
  {
    id: "guardrails",
    type: "architecture",
    position: { x: 1490, y: 260 },
    data: {
      title: "Guardrails and DLP",
      subtitle: "Policy before inference",
      icon: "guardrails",
      tone: "orange",
      badges: ["Prompt", "Response", "DLP"],
      details: {
        summary:
          "Guardrails and DLP inspect prompts and responses before they reach the model or the user.",
        bullets: [
          "Content policy and prompt-injection checks.",
          "DLP profiles for PII, SSN, and other sensitive data.",
          "Blocked requests return a policy error instead of a model response.",
        ],
        docs: {
          label: "Guardrails",
          href: "https://developers.cloudflare.com/ai-gateway/features/guardrails/",
        },
      },
    },
  },
  {
    id: "router",
    type: "architecture",
    position: { x: 1490, y: 500 },
    data: {
      title: "Dynamic route",
      subtitle: "Model selection",
      icon: "router",
      tone: "green",
      badges: ["Rate limit", "Metadata"],
      details: {
        summary:
          "Dynamic routes choose a model based on request metadata and policy.",
        bullets: [
          "Rate limits can key on metadata such as the user.",
          "Routes can select different models for text, images, or documents.",
          "The route is configured in AI Gateway, not in the app.",
        ],
        docs: {
          label: "Dynamic routing",
          href: "https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/",
        },
      },
    },
  },
  {
    id: "workers-ai",
    type: "architecture",
    position: { x: 1740, y: 500 },
    data: {
      title: "Workers AI",
      subtitle: "Serverless inference",
      icon: "workers-ai",
      tone: "green",
      badges: ["Fast model", "Safety model", "Agent model"],
      details: {
        summary:
          "Workers AI runs the selected model on Cloudflare's serverless inference fleet.",
        bullets: [
          "A fast model handles simple chat and routing.",
          "A safety model screens prompts and responses.",
          "The agent uses a larger model for tool use and multi-step turns.",
        ],
        docs: {
          label: "Workers AI",
          href: "https://developers.cloudflare.com/workers-ai/",
        },
      },
    },
  },
  {
    id: "observability",
    type: "architecture",
    position: { x: 1240, y: 520 },
    data: {
      title: "Logs and User Insights",
      subtitle: "Attribution and spend",
      icon: "observability",
      tone: "neutral",
      badges: ["cf-aig-metadata", "Spend", "Anomalies"],
      details: {
        summary:
          "AI Gateway logs every request and attributes usage to the signed-in user.",
        bullets: [
          "Requests are logged with custom metadata.",
          "User Insights groups spend by user_id.",
          "The activity drawer shows the same events in the UI.",
        ],
        docs: {
          label: "User Insights",
          href: "https://developers.cloudflare.com/ai-gateway/observability/user-insights/",
        },
      },
    },
  },
];

const edgeDefaults = {
  type: "smoothstep" as const,
  sourceHandle: "right-source",
  targetHandle: "left-target",
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  style: { stroke: "#94a3b8", strokeWidth: 1.5 },
};

export const architectureEdges: ArchitectureEdge[] = [
  {
    ...edgeDefaults,
    id: "browser-access",
    source: "browser",
    target: "access",
    label: "Access session",
    data: { flows: ["standard", "agent"] },
  },
  {
    ...edgeDefaults,
    id: "access-frontend",
    source: "access",
    target: "frontend",
    label: "JWT",
    data: { flows: ["standard", "agent"] },
  },
  {
    ...edgeDefaults,
    id: "waf-frontend",
    type: "straight",
    source: "waf",
    target: "frontend",
    sourceHandle: "top-source",
    targetHandle: "bottom-target",
    label: "bot rules",
    animated: false,
    style: { ...edgeDefaults.style, strokeDasharray: "6 4" },
    data: { flows: [] },
  },
  {
    ...edgeDefaults,
    id: "frontend-standard",
    source: "frontend",
    target: "standard-worker",
    label: "POST /chat",
    data: { flows: ["standard"] },
  },
  {
    ...edgeDefaults,
    id: "frontend-agent",
    source: "frontend",
    target: "agent-worker",
    label: "WebSocket /agents",
    data: { flows: ["agent"] },
  },
  {
    ...edgeDefaults,
    id: "agent-do-edge",
    source: "agent-worker",
    target: "agent-do",
    label: "room",
    data: { flows: ["agent"] },
  },
  {
    ...edgeDefaults,
    id: "standard-gateway-access",
    source: "standard-worker",
    target: "gateway-access",
    label: "service token",
    data: { flows: ["standard"] },
  },
  {
    ...edgeDefaults,
    id: "agent-do-gateway-access",
    source: "agent-do",
    target: "gateway-access",
    sourceHandle: "top-source",
    targetHandle: "bottom-target",
    label: "service token",
    data: { flows: ["agent"] },
  },
  {
    ...edgeDefaults,
    id: "gateway-access-gateway",
    source: "gateway-access",
    target: "gateway",
    label: "authorized",
    data: { flows: ["standard", "agent"] },
  },
  {
    ...edgeDefaults,
    id: "gateway-guardrails",
    source: "gateway",
    target: "guardrails",
    label: "policy",
    data: { flows: ["standard", "agent"] },
  },
  {
    ...edgeDefaults,
    id: "guardrails-router",
    source: "guardrails",
    target: "router",
    sourceHandle: "bottom-source",
    targetHandle: "top-target",
    label: "route",
    data: { flows: ["standard", "agent"] },
  },
  {
    ...edgeDefaults,
    id: "router-workers-ai",
    source: "router",
    target: "workers-ai",
    label: "inference",
    data: { flows: ["standard", "agent"] },
  },
  {
    ...edgeDefaults,
    id: "gateway-observability",
    source: "gateway",
    target: "observability",
    sourceHandle: "bottom-source",
    targetHandle: "top-target",
    label: "logs and metadata",
    animated: false,
    style: { ...edgeDefaults.style, strokeDasharray: "6 4" },
    data: { flows: ["observability"] },
  },
];

export function getArchitectureNode(id: string): ArchitectureFlowNode | undefined {
  return architectureNodes.find(
    (node): node is ArchitectureFlowNode =>
      node.type === "architecture" && node.id === id,
  );
}
