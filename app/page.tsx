"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Banknote,
  Bitcoin,
  BrainCircuit,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Download,
  FlaskConical,
  Gauge,
  Globe2,
  Home,
  Plus,
  Save,
  Upload,
  LineChart,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { btcLedger, btcTotals, type BtcDcaEntry } from "@/data/btcLedger";
import { cn } from "@/lib/utils";
import type { CashflowProfile, Holding, PortfolioSnapshot, PortfolioTransaction } from "@/lib/portfolio";

type PortfolioResponse = {
  data: {
    clientName: string;
    watchlist: string[];
    cashflow: CashflowProfile;
    transactions: PortfolioTransaction[];
  };
  snapshot: PortfolioSnapshot;
  market: {
    source: "yahoo" | "fmp" | "mock";
    lastUpdated?: string;
    marketStatus?: string;
  };
  warning?: string | null;
  timestamp: number;
};

type MacroResponse = {
  source: "mock" | "api";
  signals: Array<{
    key: string;
    label: string;
    value: number | string;
    unit?: string;
    trend: "up" | "down" | "flat";
    source: "mock" | "api";
  }>;
  regime: {
    score: number;
    regime: "Risk-On" | "Neutral" | "Risk-Off";
    interpretation: string;
  };
  timestamp: number;
  note: string;
};

type MacroInputs = {
  rates: "Rising" | "Stable" | "Falling";
  dollar: "Strong" | "Neutral" | "Weak";
  yields: "Rising" | "Stable" | "Falling";
  credit: "Tight" | "Normal" | "Stress";
  liquidity: "Expanding" | "Neutral" | "Contracting";
};

type TransactionDraft = {
  date: string;
  type: PortfolioTransaction["type"];
  symbol: string;
  name: string;
  assetClass: PortfolioTransaction["assetClass"];
  units: string;
  price: string;
  fee: string;
  currency: PortfolioTransaction["currency"];
  accountName: string;
  notes: string;
};

const formatTHB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const formatNumber = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 8,
});

const formatUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const allocationColors = ["#38bdf8", "#22c55e", "#f59e0b", "#a78bfa", "#94a3b8", "#ef4444", "#14b8a6"];

const navItems = [
  "Portfolio Overview",
  "Asset Allocation",
  "Risk Dashboard",
  "Macro Monitor",
  "AI Committee",
  "Watchlist",
  "Factor Regime",
  "Scenario Engine",
  "Earnings Calendar",
  "CIO Notes",
];

const earningsCalendar = [
  { symbol: "MSFT", company: "Microsoft", date: "Next quarter", time: "After close", priority: "Quality compounder" },
  { symbol: "LLY", company: "Eli Lilly", date: "Next quarter", time: "Pre-market", priority: "Healthcare growth" },
  { symbol: "META", company: "Meta Platforms", date: "Next quarter", time: "After close", priority: "AI monetization" },
  { symbol: "ARM", company: "Arm Holdings", date: "Next quarter", time: "After close", priority: "AI semiconductor beta" },
];

const defaultMacro: MacroInputs = {
  rates: "Stable",
  dollar: "Neutral",
  yields: "Stable",
  credit: "Normal",
  liquidity: "Neutral",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const defaultTransactionDraft: TransactionDraft = {
  date: todayISO(),
  type: "BUY",
  symbol: "",
  name: "",
  assetClass: "Equity",
  units: "",
  price: "",
  fee: "0",
  currency: "USD",
  accountName: "DIME",
  notes: "",
};

type CioDecision = "Hold" | "Accumulate" | "Reduce" | "Hedge" | "Avoid";
type ConfidenceLevel = "Low" | "Medium" | "High";

type BtcDcaPerformancePoint = {
  date: string;
  btcPriceUSD: number;
  dollarsInvested: number;
  cumulativeInvestedUSD: number;
  btcAcquired: number;
  cumulativeBtc: number;
  portfolioValueUSD: number;
  unrealizedPnlPct: number;
};

type MobileTab = "Dashboard" | "Portfolio" | "BTC" | "Risk" | "CIO";

function marketStatus() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const weekday = day >= 1 && day <= 5;
  return weekday && (hour >= 20 || hour < 4) ? "OPEN" : "CLOSED";
}

function detectMacroRegime(inputs: MacroInputs) {
  let score = 0;
  if (inputs.rates === "Falling") score += 1;
  if (inputs.rates === "Rising") score -= 1;
  if (inputs.dollar === "Weak") score += 1;
  if (inputs.dollar === "Strong") score -= 1;
  if (inputs.yields === "Falling") score += 1;
  if (inputs.yields === "Rising") score -= 1;
  if (inputs.credit === "Stress") score -= 2;
  if (inputs.credit === "Tight") score -= 1;
  if (inputs.liquidity === "Expanding") score += 2;
  if (inputs.liquidity === "Contracting") score -= 2;

  const regime = score >= 2 ? "Risk-On" : score <= -2 ? "Risk-Off" : "Neutral";
  const instruction =
    regime === "Risk-On"
      ? "สินทรัพย์เสี่ยงยังได้รับแรงสนับสนุน แต่ต้องคุมขนาดการลงทุนเป็นหลัก"
      : regime === "Risk-Off"
        ? "เพิ่มสภาพคล่อง ลด beta และหลีกเลี่ยงสถานการณ์ที่ต้องขายแบบถูกบังคับ"
        : "ควรรอให้สภาพคล่องหรือผลประกอบการยืนยันทิศทางก่อนเพิ่มความเสี่ยง";

  return { score, regime, instruction };
}

function btcCycleModel(price: number, costBasis: number) {
  const premium = costBasis ? ((price - costBasis) / costBasis) * 100 : 0;
  const phase =
    premium > 80
      ? "Late Cycle"
      : premium > 25
        ? "Expansion"
        : premium < -20
          ? "Capitulation"
          : "Base Building";
  const action =
    premium > 80
      ? "ลดความเข้มข้นของ DCA และปกป้องกำไร"
      : premium < -20
        ? "ทยอยสะสมได้เฉพาะเมื่อสภาพคล่องส่วนตัวแข็งแรง"
        : "รักษาวินัย DCA และหลีกเลี่ยง leverage";
  return { premium, phase, action };
}

const holdingProfiles: Record<
  string,
  {
    sector: string;
    style: "Growth" | "Defensive" | "Income";
    aiExposure: number;
    megaCapTech: boolean;
    defensive: boolean;
    stressBeta: number;
  }
> = {
  MSFT: { sector: "Software / Cloud", style: "Growth", aiExposure: 90, megaCapTech: true, defensive: false, stressBeta: 1.15 },
  V: { sector: "Payments", style: "Growth", aiExposure: 20, megaCapTech: false, defensive: false, stressBeta: 0.95 },
  LLY: { sector: "Healthcare", style: "Defensive", aiExposure: 10, megaCapTech: false, defensive: true, stressBeta: 0.75 },
  ORCL: { sector: "Software / Cloud", style: "Growth", aiExposure: 75, megaCapTech: true, defensive: false, stressBeta: 1.1 },
  NFLX: { sector: "Media", style: "Growth", aiExposure: 35, megaCapTech: true, defensive: false, stressBeta: 1.2 },
  ARM: { sector: "Semiconductors", style: "Growth", aiExposure: 95, megaCapTech: false, defensive: false, stressBeta: 1.45 },
  META: { sector: "Digital Advertising", style: "Growth", aiExposure: 85, megaCapTech: true, defensive: false, stressBeta: 1.25 },
  NVO: { sector: "Healthcare", style: "Defensive", aiExposure: 10, megaCapTech: false, defensive: true, stressBeta: 0.75 },
  CLPT: { sector: "Medical Technology", style: "Growth", aiExposure: 25, megaCapTech: false, defensive: false, stressBeta: 1.6 },
  JEPQ: { sector: "Covered Call Income", style: "Income", aiExposure: 55, megaCapTech: false, defensive: true, stressBeta: 0.8 },
  BTC: { sector: "Bitcoin", style: "Growth", aiExposure: 0, megaCapTech: false, defensive: false, stressBeta: 2.1 },
};

function parseLedgerDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(fullYear, month - 1, day);
}

function holdingDuration(purchaseDate: string) {
  const start = parseLedgerDate(purchaseDate);
  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
  return `${days}d`;
}

function btcCyclePhase(entry: BtcDcaEntry) {
  if (entry.unrealizedPnlPct > 15) return "Recovery";
  if (entry.unrealizedPnlPct > 0) return "Base Building";
  if (entry.unrealizedPnlPct > -20) return "Drawdown";
  return "Capitulation Zone";
}

function buildBtcAnalytics(totalPortfolioValue: number) {
  let cumulativeBtc = 0;
  let cumulativeInvested = 0;
  let cumulativeInvestedUSD = 0;
  const timeline = btcLedger.map((entry) => {
    cumulativeBtc += entry.btcQuantity;
    cumulativeInvested += entry.investedTHB;
    cumulativeInvestedUSD += entry.investedUSD;
    return {
      date: entry.purchaseDate,
      cumulativeBtc,
      cumulativeInvested,
      cumulativeInvestedUSD,
      cost: entry.avgCostUSD,
      market: entry.currentPriceUSD,
      pnl: entry.unrealizedPnlPct,
    };
  });
  cumulativeBtc = 0;
  cumulativeInvestedUSD = 0;
  const performance: BtcDcaPerformancePoint[] = btcLedger.map((entry) => {
    cumulativeBtc += entry.btcQuantity;
    cumulativeInvestedUSD += entry.investedUSD;
    const portfolioValueUSD = cumulativeBtc * entry.avgCostUSD;
    const unrealizedPnlPct = cumulativeInvestedUSD
      ? ((portfolioValueUSD - cumulativeInvestedUSD) / cumulativeInvestedUSD) * 100
      : 0;

    return {
      date: entry.purchaseDate,
      btcPriceUSD: entry.avgCostUSD,
      dollarsInvested: entry.investedUSD,
      cumulativeInvestedUSD,
      btcAcquired: entry.btcQuantity,
      cumulativeBtc,
      portfolioValueUSD,
      unrealizedPnlPct,
    };
  });
  const allocationImpact = totalPortfolioValue ? (btcTotals.totalMarketValueTHB / totalPortfolioValue) * 100 : 0;
  const profitableLots = btcLedger.filter((entry) => entry.unrealizedPnlPct > 0).length;
  const worstLot = btcLedger.slice().sort((a, b) => a.unrealizedPnlPct - b.unrealizedPnlPct)[0];
  const bestLot = btcLedger.slice().sort((a, b) => b.unrealizedPnlPct - a.unrealizedPnlPct)[0];
  const phase =
    btcTotals.currentBtcPriceUSD > btcTotals.averageBtcCostUSD
      ? "Expansion"
      : btcTotals.totalUnrealizedPnlPct > -10
        ? "Base Building"
        : btcTotals.totalUnrealizedPnlPct > -25
          ? "Drawdown Accumulation"
          : "Capitulation";

  return {
    timeline,
    performance,
    allocationImpact,
    profitableLots,
    worstLot,
    bestLot,
    phase,
    lots: btcLedger.map((entry) => ({
      ...entry,
      holdingDuration: holdingDuration(entry.purchaseDate),
      cyclePhase: btcCyclePhase(entry),
      allocationImpact: totalPortfolioValue ? (entry.marketValueTHB / totalPortfolioValue) * 100 : 0,
    })),
  };
}

function BtcDcaTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BtcDcaPerformancePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[260px] rounded-xl border border-emerald-400/25 bg-black/95 p-4 shadow-2xl shadow-emerald-950/30 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">DCA Lot</p>
        <p className="text-sm font-semibold text-white">{point.date}</p>
      </div>
      <div className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-4 text-slate-300">
          <span>BTC price</span>
          <span className="font-semibold text-emerald-300">{formatUSD.format(point.btcPriceUSD)}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>Dollars invested</span>
          <span className="font-semibold text-sky-200">{formatUSD.format(point.dollarsInvested)}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>BTC acquired</span>
          <span className="font-semibold text-white">{point.btcAcquired.toFixed(8)}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>Portfolio value</span>
          <span className="font-semibold text-orange-300">{formatUSD.format(point.portfolioValueUSD)}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>Unrealized P/L</span>
          <span className={cn("font-semibold", point.unrealizedPnlPct >= 0 ? "text-emerald-300" : "text-red-300")}>
            {point.unrealizedPnlPct >= 0 ? "+" : ""}
            {point.unrealizedPnlPct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function buildPortfolioIntelligence(holdings: Holding[]) {
  const total = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const weightOf = (predicate: (holding: Holding) => boolean) =>
    total ? holdings.filter(predicate).reduce((sum, holding) => sum + holding.value, 0) / total * 100 : 0;
  const aiExposure = total
    ? holdings.reduce((sum, holding) => {
        const profile = holdingProfiles[holding.symbol];
        return sum + holding.value * ((profile?.aiExposure || 0) / 100);
      }, 0) / total * 100
    : 0;
  const megaCapTech = weightOf((holding) => Boolean(holdingProfiles[holding.symbol]?.megaCapTech));
  const growth = weightOf((holding) => holdingProfiles[holding.symbol]?.style === "Growth");
  const defensive = weightOf((holding) => {
    const style = holdingProfiles[holding.symbol]?.style;
    return style === "Defensive" || style === "Income";
  });
  const income = weightOf((holding) => holdingProfiles[holding.symbol]?.style === "Income" || holding.assetClass === "Fund");
  const incomeValue = holdings
    .filter((holding) => holdingProfiles[holding.symbol]?.style === "Income" || holding.assetClass === "Fund")
    .reduce((sum, holding) => sum + holding.value, 0);
  const sectorMap = holdings.reduce<Record<string, number>>((groups, holding) => {
    const sector = holdingProfiles[holding.symbol]?.sector || holding.assetClass;
    groups[sector] = (groups[sector] || 0) + holding.weight;
    return groups;
  }, {});
  const heatmap = holdings
    .map((holding) => {
      const profile = holdingProfiles[holding.symbol];
      const riskScore = holding.weight * (profile?.stressBeta || 1);
      return {
        ...holding,
        sector: profile?.sector || holding.assetClass,
        style: profile?.style || "Growth",
        aiExposure: profile?.aiExposure || 0,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  return {
    aiExposure,
    megaCapTech,
    growth,
    defensive,
    income,
    incomeValue,
    growthDefensiveRatio: defensive ? growth / defensive : growth,
    sectorMap,
    sectorAllocation: Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    heatmap,
    concentrationFlag: holdings.some((holding) => holding.weight > 20) || megaCapTech > 45 || aiExposure > 50,
    megaCapTechFlag: megaCapTech > 45,
    aiFlag: aiExposure > 50,
  };
}

function buildCommittee(snapshot: PortfolioSnapshot | undefined, holdings: Holding[], macro: ReturnType<typeof detectMacroRegime>) {
  const cashMonths = snapshot?.cashReserveMonths || 0;
  const largest = snapshot?.largestHolding;
  const btc = holdings.find((holding) => holding.assetClass === "Crypto" || holding.symbol.includes("BTC"));
  const calculations = snapshot?.calculations;
  const intelligence = buildPortfolioIntelligence(holdings);
  const cryptoWeight =
    calculations?.btcExposure ?? holdings.filter((holding) => holding.assetClass === "Crypto").reduce((sum, holding) => sum + holding.weight, 0);
  const equityWeight =
    calculations?.equityExposure ?? holdings.filter((holding) => holding.assetClass === "Equity").reduce((sum, holding) => sum + holding.weight, 0);
  const cashReservePct =
    calculations?.cashReservePct ?? holdings.filter((holding) => holding.assetClass === "Cash").reduce((sum, holding) => sum + holding.weight, 0);
  const macroSensitiveWeight = equityWeight + cryptoWeight;
  const drawdownEstimate = calculations?.drawdownEstimatePct ?? 0;
  const largestWeight = calculations?.largestHoldingWeight ?? largest?.weight ?? 0;
  const concentrationRisk = calculations?.concentrationRisk ?? snapshot?.risk.level ?? "Medium";
  const liquidityRisk = cashMonths < 3 ? "High" : cashMonths < 6 ? "Medium" : "Low";
  const portfolioRisk = snapshot?.risk.level ?? concentrationRisk;
  const riskScore =
    (macro.regime === "Risk-Off" ? 3 : macro.regime === "Neutral" ? 1 : 0) +
    (portfolioRisk === "High" ? 3 : portfolioRisk === "Medium" ? 1 : 0) +
    (concentrationRisk === "High" ? 2 : concentrationRisk === "Medium" ? 1 : 0) +
    (liquidityRisk === "High" ? 3 : liquidityRisk === "Medium" ? 1 : 0) +
    (drawdownEstimate <= -35 ? 2 : drawdownEstimate <= -25 ? 1 : 0) +
    (cryptoWeight + equityWeight > 85 ? 1 : 0) +
    (intelligence.aiFlag ? 1 : 0) +
    (intelligence.megaCapTechFlag ? 1 : 0);

  let decision: CioDecision = "Hold";
  if (!snapshot || holdings.length === 0) {
    decision = "Hold";
  } else if (liquidityRisk === "High" && macro.regime === "Risk-Off") {
    decision = "Avoid";
  } else if (macro.regime === "Risk-Off" || drawdownEstimate <= -35) {
    decision = "Hedge";
  } else if (largestWeight > 45 || concentrationRisk === "High") {
    decision = "Reduce";
  } else if (macro.regime === "Risk-On" && liquidityRisk === "Low" && portfolioRisk !== "High" && riskScore <= 2) {
    decision = "Accumulate";
  }

  const confidence: ConfidenceLevel =
    !snapshot || holdings.length === 0 ? "Low" : riskScore >= 6 || macro.regime === "Neutral" ? "Medium" : "High";
  const topRisks = [
    liquidityRisk === "High"
      ? `เงินสดสำรองมีเพียง ${cashMonths.toFixed(1)} เดือน ต่ำกว่าเกณฑ์ความปลอดภัยของพอร์ตแบบ private banking`
      : `เงินสดสำรองอยู่ที่ ${cashMonths.toFixed(1)} เดือน หรือ ${cashReservePct.toFixed(1)}% ของพอร์ต`,
    intelligence.megaCapTechFlag
      ? `สัดส่วน mega-cap technology อยู่ที่ ${intelligence.megaCapTech.toFixed(1)}% ทำให้เกิดความเสี่ยงแบบ factor concentration`
      : `หุ้นที่มีน้ำหนักมากที่สุดยังควบคุมได้ที่ ${largestWeight.toFixed(1)}%`,
    cryptoWeight > 15
      ? `BTC/crypto exposure อยู่ที่ ${cryptoWeight.toFixed(1)}% และเพิ่ม sensitivity ต่อ liquidity cycle ของทั้งพอร์ต`
      : intelligence.aiFlag
      ? `AI-linked exposure อยู่ที่ ${intelligence.aiExposure.toFixed(1)}%; หาก narrative ของ AI ถูกปรับลด หลายสถานะอาจถูกกดดันพร้อมกัน`
      : `สัดส่วน growth ${intelligence.growth.toFixed(1)}% เทียบกับ defensive ${intelligence.defensive.toFixed(1)}% ยังสมดุล`,
  ];
  const actionItems = [
    decision === "Accumulate"
      ? "เพิ่มน้ำหนักเฉพาะธุรกิจคุณภาพสูงที่ compound ได้จริง และหลีกเลี่ยงการเพิ่มสถานะที่ conviction ต่ำ"
      : decision === "Reduce"
        ? "ลดสถานะที่มีน้ำหนักมากเกินไปจนกว่าหุ้นใหญ่สุดจะต่ำกว่าเกณฑ์ concentration"
        : decision === "Hedge"
          ? "ป้องกันความเสี่ยง beta หรือเพิ่มเงินสด ก่อนรับความเสี่ยงใหม่"
          : decision === "Avoid"
            ? "หยุดเพิ่มความเสี่ยงใหม่ และฟื้นเงินสดสำรองก่อน"
            : "ถือพอร์ตปัจจุบัน และรอให้ valuation หรือ liquidity ให้สัญญาณชัดขึ้น",
    cashMonths < 6 ? "กันกระแสเงินสดใหม่เข้ากองเงินสดสำรองจนกว่าจะเกิน 6 เดือน" : "รักษาเงินสดสำรองไว้เป็น optionality เชิงกลยุทธ์",
    cryptoWeight > 15 ? "คุม BTC DCA ให้สัมพันธ์กับเงินสดสำรองและอย่าเพิ่ม pace ขณะ liquidity ยังไม่ชัด" : intelligence.aiFlag ? "ยังไม่ควรเพิ่มหุ้นกลุ่ม AI จนกว่าน้ำหนักพอร์ตหรือ valuation จะมี margin of safety มากขึ้น" : "ควบคุม AI exposure ให้อยู่ในกรอบ risk budget ที่ตั้งใจไว้",
    macro.regime === "Risk-On"
      ? "ทยอยใช้เงินเป็น tranche และยังต้องมี margin of safety แม้ภาพมาโครสนับสนุน"
      : macro.regime === "Risk-Off"
        ? "ให้ความสำคัญกับการคุม drawdown, hedge ratio และการป้องกัน forced selling"
        : "รักษาวินัย watchlist และรอ confirmation ของมาโครให้ชัดขึ้น",
  ].slice(0, 3);
  const privateBankerNote =
    decision === "Accumulate"
      ? "พอร์ตสามารถเพิ่มความเสี่ยงแบบคัดเลือกได้ แต่ขนาดการลงทุนควรผูกกับคุณภาพกระแสเงินสดและ margin of safety"
      : decision === "Reduce"
        ? "พอร์ตยังลงทุนต่อได้ แต่ตอนนี้การคุม concentration สำคัญกว่า upside ส่วนเพิ่ม"
        : decision === "Hedge"
          ? "ให้รักษาเงินต้นก่อน สภาพมาโครและ drawdown sensitivity บอกว่าควรป้องกันความเสี่ยงก่อนจัดสรรเงินเพิ่ม"
          : decision === "Avoid"
            ? "การตัดสินใจแบบสถาบันคืออดทนรอ การฟื้นสภาพคล่องสำคัญกว่าการไล่หาโอกาส"
            : "คงน้ำหนักพอร์ตปัจจุบัน เงินสดยังเป็น optionality ที่มีค่า จนกว่าความเสี่ยง valuation และ macro จะสอดคล้องกัน";

  return {
    decision,
    confidence,
    agents: [
      {
        name: "Taylor",
        role: "Liquidity / Macroeconomics",
        view:
          macro.regime === "Risk-Off"
            ? "ควรตั้งรับก่อน สภาพคล่องและการ hedge สำคัญกว่าการไล่หาผลตอบแทน"
            : `ภาวะมาโครคือ ${macro.regime}; คะแนนความเสี่ยงพอร์ตคือ ${riskScore} ควรผูกขนาดการลงทุนกับสภาพคล่อง`,
      },
      {
        name: "Michael",
        role: "Long-term BTC Thesis",
        view:
          decision === "Accumulate"
            ? "การซื้อเพิ่มควรเน้นธุรกิจที่มีกระแสเงินสดทนทาน และยังต้องมีวินัยด้าน valuation"
            : "แม้ธุรกิจจะคุณภาพดี ก็ไม่ควรมองข้ามสภาพคล่อง valuation และการคุมขนาดสถานะ",
      },
      {
        name: "Aki",
        role: "Tactical Cycle Analysis",
        view: btc
          ? `BTC อยู่ในช่วง ${btcCycleModel(btc.price, btc.avgCost).phase} การจัดขนาดเชิง tactical ต้องเคารพความผันผวนของพอร์ต`
          : "โครงสร้างตลาดยังเป็นกลาง ควรรอจังหวะและไม่เร่งเพิ่มความเสี่ยง",
      },
    ],
    topRisks,
    actionItems,
    privateBankerNote,
    riskScore,
    macroSensitiveWeight,
    risks: topRisks,
  };
}

function portfolioEngine(snapshot: PortfolioSnapshot | undefined, holdings: Holding[]) {
  if (snapshot?.calculations) {
    return {
      pnl: snapshot.calculations.unrealizedPnl,
      pnlPct: snapshot.calculations.unrealizedPnlPct,
      dividendFlow: snapshot.dividendIncome,
      btcExposure: snapshot.calculations.btcExposure,
      equityExposure: snapshot.calculations.equityExposure,
      cashReservePct: snapshot.calculations.cashReservePct,
      cashReserve: holdings.filter((holding) => holding.assetClass === "Cash").reduce((sum, holding) => sum + holding.value, 0),
      cashReserveMonths: snapshot.cashReserveMonths,
      drawdown: snapshot.calculations.drawdownEstimatePct,
      drawdownAmount: snapshot.calculations.drawdownEstimate,
      concentrationRisk: snapshot.calculations.concentrationRisk,
      largestHoldingWeight: snapshot.calculations.largestHoldingWeight,
      btcValue: holdings
        .filter((holding) => holding.assetClass === "Crypto" || holding.symbol.includes("BTC"))
        .reduce((sum, holding) => sum + holding.value, 0),
    };
  }
  const equity = holdings.filter((holding) => holding.assetClass === "Equity").reduce((sum, holding) => sum + holding.value, 0);
  const crypto = holdings.filter((holding) => holding.assetClass === "Crypto").reduce((sum, holding) => sum + holding.value, 0);
  const cash = holdings.filter((holding) => holding.assetClass === "Cash").reduce((sum, holding) => sum + holding.value, 0);
  const total = snapshot?.totalValue || 0;
  const btc = holdings.find((holding) => holding.assetClass === "Crypto" || holding.symbol.includes("BTC"));
  const drawdown = snapshot?.totalCost ? Math.min(0, ((snapshot.totalValue - snapshot.totalCost) / snapshot.totalCost) * 100) : 0;

  return {
    pnl: snapshot?.unrealizedPnl || 0,
    pnlPct: snapshot?.unrealizedPnlPct || 0,
    dividendFlow: snapshot?.dividendIncome || 0,
    btcExposure: total ? (crypto / total) * 100 : 0,
    equityExposure: total ? (equity / total) * 100 : 0,
    cashReservePct: total ? (cash / total) * 100 : 0,
    cashReserve: cash,
    cashReserveMonths: snapshot?.cashReserveMonths || 0,
    drawdown,
    drawdownAmount: total * (drawdown / 100),
    concentrationRisk: snapshot?.risk.level || "Medium",
    largestHoldingWeight: snapshot?.largestHolding?.weight || 0,
    btcValue: btc?.value || 0,
  };
}

function runScenarios(holdings: Holding[]) {
  const scenarios = [
    {
      name: "BTC -20%",
      shocks: { BTC: -20, MSFT: -2, V: -1, LLY: 0, ORCL: -2, NFLX: -2, ARM: -4, META: -2, NVO: 0, CLPT: -5, JEPQ: -1 },
      volatility: "High",
    },
    {
      name: "BTC -50%",
      shocks: { BTC: -50, MSFT: -5, V: -3, LLY: -1, ORCL: -5, NFLX: -5, ARM: -8, META: -5, NVO: -1, CLPT: -12, JEPQ: -3 },
      volatility: "High",
    },
    {
      name: "Recession",
      shocks: { BTC: -35, MSFT: -24, V: -22, LLY: -8, ORCL: -26, NFLX: -28, ARM: -38, META: -30, NVO: -8, CLPT: -35, JEPQ: -18 },
      volatility: "High",
    },
    {
      name: "Liquidity Crisis",
      shocks: { BTC: -45, MSFT: -28, V: -24, LLY: -10, ORCL: -32, NFLX: -35, ARM: -45, META: -34, NVO: -12, CLPT: -45, JEPQ: -24 },
      volatility: "High",
    },
    {
      name: "Rate Cuts",
      shocks: { BTC: 25, MSFT: 15, V: 8, LLY: 6, ORCL: 14, NFLX: 16, ARM: 22, META: 15, NVO: 6, CLPT: 12, JEPQ: 8 },
      volatility: "Medium",
    },
  ];

  const total = holdings.reduce((sum, holding) => sum + holding.value, 0);
  return scenarios.map((scenario) => {
    const impact = holdings.reduce((sum, holding) => {
      const shock = scenario.shocks[holding.symbol as keyof typeof scenario.shocks] ?? -10;
      return sum + holding.value * (shock / 100);
    }, 0);
    return {
      ...scenario,
      impact,
      impactPct: total ? (impact / total) * 100 : 0,
      downside: Math.min(0, impact),
    };
  });
}

function ClaudyCard({
  children,
  className,
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={cn(
        "rounded-[22px] border border-white/10 bg-white/[0.055] shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Activity;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{title}</h2>
          {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <ClaudyCard className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className={cn("mt-2 text-sm text-slate-400", tone === "positive" && "text-emerald-300", tone === "negative" && "text-red-300")}>
        {sub}
      </p>
    </ClaudyCard>
  );
}

function MobileStatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className={cn("mt-1 text-sm leading-5 text-slate-400", tone === "positive" && "text-emerald-300", tone === "negative" && "text-red-300")}>
        {sub}
      </p>
    </div>
  );
}

function MobileSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-[26px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-white">
        {title}
        <span className="text-sm text-slate-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function MobileBtcTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BtcDcaPerformancePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-[210px] rounded-2xl border border-emerald-400/20 bg-black/95 p-3 text-xs shadow-2xl">
      <p className="font-semibold text-white">{point.date}</p>
      <div className="mt-2 grid gap-1 text-slate-300">
        <span>BTC {formatUSD.format(point.btcPriceUSD)}</span>
        <span>Invested {formatUSD.format(point.dollarsInvested)}</span>
        <span>BTC {point.btcAcquired.toFixed(8)}</span>
        <span>Value {formatUSD.format(point.portfolioValueUSD)}</span>
        <span className={point.unrealizedPnlPct >= 0 ? "text-emerald-300" : "text-red-300"}>
          P/L {point.unrealizedPnlPct >= 0 ? "+" : ""}
          {point.unrealizedPnlPct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function MobilePrivateBankApp({
  snapshot,
  holdings,
  allocation,
  engine,
  committee,
  btcAnalytics,
  liveAt,
  loading,
  onRefresh,
}: {
  snapshot?: PortfolioSnapshot;
  holdings: Holding[];
  allocation: PortfolioSnapshot["allocation"];
  engine: ReturnType<typeof portfolioEngine>;
  committee: ReturnType<typeof buildCommittee>;
  btcAnalytics: ReturnType<typeof buildBtcAnalytics>;
  liveAt: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<MobileTab>("Dashboard");
  const stocksValue = holdings.filter((holding) => holding.assetClass === "Equity" || holding.assetClass === "Fund").reduce((sum, holding) => sum + holding.value, 0);
  const btcHolding = holdings.find((holding) => holding.assetClass === "Crypto" || holding.symbol.includes("BTC"));
  const cashValue = holdings.filter((holding) => holding.assetClass === "Cash").reduce((sum, holding) => sum + holding.value, 0);
  const sortedByPnl = holdings.filter((holding) => holding.assetClass !== "Cash").slice().sort((a, b) => b.unrealizedPnlPct - a.unrealizedPnlPct);
  const topWinner = sortedByPnl[0];
  const topLoser = sortedByPnl[sortedByPnl.length - 1];
  const tabs: Array<{ name: MobileTab; icon: typeof Activity }> = [
    { name: "Dashboard", icon: Home },
    { name: "Portfolio", icon: WalletCards },
    { name: "BTC", icon: Bitcoin },
    { name: "Risk", icon: ShieldCheck },
    { name: "CIO", icon: BrainCircuit },
  ];

  return (
    <div className="xl:hidden">
      <div className="min-h-screen bg-[#05070d] px-4 pb-28 pt-4 text-slate-100">
        <div className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#05070d]/90 px-4 pb-4 pt-2 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">PrivateBank OS</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{formatTHB.format(snapshot?.totalValue || 0)}</p>
              <p className={cn("mt-1 text-sm font-semibold", (snapshot?.unrealizedPnl || 0) >= 0 ? "text-emerald-300" : "text-red-300")}>
                {formatTHB.format(snapshot?.unrealizedPnl || 0)} · {(snapshot?.unrealizedPnlPct || 0) >= 0 ? "+" : ""}
                {(snapshot?.unrealizedPnlPct || 0).toFixed(2)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">Updated {liveAt}</p>
            </div>
            <button
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white text-slate-950"
              onClick={onRefresh}
              type="button"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MobileStatCard label="Net Worth" value={formatTHB.format(snapshot?.totalValue || 0)} sub={`${holdings.length} holdings`} />
          <MobileStatCard label="US Stocks" value={formatTHB.format(stocksValue)} sub={`${engine.equityExposure.toFixed(1)}% equity`} />
          <MobileStatCard label="BTC" value={formatTHB.format(btcHolding?.value || 0)} sub={`${engine.btcExposure.toFixed(1)}% crypto`} tone={engine.btcExposure > 20 ? "negative" : "neutral"} />
          <MobileStatCard label="Cash" value={formatTHB.format(cashValue)} sub={`${engine.cashReservePct.toFixed(1)}% reserve`} />
          <div className="col-span-2">
            <MobileStatCard label="Risk Level" value={snapshot?.risk.level || "Loading"} sub={committee.decision} tone={snapshot?.risk.level === "High" ? "negative" : "neutral"} />
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {tab === "Dashboard" && (
            <>
              <MobileSection title="Allocation">
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                          {allocation.map((item, index) => (
                            <Cell key={item.name} fill={allocationColors[index % allocationColors.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-2">
                    {allocation.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold text-white">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </MobileSection>

              <MobileSection title="Performance">
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">Top Winner</p>
                      <p className="mt-2 text-xl font-semibold text-white">{topWinner?.symbol || "--"}</p>
                      <p className="text-sm text-emerald-300">+{(topWinner?.unrealizedPnlPct || 0).toFixed(2)}%</p>
                    </div>
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-red-200">Top Loser</p>
                      <p className="mt-2 text-xl font-semibold text-white">{topLoser?.symbol || "--"}</p>
                      <p className="text-sm text-red-300">{(topLoser?.unrealizedPnlPct || 0).toFixed(2)}%</p>
                    </div>
                  </div>
                  {holdings.filter((holding) => holding.assetClass !== "Cash").slice(0, 6).map((holding) => (
                    <div key={holding.symbol} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div>
                        <p className="font-semibold text-white">{holding.symbol}</p>
                        <p className="text-xs text-slate-500">{holding.assetClass}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatTHB.format(holding.value)}</p>
                        <p className={cn("text-sm font-semibold", holding.unrealizedPnlPct >= 0 ? "text-emerald-300" : "text-red-300")}>
                          {holding.unrealizedPnlPct >= 0 ? "+" : ""}{holding.unrealizedPnlPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </MobileSection>
            </>
          )}

          {tab === "Portfolio" && (
            <MobileSection title="Portfolio Positions">
              <div className="grid gap-3">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{holding.symbol}</p>
                        <p className="text-sm text-slate-400">{holding.name}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{holding.weight.toFixed(1)}%</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Value</p>
                        <p className="font-semibold text-white">{formatTHB.format(holding.value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">P/L</p>
                        <p className={cn("font-semibold", holding.unrealizedPnlPct >= 0 ? "text-emerald-300" : "text-red-300")}>
                          {holding.unrealizedPnlPct >= 0 ? "+" : ""}{holding.unrealizedPnlPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </MobileSection>
          )}

          {tab === "BTC" && (
            <>
              <MobileSection title="BTC DCA">
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <MobileStatCard label="Holdings" value={`${btcTotals.totalBtcHoldings.toFixed(5)} BTC`} sub={`${btcLedger.length} DCA lots`} />
                  <MobileStatCard label="BTC P/L" value={`${btcTotals.totalUnrealizedPnlPct.toFixed(2)}%`} sub={formatUSD.format(btcTotals.totalMarketValueUSD)} tone="negative" />
                </div>
                <div className="h-[260px] rounded-2xl border border-emerald-400/10 bg-black p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={btcAnalytics.performance} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(34,197,94,0.1)" strokeDasharray="2 8" />
                      <XAxis dataKey="date" hide />
                      <YAxis yAxisId="price" hide domain={["dataMin", "dataMax"]} />
                      <YAxis yAxisId="portfolio" hide orientation="right" />
                      <Tooltip content={<MobileBtcTooltip />} cursor={{ stroke: "rgba(0,255,102,0.45)", strokeDasharray: "4 4" }} />
                      <Line yAxisId="price" dataKey="btcPriceUSD" type="monotone" stroke="#00ff66" strokeWidth={2.5} dot={false} />
                      <Line yAxisId="portfolio" dataKey="portfolioValueUSD" type="monotone" stroke="#ffb020" strokeWidth={2.5} dot={false} />
                      <Line yAxisId="portfolio" dataKey="cumulativeInvestedUSD" type="monotone" stroke="#9ddcff" strokeWidth={2.5} dot={false} />
                      <Scatter yAxisId="price" dataKey="btcPriceUSD" fill="#ffd166" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </MobileSection>
            </>
          )}

          {tab === "Risk" && (
            <MobileSection title="Risk Dashboard">
              <div className="grid gap-3">
                <MobileStatCard label="Drawdown" value={`${engine.drawdown.toFixed(1)}%`} sub={formatTHB.format(engine.drawdownAmount)} tone="negative" />
                <MobileStatCard label="Concentration" value={engine.concentrationRisk} sub={`Largest ${engine.largestHoldingWeight.toFixed(1)}%`} tone={engine.concentrationRisk === "High" ? "negative" : "neutral"} />
                {committee.risks.map((risk) => (
                  <div key={risk} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-300">{risk}</div>
                ))}
              </div>
            </MobileSection>
          )}

          {tab === "CIO" && (
            <MobileSection title="AI Committee">
              <div className="grid gap-3">
                {committee.agents.map((agent) => (
                  <div key={agent.name} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{agent.name}</p>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-slate-300">{agent.role}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{agent.view}</p>
                  </div>
                ))}
                <div className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">CIO Decision</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{committee.decision}</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-100">{committee.privateBankerNote}</p>
                </div>
              </div>
            </MobileSection>
          )}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {tabs.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-slate-500 transition",
                tab === name && "bg-white text-slate-950"
              )}
              onClick={() => setTab(name)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {name}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TradingViewChart({ symbol = "NASDAQ:AAPL" }: { symbol?: string }) {
  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0b1220&studies=[]&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1`;
  return (
    <iframe
      title="TradingView chart"
      src={src}
      className="h-full min-h-[360px] w-full rounded-[18px] border border-white/10 bg-slate-950"
      loading="lazy"
    />
  );
}

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [macroData, setMacroData] = useState<MacroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(marketStatus());
  const [macroInputs, setMacroInputs] = useState<MacroInputs>(defaultMacro);
  const [selectedChart, setSelectedChart] = useState("NASDAQ:MSFT");
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>(defaultTransactionDraft);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  async function loadPortfolio() {
    setLoading(true);
    setError("");
    try {
      const [portfolioResponse, macroResponse] = await Promise.all([
        fetch("/api/portfolio", { cache: "no-store" }),
        fetch("/api/macro", { cache: "no-store" }),
      ]);
      if (!portfolioResponse.ok) throw new Error(`Portfolio request failed: ${portfolioResponse.status}`);
      if (!macroResponse.ok) throw new Error(`Macro request failed: ${macroResponse.status}`);
      const payload = (await portfolioResponse.json()) as PortfolioResponse;
      const macroPayload = (await macroResponse.json()) as MacroResponse;
      setPortfolio(payload);
      setMacroData(macroPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to refresh market data");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function exportPortfolioJson() {
    if (!portfolio?.data) return;
    const payload = JSON.stringify(
      {
        portfolio: portfolio.data,
        btcLedger,
        btcTotals,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `claudyos-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importPortfolioJson(file: File) {
    setLoading(true);
    setError("");
    try {
      const data = JSON.parse(await file.text());
      const portfolioData = data.portfolio || data;
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import-json", data: portfolioData }),
      });
      if (!response.ok) throw new Error(`Import failed: ${response.status}`);
      await loadPortfolio();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import portfolio JSON");
      setLoading(false);
    }
  }

  async function addTransactionFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTransaction(true);
    setError("");
    try {
      const symbol = transactionDraft.symbol.trim().toUpperCase();
      const units = Number(transactionDraft.units);
      const price = Number(transactionDraft.price);
      const fee = Number(transactionDraft.fee || 0);

      if (!symbol) throw new Error("Please enter a ticker or asset symbol.");
      if (!Number.isFinite(units) || units <= 0) throw new Error("Units must be greater than zero.");
      if (!Number.isFinite(price) || price < 0) throw new Error("Price must be zero or greater.");
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Fee must be zero or greater.");

      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-transaction",
          transaction: {
            date: transactionDraft.date || todayISO(),
            purchaseDate: transactionDraft.date || todayISO(),
            type: transactionDraft.type,
            symbol,
            name: transactionDraft.name.trim() || symbol,
            assetClass: transactionDraft.assetClass,
            units,
            price,
            fee,
            currency: transactionDraft.currency,
            accountName: transactionDraft.accountName.trim() || undefined,
            notes: transactionDraft.notes.trim() || undefined,
          },
        }),
      });
      if (!response.ok) throw new Error(`Unable to add transaction: ${response.status}`);
      setTransactionDraft({
        ...defaultTransactionDraft,
        date: todayISO(),
        accountName: transactionDraft.accountName || defaultTransactionDraft.accountName,
      });
      await loadPortfolio();
    } catch (transactionError) {
      setError(transactionError instanceof Error ? transactionError.message : "Unable to add transaction");
    } finally {
      setSavingTransaction(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
    const statusTimer = window.setInterval(() => setStatus(marketStatus()), 15000);
    const refreshTimer = window.setInterval(loadPortfolio, 8000);
    return () => {
      window.clearInterval(statusTimer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const snapshot = portfolio?.snapshot;
  const holdings = useMemo(() => snapshot?.holdings ?? [], [snapshot?.holdings]);
  const macro = useMemo(() => {
    if (macroData?.regime) {
      return {
        score: macroData.regime.score,
        regime: macroData.regime.regime,
        instruction: macroData.regime.interpretation,
      };
    }
    return detectMacroRegime(macroInputs);
  }, [macroData, macroInputs]);
  const committee = useMemo(() => buildCommittee(snapshot, holdings, macro), [snapshot, holdings, macro]);
  const engine = useMemo(() => portfolioEngine(snapshot, holdings), [snapshot, holdings]);
  const intelligence = useMemo(() => buildPortfolioIntelligence(holdings), [holdings]);
  const btcAnalytics = useMemo(() => buildBtcAnalytics(snapshot?.totalValue || 0), [snapshot?.totalValue]);
  const scenarios = useMemo(() => runScenarios(holdings), [holdings]);
  const worstScenario = useMemo(
    () => scenarios.slice().sort((a, b) => a.impactPct - b.impactPct)[0],
    [scenarios]
  );

  const allocation = snapshot?.allocation || [];
  const positionAllocation = holdings.map((holding) => ({
    name: holding.symbol,
    value: holding.weight,
    amount: holding.value,
  }));
  const performance = useMemo(() => {
    const cost = snapshot?.totalCost || 0;
    const value = snapshot?.totalValue || 0;
    return [
      { month: "Cost", portfolio: cost, benchmark: cost },
      { month: "Current", portfolio: value, benchmark: cost * 1.04 },
      { month: "Target", portfolio: value * 1.08, benchmark: cost * 1.06 },
    ];
  }, [snapshot]);
  const cashflowChart = useMemo(
    () => [
      { label: "Income", value: portfolio?.data.cashflow.monthlyIncome || 0 },
      { label: "Expense", value: portfolio?.data.cashflow.monthlyExpense || 0 },
      { label: "Investable", value: snapshot?.investableCashflow || 0 },
    ],
    [portfolio?.data.cashflow, snapshot?.investableCashflow]
  );
  const liveAt = portfolio?.market.lastUpdated
    ? new Date(portfolio.market.lastUpdated).toLocaleTimeString()
    : portfolio?.timestamp
      ? new Date(portfolio.timestamp).toLocaleTimeString()
      : "--";
  const sourceTone =
    portfolio?.market.source === "yahoo" || portfolio?.market.source === "fmp"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";
  const chartExchange: Record<string, string> = {
    V: "NYSE:V",
    LLY: "NYSE:LLY",
    ORCL: "NYSE:ORCL",
    NVO: "NYSE:NVO",
    CLPT: "NASDAQ:CLPT",
    BTC: "BINANCE:BTCUSDT",
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.14),transparent_30%),linear-gradient(180deg,#05070d_0%,#080d18_45%,#03050a_100%)]" />
      <MobilePrivateBankApp
        snapshot={snapshot}
        holdings={holdings}
        allocation={allocation}
        engine={engine}
        committee={committee}
        btcAnalytics={btcAnalytics}
        liveAt={liveAt}
        loading={loading}
        onRefresh={loadPortfolio}
      />
      <div className="hidden min-h-screen xl:grid xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-black/40 p-5 backdrop-blur-xl xl:block">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sm font-bold text-slate-950">CO</div>
            <div>
              <p className="font-semibold text-white">ClaudyOS</p>
              <p className="text-xs text-slate-400">Private Banking Terminal</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-1 text-sm">
            {navItems.map((item, index) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}
                className={cn(
                  "rounded-2xl px-4 py-3 text-slate-400 transition hover:bg-white/[0.07] hover:text-white",
                  index === 0 && "bg-white text-slate-950 hover:bg-white hover:text-slate-950"
                )}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">System</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Market</span>
                <span className={status === "OPEN" ? "text-emerald-300" : "text-slate-300"}>{status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data</span>
                <span className={portfolio?.market.source === "mock" ? "text-amber-300" : "text-emerald-300"}>{portfolio?.market.source || "loading"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Refresh</span>
                <span className="text-slate-300">{liveAt}</span>
              </div>
            </div>
          </div>

          <Button className="mt-6 w-full bg-white text-slate-950 hover:bg-slate-200" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </aside>

        <section className="min-w-0">
          <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
            <motion.header
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-sky-400/30 bg-sky-400/10 text-sky-200">ClaudyOS Terminal</Badge>
                    <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">Real-time portfolio</Badge>
                    <Badge className={sourceTone}>Source: {portfolio?.market.source || "loading"}</Badge>
                    <Badge className="border-white/10 bg-white/[0.06] text-slate-300">Deploy-ready Next.js</Badge>
                  </div>
                  <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Institutional Wealth Command Center
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                    Bloomberg-grade market monitoring with Apple-level polish: portfolio intelligence, macro regime, risk dashboard, AI committee and TradingView charts.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <input
                    ref={importInputRef}
                    className="hidden"
                    type="file"
                    accept="application/json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void importPortfolioJson(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Button className="bg-white text-slate-950 hover:bg-slate-200" onClick={loadPortfolio} disabled={loading}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                    {loading ? "Refreshing..." : "Refresh Market Data"}
                  </Button>
                  <Button className="border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]" onClick={exportPortfolioJson} disabled={!portfolio?.data}>
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button className="border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]" onClick={() => importInputRef.current?.click()} disabled={loading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import JSON
                  </Button>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
                    <Clock3 className="mr-2 inline h-4 w-4 text-sky-300" />
                    {liveAt}
                  </div>
                </div>
              </div>
              {(portfolio?.warning || error) && (
                <div className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", error ? "border-red-400/30 bg-red-400/10 text-red-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100")}>
                  {error || portfolio?.warning}
                </div>
              )}
            </motion.header>

            <section id="watchlist" className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
              <div className="flex items-center gap-5 overflow-x-auto px-5 py-3">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Watchlist</span>
                {(portfolio?.data.watchlist || []).map((symbol) => {
                  const holding = holdings.find((item) => item.symbol === symbol);
                  return (
                    <button
                      key={symbol}
                      className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-left transition hover:border-sky-400/40 hover:bg-sky-400/10"
                      onClick={() => setSelectedChart(chartExchange[symbol] || `NASDAQ:${symbol}`)}
                      type="button"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{symbol}</div>
                        <div className="text-[11px] text-slate-500">{holding?.currentPriceUSD ? formatUSD.format(holding.currentPriceUSD) : holding ? formatTHB.format(holding.price) : "watching"}</div>
                      </div>
                      {holding && (
                        <div className={cn("text-xs font-semibold", holding.unrealizedPnl >= 0 ? "text-emerald-300" : "text-red-300")}>
                          {holding.unrealizedPnlPct >= 0 ? "+" : ""}
                          {holding.unrealizedPnlPct.toFixed(2)}%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section id="add-transaction">
              <ClaudyCard className="p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <SectionTitle icon={Plus} title="Add Transaction" sub="Record buys, sells, cash deposits and withdrawals directly into the portfolio ledger" />
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs leading-5 text-slate-400">
                    New entries recalculate allocation, cash reserve, P/L and risk immediately.
                  </div>
                </div>
                <form className="grid gap-4" onSubmit={addTransactionFromForm}>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Date
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        type="date"
                        value={transactionDraft.date}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, date: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Type
                      <select
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        value={transactionDraft.type}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, type: event.target.value as PortfolioTransaction["type"] })}
                      >
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                        <option value="DIVIDEND">Dividend</option>
                        <option value="DEPOSIT">Deposit</option>
                        <option value="WITHDRAW">Withdraw</option>
                        <option value="FEE">Fee</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Symbol
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        placeholder="MSFT, BTC, CASH"
                        value={transactionDraft.symbol}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, symbol: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:col-span-2">
                      Name
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        placeholder="Microsoft Corporation"
                        value={transactionDraft.name}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, name: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Asset Class
                      <select
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        value={transactionDraft.assetClass}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, assetClass: event.target.value as PortfolioTransaction["assetClass"] })}
                      >
                        <option value="Equity">Equity</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Cash">Cash</option>
                        <option value="Gold">Gold</option>
                        <option value="Fund">Fund</option>
                        <option value="Bond">Bond</option>
                        <option value="Alternative">Alternative</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Units
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        inputMode="decimal"
                        placeholder="10"
                        value={transactionDraft.units}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, units: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Price
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        inputMode="decimal"
                        placeholder="421.06"
                        value={transactionDraft.price}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, price: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Currency
                      <select
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        value={transactionDraft.currency}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, currency: event.target.value as PortfolioTransaction["currency"] })}
                      >
                        <option value="USD">USD</option>
                        <option value="THB">THB</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Fee
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        inputMode="decimal"
                        value={transactionDraft.fee}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, fee: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Account
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        placeholder="DIME"
                        value={transactionDraft.accountName}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, accountName: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:col-span-2 xl:col-span-2">
                      Notes
                      <input
                        className="h-11 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none ring-sky-400/20 focus:ring-4"
                        placeholder="DCA, rebalance, dividend reinvestment"
                        value={transactionDraft.notes}
                        onChange={(event) => setTransactionDraft({ ...transactionDraft, notes: event.target.value })}
                      />
                    </label>
                    <div className="flex items-end">
                      <Button className="h-11 w-full bg-white text-slate-950 hover:bg-slate-200" disabled={savingTransaction || loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {savingTransaction ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </form>
              </ClaudyCard>
            </section>

            <section id="portfolio-overview" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <MetricCard label="Total Portfolio" value={formatTHB.format(snapshot?.totalValue || 0)} sub={`${holdings.length} active holdings`} />
              <MetricCard
                label="Unrealized P/L"
                value={formatTHB.format(snapshot?.unrealizedPnl || 0)}
                sub={`${(snapshot?.unrealizedPnlPct || 0) >= 0 ? "+" : ""}${(snapshot?.unrealizedPnlPct || 0).toFixed(2)}% total return`}
                tone={(snapshot?.unrealizedPnl || 0) >= 0 ? "positive" : "negative"}
              />
              <MetricCard label="Cash Reserve" value={`${(snapshot?.cashReserveMonths || 0).toFixed(1)} mo`} sub="Liquidity coverage" />
              <MetricCard label="Risk Level" value={snapshot?.risk.level || "Loading"} sub={committee.decision} tone={snapshot?.risk.level === "High" ? "negative" : "neutral"} />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio Calculation Engine</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Live Exposure, P/L and Risk Metrics</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Value" value={formatTHB.format(snapshot?.calculations.totalPortfolioValue || snapshot?.totalValue || 0)} sub="Live portfolio value" />
                <MetricCard
                  label="Allocation %"
                  value={`${allocation.length} buckets`}
                  sub={allocation.map((item) => `${item.name} ${item.value.toFixed(0)}%`).join(" · ") || "Waiting for holdings"}
                />
              <MetricCard
                label="P/L Engine"
                value={formatTHB.format(engine.pnl)}
                sub={`${engine.pnlPct >= 0 ? "+" : ""}${engine.pnlPct.toFixed(2)}% live mark`}
                tone={engine.pnl >= 0 ? "positive" : "negative"}
              />
              <MetricCard label="Income Exposure" value={`${intelligence.income.toFixed(1)}%`} sub={formatTHB.format(intelligence.incomeValue)} />
              <MetricCard label="Crypto Exposure" value={`${engine.btcExposure.toFixed(1)}%`} sub={formatTHB.format(engine.btcValue)} tone={engine.btcExposure > 20 ? "negative" : "neutral"} />
                <MetricCard label="Equity Exposure" value={`${engine.equityExposure.toFixed(1)}%`} sub="Public equity beta" />
                <MetricCard label="Cash Reserve %" value={`${engine.cashReservePct.toFixed(1)}%`} sub={`${engine.cashReserveMonths.toFixed(1)} months liquidity`} />
                <MetricCard label="Drawdown Estimate" value={`${engine.drawdown.toFixed(1)}%`} sub={formatTHB.format(engine.drawdownAmount)} tone={engine.drawdown < 0 ? "negative" : "neutral"} />
                <MetricCard
                  label="Concentration Risk"
                  value={engine.concentrationRisk}
                  sub={`Largest position ${engine.largestHoldingWeight.toFixed(1)}%`}
                  tone={engine.concentrationRisk === "High" ? "negative" : "neutral"}
                />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">US Portfolio Intelligence</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Concentration, AI Exposure and Style Balance</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  label="Mega-Cap Tech"
                  value={`${intelligence.megaCapTech.toFixed(1)}%`}
                  sub={intelligence.megaCapTechFlag ? "Overexposure watch" : "Within risk budget"}
                  tone={intelligence.megaCapTechFlag ? "negative" : "neutral"}
                />
                <MetricCard
                  label="AI Exposure"
                  value={`${intelligence.aiExposure.toFixed(1)}%`}
                  sub={intelligence.aiFlag ? "Narrative risk cluster" : "Balanced AI sleeve"}
                  tone={intelligence.aiFlag ? "negative" : "neutral"}
                />
                <MetricCard
                  label="Growth / Defensive"
                  value={`${intelligence.growth.toFixed(0)} / ${intelligence.defensive.toFixed(0)}%`}
                  sub={`${intelligence.growthDefensiveRatio.toFixed(2)}x growth tilt`}
                  tone={intelligence.growthDefensiveRatio > 1.6 ? "negative" : "neutral"}
                />
                <MetricCard
                  label="Unrealized P/L"
                  value={formatTHB.format(engine.pnl)}
                  sub={`${engine.pnlPct >= 0 ? "+" : ""}${engine.pnlPct.toFixed(2)}% across US portfolio`}
                  tone={engine.pnl >= 0 ? "positive" : "negative"}
                />
                <MetricCard
                  label="Macro Sensitivity"
                  value={`${committee.macroSensitiveWeight.toFixed(1)}%`}
                  sub="Equity + crypto liquidity exposure"
                  tone={committee.macroSensitiveWeight > 85 ? "negative" : "neutral"}
                />
              </div>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
              <ClaudyCard className="p-5">
                <SectionTitle icon={LineChart} title="TradingView Chart" sub="Institutional market view" />
                <div className="mb-4 flex flex-wrap gap-2">
                  {["BINANCE:BTCUSDT", "NASDAQ:ARM", "NASDAQ:JEPQ", "NYSE:NVO", "NASDAQ:META", "NYSE:ORCL", "NASDAQ:CLPT", "NASDAQ:NFLX", "NASDAQ:MSFT", "NYSE:V", "NYSE:LLY"].map((symbol) => (
                    <button
                      key={symbol}
                      className={cn(
                        "rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10",
                        selectedChart === symbol && "border-sky-400/40 bg-sky-400/10 text-sky-200"
                      )}
                      onClick={() => setSelectedChart(symbol)}
                      type="button"
                    >
                      {symbol.replace("NASDAQ:", "").replace("NYSE:", "").replace("BINANCE:", "")}
                    </button>
                  ))}
                </div>
                <TradingViewChart symbol={selectedChart} />
              </ClaudyCard>

              <ClaudyCard id="ai-committee" className="p-5">
                <SectionTitle icon={BrainCircuit} title="AI Investment Committee" sub="Taylor, Michael, Aki" />
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-200">CIO Decision Engine</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{committee.decision}</p>
                    </div>
                    <Badge className="border-white/10 bg-white/[0.08] text-slate-200">Confidence: {committee.confidence}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{committee.privateBankerNote}</p>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top 3 Risks</p>
                    <div className="mt-3 grid gap-2">
                      {committee.topRisks.map((risk, index) => (
                        <div key={risk} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">
                          <span className="mt-0.5 text-xs font-semibold text-red-300">0{index + 1}</span>
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top 3 Action Items</p>
                    <div className="mt-3 grid gap-2">
                      {committee.actionItems.map((action, index) => (
                        <div key={action} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm leading-6 text-slate-300">
                          <span className="mt-0.5 text-xs font-semibold text-emerald-300">0{index + 1}</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {committee.agents.map((agent) => (
                    <div key={agent.name} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{agent.name}</p>
                        <span className="text-xs text-slate-500">{agent.role}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{agent.view}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Board Debate</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Taylor คุมความเสี่ยงมาโคร, Michael ตรวจคุณภาพธุรกิจและ valuation, Aki คุมจังหวะและความผันผวน การตัดสินใจสุดท้ายของ CIO ให้ความสำคัญกับสภาพคล่องและ drawdown ก่อน upside
                  </p>
                </div>
              </ClaudyCard>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
              <ClaudyCard id="asset-allocation" className="p-5">
                <SectionTitle icon={WalletCards} title="Asset Allocation" sub="Portfolio exposure map" />
                <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr]">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={positionAllocation} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={3}>
                          {positionAllocation.map((entry, index) => (
                            <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid content-center gap-3">
                    {positionAllocation.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                          {item.name}
                        </span>
                        <span className="font-semibold text-white">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ClaudyCard>

              <ClaudyCard className="p-5">
                <SectionTitle icon={Activity} title="Performance" sub="Cost basis, current value and forward target" />
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performance}>
                      <defs>
                        <linearGradient id="claudyPortfolio" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip formatter={(value) => formatTHB.format(Number(value))} contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }} />
                      <Area dataKey="benchmark" type="monotone" stroke="#64748b" strokeWidth={2} fill="transparent" />
                      <Area dataKey="portfolio" type="monotone" stroke="#38bdf8" strokeWidth={3} fill="url(#claudyPortfolio)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ClaudyCard>
            </section>

            <section>
              <ClaudyCard className="p-5">
                <SectionTitle icon={Gauge} title="Portfolio Heatmap" sub="Position risk, AI sensitivity and style exposure" />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {intelligence.heatmap.map((holding) => (
                    <div
                      key={holding.symbol}
                      className={cn(
                        "rounded-2xl border p-4",
                        holding.riskScore > 18
                          ? "border-red-400/25 bg-red-400/10"
                          : holding.riskScore > 12
                            ? "border-amber-400/25 bg-amber-400/10"
                            : "border-white/10 bg-white/[0.045]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{holding.symbol}</p>
                          <p className="mt-1 text-xs text-slate-500">{holding.sector}</p>
                        </div>
                        <span className={cn("text-xs font-semibold", holding.unrealizedPnl >= 0 ? "text-emerald-300" : "text-red-300")}>
                          {holding.unrealizedPnlPct >= 0 ? "+" : ""}{holding.unrealizedPnlPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-sky-300" style={{ width: `${Math.min(100, holding.weight * 4)}%` }} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                        <span>{holding.weight.toFixed(1)}% weight</span>
                        <span>{holding.aiExposure}% AI</span>
                        <span>{holding.style}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ClaudyCard>
            </section>

            <section>
              <ClaudyCard className="p-5">
                <SectionTitle icon={Globe2} title="Sector Allocation Analysis" sub="Hidden clustering across business drivers" />
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={intelligence.sectorAllocation} dataKey="value" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={3}>
                          {intelligence.sectorAllocation.map((entry, index) => (
                            <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid content-center gap-3">
                    {intelligence.sectorAllocation.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                          {item.name}
                        </span>
                        <span className="font-semibold text-white">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ClaudyCard>
            </section>

            <section>
              <ClaudyCard className="p-5">
                <SectionTitle icon={Bitcoin} title="BTC DCA Analytics Engine" sub="Production ledger: every DCA lot remains independent" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="BTC Holdings" value={`${btcTotals.totalBtcHoldings.toFixed(7)} BTC`} sub={`${btcLedger.length} independent DCA lots`} />
                  <MetricCard label="BTC Allocation" value={`${btcAnalytics.allocationImpact.toFixed(1)}%`} sub={formatTHB.format(btcTotals.totalMarketValueTHB)} />
                  <MetricCard label="Average Cost" value={formatUSD.format(btcTotals.averageBtcCostUSD)} sub={`Current ${formatUSD.format(btcTotals.currentBtcPriceUSD)}`} />
                  <MetricCard
                    label="BTC Unrealized P/L"
                    value={`${btcTotals.totalUnrealizedPnlPct.toFixed(2)}%`}
                    sub={`${formatTHB.format(btcTotals.totalMarketValueTHB - btcTotals.totalInvestedTHB)} total P/L`}
                    tone="negative"
                  />
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">BTC Cost Basis Chart</p>
                    <div className="mt-4 h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={btcAnalytics.timeline}>
                          <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis hide />
                          <Tooltip formatter={(value) => formatUSD.format(Number(value))} contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }} />
                          <Area dataKey="cost" name="Lot Cost" type="monotone" stroke="#f59e0b" fill="rgba(245,158,11,0.12)" strokeWidth={2} />
                          <Area dataKey="market" name="Current BTC Price" type="monotone" stroke="#38bdf8" fill="rgba(56,189,248,0.08)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">BTC Accumulation Timeline</p>
                    <div className="mt-4 h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={btcAnalytics.timeline}>
                          <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }} />
                          <Area dataKey="cumulativeBtc" name="Cumulative BTC" type="monotone" stroke="#22c55e" fill="rgba(34,197,94,0.12)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </ClaudyCard>
            </section>

            <section>
              <ClaudyCard className="p-5">
                <SectionTitle
                  icon={LineChart}
                  title="BTC DCA Performance Chart"
                  sub="Bitbo-style DCA view: spot price, invested capital, portfolio value and every buy point"
                />
                <div
                  className="rounded-2xl border border-emerald-400/15 bg-black p-4 shadow-2xl shadow-black/40"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(34,197,94,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.08) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Production BTC Ledger</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Green tracks BTC purchase-date price. Orange tracks cumulative DCA market value. Blue tracks total capital deployed.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span className="rounded-full border border-[#00ff66]/30 bg-[#00ff66]/10 px-3 py-2 font-semibold text-[#7cff9f] shadow-[0_0_18px_rgba(0,255,102,0.12)]">BTC Price</span>
                      <span className="rounded-full border border-[#ffb020]/30 bg-[#ff9f0a]/10 px-3 py-2 font-semibold text-[#ffc15a] shadow-[0_0_18px_rgba(255,159,10,0.12)]">DCA Value</span>
                      <span className="rounded-full border border-[#9ddcff]/30 bg-[#8bd3ff]/10 px-3 py-2 font-semibold text-[#b7e7ff] shadow-[0_0_18px_rgba(139,211,255,0.12)]">Invested</span>
                    </div>
                  </div>
                  <div className="h-[440px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={btcAnalytics.performance} margin={{ top: 36, right: 18, left: 4, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(34,197,94,0.16)" strokeDasharray="2 6" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          minTickGap={18}
                          tick={{ fill: "#6ee7b7", fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="price"
                          orientation="left"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6ee7b7", fontSize: 11 }}
                          tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                          label={{ value: "BTC Price USD", angle: -90, position: "insideLeft", fill: "#34d399", fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="portfolio"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#bfdbfe", fontSize: 11 }}
                          tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                          label={{ value: "Portfolio Value USD", angle: 90, position: "insideRight", fill: "#93c5fd", fontSize: 11 }}
                        />
                        <Tooltip
                          content={<BtcDcaTooltip />}
                          cursor={{ stroke: "rgba(0,255,102,0.55)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="left"
                          iconType="circle"
                          wrapperStyle={{ color: "#cbd5e1", fontSize: 12, paddingBottom: 16, left: 4, top: 0 }}
                        />
                        <Line
                          yAxisId="price"
                          name="BTC price USD"
                          type="monotone"
                          dataKey="btcPriceUSD"
                          stroke="#00ff66"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, stroke: "#d9ffe5", strokeWidth: 2, fill: "#00ff66" }}
                        />
                        <Line
                          yAxisId="portfolio"
                          name="DCA portfolio value"
                          type="monotone"
                          dataKey="portfolioValueUSD"
                          stroke="#ffb020"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, stroke: "#ffe4ad", strokeWidth: 2, fill: "#ffb020" }}
                        />
                        <Line
                          yAxisId="portfolio"
                          name="Total dollars invested"
                          type="monotone"
                          dataKey="cumulativeInvestedUSD"
                          stroke="#9ddcff"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, stroke: "#e0f5ff", strokeWidth: 2, fill: "#9ddcff" }}
                        />
                        <Scatter
                          yAxisId="price"
                          name="Buy points"
                          dataKey="btcPriceUSD"
                          fill="#ffd166"
                          shape="circle"
                          legendType="circle"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ClaudyCard>
            </section>

            <section>
              <ClaudyCard className="p-5">
                <SectionTitle icon={ShieldCheck} title="BTC Cycle Dashboard" sub="Cycle phase, holding duration and DCA lot heatmap" />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Cycle Phase</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{btcAnalytics.phase}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Cost basis remains above spot. DCA discipline is useful, but liquidity must control sizing.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Profitable Lots</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{btcAnalytics.profitableLots}/{btcLedger.length}</p>
                    <p className="mt-2 text-sm text-slate-400">Best: {btcAnalytics.bestLot?.purchaseDate} {btcAnalytics.bestLot?.unrealizedPnlPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Worst Lot</p>
                    <p className="mt-2 text-2xl font-semibold text-red-300">{btcAnalytics.worstLot?.unrealizedPnlPct.toFixed(1)}%</p>
                    <p className="mt-2 text-sm text-slate-400">{btcAnalytics.worstLot?.purchaseDate} cost {formatUSD.format(btcAnalytics.worstLot?.avgCostUSD || 0)}</p>
                  </div>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[1280px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Date</th>
                        <th className="px-3 py-3 font-semibold">Asset</th>
                        <th className="px-3 py-3 text-right font-semibold">Invested THB</th>
                        <th className="px-3 py-3 text-right font-semibold">Invested USD</th>
                        <th className="px-3 py-3 font-semibold">Avg Cost</th>
                        <th className="px-3 py-3 font-semibold">Entry THB</th>
                        <th className="px-3 py-3 font-semibold">BTC Qty</th>
                        <th className="px-3 py-3 font-semibold">Current THB</th>
                        <th className="px-3 py-3 font-semibold">Current USD</th>
                        <th className="px-3 py-3 text-right font-semibold">Value THB</th>
                        <th className="px-3 py-3 text-right font-semibold">Value USD</th>
                        <th className="px-3 py-3 font-semibold">Duration</th>
                        <th className="px-3 py-3 font-semibold">Phase</th>
                        <th className="px-3 py-3 font-semibold">Allocation Impact</th>
                        <th className="px-3 py-3 text-right font-semibold">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {btcAnalytics.lots.map((entry) => (
                        <tr key={entry.id} className="transition hover:bg-white/[0.035]">
                          <td className="px-3 py-4 text-white">{entry.purchaseDate}</td>
                          <td className="px-3 py-4 font-semibold text-white">{entry.asset}</td>
                          <td className="px-3 py-4 text-right text-slate-300">{formatTHB.format(entry.investedTHB)}</td>
                          <td className="px-3 py-4 text-right text-slate-300">{formatUSD.format(entry.investedUSD)}</td>
                          <td className="px-3 py-4 text-slate-300">{formatUSD.format(entry.avgCostUSD)}</td>
                          <td className="px-3 py-4 text-slate-300">{formatTHB.format(entry.entryPriceTHB)}</td>
                          <td className="px-3 py-4 text-slate-300">{entry.btcQuantity.toFixed(8)}</td>
                          <td className="px-3 py-4 text-slate-300">{formatTHB.format(entry.currentPriceTHB)}</td>
                          <td className="px-3 py-4 text-slate-300">{formatUSD.format(entry.currentPriceUSD)}</td>
                          <td className="px-3 py-4 text-right font-semibold text-white">{formatTHB.format(entry.marketValueTHB)}</td>
                          <td className="px-3 py-4 text-right text-slate-300">{formatUSD.format(entry.marketValueUSD)}</td>
                          <td className="px-3 py-4 text-slate-300">{entry.holdingDuration}</td>
                          <td className="px-3 py-4 text-slate-300">{entry.cyclePhase}</td>
                          <td className="px-3 py-4 text-slate-300">{entry.allocationImpact.toFixed(2)}%</td>
                          <td className={cn("px-3 py-4 text-right font-semibold", entry.unrealizedPnlPct >= 0 ? "text-emerald-300" : "text-red-300")}>
                            {entry.unrealizedPnlPct >= 0 ? "+" : ""}{entry.unrealizedPnlPct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClaudyCard>
            </section>

            <section className="grid gap-6 2xl:grid-cols-3">
              <ClaudyCard id="risk-dashboard" className="p-5">
                <SectionTitle icon={ShieldCheck} title="Risk Dashboard" sub="Survival first" />
                <div className="grid gap-3">
                  {committee.risks.map((risk) => (
                    <div key={risk} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-slate-300">
                      {risk}
                    </div>
                  ))}
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                    Tail risk: AI-linked growth, software and Nasdaq income exposure can correlate during a liquidity shock.
                  </div>
                </div>
              </ClaudyCard>

              <ClaudyCard id="macro-monitor" className="p-5">
                <SectionTitle icon={Globe2} title="Macro Monitor" sub="US10Y, DXY, Fed Funds, CPI, BTC dominance, Fear & Greed" />
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(macroData?.signals || []).map((signal) => (
                      <div key={signal.key} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{signal.label}</p>
                          <span className={cn("text-xs", signal.source === "api" ? "text-emerald-300" : "text-amber-300")}>{signal.source}</span>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {signal.value}
                          {signal.unit || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                  {([
                    ["rates", "Rates", ["Rising", "Stable", "Falling"]],
                    ["dollar", "Dollar", ["Strong", "Neutral", "Weak"]],
                    ["yields", "Yields", ["Rising", "Stable", "Falling"]],
                    ["credit", "Credit", ["Tight", "Normal", "Stress"]],
                    ["liquidity", "Liquidity", ["Expanding", "Neutral", "Contracting"]],
                  ] as const).map(([key, label, values]) => (
                    <label key={key} className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {label}
                      <select
                        className="h-10 rounded-2xl border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none"
                        value={macroInputs[key]}
                        onChange={(event) => setMacroInputs({ ...macroInputs, [key]: event.target.value })}
                      >
                        {values.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Regime</p>
                    <p className="mt-2 text-xl font-semibold text-white">{macro.regime}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{macro.instruction}</p>
                    {macroData?.note && <p className="mt-3 text-xs leading-5 text-slate-500">{macroData.note}</p>}
                  </div>
                </div>
              </ClaudyCard>

              <ClaudyCard id="btc-and-macro-regime" className="p-5">
                <SectionTitle icon={Bitcoin} title="US Equity Factor Regime" sub="AI, healthcare, staples and income balance" />
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">AI Exposure</p>
                    <p className={cn("mt-2 text-xl font-semibold", intelligence.aiFlag ? "text-amber-300" : "text-white")}>{intelligence.aiExposure.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mega-Cap Tech</p>
                    <p className={cn("mt-2 text-xl font-semibold", intelligence.megaCapTechFlag ? "text-amber-300" : "text-white")}>{intelligence.megaCapTech.toFixed(1)}%</p>
                  </div>
                  <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-300">
                    Growth exposure is {intelligence.growth.toFixed(1)}% versus defensive and income exposure at {intelligence.defensive.toFixed(1)}%. Position sizing should assume AI and Nasdaq income can move together under stress.
                  </p>
                </div>
              </ClaudyCard>
            </section>

            <section id="scenario-engine">
              <ClaudyCard className="p-5">
                <SectionTitle icon={FlaskConical} title="Portfolio Stress Test" sub="AI bubble correction, recession, rate cuts and USD weakness" />
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-200">Worst Case</p>
                    <p className="mt-2 text-xl font-semibold text-white">{worstScenario?.name || "Loading"}</p>
                    <p className="mt-1 text-sm text-red-200">{worstScenario ? `${worstScenario.impactPct.toFixed(1)}% impact` : "--"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Concentration Flag</p>
                    <p className={cn("mt-2 text-xl font-semibold", intelligence.concentrationFlag ? "text-amber-300" : "text-emerald-300")}>
                      {intelligence.concentrationFlag ? "Watch" : "Normal"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">AI and mega-cap factors included</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CIO Response</p>
                    <p className="mt-2 text-xl font-semibold text-white">{committee.decision}</p>
                    <p className="mt-1 text-sm text-slate-400">Based on live allocation and macro regime</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Scenario</th>
                        <th className="px-3 py-3 font-semibold">Portfolio Impact</th>
                        <th className="px-3 py-3 font-semibold">Impact %</th>
                        <th className="px-3 py-3 font-semibold">Downside</th>
                        <th className="px-3 py-3 font-semibold">Volatility</th>
                        <th className="px-3 py-3 font-semibold">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {scenarios.map((scenario) => (
                        <tr key={scenario.name} className="transition hover:bg-white/[0.035]">
                          <td className="px-3 py-4 font-semibold text-white">{scenario.name}</td>
                          <td className={cn("px-3 py-4 font-semibold", scenario.impact >= 0 ? "text-emerald-300" : "text-red-300")}>
                            {formatTHB.format(scenario.impact)}
                          </td>
                          <td className={cn("px-3 py-4", scenario.impactPct >= 0 ? "text-emerald-300" : "text-red-300")}>
                            {scenario.impactPct >= 0 ? "+" : ""}{scenario.impactPct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-4 text-slate-300">{formatTHB.format(scenario.downside)}</td>
                          <td className="px-3 py-4 text-slate-300">{scenario.volatility}</td>
                          <td className="px-3 py-4 text-slate-400">
                            {scenario.impact < 0 ? "ให้รักษาเงินต้นและ optionality ของเงินสดเป็นอันดับแรก" : "เป็นกรณี upside แต่ยังต้องคุมขนาดสถานะอย่างมีวินัย"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClaudyCard>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
              <ClaudyCard className="p-5">
                <SectionTitle icon={TrendingUp} title="Unrealized P/L Table" sub="Real DIME holdings, cost basis, market value and account metadata" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1320px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Ticker</th>
                        <th className="px-3 py-3 font-semibold">Company</th>
                        <th className="px-3 py-3 font-semibold">Purchase</th>
                        <th className="px-3 py-3 font-semibold">Qty</th>
                        <th className="px-3 py-3 font-semibold">Avg Cost</th>
                        <th className="px-3 py-3 text-right font-semibold">Invested THB</th>
                        <th className="px-3 py-3 text-right font-semibold">Invested USD</th>
                        <th className="px-3 py-3 font-semibold">Current Price</th>
                        <th className="px-3 py-3 text-right font-semibold">Value THB</th>
                        <th className="px-3 py-3 text-right font-semibold">Value USD</th>
                        <th className="px-3 py-3 font-semibold">Weight</th>
                        <th className="px-3 py-3 font-semibold">Account</th>
                        <th className="px-3 py-3 text-right font-semibold">P/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {holdings.map((holding) => (
                        <tr key={holding.symbol} className="transition hover:bg-white/[0.035]">
                          <td className="px-3 py-4 font-semibold text-white">{holding.symbol}</td>
                          <td className="px-3 py-4">
                            <p className="font-semibold text-white">{holding.name}</p>
                            <p className="text-xs text-slate-500">{holding.symbol} · {holding.assetClass}</p>
                          </td>
                          <td className="px-3 py-4 text-slate-300">{holding.purchaseDate || "-"}</td>
                          <td className="px-3 py-4 text-slate-300">{formatNumber.format(holding.units)}</td>
                          <td className="px-3 py-4 text-slate-300">{formatUSD.format(holding.avgCostUSD || 0)}</td>
                          <td className="px-3 py-4 text-right text-slate-300">{formatTHB.format(holding.costBasis)}</td>
                          <td className="px-3 py-4 text-right text-slate-300">{formatUSD.format(holding.investedUSD || 0)}</td>
                          <td className="px-3 py-4 text-slate-300">{formatUSD.format(holding.currentPriceUSD || 0)}</td>
                          <td className="px-3 py-4 text-right font-semibold text-white">{formatTHB.format(holding.value)}</td>
                          <td className="px-3 py-4 text-right text-slate-300">{formatUSD.format(holding.marketValueUSD || 0)}</td>
                          <td className="px-3 py-4 font-semibold text-white">{holding.weight.toFixed(1)}%</td>
                          <td className="px-3 py-4 text-slate-300">{holding.accountName || "-"}</td>
                          <td className="px-3 py-4 text-right">
                            <p className={cn("font-semibold", holding.unrealizedPnl >= 0 ? "text-emerald-300" : "text-red-300")}>
                              {formatTHB.format(holding.unrealizedPnl)}
                            </p>
                            <p className={cn("text-xs", holding.unrealizedPnlPct >= 0 ? "text-emerald-300" : "text-red-300")}>
                              {holding.unrealizedPnlPct >= 0 ? "+" : ""}{holding.unrealizedPnlPct.toFixed(2)}%
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClaudyCard>

              <ClaudyCard className="p-5">
                <SectionTitle icon={CircleDollarSign} title="Cashflow" sub="Monthly funding capacity" />
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashflowChart}>
                      <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip formatter={(value) => formatTHB.format(Number(value))} contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ClaudyCard>
            </section>

            <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
              <ClaudyCard id="earnings-calendar" className="p-5">
                <SectionTitle icon={CalendarDays} title="Earnings Calendar" sub="Upcoming review checkpoints" />
                <div className="grid gap-3">
                  {earningsCalendar.map((event) => (
                    <div key={event.symbol} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div>
                        <p className="font-semibold text-white">{event.symbol}</p>
                        <p className="text-sm text-slate-500">{event.company} · {event.priority}</p>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <p>{event.date}</p>
                        <p>{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ClaudyCard>

              <ClaudyCard id="cio-notes" className="p-5">
                <SectionTitle icon={Banknote} title="CIO Notes" sub="Private banking memo" />
                <div className="grid gap-4 text-sm leading-7 text-slate-300">
                  <p>
                    ความเสี่ยงของพอร์ตยอมรับได้ก็ต่อเมื่อสภาพคล่องถูกปกป้องก่อน ระบบตัดสินใจปัจจุบันจึงให้น้ำหนักกับความอดทน จนกว่าสภาพคล่องมาโครจะดีขึ้น หรือ valuation เปิด margin of safety ที่ชัดเจน
                  </p>
                  <p>
                    ความเสี่ยงที่ซ่อนอยู่คือ clustering: MSFT, ORCL, ARM, META และ JEPQ อาจเคลื่อนไหวเหมือน exposure เดียวกันที่อ่อนไหวต่อ AI/Nasdaq liquidity ในช่วง stress การจัดสรรเงินใหม่ควรลด fragility หรือเพิ่มความทนทานของกระแสเงินสด
                  </p>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Execution Rule</p>
                    <p className="mt-2 text-white">ขนาดเล็กลง, ทยอยช้าลง, ไม่ใช้ leverage, รักษา optionality</p>
                  </div>
                </div>
              </ClaudyCard>
            </section>

            <footer className="pb-6 text-center text-xs text-slate-600">
              ClaudyOS is deploy-ready for Vercel. API keys stay server-side. Market data source: {portfolio?.market.source || "loading"}.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
