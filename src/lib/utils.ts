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
