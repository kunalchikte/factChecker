# FactCheckAI

AI-powered fact-checking for YouTube videos. Verify claims instantly with detailed analysis and trust scores.

## Features

- 🔍 **Claim Verification** - Each claim in the video is individually analyzed and verified
- ⚡ **Fast Analysis** - Get comprehensive fact-checking results in seconds using advanced AI models
- 📊 **Trust Score** - Receive an overall trust score based on the accuracy of claims
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 💾 **Local History** - All analysis results are saved locally for easy access

## Tech Stack

- **React 19.2.0** - Latest React with improved performance
- **Vite** - Fast build tool and development server
- **React Router v7** - Client-side routing
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

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
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
src/
├── components/          # Reusable UI components
│   ├── Header.jsx       # Navigation header
│   ├── URLInput.jsx     # YouTube URL input form
│   ├── VideoInfo.jsx    # Video thumbnail and details
│   ├── TrustMeter.jsx   # Trust score visualization
│   ├── ClaimCard.jsx    # Individual claim display
│   ├── StatsPanel.jsx   # Accuracy statistics
│   ├── HistoryCard.jsx  # History list item
│   └── Loading.jsx      # Loading state
├── pages/               # Route pages
│   ├── Home.jsx         # Main analysis page
│   ├── History.jsx      # Analysis history
│   └── Result.jsx       # Analysis result details
├── hooks/               # Custom React hooks
│   └── useLocalStorage.js
├── services/            # API and utilities
│   └── api.js
├── context/             # React context providers
│   └── HistoryContext.jsx
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## License

MIT
