import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, buildQuery } from '../lib/api';
import type { Article, PaginatedResponse } from '../types';

export interface ArticleFilters {
  search?: string;
  page?: number;
  per_page?: number;
  includeDrafts?: boolean;
}

export function useArticles(filters: ArticleFilters) {
  const [data, setData] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page ?? 1);
  const [perPage, setPerPage] = useState(filters.per_page ?? 9);
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
        page: filters.page ?? page,
        per_page: filters.per_page ?? perPage,
        include_drafts: filters.includeDrafts ? 'true' : undefined,
      });
      const res = await api.get<PaginatedResponse<Article>>(`/articles${query}`, ac.signal);
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
      setPerPage(res.per_page);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.page, filters.per_page, filters.includeDrafts]);

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

export function useArticle(slug?: string) {
  const [data, setData] = useState<Article | null>(null);
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
      .get<Article>(`/articles/slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Article not found');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  return { data, loading, error };
}
