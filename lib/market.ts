import { fmpGet, mockQuotes, type FmpQuote } from "@/lib/fmp";

export const DEFAULT_MARKET_TICKERS = ["BTC-USD", "ARM", "JEPQ", "NVO", "META", "ORCL", "CLPT", "NFLX", "MSFT", "V", "LLY"];
export const SUPPORTED_MARKET_TICKERS = new Set(DEFAULT_MARKET_TICKERS);

export type LiveMarketQuote = {
  ticker: string;
  symbol: string;
  name?: string;
  price: number;
  changePercent: number;
  changesPercentage: number;
  marketStatus: "OPEN" | "CLOSED" | "CRYPTO_24_7";
  lastUpdated: string;
  source: "yahoo" | "fmp" | "mock";
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketTime?: number;
        shortName?: string;
        longName?: string;
        regularMarketChangePercent?: number;
      };
    }>;
  };
};

export function normalizeMarketTicker(ticker: string) {
  const normalized = ticker.trim().toUpperCase();
  if (normalized === "BTC") return "BTC-USD";
  if (normalized === "BTCUSD") return "BTC-USD";
  if (normalized === "GOLD") return "GLD";
  return normalized;
}

function toFmpSymbol(ticker: string) {
  if (ticker === "BTC" || ticker === "BTC-USD") return "BTCUSD";
  return ticker;
}

export function getMarketStatus(ticker: string, timestampMs = Date.now()): LiveMarketQuote["marketStatus"] {
  if (ticker === "BTC" || ticker === "BTC-USD") return "CRYPTO_24_7";
  const date = new Date(timestampMs);
  const utcDay = date.getUTCDay();
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const isWeekday = utcDay >= 1 && utcDay <= 5;
  return isWeekday && minutes >= 14 * 60 + 30 && minutes < 21 * 60 ? "OPEN" : "CLOSED";
}

async function fetchYahooQuote(ticker: string): Promise<LiveMarketQuote> {
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1m`, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0 ClaudyOS Market Data" },
  });
  if (!response.ok) throw new Error(`Yahoo request failed: ${response.status}`);
  const payload = (await response.json()) as YahooChartResponse;
  const meta = payload.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  const previousClose = Number(meta?.chartPreviousClose || meta?.previousClose);
  if (!Number.isFinite(price)) throw new Error(`Yahoo missing price for ${ticker}`);
  const changePercent =
    meta?.regularMarketChangePercent !== undefined && Number.isFinite(Number(meta.regularMarketChangePercent))
      ? Number(meta.regularMarketChangePercent)
      : previousClose
        ? ((price - previousClose) / previousClose) * 100
        : 0;
  const timestampMs = meta?.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now();
  return {
    ticker,
    symbol: ticker,
    name: meta?.longName || meta?.shortName || ticker,
    price,
    changePercent,
    changesPercentage: changePercent,
    marketStatus: getMarketStatus(ticker, timestampMs),
    lastUpdated: new Date(timestampMs).toISOString(),
    source: "yahoo",
  };
}

function fmpToMarketQuote(ticker: string, quote: FmpQuote): LiveMarketQuote {
  const timestampMs = quote.timestamp ? quote.timestamp * 1000 : Date.now();
  const changePercent = Number(quote.changesPercentage || 0);
  return {
    ticker,
    symbol: ticker,
    name: quote.name || ticker,
    price: Number(quote.price || 0),
    changePercent,
    changesPercentage: changePercent,
    marketStatus: getMarketStatus(ticker, timestampMs),
    lastUpdated: new Date(timestampMs).toISOString(),
    source: "fmp",
  };
}

function mockToMarketQuote(ticker: string, quote: FmpQuote): LiveMarketQuote {
  const timestampMs = quote.timestamp ? quote.timestamp * 1000 : Date.now();
  const changePercent = Number(quote.changesPercentage || 0);
  return {
    ticker,
    symbol: ticker,
    name: quote.name || ticker,
    price: Number(quote.price || 0),
    changePercent,
    changesPercentage: changePercent,
    marketStatus: getMarketStatus(ticker, timestampMs),
    lastUpdated: new Date(timestampMs).toISOString(),
    source: "mock",
  };
}

export async function getLiveMarketQuotes(tickers: string[]) {
  const normalized = Array.from(
    new Set(
      tickers
        .map(normalizeMarketTicker)
        .filter(Boolean)
    )
  );
  const requestedTickers = normalized.length ? normalized : DEFAULT_MARKET_TICKERS;

  try {
    const quotes = await Promise.all(requestedTickers.map((ticker) => fetchYahooQuote(ticker)));
    return {
      source: "yahoo" as const,
      quotes,
      marketStatus: quotes.some((quote) => quote.marketStatus === "OPEN") ? "OPEN" : "CLOSED",
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now(),
    };
  } catch (error) {
    try {
      const fmpSymbols = requestedTickers.map(toFmpSymbol);
      const fmpQuotes = await fmpGet<FmpQuote[]>(`/quote/${fmpSymbols.join(",")}`, 5_000);
      const bySymbol = new Map(fmpQuotes.map((quote) => [quote.symbol?.toUpperCase(), quote]));
      const quotes = requestedTickers
        .map((ticker) => {
          const quote = bySymbol.get(toFmpSymbol(ticker));
          return quote ? fmpToMarketQuote(ticker, quote) : null;
        })
        .filter((quote): quote is LiveMarketQuote => Boolean(quote));
      if (!quotes.length) throw new Error("FMP returned no supported quotes");
      return {
        source: "fmp" as const,
        reason: error instanceof Error ? error.message : "Yahoo unavailable",
        quotes,
        marketStatus: quotes.some((quote) => quote.marketStatus === "OPEN") ? "OPEN" : "CLOSED",
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now(),
      };
    } catch (fallbackError) {
      const quotes = mockQuotes(requestedTickers).map((quote, index) => mockToMarketQuote(requestedTickers[index], quote));
      return {
        source: "mock" as const,
        reason: fallbackError instanceof Error ? fallbackError.message : "Market data unavailable",
        quotes,
        marketStatus: quotes.some((quote) => quote.marketStatus === "OPEN") ? "OPEN" : "CLOSED",
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now(),
      };
    }
  }
}
