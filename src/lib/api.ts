// Tiny typed fetch wrapper for the Vercel API routes.
// All admin calls attach the current Supabase session JWT; the API verifies
// the token server-side and checks admin_users before allowing mutations.

import supabase from './supabase';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiRequest<T>(
  endpoint: string,
  method: Method = 'GET',
  body?: unknown,
  options: { headers?: Record<string, string>; signal?: AbortSignal } = {}
): Promise<T> {
  const auth = await getAuthHeader();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...auth,
    ...(options.headers ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0
    );
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(endpoint: string, signal?: AbortSignal) =>
    apiRequest<T>(endpoint, 'GET', undefined, signal ? { signal } : undefined),
  post: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, 'PUT', body),
  patch: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, 'PATCH', body),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, 'DELETE'),
};

export function buildQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => usp.append(key, String(v)));
    } else {
      usp.append(key, String(value));
    }
  });
  const q = usp.toString();
  return q ? `?${q}` : '';
}
