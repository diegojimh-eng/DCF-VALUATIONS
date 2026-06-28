import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core palette ──────────────────────────────────────────────────
        // Deep navy — primary surface (Bloomberg-like terminal feel)
        navy: {
          950: "#060b18",
          900: "#0a1628",
          800: "#0f2040",
          700: "#142a55",
          600: "#1a3569",
          500: "#1e3d7a",
        },
        // Slate — secondary surfaces and borders
        slate: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
          50:  "#f8fafc",
        },
        // Electric blue — primary accent (active states, CTAs)
        blue: {
          700: "#1d4ed8",
          600: "#2563eb",
          500: "#3b82f6",
          400: "#60a5fa",
          300: "#93c5fd",
        },
        // Emerald — positive deltas, bull scenario
        emerald: {
          600: "#059669",
          500: "#10b981",
          400: "#34d399",
          300: "#6ee7b7",
        },
        // Amber — warnings, caution, bear scenario
        amber: {
          600: "#d97706",
          500: "#f59e0b",
          400: "#fbbf24",
          300: "#fcd34d",
        },
        // Red — negative values, alerts
        red: {
          600: "#dc2626",
          500: "#ef4444",
          400: "#f87171",
        },
        // Semantic tokens
        background:   "hsl(var(--background))",
        foreground:   "hsl(var(--foreground))",
        card:         { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        primary:      { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:    { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted:        { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:       { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive:  { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border:       "hsl(var(--border))",
        input:        "hsl(var(--input))",
        ring:         "hsl(var(--ring))",
      },
      fontFamily: {
        // UI text — clean and professional
        sans:  ["Inter", "system-ui", "sans-serif"],
        // All financial figures — monospaced for alignment
        mono:  ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
        // Display headers
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Micro — ticker tape, table footers
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        xs:    ["0.75rem",  { lineHeight: "1rem" }],
        sm:    ["0.875rem", { lineHeight: "1.25rem" }],
        base:  ["1rem",     { lineHeight: "1.5rem" }],
        lg:    ["1.125rem", { lineHeight: "1.75rem" }],
        xl:    ["1.25rem",  { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.5rem" }],
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        none: "0px",
        // Financial tables: sharp corners only
        "data": "2px",
      },
      spacing: {
        // Compact spacing for dense data tables
        "0.5": "0.125rem",
        "1.5": "0.375rem",
        "2.5": "0.625rem",
        "3.5": "0.875rem",
      },
      boxShadow: {
        "panel":    "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
        "panel-lg": "0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.5)",
        "glow-blue": "0 0 0 1px rgba(59,130,246,0.4), 0 0 12px rgba(59,130,246,0.15)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "ticker":         { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "fade-in":        { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pulse-dot":      { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "ticker":         "ticker 40s linear infinite",
        "fade-in":        "fade-in 0.15s ease-out",
        "pulse-dot":      "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
