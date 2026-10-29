import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const apiServerPlugin = (): Plugin => ({
  name: 'aws-ai-api-server',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api')) {
        try {
          const { apiApp } = await import('./server/api.ts');
          apiApp(req as any, res as any, next);
          return;
        } catch (err) {
          console.error('API middleware error:', err);
          next(err);
          return;
        }
      }
      next();
    });
  },
});

// Sandbox-only: the Base44 preview proxy reaches the dev server through its public
// host, which Vite blocks unless it is in server.allowedHosts. With
// BASE44_PREVIEW_MODE unset, Vite's default host checks apply unchanged.
const previewAllowedHosts = (): string[] | undefined => {
  if (process.env.BASE44_PREVIEW_MODE !== '1') return undefined;

  const hosts = (process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  if (process.env.BASE44_PUBLIC_HOST_SUFFIX) {
    hosts.push(`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`);
  }
  if (process.env.BASE44_SANDBOX_HOST_DOMAIN) {
    hosts.push(`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`);
  }

  return hosts;
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: previewAllowedHosts(),
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
