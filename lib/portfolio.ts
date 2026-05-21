export type TransactionType = "BUY" | "SELL" | "DIVIDEND" | "DEPOSIT" | "WITHDRAW" | "FEE";

export type AssetClass = "Equity" | "Crypto" | "Cash" | "Gold" | "Fund" | "Bond" | "Alternative";

export type PortfolioTransaction = {
  id: string;
  date: string;
  type: TransactionType;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  units: number;
  price: number;
  fee: number;
  currency: "THB" | "USD";
  purchaseDate?: string;
  investedTHB?: number;
  investedUSD?: number;
  currentMarketPrice?: number;
  currentMarketValueTHB?: number;
  currentMarketValueUSD?: number;
  unrealizedPnlPctSnapshot?: number;
  accountName?: string;
  notes?: string;
};

export type CashflowProfile = {
  monthlyIncome: number;
  monthlyExpense: number;
  cashReserveTarget: number;
};

export type PrivateBankData = {
  clientName: string;
  baseCurrency: "THB";
  fx: {
    USDTHB: number;
  };
  totals?: {
    totalInvestedTHB: number;
    totalInvestedUSD: number;
    totalMarketValueTHB: number;
    totalMarketValueUSD: number;
    totalUnrealizedPnlPct: number;
  };
  watchlist: string[];
  cashflow: CashflowProfile;
  transactions: PortfolioTransaction[];
};

export type MarketQuote = {
  symbol: string;
  price: number;
  currency: "THB" | "USD";
  source: "yahoo" | "fmp" | "mock" | "manual";
  changePct?: number;
  lastUpdated?: string;
};

export type Holding = {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  purchaseDate?: string;
  accountName?: string;
  units: number;
  avgCost: number;
  avgCostUSD?: number;
  costBasis: number;
  investedUSD?: number;
  price: number;
  currentPriceUSD?: number;
  value: number;
  marketValueUSD?: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  unrealizedPnlPctSnapshot?: number;
  realizedPnl: number;
  dividends: number;
  weight: number;
  currency: "THB";
  source: MarketQuote["source"];
};

export type PortfolioSnapshot = {
  totalValue: number;
  totalCost: number;
  totalValueUSD?: number;
  totalCostUSD?: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl: number;
  dividendIncome: number;
  investableCashflow: number;
  cashReserveMonths: number;
  largestHolding?: Holding;
  holdings: Holding[];
  allocation: Array<{ name: string; value: number; amount: number }>;
  calculations: {
    totalPortfolioValue: number;
    allocationPct: Record<string, number>;
    unrealizedPnl: number;
    unrealizedPnlPct: number;
    drawdownEstimate: number;
    drawdownEstimatePct: number;
    btcExposure: number;
    equityExposure: number;
    cashReservePct: number;
    concentrationRisk: "Low" | "Medium" | "High";
    largestHoldingWeight: number;
  };
  risk: {
    level: "Low" | "Medium" | "High";
    concentration: string;
    liquidity: string;
    macro: string;
  };
};

function toTHB(value: number, currency: "THB" | "USD", usdthb: number) {
  return currency === "USD" ? value * usdthb : value;
}

export function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function calculatePortfolio(data: PrivateBankData, quotes: MarketQuote[] = []): PortfolioSnapshot {
  const quoteMap = new Map(quotes.map((quote) => [normalizeSymbol(quote.symbol), quote]));
  const lots = new Map<string, Holding>();

  let realizedPnl = 0;
  let dividendIncome = 0;

  for (const tx of data.transactions) {
    const symbol = normalizeSymbol(tx.symbol);
    const amount = toTHB(tx.units * tx.price, tx.currency, data.fx.USDTHB);
    const fee = toTHB(tx.fee || 0, tx.currency, data.fx.USDTHB);
    const existing =
      lots.get(symbol) ||
      ({
        symbol,
        name: tx.name || symbol,
        assetClass: tx.assetClass,
        purchaseDate: tx.purchaseDate || tx.date,
        accountName: tx.accountName,
        units: 0,
        avgCost: 0,
        avgCostUSD: tx.price,
        costBasis: 0,
        investedUSD: 0,
        price: 0,
        currentPriceUSD: tx.currentMarketPrice,
        value: 0,
        marketValueUSD: tx.currentMarketValueUSD,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        unrealizedPnlPctSnapshot: tx.unrealizedPnlPctSnapshot,
        realizedPnl: 0,
        dividends: 0,
        weight: 0,
        currency: "THB",
        source: "manual",
      } satisfies Holding);

    if (tx.type === "BUY" || tx.type === "DEPOSIT") {
      existing.units += tx.units;
      existing.costBasis += tx.investedTHB ?? amount + fee;
      existing.investedUSD = (existing.investedUSD || 0) + (tx.investedUSD ?? (tx.currency === "USD" ? tx.units * tx.price : 0));
      existing.avgCost = existing.units ? existing.costBasis / existing.units : 0;
      existing.avgCostUSD = tx.price || existing.avgCostUSD;
    }

    if (tx.type === "SELL" || tx.type === "WITHDRAW") {
      const soldUnits = Math.min(existing.units, tx.units);
      const costRemoved = existing.avgCost * soldUnits;
      realizedPnl += amount - costRemoved - fee;
      existing.realizedPnl += amount - costRemoved - fee;
      existing.units -= soldUnits;
      existing.costBasis = Math.max(0, existing.costBasis - costRemoved);
      existing.avgCost = existing.units ? existing.costBasis / existing.units : 0;
    }

    if (tx.type === "DIVIDEND") {
      dividendIncome += amount;
      existing.dividends += amount;
    }

    if (tx.type === "FEE") {
      realizedPnl -= amount + fee;
      existing.realizedPnl -= amount + fee;
    }

    existing.name = tx.name || existing.name;
    existing.assetClass = tx.assetClass;
    existing.purchaseDate = tx.purchaseDate || existing.purchaseDate;
    existing.accountName = tx.accountName || existing.accountName;
    existing.currentPriceUSD = tx.currentMarketPrice ?? existing.currentPriceUSD;
    existing.marketValueUSD = tx.currentMarketValueUSD ?? existing.marketValueUSD;
    existing.unrealizedPnlPctSnapshot = tx.unrealizedPnlPctSnapshot ?? existing.unrealizedPnlPctSnapshot;
    lots.set(symbol, existing);
  }

  const holdings = Array.from(lots.values())
    .filter((holding) => holding.units > 0.00000001)
    .map((holding) => {
      const quote = quoteMap.get(holding.symbol);
      const brokerValueTHB = data.transactions.find((tx) => normalizeSymbol(tx.symbol) === holding.symbol)?.currentMarketValueTHB;
      const brokerPriceUSD = data.transactions.find((tx) => normalizeSymbol(tx.symbol) === holding.symbol)?.currentMarketPrice;
      const price = brokerValueTHB
        ? brokerValueTHB / holding.units
        : quote
          ? toTHB(quote.price, quote.currency, data.fx.USDTHB)
          : holding.avgCost;
      const value = brokerValueTHB ?? holding.units * price;
      const unrealizedPnl = value - holding.costBasis;
      return {
        ...holding,
        price,
        currentPriceUSD: brokerPriceUSD ?? (quote?.currency === "USD" ? quote.price : holding.currentPriceUSD),
        value,
        unrealizedPnl,
        unrealizedPnlPct: holding.unrealizedPnlPctSnapshot ?? (holding.costBasis ? (unrealizedPnl / holding.costBasis) * 100 : 0),
        source: brokerValueTHB ? "manual" : quote?.source || "manual",
      };
    });

  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const totalValueUSD = holdings.reduce((sum, holding) => sum + (holding.marketValueUSD || 0), 0);
  const totalCostUSD = holdings.reduce((sum, holding) => sum + (holding.investedUSD || 0), 0);
  const unrealizedPnlPct =
    data.totals?.totalUnrealizedPnlPct ??
    (totalCostUSD && totalValueUSD ? ((totalValueUSD - totalCostUSD) / totalCostUSD) * 100 : totalCost ? ((totalValue - totalCost) / totalCost) * 100 : 0);
  const weightedHoldings = holdings.map((holding) => ({
    ...holding,
    weight: totalValue ? (holding.value / totalValue) * 100 : 0,
  }));
  const largestHolding = weightedHoldings.slice().sort((a, b) => b.value - a.value)[0];
  const allocationMap = weightedHoldings.reduce<Record<string, number>>((groups, holding) => {
    groups[holding.assetClass] = (groups[holding.assetClass] || 0) + holding.value;
    return groups;
  }, {});
  const allocation = Object.entries(allocationMap).map(([name, amount]) => ({
    name,
    amount,
    value: totalValue ? (amount / totalValue) * 100 : 0,
  }));
  const cashHolding = weightedHoldings.find((holding) => holding.assetClass === "Cash");
  const cashValue = weightedHoldings
    .filter((holding) => holding.assetClass === "Cash")
    .reduce((sum, holding) => sum + holding.value, 0);
  const equityValue = weightedHoldings
    .filter((holding) => holding.assetClass === "Equity")
    .reduce((sum, holding) => sum + holding.value, 0);
  const btcValue = weightedHoldings
    .filter((holding) => holding.assetClass === "Crypto" || holding.symbol.includes("BTC"))
    .reduce((sum, holding) => sum + holding.value, 0);
  const cashReserveMonths = data.cashflow.monthlyExpense ? (cashHolding?.value || 0) / data.cashflow.monthlyExpense : 0;
  const largestWeight = largestHolding?.weight || 0;
  const riskLevel = largestWeight > 45 || cashReserveMonths < 3 ? "High" : largestWeight > 30 ? "Medium" : "Low";
  const allocationPct = allocation.reduce<Record<string, number>>((groups, item) => {
    groups[item.name] = item.value;
    return groups;
  }, {});
  const stressShocks: Partial<Record<AssetClass, number>> = {
    Equity: -0.25,
    Crypto: -0.45,
    Cash: 0,
    Gold: 0.05,
    Fund: -0.18,
    Bond: 0.03,
    Alternative: -0.12,
  };
  const drawdownEstimate = weightedHoldings.reduce((sum, holding) => {
    const shock = stressShocks[holding.assetClass] ?? -0.1;
    return sum + holding.value * shock;
  }, 0);
  const concentrationRisk = largestWeight > 45 ? "High" : largestWeight > 30 ? "Medium" : "Low";

  return {
    totalValue,
    totalCost,
    totalValueUSD,
    totalCostUSD,
    unrealizedPnl: totalValue - totalCost,
    unrealizedPnlPct,
    realizedPnl,
    dividendIncome,
    investableCashflow: Math.max(0, data.cashflow.monthlyIncome - data.cashflow.monthlyExpense),
    cashReserveMonths,
    largestHolding,
    holdings: weightedHoldings,
    allocation,
    calculations: {
      totalPortfolioValue: totalValue,
      allocationPct,
      unrealizedPnl: totalValue - totalCost,
      unrealizedPnlPct,
      drawdownEstimate,
      drawdownEstimatePct: totalValue ? (drawdownEstimate / totalValue) * 100 : 0,
      btcExposure: totalValue ? (btcValue / totalValue) * 100 : 0,
      equityExposure: totalValue ? (equityValue / totalValue) * 100 : 0,
      cashReservePct: totalValue ? (cashValue / totalValue) * 100 : 0,
      concentrationRisk,
      largestHoldingWeight: largestWeight,
    },
    risk: {
      level: riskLevel,
      concentration: largestWeight > 35 ? "Watch concentration" : "Normal",
      liquidity: cashReserveMonths < 6 ? "Build reserve" : "Adequate",
      macro: "Risk-On, but keep duration and BTC sizing controlled",
    },
  };
}
