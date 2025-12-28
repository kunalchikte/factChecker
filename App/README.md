# FactCheckAI

AI-powered fact-checking for YouTube videos. Verify claims instantly with detailed analysis and trust scores.

🔗 **Live Demo**: [factcheck-ai.vercel.app](https://factcheck-ai.vercel.app)

## Features

- 🔍 **Claim Verification** - Each claim in the video is individually analyzed and verified
- ⚡ **Fast Analysis** - Get comprehensive fact-checking results in seconds using advanced AI models
- 📊 **Trust Score** - Receive an overall trust score based on the accuracy of claims
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 💾 **Local History** - All analysis results are saved locally for easy access
- 🔗 **Social Sharing** - Share results on Facebook, LinkedIn, and Twitter/X

## SEO Optimizations

This app is built with **Next.js 15** for optimal SEO:

- ✅ **Server-Side Rendering (SSR)** - Pages are pre-rendered for better indexing
- ✅ **Dynamic Metadata** - Each page has unique titles, descriptions, and Open Graph tags
- ✅ **Structured Data** - Schema.org markup for WebApplication and ClaimReview
- ✅ **Sitemap** - Auto-generated sitemap.xml for search engine discovery
- ✅ **Robots.txt** - Properly configured for crawler access
- ✅ **Semantic HTML** - Proper heading hierarchy and ARIA labels
- ✅ **Performance** - Optimized images, fonts, and code splitting

## Tech Stack

- **Next.js 15.5** - Latest App Router with React Server Components
- **React 19** - Latest React with improved performance
- **Lucide React** - Beautiful icons
- **CSS Variables** - Theming and dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## API Integration

The app integrates with a fact-checking API:

**Endpoint:** `POST http://localhost:3000/fact-check/analyze`

**Request:**
```json
{
  "youtubeUrl": "https://youtu.be/VIDEO_ID"
}
```

**Response:**
```json
{
  "status": 200,
  "msg": "Video fact-checked successfully",
  "data": {
    "video": {
      "id": "VIDEO_ID",
      "url": "...",
      "title": "...",
      "topic": "...",
      "durationSeconds": 123
    },
    "summary": "...",
    "factCheck": {
      "totalClaims": 10,
      "correctClaims": [...],
      "incorrectClaims": [...],
      "speculativeClaims": [...],
      "correctPercentage": 90,
      "incorrectPercentage": 0,
      "speculativePercentage": 10
    },
    "trust": {
      "score": 90,
      "level": "HIGH"
    },
    "analysisNote": "...",
    "processingTime": "30.83s"
  }
}
```

## Project Structure

```
app/
├── layout.js            # Root layout with metadata & SEO
├── page.js              # Home page (SSR)
├── HomeClient.jsx       # Client component for home
├── Home.css
├── globals.css          # Global styles
├── robots.js            # Robots.txt generation
├── sitemap.js           # Sitemap generation
├── history/
│   ├── page.js          # History page (SSR)
│   ├── HistoryClient.jsx
│   └── History.css
└── result/[id]/
    ├── page.js          # Dynamic result page (SSR)
    ├── ResultClient.jsx
    └── Result.css

components/
├── Header.jsx           # Navigation header
├── URLInput.jsx         # YouTube URL input form
├── VideoInfo.jsx        # Video thumbnail and details
├── TrustMeter.jsx       # Trust score visualization
├── ClaimCard.jsx        # Individual claim display
├── StatsPanel.jsx       # Accuracy statistics
├── HistoryCard.jsx      # History list item
├── HistoryProvider.jsx  # History context (client)
├── Loading.jsx          # Loading state
└── *.css                # Component styles

lib/
└── api.js               # API utilities

public/
└── manifest.json        # PWA manifest
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

For production, update these in your deployment:

- `NEXT_PUBLIC_API_URL` - Your fact-check API endpoint
- Update `metadataBase` in `app/layout.js` with your domain

## License

MIT
