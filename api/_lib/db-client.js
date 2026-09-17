import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

// Server-only Supabase client. Uses the service-role key, which MUST NEVER be
// exposed to the browser. The URL/anon values are public, so we accept either
// the VITE_-prefixed names (the documented convention) or the legacy
// NEXT_PUBLIC_-prefixed names.
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.error('[db-client] Missing Supabase URL or service-role key on the server.');
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  global: {
    fetch: async (url, options) => {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500) triggerRestore();
      return res;
    },
  },
});

export default supabase;

