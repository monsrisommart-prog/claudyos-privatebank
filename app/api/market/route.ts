import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MARKET_TICKERS, getLiveMarketQuotes, normalizeMarketTicker, SUPPORTED_MARKET_TICKERS } from "@/lib/market";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols") || DEFAULT_MARKET_TICKERS.join(",");
  const list = symbols
    .split(",")
    .map(normalizeMarketTicker)
    .filter((ticker) => ticker && SUPPORTED_MARKET_TICKERS.has(ticker));

  const market = await getLiveMarketQuotes(list);
  return NextResponse.json({ ...market, cachedForMs: 5000 });
}
