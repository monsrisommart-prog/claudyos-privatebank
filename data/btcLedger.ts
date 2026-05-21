export type BtcDcaEntry = {
  id: string;
  purchaseDate: string;
  asset: "BTC";
  investedTHB: number;
  investedUSD: number;
  avgCostUSD: number;
  entryPriceTHB: number;
  btcQuantity: number;
  currentPriceTHB: number;
  currentPriceUSD: number;
  marketValueTHB: number;
  marketValueUSD: number;
  unrealizedPnlPct: number;
};

export const btcTotals = {
  totalInvestedTHB: 265823.43,
  totalInvestedUSD: 8327.71,
  averageBtcCostUSD: 92481.03,
  averageEntryPriceTHB: 2952025.85,
  totalBtcHoldings: 0.0900478,
  currentBtcPriceTHB: 2512967.83,
  currentBtcPriceUSD: 77204.5,
  totalMarketValueTHB: 226784.01,
  totalMarketValueUSD: 6967.36,
  totalUnrealizedPnlPct: -14.69,
};

export const btcLedger: BtcDcaEntry[] = [
  { id: "btc-2025-05-18", purchaseDate: "18/05/2025", asset: "BTC", investedTHB: 14962.49, investedUSD: 447.98, avgCostUSD: 104750, entryPriceTHB: 3469659, btcQuantity: 0.00431238, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10836.87, marketValueUSD: 332.94, unrealizedPnlPct: -27.6 },
  { id: "btc-2025-06-02", purchaseDate: "02/06/2025", asset: "BTC", investedTHB: 14962.48, investedUSD: 455.2, avgCostUSD: 105755, entryPriceTHB: 3437730.88, btcQuantity: 0.00435243, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10937.52, marketValueUSD: 336.03, unrealizedPnlPct: -26.9 },
  { id: "btc-2025-07-07", purchaseDate: "07/07/2025", asset: "BTC", investedTHB: 14962.49, investedUSD: 460.81, avgCostUSD: 117397, entryPriceTHB: 3798000, btcQuantity: 0.00393957, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 9900.01, marketValueUSD: 304.15, unrealizedPnlPct: -33.8 },
  { id: "btc-2025-08-03", purchaseDate: "03/08/2025", asset: "BTC", investedTHB: 14851.17, investedUSD: 456.68, avgCostUSD: 113500, entryPriceTHB: 3710000, btcQuantity: 0.00400301, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10059.44, marketValueUSD: 309.05, unrealizedPnlPct: -32.3 },
  { id: "btc-2025-08-20", purchaseDate: "20/08/2025", asset: "BTC", investedTHB: 3253, investedUSD: 99.89, avgCostUSD: 113511.04, entryPriceTHB: 3694727.6, btcQuantity: 0.00085857, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 2157.56, marketValueUSD: 66.29, unrealizedPnlPct: -33.7 },
  { id: "btc-2025-08-27", purchaseDate: "27/08/2025", asset: "BTC", investedTHB: 9543.67, investedUSD: 293.2, avgCostUSD: 111062.41, entryPriceTHB: 3615025.91, btcQuantity: 0.00264, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 6634.24, marketValueUSD: 203.82, unrealizedPnlPct: -30.5 },
  { id: "btc-2025-09-11", purchaseDate: "11/09/2025", asset: "BTC", investedTHB: 15000, investedUSD: 473.34, avgCostUSD: 114559.18, entryPriceTHB: 3632671.7, btcQuantity: 0.0041306, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10380.06, marketValueUSD: 318.9, unrealizedPnlPct: -30.8 },
  { id: "btc-2025-09-23", purchaseDate: "23/09/2025", asset: "BTC", investedTHB: 15000, investedUSD: 473.34, avgCostUSD: 113442.18, entryPriceTHB: 3611999, btcQuantity: 0.00414247, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10409.89, marketValueUSD: 319.82, unrealizedPnlPct: -30.6 },
  { id: "btc-2025-10-14", purchaseDate: "14/10/2025", asset: "BTC", investedTHB: 15000, investedUSD: 473.34, avgCostUSD: 115106.6, entryPriceTHB: 3664994.24, btcQuantity: 0.00410839, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10324.25, marketValueUSD: 317.19, unrealizedPnlPct: -31.2 },
  { id: "btc-2025-11-02", purchaseDate: "02/11/2025", asset: "BTC", investedTHB: 15124.21, investedUSD: 477.25, avgCostUSD: 112285.8, entryPriceTHB: 3575179.74, btcQuantity: 0.00421975, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 10604.1, marketValueUSD: 325.78, unrealizedPnlPct: -29.9 },
  { id: "btc-2025-11-18", purchaseDate: "18/11/2025", asset: "BTC", investedTHB: 7559.94, investedUSD: 238.56, avgCostUSD: 94221.11, entryPriceTHB: 3000000, btcQuantity: 0.00251368, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 6316.8, marketValueUSD: 194.07, unrealizedPnlPct: -16.4 },
  { id: "btc-2025-12-01", purchaseDate: "01/12/2025", asset: "BTC", investedTHB: 20603.99, investedUSD: 650.17, avgCostUSD: 86643.23, entryPriceTHB: 2776049.33, btcQuantity: 0.00740349, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 18604.73, marketValueUSD: 571.58, unrealizedPnlPct: -9.7 },
  { id: "btc-2026-01-14", purchaseDate: "14/01/2026", asset: "BTC", investedTHB: 15000, investedUSD: 473.34, avgCostUSD: 96463.15, entryPriceTHB: 3032999.95, btcQuantity: 0.00493323, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 12397.05, marketValueUSD: 380.87, unrealizedPnlPct: -17.4 },
  { id: "btc-2026-02-02", purchaseDate: "02/02/2026", asset: "BTC", investedTHB: 20000, investedUSD: 631.11, avgCostUSD: 79412.26, entryPriceTHB: 2493544.99, btcQuantity: 0.00800065, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 20105.38, marketValueUSD: 617.69, unrealizedPnlPct: 0.5 },
  { id: "btc-2026-02-05", purchaseDate: "05/02/2026", asset: "BTC", investedTHB: 10000, investedUSD: 314.66, avgCostUSD: 69599.33, entryPriceTHB: 2202122.71, btcQuantity: 0.00452972, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 11383.04, marketValueUSD: 349.71, unrealizedPnlPct: 13.8 },
  { id: "btc-2026-02-25", purchaseDate: "25/02/2026", asset: "BTC", investedTHB: 10000, investedUSD: 321.54, avgCostUSD: 64952.25, entryPriceTHB: 2020015, btcQuantity: 0.00493808, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 12409.24, marketValueUSD: 381.24, unrealizedPnlPct: 24.1 },
  { id: "btc-2026-03-02", purchaseDate: "02/03/2026", asset: "BTC", investedTHB: 10000, investedUSD: 317.46, avgCostUSD: 68898.3, entryPriceTHB: 2142737, btcQuantity: 0.00465526, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 11698.52, marketValueUSD: 359.41, unrealizedPnlPct: 17 },
  { id: "btc-2026-04-01", purchaseDate: "01/04/2026", asset: "BTC", investedTHB: 20000, investedUSD: 634.92, avgCostUSD: 69171.17, entryPriceTHB: 2249446.56, btcQuantity: 0.00889112, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 22343.1, marketValueUSD: 686.43, unrealizedPnlPct: 11.7 },
  { id: "btc-2026-05-04", purchaseDate: "04/05/2026", asset: "BTC", investedTHB: 20000, investedUSD: 634.92, avgCostUSD: 80222.86, entryPriceTHB: 2603231.88, btcQuantity: 0.00767309, currentPriceTHB: 2512967.83, currentPriceUSD: 77204.5, marketValueTHB: 19282.23, marketValueUSD: 592.4, unrealizedPnlPct: -3.6 },
];
