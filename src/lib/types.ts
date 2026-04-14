export type Attachment = {
  filename: string;
  mimeType: string;
  data: string;
};

export type BlockInfo = {
  httpStatus: number;
  code?: number;
  message?: string;
};

export type Message = {
  sender: "user" | "bot";
  text: string;
  attachments?: Attachment[];
  blocked?: BlockInfo;
  isStreaming?: boolean;
};

export type AIGatewayInfo = {
  model: string | null;
  provider: string | null;
  debug: string | null;
};

export type ErrorResponse = {
  success: boolean;
  error?: Array<{ code: number; message: string }>;
};

export type PresetPrompt = {
  label: string;
  prompt: string;
  description?: string;
};

export type AIGatewayEventType = "request" | "response" | "blocked" | "error" | "streaming";

export type AIGatewayEvent = {
  id: string;
  type: AIGatewayEventType;
  timestamp: Date;
  promptPreview?: string;
  model?: string | null;
  provider?: string | null;
  httpStatus?: number;
  blockReason?: string;
  hasAttachment?: boolean;
  attachmentType?: string;
};

// MCP Types for Agent Tab
export type MCPServerState = "disconnected" | "connecting" | "authenticating" | "ready" | "error";

export type MCPServerInfo = {
  id: string;
  name: string;
  state: MCPServerState;
  authUrl?: string;
  error?: string;
};

export type MCPToolInfo = {
  name: string;
  description?: string;
  serverId: string;
};

export type ChatTab = "standard" | "agent";
