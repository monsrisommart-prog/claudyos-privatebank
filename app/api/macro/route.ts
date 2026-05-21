import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MacroSignal = {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  trend: "up" | "down" | "flat";
  source: "mock" | "api";
};

function scoreRegime(signals: MacroSignal[]) {
  const get = (key: string) => signals.find((signal) => signal.key === key);
  let score = 0;
  const us10y = Number(get("US10Y")?.value || 0);
  const dxy = Number(get("DXY")?.value || 0);
  const fedFunds = Number(get("FEDFUNDS")?.value || 0);
  const cpi = Number(get("CPI")?.value || 0);
  const btcDominance = Number(get("BTC.D")?.value || 0);
  const fearGreed = Number(get("FEAR_GREED")?.value || 50);

  if (us10y > 4.5) score -= 1;
  if (us10y < 4) score += 1;
  if (dxy > 106) score -= 1;
  if (dxy < 102) score += 1;
  if (fedFunds > 5) score -= 1;
  if (cpi > 3.2) score -= 1;
  if (fearGreed > 65) score += 1;
  if (fearGreed < 35) score -= 1;
  if (btcDominance > 55) score -= 0.5;

  const regime = score >= 1.5 ? "Risk-On" : score <= -1.5 ? "Risk-Off" : "Neutral";
  const interpretation =
    regime === "Risk-On"
      ? "Liquidity and sentiment are supportive for risk assets, but valuation discipline still matters."
      : regime === "Risk-Off"
        ? "Macro signals favor capital preservation, cash reserve and lower portfolio beta."
        : "Signals are mixed. Keep deployment gradual and wait for confirmation.";

  return { score, regime, interpretation };
}

export async function GET() {
  const signals: MacroSignal[] = [
    { key: "US10Y", label: "US10Y Yield", value: 4.42, unit: "%", trend: "flat", source: "mock" },
    { key: "DXY", label: "DXY", value: 104.8, trend: "up", source: "mock" },
    { key: "FEDFUNDS", label: "Fed Funds", value: 5.33, unit: "%", trend: "flat", source: "mock" },
    { key: "CPI", label: "CPI YoY", value: 3.1, unit: "%", trend: "down", source: "mock" },
    { key: "BTC.D", label: "BTC Dominance", value: 54.2, unit: "%", trend: "up", source: "mock" },
    { key: "FEAR_GREED", label: "Fear & Greed", value: 72, trend: "up", source: "mock" },
  ];

  return NextResponse.json({
    source: "mock",
    signals,
    regime: scoreRegime(signals),
    timestamp: Date.now(),
    note: "Connect FRED, TradingView/market data, Alternative.me and crypto data providers for live macro feeds.",
  });
}
