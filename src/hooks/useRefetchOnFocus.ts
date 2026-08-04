'use client';

import { useEffect, useRef } from 'react';

/**
 * Re-run fetch when the window gains focus or the tab becomes visible.
 * Use on workflow lists so Create Milestones / Send / Dispatch buttons stay current.
 */
export function useRefetchOnFocus(fetchFn: () => void | Promise<void>, enabled = true) {
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      void fnRef.current();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') run();
    };

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
}
