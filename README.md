# PrivateBank OS

Next.js investment dashboard for a private banking / family office workflow.

## What It Does

- Portfolio dashboard with institutional UI
- Transaction ledger for BUY, SELL, DIVIDEND, DEPOSIT, WITHDRAW and FEE
- DCA / average cost calculation from multiple lots
- Holdings table with cost basis, market value, unrealized P/L and weight
- Watchlist and market data refresh
- Cashflow controls and investable cashflow
- Risk summary: concentration, liquidity and macro note
- Local passcode login
- Server-side API routes so market API keys are not exposed to the frontend

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

Default passcode:

```text
privatebank
```

## Environment

Create `.env.local`:

```env
FMP_API_KEY=your_financial_modeling_prep_api_key_here
PRIVATEBANK_PASSCODE=privatebank
```

If `FMP_API_KEY` is missing, the app uses mock market data so the dashboard still works.

## Data Storage

Local portfolio data is stored in:

```text
data/privatebank.json
```

This is a practical local database for personal use. For production, migrate this layer to Supabase, PostgreSQL or another managed database.

## Production Path

1. Move `data/privatebank.json` to a real database.
2. Replace local passcode with Supabase Auth, Clerk or NextAuth.
3. Add encrypted backups / CSV export.
4. Deploy to Vercel.
5. Add environment variables in Vercel project settings.

## Important Notes

This project is portfolio operating software, not financial advice. The AI/risk language is designed to support disciplined review: risk first, valuation second, execution last.
