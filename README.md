# Exchange Rate Tracker

A modern Next.js application for tracking EUR to USD exchange rates with real-time data and beautiful visualizations.

**anderson-sherber** :white_check_mark:

## Features

- **Next.js 14** with TypeScript
- **Real Exchange Rate Data** from Frankfurter API
- **Interactive Charts** with Chart.js
- **In-Memory Caching** for improved performance
- **Retry Logic** with exponential backoff
- **Tailwind CSS** for styling
- **Responsive Design** that works on all devices
- **Date Range Selection** with quick select options
- **Vercel Analytics** for visitor insights and performance tracking

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Deploy to Vercel

1. **Push to GitHub**
2. **Connect to Vercel** at [vercel.com](https://vercel.com)
3. **Import your repository**
4. **Deploy** - Vercel will auto-detect Next.js and configure everything

### Vercel Analytics

Vercel Analytics is automatically enabled for your deployment! View your analytics dashboard at:

```
https://vercel.com/[your-username]/[project-name]/analytics
```

**What you get:**
- 📊 Page view tracking
- 🚀 Real-time visitor insights
- ⚡ Web Vitals monitoring (Core Web Vitals)
- 🌍 Geographic data
- 📱 Device and browser analytics

**No configuration needed** - Analytics start collecting data as soon as your app is deployed to Vercel.

## API Endpoints

### GET /api/health
Health check endpoint.

**Example:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

### GET /api/summary
Get exchange rate summary for a date range.

**Parameters:**
- `start` (required): Start date in YYYY-MM-DD format
- `end` (required): End date in YYYY-MM-DD format
- `mode` (optional): `day` (default) or `none`

**Examples:**

Daily breakdown:
```bash
curl "http://localhost:3000/api/summary?start=2024-01-01&end=2024-01-07&mode=day"
```

Summary only:
```bash
curl "http://localhost:3000/api/summary?start=2024-01-01&end=2024-01-07&mode=none"
```

**Response (mode=day):**
```json
{
  "days": [
    {
      "date": "2024-01-01",
      "rate": 1.1045,
      "pct_change": null
    },
    {
      "date": "2024-01-02",
      "rate": 1.1055,
      "pct_change": 0.09
    }
  ],
  "summary": {
    "start_rate": 1.1045,
    "end_rate": 1.1055,
    "total_pct_change": 0.09,
    "mean_rate": 1.1050
  }
}
```

**Response (mode=none):**
```json
{
  "days": [],
  "summary": {
    "start_rate": 1.1045,
    "end_rate": 1.1055,
    "total_pct_change": 0.09,
    "mean_rate": 1.1050
  }
}
```

## Project Structure

```
├── pages/
│   ├── api/              # API routes
│   │   ├── health.ts     # Health check endpoint
│   │   └── summary.ts    # Exchange rate summary endpoint
│   ├── _app.tsx          # App wrapper
│   └── index.tsx         # Main page with UI
├── components/
│   └── ExchangeRateChart.tsx  # Chart.js visualization
├── lib/
│   ├── cache.ts          # In-memory caching
│   └── exchangeService.ts # Exchange rate business logic
├── styles/
│   └── globals.css       # Global Tailwind styles
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Configuration

The app uses the following environment variables (all optional):

- `FRANK_API_URL` - Frankfurter API URL (default: https://api.frankfurter.dev/v1)
- `CACHE_TTL_SECONDS` - Cache TTL in seconds (default: 60)
- `RETRY_ATTEMPTS` - Number of retry attempts (default: 3)
- `RETRY_BACKOFF` - Retry backoff multiplier (default: 0.5)
- `FALLBACK_FILE` - Path to fallback JSON file (default: data/sample_sk.json)

## Protection Features (GREENLIGHT)

✅ **Retry Logic** - Automatic retry with exponential backoff (3 attempts)
✅ **Caching** - In-memory cache with configurable TTL (60 seconds default)
✅ **Fallback** - Local file fallback when API fails (`data/sample_sk.json`)
✅ **Rate Protection** - Prevents overwhelming the API with cache
✅ **Zero Division Guards** - Safe percentage calculations

## Testing

The project includes Cypress end-to-end tests with automated CI/CD.

### Run Cypress Tests Locally

```bash
# Open Cypress Test Runner
npm run cypress:open

# Run tests headlessly
npm run cypress:run

# Run tests with dev server
npm run test:e2e
```

### Automated Testing (CI/CD)

The project uses GitHub Actions to automatically run Cypress API tests:

- ✅ **On every push** to main branch
- ✅ **On every pull request**

**How it works:**
1. Push your code to GitHub
2. Tests run automatically against local server via GitHub Actions
3. See results in the "Actions" tab on GitHub

**Deploy Only After Tests Pass (Optional):**

Use GitHub Branch Protection to ensure only tested code reaches production:

1. Go to GitHub Settings → Branches → Add rule for `main`
2. Enable "Require status checks to pass before merging"
3. Select the "api-tests" status check
4. PRs cannot merge if tests fail ❌
5. Vercel auto-deploys from main after successful merge ✅

See [docs/DEPLOYMENT_SETUP.md](docs/DEPLOYMENT_SETUP.md) for detailed instructions.

### Test Coverage (API Tests)

**GET /api/health:**
- ✅ Health check returns status ok
- ✅ Rejects non-GET methods

**GET /api/summary:**
- ✅ Returns daily data with mode=day
- ✅ Returns summary only with mode=none
- ✅ Defaults to day mode
- ✅ Validates data structure
- ✅ Calculates percentage changes correctly
- ✅ Calculates mean rate correctly
- ✅ Validates EUR/USD rates are reasonable
- ✅ Error handling (missing params, invalid dates, wrong methods)

**Total: 18 comprehensive API tests**

## Why This Approach Works

- **Standard Next.js** - Vercel's native framework
- **No complex configuration** - Works out of the box
- **TypeScript support** - Full type safety
- **API routes** - Built-in serverless functions
- **Easy deployment** - One-click Vercel deployment
- **Cypress testing** - Comprehensive E2E tests

## License

MIT