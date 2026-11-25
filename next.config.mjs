const isDev = process.env.NODE_ENV === "development";

const API_ORIGIN = "https://chatbot-demo-worker.homesecurity.rocks";
const AGENT_WS_ORIGIN = "wss://chatbot-demo.homesecurity.rocks";

// Next.js injects inline bootstrap scripts, and Kumo/Tailwind/React Flow emit
// inline styles, so both need 'unsafe-inline'. Everything else is locked down:
// no external script origins, no eval in production, no framing.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN} ${AGENT_WS_ORIGIN}${
    isDev ? " http://localhost:8787 ws://localhost:8787" : ""
  }`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // No includeSubDomains: this hostname does not own the whole zone.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
