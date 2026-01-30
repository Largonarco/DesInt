# Design Intelligence Engine

> "Shazam for Design Systems" — Extract visual identity from any website

A powerful tool that analyzes websites and extracts their design DNA: colors, typography, logos, and brand voice.

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

