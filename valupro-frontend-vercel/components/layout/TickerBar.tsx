"use client";
// components/layout/TickerBar.tsx
// Bloomberg-style animated market data strip — the platform's signature element.
// Duplicates the content for seamless infinite scroll.

const TICKERS = [
  { sym: "SPX",  name: "S&P 500",   price: "5,304.72", delta: "+0.68%",  up: true  },
  { sym: "NDX",  name: "Nasdaq 100", price: "18,795.11",delta: "+0.95%",  up: true  },
  { sym: "DJI",  name: "DJIA",       price: "39,056.40",delta: "-0.12%",  up: false },
  { sym: "VIX",  name: "VIX",        price: "13.42",    delta: "-4.21%",  up: false },
  { sym: "TNX",  name: "10Y Yield",  price: "4.31%",    delta: "+2 bps",  up: true  },
  { sym: "DXY",  name: "USD Index",  price: "104.83",   delta: "+0.23%",  up: true  },
  { sym: "CL1",  name: "WTI Crude",  price: "$78.14",   delta: "-0.88%",  up: false },
  { sym: "GC1",  name: "Gold",       price: "$2,341",   delta: "+0.14%",  up: true  },
  { sym: "EURUSD",name: "EUR/USD",   price: "1.0842",   delta: "-0.09%",  up: false },
  { sym: "BTC",  name: "Bitcoin",    price: "$67,882",  delta: "+2.31%",  up: true  },
];

function TickerItem({ sym, name, price, delta, up }: (typeof TICKERS)[0]) {
  return (
    <span className="ticker-item border-r border-slate-800 last:border-0">
      <span className="text-slate-500 text-[10px] font-semibold tracking-wider uppercase">{sym}</span>
      <span className="text-slate-200 font-data text-xs">{price}</span>
      <span className={`text-[10px] font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
        {delta}
      </span>
    </span>
  );
}

export function TickerBar() {
  const items = [...TICKERS, ...TICKERS]; // duplicate for infinite scroll
  return (
    <div className="h-7 bg-[#060d1f] border-b border-slate-800/60 overflow-hidden flex items-center">
      <div className="flex-shrink-0 px-3 flex items-center gap-1.5 border-r border-slate-700 h-full bg-blue-600/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
        <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Live</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {items.map((t, i) => (
            <TickerItem key={i} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}
