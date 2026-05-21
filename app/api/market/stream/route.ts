import { NextRequest } from "next/server";
import { fmpGet, mockQuotes, type FmpQuote } from "@/lib/fmp";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols") || "AAPL,BTCUSD";
  const list = symbols
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      async function push() {
        try {
          const quotes = await fmpGet<FmpQuote[]>(`/quote/${list.join(",")}`, 5_000);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ source: "fmp", quotes, timestamp: Date.now() })}\n\n`));
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                source: "mock",
                reason: error instanceof Error ? error.message : "FMP unavailable",
                quotes: mockQuotes(list),
                timestamp: Date.now(),
              })}\n\n`
            )
          );
        }
      }

      push();
      const interval = setInterval(push, 5000);
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
