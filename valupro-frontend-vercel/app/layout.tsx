// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { TickerBar } from "@/components/layout/TickerBar";
import { Sidebar }   from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "ValuPro — Institutional Valuation Platform",
  description: "Institutional-grade DCF, comps, and scenario analysis for investment professionals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#060b18] text-slate-100 font-sans antialiased overflow-hidden h-screen flex flex-col">
        {/* ─── Persistent market data strip ─── */}
        <TickerBar />

        {/* ─── Main chrome ─── */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
