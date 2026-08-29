declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// ponytail: client-side Meta Pixel event fire-and-forget; no-op if pixel isn't loaded (id not configured)
export function trackPixelEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params);
  }
}
