import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Category } from '../types';

export function useCategories(withCounts = true) {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = () => setTick((n) => n + 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<{ data: Category[] }>(`/categories${withCounts ? '?with_counts=true' : ''}`)
      .then((res) => {
        if (!active) return;
        setData(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [withCounts, tick]);

  return { data, loading, error, refetch };
}

export function useCategoryBySlug(slug?: string) {
  const [data, setData] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<Category>(`/categories/slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load category');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  return { data, loading, error };
}
