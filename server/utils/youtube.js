// Extracts an 11-character YouTube video ID from a full URL, a short
// youtu.be URL, or a raw ID that was already pasted in.
export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Already looks like a bare video ID.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function isValidYouTubeInput(input) {
  return extractYouTubeId(input) !== null;
}
