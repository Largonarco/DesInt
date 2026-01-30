# Design Intelligence Engine

> "Shazam for Design Systems" — Extract visual identity from any website

A powerful tool that analyzes websites and extracts their design DNA: colors, typography, logos, and brand voice.

![Design Intelligence Engine](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Smart Color Detection**: Identifies primary, secondary, and background colors by analyzing buttons, links, SVGs, and visual hierarchy
- **Typography Analysis**: Extracts heading and body fonts with weights
- **Logo Extraction**: Finds the highest quality logo (prefers SVG)
- **AI Brand Analysis**: Uses LLM to analyze tone of voice, target audience, and brand vibe
- **Beautiful Dashboard**: Modern, dark-themed UI to view results
- **Scan History**: Save and revisit previous scans

## Quick Start (Local Development)

```bash
# Clone the repository
git clone <your-repo-url>
cd design-intelligence-engine

# Install all dependencies
npm install
cd client && npm install && cd ..

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Deploy to Railway

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Manual Deployment

#### Step 1: Create a Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easy repo connection)

#### Step 2: Push Your Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Design Intelligence Engine"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/design-intelligence-engine.git
git branch -M main
git push -u origin main
```

#### Step 3: Deploy on Railway
1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `design-intelligence-engine` repository
5. Railway will automatically detect the Dockerfile and start building

#### Step 4: Configure Environment Variables
In your Railway project dashboard:
1. Go to **Variables** tab
2. Add the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | Your OpenAI API key for AI-powered brand analysis |
| `PORT` | Auto-set | Railway sets this automatically |
| `NODE_ENV` | Auto-set | Set to `production` automatically |

#### Step 5: Generate a Domain
1. Go to **Settings** tab in your Railway service
2. Click **"Generate Domain"** under Networking
3. Your app will be available at `https://your-app.up.railway.app`

### Deployment Notes

- **Build Time**: First deployment takes ~5-10 minutes (Puppeteer + Chromium)
- **Memory**: Recommended 512MB+ RAM for Puppeteer
- **Storage**: SQLite database is ephemeral on Railway. For persistent storage, consider using Railway's PostgreSQL or external database.

## Configuration

### OpenAI API Key (Optional)

For AI-powered brand voice analysis, set your OpenAI API key:

```bash
# Local development
export OPENAI_API_KEY=your-api-key-here
npm run dev
```

Without the API key, the tool will use heuristic-based analysis (still works, just less detailed).

## Architecture

```
├── server/
│   ├── index.js        # Express API server
│   ├── scraper.js      # Puppeteer-based design extractor
│   ├── analyzer.js     # LLM tone analyzer
│   └── database.js     # SQLite persistence
├── client/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── Scanner.jsx      # URL input & scanning UI
│           ├── Results.jsx      # Design system display
│           ├── HistoryView.jsx  # Saved scans list
│           └── ScanDetail.jsx   # Individual scan view
├── Dockerfile          # Production container config
├── railway.json        # Railway deployment config
└── data/
    └── scans.db        # SQLite database (auto-created)
```

## How It Works

### Color Extraction Logic

The challenge with color extraction is that every website has hundreds of colors in CSS. We need to find the *meaningful* ones.

**Strategy:**
1. **Buttons & CTAs** → Primary color (highest weight)
2. **SVG colors in header** → Brand colors from logo (very high weight)
3. **Links** → Secondary/accent color
4. **Large sections** → Background colors
5. **Text elements** → Text colors

We use a weighted scoring system:
- Colors in buttons score 100+ points
- SVG colors in headers score 150+ points (logos!)
- Vibrant/saturated colors get bonus points
- Neutral/dark colors are deprioritized for "primary" designation

### Typography Detection

We analyze computed styles (not just CSS declarations) to find:
- Heading fonts (h1-h6 elements)
- Body fonts (p, span, li with 12-24px size)
- Font weights in use

### Logo Detection

Priority order:
1. SVG in header/nav with "logo" keyword
2. PNG/image in header with "logo" in class/id/alt/src
3. Favicon as fallback

### Brand Voice Analysis

Uses GPT-4o-mini to analyze:
- Hero headline and tagline
- Meta description
- Color psychology

Returns: tone, audience, vibe, personality, summary

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Scan a website |
| GET | `/api/scans` | Get scan history |
| GET | `/api/scans/:id` | Get specific scan |
| DELETE | `/api/scans/:id` | Delete a scan |
| GET | `/api/health` | Health check |

## Example Output

```json
{
  "url": "https://adopt.ai",
  "colors": {
    "primary": "#ff5000",
    "secondary": "#191b20",
    "background": "#ffffff",
    "text": "#000000"
  },
  "typography": {
    "heading": { "family": "system-ui", "weights": ["400", "600"] },
    "body": { "family": "system-ui", "weights": ["400", "500"] }
  },
  "logo": {
    "url": "https://adopt.ai/logo.svg",
    "format": "svg"
  },
  "tone": {
    "tone": "Innovative",
    "audience": "Tech-Forward Teams",
    "vibe": "Modern",
    "summary": "A modern digital presence focused on clear communication"
  }
}
```

## Tech Stack

- **Backend**: Node.js, Express, Puppeteer, better-sqlite3
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Docker, Railway

## Why These Choices?

**Puppeteer over Cheerio/Axios:**
- We need *computed* styles, not just CSS files
- Sites use CSS variables, Tailwind, inline styles
- Puppeteer renders like a real browser

**SQLite over PostgreSQL:**
- Zero configuration
- Perfect for single-user tool
- Fast enough for this use case

**Tailwind CSS:**
- Rapid UI development
- Consistent design system
- Dark mode built-in

## Troubleshooting

### Railway Deployment Issues

**Build fails with Puppeteer errors:**
- Make sure you're using the Dockerfile (not Nixpacks)
- The Dockerfile uses the official Puppeteer image with Chrome pre-installed

**App crashes on startup:**
- Check the logs in Railway dashboard
- Ensure PORT environment variable is not manually set (Railway sets it)

**Scans timeout:**
- Some websites block headless browsers
- Try increasing timeout in scraper.js

### Local Development Issues

**Puppeteer won't launch:**
```bash
# On macOS, you might need:
brew install chromium
```

**Port already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

## License

MIT

---

Built with care for design-obsessed developers.
