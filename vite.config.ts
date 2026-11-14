import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_SUPABASE_URL = 'https://gtuzlggzcmfnvgiwnhhm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_jaiUFjAP6aRiGVGEhJOowQ_K5KGUJxC';

function geminiDevPlugin() {
  return {
    name: 'gemini-dev-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && (req.url.startsWith('/downloads/Programas-CROU-Korhogo.apk') || req.url === '/programas.apk')) {
          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          res.setHeader('Content-Disposition', 'attachment; filename="Programas-CROU-Korhogo.apk"');
        }

        if (req.url === '/api/gemini/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { handleGeminiChat } = await import('./server/geminiService.js');
              const { prompt, history, context } = JSON.parse(body || '{}');
              const text = await handleGeminiChat(prompt, history, context);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/gemini/scan-ticket' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { handleGeminiTicketScan } = await import('./server/geminiService.js');
              const { base64Image } = JSON.parse(body || '{}');
              const result = await handleGeminiTicketScan(base64Image);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return {
    plugins: [react(), geminiDevPlugin()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/jeko': {
          target: 'https://api.jeko.africa',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/jeko/, '/partner_api'),
          headers: {
            'X-API-KEY': 'jeko_76053a559816e40d1db0edcf7976413a7aed85fdcc27cc6aadc0f0de9a9a85ec',
            'X-API-KEY-ID': '32d9d6ef-d182-47bc-82ba-9c92c41510f3'
          }
        }
      }
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      chunkSizeWarningLimit: 2500,
    },
  };
});
