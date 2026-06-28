import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In production on Vercel, NEXT_PUBLIC_API_URL points to your Railway backend.
  // In development, Next.js dev server proxies /api/v1/* to localhost:8000.
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    // Only add the rewrite when a backend URL is explicitly configured.
    // On Vercel without a backend, pages use mock/demo data.
    if (!apiBase) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  reactStrictMode: true,
  // Do NOT use output: "standalone" on Vercel — Vercel handles its own output
};

export default nextConfig;
