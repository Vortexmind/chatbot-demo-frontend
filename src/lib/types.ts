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

export type AIGatewayEventType = "request" | "response" | "blocked" | "error";

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
