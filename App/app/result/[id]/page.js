import { ResultClient } from './ResultClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  return {
    title: 'Fact-Check Analysis Result',
    description: 'View the detailed fact-check analysis including claim verification, trust score, and evidence for each claim.',
    openGraph: {
      title: 'Fact-Check Analysis Result | FactCheckAI',
      description: 'View the detailed fact-check analysis including claim verification, trust score, and evidence.',
      url: `https://factcheck-ai.vercel.app/result/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Fact-Check Analysis Result | FactCheckAI',
      description: 'View the detailed fact-check analysis including claim verification, trust score, and evidence.',
    },
  };
}

export default async function ResultPage({ params }) {
  const { id } = await params;
  return <ResultClient id={id} />;
}

