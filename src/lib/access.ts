import { getCookie } from "./utils";

type AccessPayload = {
  email?: string;
  sub?: string;
};

function decodeJwtPayload(token: string): AccessPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    return JSON.parse(atob(padded)) as AccessPayload;
  } catch {
    return null;
  }
}

export function getAccessEmail(): string {
  const token = getCookie("CF_Authorization");
  if (!token) return "";
  const payload = decodeJwtPayload(token);
  return typeof payload?.email === "string" ? payload.email : "";
}

export async function getAccessIdentityEmail(): Promise<string> {
  const fromCookie = getAccessEmail();
  if (fromCookie) return fromCookie;

  try {
    const response = await fetch("/cdn-cgi/access/get-identity", {
      credentials: "include",
    });
    if (!response.ok) return "";
    const identity = (await response.json()) as { email?: string };
    return typeof identity.email === "string" ? identity.email : "";
  } catch {
    return "";
  }
}
