import { useEffect, useRef } from 'react';

/**
 * Prevents React StrictMode from double-invoking an async fetch.
 * Uses a per-instance ref — no shared cache, no context dependency.
 * When navigating to a new page, a new component instance is created
 * with hasRun=false, so the fetch always runs.
 */
export function useFetchOnce(
  fetchFn: () => Promise<void>,
  deps: React.DependencyList
) {
  const hasRun = useRef(false);

  // The dependency list is intentionally managed by the caller.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    fetchFn();
    // No cleanup — once run for this instance, don't reset
  }, [fetchFn, ...deps]);
}
