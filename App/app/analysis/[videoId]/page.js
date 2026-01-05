import { AnalysisClient } from './AnalysisClient';

export const metadata = {
  title: 'Analyzing Video | FactCheckAI',
  description: 'Your video is being analyzed. Please wait...',
};

export default async function AnalysisPage({ params }) {
  const { videoId } = await params;
  return <AnalysisClient videoId={videoId} />;
}

