import { HistoryClient } from './HistoryClient';

export const metadata = {
  title: 'Analysis History',
  description: 'View your past YouTube video fact-check analyses. Access previous reports, trust scores, and claim verifications.',
  openGraph: {
    title: 'Analysis History | FactCheckAI',
    description: 'View your past YouTube video fact-check analyses.',
    url: 'https://factcheck-ai.vercel.app/history',
  },
};

export default function HistoryPage() {
  return <HistoryClient />;
}

