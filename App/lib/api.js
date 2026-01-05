const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Fire-and-forget: Start video analysis without waiting for response
export function startVideoAnalysis(youtubeUrl) {
  // Fire the request but don't wait for it
  fetch(`${API_BASE_URL}/fact-check/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ youtubeUrl }),
  }).catch(err => {
    // Log error but don't throw - analysis runs in background
    console.log('[API] Analysis request sent, processing in background');
  });
}

// Original analyzeVideo (kept for backwards compatibility if needed)
export async function analyzeVideo(youtubeUrl) {
  const response = await fetch(`${API_BASE_URL}/fact-check/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ youtubeUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Polling-friendly: Check if analysis is ready (returns null if not ready, data if ready)
export async function checkAnalysisStatus(videoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/fact-check/history/${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // If not 200, analysis is not ready yet - return null (don't throw)
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Check if we got valid data with status 200
    if (data.status === 200 && data.data) {
      return data;
    }
    
    return null;
  } catch (error) {
    // Network error or other issue - return null to continue polling
    console.log('[API] Polling check failed, will retry:', error.message);
    return null;
  }
}

// Fetch analysis result from history API by video ID (throws on error)
export async function getHistoryByVideoId(videoId) {
  const response = await fetch(`${API_BASE_URL}/fact-check/history/${videoId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function formatDuration(seconds) {
  // Handle undefined, null, NaN, or invalid values
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return null;
  }

  const totalSeconds = Math.floor(Number(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

