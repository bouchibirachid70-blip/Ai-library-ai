// Fetches every ACTIVE ad slot once per page load and caches the promise, so
// N <AdSlot/> components on one page cost a single network request instead
// of N. Each component just filters the shared list by its own `position`.

import { api } from './api';
import type { AdSlot } from '../types';

let cache: Promise<AdSlot[]> | null = null;

export function fetchActiveAdSlots(): Promise<AdSlot[]> {
  if (!cache) {
    cache = api
      .get<{ data: AdSlot[] }>('/ad-slots')
      .then((res) => res.data || [])
      .catch(() => []);
  }
  return cache;
}

// Admin mutations call this after create/update/delete so the next page
// view re-fetches instead of serving a stale cached list.
export function invalidateAdSlotsCache(): void {
  cache = null;
}
