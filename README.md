# F&F Tracker

A Flavours & Fragrances sector comparables dashboard — live valuation multiples, historical financials, and segment breakdowns for IFF, Givaudan, Symrise, Kerry, Sensient, Robertet, dsm-firmenich, T. Hasegawa, and Takasago.

Market data (**market cap, P/E, P/S, EV/Revenue, EV/EBITDA**) is fetched live from Yahoo Finance every time the page loads. Everything else (EV/EBIT, EV/NOPAT, historical financials, manually added companies) is stored in your browser's `localStorage` and survives page refreshes.

---

## Quick start (development)

### Prerequisites

- **Node.js ≥ 24** (the Vercel API function targets Node 24)
- **npm ≥ 9**

### 1 — Install dependencies

```bash
npm install
```

### 2 — Start the dev server

```bash
npm run dev
```

The app is served at **http://localhost:5173**.

> **Note:** In dev mode the browser calls `/api/quotes`, which is only available when deployed to Vercel or run via the [Vercel CLI](https://vercel.com/docs/cli) (`vercel dev`). Without it the live-data badge shows **live ✕** — the app still works with the static seed data.

To also run the serverless API locally, install the Vercel CLI and use:

```bash
npx vercel dev
```

This starts both the Vite dev server and the `/api/quotes` serverless function on **http://localhost:3000**.

### 3 — Type-check

```bash
npm run typecheck
```

Runs `tsc --noEmit` for both the browser (`tsconfig.json`) and Node.js API (`tsconfig.node.json`) projects.

### 4 — Production build

```bash
npm run build
```

Runs the type-checker, then bundles the app with Vite. Output goes to `dist/`.

### 5 — Preview the production build

```bash
npm run preview
```

Serves the `dist/` folder locally for a production smoke-test.

---

## Project structure

```
stock-tracker/
├── api/
│   └── quotes.ts          # Vercel serverless function — fetches Yahoo Finance
├── src/
│   ├── components/
│   │   ├── CompanyModal.tsx    # Add/edit company modal form
│   │   ├── FinModal.tsx        # Add/edit financial row modal form
│   │   ├── FinancialsPanel.tsx # "/financials" page display component
│   │   ├── MultiplesPanel.tsx  # "/" page display component
│   │   └── RootLayout.tsx      # App shell: header, nav, DataContext provider
│   ├── context/
│   │   └── DataContext.tsx # React context: companies + financials state
│   ├── data/
│   │   └── defaults.ts     # Static seed data (historical financials, multiples)
│   ├── hooks/
│   │   ├── useQuotes.ts    # Fetches /api/quotes, merges live data onto companies
│   │   └── useStorage.ts   # Generic localStorage hook
│   ├── lib/
│   │   └── utils.ts        # Pure formatting/math/download utilities
│   ├── routes/
│   │   ├── __root.tsx      # Re-exports RootLayout as the TanStack root route
│   │   ├── index.tsx       # Re-exports MultiplesPanel as the "/" route
│   │   └── financials.tsx  # Re-exports FinancialsPanel as the "/financials" route
│   ├── main.tsx            # React entry point
│   ├── router.tsx          # TanStack Router route tree
│   ├── types.ts            # Shared TypeScript interfaces
│   └── index.css           # All styles
├── tsconfig.json           # TypeScript config (browser / src)
├── tsconfig.node.json      # TypeScript config (Node.js / api)
├── vite.config.ts          # Vite + React plugin
└── vercel.json             # Vercel deployment config
```

---

## Debugging in VS Code

A launch configuration is included in `.vscode/launch.json` with three options:

| Configuration | What it does |
|---|---|
| **Dev server (npm run dev)** | Starts `npm run dev` in the integrated terminal |
| **Attach to Chrome (localhost:5173)** | Attaches to an already-running Chrome with remote debugging on port 9222 |
| **Launch Chrome + Dev server** | Launches Chrome pointed at the Vite dev server |
| **Full-stack debug** *(compound)* | Runs the dev server **and** attaches Chrome simultaneously |

To use the Chrome configurations, start Chrome with the `--remote-debugging-port=9222` flag, or use the **Launch Chrome + Dev server** preset which handles this automatically.

---

## Deploying to Vercel

### Via Vercel dashboard (recommended)

1. Push the repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Vercel auto-detects the `vercel.json` settings — no extra config needed.

### Via Vercel CLI

```bash
npx vercel --prod
```

### Environment variables

No environment variables are required. The `/api/quotes` function calls the Yahoo Finance public API without authentication.

---

## Using the app

### Multiples table (`/`)

| Feature | How to use |
|---|---|
| **Segment filter** | Use the dropdown on the left of the toolbar to show only Flavor, Fragrance, Ingredients, or Diversified companies |
| **Sort** | Click any column header, or use the sort dropdown in the toolbar |
| **Add a company** | Click **+ Add company** and fill in the form |
| **Edit / Delete** | Use the **Edit** / **Del** buttons at the end of each row |
| **Live badge** | The `● live` badge in the header indicates market data was fetched successfully from Yahoo Finance; click **↻** to refresh |
| **Export CSV** | Click **Export CSV** in the header to download the current view |
| **Reset** | Click **Reset** to restore all data to the built-in defaults (this clears localStorage) |

Color coding in the multiples columns:
- 🟢 **Green** — value is 15%+ *below* the sector median (cheaper)
- 🔴 **Red** — value is 15%+ *above* the sector median (more expensive)
- (EBITDA margin uses the inverse: green = higher than median)

### Financials table (`/financials`)

| Feature | How to use |
|---|---|
| **Company / Year filter** | Use the dropdowns to narrow results |
| **Annual / Quarterly** | Switch between full-year and per-quarter views |
| **Quarter filter** | When in quarterly mode, filter to a specific quarter (Q1–Q4) |
| **Segment view** | Toggle between "Show segments" (all scopes) and "Consolidated only" |
| **Add financials** | Click **+ Add financials**, pick the company and period, enter P&L figures |
| **Margins** | GP%, EBITDA%, EBIT%, and Net% are auto-calculated from the figures you enter |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Routing | TanStack Router v1 (code-based) |
| Bundler | Vite 8 |
| Language | TypeScript 6 (strict) |
| Market data | [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2) v3 |
| Deployment | Vercel (serverless functions + SPA rewrite) |
| Persistence | Browser `localStorage` |
