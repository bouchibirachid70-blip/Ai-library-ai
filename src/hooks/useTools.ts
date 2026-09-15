import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, buildQuery } from '../lib/api';
import type { PaginatedResponse, Tool } from '../types';

export interface ToolFilters {
  search?: string;
  category?: string;
  pricing?: string;
  featured?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export function useTools(filters: ToolFilters) {
  const [data, setData] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page ?? 1);
  const [perPage, setPerPage] = useState(filters.per_page ?? 12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery({
        search: filters.search,
        category: filters.category,
        pricing: filters.pricing,
        featured: filters.featured ? 'true' : undefined,
        sort: filters.sort,
        page: filters.page ?? page,
        per_page: filters.per_page ?? perPage,
      });
      const res = await api.get<PaginatedResponse<Tool>>(`/tools${query}`, ac.signal);
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
      setPerPage(res.per_page);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.category,
    filters.pricing,
    filters.featured,
    filters.sort,
    filters.page,
    filters.per_page,
  ]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    loading,
    error,
    refetch: fetchData,
  };
}

export function useTool(slug?: string) {
  const [data, setData] = useState<Tool | null>(null);
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
      .get<Tool>(`/tools/slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load tool');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  return { data, loading, error };
}

export async function recordToolClick(toolId: string, referrer?: string): Promise<void> {
  try {
    await api.post('/click', { tool_id: toolId, referrer });
  } catch {
    // Fire-and-forget: click tracking failure must not block navigation.
  }
}
