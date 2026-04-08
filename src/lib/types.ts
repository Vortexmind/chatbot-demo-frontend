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
