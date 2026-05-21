import { promises as fs } from "fs";
import path from "path";
import { portfolioConfig } from "@/data/portfolio";
import type { PrivateBankData, PortfolioTransaction } from "@/lib/portfolio";

const dataDir = path.join(process.cwd(), "data");
const dataPath = path.join(dataDir, "privatebank.json");

export const defaultPortfolioData: PrivateBankData = {
  clientName: portfolioConfig.clientName,
  baseCurrency: portfolioConfig.baseCurrency,
  fx: portfolioConfig.fx,
  totals: portfolioConfig.totals,
  watchlist: portfolioConfig.holdings
    .map((holding) => holding.ticker)
    .filter((ticker) => ticker !== "CASH" && ticker !== "GOLD"),
  cashflow: portfolioConfig.cashflow,
  transactions: portfolioConfig.holdings.map((holding, index) => ({
    id: `config-${holding.ticker.toLowerCase()}-${index + 1}`,
    date: "2026-01-01",
    type: (holding.assetClass as string) === "Cash" ? "DEPOSIT" : "BUY",
    symbol: holding.ticker,
    name: holding.name,
    assetClass: holding.assetClass,
    units: holding.quantity,
    price: holding.averageCost,
    fee: 0,
    currency: holding.currency,
    purchaseDate: holding.purchaseDate,
    investedTHB: holding.investedTHB,
    investedUSD: holding.investedUSD,
    currentMarketPrice: holding.currentPrice,
    currentMarketValueTHB: holding.currentMarketValueTHB,
    currentMarketValueUSD: holding.currentMarketValueUSD,
    unrealizedPnlPctSnapshot: holding.unrealizedPnlPct,
    accountName: holding.accountName,
    notes: `Seeded from real DIME portfolio. Target weight ${holding.weight}%. Risk ${holding.riskLevel}.`,
  })),
};

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify(defaultPortfolioData, null, 2));
  }
}

export async function readPortfolioData(): Promise<PrivateBankData> {
  await ensureDataFile();
  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw) as PrivateBankData;
}

export async function writePortfolioData(data: PrivateBankData) {
  await ensureDataFile();
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
  return data;
}

export async function addTransaction(transaction: Omit<PortfolioTransaction, "id">) {
  const data = await readPortfolioData();
  const next: PortfolioTransaction = {
    ...transaction,
    id: `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    symbol: transaction.symbol.toUpperCase(),
  };
  data.transactions = [next, ...data.transactions];
  data.totals = undefined;
  await writePortfolioData(data);
  return next;
}
