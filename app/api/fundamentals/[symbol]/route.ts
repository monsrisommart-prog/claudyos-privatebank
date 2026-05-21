import { NextResponse } from "next/server";
import { fmpGet, mockDcf, mockStatements, type FmpStatement } from "@/lib/fmp";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ticker = symbol.toUpperCase();

  try {
    const [income, balance, cashflow, dcf] = await Promise.all([
      fmpGet<FmpStatement[]>(`/income-statement/${ticker}?limit=4`, 60 * 60 * 1000),
      fmpGet<FmpStatement[]>(`/balance-sheet-statement/${ticker}?limit=4`, 60 * 60 * 1000),
      fmpGet<FmpStatement[]>(`/cash-flow-statement/${ticker}?limit=4`, 60 * 60 * 1000),
      fmpGet<Array<Record<string, string | number>>>(`/discounted-cash-flow/${ticker}`, 60 * 60 * 1000),
    ]);

    return NextResponse.json({
      source: "fmp",
      statements: { income, balance, cashflow },
      dcf: dcf[0] || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      source: "mock",
      reason: error instanceof Error ? error.message : "FMP unavailable",
      statements: mockStatements(),
      dcf: mockDcf(ticker),
      timestamp: Date.now(),
    });
  }
}
