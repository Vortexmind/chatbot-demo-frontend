import { ADJECTIVES, ANIMALS } from "./constants";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function generateRandomUsername(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${animal}${number}`;
}

export function getRandomUsernames(count: number): string[] {
  const usernames = new Set<string>();
  while (usernames.size < count) {
    usernames.add(generateRandomUsername());
  }
  return Array.from(usernames);
}

/**
 * Parse the block type from an HTTP status code
 */
export function getBlockType(httpStatus: number): "rate-limit" | "content-block" | "error" {
  if (httpStatus === 429) {
    return "rate-limit";
  }
  if (httpStatus >= 400 && httpStatus < 500) {
    return "content-block";
  }
  return "error";
}

/**
 * Get a human-readable label for a block type
 */
export function getBlockLabel(httpStatus: number): string {
  const type = getBlockType(httpStatus);
  switch (type) {
    case "rate-limit":
      return "Rate Limited";
    case "content-block":
      return "Request Blocked";
    default:
      return "Error";
  }
}
