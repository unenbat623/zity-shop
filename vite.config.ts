import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      /**
       * Порт нь ТОГТМОЛ байх ёстой.
       *
       * Өмнө нь порт банд байвал Vite чимээгүйхэн дараагийн порт руу шилждэг
       * байсан (3000 → 3003). Тэр үед OAuth-ийн `redirect_to` өөрчлөгдөж,
       * Supabase-ийн зөвшөөрөгдсөн жагсаалтад таарахаа больдог тул нэвтрэлт
       * Site URL (Zity Chef) руу буцаадаг байв. Одоо банд бол алдаа өгч зогсоно.
       */
      port: 3005,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/zity-chef': {
          target: env.VITE_ZITY_CHEF_API_URL || 'http://localhost:3002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/zity-chef/, '/api'),
        },
      },
    },
  };
});
