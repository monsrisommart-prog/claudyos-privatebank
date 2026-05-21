const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

export type FmpQuote = {
  symbol: string;
  name?: string;
  price?: number;
  changesPercentage?: number;
  change?: number;
  dayLow?: number;
  dayHigh?: number;
  yearHigh?: number;
  yearLow?: number;
  marketCap?: number;
  volume?: number;
  avgVolume?: number;
  exchange?: string;
  open?: number;
  previousClose?: number;
  timestamp?: number;
};

export type FmpStatement = Record<string, string | number | null>;

function getApiKey() {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    throw new Error("Missing FMP_API_KEY");
  }
  return key;
}

export async function cachedJson<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const current = cache.get(key) as CacheEntry<T> | undefined;
  if (current && current.expiresAt > Date.now()) return current.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function fmpGet<T>(path: string, ttlMs = 10_000): Promise<T> {
  const apiKey = getApiKey();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${FMP_BASE_URL}${path}${separator}apikey=${apiKey}`;
  return cachedJson(url, ttlMs, async () => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`FMP request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  });
}

export function mockQuotes(symbols: string[]): FmpQuote[] {
  const base: Record<string, FmpQuote> = {
    AAPL: {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 297.31,
      changesPercentage: 0.74,
      change: 2.18,
      marketCap: 4412000000000,
      volume: 10335357,
      exchange: "NASDAQ",
      previousClose: 295.13,
      timestamp: Math.floor(Date.now() / 1000),
    },
    MSFT: {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      price: 513.42,
      changesPercentage: 0.42,
      change: 2.16,
      marketCap: 3817000000000,
      volume: 8421100,
      exchange: "NASDAQ",
      previousClose: 511.26,
      timestamp: Math.floor(Date.now() / 1000),
    },
    V: {
      symbol: "V",
      name: "Visa Inc.",
      price: 351.24,
      changesPercentage: 0.18,
      change: 0.63,
      marketCap: 690000000000,
      volume: 5100000,
      exchange: "NYSE",
      previousClose: 350.61,
      timestamp: Math.floor(Date.now() / 1000),
    },
    LLY: {
      symbol: "LLY",
      name: "Eli Lilly and Company",
      price: 820.15,
      changesPercentage: -0.32,
      change: -2.63,
      marketCap: 780000000000,
      volume: 2900000,
      exchange: "NYSE",
      previousClose: 822.78,
      timestamp: Math.floor(Date.now() / 1000),
    },
    ORCL: {
      symbol: "ORCL",
      name: "Oracle Corporation",
      price: 154.72,
      changesPercentage: 0.56,
      change: 0.86,
      marketCap: 430000000000,
      volume: 9100000,
      exchange: "NYSE",
      previousClose: 153.86,
      timestamp: Math.floor(Date.now() / 1000),
    },
    NFLX: {
      symbol: "NFLX",
      name: "Netflix Inc.",
      price: 925.44,
      changesPercentage: 0.41,
      change: 3.79,
      marketCap: 395000000000,
      volume: 3200000,
      exchange: "NASDAQ",
      previousClose: 921.65,
      timestamp: Math.floor(Date.now() / 1000),
    },
    ARM: {
      symbol: "ARM",
      name: "Arm Holdings plc",
      price: 255.24,
      changesPercentage: 1.12,
      change: 2.83,
      marketCap: 138000000000,
      volume: 7800000,
      exchange: "NASDAQ",
      previousClose: 252.41,
      timestamp: Math.floor(Date.now() / 1000),
    },
    META: {
      symbol: "META",
      name: "Meta Platforms Inc.",
      price: 618.72,
      changesPercentage: 0.64,
      change: 3.94,
      marketCap: 1560000000000,
      volume: 11200000,
      exchange: "NASDAQ",
      previousClose: 614.78,
      timestamp: Math.floor(Date.now() / 1000),
    },
    NVO: {
      symbol: "NVO",
      name: "Novo Nordisk A/S",
      price: 44.76,
      changesPercentage: -0.14,
      change: -0.06,
      marketCap: 380000000000,
      volume: 4200000,
      exchange: "NYSE",
      previousClose: 44.82,
      timestamp: Math.floor(Date.now() / 1000),
    },
    CLPT: {
      symbol: "CLPT",
      name: "ClearPoint Neuro Inc.",
      price: 11.07,
      changesPercentage: -1.16,
      change: -0.13,
      marketCap: 310000000,
      volume: 240000,
      exchange: "NASDAQ",
      previousClose: 11.2,
      timestamp: Math.floor(Date.now() / 1000),
    },
    JEPQ: {
      symbol: "JEPQ",
      name: "JPMorgan Nasdaq Equity Premium Income ETF",
      price: 56.12,
      changesPercentage: 0.22,
      change: 0.12,
      marketCap: 0,
      volume: 4100000,
      exchange: "NASDAQ",
      previousClose: 56,
      timestamp: Math.floor(Date.now() / 1000),
    },
    GOOGL: {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 174.82,
      changesPercentage: 0.38,
      change: 0.66,
      marketCap: 2140000000000,
      volume: 22340000,
      exchange: "NASDAQ",
      previousClose: 174.16,
      timestamp: Math.floor(Date.now() / 1000),
    },
    NVDA: {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: 141.36,
      changesPercentage: 1.26,
      change: 1.76,
      marketCap: 3460000000000,
      volume: 172000000,
      exchange: "NASDAQ",
      previousClose: 139.6,
      timestamp: Math.floor(Date.now() / 1000),
    },
    GLD: {
      symbol: "GLD",
      name: "SPDR Gold Shares",
      price: 242.18,
      changesPercentage: -0.21,
      change: -0.51,
      marketCap: 0,
      volume: 8220000,
      exchange: "NYSEARCA",
      previousClose: 242.69,
      timestamp: Math.floor(Date.now() / 1000),
    },
    BTCUSD: {
      symbol: "BTCUSD",
      name: "Bitcoin USD",
      price: 77204.5,
      changesPercentage: -14.69,
      change: -13276.53,
      volume: 21200000000,
      exchange: "CRYPTO",
      previousClose: 90481.03,
      timestamp: Math.floor(Date.now() / 1000),
    },
    BTC: {
      symbol: "BTC",
      name: "Bitcoin",
      price: 77204.5,
      changesPercentage: -14.69,
      change: -13276.53,
      volume: 21200000000,
      exchange: "CRYPTO",
      previousClose: 90481.03,
      timestamp: Math.floor(Date.now() / 1000),
    },
    "BTC-USD": {
      symbol: "BTC-USD",
      name: "Bitcoin USD",
      price: 77204.5,
      changesPercentage: -14.69,
      change: -13276.53,
      volume: 21200000000,
      exchange: "CRYPTO",
      previousClose: 90481.03,
      timestamp: Math.floor(Date.now() / 1000),
    },
  };

  return symbols.map((symbol) => {
    const normalized = symbol.toUpperCase();
    return (
      base[normalized] || {
        symbol: normalized,
        name: normalized,
        price: 100,
        changesPercentage: 0,
        change: 0,
        exchange: "MANUAL",
        previousClose: 100,
        timestamp: Math.floor(Date.now() / 1000),
      }
    );
  });
}

export function mockStatements() {
  return {
    income: [
      { calendarYear: "2025", revenue: 391035000000, netIncome: 93736000000, eps: 6.08 },
      { calendarYear: "2024", revenue: 383285000000, netIncome: 96995000000, eps: 6.13 },
      { calendarYear: "2023", revenue: 394328000000, netIncome: 99803000000, eps: 6.11 },
    ],
    balance: [
      { calendarYear: "2025", totalAssets: 364980000000, totalDebt: 106629000000, cashAndCashEquivalents: 29943000000 },
      { calendarYear: "2024", totalAssets: 352583000000, totalDebt: 111088000000, cashAndCashEquivalents: 29965000000 },
      { calendarYear: "2023", totalAssets: 352755000000, totalDebt: 111110000000, cashAndCashEquivalents: 29965000000 },
    ],
    cashflow: [
      { calendarYear: "2025", operatingCashFlow: 118254000000, freeCashFlow: 104330000000, capitalExpenditure: -13924000000 },
      { calendarYear: "2024", operatingCashFlow: 110543000000, freeCashFlow: 99584000000, capitalExpenditure: -10959000000 },
      { calendarYear: "2023", operatingCashFlow: 122151000000, freeCashFlow: 111443000000, capitalExpenditure: -10708000000 },
    ],
  };
}

export function mockDcf(symbol: string) {
  return {
    symbol,
    dcf: 318.4,
    price: 297.31,
    upside: 7.09,
    rating: "Moderate Upside",
  };
}
