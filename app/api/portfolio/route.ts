import { NextRequest, NextResponse } from "next/server";
import { addTransaction, defaultPortfolioData, readPortfolioData, writePortfolioData } from "@/lib/db";
import { portfolioConfig } from "@/data/portfolio";
import { calculatePortfolio, type MarketQuote, type PortfolioTransaction } from "@/lib/portfolio";
import { getLiveMarketQuotes, normalizeMarketTicker } from "@/lib/market";

export const runtime = "nodejs";

function quoteSymbols(dataSymbols: string[], watchlist: string[]) {
  return Array.from(new Set([...dataSymbols, ...watchlist].filter((symbol) => symbol !== "CASH")));
}

async function loadQuotes(symbols: string[]): Promise<{
  quotes: MarketQuote[];
  source: "yahoo" | "fmp" | "mock";
  lastUpdated: string;
  marketStatus: string;
}> {
  if (!symbols.length) return { quotes: [], source: "mock", lastUpdated: new Date().toISOString(), marketStatus: "CLOSED" };
  const configMap = new Map(portfolioConfig.holdings.map((holding) => [normalizeMarketTicker(holding.ticker), holding]));
  const market = await getLiveMarketQuotes(symbols);
  return {
    source: market.source,
    lastUpdated: market.lastUpdated,
    marketStatus: market.marketStatus,
    quotes: market.quotes.map((quote) => {
      const configHolding = configMap.get(quote.ticker);
      return {
        symbol: quote.ticker,
        price: quote.price,
        currency: configHolding?.currency ?? "USD",
        source: quote.source,
        changePct: quote.changePercent,
        lastUpdated: quote.lastUpdated,
      };
    }),
  };
}

export async function GET() {
  const data = await readPortfolioData();
  const symbols = quoteSymbols(
    data.transactions.map((transaction) => transaction.symbol),
    data.watchlist
  );
  const market = await loadQuotes(symbols);
  const snapshot = calculatePortfolio(data, [
    ...market.quotes,
    { symbol: "CASH", price: 1, currency: "THB", source: "manual" },
  ]);

  return NextResponse.json({
    data,
    config: {
      holdings: portfolioConfig.holdings,
    },
    snapshot,
    market,
    warning: market.source === "mock" ? "Using fallback data" : null,
    timestamp: Date.now(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = String(body.action || "");

  if (action === "add-transaction") {
    const transaction = body.transaction as Omit<PortfolioTransaction, "id">;
    const created = await addTransaction(transaction);
    return NextResponse.json({ ok: true, transaction: created });
  }

  if (action === "delete-transaction") {
    const data = await readPortfolioData();
    data.transactions = data.transactions.filter((transaction) => transaction.id !== body.id);
    await writePortfolioData(data);
    return NextResponse.json({ ok: true });
  }

  if (action === "update-watchlist") {
    const data = await readPortfolioData();
    data.watchlist = String(body.watchlist || "")
      .split(/[,\s]+/)
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);
    await writePortfolioData(data);
    return NextResponse.json({ ok: true, watchlist: data.watchlist });
  }

  if (action === "update-cashflow") {
    const data = await readPortfolioData();
    data.cashflow = {
      monthlyIncome: Number(body.cashflow?.monthlyIncome || 0),
      monthlyExpense: Number(body.cashflow?.monthlyExpense || 0),
      cashReserveTarget: Number(body.cashflow?.cashReserveTarget || 6),
    };
    await writePortfolioData(data);
    return NextResponse.json({ ok: true, cashflow: data.cashflow });
  }

  if (action === "import-json") {
    const nextData = body.data;
    if (!nextData || !Array.isArray(nextData.transactions) || !Array.isArray(nextData.watchlist)) {
      return NextResponse.json({ ok: false, error: "Invalid portfolio JSON" }, { status: 400 });
    }
    await writePortfolioData(nextData);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    await writePortfolioData(defaultPortfolioData);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
