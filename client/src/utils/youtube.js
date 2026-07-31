// export function extractYouTubeId(input) {
//   if (!input || typeof input !== 'string') return null;
//   const trimmed = input.trim();

//   if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

//   const patterns = [
//     /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
//     /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
//     /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
//     /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
//   ];

//   for (const pattern of patterns) {
//     const match = trimmed.match(pattern);
//     if (match) return match[1];
//   }

//   return null;
// }

// export function getYouTubeThumbnail(videoId) {
//   return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
// }

export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

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

export function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Public, keyless oEmbed endpoint - used just to get a display title
// for queued videos. (Not the same as the Data API's relatedToVideoId,
// which Google removed in 2023 - this is a separate, still-supported
// endpoint that only needs a video URL.)
export async function fetchVideoTitle(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`
    );
    if (!res.ok) throw new Error('oEmbed request failed');
    const data = await res.json();
    return data.title || 'YouTube video';
  } catch {
    return 'YouTube video';
  }
}