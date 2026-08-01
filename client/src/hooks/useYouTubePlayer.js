

// import { useEffect, useRef, useState } from 'react';

// let apiPromise = null;

// // The YouTube IFrame API only ever needs to be loaded once per page,
// // even if multiple players are created. This shares a single loading
// // promise across every call to the hook.
// function loadYouTubeApi() {
//   if (window.YT?.Player) return Promise.resolve(window.YT);
//   if (apiPromise) return apiPromise;

//   apiPromise = new Promise((resolve) => {
//     const tag = document.createElement('script');
//     tag.src = 'https://www.youtube.com/iframe_api';
//     window.onYouTubeIframeAPIReady = () => resolve(window.YT);
//     document.head.appendChild(tag);
//   });

//   return apiPromise;
// }

// // Wraps creation/destruction of a single YouTube player instance
// // inside `containerRef`. Returns the live player ref, a `ready` flag,
// // and the YT namespace (for reading YT.PlayerState.* constants).
// // export function useYouTubePlayer({ containerRef, videoId, startTime, showControls, onStateChange, onReady }) {
// export function useYouTubePlayer({ containerRef, videoId, startTime, onStateChange, onReady }) {
//   const playerRef = useRef(null);
//   const [ready, setReady] = useState(false);
//   const [YTNamespace, setYTNamespace] = useState(null);
//   const callbacksRef = useRef({ onStateChange, onReady });
//   callbacksRef.current = { onStateChange, onReady };

//   useEffect(() => {
//     // Don't create the YT.Player until there's an actual video to
//     // show. A player instantiated with no videoId never fully
//     // initializes its internal video-loading machinery, so calling
//     // loadVideoById() on it later is unreliable and can silently
//     // no-op (no visual update, no playback) - which is exactly why
//     // "load" appeared broken until a full page refresh, where the
//     // player got created WITH a real videoId from the start.
//     //
//     // So instead: do nothing until videoId is actually available,
//     // then create the player already pointed at that video. Once
//     // created, later video changes are handled by calling
//     // loadVideoById on this now-"hot" instance from VideoPlayer.jsx.
//     if (!videoId) return;

//     let cancelled = false;

//     loadYouTubeApi().then((YT) => {
//       if (cancelled || !containerRef.current) return;
//       setYTNamespace(YT);

//       playerRef.current = new YT.Player(containerRef.current, {
//         videoId,
       
//         playerVars: {
//   controls: 1,
//   modestbranding: 1,
//   rel: 0,
//   disablekb: 0,
//   fs: 1,
//   start: Math.floor(startTime || 0),
// },


//         events: {
//           onReady: () => {
//             setReady(true);
//             callbacksRef.current.onReady?.(playerRef.current);
//           },
//           onStateChange: (event) => {
//             callbacksRef.current.onStateChange?.(event, playerRef.current);
//           },
//         },
//       });
//     });

//     return () => {
//       cancelled = true;
//       playerRef.current?.destroy?.();
//       playerRef.current = null;
//       setReady(false);
//     };
//     // Intentionally only re-runs when videoId flips from falsy to
//     // truthy (i.e. the very first video the room ever gets). Once the
//     // player exists it is never re-created - further videoId changes
//     // are handled by calling loadVideoById on the existing instance
//     // instead of re-creating the whole iframe (see VideoPlayer.jsx).
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [Boolean(videoId)]);

//   return { playerRef, ready, YT: YTNamespace };
// }


import { useEffect, useRef, useState } from 'react';

let apiPromise = null;

// The YouTube IFrame API only ever needs to be loaded once per page,
// even if multiple players are created. This shares a single loading
// promise across every call to the hook.
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    document.head.appendChild(tag);
  });

  return apiPromise;
}

// Wraps creation/destruction of a single YouTube player instance
// inside `containerRef`. Returns the live player ref, a `ready` flag,
// and the YT namespace (for reading YT.PlayerState.* constants).
// export function useYouTubePlayer({ containerRef, videoId, startTime, showControls, onStateChange, onReady }) {
export function useYouTubePlayer({ containerRef, videoId, startTime, onStateChange, onReady }) {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [YTNamespace, setYTNamespace] = useState(null);
  const callbacksRef = useRef({ onStateChange, onReady });
  callbacksRef.current = { onStateChange, onReady };

  useEffect(() => {
    // Don't create the YT.Player until there's an actual video to
    // show. A player instantiated with no videoId never fully
    // initializes its internal video-loading machinery, so calling
    // loadVideoById() on it later is unreliable and can silently
    // no-op (no visual update, no playback) - which is exactly why
    // "load" appeared broken until a full page refresh, where the
    // player got created WITH a real videoId from the start.
    //
    // So instead: do nothing until videoId is actually available,
    // then create the player already pointed at that video. Once
    // created, later video changes are handled by calling
    // loadVideoById on this now-"hot" instance from VideoPlayer.jsx.
    if (!videoId) return;

    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      setYTNamespace(YT);

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,

        // controls stays 0 for everyone: the app renders its own
        // play/pause/seek bar (see CustomControls.jsx). YouTube's
        // native control bar is what surfaces the "More videos"
        // suggested-video overlay, and that overlay is real
        // youtube.com content rendered cross-origin inside the
        // iframe - clicks on it can never be intercepted or made to
        // load in-place from our side, they always break out into a
        // new tab. Turning native controls off removes the only
        // trigger for that overlay to appear at all.
        playerVars: {
          enablejsapi: 1,
  origin: window.location.origin,

          controls: 0,
          modestbranding: 1,
          rel: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          start: Math.floor(startTime || 0),
        },
        events: {
          onReady: () => {
            setReady(true);
            callbacksRef.current.onReady?.(playerRef.current);
          },
          onStateChange: (event) => {
            callbacksRef.current.onStateChange?.(event, playerRef.current);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      setReady(false);
    };
    // Intentionally only re-runs when videoId flips from falsy to
    // truthy (i.e. the very first video the room ever gets). Once the
    // player exists it is never re-created - further videoId changes
    // are handled by calling loadVideoById on the existing instance
    // instead of re-creating the whole iframe (see VideoPlayer.jsx).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(videoId)]);

  return { playerRef, ready, YT: YTNamespace };
}