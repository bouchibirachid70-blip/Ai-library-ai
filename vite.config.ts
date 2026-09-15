import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const plugins = [react(), tailwindcss()];
  // The source-tag plugin injects data-source-loc attributes for the local
  // element picker. It is a DEVELOPMENT-ONLY aid and must never ship to
  // production (it bloats the bundle and leaks source paths). It is also
  // gitignored, so it only exists in local dev workspaces.
  if (command === 'serve') {
    try {
      // @ts-ignore
      const m = await import('./.vite-source-tags.js');
      plugins.push(m.sourceTags());
    } catch {}
  }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
