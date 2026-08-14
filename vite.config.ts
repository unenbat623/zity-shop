import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Шинэ хувилбар гарахад автоматаар шинэчилнэ — хэрэглэгч хуучин
        // каталог, хуучин үнэ хараад хоцрохоос сэргийлнэ
        registerType: 'autoUpdate',
        includeAssets: ['logo.svg', 'favicon-32.png', 'apple-touch-icon.png'],
        manifest: false, // public/manifest.json-оо ашиглана
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              // Google Fonts — тогтвортой, удаан хадгалж болно
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              // Барааны зураг — эхлээд cache, дэвсгэрт шинэчилнэ
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'product-images',
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              /**
               * Chef API — ҮРГЭЛЖ сүлжээнээс. Нөөц, үнэ, захиалгын төлөв
               * хуучирвал буруу мэдээлэл харуулна. Сүлжээгүй үед л cache-ээс
               * түр үзүүлнэ.
               */
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'chef-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 5 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          /**
           * Vendor кодыг тусад нь салгана.
           *
           * Эдгээр нь апп шинэчлэгдэх бүрт өөрчлөгддөггүй тул browser cache-д
           * удаан үлдэнэ — зөвхөн аппын код дахин татагдана.
           */
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            motion: ['motion'],
          },
        },
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
