import { HomeClient } from './HomeClient';

export const metadata = {
  title: 'FactCheckAI - Verify YouTube Videos Instantly',
  description: 'AI-powered fact-checking for YouTube videos. Paste any YouTube URL and get instant claim verification, trust scores, and detailed analysis. Free to use.',
  keywords: ['fact check youtube', 'video verification', 'AI fact checker', 'youtube claim verification', 'misinformation detection'],
  openGraph: {
    title: 'FactCheckAI - Verify YouTube Videos Instantly',
    description: 'AI-powered fact-checking for YouTube videos. Get instant claim verification and trust scores.',
    url: 'https://factcheck-ai.vercel.app',
  },
};

export default function HomePage() {
  return <HomeClient />;
}

