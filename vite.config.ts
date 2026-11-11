import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// GitHub Pages sirve el proyecto en /<repo>/; en local se usa la raíz.
const base = process.env.GITHUB_PAGES === 'true' ? '/cozy-walks/' : '/';

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['avatar-walker.svg', 'icons/*.svg'],
      manifest: {
        name: 'Cozy Walks',
        short_name: 'CozyWalks',
        description: 'Tu compañero de paseos acogedores - Rutas circulares únicas cada día con avatar en tiempo real',
        theme_color: '#c8754a',
        background_color: '#fdf8f3',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: base,
        start_url: base,
        lang: 'es',
        icons: [
          {
            src: `${base}icons/icon-72.png`,
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-96.png`,
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-128.png`,
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-144.png`,
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-152.png`,
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-384.png`,
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Paseo de 3 km',
            short_name: '3 km',
            description: 'Iniciar un paseo rápido de 3 km',
            url: `${base}?distance=3`,
            icons: [{ src: `${base}icons/icon-96.png`, sizes: '96x96' }],
          },
          {
            name: 'Paseo de 5 km',
            short_name: '5 km',
            description: 'Iniciar un paseo medio de 5 km',
            url: `${base}?distance=5`,
            icons: [{ src: `${base}icons/icon-96.png`, sizes: '96x96' }],
          },
        ],
        categories: ['health', 'lifestyle', 'navigation'],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-maps-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          {
            urlPattern: /^https:\/\/maps\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-maps-static',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-api',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Separar las dependencias pesadas: el login solo necesita React.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('leaflet')) return 'leaflet';
          if (/node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
            return 'react';
          }
          if (id.includes('clsx') || id.includes('tailwind-merge')) return 'utils';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});