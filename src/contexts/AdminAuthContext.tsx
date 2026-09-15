import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import supabase from '../lib/supabase';

interface AdminState {
  isAdmin: boolean;
  loading: boolean;
  email: string | null;
  role: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminState | null>(null);

interface CheckResponse {
  is_admin: boolean;
  role: string | null;
}

interface SessionResponse {
  ok: boolean;
  user?: { id: string; email: string | null };
  role?: string;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // First, ask Supabase whether we have a session at all.
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setIsAdmin(false);
        setEmail(null);
        setRole(null);
        return;
      }

      // Then ask the server to verify the JWT and check admin_users.
      // We never trust the client about admin status — only the backend can
      // decide.
      try {
        const result = await api.get<CheckResponse>('/admin/check');
        setIsAdmin(!!result.is_admin);
        setRole(result.role || null);
        setEmail(session.user?.email ?? null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setIsAdmin(false);
          setEmail(null);
          setRole(null);
          // The session token is invalid — sign out locally so we don't loop.
          await supabase.auth.signOut().catch(() => undefined);
        } else {
          // Network or server failure: fail closed.
          setIsAdmin(false);
          setRole(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(
    async (nextEmail: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: nextEmail,
        password,
      });
      if (error) throw new ApiError(error.message, 401);
      if (!data.session) throw new ApiError('Sign-in failed', 401);

      // Now verify the server sees this user as an admin. We POST the access
      // token so the backend uses its service-role client to look up
      // admin_users — we never trust local state.
      try {
        const result = await api.post<SessionResponse>('/admin/auth', {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (!result.ok) {
          await supabase.auth.signOut();
          throw new ApiError('Admin privileges required', 403);
        }
      } catch (err) {
        await supabase.auth.signOut().catch(() => undefined);
        throw err instanceof ApiError
          ? err
          : new ApiError('Sign-in failed', 401);
      }

      await refresh();
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setEmail(null);
    setRole(null);
  }, []);

  const value = useMemo<AdminState>(
    () => ({ isAdmin, loading, email, role, signIn, signOut, refresh }),
    [isAdmin, loading, email, role, signIn, signOut, refresh]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
