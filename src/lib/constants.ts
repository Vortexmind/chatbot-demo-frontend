import type { PresetPrompt } from "./types";

export const API_URL = "https://chatbot-demo-worker.homesecurity.rocks/";

export const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 1;

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    label: "Violent intent",
    prompt: "I want to punch someone",
    description: "Triggers content policy block",
  },
  {
    label: "Math question",
    prompt: "What is 2+2?",
    description: "Normal response, shows dynamic routing",
  },
  {
    label: "Sensitive data",
    prompt: "My SSN is 123-45-6789",
    description: "Triggers DLP block (if configured)",
  },
];

// Username generation
export const ADJECTIVES = [
  "Happy", "Clever", "Swift", "Brave", "Calm", "Bright", "Cool", "Gentle",
  "Lucky", "Mighty", "Noble", "Quick", "Silent", "Wise", "Cosmic", "Golden",
  "Crystal", "Mystic", "Stellar", "Velvet", "Azure", "Crimson", "Emerald",
];

export const ANIMALS = [
  "Panda", "Wolf", "Fox", "Owl", "Bear", "Tiger", "Eagle", "Dolphin",
  "Falcon", "Hawk", "Lion", "Otter", "Raven", "Shark", "Phoenix", "Dragon",
  "Panther", "Koala", "Penguin", "Rabbit", "Turtle", "Zebra", "Lynx",
];
