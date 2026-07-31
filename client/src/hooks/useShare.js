import { useCallback, useMemo } from 'react';

export function useShare() {
  const isSupported = useMemo(() => typeof navigator !== 'undefined' && Boolean(navigator.share), []);

  const share = useCallback(
    async ({ title, text, url }) => {
      if (!isSupported) return false;
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch {
        // User cancelled the native share sheet - not an error worth
        // surfacing to them.
        return false;
      }
    },
    [isSupported]
  );

  return { isSupported, share };
}
