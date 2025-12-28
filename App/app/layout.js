import './globals.css';
import { Header } from '@/components/Header';
import { HistoryProvider } from '@/components/HistoryProvider';

export const metadata = {
  metadataBase: new URL('https://factcheck-ai.vercel.app'),
  title: {
    default: 'FactCheckAI - Verify YouTube Videos Instantly',
    template: '%s | FactCheckAI'
  },
  description: 'AI-powered fact-checking for YouTube videos. Verify claims instantly with detailed analysis, trust scores, and claim-by-claim breakdowns. Free and accurate.',
  keywords: ['fact check', 'youtube', 'video verification', 'AI', 'misinformation', 'fake news', 'claim verification', 'trust score'],
  authors: [{ name: 'FactCheckAI' }],
  creator: 'FactCheckAI',
  publisher: 'FactCheckAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://factcheck-ai.vercel.app',
    siteName: 'FactCheckAI',
    title: 'FactCheckAI - Verify YouTube Videos Instantly',
    description: 'AI-powered fact-checking for YouTube videos. Verify claims instantly with detailed analysis and trust scores.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactCheckAI - AI-powered YouTube Fact Checker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FactCheckAI - Verify YouTube Videos Instantly',
    description: 'AI-powered fact-checking for YouTube videos. Verify claims instantly with detailed analysis and trust scores.',
    images: ['/og-image.png'],
    creator: '@factcheckai',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://factcheck-ai.vercel.app',
  },
};

export const viewport = {
  themeColor: '#0f1419',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <HistoryProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              {children}
            </main>
          </div>
        </HistoryProvider>
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'FactCheckAI',
              description: 'AI-powered fact-checking for YouTube videos',
              url: 'https://factcheck-ai.vercel.app',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'YouTube video fact-checking',
                'AI-powered claim verification',
                'Trust score calculation',
                'Detailed claim breakdowns',
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}

