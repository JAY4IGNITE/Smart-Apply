/**
 * useKeepAlive — pings all three Render backend services every 5 minutes
 * to prevent them from spinning down due to inactivity on the free plan.
 *
 * Uses the /ping endpoint (no auth required) on each service.
 * Runs only when the browser tab is visible to avoid waking a sleeping
 * service immediately after it legitimately went idle.
 */

import { useEffect } from 'react';

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getBackendUrls(): string[] {
  const envVars = [
    import.meta.env.VITE_CORE_API_BASE_URL,
    import.meta.env.VITE_AI_API_BASE_URL,
    import.meta.env.VITE_TOOLS_API_BASE_URL,
    import.meta.env.VITE_API_BASE_URL,
  ];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const url of envVars) {
    if (url && typeof url === 'string') {
      // Strip trailing /api suffix — /ping lives at the service root
      const base = url.replace(/\/api\/?$/, '').replace(/\/$/, '');
      if (base && !seen.has(base)) {
        seen.add(base);
        urls.push(base);
      }
    }
  }

  return urls;
}

async function pingAll(urls: string[]): Promise<void> {
  await Promise.allSettled(
    urls.map((base) =>
      fetch(`${base}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000),
      }).catch(() => {
        // Silently swallow — keep-alive pings must never surface errors to the user
      })
    )
  );
}

export function useKeepAlive(): void {
  useEffect(() => {
    const urls = getBackendUrls();
    if (urls.length === 0) return; // dev / no env vars configured

    // Immediately ping on mount so cold services wake up on first visit
    pingAll(urls);

    const intervalId = setInterval(() => {
      // Only ping while the tab is visible — no point waking backends for idle tabs
      if (document.visibilityState === 'visible') {
        pingAll(urls);
      }
    }, PING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
}
