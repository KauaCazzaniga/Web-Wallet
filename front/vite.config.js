import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Assets estáticos: cache-first, 1 ano
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API de autenticação: nunca cacheia
            urlPattern: /\/api\/auth\//,
            handler: 'NetworkOnly',
          },
          {
            // Dados financeiros: network-first, fallback cache 5 min
            urlPattern: /\/api\/wallet\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-wallet',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // CDN do pdf.js worker
            urlPattern: /cdnjs\.cloudflare\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-cdn',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Não cacheia o sw e o manifest
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        name: 'Waltrix',
        short_name: 'Waltrix',
        description: 'Controle financeiro pessoal',
        theme_color: '#2563eb',
        background_color: '#04101f',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('pdfjs-dist'))                                         return 'vendor-pdf';
          if (id.includes('recharts'))                                           return 'vendor-charts';
          if (id.includes('styled-components') || id.includes('lucide-react'))   return 'vendor-ui';
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.waltrix.com.br',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://www.waltrix.com.br');
            proxyReq.setHeader('Referer', 'https://www.waltrix.com.br/');
          });
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist/legacy/build/pdf'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
